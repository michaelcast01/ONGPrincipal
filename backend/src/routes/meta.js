import { Router } from 'express';
import { getEntities, getEntitiesByCategory } from '../config/entities.js';

const router = Router();

router.get('/app', (_req, res) => {
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
