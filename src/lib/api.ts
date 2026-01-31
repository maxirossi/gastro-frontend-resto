/**
 * Determina la URL base de la API según el entorno
 * - En producción: usa `/api` (ruta relativa que Nginx proxy a backend)
 * - En desarrollo: usa VITE_API_BASE_URL o `http://localhost:3000` por defecto
 */
const isProd = import.meta.env.PROD;

export const API_BASE_URL = isProd
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
