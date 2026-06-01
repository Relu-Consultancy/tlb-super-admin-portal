/**
 * Token storage.
 *
 * Per the API guidance, admin JWTs are NOT kept in localStorage. We use
 * sessionStorage so tokens are scoped to the tab/session:
 *   - access_token  — short-lived (1 hr); refreshed automatically on 401.
 *   - refresh_token — rotates on every use; we always persist the newest one.
 *
 * (A true httpOnly refresh cookie would require the backend to issue Set-Cookie;
 * this API returns tokens in the response body, so the client must store them.)
 */

const ACCESS_KEY = 'tlb_admin_access_token';
const REFRESH_KEY = 'tlb_admin_refresh_token';

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable (e.g. private mode) — ignore */
  }
}

function remove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getAccessToken(): string | null {
  return read(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return read(REFRESH_KEY);
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export function setTokens({ access, refresh }: TokenPair): void {
  write(ACCESS_KEY, access);
  write(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  remove(ACCESS_KEY);
  remove(REFRESH_KEY);
}

/** True when we have a session to work with (a refresh token, at minimum). */
export function hasSession(): boolean {
  return !!getRefreshToken();
}
