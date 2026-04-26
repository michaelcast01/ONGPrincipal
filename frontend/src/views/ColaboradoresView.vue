<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../services/api.js';

const rows = ref([]);
const cargos = ref([]);
const error = ref('');
const form = ref({ documento: '', nombres: '', apellidos: '', telefono: '', correo: '', id_cargo: '' });

async function load() {
  error.value = '';
  try {
    const [workers, roles] = await Promise.all([api.colaboradores.list(), api.catalogos.cargos()]);
    rows.value = workers.rows || [];
    cargos.value = roles.rows || [];
  } catch (err) {
    error.value = err.message;
  }
}

async function createColaborador() {
  try {
    await api.colaboradores.create({ ...form.value });
    form.value = { documento: '', nombres: '', apellidos: '', telefono: '', correo: '', id_cargo: '' };
    await load();
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(load);
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <p class="eyebrow">Equipo</p>
        <h1>Colaboradores</h1>
      </div>
      <button class="ghost-button" @click="load">Actualizar</button>
    </header>

    <p v-if="error" class="form-error">{{ error }}</p>

    <article class="panel">
      <h2>Nuevo colaborador</h2>
      <form class="form-grid" @submit.prevent="createColaborador">
        <input v-model="form.documento" placeholder="Documento" required />
        <input v-model="form.nombres" placeholder="Nombres" required />
        <input v-model="form.apellidos" placeholder="Apellidos" />
        <input v-model="form.telefono" placeholder="Telefono" />
        <input v-model="form.correo" placeholder="Correo" type="email" />
        <select v-model="form.id_cargo">
          <option value="">Cargo</option>
          <option v-for="cargo in cargos" :key="cargo.id" :value="cargo.id">{{ cargo.nombre }}</option>
        </select>
        <button class="primary-button">Crear</button>
      </form>
    </article>

    <article class="panel">
      <h2>Listado</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Cargo</th>
              <th>Correo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id_colaborador">
              <td>{{ row.nombres }} {{ row.apellidos }}</td>
              <td>{{ row.documento }}</td>
              <td>{{ row.cargo }}</td>
              <td>{{ row.correo }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
