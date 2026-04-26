import { Router } from 'express';
import { getEntity } from '../config/entities.js';
import { optionalAuth } from '../middleware/auth.js';
import { getRecordById, listRecords } from '../services/QueryExecutor.js';

const router = Router();

router.use(optionalAuth);

router.get('/:table', async (req, res, next) => {
  try {
    const entity = getEntity(req.params.table);
    if (!entity) return res.status(404).json({ error: 'Tabla no permitida' });

    const { q, limit, offset, orderBy, orderDir, ...filters } = req.query;
    const result = await listRecords(entity, { q, limit, offset, orderBy, orderDir, filters }, req);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:table/:id', async (req, res, next) => {
  try {
    const entity = getEntity(req.params.table);
    if (!entity) return res.status(404).json({ error: 'Tabla no permitida' });

    const row = await getRecordById(entity, req.params.id, req);
    if (!row) return res.status(404).json({ error: 'Registro no encontrado' });

    res.json({ row });
  } catch (error) {
    next(error);
  }
});

export default router;
