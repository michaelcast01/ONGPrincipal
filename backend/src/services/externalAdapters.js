function stripPrefix(value) {
  if (value === undefined || value === null || value === '') return value;
  return String(value).replace(/^[^:]+:/, '');
}

function compactName(parts) {
  return parts.map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

function splitFullName(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nombres: parts.join(' '), apellidos: '' };
  return { nombres: parts.slice(0, -1).join(' '), apellidos: parts.at(-1) };
}

export function externalId(source, id) {
  if (id === undefined || id === null || id === '') return id;
  return `${source === 'old' ? 'ayudas' : 'operativa'}:${id}`;
}

export function rawExternalId(value) {
  return stripPrefix(value);
}

export function paginationFromQuery(query = {}) {
  const limit = Math.min(Math.max(Number.parseInt(query.limit || query.pageSize || '50', 10) || 50, 1), 200);
  const offset = Math.max(Number.parseInt(query.offset || '0', 10) || 0, 0);
  const page = Math.max(Number.parseInt(query.page || String(Math.floor(offset / limit) + 1), 10) || 1, 1);
  return { limit, offset, page };
}

export function oldListPayload(payload) {
  if (Array.isArray(payload)) return { data: payload, total: payload.length };
  return {
    data: payload?.data || payload?.rows || [],
    total: payload?.pagination?.total ?? payload?.total ?? payload?.data?.length ?? payload?.rows?.length ?? 0
  };
}

export function newListPayload(payload) {
  if (Array.isArray(payload)) return { data: payload, total: payload.length };
  return {
    data: payload?.data || payload?.rows || [],
    total: payload?.pagination?.total ?? payload?.total ?? payload?.data?.length ?? payload?.rows?.length ?? 0
  };
}

export function normalizeOldBeneficiario(row = {}) {
  const id = row.id_beneficiario ?? row.id;
  const parts = String(row.nombres || row.nombre_completo || row.nombre || '').trim().split(/\s+/).filter(Boolean);
  return {
    id: externalId('old', id),
    id_beneficiario: id,
    nombre_completo: row.nombres || row.nombre_completo || row.nombre || '',
    apellidos: row.apellidos || (parts.length > 1 ? parts.at(-1) : ''),
    documento: row.documento || row.numero_documento || '',
    telefono: row.telefono || '',
    correo: row.correo || '',
    direccion: row.direccion || '',
    municipio_id: externalId('old', row.id_ciudad ?? row.id_municipio),
    id_municipio: row.id_ciudad ?? row.id_municipio,
    ciudad: row.nombre_ciudad || row.ciudad || '',
    region: row.nombre_region || row.region || '',
    tipo_poblacion_id: row.id_tipo_poblacion,
    tipo_poblacion: row.nombre_tipo || row.tipo_poblacion || '',
    tipos_ayuda: row.tipos_ayuda || '',
    origen: 'ayudas_sociales'
  };
}

export function normalizeNewBeneficiario(row = {}) {
  const id = row.id ?? row.id_beneficiario;
  const apellidos = compactName([row.primer_apellido, row.segundo_apellido]) || row.apellidos || '';
  const nombres = compactName([
    row.primer_nombre,
    row.segundo_nombre
  ]) || row.nombres || row.nombre || row.nombre_completo || '';

  return {
    id: externalId('new', id),
    id_beneficiario: id,
    nombre_completo: nombres,
    apellidos,
    documento: row.numero_documento || row.documento || row.cedula || '',
    telefono: row.telefono || row.telefono_principal || row.celular || '',
    correo: row.correo || row.correo_electronico || '',
    ciudad: row.ciudad || row.municipio || '',
    region: row.departamento || row.region || '',
    grupo_sisben: row.grupo_sisben || row.sisben || '',
    fecha_registro: row.fecha_registro || row.created_at || '',
    origen: 'ong_operativa'
  };
}

export function normalizeOldEntrega(row = {}) {
  const id = row.id_entrega ?? row.id;
  return {
    id: externalId('old', id),
    id_entrega: id,
    fecha: row.fecha_entrega || row.fecha || '',
    beneficiario: row.beneficiario || row.nombres || '',
    beneficiario_id: externalId('old', row.id_beneficiario),
    colaborador: row.nombre_colaborador || row.colaborador || '',
    tipo_ayuda: row.nombre_ayuda || row.tipo_ayuda || '',
    tipo_ayuda_id: externalId('old', row.id_tipo_ayuda),
    cantidad: row.cantidad ?? 1,
    ciudad: row.nombre_ciudad || row.ciudad || '',
    municipio_id: externalId('old', row.id_ciudad_entrega ?? row.id_municipio),
    observacion: row.observaciones || row.observacion || '',
    origen: 'ayudas_sociales'
  };
}

