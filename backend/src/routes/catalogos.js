import { Router } from 'express';
import { query } from '../db.js';
import { getDemoCatalogo, shouldUseDemoData } from '../services/demoData.js';

const router = Router();

router.get('/regiones', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM integracion.v_departamentos ORDER BY nombre');
    res.json({ rows: result.rows });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json(getDemoCatalogo('regiones'));
    next(error);
  }
});

router.get('/ciudades', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM integracion.v_ciudades ORDER BY nombre');
    res.json({ rows: result.rows });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json(getDemoCatalogo('ciudades'));
    next(error);
  }
});

router.get('/tipos-poblacion', async (_req, res, next) => {
  try {
    const result = await query('SELECT id_tipo_poblacion AS id, nombre FROM ayudas_sociales.tipo_poblacion ORDER BY nombre');
    res.json({ rows: result.rows });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json(getDemoCatalogo('tiposPoblacion'));
    next(error);
  }
});

router.get('/tipos-ayuda', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM integracion.v_tipos_ayuda ORDER BY nombre');
    res.json({ rows: result.rows });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json(getDemoCatalogo('tiposAyuda'));
    next(error);
  }
});

router.get('/cargos', async (_req, res, next) => {
  try {
    const result = await query('SELECT id_cargo AS id, nombre FROM ayudas_sociales.cargo ORDER BY nombre');
    res.json({ rows: result.rows });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json(getDemoCatalogo('cargos'));
    next(error);
  }
});

export default router;
