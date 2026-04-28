<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../services/api.js';
import BeneficiariosChart from '../components/BeneficiariosChart.vue';

const loading = ref(true);
const error = ref('');
const summary = ref({});
const topCities = ref([]);
const recentDeliveries = ref([]);
const beneficiarios = ref([]);
const catalogos = ref({ ciudades: [], tiposPoblacion: [], tiposAyuda: [] });
const filters = ref({ q: '', cityId: '', populationTypeId: '', helpTypeId: '' });
const pagination = ref({ page: 1, totalPages: 1, hasPrev: false, hasNext: false });

const cards = [
  ['total_beneficiarios', 'Beneficiarios'],
  ['total_entregas', 'Entregas'],
  ['total_colaboradores', 'Colaboradores'],
  ['total_ciudades', 'Ciudades'],
  ['total_donantes', 'Donantes'],
  ['stock_inventario', 'Stock inventario']
];

async function loadDashboard() {
  const data = await api.dashboard();
  summary.value = data.summary || {};
  topCities.value = data.topCities || [];
  recentDeliveries.value = data.recentDeliveries || [];
}

async function loadCatalogos() {
  const [ciudades, tiposPoblacion, tiposAyuda] = await Promise.all([
    api.catalogos.ciudades(),
    api.catalogos.tiposPoblacion(),
    api.catalogos.tiposAyuda()
  ]);

  catalogos.value = {
    ciudades: ciudades.rows || [],
    tiposPoblacion: tiposPoblacion.rows || [],
    tiposAyuda: tiposAyuda.rows || []
  };
}

async function searchBeneficiarios(newPage = null) {
  if (newPage) {
    pagination.value.page = newPage;
  }
  const currentFilters = { ...filters.value, page: pagination.value.page, limit: 10 };
  const data = await api.beneficiarios.list(currentFilters);
  beneficiarios.value = data.rows || [];
  if (data.pagination) {
    pagination.value = {
      page: data.pagination.page || 1,
      totalPages: data.pagination.totalPages || 1,
      hasPrev: (data.pagination.page || 1) > 1,
      hasNext: (data.pagination.page || 1) < (data.pagination.totalPages || 1)
    };
  }
}

async function prevPage() {
  if (pagination.value.hasPrev) {
    await searchBeneficiarios(pagination.value.page - 1);
  }
}

async function nextPage() {
  if (pagination.value.hasNext) {
    await searchBeneficiarios(pagination.value.page + 1);
  }
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    await Promise.all([loadDashboard(), loadCatalogos()]);
    await searchBeneficiarios();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <p class="eyebrow">Vista general</p>
        <h1>Dashboard unificado</h1>
      </div>
      <button class="ghost-button" @click="load">Actualizar</button>
    </header>

    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando informacion...</p>

    <div class="metric-grid">
      <article v-for="card in cards" :key="card[0]" class="metric-card">
        <span>{{ card[1] }}</span>
        <strong>{{ summary[card[0]] ?? 0 }}</strong>
      </article>
    </div>

    <div class="dashboard-grid">
      <article class="panel">
        <h2>Ciudades con mas entregas</h2>
        <div v-for="city in topCities" :key="city.ciudad" class="rank-row">
          <span>{{ city.ciudad }}</span>
          <strong>{{ city.total }}</strong>
        </div>
      </article>

      <article class="panel">
        <h2>Entregas recientes</h2>
        <div v-for="delivery in recentDeliveries" :key="delivery.id" class="delivery-row">
          <strong>{{ delivery.beneficiario }}</strong>
          <span>{{ delivery.tipo_ayuda }} - {{ delivery.ciudad }}</span>
        </div>
      </article>
    </div>

    <article class="panel">
      <div class="panel-title-row">
        <h2>Consulta rapida de beneficiarios</h2>
        <button class="primary-button compact" @click="searchBeneficiarios">Consultar</button>
      </div>

      <div class="filter-grid">
        <input v-model="filters.q" placeholder="Nombre, documento o correo" />
        <select v-model="filters.cityId">
          <option value="">Todas las ciudades</option>
          <option v-for="city in catalogos.ciudades" :key="city.id" :value="city.id">{{ city.nombre }}</option>
        </select>
        <select v-model="filters.populationTypeId">
          <option value="">Tipo poblacion</option>
          <option v-for="type in catalogos.tiposPoblacion" :key="type.id" :value="type.id">{{ type.nombre }}</option>
        </select>
        <select v-model="filters.helpTypeId">
          <option value="">Tipo ayuda</option>
          <option v-for="type in catalogos.tiposAyuda" :key="type.id" :value="type.id">{{ type.nombre }}</option>
        </select>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Ciudad</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in beneficiarios" :key="person.id">
              <td>{{ person.nombre_completo }}</td>
              <td>{{ person.documento }}</td>
              <td>{{ person.ciudad }}</td>
              <td><span class="pill">{{ person.origen }}</span></td>
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

      <BeneficiariosChart :data="beneficiarios" />
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
