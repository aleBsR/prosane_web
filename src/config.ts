// Equivalente a AppConfig de la app móvil (lib/core/config/app_config.dart).
// La base termina en .../api/v1/auth (login/refresh); apiV1Base quita el
// sufijo /auth para el resto (operativos, escuelas, usuarios, ...).
const rawBaseUrl: string =
  import.meta.env.VITE_API_AUTH_URL ?? 'http://localhost:8000/api/v1/auth';

// Trim defensivo: un espacio accidental al final (ej. al pegar la URL en la
// terminal) rompía todas las llamadas con 404 (/auth%20/token/).
export const apiBaseUrl: string = rawBaseUrl.trim().replace(/\/+$/, '');

export const apiV1Base: string = apiBaseUrl.endsWith('/auth')
  ? apiBaseUrl.slice(0, -'/auth'.length)
  : apiBaseUrl;
