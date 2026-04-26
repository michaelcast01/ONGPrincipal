<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

const router = useRouter();
const user = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('authUser') || '{}');
  } catch (_error) {
    return {};
  }
});

const links = [
  { to: '/app', label: 'Dashboard' },
  { to: '/app/beneficiarios', label: 'Beneficiarios' },
  { to: '/app/entregas', label: 'Entregas' },
  { to: '/app/colaboradores', label: 'Colaboradores' },
  { to: '/app/consulta', label: 'Consulta' }
];

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  router.push('/');
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div>
        <div class="brand-row">
          <span class="brand-dot"></span>
          <strong>Conjunto ONG</strong>
        </div>
        <nav>
          <RouterLink v-for="link in links" :key="link.to" :to="link.to">
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>
      <div class="user-box">
        <span>{{ user.nombre || user.usuario || 'Usuario' }}</span>
        <button @click="logout">Salir</button>
      </div>
    </aside>

    <section class="content-area">
      <RouterView />
    </section>
  </div>
</template>
