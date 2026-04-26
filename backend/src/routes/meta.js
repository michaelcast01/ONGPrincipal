import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getEntities, getEntitiesByCategory } from '../config/entities.js';
import { getSourceToken, requestExternal } from '../services/externalApi.js';

const router = Router();

router.use(optionalAuth);

function adaptExternalEntity(entity) {
  const columns = (entity.columns || []).map((column) => column.name || column).filter(Boolean);
  return {
    key: entity.name,
    table: entity.name,
    pk: entity.primaryKeys?.[0] || columns[0] || 'id',
    label: entity.label || entity.name,
    category: entity.category || 'General',
    columns,
    searchFields: entity.searchFields || []
  };
}

function groupByCategory(entities) {
  return entities.reduce((groups, entity) => {
    groups[entity.category] = groups[entity.category] || [];
    groups[entity.category].push(entity);
    return groups;
  }, {});
}

router.get('/app', async (req, res) => {
  const token = getSourceToken(req, 'new');
  if (token) {
    try {
      const payload = await requestExternal('new', '/meta/app', { token });
      const entities = (payload.entities || []).map(adaptExternalEntity);
      return res.json({
        name: payload.app?.name || 'Conjunto ONG',
        modules: [
          { key: 'dashboard', label: 'Dashboard', path: '/app' },
          { key: 'beneficiarios', label: 'Beneficiarios', path: '/app/beneficiarios' },
          { key: 'entregas', label: 'Entregas', path: '/app/entregas' },
          { key: 'colaboradores', label: 'Colaboradores', path: '/app/colaboradores' },
          { key: 'consulta', label: 'Centro de consulta', path: '/app/consulta' }
        ],
        entities,
        categories: groupByCategory(entities)
      });
    } catch (_error) {
      // Se mantiene el catalogo local de tablas si la metadata externa no responde.
    }
  }

  res.json({
    name: 'Conjunto ONG',
    modules: [
      { key: 'dashboard', label: 'Dashboard', path: '/app' },
      { key: 'beneficiarios', label: 'Beneficiarios', path: '/app/beneficiarios' },
      { key: 'entregas', label: 'Entregas', path: '/app/entregas' },
      { key: 'colaboradores', label: 'Colaboradores', path: '/app/colaboradores' },
      { key: 'consulta', label: 'Centro de consulta', path: '/app/consulta' }
    ],
    entities: getEntities(),
    categories: getEntitiesByCategory()
  });
});

export default router;
