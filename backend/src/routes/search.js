import { Router } from 'express';
import { getEntities, getEntity } from '../config/entities.js';
import { optionalAuth } from '../middleware/auth.js';
import { listRecords } from '../services/QueryExecutor.js';
import { getSourceToken, requestExternal } from '../services/externalApi.js';

const router = Router();

router.use(optionalAuth);

router.get('/schema', (_req, res) => {
  res.json({ entities: getEntities() });
});

router.get('/tables', (_req, res) => {
  res.json({ tables: getEntities().map((entity) => entity.key) });
});

router.post('/validate', (req, res) => {
  const entity = getEntity(req.body?.table || req.body?.primaryTable);
  if (!entity) return res.status(400).json({ valid: false, error: 'Tabla no permitida' });
  res.json({ valid: true, entity });
});

router.post('/execute', async (req, res, next) => {
  try {
    const body = req.body || {};
    const externalTable = body.primaryTable || body.table;
    const entity = getEntity(externalTable);
    if (!entity) return res.status(400).json({ error: 'Tabla no permitida' });

    if (body.primaryTable) {
      const token = getSourceToken(req, 'new');
      const payload = await requestExternal('new', `/search/execute`, {
        method: 'POST',
        token,
        query: { page: req.query.page || 1, pageSize: req.query.pageSize || body.pageSize || body.limit || 20 },
        body
      });
      return res.json({ rows: payload.data || [], total: payload.pagination?.total || 0, payload });
    }

    const result = await listRecords(entity, {
      q: body.q,
      filters: body.filters || {},
      limit: body.limit,
      offset: body.offset,
      orderBy: body.orderBy,
      orderDir: body.orderDir
    }, req);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
