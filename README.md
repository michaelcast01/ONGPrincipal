# Conjunto ONG

Aplicativo full-stack que interconecta dos sistemas de una ONG en una sola experiencia:

- Modulo de ayudas sociales: beneficiarios, colaboradores, catalogos y entregas.
- Modulo operativo: donantes, donaciones, inventario, misiones, entregas, usuarios, roles y auditoria.

La integracion se hace en PostgreSQL/Supabase con dos esquemas separados y vistas de consulta unificada.

## Tecnologia

- Frontend: Vue 3, Vite, Vue Router y Fetch API.
- Backend: Node.js, Express, pg, JWT y Swagger.
- Base de datos: PostgreSQL/Supabase.

## Estructura

```text
backend/       API unificada Express
frontend/      Aplicacion Vue
database/      SQL y seed para Supabase/PostgreSQL
```

## Configuracion

1. Copia `backend/.env.example` como `backend/.env`.
2. Ajusta las variables de conexion a Supabase/PostgreSQL.
3. Instala dependencias:

```bash
npm run install:all
```

4. Crea la base de datos inicial:

```bash
npm run seed
```

5. Ejecuta backend y frontend:

```bash
npm run dev
```

Servicios esperados:

- Backend: `http://localhost:3100`
- Frontend: `http://localhost:5173`
- Swagger: `http://localhost:3100/api/docs`

## Usuarios iniciales

- `admin / admin123`
- `gestor / admin123`

El backend tambien permite login estatico por `.env`, por lo que el usuario `admin` funciona aunque la base aun no este disponible.

## Modo demo sin base de datos

`backend/.env` trae `DEMO_FALLBACK=true`. Si PostgreSQL/Supabase no esta configurado o no responde, el backend entrega datos demo para que puedas entrar y navegar sin errores `500`.

Cuando conectes la base real y ejecutes `npm run seed`, puedes dejarlo activo o cambiarlo a:

```env
DEMO_FALLBACK=false
```

## Integracion de datos

La base crea tres esquemas:

- `ayudas_sociales`: modelo del primer sistema.
- `ong_operativa`: modelo del segundo sistema.
- `integracion`: vistas para consultar ambos sistemas como una sola fuente.

Vistas principales:

- `integracion.v_beneficiarios`
- `integracion.v_entregas`
- `integracion.v_departamentos`
- `integracion.v_ciudades`
- `integracion.v_tipos_ayuda`

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
