const SOURCES = {
  old: {
    env: 'ONG_ANTIGUA_API_URL',
    label: 'API antigua'
  },
  new: {
    env: 'ONG_NUEVA_API_URL',
    label: 'API nueva'
  }
};

const serviceTokenCache = new Map();

export class ExternalApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ExternalApiError';
    this.source = details.source;
    this.status = details.status || 503;
    this.payload = details.payload;
  }
}

function baseUrl(source) {
  const config = SOURCES[source];
  const value = config ? process.env[config.env] : null;
  return value ? value.replace(/\/+$/, '') : '';
}

function sourceLabel(source) {
  return SOURCES[source]?.label || source;
}

function buildUrl(source, path, query) {
  const base = baseUrl(source);
  if (!base) {
    throw new ExternalApiError(`${sourceLabel(source)} no configurada`, { source, status: 503 });
  }

  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
}

export function configuredSources() {
  return Object.keys(SOURCES).filter((source) => Boolean(baseUrl(source)));
}

export function getSourceToken(req, source) {
  return req.user?.externalTokens?.[source] || null;
}

export async function getServiceToken(source) {
  const cached = serviceTokenCache.get(source);
  if (cached?.expiresAt > Date.now()) return cached.token;

  const usuario = process.env.ADMIN_USER || 'admin';
  const contrasena = process.env.ADMIN_PASSWORD || 'admin123';
  const payload = await requestExternal(source, '/auth/login', {
    method: 'POST',
    body: {
      usuario,
      username: usuario,
      contrasena,
      contraseña: contrasena,
      password: contrasena
    }
  });

  if (!payload?.token) {
    throw new ExternalApiError(`No se pudo obtener token de ${sourceLabel(source)}`, { source, status: 401 });
  }

  serviceTokenCache.set(source, {
    token: payload.token,
    expiresAt: Date.now() + 15 * 60 * 1000
  });

  return payload.token;
}

export function sourceOrder(primary = 'old') {
  const sources = ['old', 'new'];
  return [primary, ...sources.filter((source) => source !== primary)];
}

export function normalizeSource(value, fallback = 'old') {
  const source = String(value || '').toLowerCase();
  if (['old', 'antigua', 'ayudas', 'ayudas_sociales'].includes(source)) return 'old';
  if (['new', 'nueva', 'operativa', 'ong_operativa'].includes(source)) return 'new';
  return fallback;
}

export function preferredSource(req, fallback = 'old') {
  return normalizeSource(
    req.get?.('x-ong-default-source') || req.get?.('x-ong-source') || req.query?.defaultSource,
    fallback
  );
}

export async function requestExternal(source, path, options = {}) {
  const url = buildUrl(source, path, options.query);
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response;
  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    throw new ExternalApiError(`No se pudo conectar con ${sourceLabel(source)}`, {
      source,
      status: 503,
      payload: { error: error.message }
    });
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new ExternalApiError(payload?.error || payload?.message || `Error en ${sourceLabel(source)}`, {
      source,
      status: response.status,
      payload
    });
  }

  return payload;
}

export async function requestFirst(sources, path, options = {}) {
  const errors = [];

  for (const source of sources) {
    try {
      const data = await requestExternal(source, path, {
        ...options,
        token: typeof options.token === 'function' ? options.token(source) : options.token
      });
      return { source, data };
    } catch (error) {
      errors.push(error);
    }
  }

  const last = errors.at(-1);
  throw new ExternalApiError(last?.message || 'No hay APIs externas disponibles', {
    source: last?.source,
    status: last?.status || 503,
    payload: {
      errors: errors.map((error) => ({ source: error.source, status: error.status, message: error.message }))
    }
  });
}

export async function requestEach(sources, path, options = {}) {
  const results = await Promise.allSettled(
    sources.map(async (source) => ({
      source,
      data: await requestExternal(source, path, {
        ...options,
        token: typeof options.token === 'function' ? options.token(source) : options.token
      })
    }))
  );

  return results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
}
