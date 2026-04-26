<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../services/api.js';

const meta = ref({ categories: {} });
const selectedTable = ref('beneficiario');
const q = ref('');
const rows = ref([]);
const total = ref(0);
const error = ref('');

const selectedEntity = computed(() => {
  return (meta.value.entities || []).find((entity) => entity.key === selectedTable.value) || null;
});

async function loadMeta() {
  meta.value = await api.meta();
}

async function search() {
  error.value = '';
  try {
    const result = await api.records(selectedTable.value, { q: q.value, limit: 50 });
    rows.value = result.rows || [];
    total.value = result.total || 0;
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(async () => {
  await loadMeta();
  await search();
});
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <p class="eyebrow">Segundo sistema</p>
        <h1>Centro de consulta operativo</h1>
      </div>
      <button class="ghost-button" @click="search">Actualizar</button>
    </header>

    <p v-if="error" class="form-error">{{ error }}</p>

    <article class="panel">
      <div class="filter-grid">
        <select v-model="selectedTable" @change="search">
          <optgroup v-for="(entities, category) in meta.categories" :key="category" :label="category">
            <option v-for="entity in entities" :key="entity.key" :value="entity.key">{{ entity.label }}</option>
          </optgroup>
        </select>
        <input v-model="q" placeholder="Busqueda rapida" @keyup.enter="search" />
        <button class="primary-button compact" @click="search">Consultar</button>
      </div>
      <p class="muted">{{ total }} registros en {{ selectedEntity?.label }}</p>
    </article>

    <article class="panel">
      <div class="table-wrap">
        <table v-if="selectedEntity">
          <thead>
            <tr>
              <th v-for="column in selectedEntity.columns" :key="column">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="index">
              <td v-for="column in selectedEntity.columns" :key="column">{{ row[column] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
