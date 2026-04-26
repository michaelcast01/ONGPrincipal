import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import {
  filterBySource,
  newListPayload,
  normalizeNewBeneficiario,
  normalizeOldBeneficiario,
  oldListPayload,
  paginationFromQuery,
  rawExternalId,
  toOldBeneficiarioBody
} from '../services/externalAdapters.js';
import { getServiceToken, getSourceToken, preferredSource, requestExternal, sourceOrder } from '../services/externalApi.js';

const router = Router();

router.use(optionalAuth);

function oldQuery(query) {
  const { limit, page } = paginationFromQuery(query);
  return {
    page,
    limit,
    q: query.q,
    cityId: rawExternalId(query.cityId),
    populationTypeId: query.populationTypeId,
    helpTypeId: rawExternalId(query.helpTypeId)
  };
}

function sourceFromOrigin(value, fallback) {
  if (value === 'ayudas_sociales') return 'old';
  if (value === 'ong_operativa') return 'new';
  return fallback;
}

function sourcesForRequest(req, primary) {
  return req.query.source ? [primary] : sourceOrder(primary);
}

function hasResults(list) {
  return (list.data || []).length > 0 && Number(list.total || list.data.length || 0) > 0;
}

const NEW_SCHEMA_TTL_MS = 5 * 60 * 1000;
const DEFAULT_NEW_FIELDS = [
  'id',
  'tipo_documento',
  'numero_documento',
  'primer_nombre',
  'segundo_nombre',
  'apellidos',
  'primer_apellido',
  'segundo_apellido',
  'telefono',
  'telefono_principal',
  'correo',
  'ciudad',
  'grupo_sisben',
  'fecha_registro'
];
let newBeneficiarioSchemaCache = { expiresAt: 0, schema: null };

function normalizeColumns(columns = []) {
  return columns
    .map((column) => (typeof column === 'string' ? { name: column } : column))
    .filter((column) => column?.name);
}

function buildSchemaFromEntity(entity = {}) {
  const columns = normalizeColumns(entity.columns || []);
  const columnNames = new Set(columns.map((column) => column.name));
  return {
    columns,
    columnNames,
    listFields: (entity.listFields || DEFAULT_NEW_FIELDS).filter((field) => columnNames.size === 0 || columnNames.has(field)),
    searchFields: (entity.searchFields || []).filter((field) => columnNames.size === 0 || columnNames.has(field))
  };
}

async function getNewBeneficiarioSchema(token) {
  if (newBeneficiarioSchemaCache.schema && newBeneficiarioSchemaCache.expiresAt > Date.now()) {
    return newBeneficiarioSchemaCache.schema;
  }

  try {
    const meta = await requestExternal('new', '/meta/app', { token });
    const entity = (meta.entities || []).find((item) => item.name === 'beneficiario' || item.key === 'beneficiario');
    if (entity) {
      const schema = buildSchemaFromEntity(entity);
      newBeneficiarioSchemaCache = { expiresAt: Date.now() + NEW_SCHEMA_TTL_MS, schema };
      return schema;
    }
  } catch (_error) {
    // Si metadata falla, se intenta el endpoint puntual de columnas.
  }

  try {
    const payload = await requestExternal('new', '/search/table/beneficiario/columns', { token });
    const columns = normalizeColumns(payload.columns || []);
    const columnNames = new Set(columns.map((column) => column.name));
    const schema = {
      columns,
      columnNames,
      listFields: DEFAULT_NEW_FIELDS.filter((field) => columnNames.has(field)),
      searchFields: []
    };
    newBeneficiarioSchemaCache = { expiresAt: Date.now() + NEW_SCHEMA_TTL_MS, schema };
    return schema;
  } catch (_error) {
    const columnNames = new Set(DEFAULT_NEW_FIELDS);
    return { columns: DEFAULT_NEW_FIELDS.map((name) => ({ name })), columnNames, listFields: DEFAULT_NEW_FIELDS, searchFields: [] };
  }
}

function existingFields(schema, fields) {
  if (!schema.columnNames || schema.columnNames.size === 0) return fields;
  return fields.filter((field) => schema.columnNames.has(field));
}

function fieldsForNewBeneficiario(schema) {
  const fields = existingFields(schema, [...new Set([...(schema.listFields || []), ...DEFAULT_NEW_FIELDS])]);
  return fields.length > 0 ? fields : DEFAULT_NEW_FIELDS;
}

function searchFieldsForNewBeneficiario(schema) {
  const preferred = [
    ...(schema.searchFields || []),
    'primer_nombre',
    'segundo_nombre',
    'apellidos',
    'primer_apellido',
    'segundo_apellido',
    'numero_documento',
    'tipo_documento',
    'correo',
    'telefono',
    'telefono_principal',
    'ciudad',
    'grupo_sisben'
  ];

  return [...new Set(existingFields(schema, preferred))];
}

function payloadFromRows(rows) {
  return { data: rows, pagination: { total: rows.length } };
}

