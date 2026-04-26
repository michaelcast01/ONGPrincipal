CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP SCHEMA IF EXISTS integracion CASCADE;
DROP SCHEMA IF EXISTS ayudas_sociales CASCADE;
DROP SCHEMA IF EXISTS ong_operativa CASCADE;

CREATE SCHEMA ayudas_sociales;
CREATE SCHEMA ong_operativa;
CREATE SCHEMA integracion;

CREATE TABLE ayudas_sociales.departamento (
  id_departamento SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE ayudas_sociales.municipio (
  id_municipio SERIAL PRIMARY KEY,
  id_departamento INTEGER NOT NULL REFERENCES ayudas_sociales.departamento(id_departamento),
  nombre VARCHAR(120) NOT NULL,
  UNIQUE (id_departamento, nombre)
);

CREATE TABLE ayudas_sociales.tipo_poblacion (
  id_tipo_poblacion SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE ayudas_sociales.beneficiario (
  id_beneficiario SERIAL PRIMARY KEY,
  documento VARCHAR(40) NOT NULL UNIQUE,
  nombres VARCHAR(140) NOT NULL,
  apellidos VARCHAR(140) NOT NULL DEFAULT '',
  fecha_nacimiento DATE,
  genero VARCHAR(40),
  telefono VARCHAR(60),
  correo VARCHAR(160),
  id_municipio INTEGER REFERENCES ayudas_sociales.municipio(id_municipio),
  id_tipo_poblacion INTEGER REFERENCES ayudas_sociales.tipo_poblacion(id_tipo_poblacion),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ayudas_sociales.cargo (
  id_cargo SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE ayudas_sociales.colaborador (
  id_colaborador SERIAL PRIMARY KEY,
  documento VARCHAR(40) NOT NULL UNIQUE,
  nombres VARCHAR(140) NOT NULL,
  apellidos VARCHAR(140) NOT NULL DEFAULT '',
  telefono VARCHAR(60),
  correo VARCHAR(160),
  id_cargo INTEGER REFERENCES ayudas_sociales.cargo(id_cargo),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ayudas_sociales.tipo_ayuda (
  id_tipo_ayuda SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE ayudas_sociales.entrega_ayuda (
  id_entrega SERIAL PRIMARY KEY,
  id_beneficiario INTEGER NOT NULL REFERENCES ayudas_sociales.beneficiario(id_beneficiario) ON DELETE CASCADE,
  id_municipio INTEGER NOT NULL REFERENCES ayudas_sociales.municipio(id_municipio),
  id_colaborador INTEGER NOT NULL REFERENCES ayudas_sociales.colaborador(id_colaborador),
  id_tipo_ayuda INTEGER NOT NULL REFERENCES ayudas_sociales.tipo_ayuda(id_tipo_ayuda),
  fecha_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
  cantidad NUMERIC(12,2) NOT NULL DEFAULT 1,
  observacion TEXT
);

CREATE TABLE ong_operativa.rol (
  id_rol SERIAL PRIMARY KEY,
  codigo VARCHAR(60) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT
);

CREATE TABLE ong_operativa.permiso (
  id_permiso SERIAL PRIMARY KEY,
  codigo VARCHAR(80) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT
);

CREATE TABLE ong_operativa.usuario (
  id_usuario SERIAL PRIMARY KEY,
  usuario VARCHAR(80) NOT NULL UNIQUE,
  nombre VARCHAR(160) NOT NULL,
  correo VARCHAR(160),
  contrasena_hash TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ong_operativa.usuario_rol (
  id_usuario_rol SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES ong_operativa.usuario(id_usuario) ON DELETE CASCADE,
  id_rol INTEGER NOT NULL REFERENCES ong_operativa.rol(id_rol) ON DELETE CASCADE,
  UNIQUE (id_usuario, id_rol)
);

CREATE TABLE ong_operativa.rol_permiso (
  id_rol_permiso SERIAL PRIMARY KEY,
  id_rol INTEGER NOT NULL REFERENCES ong_operativa.rol(id_rol) ON DELETE CASCADE,
  id_permiso INTEGER NOT NULL REFERENCES ong_operativa.permiso(id_permiso) ON DELETE CASCADE,
  UNIQUE (id_rol, id_permiso)
);

CREATE TABLE ong_operativa.bitacora_auditoria (
  id_bitacora SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES ong_operativa.usuario(id_usuario),
  accion VARCHAR(120) NOT NULL,
  tabla_afectada VARCHAR(120),
  registro_id VARCHAR(80),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  detalle TEXT
);

CREATE TABLE ong_operativa.beneficiario (
  id_beneficiario SERIAL PRIMARY KEY,
  tipo_documento VARCHAR(40) NOT NULL DEFAULT 'CC',
  numero_documento VARCHAR(40) NOT NULL UNIQUE,
  nombres VARCHAR(140) NOT NULL,
  apellidos VARCHAR(140) NOT NULL DEFAULT '',
  fecha_nacimiento DATE,
  genero VARCHAR(40),
  telefono VARCHAR(60),
  correo VARCHAR(160),
  sisben VARCHAR(40),
  pertenencia_etnica VARCHAR(120),
  discapacidad BOOLEAN NOT NULL DEFAULT FALSE,
  consentimiento_datos BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ong_operativa.acudiente (
  id_acudiente SERIAL PRIMARY KEY,
  id_beneficiario INTEGER NOT NULL REFERENCES ong_operativa.beneficiario(id_beneficiario) ON DELETE CASCADE,
  nombres VARCHAR(140) NOT NULL,
  apellidos VARCHAR(140) NOT NULL DEFAULT '',
  parentesco VARCHAR(80),
  telefono VARCHAR(60),
  correo VARCHAR(160)
);

CREATE TABLE ong_operativa.documento_soporte (
  id_documento SERIAL PRIMARY KEY,
  id_beneficiario INTEGER NOT NULL REFERENCES ong_operativa.beneficiario(id_beneficiario) ON DELETE CASCADE,
  tipo_documento VARCHAR(120) NOT NULL,
  url_archivo TEXT,
  observacion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ong_operativa.direccion_ubicacion (
  id_direccion SERIAL PRIMARY KEY,
  id_beneficiario INTEGER NOT NULL REFERENCES ong_operativa.beneficiario(id_beneficiario) ON DELETE CASCADE,
  departamento VARCHAR(120) NOT NULL,
  municipio VARCHAR(120) NOT NULL,
  barrio VARCHAR(120),
  direccion VARCHAR(200),
  zona VARCHAR(40) NOT NULL DEFAULT 'urbana',
  principal BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ong_operativa.donante (
  id_donante SERIAL PRIMARY KEY,
  tipo_donante VARCHAR(80) NOT NULL,
  nombre VARCHAR(180) NOT NULL,
  documento VARCHAR(60),
  telefono VARCHAR(60),
  correo VARCHAR(160),
  anonimo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ong_operativa.donacion (
  id_donacion SERIAL PRIMARY KEY,
  id_donante INTEGER REFERENCES ong_operativa.donante(id_donante),
  tipo_donacion VARCHAR(80) NOT NULL,
  descripcion TEXT,
  valor_estimado NUMERIC(14,2) NOT NULL DEFAULT 0,
  fecha_donacion DATE NOT NULL DEFAULT CURRENT_DATE,
  soporte TEXT
);

CREATE TABLE ong_operativa.vehiculo (
  id_vehiculo SERIAL PRIMARY KEY,
  placa VARCHAR(20) NOT NULL UNIQUE,
  tipo VARCHAR(80),
  marca VARCHAR(80),
  modelo VARCHAR(80),
  capacidad NUMERIC(12,2),
  estado VARCHAR(40) NOT NULL DEFAULT 'disponible'
);

CREATE TABLE ong_operativa.conductor (
  id_conductor SERIAL PRIMARY KEY,
  nombres VARCHAR(140) NOT NULL,
  apellidos VARCHAR(140) NOT NULL DEFAULT '',
  documento VARCHAR(40) NOT NULL UNIQUE,
  telefono VARCHAR(60),
  licencia VARCHAR(80),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ong_operativa.mision_operativa (
  id_mision SERIAL PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT,
  departamento VARCHAR(120) NOT NULL,
  municipio VARCHAR(120) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado VARCHAR(60) NOT NULL DEFAULT 'programada'
);

CREATE TABLE ong_operativa.recurso_mision (
  id_recurso SERIAL PRIMARY KEY,
  id_mision INTEGER NOT NULL REFERENCES ong_operativa.mision_operativa(id_mision) ON DELETE CASCADE,
  id_usuario INTEGER REFERENCES ong_operativa.usuario(id_usuario),
  id_vehiculo INTEGER REFERENCES ong_operativa.vehiculo(id_vehiculo),
  id_conductor INTEGER REFERENCES ong_operativa.conductor(id_conductor),
  rol_operativo VARCHAR(120)
);

CREATE TABLE ong_operativa.item_inventario (
  id_item SERIAL PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  categoria VARCHAR(120) NOT NULL,
  unidad_medida VARCHAR(40) NOT NULL DEFAULT 'unidad',
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ong_operativa.lote_inventario (
  id_lote SERIAL PRIMARY KEY,
  id_item INTEGER NOT NULL REFERENCES ong_operativa.item_inventario(id_item),
  id_donacion INTEGER REFERENCES ong_operativa.donacion(id_donacion),
  codigo_lote VARCHAR(80) NOT NULL UNIQUE,
  fecha_vencimiento DATE,
  cantidad_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
  ubicacion VARCHAR(160)
);

CREATE TABLE ong_operativa.entrega_encabezado (
  id_entrega SERIAL PRIMARY KEY,
  id_mision INTEGER REFERENCES ong_operativa.mision_operativa(id_mision),
  id_beneficiario INTEGER NOT NULL REFERENCES ong_operativa.beneficiario(id_beneficiario),
  id_usuario_responsable INTEGER REFERENCES ong_operativa.usuario(id_usuario),
  fecha_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
  observacion TEXT,
  estado VARCHAR(60) NOT NULL DEFAULT 'registrada'
);

CREATE TABLE ong_operativa.entrega_detalle (
  id_detalle SERIAL PRIMARY KEY,
  id_entrega INTEGER NOT NULL REFERENCES ong_operativa.entrega_encabezado(id_entrega) ON DELETE CASCADE,
  id_lote INTEGER NOT NULL REFERENCES ong_operativa.lote_inventario(id_lote),
  cantidad NUMERIC(12,2) NOT NULL
);

CREATE TABLE ong_operativa.gasto_logistico (
  id_gasto SERIAL PRIMARY KEY,
  id_mision INTEGER NOT NULL REFERENCES ong_operativa.mision_operativa(id_mision) ON DELETE CASCADE,
  tipo_gasto VARCHAR(120) NOT NULL,
  descripcion TEXT,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  fecha_gasto DATE NOT NULL DEFAULT CURRENT_DATE,
  soporte TEXT
);

INSERT INTO ayudas_sociales.departamento (nombre) VALUES
  ('Antioquia'), ('Cundinamarca'), ('Valle del Cauca');

INSERT INTO ayudas_sociales.municipio (id_departamento, nombre) VALUES
  (1, 'Medellin'), (1, 'Bello'), (2, 'Bogota'), (3, 'Cali'), (3, 'Palmira');

INSERT INTO ayudas_sociales.tipo_poblacion (nombre) VALUES
  ('Adulto mayor'), ('Madre cabeza de hogar'), ('Ninez'), ('Victima del conflicto'), ('Discapacidad');

INSERT INTO ayudas_sociales.cargo (nombre) VALUES
  ('Coordinador'), ('Voluntario'), ('Logistica'), ('Trabajador social');

INSERT INTO ayudas_sociales.tipo_ayuda (nombre, descripcion) VALUES
  ('Mercado familiar', 'Paquete alimentario basico'),
  ('Kit de aseo', 'Elementos de higiene'),
  ('Apoyo monetario', 'Transferencia o efectivo'),
  ('Ropa y abrigo', 'Prendas y cobijas');

INSERT INTO ayudas_sociales.beneficiario (documento, nombres, apellidos, fecha_nacimiento, genero, telefono, correo, id_municipio, id_tipo_poblacion) VALUES
  ('1001001001', 'Ana Maria', 'Lopez', '1950-04-10', 'Femenino', '3001112233', 'ana@example.org', 1, 1),
  ('1001001002', 'Carlos', 'Ramirez', '1984-07-22', 'Masculino', '3002223344', 'carlos@example.org', 3, 4),
  ('1001001003', 'Luisa Fernanda', 'Gomez', '1991-01-15', 'Femenino', '3003334455', 'luisa@example.org', 4, 2),
  ('1001001004', 'Mateo', 'Hernandez', '2015-09-03', 'Masculino', '3004445566', 'mateo@example.org', 2, 3);

INSERT INTO ayudas_sociales.colaborador (documento, nombres, apellidos, telefono, correo, id_cargo) VALUES
  ('9001', 'Sofia', 'Restrepo', '3101112233', 'sofia@ong.org', 1),
  ('9002', 'Andres', 'Molina', '3102223344', 'andres@ong.org', 2),
  ('9003', 'Paula', 'Vargas', '3103334455', 'paula@ong.org', 3);

INSERT INTO ayudas_sociales.entrega_ayuda (id_beneficiario, id_municipio, id_colaborador, id_tipo_ayuda, fecha_entrega, cantidad, observacion) VALUES
  (1, 1, 1, 1, CURRENT_DATE - INTERVAL '1 day', 1, 'Entrega domiciliaria'),
  (2, 3, 2, 3, CURRENT_DATE - INTERVAL '3 days', 150000, 'Apoyo emergencia'),
  (3, 4, 3, 2, CURRENT_DATE - INTERVAL '5 days', 2, 'Jornada comunitaria'),
  (4, 2, 1, 4, CURRENT_DATE - INTERVAL '8 days', 1, 'Kit escolar y abrigo');

INSERT INTO ong_operativa.rol (codigo, nombre, descripcion) VALUES
  ('admin', 'Administrador', 'Acceso total'),
  ('gestor', 'Gestor operativo', 'Consulta y operacion basica');

INSERT INTO ong_operativa.permiso (codigo, nombre, descripcion) VALUES
  ('records.read', 'Consultar registros', 'Permite consultar tablas'),
  ('dashboard.read', 'Consultar dashboard', 'Permite ver metricas'),
  ('ayudas.write', 'Gestionar ayudas', 'Permite crear registros del modulo ayudas');

INSERT INTO ong_operativa.usuario (usuario, nombre, correo, contrasena_hash) VALUES
  ('admin', 'Administrador', 'admin@ong.org', crypt('admin123', gen_salt('bf'))),
  ('gestor', 'Gestor Operativo', 'gestor@ong.org', crypt('admin123', gen_salt('bf')));

INSERT INTO ong_operativa.usuario_rol (id_usuario, id_rol) VALUES
  (1, 1), (2, 2);

INSERT INTO ong_operativa.rol_permiso (id_rol, id_permiso) VALUES
  (1, 1), (1, 2), (1, 3), (2, 1), (2, 2);

INSERT INTO ong_operativa.beneficiario (tipo_documento, numero_documento, nombres, apellidos, fecha_nacimiento, genero, telefono, correo, sisben, pertenencia_etnica, discapacidad) VALUES
  ('CC', '2002002001', 'Diana', 'Martinez', '1978-05-20', 'Femenino', '3011112233', 'diana@example.org', 'B2', 'Ninguna', FALSE),
  ('TI', '2002002002', 'Samuel', 'Torres', '2012-11-02', 'Masculino', '3012223344', 'samuel@example.org', 'A1', 'Ninguna', FALSE),
  ('CC', '2002002003', 'Jose', 'Quintero', '1965-08-14', 'Masculino', '3013334455', 'jose@example.org', 'A2', 'Indigena', TRUE);

INSERT INTO ong_operativa.direccion_ubicacion (id_beneficiario, departamento, municipio, barrio, direccion, zona, principal) VALUES
  (1, 'Antioquia', 'Medellin', 'Buenos Aires', 'Calle 10 #20-30', 'urbana', TRUE),
  (2, 'Cundinamarca', 'Bogota', 'Bosa', 'Carrera 80 #15-20', 'urbana', TRUE),
  (3, 'Valle del Cauca', 'Cali', 'Siloé', 'Calle 5 #12-40', 'urbana', TRUE);

INSERT INTO ong_operativa.acudiente (id_beneficiario, nombres, apellidos, parentesco, telefono, correo) VALUES
  (2, 'Martha', 'Torres', 'Madre', '3019998877', 'martha@example.org');

INSERT INTO ong_operativa.documento_soporte (id_beneficiario, tipo_documento, url_archivo, observacion) VALUES
  (1, 'Cedula', 'https://example.org/docs/diana.pdf', 'Documento validado'),
  (2, 'Registro civil', 'https://example.org/docs/samuel.pdf', 'Menor de edad');

INSERT INTO ong_operativa.donante (tipo_donante, nombre, documento, telefono, correo, anonimo) VALUES
  ('Juridica', 'Fundacion Aliada', 'NIT900100200', '6041112233', 'contacto@aliada.org', FALSE),
  ('Natural', 'Donante Solidario', '3003003001', '3021112233', 'donante@example.org', FALSE);

INSERT INTO ong_operativa.donacion (id_donante, tipo_donacion, descripcion, valor_estimado, fecha_donacion, soporte) VALUES
  (1, 'Fisica', 'Kits alimentarios', 4500000, CURRENT_DATE - INTERVAL '20 days', 'ACTA-001'),
  (2, 'Monetaria', 'Aporte para logistica', 1200000, CURRENT_DATE - INTERVAL '15 days', 'TRX-001');

INSERT INTO ong_operativa.vehiculo (placa, tipo, marca, modelo, capacidad, estado) VALUES
  ('ONG123', 'Camioneta', 'Renault', 'Duster', 500, 'disponible'),
  ('ONG456', 'Furgon', 'Chevrolet', 'N300', 900, 'disponible');

INSERT INTO ong_operativa.conductor (nombres, apellidos, documento, telefono, licencia) VALUES
  ('Hector', 'Cano', '7001001', '3031112233', 'C2'),
  ('Liliana', 'Perez', '7001002', '3032223344', 'B1');

INSERT INTO ong_operativa.mision_operativa (nombre, descripcion, departamento, municipio, fecha_inicio, fecha_fin, estado) VALUES
  ('Jornada Medellin', 'Entrega de kits alimentarios', 'Antioquia', 'Medellin', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '7 days', 'cerrada'),
  ('Jornada Bogota', 'Atencion a familias priorizadas', 'Cundinamarca', 'Bogota', CURRENT_DATE - INTERVAL '2 days', NULL, 'en curso');

INSERT INTO ong_operativa.recurso_mision (id_mision, id_usuario, id_vehiculo, id_conductor, rol_operativo) VALUES
  (1, 2, 1, 1, 'Coordinacion'),
  (2, 2, 2, 2, 'Entrega');

INSERT INTO ong_operativa.item_inventario (nombre, categoria, unidad_medida, descripcion) VALUES
  ('Kit alimentario', 'Alimentos', 'unidad', 'Mercado para una familia'),
  ('Cobija termica', 'Abrigo', 'unidad', 'Cobija individual'),
  ('Kit aseo', 'Higiene', 'unidad', 'Elementos de aseo personal');

INSERT INTO ong_operativa.lote_inventario (id_item, id_donacion, codigo_lote, fecha_vencimiento, cantidad_inicial, stock_actual, ubicacion) VALUES
  (1, 1, 'LOT-ALI-001', CURRENT_DATE + INTERVAL '90 days', 100, 84, 'Bodega principal'),
  (2, 1, 'LOT-ABR-001', NULL, 60, 51, 'Bodega principal'),
  (3, 1, 'LOT-ASE-001', CURRENT_DATE + INTERVAL '180 days', 80, 75, 'Bodega norte');

INSERT INTO ong_operativa.entrega_encabezado (id_mision, id_beneficiario, id_usuario_responsable, fecha_entrega, observacion, estado) VALUES
  (1, 1, 2, CURRENT_DATE - INTERVAL '7 days', 'Entrega completa', 'registrada'),
  (2, 2, 2, CURRENT_DATE - INTERVAL '2 days', 'Pendiente seguimiento', 'registrada'),
  (2, 3, 2, CURRENT_DATE - INTERVAL '1 day', 'Apoyo prioritario', 'registrada');

INSERT INTO ong_operativa.entrega_detalle (id_entrega, id_lote, cantidad) VALUES
  (1, 1, 1),
  (1, 2, 1),
  (2, 1, 1),
  (3, 3, 1);

INSERT INTO ong_operativa.gasto_logistico (id_mision, tipo_gasto, descripcion, valor, fecha_gasto, soporte) VALUES
  (1, 'Combustible', 'Tanqueo ruta Medellin', 180000, CURRENT_DATE - INTERVAL '7 days', 'REC-001'),
  (2, 'Peajes', 'Ruta de distribucion', 60000, CURRENT_DATE - INTERVAL '2 days', 'REC-002');

CREATE VIEW integracion.v_departamentos AS
SELECT ('ayudas:' || d.id_departamento)::text AS id,
       d.nombre,
       'ayudas_sociales'::text AS origen
  FROM ayudas_sociales.departamento d
UNION
SELECT ('ong:' || lower(replace(du.departamento, ' ', '_')))::text AS id,
       du.departamento AS nombre,
       'ong_operativa'::text AS origen
  FROM ong_operativa.direccion_ubicacion du
 GROUP BY du.departamento;

CREATE VIEW integracion.v_ciudades AS
SELECT ('ayudas:' || m.id_municipio)::text AS id,
       m.nombre,
       d.nombre AS departamento,
       'ayudas_sociales'::text AS origen
  FROM ayudas_sociales.municipio m
  JOIN ayudas_sociales.departamento d ON d.id_departamento = m.id_departamento
UNION
SELECT ('ong:' || lower(replace(du.municipio, ' ', '_')))::text AS id,
       du.municipio AS nombre,
       du.departamento,
       'ong_operativa'::text AS origen
  FROM ong_operativa.direccion_ubicacion du
 GROUP BY du.municipio, du.departamento;

CREATE VIEW integracion.v_tipos_ayuda AS
SELECT ('ayudas:' || ta.id_tipo_ayuda)::text AS id,
       ta.nombre,
       'ayudas_sociales'::text AS origen
  FROM ayudas_sociales.tipo_ayuda ta
UNION
SELECT ('ong:' || ii.id_item)::text AS id,
       ii.nombre,
       'ong_operativa'::text AS origen
  FROM ong_operativa.item_inventario ii;

CREATE VIEW integracion.v_beneficiarios AS
SELECT ('ayudas:' || b.id_beneficiario)::text AS id,
       'ayudas_sociales'::text AS origen,
       b.id_beneficiario::text AS id_original,
       b.documento,
       trim(b.nombres || ' ' || b.apellidos) AS nombre_completo,
       b.telefono,
       b.correo,
       ('ayudas:' || m.id_municipio)::text AS municipio_id,
       m.nombre AS ciudad,
       d.nombre AS departamento,
       b.id_tipo_poblacion::text AS tipo_poblacion_id,
       tp.nombre AS tipo_poblacion,
       b.created_at
  FROM ayudas_sociales.beneficiario b
  LEFT JOIN ayudas_sociales.municipio m ON m.id_municipio = b.id_municipio
  LEFT JOIN ayudas_sociales.departamento d ON d.id_departamento = m.id_departamento
  LEFT JOIN ayudas_sociales.tipo_poblacion tp ON tp.id_tipo_poblacion = b.id_tipo_poblacion
UNION ALL
SELECT ('ong:' || b.id_beneficiario)::text AS id,
       'ong_operativa'::text AS origen,
       b.id_beneficiario::text AS id_original,
       b.numero_documento AS documento,
       trim(b.nombres || ' ' || b.apellidos) AS nombre_completo,
       b.telefono,
       b.correo,
       CASE WHEN du.municipio IS NULL THEN NULL ELSE ('ong:' || lower(replace(du.municipio, ' ', '_'))) END AS municipio_id,
       du.municipio AS ciudad,
       du.departamento,
       NULL::text AS tipo_poblacion_id,
       COALESCE(NULLIF(b.pertenencia_etnica, ''), 'General') AS tipo_poblacion,
       b.created_at
  FROM ong_operativa.beneficiario b
  LEFT JOIN LATERAL (
    SELECT departamento, municipio
      FROM ong_operativa.direccion_ubicacion du
     WHERE du.id_beneficiario = b.id_beneficiario
     ORDER BY du.principal DESC, du.id_direccion ASC
     LIMIT 1
  ) du ON TRUE;

CREATE VIEW integracion.v_entregas AS
SELECT ('ayudas:' || ea.id_entrega)::text AS id,
       'ayudas_sociales'::text AS origen,
       ea.id_entrega::text AS id_original,
       ('ayudas:' || b.id_beneficiario)::text AS beneficiario_id,
       trim(b.nombres || ' ' || b.apellidos) AS beneficiario,
       b.documento,
       ('ayudas:' || m.id_municipio)::text AS municipio_id,
       m.nombre AS ciudad,
       d.nombre AS departamento,
       trim(c.nombres || ' ' || c.apellidos) AS colaborador,
       ('ayudas:' || ta.id_tipo_ayuda)::text AS tipo_ayuda_id,
       ta.nombre AS tipo_ayuda,
       ea.fecha_entrega AS fecha,
       ea.cantidad,
       ea.observacion
  FROM ayudas_sociales.entrega_ayuda ea
  JOIN ayudas_sociales.beneficiario b ON b.id_beneficiario = ea.id_beneficiario
  JOIN ayudas_sociales.municipio m ON m.id_municipio = ea.id_municipio
  JOIN ayudas_sociales.departamento d ON d.id_departamento = m.id_departamento
  JOIN ayudas_sociales.colaborador c ON c.id_colaborador = ea.id_colaborador
  JOIN ayudas_sociales.tipo_ayuda ta ON ta.id_tipo_ayuda = ea.id_tipo_ayuda
UNION ALL
SELECT ('ong:' || ee.id_entrega || ':' || ed.id_detalle)::text AS id,
       'ong_operativa'::text AS origen,
       ed.id_detalle::text AS id_original,
       ('ong:' || b.id_beneficiario)::text AS beneficiario_id,
       trim(b.nombres || ' ' || b.apellidos) AS beneficiario,
       b.numero_documento AS documento,
       CASE WHEN COALESCE(du.municipio, mo.municipio) IS NULL THEN NULL ELSE ('ong:' || lower(replace(COALESCE(du.municipio, mo.municipio), ' ', '_'))) END AS municipio_id,
       COALESCE(du.municipio, mo.municipio) AS ciudad,
       COALESCE(du.departamento, mo.departamento) AS departamento,
       u.nombre AS colaborador,
       ('ong:' || ii.id_item)::text AS tipo_ayuda_id,
       ii.nombre AS tipo_ayuda,
       ee.fecha_entrega AS fecha,
       ed.cantidad,
       ee.observacion
  FROM ong_operativa.entrega_detalle ed
  JOIN ong_operativa.entrega_encabezado ee ON ee.id_entrega = ed.id_entrega
  JOIN ong_operativa.beneficiario b ON b.id_beneficiario = ee.id_beneficiario
  JOIN ong_operativa.lote_inventario li ON li.id_lote = ed.id_lote
  JOIN ong_operativa.item_inventario ii ON ii.id_item = li.id_item
  LEFT JOIN ong_operativa.usuario u ON u.id_usuario = ee.id_usuario_responsable
  LEFT JOIN ong_operativa.mision_operativa mo ON mo.id_mision = ee.id_mision
  LEFT JOIN LATERAL (
    SELECT departamento, municipio
      FROM ong_operativa.direccion_ubicacion du
     WHERE du.id_beneficiario = b.id_beneficiario
     ORDER BY du.principal DESC, du.id_direccion ASC
     LIMIT 1
  ) du ON TRUE;
