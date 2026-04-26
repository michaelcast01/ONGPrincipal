import { Router } from 'express';
import { getEntity } from '../config/entities.js';
import { getRecordById, listRecords } from '../services/QueryExecutor.js';
import { getDemoRecordById, listDemoRecords, shouldUseDemoData } from '../services/demoData.js';

const router = Router();

router.get('/:table', async (req, res, next) => {
  try {
    const entity = getEntity(req.params.table);
    if (!entity) return res.status(404).json({ error: 'Tabla no permitida' });

    const { q, limit, offset, orderBy, orderDir, ...filters } = req.query;
    const result = await listRecords(entity, { q, limit, offset, orderBy, orderDir, filters });
    res.json(result);
  } catch (error) {
    const entity = getEntity(req.params.table);
    if (entity && shouldUseDemoData(error)) {
      const { q, limit, offset, orderBy, orderDir, ...filters } = req.query;
      return res.json(listDemoRecords(entity, { q, limit, offset, orderBy, orderDir, filters }));
    }
    next(error);
  }
});

router.get('/:table/:id', async (req, res, next) => {
  try {
    const entity = getEntity(req.params.table);
    if (!entity) return res.status(404).json({ error: 'Tabla no permitida' });

    const row = await getRecordById(entity, req.params.id);
    if (!row) return res.status(404).json({ error: 'Registro no encontrado' });

    res.json({ row });
  } catch (error) {
    const entity = getEntity(req.params.table);
    if (entity && shouldUseDemoData(error)) {
      const row = getDemoRecordById(entity, req.params.id);
      if (!row) return res.status(404).json({ error: 'Registro no encontrado' });
      return res.json({ row });
    }
    next(error);
  }
});

export default router;
