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
import { getSourceToken, requestExternal } from '../services/externalApi.js';

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

router.get('/', async (req, res, next) => {
  try {
    const { limit } = paginationFromQuery(req.query);
    const rows = [];
    let total = 0;
    let lastError = null;

    if (!req.query.source || req.query.source === 'ayudas_sociales') {
      try {
        const payload = await requestExternal('old', '/beneficiarios', { query: oldQuery(req.query) });
        const list = oldListPayload(payload);
        rows.push(...list.data.map(normalizeOldBeneficiario));
        total += list.total;
      } catch (error) {
        lastError = error;
      }
    }

    if (!req.query.source || req.query.source === 'ong_operativa') {
      const token = getSourceToken(req, 'new');
      if (token) {
        try {
          const payload = await requestExternal('new', '/records/beneficiario', {
            token,
            query: { page: 1, pageSize: limit, q: req.query.q, sortField: 'id', sortDirection: 'ASC' }
          });
          const list = newListPayload(payload);
          rows.push(...list.data.map(normalizeNewBeneficiario));
          total += list.total;
        } catch (error) {
          lastError = error;
        }
      }
    }

    const filtered = filterBySource(rows, req.query.source);
    if (filtered.length === 0 && total === 0 && lastError) throw lastError;
    res.json({ rows: filtered, total: total || filtered.length });
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
