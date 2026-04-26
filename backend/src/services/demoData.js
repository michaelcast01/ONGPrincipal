const demoBeneficiarios = [
  {
    id: 'ayudas:1',
    origen: 'ayudas_sociales',
    id_original: '1',
    documento: '1001001001',
    nombre_completo: 'Ana Maria Lopez',
    telefono: '3001112233',
    correo: 'ana@example.org',
    municipio_id: 'ayudas:1',
    ciudad: 'Medellin',
    departamento: 'Antioquia',
    tipo_poblacion_id: '1',
    tipo_poblacion: 'Adulto mayor',
    created_at: new Date().toISOString()
  },
  {
    id: 'ayudas:2',
    origen: 'ayudas_sociales',
    id_original: '2',
    documento: '1001001002',
    nombre_completo: 'Carlos Ramirez',
    telefono: '3002223344',
    correo: 'carlos@example.org',
    municipio_id: 'ayudas:3',
    ciudad: 'Bogota',
    departamento: 'Cundinamarca',
    tipo_poblacion_id: '4',
    tipo_poblacion: 'Victima del conflicto',
    created_at: new Date().toISOString()
  },
  {
    id: 'ayudas:3',
    origen: 'ayudas_sociales',
    id_original: '3',
    documento: '1001001003',
    nombre_completo: 'Luisa Fernanda Gomez',
    telefono: '3003334455',
    correo: 'luisa@example.org',
    municipio_id: 'ayudas:4',
    ciudad: 'Cali',
    departamento: 'Valle del Cauca',
    tipo_poblacion_id: '2',
    tipo_poblacion: 'Madre cabeza de hogar',
    created_at: new Date().toISOString()
  },
  {
    id: 'ong:1',
    origen: 'ong_operativa',
    id_original: '1',
    documento: '2002002001',
    nombre_completo: 'Diana Martinez',
    telefono: '3011112233',
    correo: 'diana@example.org',
    municipio_id: 'ong:medellin',
    ciudad: 'Medellin',
    departamento: 'Antioquia',
    tipo_poblacion_id: null,
    tipo_poblacion: 'General',
    created_at: new Date().toISOString()
  },
  {
    id: 'ong:2',
    origen: 'ong_operativa',
    id_original: '2',
    documento: '2002002002',
    nombre_completo: 'Samuel Torres',
    telefono: '3012223344',
    correo: 'samuel@example.org',
    municipio_id: 'ong:bogota',
    ciudad: 'Bogota',
    departamento: 'Cundinamarca',
    tipo_poblacion_id: null,
    tipo_poblacion: 'General',
    created_at: new Date().toISOString()
  }
];

const demoColaboradores = [
  { id_colaborador: 1, documento: '9001', nombres: 'Sofia', apellidos: 'Restrepo', telefono: '3101112233', correo: 'sofia@ong.org', id_cargo: 1, cargo: 'Coordinador', activo: true },
  { id_colaborador: 2, documento: '9002', nombres: 'Andres', apellidos: 'Molina', telefono: '3102223344', correo: 'andres@ong.org', id_cargo: 2, cargo: 'Voluntario', activo: true },
  { id_colaborador: 3, documento: '9003', nombres: 'Paula', apellidos: 'Vargas', telefono: '3103334455', correo: 'paula@ong.org', id_cargo: 3, cargo: 'Logistica', activo: true }
];

