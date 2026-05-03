<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../services/api.js';

const rows = ref([]);
const total = ref(0);
const error = ref('');
const exporting = ref(false);
const activeSource = ref('');
const fallbackUsed = ref(false);
const filters = ref({ q: '', cityId: '', populationTypeId: '', source: '', unifyByIdentification: true });
const showAdvancedFilters = ref(false);
const sortField = ref('id');
const sortDirection = ref('ASC');
const advancedFilters = ref([]);
const catalogos = ref({ ciudades: [], tiposPoblacion: [] });
const pagination = ref({ page: 1, totalPages: 1, hasPrev: false, hasNext: false });

const advancedFieldOptions = [
  ['id', 'ID'],
  ['tipo_documento', 'Tipo documento'],
  ['numero_documento', 'Numero documento'],
  ['primer_nombre', 'Primer nombre'],
  ['apellidos', 'Apellidos'],
  ['telefono_principal', 'Telefono'],
  ['correo', 'Correo'],
  ['ciudad', 'Ciudad'],
  ['grupo_sisben', 'Grupo SISBEN'],
  ['fecha_registro', 'Fecha registro']
];

const operatorOptions = [
  ['=', 'Igual a'],
  ['!=', 'Diferente de'],
  ['ILIKE', 'Contiene'],
  ['LIKE', 'Coincide'],
  ['>', 'Mayor que'],
  ['<', 'Menor que'],
  ['>=', 'Mayor o igual'],
  ['<=', 'Menor o igual'],
  ['IN', 'En lista']
];

async function loadCatalogos() {
  const [ciudades, tiposPoblacion] = await Promise.all([
    api.catalogos.ciudades(),
    api.catalogos.tiposPoblacion()
  ]);
  catalogos.value = { ciudades: ciudades.rows || [], tiposPoblacion: tiposPoblacion.rows || [] };
}

function selectedCatalogName(items, id) {
  return (items || []).find((item) => String(item.id) === String(id))?.nombre || '';
}

