import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createDemoColaborador,
  deleteDemoColaborador,
  listDemoColaboradores,
  shouldUseDemoData,
  updateDemoColaborador
} from '../services/demoData.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    let where = '';

    if (req.query.q) {
      const like = `%${req.query.q}%`;
      params.push(like, like, like, like);
      where = 'WHERE c.documento ILIKE ? OR c.nombres ILIKE ? OR c.apellidos ILIKE ? OR c.correo ILIKE ?';
    }

    const result = await query(
      `SELECT c.*, ca.nombre AS cargo
         FROM ayudas_sociales.colaborador c
         LEFT JOIN ayudas_sociales.cargo ca ON ca.id_cargo = c.id_cargo
         ${where}
        ORDER BY c.nombres, c.apellidos`,
      params
    );

    res.json({ rows: result.rows, total: result.rowCount });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json(listDemoColaboradores(req.query));
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.documento || !body.nombres) {
      return res.status(400).json({ error: 'Documento y nombres son requeridos' });
    }

    const result = await query(
      `INSERT INTO ayudas_sociales.colaborador
       (documento, nombres, apellidos, telefono, correo, id_cargo, activo)
       VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, TRUE))
       RETURNING *`,
      [body.documento, body.nombres, body.apellidos || '', body.telefono || null, body.correo || null, body.id_cargo || null, body.activo]
    );

    res.status(201).json({ row: result.rows[0] });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.status(201).json({ row: createDemoColaborador(req.body || {}) });
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await query(
      `UPDATE ayudas_sociales.colaborador
          SET documento = COALESCE(?, documento),
              nombres = COALESCE(?, nombres),
              apellidos = COALESCE(?, apellidos),
              telefono = COALESCE(?, telefono),
              correo = COALESCE(?, correo),
              id_cargo = COALESCE(?, id_cargo),
              activo = COALESCE(?, activo)
        WHERE id_colaborador = ?
        RETURNING *`,
      [body.documento || null, body.nombres || null, body.apellidos || null, body.telefono || null, body.correo || null, body.id_cargo || null, body.activo, req.params.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Colaborador no encontrado' });
    res.json({ row: result.rows[0] });
  } catch (error) {
    if (shouldUseDemoData(error)) {
      const row = updateDemoColaborador(req.params.id, req.body || {});
      if (!row) return res.status(404).json({ error: 'Colaborador no encontrado' });
      return res.json({ row });
    }
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM ayudas_sociales.colaborador WHERE id_colaborador = ? RETURNING id_colaborador',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Colaborador no encontrado' });
    res.json({ deleted: true });
  } catch (error) {
    if (shouldUseDemoData(error)) {
      if (!deleteDemoColaborador(req.params.id)) return res.status(404).json({ error: 'Colaborador no encontrado' });
      return res.json({ deleted: true });
    }
    next(error);
  }
});

export default router;
