import { newListPayload, paginationFromQuery } from './externalAdapters.js';
import { ExternalApiError, getSourceToken, requestExternal } from './externalApi.js';

function tableName(entity) {
  return entity.table || entity.key;
}

function assertNewToken(req) {
  const token = getSourceToken(req, 'new');
  if (!token) {
    throw new ExternalApiError('Token de la API nueva no disponible. Inicia sesion contra la API nueva.', { status: 401, source: 'new' });
  }
  return token;
}

export async function listRecords(entity, input, req) {
  const token = assertNewToken(req);
  const { limit, offset } = paginationFromQuery(input);
  const page = Math.floor(offset / limit) + 1;
  const payload = await requestExternal('new', `/records/${tableName(entity)}`, {
    token,
    query: {
      page,
      pageSize: limit,
      q: input.q,
      sortField: input.orderBy || 'id',
      sortDirection: String(input.orderDir || 'ASC').toUpperCase()
    }
  });
  const list = newListPayload(payload);

  return {
    rows: list.data,
    total: list.total
  };
}

export async function getRecordById(entity, id, req) {
  const token = assertNewToken(req);
  return requestExternal('new', `/records/${tableName(entity)}/${id}`, { token });
}