async function loadRows(newPage = pagination.value.page) {
  error.value = '';
  try {
    const activeAdvancedFilters = advancedFilters.value.filter((filter) => filter.field && filter.value !== '');
    const data = await api.beneficiarios.list({
      ...filters.value,
      cityName: selectedCatalogName(catalogos.value.ciudades, filters.value.cityId),
      populationTypeName: selectedCatalogName(catalogos.value.tiposPoblacion, filters.value.populationTypeId),
      page: newPage,
      limit: 10,
      sortField: sortField.value,
      sortDirection: sortDirection.value,
      advancedFilters: activeAdvancedFilters.length ? JSON.stringify(activeAdvancedFilters) : ''
    });
    rows.value = data.rows || [];
    total.value = data.total || 0;
    activeSource.value = data.source || '';
    fallbackUsed.value = Boolean(data.fallbackUsed);
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

async function exportCsv() {
  exporting.value = true;
  error.value = '';
  try {
    const activeAdvancedFilters = advancedFilters.value.filter((filter) => filter.field && filter.value !== '');
    const blob = await api.beneficiarios.exportCsv({
      ...filters.value,
      cityName: selectedCatalogName(catalogos.value.ciudades, filters.value.cityId),
      populationTypeName: selectedCatalogName(catalogos.value.tiposPoblacion, filters.value.populationTypeId),
      sortField: sortField.value,
      sortDirection: sortDirection.value,
      advancedFilters: activeAdvancedFilters.length ? JSON.stringify(activeAdvancedFilters) : ''
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'beneficiarios-filtrados.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  } catch (err) {
    error.value = err.message;
  } finally {
    exporting.value = false;
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

function addAdvancedFilter() {
  advancedFilters.value.push({ field: 'primer_nombre', operator: 'ILIKE', value: '' });
}

function removeAdvancedFilter(index) {
  advancedFilters.value.splice(index, 1);
}

function clearAdvancedFilters() {
  advancedFilters.value = [];
  sortField.value = 'id';
  sortDirection.value = 'ASC';
}

function sourceLabel(source) {
  if (source === 'new') return 'Nueva';
  if (source === 'unificado' || source === 'ambas_bases') return 'Ambas bases';
  return 'Antigua';
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
        <p class="eyebrow">Personas</p>
        <h1>Beneficiarios integrados</h1>
      </div>
      <button class="ghost-button" @click="loadRows">Actualizar</button>
    </header>

    <p v-if="error" class="form-error">{{ error }}</p>

    <article class="panel">
      <div class="panel-title-row">
        <h2>Consulta</h2>
        <span class="muted">
          {{ total }} registros
          <template v-if="activeSource"> · usando {{ sourceLabel(activeSource) }}</template>
          <template v-if="fallbackUsed"> · respaldo</template>
        </span>
      </div>
      <div class="filter-grid">
        <input v-model="filters.q" placeholder="Buscar" @keyup.enter="loadRows(1)" />
        <select v-model="filters.cityId" @change="loadRows(1)">
          <option value="">Todas las ciudades</option>
          <option v-for="city in catalogos.ciudades" :key="city.id" :value="city.id">{{ city.nombre }}</option>
        </select>
        <select v-model="filters.populationTypeId" @change="loadRows(1)">
          <option value="">Tipo poblacion</option>
          <option v-for="type in catalogos.tiposPoblacion" :key="type.id" :value="type.id">{{ type.nombre }}</option>
        </select>
        <select v-model="filters.source" @change="loadRows(1)">
          <option value="">Base por defecto</option>
          <option value="ayudas_sociales">Ayudas sociales</option>
          <option value="ong_operativa">ONG operativa</option>
          <option value="ambas_bases">Ambas bases</option>
        </select>
        <label v-if="filters.source === 'ambas_bases'" class="checkbox-filter">
          <input v-model="filters.unifyByIdentification" type="checkbox" @change="loadRows(1)" />
          Unificar por identificación
        </label>
        <button class="primary-button compact" @click="loadRows(1)">Filtrar</button>
        <button class="ghost-button compact" type="button" @click="exportCsv" :disabled="exporting">
          {{ exporting ? 'Exportando...' : 'Exportar CSV' }}
        </button>
      </div>

      <div class="panel-title-row advanced-toggle-row">
        <button class="ghost-button" type="button" @click="showAdvancedFilters = !showAdvancedFilters">
          {{ showAdvancedFilters ? 'Ocultar filtros avanzados' : 'Filtros avanzados' }}
        </button>
        <span class="muted">{{ advancedFilters.length }} filtros avanzados</span>
      </div>

      <div v-if="showAdvancedFilters" class="advanced-filter-panel">
        <div class="advanced-sort-grid">
          <label>
            Ordenar por
            <select v-model="sortField">
              <option v-for="field in advancedFieldOptions" :key="field[0]" :value="field[0]">{{ field[1] }}</option>
            </select>
          </label>
          <label>
            Direccion
            <select v-model="sortDirection">
              <option value="ASC">Ascendente</option>
              <option value="DESC">Descendente</option>
            </select>
          </label>
          <button class="primary-button compact" type="button" @click="loadRows">Consultar</button>
        </div>

        <div class="advanced-actions">
          <button class="ghost-button" type="button" @click="addAdvancedFilter">Agregar filtro</button>
          <button class="ghost-button" type="button" @click="clearAdvancedFilters">Limpiar filtros</button>
        </div>

        <div v-if="advancedFilters.length" class="advanced-filter-list">
          <div v-for="(filter, index) in advancedFilters" :key="index" class="advanced-filter-row">
            <select v-model="filter.field">
              <option v-for="field in advancedFieldOptions" :key="field[0]" :value="field[0]">{{ field[1] }}</option>
            </select>
            <select v-model="filter.operator">
              <option v-for="operator in operatorOptions" :key="operator[0]" :value="operator[0]">{{ operator[1] }}</option>
            </select>
            <input v-model="filter.value" placeholder="Valor" @keyup.enter="loadRows" />
            <button class="ghost-button" type="button" @click="removeAdvancedFilter(index)">Quitar</button>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellidos</th>
              <th>Documento</th>
              <th>Telefono</th>
              <th>Ciudad</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ row.nombre_completo }}</td>
              <td>{{ row.apellidos }}</td>
              <td>{{ row.documento }}</td>
              <td>{{ row.telefono }}</td>
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
.checkbox-filter {
  align-items: center;
  color: #4b5563;
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
