import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import {
  newListPayload,
  normalizeOldColaborador,
  oldListPayload,
  rawExternalId,
  toOldColaboradorBody
} from '../services/externalAdapters.js';
import { getSourceToken, preferredSource, requestExternal, sourceOrder } from '../services/externalApi.js';

const router = Router();

router.use(optionalAuth);

function normalizeUsuario(row = {}) {
  const names = String(row.nombre || row.nombre_usuario || '').split(/\s+/).filter(Boolean);
  return {
    id_colaborador: row.id || row.id_usuario,
    nombres: names.slice(0, -1).join(' ') || names[0] || row.nombre_usuario || '',
    apellidos: names.length > 1 ? names.at(-1) : '',
    documento: row.documento || '',
    telefono: row.telefono || '',
    correo: row.correo || row.correo_electronico || '',
    cargo: row.rol || 'Usuario operativo'
  };
}

function hasResults(list) {
  return (list.data || []).length > 0 && Number(list.total || list.data.length || 0) > 0;
}

router.get('/', async (req, res, next) => {
  try {
    let lastError = null;
    const primary = preferredSource(req);
    let emptyResult = null;
    let fallbackReason = null;

    for (const source of sourceOrder(primary)) {
      if (source === 'old') {
        try {
          const payload = await requestExternal('old', '/colaboradores', { query: { q: req.query.q } });
          const list = oldListPayload(payload);
          if (!hasResults(list)) {
            emptyResult = { source };
            if (source === primary) fallbackReason = 'empty_results';
            continue;
          }

          return res.json({
            rows: list.data.map(normalizeOldColaborador),
            total: list.total,
            source,
            requestedSource: primary,
            fallbackUsed: source !== primary,
            fallbackReason: source !== primary ? fallbackReason : null
          });
        } catch (error) {
          lastError = error;
          if (source === primary) fallbackReason = 'primary_error';
        }
      }

      if (source === 'new') {
        const token = getSourceToken(req, 'new');
        if (!token) {
          if (source === primary) fallbackReason = 'primary_error';
          continue;
        }

        try {
          const payload = await requestExternal('new', '/records/usuario', {
            token,
            query: { page: 1, pageSize: 100, q: req.query.q, sortField: 'id', sortDirection: 'ASC' }
          });
          const list = newListPayload(payload);
          if (!hasResults(list)) {
            emptyResult = { source };
            if (source === primary) fallbackReason = 'empty_results';
            continue;
          }

          return res.json({
            rows: list.data.map(normalizeUsuario),
            total: list.total,
            source,
            requestedSource: primary,
            fallbackUsed: source !== primary,
            fallbackReason: source !== primary ? fallbackReason : null
          });
        } catch (error) {
          lastError = error;
          if (source === primary) fallbackReason = 'primary_error';
        }
      }
    }

    if (emptyResult) {
      return res.json({
        rows: [],
        total: 0,
        source: emptyResult.source,
        requestedSource: primary,
        fallbackUsed: emptyResult.source !== primary,
        fallbackReason: emptyResult.source !== primary ? fallbackReason : null
      });
    }

    throw lastError || new Error('No hay fuente disponible para colaboradores');
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
          const payload = await requestExternal('old', `/colaboradores/${rawExternalId(req.params.id)}`);
          return res.json({
            row: normalizeOldColaborador(payload),
            source,
            requestedSource: primary,
            fallbackUsed: source !== primary,
            fallbackReason: source !== primary ? fallbackReason : null
          });
        }

        const token = getSourceToken(req, 'new');
        if (token) {
          const payload = await requestExternal('new', `/records/usuario/${rawExternalId(req.params.id)}`, { token });
          return res.json({
            row: normalizeUsuario(payload),
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
    res.status(404).json({ error: 'Colaborador no encontrado' });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', '/colaboradores', {
      method: 'POST',
      token,
      body: toOldColaboradorBody(req.body || {})
    });
    res.status(201).json({ id: payload?.id_colaborador || payload?.id, payload });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', `/colaboradores/${rawExternalId(req.params.id)}`, {
      method: 'PUT',
      token,
      body: toOldColaboradorBody(req.body || {})
    });
    res.json({ ok: true, payload });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    await requestExternal('old', `/colaboradores/${rawExternalId(req.params.id)}`, { method: 'DELETE', token });
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

export default router;