function newCityFilterValue(value) {
  const raw = rawExternalId(value);
  if (!raw) return '';
  return /^\d+$/.test(String(raw)) ? '' : String(raw);
}

function locallyMatches(row, q) {
  const text = String(q || '').trim().toLowerCase();
  if (!text) return true;
  return Object.values(row || {}).some((value) => String(value || '').toLowerCase().includes(text));
}

function parseAdvancedFilters(value) {
  if (!value) return [];

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((filter) => ({
        field: String(filter.field || '').trim(),
        operator: String(filter.operator || '=').trim().toUpperCase(),
        value: filter.value
      }))
      .filter((filter) => filter.field && filter.value !== undefined && filter.value !== null && filter.value !== '');
  } catch (_error) {
    return [];
  }
}

function advancedFiltersForSchema(schema, filters) {
  const allowedOperators = new Set(['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'ILIKE', 'IN']);
  return filters
    .filter((filter) => schema.columnNames.has(filter.field) && allowedOperators.has(filter.operator))
    .map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.operator === 'IN'
        ? String(filter.value).split(',').map((item) => item.trim()).filter(Boolean)
        : filter.value
    }));
}

function orderByForSchema(schema, query) {
  const field = String(query.sortField || '').trim();
  if (!field || !schema.columnNames.has(field)) {
    return schema.columnNames.has('id') ? [{ field: 'id', direction: 'ASC' }] : [];
  }

  return [{
    field,
    direction: String(query.sortDirection || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
  }];
}

async function searchNewAdvanced(req, token, schema, limit) {
  const filters = advancedFiltersForSchema(schema, parseAdvancedFilters(req.query.advancedFilters));
  const city = newCityFilterValue(req.query.cityId);

  if (city && schema.columnNames.has('ciudad')) {
    filters.push({ field: 'ciudad', operator: '=', value: city });
  }

  if (filters.length === 0) return null;

  const payload = await requestExternal('new', '/search/execute', {
    method: 'POST',
    token,
    query: { page: 1, pageSize: 1000 },
    body: {
      primaryTable: 'beneficiario',
      filters,
      fields: fieldsForNewBeneficiario(schema),
      orderBy: orderByForSchema(schema, req.query)
    }
  });

  const rows = newListPayload(payload).data.filter((row) => locallyMatches(row, req.query.q));
  return payloadFromRows(rows.slice(0, limit));
}

async function searchNewByCity(req, token, schema, limit) {
  const city = newCityFilterValue(req.query.cityId);
  if (!city || !schema.columnNames.has('ciudad')) return null;

  const payload = await requestExternal('new', '/search/execute', {
    method: 'POST',
    token,
    query: { page: 1, pageSize: 1000 },
    body: {
      primaryTable: 'beneficiario',
      filters: [{ field: 'ciudad', operator: '=', value: city }],
      fields: fieldsForNewBeneficiario(schema),
      orderBy: schema.columnNames.has('id') ? [{ field: 'id', direction: 'ASC' }] : []
    }
  });

  const rows = newListPayload(payload).data.filter((row) => locallyMatches(row, req.query.q));
  return payloadFromRows(rows.slice(0, limit));
}

async function searchNewByKnownFields(req, token, schema, limit) {
  if (!req.query.q) return payloadFromRows([]);

  const fields = searchFieldsForNewBeneficiario(schema).slice(0, 10);
  const selectedFields = fieldsForNewBeneficiario(schema);
  const results = await Promise.allSettled(fields.map((field) => requestExternal('new', '/search/execute', {
    method: 'POST',
    token,
    query: { page: 1, pageSize: limit },
    body: {
      primaryTable: 'beneficiario',
      filters: [{ field, operator: 'ILIKE', value: req.query.q }],
      fields: selectedFields,
      orderBy: schema.columnNames.has('id') ? [{ field: 'id', direction: 'ASC' }] : []
    }
  })));

  const unique = new Map();
  results.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    newListPayload(result.value).data.forEach((row) => {
      const key = row.id ?? row.numero_documento ?? JSON.stringify(row);
      unique.set(String(key), row);
    });
  });

  return payloadFromRows([...unique.values()].slice(0, limit));
}

