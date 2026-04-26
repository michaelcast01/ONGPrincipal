import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { normalizeOldEntrega, oldListPayload } from '../services/externalAdapters.js';
import { getSourceToken, preferredSource, requestExternal, sourceOrder } from '../services/externalApi.js';

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
    let lastError = null;
    const primary = preferredSource(req);

    for (const source of sourceOrder(primary)) {
      const summary = emptySummary();
      const topCities = [];
      const recentDeliveries = [];

      if (source === 'old') {
        try {
          const payload = await requestExternal('old', '/dashboard/summary');
          addOldSummary(summary, payload);
          topCities.push(...(payload.topCities || []).map((city) => ({
            ciudad: city.nombre_ciudad || city.ciudad || 'Sin ciudad',
            total: city.total_entregas || city.total || 0
          })));

          try {
            const deliveries = await requestExternal('old', '/entregas', { query: { page: 1, limit: 10 } });
            recentDeliveries.push(...oldListPayload(deliveries).data.map(normalizeOldEntrega));
          } catch (_error) {
            // El resumen puede mostrarse aunque fallen las entregas recientes.
          }

          return res.json({ summary, topCities, recentDeliveries, source });
        } catch (error) {
          lastError = error;
        }
      }

      const newToken = getSourceToken(req, 'new');
      if (source === 'new' && newToken) {
        try {
          const payload = await requestExternal('new', '/meta/app', { token: newToken });
          addNewDashboard(summary, payload);
          return res.json({ summary, topCities, recentDeliveries, source });
        } catch (error) {
          lastError = error;
        }
      }
    }

    throw lastError || new Error('No hay fuente disponible para dashboard');
  } catch (error) {
    next(error);
  }
});

router.get('/top-cities', async (req, res, next) => {
  try {
    if (preferredSource(req) === 'new') return res.json({ rows: [] });
    const payload = await requestExternal('old', '/dashboard/summary');
    res.json({ rows: (payload.topCities || []).map((city) => ({ ciudad: city.nombre_ciudad, total: city.total_entregas || 0 })) });
  } catch (error) {
    next(error);
  }
});

router.get('/recent-deliveries', async (req, res, next) => {
  try {
    if (preferredSource(req) === 'new') return res.json({ rows: [] });
    const payload = await requestExternal('old', '/entregas', { query: { page: 1, limit: 10 } });
    res.json({ rows: oldListPayload(payload).data.map(normalizeOldEntrega) });
  } catch (error) {
    next(error);
  }
});

export default router;
