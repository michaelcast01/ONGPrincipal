<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api.js';

const router = useRouter();
const usuario = ref('admin');
const contrasena = ref('admin123');
const loading = ref(false);
const error = ref('');

async function submit() {
  loading.value = true;
  error.value = '';

  try {
    const result = await api.login({ usuario: usuario.value, contrasena: contrasena.value });
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('authUser', JSON.stringify(result.user));
    router.push('/app');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-hero">
      <div class="brand-mark">ONG</div>
      <p class="eyebrow">Centro unificado</p>
      <h1>Operacion social conectada en una sola plataforma.</h1>
      <p>
        Consulta beneficiarios, ayudas, donaciones, inventario y misiones desde
        una API integrada sobre Supabase/PostgreSQL.
      </p>
    </section>

    <form class="login-card" @submit.prevent="submit">
      <h2>Iniciar sesion</h2>
      <label>
        Usuario
        <input v-model="usuario" autocomplete="username" />
      </label>
      <label>
        Contrasena
        <input v-model="contrasena" type="password" autocomplete="current-password" />
      </label>
      <p v-if="error" class="form-error">{{ error }}</p>
      <button :disabled="loading" class="primary-button">
        {{ loading ? 'Validando...' : 'Entrar' }}
      </button>
      <small>Usuarios iniciales: admin/admin123 o gestor/admin123</small>
    </form>
  </main>
</template>
