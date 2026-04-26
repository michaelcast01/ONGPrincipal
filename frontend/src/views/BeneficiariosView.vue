<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../services/api.js';

const rows = ref([]);
const total = ref(0);
const error = ref('');
const saving = ref(false);
const activeSource = ref('');
const fallbackUsed = ref(false);
const filters = ref({ q: '', cityId: '', populationTypeId: '', source: '' });
const catalogos = ref({ ciudades: [], tiposPoblacion: [] });
const form = ref({ documento: '', nombres: '', apellidos: '', telefono: '', correo: '', id_municipio: '', id_tipo_poblacion: '' });

async function loadCatalogos() {
  const [ciudades, tiposPoblacion] = await Promise.all([
    api.catalogos.ciudades(),
    api.catalogos.tiposPoblacion()
  ]);
  catalogos.value = { ciudades: ciudades.rows || [], tiposPoblacion: tiposPoblacion.rows || [] };
}

async function loadRows() {
  error.value = '';
  try {
    const data = await api.beneficiarios.list({ ...filters.value, limit: 50 });
    rows.value = data.rows || [];
    total.value = data.total || 0;
    activeSource.value = data.source || '';
    fallbackUsed.value = Boolean(data.fallbackUsed);
  } catch (err) {
    error.value = err.message;
  }
}

async function createBeneficiario() {
  saving.value = true;
  error.value = '';
  try {
    await api.beneficiarios.create({ ...form.value });
    form.value = { documento: '', nombres: '', apellidos: '', telefono: '', correo: '', id_municipio: '', id_tipo_poblacion: '' };
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
        <p class="eyebrow">Personas</p>
        <h1>Beneficiarios integrados</h1>
      </div>
      <button class="ghost-button" @click="loadRows">Actualizar</button>
    </header>

    <p v-if="error" class="form-error">{{ error }}</p>

    <article class="panel">
      <h2>Nuevo beneficiario de ayudas sociales</h2>
      <form class="form-grid" @submit.prevent="createBeneficiario">
        <input v-model="form.documento" placeholder="Documento" required />
        <input v-model="form.nombres" placeholder="Nombres" required />
        <input v-model="form.apellidos" placeholder="Apellidos" />
        <input v-model="form.telefono" placeholder="Telefono" />
        <input v-model="form.correo" placeholder="Correo" type="email" />
        <select v-model="form.id_municipio">
          <option value="">Ciudad</option>
          <option v-for="city in catalogos.ciudades.filter((item) => item.origen === 'ayudas_sociales')" :key="city.id" :value="String(city.id).replace('ayudas:', '')">
            {{ city.nombre }}
          </option>
        </select>
        <select v-model="form.id_tipo_poblacion">
          <option value="">Tipo poblacion</option>
          <option v-for="type in catalogos.tiposPoblacion" :key="type.id" :value="type.id">{{ type.nombre }}</option>
        </select>
        <button class="primary-button" :disabled="saving">{{ saving ? 'Guardando...' : 'Crear' }}</button>
      </form>
    </article>

    <article class="panel">
      <div class="panel-title-row">
        <h2>Consulta</h2>
        <span class="muted">
          {{ total }} registros
          <template v-if="activeSource"> · usando {{ activeSource === 'new' ? 'Nueva' : 'Antigua' }}</template>
          <template v-if="fallbackUsed"> · respaldo</template>
        </span>
      </div>
      <div class="filter-grid">
        <input v-model="filters.q" placeholder="Buscar" @keyup.enter="loadRows" />
        <select v-model="filters.cityId">
          <option value="">Todas las ciudades</option>
          <option v-for="city in catalogos.ciudades" :key="city.id" :value="city.id">{{ city.nombre }}</option>
        </select>
        <select v-model="filters.populationTypeId">
          <option value="">Tipo poblacion</option>
          <option v-for="type in catalogos.tiposPoblacion" :key="type.id" :value="type.id">{{ type.nombre }}</option>
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
    </article>
  </section>
</template>
