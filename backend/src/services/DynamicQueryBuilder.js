function assertIdentifier(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw Object.assign(new Error(`Identificador invalido: ${value}`), { status: 400 });
  }
}

export function quoteIdent(value) {
  assertIdentifier(value);
  return `"${value}"`;
}

function qualifiedTable(entity) {
  return `${quoteIdent(entity.schema)}.${quoteIdent(entity.table)}`;
}

function normalizeLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 50;
  return Math.min(Math.max(parsed, 1), 200);
}

function normalizeOffset(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(parsed, 0);
}

function buildFilters(entity, input = {}) {
  const params = [];
  const where = [];
  const allowed = new Set(entity.columns);

  if (input.q && entity.searchFields.length > 0) {
    const like = `%${input.q}%`;
    const search = entity.searchFields
      .filter((field) => allowed.has(field))
      .map((field) => {
        params.push(like);
        return `CAST(${quoteIdent(field)} AS TEXT) ILIKE ?`;
      });

    if (search.length > 0) {
      where.push(`(${search.join(' OR ')})`);
    }
  }

  const filters = input.filters || {};
  for (const [field, value] of Object.entries(filters)) {
    if (!allowed.has(field) || value === undefined || value === null || value === '') continue;
    params.push(value);
    where.push(`${quoteIdent(field)} = ?`);
  }

  return {
    sql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
}

export function buildListQuery(entity, input = {}) {
  const selectedColumns = entity.columns.map(quoteIdent).join(', ');
  const filters = buildFilters(entity, input);
  const limit = normalizeLimit(input.limit);
  const offset = normalizeOffset(input.offset);
  const orderBy = entity.columns.includes(input.orderBy) ? input.orderBy : entity.pk;
  const orderDir = String(input.orderDir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const from = `FROM ${qualifiedTable(entity)} ${filters.sql}`;

  return {
    sql: `SELECT ${selectedColumns} ${from} ORDER BY ${quoteIdent(orderBy)} ${orderDir} LIMIT ? OFFSET ?`,
    params: [...filters.params, limit, offset],
    countSql: `SELECT COUNT(*)::int AS total ${from}`,
    countParams: filters.params
  };
}

export function buildGetByIdQuery(entity, id) {
  return {
    sql: `SELECT ${entity.columns.map(quoteIdent).join(', ')} FROM ${qualifiedTable(entity)} WHERE ${quoteIdent(entity.pk)} = ?`,
    params: [id]
  };
}
