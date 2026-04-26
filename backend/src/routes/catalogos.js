import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import {
  externalId,
  newListPayload,
  normalizeNewCiudad,
  normalizeOldCargo,
  normalizeOldCiudad,
  normalizeOldRegion,
  normalizeOldTipoAyuda,
  normalizeOldTipoPoblacion,
  oldListPayload
} from '../services/externalAdapters.js';
import { getSourceToken, preferredSource, requestExternal, sourceOrder } from '../services/externalApi.js';

const router = Router();

router.use(optionalAuth);

function hasRows(rows) {
  return Array.isArray(rows) && rows.length > 0;
}

function catalogResponse(rows, source, primary, fallbackReason) {
  return {
    rows,
    source,
    requestedSource: primary,
    fallbackUsed: source !== primary,
    fallbackReason: source !== primary ? fallbackReason : null
  };
}

async function readOldCatalog(path, normalizer) {
  const payload = await requestExternal('old', path);
  return oldListPayload(payload).data.map(normalizer);
}

async function readNewRecords(req, table, normalizer) {
  const token = getSourceToken(req, 'new');
  if (!token) throw new Error('Token de la API nueva no disponible');

  const payload = await requestExternal('new', `/records/${table}`, {
    token,
    query: { page: 1, pageSize: 500, sortField: 'id', sortDirection: 'ASC' }
  });

  return newListPayload(payload).data.map(normalizer);
}

async function readNewCiudades(req) {
  const unique = new Map();
  const rows = await readNewRecords(req, 'direccion_ubicacion', normalizeNewCiudad);
  rows.forEach((city) => {
    if (city.nombre) unique.set(`${city.region}:${city.nombre}`, city);
  });
  return [...unique.values()];
}

async function readNewRegiones(req) {
  const unique = new Map();
  const cities = await readNewCiudades(req);
  cities.forEach((city) => {
    if (city.region) unique.set(city.region, { id: externalId('new', city.region), nombre: city.region, origen: 'ong_operativa' });
  });
  return [...unique.values()];
}

async function readNewTiposAyuda(req) {
  return readNewRecords(req, 'item_inventario', (row = {}) => ({
    id: externalId('new', row.id ?? row.id_item),
    raw_id: row.id ?? row.id_item,
    nombre: row.nombre || row.categoria || '',
    descripcion: row.descripcion || row.categoria || '',
    origen: 'ong_operativa'
  }));
}

async function readNewCargos(req) {
  return readNewRecords(req, 'rol', (row = {}) => ({
    id: externalId('new', row.id ?? row.id_rol),
    raw_id: row.id ?? row.id_rol,
    nombre: row.nombre || row.codigo || '',
    descripcion: row.descripcion || '',
    origen: 'ong_operativa'
  }));
}

async function respondWithFallback(req, res, readers) {
  const primary = preferredSource(req);
  let lastError = null;
  let fallbackReason = null;
  let emptyResult = null;

  for (const source of sourceOrder(primary)) {
    const reader = readers[source];
    if (!reader) continue;

    try {
      const rows = await reader();
      if (!hasRows(rows)) {
        emptyResult = { rows: [], source };
        if (source === primary) fallbackReason = 'empty_results';
        continue;
      }

      return res.json(catalogResponse(rows, source, primary, fallbackReason));
    } catch (error) {
      lastError = error;
      if (source === primary) fallbackReason = 'primary_error';
    }
  }

  if (emptyResult) return res.json(catalogResponse(emptyResult.rows, emptyResult.source, primary, fallbackReason));
  throw lastError || new Error('No hay fuente disponible para el catalogo');
}

router.get('/regiones', async (req, res, next) => {
  try {
    await respondWithFallback(req, res, {
      old: () => readOldCatalog('/catalogos/regiones', normalizeOldRegion),
      new: () => readNewRegiones(req)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/ciudades', async (req, res, next) => {
  try {
    await respondWithFallback(req, res, {
      old: () => readOldCatalog('/catalogos/ciudades', normalizeOldCiudad),
      new: () => readNewCiudades(req)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tipos-poblacion', async (req, res, next) => {
  try {
    await respondWithFallback(req, res, {
      old: () => readOldCatalog('/catalogos/tipos-poblacion', normalizeOldTipoPoblacion)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tipos-ayuda', async (req, res, next) => {
  try {
    await respondWithFallback(req, res, {
      old: () => readOldCatalog('/catalogos/tipos-ayuda', normalizeOldTipoAyuda),
      new: () => readNewTiposAyuda(req)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/cargos', async (req, res, next) => {
  try {
    await respondWithFallback(req, res, {
      old: () => readOldCatalog('/catalogos/cargos', normalizeOldCargo),
      new: () => readNewCargos(req)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