async function requestNewBeneficiariosWithToken(req, limit, token) {
  const advancedFilters = parseAdvancedFilters(req.query.advancedFilters);
  if (advancedFilters.length > 0) {
    const schema = await getNewBeneficiarioSchema(token);
    const advancedPayload = await searchNewAdvanced(req, token, schema, limit);
    if (advancedPayload) return advancedPayload;
  }

  if (newCityFilterValue(req.query.cityId)) {
    const schema = await getNewBeneficiarioSchema(token);
    const cityPayload = await searchNewByCity(req, token, schema, limit);
    if (cityPayload) return cityPayload;
  }

  const recordsPayload = await requestExternal('new', '/records/beneficiario', {
    token,
    query: {
      page: 1,
      pageSize: limit,
      q: req.query.q,
      sortField: req.query.sortField || 'id',
      sortDirection: String(req.query.sortDirection || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    }
  });

  const list = newListPayload(recordsPayload);
  if (hasResults(list) || !req.query.q) return recordsPayload;

  const schema = await getNewBeneficiarioSchema(token);
  return searchNewByKnownFields(req, token, schema, limit);
}

async function requestNewBeneficiarios(req, limit) {
  const userToken = getSourceToken(req, 'new');
  const token = userToken || await getServiceToken('new');

  try {
    return await requestNewBeneficiariosWithToken(req, limit, token);
  } catch (error) {
    if (!userToken || ![401, 403].includes(Number(error.status))) throw error;
    return requestNewBeneficiariosWithToken(req, limit, await getServiceToken('new'));
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { limit } = paginationFromQuery(req.query);
    let rows = [];
    let total = 0;
    let lastError = null;
    const primary = sourceFromOrigin(req.query.source, preferredSource(req));
    let usedSource = null;
    let fallbackReason = null;
    let emptyResult = null;
    const attempts = [];

    for (const source of sourcesForRequest(req, primary)) {
      if (source === 'old') {
        try {
          const payload = await requestExternal('old', '/beneficiarios', { query: oldQuery(req.query) });
          const list = oldListPayload(payload);
          if (!hasResults(list)) {
            emptyResult = { source, rows: [], total: 0 };
            attempts.push({ source, ok: true, total: 0 });
            if (source === primary) fallbackReason = 'empty_results';
            continue;
          }

          rows = list.data.map(normalizeOldBeneficiario);
          total = list.total;
          usedSource = source;
          attempts.push({ source, ok: true, total });
          break;
        } catch (error) {
          lastError = error;
          attempts.push({ source, ok: false, status: error.status, error: error.message });
          if (source === primary) fallbackReason = 'primary_error';
        }
      }

      if (source === 'new') {
        try {
          const payload = await requestNewBeneficiarios(req, limit);
          const list = newListPayload(payload);
          if (!hasResults(list)) {
            emptyResult = { source, rows: [], total: 0 };
            attempts.push({ source, ok: true, total: 0 });
            if (source === primary) fallbackReason = 'empty_results';
            continue;
          }

          rows = list.data.map(normalizeNewBeneficiario);
          total = list.total;
          usedSource = source;
          attempts.push({ source, ok: true, total });
          break;
        } catch (error) {
          lastError = error;
          attempts.push({ source, ok: false, status: error.status, error: error.message });
          if (source === primary) fallbackReason = 'primary_error';
        }
      }
    }

    const filtered = filterBySource(rows, req.query.source);
    if (filtered.length === 0 && total === 0 && lastError && !emptyResult) throw lastError;
    const source = usedSource || emptyResult?.source || primary;
    res.json({
      rows: filtered,
      total: total || filtered.length,
      source,
      requestedSource: primary,
      fallbackUsed: source !== primary,
      fallbackReason: source !== primary ? fallbackReason : null,
      attempts
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const primary = preferredSource(req);
    let lastError = null;
    let fallbackReason = null;

    for (const source of sourceOrder(primary)) {
      try {
        if (source === 'old') {
          const payload = await requestExternal('old', `/beneficiarios/${rawExternalId(req.params.id)}`);
          return res.json({
            row: normalizeOldBeneficiario(payload),
            source,
            requestedSource: primary,
            fallbackUsed: source !== primary,
            fallbackReason: source !== primary ? fallbackReason : null
          });
        }

        const token = getSourceToken(req, 'new');
        if (token) {
          const payload = await requestExternal('new', `/records/beneficiario/${rawExternalId(req.params.id)}`, {
            token
          });
          return res.json({
            row: normalizeNewBeneficiario(payload),
            source,
            requestedSource: primary,
            fallbackUsed: source !== primary,
            fallbackReason: source !== primary ? fallbackReason : null
          });
        }
        if (source === primary) fallbackReason = 'primary_error';
      } catch (error) {
        lastError = error;
        if (source === primary) fallbackReason = error.status === 404 ? 'not_found' : 'primary_error';
      }
    }

    if (lastError?.status && lastError.status !== 404) throw lastError;
    res.status(404).json({ error: 'Beneficiario no encontrado' });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = toOldBeneficiarioBody(req.body || {});
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', '/beneficiarios', { method: 'POST', token, body });
    res.status(201).json({ id: payload?.id_beneficiario || payload?.id, payload });
  } catch (error) {
    const token = getSourceToken(req, 'new');
    if (!token) return next(error);

    try {
      const payload = await requestExternal('new', '/records/beneficiario', { method: 'POST', token, body: req.body || {} });
      res.status(201).json({ payload });
    } catch (fallbackError) {
      next(fallbackError.status === 403 ? error : fallbackError);
    }
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', `/beneficiarios/${rawExternalId(req.params.id)}`, {
      method: 'PUT',
      token,
      body: toOldBeneficiarioBody(req.body || {})
    });
    res.json({ ok: true, payload });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    await requestExternal('old', `/beneficiarios/${rawExternalId(req.params.id)}`, { method: 'DELETE', token });
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

export default router;
