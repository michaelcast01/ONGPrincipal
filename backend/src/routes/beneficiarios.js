import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import {
  filterBySource,
  newListPayload,
  normalizeNewBeneficiario,
  normalizeOldBeneficiario,
  oldListPayload,
  paginationFromQuery,
  rawExternalId,
  toOldBeneficiarioBody
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

async function requestNewBeneficiarios(req, limit) {
  const token = getSourceToken(req, 'new');
  if (!token) throw new Error('Token de la API nueva no disponible');

  if (req.query.q) {
    try {
      return await requestExternal('new', '/search/execute', {
        method: 'POST',
        token,
        query: { page: 1, pageSize: limit },
        body: {
          primaryTable: 'beneficiario',
          filters: [{ field: 'primer_nombre', operator: 'ILIKE', value: req.query.q }],
          fields: [
            'id',
            'tipo_documento',
            'numero_documento',
            'primer_nombre',
            'segundo_nombre',
            'primer_apellido',
            'segundo_apellido',
            'telefono',
            'correo'
          ],
          orderBy: [{ field: 'id', direction: 'ASC' }]
        }
      });
    } catch (_error) {
      // Si search no conoce algun campo, se intenta records como respaldo de la misma API nueva.
    }
  }

  return requestExternal('new', '/records/beneficiario', {
    token,
    query: { page: 1, pageSize: limit, q: req.query.q, sortField: 'id', sortDirection: 'ASC' }
  });
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
          const payload = await requestExternal('old', '/beneficiarios', { query: oldQuery(req.query) });
          const list = oldListPayload(payload);
          if (!hasResults(list)) {
            emptyResult = { source, rows: [], total: 0 };
            if (source === primary) fallbackReason = 'empty_results';
            continue;
          }

          rows = list.data.map(normalizeOldBeneficiario);
          total = list.total;
          usedSource = source;
          break;
        } catch (error) {
          lastError = error;
          if (source === primary) fallbackReason = 'primary_error';
        }
      }

      if (source === 'new') {
        try {
          const payload = await requestNewBeneficiarios(req, limit);
          const list = newListPayload(payload);
          if (!hasResults(list)) {
            emptyResult = { source, rows: [], total: 0 };
            if (source === primary) fallbackReason = 'empty_results';
            continue;
          }

          rows = list.data.map(normalizeNewBeneficiario);
          total = list.total;
          usedSource = source;
          break;
        } catch (error) {
          lastError = error;
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
          const payload = await requestExternal('old', `/beneficiarios/${rawExternalId(req.params.id)}`);
          return res.json({
            row: normalizeOldBeneficiario(payload),
            source,
            requestedSource: primary,
            fallbackUsed: source !== primary,
            fallbackReason: source !== primary ? fallbackReason : null
          });
        }

        const token = getSourceToken(req, 'new');
        if (token) {
          const payload = await requestExternal('new', `/records/beneficiario/${rawExternalId(req.params.id)}`, {
            token
          });
          return res.json({
            row: normalizeNewBeneficiario(payload),
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
    res.status(404).json({ error: 'Beneficiario no encontrado' });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = toOldBeneficiarioBody(req.body || {});
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', '/beneficiarios', { method: 'POST', token, body });
    res.status(201).json({ id: payload?.id_beneficiario || payload?.id, payload });
  } catch (error) {
    const token = getSourceToken(req, 'new');
    if (!token) return next(error);

    try {
      const payload = await requestExternal('new', '/records/beneficiario', { method: 'POST', token, body: req.body || {} });
      res.status(201).json({ payload });
    } catch (fallbackError) {
      next(fallbackError.status === 403 ? error : fallbackError);
    }
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', `/beneficiarios/${rawExternalId(req.params.id)}`, {
      method: 'PUT',
      token,
      body: toOldBeneficiarioBody(req.body || {})
    });
    res.json({ ok: true, payload });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    await requestExternal('old', `/beneficiarios/${rawExternalId(req.params.id)}`, { method: 'DELETE', token });
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

export default router;
