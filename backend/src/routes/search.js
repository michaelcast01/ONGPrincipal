import { Router } from 'express';
import { getEntities, getEntity } from '../config/entities.js';
import { listRecords } from '../services/QueryExecutor.js';
import { listDemoRecords, shouldUseDemoData } from '../services/demoData.js';

const router = Router();

router.get('/schema', (_req, res) => {
  res.json({ entities: getEntities() });
});

router.get('/tables', (_req, res) => {
  res.json({ tables: getEntities().map((entity) => entity.key) });
});

router.post('/validate', (req, res) => {
  const entity = getEntity(req.body?.table);
  if (!entity) return res.status(400).json({ valid: false, error: 'Tabla no permitida' });
  res.json({ valid: true, entity });
});

router.post('/execute', async (req, res, next) => {
  try {
    const body = req.body || {};
    const entity = getEntity(body.table);
    if (!entity) return res.status(400).json({ error: 'Tabla no permitida' });

    const result = await listRecords(entity, {
      q: body.q,
      filters: body.filters || {},
      limit: body.limit,
      offset: body.offset,
      orderBy: body.orderBy,
      orderDir: body.orderDir
    });

    res.json(result);
  } catch (error) {
    const entity = getEntity(req.body?.table);
    if (entity && shouldUseDemoData(error)) {
      return res.json(listDemoRecords(entity, {
        q: req.body?.q,
        filters: req.body?.filters || {},
        limit: req.body?.limit,
        offset: req.body?.offset,
        orderBy: req.body?.orderBy,
        orderDir: req.body?.orderDir
      }));
    }
    next(error);
  }
});

export default router;