export function normalizeNewEntrega(row = {}) {
  const id = row.id ?? row.id_entrega;
  return {
    id: externalId('new', id),
    id_entrega: id,
    fecha: row.fecha_entrega || row.fecha || '',
    beneficiario: row.beneficiario || row.nombre_beneficiario || row.id_beneficiario || '',
    beneficiario_id: externalId('new', row.id_beneficiario ?? row.beneficiario_id),
    colaborador: row.usuario_responsable || row.id_usuario_responsable || '',
    tipo_ayuda: row.tipo_ayuda || row.estado || 'Entrega operativa',
    cantidad: row.cantidad ?? '',
    ciudad: row.municipio || row.ciudad || '',
    observacion: row.observacion || row.observaciones || '',
    origen: 'ong_operativa'
  };
}

export function normalizeOldColaborador(row = {}) {
  const id = row.id_colaborador ?? row.id;
  const names = splitFullName(row.nombre_colaborador || row.nombre || '');
  return {
    id_colaborador: id,
    nombres: row.nombres || names.nombres,
    apellidos: row.apellidos || names.apellidos,
    documento: row.documento || row.cedula || '',
    telefono: row.telefono || '',
    correo: row.correo || '',
    id_cargo: row.id_cargo,
    cargo: row.nombre_cargo || row.cargo || ''
  };
}

export function normalizeOldRegion(row = {}) {
  return {
    id: row.id_region ?? row.id,
    codigo: row.codigo_dane_departamento,
    nombre: row.nombre_region || row.nombre || ''
  };
}

export function normalizeOldCiudad(row = {}) {
  const id = row.id_ciudad ?? row.id;
  return {
    id: externalId('old', id),
    raw_id: id,
    codigo: row.codigo_dane_municipio,
    nombre: row.nombre_ciudad || row.nombre || '',
    region_id: row.id_region,
    region: row.nombre_region || '',
    origen: 'ayudas_sociales'
  };
}

export function normalizeNewCiudad(row = {}) {
  const id = row.id ?? row.id_direccion ?? `${row.departamento || ''}:${row.municipio || ''}`;
  return {
    id: externalId('new', id),
    raw_id: id,
    nombre: row.municipio || row.ciudad || '',
    region: row.departamento || row.region || '',
    origen: 'ong_operativa'
  };
}

export function normalizeOldTipoPoblacion(row = {}) {
  return {
    id: row.id_tipo_poblacion ?? row.id,
    nombre: row.nombre_tipo || row.nombre || ''
  };
}

export function normalizeOldTipoAyuda(row = {}) {
  const id = row.id_tipo_ayuda ?? row.id;
  return {
    id: externalId('old', id),
    raw_id: id,
    nombre: row.nombre_ayuda || row.nombre || '',
    descripcion: row.descripcion || '',
    origen: 'ayudas_sociales'
  };
}

export function normalizeOldCargo(row = {}) {
  return {
    id: row.id_cargo ?? row.id,
    nombre: row.nombre_cargo || row.nombre || '',
    descripcion: row.descripcion || ''
  };
}

export function toOldBeneficiarioBody(body = {}) {
  return {
    nombres: compactName([body.nombres, body.apellidos]) || body.nombre_completo,
    documento: body.documento,
    telefono: body.telefono || null,
    correo: body.correo || null,
    direccion: body.direccion || null,
    id_ciudad: rawExternalId(body.id_ciudad || body.id_municipio),
    id_tipo_poblacion: body.id_tipo_poblacion || body.tipo_poblacion_id
  };
}

export function toOldColaboradorBody(body = {}) {
  return {
    nombre_colaborador: compactName([body.nombres, body.apellidos]) || body.nombre_colaborador,
    cedula: body.documento || body.cedula,
    telefono: body.telefono || null,
    correo: body.correo || null,
    id_cargo: body.id_cargo
  };
}

export function toOldEntregaBody(body = {}) {
  return {
    fecha_entrega: body.fecha_entrega || undefined,
    id_beneficiario: rawExternalId(body.id_beneficiario || body.beneficiario_id),
    id_ciudad_entrega: rawExternalId(body.id_ciudad_entrega || body.id_municipio || body.municipio_id),
    id_colaborador: rawExternalId(body.id_colaborador),
    id_tipo_ayuda: rawExternalId(body.id_tipo_ayuda || body.tipo_ayuda_id),
    cantidad: body.cantidad || 1,
    observaciones: body.observaciones || body.observacion || null
  };
}

export function filterBySource(rows, source) {
  if (!source || source === 'unificado' || source === 'ambas_bases') return rows;
  return rows.filter((row) => row.origen === source);
}
