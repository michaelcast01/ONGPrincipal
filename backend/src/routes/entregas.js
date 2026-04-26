import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createDemoEntrega,
  deleteDemoEntrega,
  listDemoEntregas,
  shouldUseDemoData,
  updateDemoEntrega
} from '../services/demoData.js';

const router = Router();

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

function ayudasId(value) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value);
  if (text.startsWith('ayudas:')) return Number(text.replace('ayudas:', ''));
  const numeric = Number(text);
  return Number.isNaN(numeric) ? null : numeric;
}

router.get('/', async (req, res, next) => {
  try {
    const { q, cityId, populationTypeId, helpTypeId, source } = req.query;
    const limit = normalizeLimit(req.query.limit);
    const offset = normalizeOffset(req.query.offset);
    const params = [];
    const where = [];

    if (q) {
      const like = `%${q}%`;
      params.push(like, like, like, like);
      where.push('(e.beneficiario ILIKE ? OR e.documento ILIKE ? OR e.tipo_ayuda ILIKE ? OR e.colaborador ILIKE ?)');
    }

    if (cityId) {
      params.push(String(cityId));
      where.push('e.municipio_id = ?');
    }

    if (populationTypeId) {
      params.push(String(populationTypeId));
      where.push(`EXISTS (
        SELECT 1 FROM integracion.v_beneficiarios b
         WHERE b.id = e.beneficiario_id
           AND b.tipo_poblacion_id = ?
      )`);
    }

    if (helpTypeId) {
      params.push(String(helpTypeId));
      where.push('e.tipo_ayuda_id = ?');
    }

    if (source) {
      params.push(String(source));
      where.push('e.origen = ?');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rowsResult, countResult] = await Promise.all([
      query(
        `SELECT * FROM integracion.v_entregas e ${whereSql} ORDER BY e.fecha DESC NULLS LAST, e.id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*)::int AS total FROM integracion.v_entregas e ${whereSql}`, params)
    ]);

    res.json({ rows: rowsResult.rows, total: countResult.rows[0]?.total || 0 });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json(listDemoEntregas(req.query));
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const idBeneficiario = ayudasId(body.id_beneficiario || body.beneficiario_id);
    const idMunicipio = ayudasId(body.id_municipio || body.municipio_id);
    const idTipoAyuda = ayudasId(body.id_tipo_ayuda || body.tipo_ayuda_id);

    if (!idBeneficiario || !idMunicipio || !body.id_colaborador || !idTipoAyuda) {
      return res.status(400).json({ error: 'Beneficiario, ciudad, colaborador y tipo de ayuda son requeridos del modulo ayudas' });
    }

    const result = await query(
      `INSERT INTO ayudas_sociales.entrega_ayuda
       (id_beneficiario, id_municipio, id_colaborador, id_tipo_ayuda, fecha_entrega, cantidad, observacion)
       VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_DATE), ?, ?)
       RETURNING *`,
      [idBeneficiario, idMunicipio, body.id_colaborador, idTipoAyuda, body.fecha_entrega || null, body.cantidad || 1, body.observacion || null]
    );

    res.status(201).json({ row: result.rows[0] });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.status(201).json({ row: createDemoEntrega(req.body || {}) });
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await query(
      `UPDATE ayudas_sociales.entrega_ayuda
          SET id_beneficiario = COALESCE(?, id_beneficiario),
              id_municipio = COALESCE(?, id_municipio),
              id_colaborador = COALESCE(?, id_colaborador),
              id_tipo_ayuda = COALESCE(?, id_tipo_ayuda),
              fecha_entrega = COALESCE(?, fecha_entrega),
              cantidad = COALESCE(?, cantidad),
              observacion = COALESCE(?, observacion)
        WHERE id_entrega = ?
        RETURNING *`,
      [
        ayudasId(body.id_beneficiario || body.beneficiario_id),
        ayudasId(body.id_municipio || body.municipio_id),
        body.id_colaborador || null,
        ayudasId(body.id_tipo_ayuda || body.tipo_ayuda_id),
        body.fecha_entrega || null,
        body.cantidad || null,
        body.observacion || null,
        req.params.id
      ]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Entrega no encontrada' });
    res.json({ row: result.rows[0] });
  } catch (error) {
    if (shouldUseDemoData(error)) {
      const row = updateDemoEntrega(req.params.id, req.body || {});
      if (!row) return res.status(404).json({ error: 'Entrega no encontrada' });
      return res.json({ row });
    }
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM ayudas_sociales.entrega_ayuda WHERE id_entrega = ? RETURNING id_entrega',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Entrega no encontrada' });
    res.json({ deleted: true });
  } catch (error) {
    if (shouldUseDemoData(error)) {
      if (!deleteDemoEntrega(req.params.id)) return res.status(404).json({ error: 'Entrega no encontrada' });
      return res.json({ deleted: true });
    }
    next(error);
  }
});

export default router;
