/**
 * API client placeholder for future backend integration.
 * Currently unused — the app is fully frontend-only.
 */

import env from '../../config/env'

const BASE_URL = env.apiBaseUrl

export async function apiRequest(endpoint, options = {}) {
  if (!BASE_URL) {
    throw new Error('API base URL is not configured. This is a frontend-only build.')
  }

  const url = `${BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}
