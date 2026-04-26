import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createDemoBeneficiario,
  deleteDemoBeneficiario,
  listDemoBeneficiarios,
  shouldUseDemoData,
  updateDemoBeneficiario
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

function splitName(body) {
  if (body.nombres || body.apellidos) {
    return { nombres: body.nombres || '', apellidos: body.apellidos || '' };
  }

  const parts = String(body.nombre_completo || body.nombre || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nombres: parts.join(' '), apellidos: '' };

  return {
    nombres: parts.slice(0, -1).join(' '),
    apellidos: parts.slice(-1).join(' ')
  };
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
      params.push(like, like, like);
      where.push('(b.nombre_completo ILIKE ? OR b.documento ILIKE ? OR b.correo ILIKE ?)');
    }

    if (cityId) {
      params.push(String(cityId));
      where.push('b.municipio_id = ?');
    }

    if (populationTypeId) {
      params.push(String(populationTypeId));
      where.push('b.tipo_poblacion_id = ?');
    }

    if (source) {
      params.push(String(source));
      where.push('b.origen = ?');
    }

    if (helpTypeId) {
      params.push(String(helpTypeId));
      where.push(`EXISTS (
        SELECT 1 FROM integracion.v_entregas e
         WHERE e.beneficiario_id = b.id
           AND e.tipo_ayuda_id = ?
      )`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rowsResult, countResult] = await Promise.all([
      query(
        `SELECT * FROM integracion.v_beneficiarios b ${whereSql} ORDER BY b.nombre_completo ASC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*)::int AS total FROM integracion.v_beneficiarios b ${whereSql}`, params)
    ]);

    res.json({ rows: rowsResult.rows, total: countResult.rows[0]?.total || 0 });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.json(listDemoBeneficiarios(req.query));
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const { nombres, apellidos } = splitName(body);

    if (!body.documento || !nombres) {
      return res.status(400).json({ error: 'Documento y nombres son requeridos' });
    }

    const result = await query(
      `INSERT INTO ayudas_sociales.beneficiario
       (documento, nombres, apellidos, fecha_nacimiento, genero, telefono, correo, id_municipio, id_tipo_poblacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        body.documento,
        nombres,
        apellidos,
        body.fecha_nacimiento || null,
        body.genero || null,
        body.telefono || null,
        body.correo || null,
        body.id_municipio || null,
        body.id_tipo_poblacion || null
      ]
    );

    res.status(201).json({ row: result.rows[0] });
  } catch (error) {
    if (shouldUseDemoData(error)) return res.status(201).json({ row: createDemoBeneficiario(req.body || {}) });
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const { nombres, apellidos } = splitName(body);
    const result = await query(
      `UPDATE ayudas_sociales.beneficiario
          SET documento = COALESCE(?, documento),
              nombres = COALESCE(?, nombres),
              apellidos = COALESCE(?, apellidos),
              fecha_nacimiento = COALESCE(?, fecha_nacimiento),
              genero = COALESCE(?, genero),
              telefono = COALESCE(?, telefono),
              correo = COALESCE(?, correo),
              id_municipio = COALESCE(?, id_municipio),
              id_tipo_poblacion = COALESCE(?, id_tipo_poblacion)
        WHERE id_beneficiario = ?
        RETURNING *`,
      [
        body.documento || null,
        nombres || null,
        apellidos || null,
        body.fecha_nacimiento || null,
        body.genero || null,
        body.telefono || null,
        body.correo || null,
        body.id_municipio || null,
        body.id_tipo_poblacion || null,
        req.params.id
      ]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Beneficiario no encontrado' });
    res.json({ row: result.rows[0] });
  } catch (error) {
    if (shouldUseDemoData(error)) {
      const row = updateDemoBeneficiario(req.params.id, req.body || {});
      if (!row) return res.status(404).json({ error: 'Beneficiario no encontrado' });
      return res.json({ row });
    }
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM ayudas_sociales.beneficiario WHERE id_beneficiario = ? RETURNING id_beneficiario',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Beneficiario no encontrado' });
    res.json({ deleted: true });
  } catch (error) {
    if (shouldUseDemoData(error)) {
      if (!deleteDemoBeneficiario(req.params.id)) return res.status(404).json({ error: 'Beneficiario no encontrado' });
      return res.json({ deleted: true });
    }
    next(error);
  }
});

export default router;
