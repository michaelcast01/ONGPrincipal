const entities = {
  rol: {
    schema: 'ong_operativa',
    table: 'rol',
    pk: 'id_rol',
    label: 'Roles',
    category: 'Seguridad',
    columns: ['id_rol', 'codigo', 'nombre', 'descripcion'],
    searchFields: ['codigo', 'nombre']
  },
  permiso: {
    schema: 'ong_operativa',
    table: 'permiso',
    pk: 'id_permiso',
    label: 'Permisos',
    category: 'Seguridad',
    columns: ['id_permiso', 'codigo', 'nombre', 'descripcion'],
    searchFields: ['codigo', 'nombre']
  },
  usuario: {
    schema: 'ong_operativa',
    table: 'usuario',
    pk: 'id_usuario',
    label: 'Usuarios',
    category: 'Seguridad',
    columns: ['id_usuario', 'usuario', 'nombre', 'correo', 'activo', 'created_at'],
    searchFields: ['usuario', 'nombre', 'correo']
  },
  usuario_rol: {
    schema: 'ong_operativa',
    table: 'usuario_rol',
    pk: 'id_usuario_rol',
    label: 'Usuarios y roles',
    category: 'Seguridad',
    columns: ['id_usuario_rol', 'id_usuario', 'id_rol'],
    searchFields: []
  },
  rol_permiso: {
    schema: 'ong_operativa',
    table: 'rol_permiso',
    pk: 'id_rol_permiso',
    label: 'Roles y permisos',
    category: 'Seguridad',
    columns: ['id_rol_permiso', 'id_rol', 'id_permiso'],
    searchFields: []
  },
  bitacora_auditoria: {
    schema: 'ong_operativa',
    table: 'bitacora_auditoria',
    pk: 'id_bitacora',
    label: 'Auditoria',
    category: 'Seguridad',
    columns: ['id_bitacora', 'id_usuario', 'accion', 'tabla_afectada', 'registro_id', 'created_at', 'detalle'],
    searchFields: ['accion', 'tabla_afectada', 'detalle']
  },
  beneficiario: {
    schema: 'ong_operativa',
    table: 'beneficiario',
    pk: 'id_beneficiario',
    label: 'Beneficiarios operativos',
    category: 'Personas',
    columns: ['id_beneficiario', 'tipo_documento', 'numero_documento', 'nombres', 'apellidos', 'fecha_nacimiento', 'genero', 'telefono', 'correo', 'sisben', 'pertenencia_etnica', 'discapacidad', 'consentimiento_datos', 'created_at'],
    searchFields: ['numero_documento', 'nombres', 'apellidos', 'telefono', 'correo']
  },
  acudiente: {
    schema: 'ong_operativa',
    table: 'acudiente',
    pk: 'id_acudiente',
    label: 'Acudientes',
    category: 'Personas',
    columns: ['id_acudiente', 'id_beneficiario', 'nombres', 'apellidos', 'parentesco', 'telefono', 'correo'],
    searchFields: ['nombres', 'apellidos', 'parentesco', 'telefono', 'correo']
  },
  documento_soporte: {
    schema: 'ong_operativa',
    table: 'documento_soporte',
    pk: 'id_documento',
    label: 'Documentos soporte',
    category: 'Personas',
    columns: ['id_documento', 'id_beneficiario', 'tipo_documento', 'url_archivo', 'observacion', 'created_at'],
    searchFields: ['tipo_documento', 'url_archivo', 'observacion']
  },
  direccion_ubicacion: {
    schema: 'ong_operativa',
    table: 'direccion_ubicacion',
    pk: 'id_direccion',
    label: 'Direcciones',
    category: 'Personas',
    columns: ['id_direccion', 'id_beneficiario', 'departamento', 'municipio', 'barrio', 'direccion', 'zona', 'principal'],
    searchFields: ['departamento', 'municipio', 'barrio', 'direccion', 'zona']
  },
  donante: {
    schema: 'ong_operativa',
    table: 'donante',
    pk: 'id_donante',
    label: 'Donantes',
    category: 'Donaciones',
    columns: ['id_donante', 'tipo_donante', 'nombre', 'documento', 'telefono', 'correo', 'anonimo', 'created_at'],
    searchFields: ['nombre', 'documento', 'telefono', 'correo', 'tipo_donante']
  },
  donacion: {
    schema: 'ong_operativa',
    table: 'donacion',
    pk: 'id_donacion',
    label: 'Donaciones',
    category: 'Donaciones',
    columns: ['id_donacion', 'id_donante', 'tipo_donacion', 'descripcion', 'valor_estimado', 'fecha_donacion', 'soporte'],
    searchFields: ['tipo_donacion', 'descripcion', 'soporte']
  },
  mision_operativa: {
    schema: 'ong_operativa',
    table: 'mision_operativa',
    pk: 'id_mision',
    label: 'Misiones operativas',
    category: 'Operaciones',
    columns: ['id_mision', 'nombre', 'descripcion', 'departamento', 'municipio', 'fecha_inicio', 'fecha_fin', 'estado'],
    searchFields: ['nombre', 'descripcion', 'departamento', 'municipio', 'estado']
  },
  recurso_mision: {
    schema: 'ong_operativa',
    table: 'recurso_mision',
    pk: 'id_recurso',
    label: 'Recursos de mision',
    category: 'Operaciones',
    columns: ['id_recurso', 'id_mision', 'id_usuario', 'id_vehiculo', 'id_conductor', 'rol_operativo'],
    searchFields: ['rol_operativo']
  },
  vehiculo: {
    schema: 'ong_operativa',
    table: 'vehiculo',
    pk: 'id_vehiculo',
    label: 'Vehiculos',
    category: 'Operaciones',
    columns: ['id_vehiculo', 'placa', 'tipo', 'marca', 'modelo', 'capacidad', 'estado'],
    searchFields: ['placa', 'tipo', 'marca', 'modelo', 'estado']
  },
  conductor: {
    schema: 'ong_operativa',
    table: 'conductor',
    pk: 'id_conductor',
    label: 'Conductores',
    category: 'Operaciones',
    columns: ['id_conductor', 'nombres', 'apellidos', 'documento', 'telefono', 'licencia', 'activo'],
    searchFields: ['nombres', 'apellidos', 'documento', 'telefono', 'licencia']
  },
  item_inventario: {
    schema: 'ong_operativa',
    table: 'item_inventario',
    pk: 'id_item',
    label: 'Items de inventario',
    category: 'Inventario',
    columns: ['id_item', 'nombre', 'categoria', 'unidad_medida', 'descripcion', 'activo'],
    searchFields: ['nombre', 'categoria', 'unidad_medida', 'descripcion']
  },
  lote_inventario: {
    schema: 'ong_operativa',
    table: 'lote_inventario',
    pk: 'id_lote',
    label: 'Lotes de inventario',
    category: 'Inventario',
    columns: ['id_lote', 'id_item', 'id_donacion', 'codigo_lote', 'fecha_vencimiento', 'cantidad_inicial', 'stock_actual', 'ubicacion'],
    searchFields: ['codigo_lote', 'ubicacion']
  },
  entrega_encabezado: {
    schema: 'ong_operativa',
    table: 'entrega_encabezado',
    pk: 'id_entrega',
    label: 'Entregas operativas',
    category: 'Entregas',
    columns: ['id_entrega', 'id_mision', 'id_beneficiario', 'id_usuario_responsable', 'fecha_entrega', 'observacion', 'estado'],
    searchFields: ['observacion', 'estado']
  },
  entrega_detalle: {
    schema: 'ong_operativa',
    table: 'entrega_detalle',
    pk: 'id_detalle',
    label: 'Detalle de entregas',
    category: 'Entregas',
    columns: ['id_detalle', 'id_entrega', 'id_lote', 'cantidad'],
    searchFields: []
  },
  gasto_logistico: {
    schema: 'ong_operativa',
    table: 'gasto_logistico',
    pk: 'id_gasto',
    label: 'Gastos logisticos',
    category: 'Operaciones',
    columns: ['id_gasto', 'id_mision', 'tipo_gasto', 'descripcion', 'valor', 'fecha_gasto', 'soporte'],
    searchFields: ['tipo_gasto', 'descripcion', 'soporte']
  }
};

export function getEntity(key) {
  return entities[key] || null;
}

export function getEntities() {
  return Object.entries(entities).map(([key, entity]) => ({ key, ...entity }));
}

export function getEntitiesByCategory() {
  return getEntities().reduce((groups, entity) => {
    groups[entity.category] = groups[entity.category] || [];
    groups[entity.category].push(entity);
    return groups;
  }, {});
}
