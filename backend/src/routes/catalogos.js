import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import {
  newListPayload,
  normalizeNewCiudad,
  normalizeOldCargo,
  normalizeOldCiudad,
  normalizeOldRegion,
  normalizeOldTipoAyuda,
  normalizeOldTipoPoblacion,
  oldListPayload
} from '../services/externalAdapters.js';
import { getSourceToken, requestExternal } from '../services/externalApi.js';

const router = Router();

router.use(optionalAuth);

async function readOldCatalog(path, normalizer) {
  const payload = await requestExternal('old', path);
  return oldListPayload(payload).data.map(normalizer);
}

router.get('/regiones', async (_req, res, next) => {
  try {
    res.json({ rows: await readOldCatalog('/catalogos/regiones', normalizeOldRegion) });
  } catch (error) {
    next(error);
  }
});

router.get('/ciudades', async (req, res, next) => {
  try {
    const rows = [];

    try {
      rows.push(...await readOldCatalog('/catalogos/ciudades', normalizeOldCiudad));
    } catch (_error) {
      // La API nueva no tiene catalogo de ciudades; se deriva de direcciones si la antigua falla.
    }

    const newToken = getSourceToken(req, 'new');
    if (newToken) {
      try {
        const payload = await requestExternal('new', '/records/direccion_ubicacion', {
          token: newToken,
          query: { page: 1, pageSize: 200 }
        });
        const unique = new Map();
        newListPayload(payload).data.map(normalizeNewCiudad).forEach((city) => {
          if (city.nombre) unique.set(`${city.region}:${city.nombre}`, city);
        });
        rows.push(...unique.values());
      } catch (_error) {
        // Si la API nueva no permite esta tabla, se mantiene la respuesta de la antigua.
      }
    }

    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

router.get('/tipos-poblacion', async (_req, res, next) => {
  try {
    res.json({ rows: await readOldCatalog('/catalogos/tipos-poblacion', normalizeOldTipoPoblacion) });
  } catch (error) {
    next(error);
  }
});

router.get('/tipos-ayuda', async (_req, res, next) => {
  try {
    res.json({ rows: await readOldCatalog('/catalogos/tipos-ayuda', normalizeOldTipoAyuda) });
  } catch (error) {
    next(error);
  }
});

router.get('/cargos', async (_req, res, next) => {
  try {
    res.json({ rows: await readOldCatalog('/catalogos/cargos', normalizeOldCargo) });
  } catch (error) {
    next(error);
  }
});

export default router;
