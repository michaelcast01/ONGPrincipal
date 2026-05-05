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
const analytics = ref({ byOrigin: [], byCity: [] });
const activeSource = ref('');
const fallbackUsed = ref(false);
const catalogos = ref({ ciudades: [], tiposPoblacion: [], tiposAyuda: [] });
const filters = ref({
  q: '',
  cityId: '',
  populationTypeId: '',
  helpTypeId: '',
  source: '',
  unifyByIdentification: true
});
const pagination = ref({ page: 1, totalPages: 1, hasPrev: false, hasNext: false });

const cards = [
  ['total_beneficiarios', 'Beneficiarios', 'Personas registradas'],
  ['total_entregas', 'Entregas', 'Ayudas trazadas'],
  ['total_colaboradores', 'Colaboradores', 'Equipo activo'],
  ['total_ciudades', 'Ciudades', 'Cobertura territorial'],
  ['total_donantes', 'Donantes', 'Red de apoyo'],
  ['stock_inventario', 'Stock inventario', 'Recursos disponibles']
];

function resetPagination() {
  pagination.value = { page: 1, totalPages: 1, hasPrev: false, hasNext: false };
}

function selectedCatalogName(items, id) {
  return (items || []).find((item) => String(item.id) === String(id))?.nombre || '';
}

function sourceLabel(source) {
  if (source === 'new') return 'Nueva';
  if (source === 'unificado' || source === 'ambas_bases') return 'Ambas bases';
  return 'Antigua';
}

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
  try {
    if (newPage !== null) {
      pagination.value.page = newPage;
    }
    const currentFilters = {
      ...filters.value,
      cityName: selectedCatalogName(catalogos.value.ciudades, filters.value.cityId),
      populationTypeName: selectedCatalogName(catalogos.value.tiposPoblacion, filters.value.populationTypeId),
      page: pagination.value.page,
      limit: 10,
      includeStats: 1
    };
    const data = await api.beneficiarios.list(currentFilters);
    beneficiarios.value = data.rows || [];
    analytics.value = data.analytics || { byOrigin: [], byCity: [] };
    activeSource.value = data.source || '';
    fallbackUsed.value = Boolean(data.fallbackUsed);
    const currentPage = data.pagination?.page || pagination.value.page || 1;
    const totalPages = data.pagination?.totalPages || 1;
    pagination.value = {
      page: currentPage,
      totalPages,
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages
    };
  } catch (err) {
    error.value = err.message;
    throw err;
  }
}

async function applyFilters() {
  resetPagination();
  await searchBeneficiarios(1);
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
    await applyFilters();
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

    <section class="insight-strip">
      <div>
        <span class="pulse-dot"></span>
        <strong>Operacion conectada</strong>
      </div>
      <p>Datos consolidados para priorizar beneficiarios, entregas y recursos en tiempo real.</p>
    </section>

    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando informacion...</p>

    <div class="metric-grid">
      <article v-for="card in cards" :key="card[0]" class="metric-card">
        <span>{{ card[1] }}</span>
        <strong>{{ summary[card[0]] ?? 0 }}</strong>
        <small>{{ card[2] }}</small>
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
        <span class="muted">
          {{ beneficiarios.length }} visibles
          <template v-if="activeSource"> · usando {{ sourceLabel(activeSource) }}</template>
          <template v-if="fallbackUsed"> · respaldo</template>
        </span>
      </div>

      <div class="filter-grid">
        <input v-model="filters.q" placeholder="Nombre, documento o correo" @keyup.enter="applyFilters" />
        <select v-model="filters.cityId" @change="applyFilters">
          <option value="">Todas las ciudades</option>
          <option v-for="city in catalogos.ciudades" :key="city.id" :value="city.id">{{ city.nombre }}</option>
        </select>
        <select v-model="filters.populationTypeId" @change="applyFilters">
          <option value="">Tipo poblacion</option>
          <option v-for="type in catalogos.tiposPoblacion" :key="type.id" :value="type.id">{{ type.nombre }}</option>
        </select>
        <select v-model="filters.helpTypeId" @change="applyFilters">
          <option value="">Tipo ayuda</option>
          <option v-for="type in catalogos.tiposAyuda" :key="type.id" :value="type.id">{{ type.nombre }}</option>
        </select>
        <select v-model="filters.source" @change="applyFilters">
          <option value="">Base por defecto</option>
          <option value="ayudas_sociales">Ayudas sociales</option>
          <option value="ong_operativa">ONG operativa</option>
          <option value="ambas_bases">Ambas bases</option>
        </select>
        <label v-if="filters.source === 'ambas_bases'" class="checkbox-filter">
          <input v-model="filters.unifyByIdentification" type="checkbox" @change="applyFilters" />
          Unificar por identificacion
        </label>
        <button class="primary-button compact" @click="applyFilters">Consultar</button>
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

      <div class="chart-grid">
        <BeneficiariosChart
          title="Beneficiarios por origen"
          :data="analytics.byOrigin.length ? analytics.byOrigin : beneficiarios"
          :group-by="analytics.byOrigin.length ? 'label' : 'origen'"
          :value-key="analytics.byOrigin.length ? 'total' : ''"
          variant="pie"
        />
        <BeneficiariosChart
          title="Beneficiarios por ciudad"
          :data="analytics.byCity.length ? analytics.byCity : beneficiarios"
          :group-by="analytics.byCity.length ? 'label' : 'ciudad'"
          :value-key="analytics.byCity.length ? 'total' : ''"
          variant="bar"
          :limit="5"
        />
      </div>
    </article>
  </section>
</template>

<style scoped>
.checkbox-filter {
  align-items: center;
  color: var(--muted);
  display: flex;
  gap: 0.55rem;
  font-size: 0.9rem;
  font-weight: 700;
}

.checkbox-filter input {
  flex: 0 0 auto;
  width: auto;
}

.pagination-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0 0;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--muted);
}

.pagination-buttons {
  display: flex;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.55rem 1rem;
  background: #fff;
  color: var(--green-dark);
  border: 1px solid rgba(20, 32, 27, 0.12);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 800;
  transition: background 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(23, 122, 91, 0.1);
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}
</style>