const demoEntregas = [
  {
    id: 'ayudas:1',
    origen: 'ayudas_sociales',
    id_original: '1',
    beneficiario_id: 'ayudas:1',
    beneficiario: 'Ana Maria Lopez',
    documento: '1001001001',
    municipio_id: 'ayudas:1',
    ciudad: 'Medellin',
    departamento: 'Antioquia',
    colaborador: 'Sofia Restrepo',
    tipo_ayuda_id: 'ayudas:1',
    tipo_ayuda: 'Mercado familiar',
    fecha: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    cantidad: 1,
    observacion: 'Entrega domiciliaria'
  },
  {
    id: 'ayudas:2',
    origen: 'ayudas_sociales',
    id_original: '2',
    beneficiario_id: 'ayudas:2',
    beneficiario: 'Carlos Ramirez',
    documento: '1001001002',
    municipio_id: 'ayudas:3',
    ciudad: 'Bogota',
    departamento: 'Cundinamarca',
    colaborador: 'Andres Molina',
    tipo_ayuda_id: 'ayudas:3',
    tipo_ayuda: 'Apoyo monetario',
    fecha: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    cantidad: 150000,
    observacion: 'Apoyo emergencia'
  },
  {
    id: 'ong:1:1',
    origen: 'ong_operativa',
    id_original: '1',
    beneficiario_id: 'ong:1',
    beneficiario: 'Diana Martinez',
    documento: '2002002001',
    municipio_id: 'ong:medellin',
    ciudad: 'Medellin',
    departamento: 'Antioquia',
    colaborador: 'Gestor Operativo',
    tipo_ayuda_id: 'ong:1',
    tipo_ayuda: 'Kit alimentario',
    fecha: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    cantidad: 1,
    observacion: 'Entrega completa'
  },
  {
    id: 'ong:2:2',
    origen: 'ong_operativa',
    id_original: '2',
    beneficiario_id: 'ong:2',
    beneficiario: 'Samuel Torres',
    documento: '2002002002',
    municipio_id: 'ong:bogota',
    ciudad: 'Bogota',
    departamento: 'Cundinamarca',
    colaborador: 'Gestor Operativo',
    tipo_ayuda_id: 'ong:2',
    tipo_ayuda: 'Cobija termica',
    fecha: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    cantidad: 1,
    observacion: 'Pendiente seguimiento'
  }
];

const demoCatalogos = {
  regiones: [
    { id: 'ayudas:1', nombre: 'Antioquia', origen: 'ayudas_sociales' },
    { id: 'ayudas:2', nombre: 'Cundinamarca', origen: 'ayudas_sociales' },
    { id: 'ayudas:3', nombre: 'Valle del Cauca', origen: 'ayudas_sociales' }
  ],
  ciudades: [
    { id: 'ayudas:1', nombre: 'Medellin', departamento: 'Antioquia', origen: 'ayudas_sociales' },
    { id: 'ayudas:2', nombre: 'Bello', departamento: 'Antioquia', origen: 'ayudas_sociales' },
    { id: 'ayudas:3', nombre: 'Bogota', departamento: 'Cundinamarca', origen: 'ayudas_sociales' },
    { id: 'ayudas:4', nombre: 'Cali', departamento: 'Valle del Cauca', origen: 'ayudas_sociales' },
    { id: 'ong:medellin', nombre: 'Medellin', departamento: 'Antioquia', origen: 'ong_operativa' },
    { id: 'ong:bogota', nombre: 'Bogota', departamento: 'Cundinamarca', origen: 'ong_operativa' }
  ],
  tiposPoblacion: [
    { id: 1, nombre: 'Adulto mayor' },
    { id: 2, nombre: 'Madre cabeza de hogar' },
    { id: 3, nombre: 'Ninez' },
    { id: 4, nombre: 'Victima del conflicto' },
    { id: 5, nombre: 'Discapacidad' }
  ],
  tiposAyuda: [
    { id: 'ayudas:1', nombre: 'Mercado familiar', origen: 'ayudas_sociales' },
    { id: 'ayudas:2', nombre: 'Kit de aseo', origen: 'ayudas_sociales' },
    { id: 'ayudas:3', nombre: 'Apoyo monetario', origen: 'ayudas_sociales' },
    { id: 'ayudas:4', nombre: 'Ropa y abrigo', origen: 'ayudas_sociales' },
    { id: 'ong:1', nombre: 'Kit alimentario', origen: 'ong_operativa' },
    { id: 'ong:2', nombre: 'Cobija termica', origen: 'ong_operativa' }
  ],
  cargos: [
    { id: 1, nombre: 'Coordinador' },
    { id: 2, nombre: 'Voluntario' },
    { id: 3, nombre: 'Logistica' },
    { id: 4, nombre: 'Trabajador social' }
  ]
};

