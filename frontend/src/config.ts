/**
 * In dev, use '' so requests go to same origin and Vite proxies to backend.
 * In prod, use VITE_API_URL or fallback to backend URL.
 */
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ??
  (import.meta.env.DEV ? '' : 'http://localhost:5000') ?? '';

/**
 * Base URL used for generated frontend links such as student invite URLs.
 * Prefer an explicit VITE_FRONTEND_URL, otherwise use the current browser origin.
 */
export const FRONTEND_BASE_URL =
  (import.meta as any).env?.VITE_FRONTEND_URL ??
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
