import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import {
  newListPayload,
  normalizeOldColaborador,
  oldListPayload,
  rawExternalId,
  toOldColaboradorBody
} from '../services/externalAdapters.js';
import { getSourceToken, requestExternal } from '../services/externalApi.js';

const router = Router();

router.use(optionalAuth);

function normalizeUsuario(row = {}) {
  const names = String(row.nombre || row.nombre_usuario || '').split(/\s+/).filter(Boolean);
  return {
    id_colaborador: row.id || row.id_usuario,
    nombres: names.slice(0, -1).join(' ') || names[0] || row.nombre_usuario || '',
    apellidos: names.length > 1 ? names.at(-1) : '',
    documento: row.documento || '',
    telefono: row.telefono || '',
    correo: row.correo || row.correo_electronico || '',
    cargo: row.rol || 'Usuario operativo'
  };
}

router.get('/', async (req, res, next) => {
  try {
    try {
      const payload = await requestExternal('old', '/colaboradores', { query: { q: req.query.q } });
      const list = oldListPayload(payload);
      return res.json({ rows: list.data.map(normalizeOldColaborador), total: list.total });
    } catch (oldError) {
      const token = getSourceToken(req, 'new');
      if (!token) throw oldError;

      const payload = await requestExternal('new', '/records/usuario', {
        token,
        query: { page: 1, pageSize: 100, q: req.query.q, sortField: 'id', sortDirection: 'ASC' }
      });
      const list = newListPayload(payload);
      return res.json({ rows: list.data.map(normalizeUsuario), total: list.total });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', '/colaboradores', {
      method: 'POST',
      token,
      body: toOldColaboradorBody(req.body || {})
    });
    res.status(201).json({ id: payload?.id_colaborador || payload?.id, payload });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    const payload = await requestExternal('old', `/colaboradores/${rawExternalId(req.params.id)}`, {
      method: 'PUT',
      token,
      body: toOldColaboradorBody(req.body || {})
    });
    res.json({ ok: true, payload });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const token = getSourceToken(req, 'old');
    await requestExternal('old', `/colaboradores/${rawExternalId(req.params.id)}`, { method: 'DELETE', token });
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

export default router;
