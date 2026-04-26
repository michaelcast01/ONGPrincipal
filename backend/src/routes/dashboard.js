import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { normalizeOldEntrega, oldListPayload } from '../services/externalAdapters.js';
import { getSourceToken, requestExternal } from '../services/externalApi.js';

const router = Router();

router.use(optionalAuth);

function emptySummary() {
  return {
    total_beneficiarios: 0,
    total_entregas: 0,
    total_colaboradores: 0,
    total_ciudades: 0,
    total_donantes: 0,
    stock_inventario: 0
  };
}

function addOldSummary(summary, payload = {}) {
  summary.total_beneficiarios += payload.totalBeneficiarios || payload.summary?.totalBeneficiarios || 0;
  summary.total_colaboradores += payload.totalColaboradores || payload.summary?.totalColaboradores || 0;
  summary.total_entregas += payload.totalEntregas || payload.summary?.totalEntregas || 0;
  summary.total_ciudades += payload.totalCiudades || payload.summary?.totalCiudades || 0;
}

function addNewDashboard(summary, payload = {}) {
  for (const item of payload.dashboard || []) {
    if (item.table === 'beneficiario') summary.total_beneficiarios += item.total || 0;
    if (item.table === 'entrega_encabezado') summary.total_entregas += item.total || 0;
    if (item.table === 'donante') summary.total_donantes += item.total || 0;
    if (item.table === 'lote_inventario') summary.stock_inventario += item.total || 0;
    if (item.table === 'usuario') summary.total_colaboradores += item.total || 0;
  }
}

router.get('/summary', async (req, res, next) => {
  try {
    const summary = emptySummary();
    const topCities = [];
    const recentDeliveries = [];
    let ok = false;
    let lastError = null;

    try {
      const payload = await requestExternal('old', '/dashboard/summary');
      addOldSummary(summary, payload);
      topCities.push(...(payload.topCities || []).map((city) => ({
        ciudad: city.nombre_ciudad || city.ciudad || 'Sin ciudad',
        total: city.total_entregas || city.total || 0
      })));
      ok = true;
    } catch (error) {
      lastError = error;
    }

    try {
      const payload = await requestExternal('old', '/entregas', { query: { page: 1, limit: 10 } });
      recentDeliveries.push(...oldListPayload(payload).data.map(normalizeOldEntrega));
      ok = true;
    } catch (error) {
      lastError = lastError || error;
    }

    const newToken = getSourceToken(req, 'new');
    if (newToken) {
      try {
        const payload = await requestExternal('new', '/meta/app', { token: newToken });
        addNewDashboard(summary, payload);
        ok = true;
      } catch (error) {
        lastError = lastError || error;
      }
    }

    if (!ok && lastError) throw lastError;
    res.json({ summary, topCities, recentDeliveries });
  } catch (error) {
    next(error);
  }
});

router.get('/top-cities', async (_req, res, next) => {
  try {
    const payload = await requestExternal('old', '/dashboard/summary');
    res.json({ rows: (payload.topCities || []).map((city) => ({ ciudad: city.nombre_ciudad, total: city.total_entregas || 0 })) });
  } catch (error) {
    next(error);
  }
});

router.get('/recent-deliveries', async (_req, res, next) => {
  try {
    const payload = await requestExternal('old', '/entregas', { query: { page: 1, limit: 10 } });
    res.json({ rows: oldListPayload(payload).data.map(normalizeOldEntrega) });
  } catch (error) {
    next(error);
  }
});

export default router;
