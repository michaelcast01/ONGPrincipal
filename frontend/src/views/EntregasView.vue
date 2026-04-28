<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../services/api.js';

const rows = ref([]);
const total = ref(0);
const error = ref('');
const saving = ref(false);
const filters = ref({ q: '', cityId: '', helpTypeId: '', source: '' });
const catalogos = ref({ ciudades: [], tiposAyuda: [] });
const beneficiarios = ref([]);
const colaboradores = ref([]);
const form = ref({ id_beneficiario: '', id_municipio: '', id_colaborador: '', id_tipo_ayuda: '', fecha_entrega: '', cantidad: 1, observacion: '' });
const pagination = ref({ page: 1, totalPages: 1, hasPrev: false, hasNext: false });

async function loadCatalogos() {
  const [ciudades, tiposAyuda, people, workers] = await Promise.all([
    api.catalogos.ciudades(),
    api.catalogos.tiposAyuda(),
    api.beneficiarios.list({ source: 'ayudas_sociales', limit: 100 }),
    api.colaboradores.list()
  ]);
  catalogos.value = { ciudades: ciudades.rows || [], tiposAyuda: tiposAyuda.rows || [] };
  beneficiarios.value = people.rows || [];
  colaboradores.value = workers.rows || [];
}

async function loadRows(newPage = pagination.value.page) {
  error.value = '';
  try {
    const data = await api.entregas.list({ ...filters.value, page: newPage, limit: 10 });
    rows.value = data.rows || [];
    total.value = data.total || 0;
    if (data.pagination) {
      pagination.value = {
        page: data.pagination.page || 1,
        totalPages: data.pagination.totalPages || 1,
        hasPrev: (data.pagination.page || 1) > 1,
        hasNext: (data.pagination.page || 1) < (data.pagination.totalPages || 1)
      };
    }
  } catch (err) {
    error.value = err.message;
  }
}

async function prevPage() {
  if (pagination.value.hasPrev) {
    await loadRows(pagination.value.page - 1);
  }
}

async function nextPage() {
  if (pagination.value.hasNext) {
    await loadRows(pagination.value.page + 1);
  }
}

async function createEntrega() {
  saving.value = true;
  error.value = '';
  try {
    await api.entregas.create({ ...form.value });
    form.value = { id_beneficiario: '', id_municipio: '', id_colaborador: '', id_tipo_ayuda: '', fecha_entrega: '', cantidad: 1, observacion: '' };
    await loadRows();
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadCatalogos();
  await loadRows();
});
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <p class="eyebrow">Historial</p>
        <h1>Entregas integradas</h1>
      </div>
      <button class="ghost-button" @click="loadRows">Actualizar</button>
    </header>

    <p v-if="error" class="form-error">{{ error }}</p>

    <article class="panel">
      <h2>Nueva entrega de ayudas sociales</h2>
      <form class="form-grid" @submit.prevent="createEntrega">
        <select v-model="form.id_beneficiario" required>
          <option value="">Beneficiario</option>
          <option v-for="person in beneficiarios" :key="person.id" :value="person.id">{{ person.nombre_completo }}</option>
        </select>
        <select v-model="form.id_municipio" required>
          <option value="">Ciudad</option>
          <option v-for="city in catalogos.ciudades.filter((item) => item.origen === 'ayudas_sociales')" :key="city.id" :value="city.id">{{ city.nombre }}</option>
        </select>
        <select v-model="form.id_colaborador" required>
          <option value="">Colaborador</option>
          <option v-for="worker in colaboradores" :key="worker.id_colaborador" :value="worker.id_colaborador">{{ worker.nombres }} {{ worker.apellidos }}</option>
        </select>
        <select v-model="form.id_tipo_ayuda" required>
          <option value="">Tipo ayuda</option>
          <option v-for="type in catalogos.tiposAyuda.filter((item) => item.origen === 'ayudas_sociales')" :key="type.id" :value="type.id">{{ type.nombre }}</option>
        </select>
        <input v-model="form.fecha_entrega" type="date" />
        <input v-model.number="form.cantidad" type="number" min="1" placeholder="Cantidad" />
        <input v-model="form.observacion" placeholder="Observacion" />
        <button class="primary-button" :disabled="saving">{{ saving ? 'Guardando...' : 'Crear entrega' }}</button>
      </form>
    </article>

    <article class="panel">
      <div class="panel-title-row">
        <h2>Consulta</h2>
        <span class="muted">{{ total }} registros</span>
      </div>
      <div class="filter-grid">
        <input v-model="filters.q" placeholder="Buscar" @keyup.enter="loadRows" />
        <select v-model="filters.cityId">
          <option value="">Todas las ciudades</option>
          <option v-for="city in catalogos.ciudades" :key="city.id" :value="city.id">{{ city.nombre }}</option>
        </select>
        <select v-model="filters.helpTypeId">
          <option value="">Tipo ayuda</option>
          <option v-for="type in catalogos.tiposAyuda" :key="type.id" :value="type.id">{{ type.nombre }}</option>
        </select>
        <select v-model="filters.source">
          <option value="">Base por defecto</option>
          <option value="ayudas_sociales">Ayudas sociales</option>
          <option value="ong_operativa">ONG operativa</option>
        </select>
        <button class="primary-button compact" @click="loadRows">Filtrar</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Beneficiario</th>
              <th>Ayuda</th>
              <th>Cantidad</th>
              <th>Ciudad</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ row.fecha }}</td>
              <td>{{ row.beneficiario }}</td>
              <td>{{ row.tipo_ayuda }}</td>
              <td>{{ row.cantidad }}</td>
              <td>{{ row.ciudad }}</td>
              <td><span class="pill">{{ row.origen }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-row">
        <span class="pagination-info">Pagina {{ pagination.page }} de {{ pagination.totalPages }}</span>
        <div class="pagination-buttons">
          <button class="pagination-btn" :disabled="!pagination.hasPrev" @click="prevPage">
            Anterior
          </button>
          <button class="pagination-btn" :disabled="!pagination.hasNext" @click="nextPage">
            Siguiente
          </button>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.pagination-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-buttons {
  display: flex;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem 1.25rem;
  background: #0d9488;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #0f766e;
}

.pagination-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
