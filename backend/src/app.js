import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import authRoutes from './routes/auth.js';
import beneficiariosRoutes from './routes/beneficiarios.js';
import catalogosRoutes from './routes/catalogos.js';
import colaboradoresRoutes from './routes/colaboradores.js';
import dashboardRoutes from './routes/dashboard.js';
import entregasRoutes from './routes/entregas.js';
import metaRoutes from './routes/meta.js';
import recordsRoutes from './routes/records.js';
import searchRoutes from './routes/search.js';
import { configuredSources, requestExternal } from './services/externalApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const swaggerDocument = YAML.load(path.resolve(__dirname, '../swagger.yaml'));

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.json({ nombre: 'Conjunto ONG API', version: '1.0.0' });
});

app.get('/api/health', async (_req, res) => {
  const sources = await Promise.allSettled(
    configuredSources().map(async (source) => ({ source, data: await requestExternal(source, '/health') }))
  );

  const apis = sources.map((result) => {
    if (result.status === 'fulfilled') return { source: result.value.source, ok: true, data: result.value.data };
    return { source: result.reason.source, ok: false, error: result.reason.message };
  });
  const ok = apis.some((api) => api.ok);

  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'error', apis, timestamp: new Date().toISOString() });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/beneficiarios', beneficiariosRoutes);
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/entregas', entregasRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/search', searchRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : error.message,
    detail: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default app;
