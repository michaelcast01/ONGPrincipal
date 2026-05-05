<script setup>
import { computed, ref } from 'vue';
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
  { to: '/app', label: 'Dashboard', icon: 'D' },
  { to: '/app/beneficiarios', label: 'Beneficiarios', icon: 'B' },
  { to: '/app/entregas', label: 'Entregas', icon: 'E' },
  { to: '/app/colaboradores', label: 'Colaboradores', icon: 'C' },
  { to: '/app/consulta', label: 'Consulta', icon: 'Q' }
];

const defaultSource = ref(localStorage.getItem('defaultDataSource') || 'old');

function changeDefaultSource() {
  localStorage.setItem('defaultDataSource', defaultSource.value);
  window.location.reload();
}

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
          <span class="brand-dot" aria-hidden="true"></span>
          <div>
            <strong>Conjunto ONG</strong>
            <small>Operacion integrada</small>
          </div>
        </div>
        <label class="source-switch">
          <span>Base por defecto</span>
          <select v-model="defaultSource" @change="changeDefaultSource">
            <option value="old">Antigua</option>
            <option value="new">Nueva</option>
          </select>
        </label>
        <nav>
          <RouterLink v-for="link in links" :key="link.to" :to="link.to">
            <span class="nav-icon" aria-hidden="true">{{ link.icon }}</span>
            <span>{{ link.label }}</span>
          </RouterLink>
        </nav>
      </div>
      <div class="user-box">
        <span class="user-avatar" aria-hidden="true">{{ (user.nombre || user.usuario || 'U').slice(0, 1) }}</span>
        <span>{{ user.nombre || user.usuario || 'Usuario' }}</span>
        <button @click="logout">Salir</button>
      </div>
    </aside>

    <section class="content-area">
      <RouterView />
    </section>
  </div>
</template>
