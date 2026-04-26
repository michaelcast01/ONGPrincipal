# Conjunto ONG

Aplicativo full-stack que interconecta dos APIs existentes de una ONG en una sola experiencia:

- Modulo de ayudas sociales: beneficiarios, colaboradores, catalogos y entregas.
- Modulo operativo: donantes, donaciones, inventario, misiones, entregas, usuarios, roles y auditoria.

La integracion se hace por HTTP contra la API antigua y la API nueva. Esta app no mantiene una base de datos propia.

## Tecnologia

- Frontend: Vue 3, Vite, Vue Router y Fetch API.
- Backend: Node.js, Express, JWT y Swagger.
- Datos: APIs externas `ONG_ANTIGUA_API_URL` y `ONG_NUEVA_API_URL`.

## Estructura

```text
backend/       API unificada Express y adaptadores HTTP
frontend/      Aplicacion Vue
```

## Configuracion

1. Copia `backend/.env.example` como `backend/.env`.
2. Ajusta las URLs de las APIs existentes.
3. Instala dependencias:

```bash
npm run install:all
```

4. Ejecuta backend y frontend:

```bash
npm run dev
```

Servicios esperados:

- Backend: `http://localhost:3002`
- Frontend: `http://localhost:5175`
- Swagger: `http://localhost:3002/api/docs`

## Usuarios iniciales

- `admin / admin123`
- `gestor / admin123`

El login valida credenciales contra las APIs externas y guarda sus tokens dentro del JWT local. Si necesitas entrar sin APIs externas durante desarrollo, habilita `ALLOW_STATIC_LOGIN=true`.

## APIs externas

Si vas a conectar este aplicativo con los backends existentes, agrega estas variables en `backend/.env`:

```env
ONG_ANTIGUA_API_URL=http://localhost:3000/api
ONG_NUEVA_API_URL=http://localhost:3001/api
```

## Integracion de datos

- La API antigua alimenta beneficiarios, colaboradores, catalogos y entregas de ayudas sociales.
- La API nueva alimenta records/search, metadata y datos operativos.
- Cuando una consulta puede resolverse desde ambas fuentes, el backend intenta la fuente principal y usa la otra como respaldo.
- Las escrituras de ayudas sociales se envian a la API antigua; la API nueva documenta modo solo consulta para `/api/records`.

## API principal

```text
POST /api/auth/login
GET  /api/auth/profile
GET  /api/health
GET  /api/dashboard/summary
GET  /api/catalogos/ciudades
GET  /api/beneficiarios
POST /api/beneficiarios
GET  /api/colaboradores
POST /api/colaboradores
GET  /api/entregas
POST /api/entregas
GET  /api/records/:table
POST /api/search/execute
```

Las rutas de escritura requieren `Authorization: Bearer <token>`.
# ONGPrincipal
