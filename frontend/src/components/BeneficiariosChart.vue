<script setup>
import { computed } from 'vue';
import { Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

const chartData = computed(() => {
  const countByOrigen = {};

  props.data.forEach((item) => {
    const origen = item.origen || 'Desconocido';
    countByOrigen[origen] = (countByOrigen[origen] || 0) + 1;
  });

  const labels = Object.keys(countByOrigen);
  const values = Object.values(countByOrigen);

  const colors = [
    '#4F46E5',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4'
  ];

  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const value = context.raw;
          const percentage = ((value / total) * 100).toFixed(1);
          return `${context.label}: ${value} (${percentage}%)`;
        }
      }
    }
  }
};

const hasData = computed(() => props.data.length > 0);
</script>

<template>
  <div class="chart-container">
    <div v-if="hasData" class="chart-wrapper">
      <Pie :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="no-data">
      <p>No hay datos para mostrar</p>
      <p class="muted">Realiza una consulta para ver la grafica</p>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  min-height: 300px;
}

.chart-wrapper {
  width: 100%;
  height: 300px;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #6b7280;
}
</style>