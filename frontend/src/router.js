import { createRouter, createWebHistory } from 'vue-router';

import AppLayout from './views/AppLayout.vue';
import BeneficiariosView from './views/BeneficiariosView.vue';
import ColaboradoresView from './views/ColaboradoresView.vue';
import ConsultaView from './views/ConsultaView.vue';
import DashboardView from './views/DashboardView.vue';
import EntregasView from './views/EntregasView.vue';
import LoginView from './views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    {
      path: '/app',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        { path: 'beneficiarios', name: 'beneficiarios', component: BeneficiariosView },
        { path: 'entregas', name: 'entregas', component: EntregasView },
        { path: 'colaboradores', name: 'colaboradores', component: ColaboradoresView },
        { path: 'consulta', name: 'consulta', component: ConsultaView }
      ]
    }
  ]
});

router.beforeEach((to) => {
  const token = localStorage.getItem('authToken');
  if (to.meta.requiresAuth && !token) return '/';
  if (to.name === 'login' && token) return '/app';
  return true;
});

export default router;