const demoRecords = {
  rol: [
    { id_rol: 1, codigo: 'admin', nombre: 'Administrador', descripcion: 'Acceso total' },
    { id_rol: 2, codigo: 'gestor', nombre: 'Gestor operativo', descripcion: 'Consulta y operacion basica' }
  ],
  permiso: [
    { id_permiso: 1, codigo: 'records.read', nombre: 'Consultar registros', descripcion: 'Permite consultar tablas' },
    { id_permiso: 2, codigo: 'dashboard.read', nombre: 'Consultar dashboard', descripcion: 'Permite ver metricas' }
  ],
  usuario: [
    { id_usuario: 1, usuario: 'admin', nombre: 'Administrador', correo: 'admin@ong.org', activo: true, created_at: new Date().toISOString() },
    { id_usuario: 2, usuario: 'gestor', nombre: 'Gestor Operativo', correo: 'gestor@ong.org', activo: true, created_at: new Date().toISOString() }
  ],
  usuario_rol: [
    { id_usuario_rol: 1, id_usuario: 1, id_rol: 1 },
    { id_usuario_rol: 2, id_usuario: 2, id_rol: 2 }
  ],
  rol_permiso: [
    { id_rol_permiso: 1, id_rol: 1, id_permiso: 1 },
    { id_rol_permiso: 2, id_rol: 2, id_permiso: 1 }
  ],
  bitacora_auditoria: [
    { id_bitacora: 1, id_usuario: 1, accion: 'LOGIN', tabla_afectada: 'usuario', registro_id: '1', created_at: new Date().toISOString(), detalle: 'Ingreso demo' }
  ],
  beneficiario: [
    { id_beneficiario: 1, tipo_documento: 'CC', numero_documento: '2002002001', nombres: 'Diana', apellidos: 'Martinez', fecha_nacimiento: '1978-05-20', genero: 'Femenino', telefono: '3011112233', correo: 'diana@example.org', sisben: 'B2', pertenencia_etnica: 'Ninguna', discapacidad: false, consentimiento_datos: true, created_at: new Date().toISOString() },
    { id_beneficiario: 2, tipo_documento: 'TI', numero_documento: '2002002002', nombres: 'Samuel', apellidos: 'Torres', fecha_nacimiento: '2012-11-02', genero: 'Masculino', telefono: '3012223344', correo: 'samuel@example.org', sisben: 'A1', pertenencia_etnica: 'Ninguna', discapacidad: false, consentimiento_datos: true, created_at: new Date().toISOString() }
  ],
  acudiente: [
    { id_acudiente: 1, id_beneficiario: 2, nombres: 'Martha', apellidos: 'Torres', parentesco: 'Madre', telefono: '3019998877', correo: 'martha@example.org' }
  ],
  documento_soporte: [
    { id_documento: 1, id_beneficiario: 1, tipo_documento: 'Cedula', url_archivo: 'https://example.org/docs/diana.pdf', observacion: 'Documento validado', created_at: new Date().toISOString() }
  ],
  direccion_ubicacion: [
    { id_direccion: 1, id_beneficiario: 1, departamento: 'Antioquia', municipio: 'Medellin', barrio: 'Buenos Aires', direccion: 'Calle 10 #20-30', zona: 'urbana', principal: true },
    { id_direccion: 2, id_beneficiario: 2, departamento: 'Cundinamarca', municipio: 'Bogota', barrio: 'Bosa', direccion: 'Carrera 80 #15-20', zona: 'urbana', principal: true }
  ],
  donante: [
    { id_donante: 1, tipo_donante: 'Juridica', nombre: 'Fundacion Aliada', documento: 'NIT900100200', telefono: '6041112233', correo: 'contacto@aliada.org', anonimo: false, created_at: new Date().toISOString() }
  ],
  donacion: [
    { id_donacion: 1, id_donante: 1, tipo_donacion: 'Fisica', descripcion: 'Kits alimentarios', valor_estimado: 4500000, fecha_donacion: new Date().toISOString().slice(0, 10), soporte: 'ACTA-001' }
  ],
  mision_operativa: [
    { id_mision: 1, nombre: 'Jornada Medellin', descripcion: 'Entrega de kits alimentarios', departamento: 'Antioquia', municipio: 'Medellin', fecha_inicio: new Date().toISOString().slice(0, 10), fecha_fin: null, estado: 'en curso' }
  ],
  recurso_mision: [
    { id_recurso: 1, id_mision: 1, id_usuario: 2, id_vehiculo: 1, id_conductor: 1, rol_operativo: 'Coordinacion' }
  ],
  vehiculo: [
    { id_vehiculo: 1, placa: 'ONG123', tipo: 'Camioneta', marca: 'Renault', modelo: 'Duster', capacidad: 500, estado: 'disponible' }
  ],
  conductor: [
    { id_conductor: 1, nombres: 'Hector', apellidos: 'Cano', documento: '7001001', telefono: '3031112233', licencia: 'C2', activo: true }
  ],
  item_inventario: [
    { id_item: 1, nombre: 'Kit alimentario', categoria: 'Alimentos', unidad_medida: 'unidad', descripcion: 'Mercado para una familia', activo: true },
    { id_item: 2, nombre: 'Cobija termica', categoria: 'Abrigo', unidad_medida: 'unidad', descripcion: 'Cobija individual', activo: true }
  ],
  lote_inventario: [
    { id_lote: 1, id_item: 1, id_donacion: 1, codigo_lote: 'LOT-ALI-001', fecha_vencimiento: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10), cantidad_inicial: 100, stock_actual: 84, ubicacion: 'Bodega principal' }
  ],
  entrega_encabezado: [
    { id_entrega: 1, id_mision: 1, id_beneficiario: 1, id_usuario_responsable: 2, fecha_entrega: new Date().toISOString().slice(0, 10), observacion: 'Entrega completa', estado: 'registrada' }
  ],
  entrega_detalle: [
    { id_detalle: 1, id_entrega: 1, id_lote: 1, cantidad: 1 }
  ],
  gasto_logistico: [
    { id_gasto: 1, id_mision: 1, tipo_gasto: 'Combustible', descripcion: 'Tanqueo ruta Medellin', valor: 180000, fecha_gasto: new Date().toISOString().slice(0, 10), soporte: 'REC-001' }
  ]
};

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

