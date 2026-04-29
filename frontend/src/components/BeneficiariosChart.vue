<script setup>
import { computed } from 'vue';
import { Bar, Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  BarElement,
  LinearScale
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, BarElement, LinearScale);

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: 'Distribucion de beneficiarios'
  },
  groupBy: {
    type: String,
    default: 'origen'
  },
  valueKey: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'pie'
  },
  limit: {
    type: Number,
    default: 6
  }
});

const chartData = computed(() => {
  const countByOrigen = {};

  props.data.forEach((item) => {
    const origen = item[props.groupBy] || 'Desconocido';
    const amount = props.valueKey ? Number(item[props.valueKey] || 0) : 1;
    countByOrigen[origen] = (countByOrigen[origen] || 0) + amount;
  });

  const entries = Object.entries(countByOrigen)
    .sort((a, b) => b[1] - a[1])
    .slice(0, props.limit);

  const labels = entries.map(([label]) => label);
  const values = entries.map(([, value]) => value);

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

const pieOptions = {
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

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
};

const hasData = computed(() => props.data.length > 0);
</script>

<template>
  <div class="chart-container">
    <h3 class="chart-title">{{ title }}</h3>
    <div v-if="hasData" class="chart-wrapper">
      <component
        :is="variant === 'bar' ? Bar : Pie"
        :data="chartData"
        :options="variant === 'bar' ? barOptions : pieOptions"
      />
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

.chart-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
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
