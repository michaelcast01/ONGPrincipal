const API_BASE = import.meta.env.VITE_API_URL || '/api';

function buildUrl(path, params) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function request(path, options = {}) {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (_error) {
    throw new Error(`No se pudo conectar con el backend en ${API_BASE}`);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Error de comunicacion');
  }
  return payload;
}

export const api = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  profile: () => request('/auth/profile'),
  dashboard: () => request('/dashboard/summary'),
  catalogos: {
    regiones: () => request('/catalogos/regiones'),
    ciudades: () => request('/catalogos/ciudades'),
    tiposPoblacion: () => request('/catalogos/tipos-poblacion'),
    tiposAyuda: () => request('/catalogos/tipos-ayuda'),
    cargos: () => request('/catalogos/cargos')
  },
  beneficiarios: {
    list: (params) => request('/beneficiarios', { params }),
    create: (body) => request('/beneficiarios', { method: 'POST', body }),
    update: (id, body) => request(`/beneficiarios/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/beneficiarios/${id}`, { method: 'DELETE' })
  },
  colaboradores: {
    list: (params) => request('/colaboradores', { params }),
    create: (body) => request('/colaboradores', { method: 'POST', body })
  },
  entregas: {
    list: (params) => request('/entregas', { params }),
    create: (body) => request('/entregas', { method: 'POST', body })
  },
  meta: () => request('/meta/app'),
  records: (table, params) => request(`/records/${table}`, { params }),
  search: (body) => request('/search/execute', { method: 'POST', body })
};
