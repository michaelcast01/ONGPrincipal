import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import {
  filterBySource,
  newListPayload,
  normalizeNewEntrega,
  normalizeOldEntrega,
  oldListPayload,
  paginationFromQuery,
  rawExternalId,
  toOldEntregaBody
} from '../services/externalAdapters.js';
import { getSourceToken, preferredSource, requestExternal, sourceOrder } from '../services/externalApi.js';

const router = Router();

router.use(optionalAuth);

function oldQuery(query) {
  const { limit, page } = paginationFromQuery(query);
  return {
    page,
    limit,
    q: query.q,
    cityId: rawExternalId(query.cityId),
    populationTypeId: query.populationTypeId,
    helpTypeId: rawExternalId(query.helpTypeId)
  };
}

function sourceFromOrigin(value, fallback) {
  if (value === 'ayudas_sociales') return 'old';
  if (value === 'ong_operativa') return 'new';
  return fallback;
}

function sourcesForRequest(req, primary) {
  return req.query.source ? [primary] : sourceOrder(primary);
}

function hasResults(list) {
  return (list.data || []).length > 0 && Number(list.total || list.data.length || 0) > 0;
}

router.get('/', async (req, res, next) => {
  try {
    const { limit } = paginationFromQuery(req.query);
    let rows = [];
    let total = 0;
    let lastError = null;
    const primary = sourceFromOrigin(req.query.source, preferredSource(req));
    let usedSource = null;
    let fallbackReason = null;
    let emptyResult = null;

    for (const source of sourcesForRequest(req, primary)) {
      if (source === 'old') {
        try {
          const payload = await requestExternal('old', '/entregas', { query: oldQuery(req.query) });
          const list = oldListPayload(payload);
          if (!hasResults(list)) {
            emptyResult = { source, rows: [], total: 0 };
            if (source === primary) fallbackReason = 'empty_results';
            continue;
          }

          rows = list.data.map(normalizeOldEntrega);
          total = list.total;
          usedSource = source;
          break;
        } catch (error) {
          lastError = error;
          if (source === primary) fallbackReason = 'primary_error';
        }
      }

      if (source === 'new') {
        const token = getSourceToken(req, 'new');
        if (token) {
          try {
            const payload = await requestExternal('new', '/records/entrega_encabezado', {
              token,
              query: { page: 1, pageSize: limit, q: req.query.q, sortField: 'id', sortDirection: 'DESC' }
            });
            const list = newListPayload(payload);
            if (!hasResults(list)) {
              emptyResult = { source, rows: [], total: 0 };
              if (source === primary) fallbackReason = 'empty_results';
              continue;
            }

            rows = list.data.map(normalizeNewEntrega);
            total = list.total;
            usedSource = source;
            break;
          } catch (error) {
            lastError = error;
            if (source === primary) fallbackReason = 'primary_error';
          }
        } else {
          lastError = new Error('Token de la API nueva no disponible');
          if (source === primary) fallbackReason = 'primary_error';
        }
      }
    }

    const filtered = filterBySource(rows, req.query.source);
    if (filtered.length === 0 && total === 0 && lastError && !emptyResult) throw lastError;
    const source = usedSource || emptyResult?.source || primary;
    res.json({
      rows: filtered,
      total: total || filtered.length,
      source,
      requestedSource: primary,
      fallbackUsed: source !== primary,
      fallbackReason: source !== primary ? fallbackReason : null
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const primary = preferredSource(req);
    let lastError = null;
    let fallbackReason = null;

    for (const source of sourceOrder(primary)) {
      try {
        if (source === 'old') {
          const payload = await requestExternal('old', `/entregas/${rawExternalId(req.params.id)}`);
          return res.json({
            row: normalizeOldEntrega(payload),
            source,
            requestedSource: primary,
            fallbackUsed: source !== primary,
            fallbackReason: source !== primary ? fallbackReason : null
          });
        }

        const token = getSourceToken(req, 'new');
        if (token) {
          const payload = await requestExternal('new', `/records/entrega_encabezado/${rawExternalId(req.params.id)}`, {
            token
          });
          return res.json({
            row: normalizeNewEntrega(payload),
            source,
            requestedSource: primary,
            fallbackUsed: source !== primary,
            fallbackReason: source !== primary ? fallbackReason : null
          });
        }
        if (source === primary) fallbackReason = 'primary_error';
      } catch (error) {
        lastError = error;
        if (source === primary) fallbackReason = error.status === 404 ? 'not_found' : 'primary_error';
      }
    }

    if (lastError?.status && lastError.status !== 404) throw lastError;
    res.status(404).json({ error: 'Entrega no encontrada' });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', '/entregas', {
      method: 'POST',
      token,
      body: toOldEntregaBody(req.body || {})
    });
    res.status(201).json({ id: payload?.id_entrega || payload?.id, payload });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', `/entregas/${rawExternalId(req.params.id)}`, {
      method: 'PUT',
      token,
      body: toOldEntregaBody(req.body || {})
    });
    res.json({ ok: true, payload });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    await requestExternal('old', `/entregas/${rawExternalId(req.params.id)}`, { method: 'DELETE', token });
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

export default router;
