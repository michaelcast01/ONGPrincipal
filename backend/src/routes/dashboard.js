import { Router } from 'express';
import { query } from '../db.js';
import { getDemoDashboard, shouldUseDemoData } from '../services/demoData.js';

const router = Router();

async function getSummary() {
  const result = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM integracion.v_beneficiarios) AS total_beneficiarios,
      (SELECT COUNT(*)::int FROM integracion.v_entregas) AS total_entregas,
      (SELECT COUNT(*)::int FROM ayudas_sociales.colaborador) AS total_colaboradores,
      (SELECT COUNT(DISTINCT ciudad)::int FROM integracion.v_beneficiarios WHERE ciudad IS NOT NULL) AS total_ciudades,
      (SELECT COUNT(*)::int FROM ong_operativa.donante) AS total_donantes,
      (SELECT COALESCE(SUM(stock_actual), 0)::int FROM ong_operativa.lote_inventario) AS stock_inventario
  `);
  return result.rows[0];
}

async function getTopCities() {
  const result = await query(`
    SELECT COALESCE(ciudad, 'Sin ciudad') AS ciudad, COUNT(*)::int AS total
      FROM integracion.v_entregas
     GROUP BY ciudad
     ORDER BY total DESC, ciudad ASC
     LIMIT 8
  `);
  return result.rows;
}

async function getRecentDeliveries() {
  const result = await query(`
    SELECT *
      FROM integracion.v_entregas
     ORDER BY fecha DESC NULLS LAST, id DESC
     LIMIT 10
  `);
  return result.rows;
}

router.get('/summary', async (_req, res, next) => {
  try {
    const [summary, topCities, recentDeliveries] = await Promise.all([
      getSummary(),
      getTopCities(),
      getRecentDeliveries()
    ]);

    res.json({ summary, topCities, recentDeliveries });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json(getDemoDashboard());
    next(error);
  }
});

router.get('/top-cities', async (_req, res, next) => {
  try {
    res.json({ rows: await getTopCities() });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json({ rows: getDemoDashboard().topCities });
    next(error);
  }
});

router.get('/recent-deliveries', async (_req, res, next) => {
  try {
    res.json({ rows: await getRecentDeliveries() });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json({ rows: getDemoDashboard().recentDeliveries });
    next(error);
  }
});

export default router;
