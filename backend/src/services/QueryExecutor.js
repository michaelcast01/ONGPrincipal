import { query } from '../db.js';
import { buildGetByIdQuery, buildListQuery } from './DynamicQueryBuilder.js';

export async function listRecords(entity, input) {
  const built = buildListQuery(entity, input);
  const [rowsResult, countResult] = await Promise.all([
    query(built.sql, built.params),
    query(built.countSql, built.countParams)
  ]);

  return {
    rows: rowsResult.rows,
    total: countResult.rows[0]?.total || 0
  };
}

export async function getRecordById(entity, id) {
  const built = buildGetByIdQuery(entity, id);
  const result = await query(built.sql, built.params);
  return result.rows[0] || null;
}
