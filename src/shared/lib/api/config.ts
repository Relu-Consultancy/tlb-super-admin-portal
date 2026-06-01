/**
 * Central API configuration.
 *
 * `VITE_API_BASE_URL` should be the API **host** (scheme + host[:port]), e.g.
 *   - local dev:   http://localhost:8000
 *   - production:  https://tlb-api.reluconsultancy.in
 *
 * All admin endpoints live under `/api/v1/admin/` — use `adminPath()` to build
 * them so the prefix lives in exactly one place.
 */

const DEFAULT_BASE_URL = 'http://localhost:8000';

/** API host, with any trailing slash stripped. */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL
).replace(/\/+$/, '');

/** Shared path prefix for every admin endpoint. */
export const ADMIN_API_PREFIX = '/api/v1/admin';

/**
 * Build an admin endpoint path. Trailing slashes are preserved (Django requires
 * them), e.g. `adminPath('auth/login/')` -> `/api/v1/admin/auth/login/`.
 */
export function adminPath(path: string): string {
  return `${ADMIN_API_PREFIX}/${path.replace(/^\/+/, '')}`;
}

/** Default request timeout in milliseconds. */
export const API_TIMEOUT = 30_000;
