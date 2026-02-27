// In dev use /api so requests go through Vite proxy; avoids port/endpoint mismatch
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "http://localhost:3000/api");
/** Base URL for static assets (uploads) - no trailing slash. In dev, use '' so /uploads proxies via Vite. */
export const API_ORIGIN = import.meta.env.DEV
  ? ''
  : API_BASE_URL.replace(/\/api\/?$/, '');