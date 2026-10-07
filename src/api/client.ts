import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { apiBaseUrl, apiV1Base } from '../config';

// Tokens con modo Recordarme (espejo de TokenStorage móvil):
// - persistente (default): localStorage, sobrevive al cierre del navegador.
// - efímero: sessionStorage, se pierde al cerrar la pestaña/ventana.
// - omitido (refresh de token): conserva el modo actual, sin "subir de nivel"
//   una sesión efímera a persistente.
const ACCESS_KEY = 'prosane.access';
const REFRESH_KEY = 'prosane.refresh';
let persistente = true;

export const tokenStore = {
  get access() {
    return sessionStorage.getItem(ACCESS_KEY) ?? localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return sessionStorage.getItem(REFRESH_KEY) ?? localStorage.getItem(REFRESH_KEY);
  },
  save(access: string, refresh: string, recordarme?: boolean) {
    if (recordarme !== undefined) persistente = recordarme;
    if (persistente) {
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
      localStorage.setItem(ACCESS_KEY, access);
      localStorage.setItem(REFRESH_KEY, refresh);
    } else {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      sessionStorage.setItem(ACCESS_KEY, access);
      sessionStorage.setItem(REFRESH_KEY, refresh);
    }
  },
  clear() {
    persistente = true;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

let onLogout: (() => void) | null = null;
export function setOnLogout(fn: (() => void) | null) {
  onLogout = fn;
}

// Cliente para /auth/* (login, me, change-password, reset).
export const authApi: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

// Cliente para el resto de /api/v1/* (operativos, escuelas, usuarios, ...).
export const v1Api: AxiosInstance = axios.create({
  baseURL: apiV1Base,
  timeout: 15000,
});

// Interceptor de JWT: agrega Bearer a cada request (igual que AuthInterceptor).
for (const api of [authApi, v1Api]) {
  api.interceptors.request.use((config) => {
    const token = tokenStore.access;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

// Interceptor de refresh: ante 401 intenta renovar el access con el refresh
// (igual que RefreshInterceptor) y reintenta una vez. Si falla, logout.
let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post(`${apiBaseUrl}/token/refresh/`, { refresh: tokenStore.refresh })
      .then((r) => {
        const access = r.data?.access as string | undefined;
        if (access && tokenStore.refresh) {
          tokenStore.save(access, tokenStore.refresh);
          return access;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

for (const api of [authApi, v1Api]) {
  api.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
      if (error.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        const access = await refreshAccess();
        if (access) {
          original.headers = original.headers ?? {};
          (original.headers as Record<string, string>).Authorization = `Bearer ${access}`;
          return api(original);
        }
        tokenStore.clear();
        onLogout?.();
      }
      return Promise.reject(error);
    },
  );
}

/** Mensaje amigable desde una respuesta de error DRF (como error_mapper). */
export function apiErrorMessage(e: unknown, fallback = 'Hubo un problema, probá de nuevo'): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as unknown;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (typeof obj.detail === 'string') return obj.detail;
      if (typeof obj.error === 'string') return obj.error;
      for (const v of Object.values(obj)) {
        if (Array.isArray(v) && v.length > 0) return String(v[0]);
        if (typeof v === 'string') return v;
      }
    }
    if (e.code === 'ERR_NETWORK') return 'Sin conexión con el servidor. Verificá la red.';
  }
  return fallback;
}