function contains(row, fields, q) {
  if (!q) return true;
  const needle = String(q).toLowerCase();
  return fields.some((field) => String(row[field] ?? '').toLowerCase().includes(needle));
}

function page(rows, limit, offset) {
  const total = rows.length;
  return { rows: rows.slice(offset, offset + limit), total };
}

export function shouldUseDemoData(_error) {
  return String(process.env.DEMO_FALLBACK || 'true').toLowerCase() !== 'false';
}

export function getDemoDashboard() {
  const cityTotals = demoEntregas.reduce((acc, row) => {
    const city = row.ciudad || 'Sin ciudad';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      total_beneficiarios: demoBeneficiarios.length,
      total_entregas: demoEntregas.length,
      total_colaboradores: demoColaboradores.length,
      total_ciudades: new Set(demoBeneficiarios.map((row) => row.ciudad).filter(Boolean)).size,
      total_donantes: demoRecords.donante.length,
      stock_inventario: demoRecords.lote_inventario.reduce((sum, row) => sum + Number(row.stock_actual || 0), 0)
    },
    topCities: Object.entries(cityTotals)
      .map(([ciudad, total]) => ({ ciudad, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
    recentDeliveries: [...demoEntregas].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, 10)
  };
}

export function getDemoCatalogo(name) {
  return { rows: demoCatalogos[name] || [] };
}

export function listDemoBeneficiarios(input = {}) {
  const rows = demoBeneficiarios.filter((row) => {
    if (!contains(row, ['nombre_completo', 'documento', 'correo'], input.q)) return false;
    if (input.cityId && row.municipio_id !== String(input.cityId)) return false;
    if (input.populationTypeId && row.tipo_poblacion_id !== String(input.populationTypeId)) return false;
    if (input.source && row.origen !== String(input.source)) return false;
    if (input.helpTypeId && !demoEntregas.some((delivery) => delivery.beneficiario_id === row.id && delivery.tipo_ayuda_id === String(input.helpTypeId))) return false;
    return true;
  });

  return page(rows, normalizeLimit(input.limit), normalizeOffset(input.offset));
}

export function createDemoBeneficiario(body = {}) {
  const nextId = demoBeneficiarios.filter((row) => row.origen === 'ayudas_sociales').length + 1;
  const city = demoCatalogos.ciudades.find((item) => item.id === `ayudas:${body.id_municipio}` || item.id === String(body.id_municipio));
  const population = demoCatalogos.tiposPoblacion.find((item) => String(item.id) === String(body.id_tipo_poblacion));
  const row = {
    id: `ayudas:${nextId}`,
    origen: 'ayudas_sociales',
    id_original: String(nextId),
    documento: body.documento,
    nombre_completo: `${body.nombres || ''} ${body.apellidos || ''}`.trim(),
    telefono: body.telefono || null,
    correo: body.correo || null,
    municipio_id: city?.id || null,
    ciudad: city?.nombre || null,
    departamento: city?.departamento || null,
    tipo_poblacion_id: body.id_tipo_poblacion ? String(body.id_tipo_poblacion) : null,
    tipo_poblacion: population?.nombre || null,
    created_at: new Date().toISOString()
  };
  demoBeneficiarios.push(row);
  return row;
}

export function updateDemoBeneficiario(id, body = {}) {
  const row = demoBeneficiarios.find((item) => item.id === `ayudas:${id}` || item.id_original === String(id));
  if (!row) return null;
  row.documento = body.documento || row.documento;
  row.nombre_completo = `${body.nombres || row.nombre_completo} ${body.apellidos || ''}`.trim();
  row.telefono = body.telefono || row.telefono;
  row.correo = body.correo || row.correo;
  return row;
}

export function deleteDemoBeneficiario(id) {
  const index = demoBeneficiarios.findIndex((item) => item.id === `ayudas:${id}` || item.id_original === String(id));
  if (index === -1) return false;
  demoBeneficiarios.splice(index, 1);
  return true;
}

export function listDemoColaboradores(input = {}) {
  const rows = demoColaboradores.filter((row) => contains(row, ['documento', 'nombres', 'apellidos', 'correo'], input.q));
  return { rows, total: rows.length };
}

export function createDemoColaborador(body = {}) {
  const nextId = Math.max(0, ...demoColaboradores.map((row) => row.id_colaborador)) + 1;
  const cargo = demoCatalogos.cargos.find((item) => String(item.id) === String(body.id_cargo));
  const row = {
    id_colaborador: nextId,
    documento: body.documento,
    nombres: body.nombres,
    apellidos: body.apellidos || '',
    telefono: body.telefono || null,
    correo: body.correo || null,
    id_cargo: body.id_cargo || null,
    cargo: cargo?.nombre || null,
    activo: body.activo ?? true
  };
  demoColaboradores.push(row);
  return row;
}

export function updateDemoColaborador(id, body = {}) {
  const row = demoColaboradores.find((item) => String(item.id_colaborador) === String(id));
  if (!row) return null;
  Object.assign(row, Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== '')));
  return row;
}

