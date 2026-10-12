/**
 * Centralized environment configuration.
 * Only VITE_ prefixed variables are exposed to the client.
 */

const env = {
  appName: import.meta.env.VITE_APP_NAME || 'Mock Test Platform',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  enableOcr: import.meta.env.VITE_ENABLE_OCR === 'true',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}

export default env