export function deleteDemoColaborador(id) {
  const index = demoColaboradores.findIndex((item) => String(item.id_colaborador) === String(id));
  if (index === -1) return false;
  demoColaboradores.splice(index, 1);
  return true;
}

export function listDemoEntregas(input = {}) {
  const rows = demoEntregas.filter((row) => {
    if (!contains(row, ['beneficiario', 'documento', 'tipo_ayuda', 'colaborador'], input.q)) return false;
    if (input.cityId && row.municipio_id !== String(input.cityId)) return false;
    if (input.helpTypeId && row.tipo_ayuda_id !== String(input.helpTypeId)) return false;
    if (input.source && row.origen !== String(input.source)) return false;
    if (input.populationTypeId) {
      const beneficiary = demoBeneficiarios.find((item) => item.id === row.beneficiario_id);
      if (beneficiary?.tipo_poblacion_id !== String(input.populationTypeId)) return false;
    }
    return true;
  });
  return page(rows.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))), normalizeLimit(input.limit), normalizeOffset(input.offset));
}

export function createDemoEntrega(body = {}) {
  const nextId = demoEntregas.filter((row) => row.origen === 'ayudas_sociales').length + 1;
  const beneficiary = demoBeneficiarios.find((item) => item.id === String(body.id_beneficiario || body.beneficiario_id));
  const city = demoCatalogos.ciudades.find((item) => item.id === String(body.id_municipio || body.municipio_id));
  const worker = demoColaboradores.find((item) => String(item.id_colaborador) === String(body.id_colaborador));
  const helpType = demoCatalogos.tiposAyuda.find((item) => item.id === String(body.id_tipo_ayuda || body.tipo_ayuda_id));
  const row = {
    id: `ayudas:${nextId}`,
    origen: 'ayudas_sociales',
    id_original: String(nextId),
    beneficiario_id: beneficiary?.id || String(body.id_beneficiario || body.beneficiario_id),
    beneficiario: beneficiary?.nombre_completo || 'Beneficiario demo',
    documento: beneficiary?.documento || '',
    municipio_id: city?.id || String(body.id_municipio || body.municipio_id),
    ciudad: city?.nombre || null,
    departamento: city?.departamento || null,
    colaborador: worker ? `${worker.nombres} ${worker.apellidos}`.trim() : null,
    tipo_ayuda_id: helpType?.id || String(body.id_tipo_ayuda || body.tipo_ayuda_id),
    tipo_ayuda: helpType?.nombre || 'Ayuda demo',
    fecha: body.fecha_entrega || new Date().toISOString().slice(0, 10),
    cantidad: body.cantidad || 1,
    observacion: body.observacion || null
  };
  demoEntregas.push(row);
  return row;
}

export function updateDemoEntrega(id, body = {}) {
  const row = demoEntregas.find((item) => item.id === `ayudas:${id}` || item.id_original === String(id));
  if (!row) return null;
  row.fecha = body.fecha_entrega || row.fecha;
  row.cantidad = body.cantidad || row.cantidad;
  row.observacion = body.observacion || row.observacion;
  return row;
}

export function deleteDemoEntrega(id) {
  const index = demoEntregas.findIndex((item) => item.id === `ayudas:${id}` || item.id_original === String(id));
  if (index === -1) return false;
  demoEntregas.splice(index, 1);
  return true;
}

export function listDemoRecords(entity, input = {}) {
  const rows = (demoRecords[entity.table] || demoRecords[entity.key] || []).filter((row) => {
    if (!contains(row, entity.searchFields || [], input.q)) return false;
    for (const [field, value] of Object.entries(input.filters || {})) {
      if (value !== undefined && value !== null && value !== '' && String(row[field]) !== String(value)) return false;
    }
    return true;
  });

  return page(rows, normalizeLimit(input.limit), normalizeOffset(input.offset));
}

export function getDemoRecordById(entity, id) {
  return (demoRecords[entity.table] || []).find((row) => String(row[entity.pk]) === String(id)) || null;
}
