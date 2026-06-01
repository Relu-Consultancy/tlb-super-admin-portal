/**
 * HTTP client over the Fetch API, tailored to the TLB admin backend.
 *
 * Responsibilities:
 *  - Prefix requests with the configured API base URL.
 *  - Inject `Authorization: Bearer <access_token>`.
 *  - Serialize JSON bodies; unwrap the `{ success, data, error }` envelope.
 *  - Normalize failures into a typed `ApiError` (carrying the backend `code`).
 *  - On a 401, transparently refresh the access token once and retry. If the
 *    refresh fails, clear the session and emit `auth:expired` for the app to
 *    redirect to login.
 *  - Enforce a request timeout via `AbortController`.
 */

import { API_BASE_URL, API_TIMEOUT, adminPath } from './config';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './token';

/** Event name dispatched when the session can no longer be recovered. */
export const SESSION_EXPIRED_EVENT = 'auth:expired';

export interface SessionExpiredDetail {
  /** Backend error code if known (e.g. SESSION_REVOKED, TOKEN_REVOKED). */
  code?: string;
}

function emitSessionExpired(detail: SessionExpiredDetail = {}): void {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail }));
  }
}

/** Structured error for any non-2xx response or network/timeout failure. */
export class ApiError extends Error {
  /** HTTP status code, or 0 for network/timeout errors. */
  readonly status: number;
  /** Backend error code from the envelope (e.g. `INVALID_CREDENTIALS`), if any. */
  readonly code: string | null;
  /** Parsed response body, if any. */
  readonly data: unknown;

  constructor(message: string, status: number, code: string | null = null, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }

  /** True for connectivity / timeout failures (no HTTP response received). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** True for 401/403. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Query params appended to the URL. Nullish values are skipped. */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** Request body — plain objects are JSON-serialized automatically. */
  body?: unknown;
  /** Skip attaching the Authorization header for this request. */
  skipAuth?: boolean;
  /** Override the default timeout (ms). */
  timeout?: number;
  /** @internal marks a request that has already been retried after a refresh. */
  _retried?: boolean;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = /^https?:\/\//i.test(path)
    ? new URL(path)
    : new URL(`${API_BASE_URL}/${path.replace(/^\/+/, '')}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    }
  }
  return url.toString();
}

function isJsonBody(body: unknown): boolean {
  if (body == null) return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false;
  if (typeof Blob !== 'undefined' && body instanceof Blob) return false;
  if (body instanceof ArrayBuffer) return false;
  if (typeof body === 'string') return false;
  return true;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// ---------------------------------------------------------------------------
// Token refresh (single-flight) — kept here, using a bare fetch, to avoid a
// circular dependency on the auth service.
// ---------------------------------------------------------------------------

let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(buildUrl(adminPath('auth/refresh/')), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const json = safeJsonParse(await res.text());
    if (
      isRecord(json) &&
      json.success === true &&
      isRecord(json.data) &&
      typeof json.data.access_token === 'string' &&
      typeof json.data.refresh_token === 'string'
    ) {
      setTokens({ access: json.data.access_token, refresh: json.data.refresh_token });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Refresh the access token at most once concurrently. */
function ensureRefreshed(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// ---------------------------------------------------------------------------

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, body, skipAuth, timeout, headers, _retried, ...rest } = options;

  const finalHeaders = new Headers(headers);
  let finalBody: BodyInit | undefined;

  if (body !== undefined) {
    if (isJsonBody(body)) {
      finalHeaders.set('Content-Type', 'application/json');
      finalBody = JSON.stringify(body);
    } else {
      finalBody = body as BodyInit;
    }
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (!finalHeaders.has('Accept')) {
    finalHeaders.set('Accept', 'application/json');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout ?? API_TIMEOUT);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
      ...rest,
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    throw new ApiError(aborted ? 'Request timed out' : 'Network request failed', 0, null, err);
  }
  clearTimeout(timer);

  // Parse the body (JSON when advertised, otherwise raw text).
  const contentType = response.headers.get('content-type') || '';
  let raw: unknown = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) raw = contentType.includes('application/json') ? safeJsonParse(text) : text;
  }

  // ---- 401: attempt a single transparent refresh + retry ----
  if (response.status === 401 && !skipAuth && !_retried) {
    const refreshed = await ensureRefreshed();
    if (refreshed) {
      return request<T>(method, path, { ...options, _retried: true });
    }
    const code = extractCode(raw);
    emitSessionExpired({ code: code ?? undefined });
    throw new ApiError(extractMessage(raw, response), 401, code, raw);
  }

  // ---- Unwrap the standard envelope ----
  if (isRecord(raw) && typeof raw.success === 'boolean') {
    if (raw.success) {
      return raw.data as T;
    }
    const code = extractCode(raw);
    throw new ApiError(extractMessage(raw, response), response.status, code, raw);
  }

  // ---- Non-enveloped fallback ----
  if (!response.ok) {
    throw new ApiError(extractMessage(raw, response), response.status, null, raw);
  }
  return raw as T;
}

function extractCode(raw: unknown): string | null {
  if (isRecord(raw) && isRecord(raw.error) && typeof raw.error.code === 'string') {
    return raw.error.code;
  }
  return null;
}

function extractMessage(raw: unknown, response: Response): string {
  if (isRecord(raw) && isRecord(raw.error) && typeof raw.error.message === 'string') {
    return raw.error.message;
  }
  if (isRecord(raw) && typeof raw.message === 'string') {
    return raw.message;
  }
  return response.statusText || `Request failed with status ${response.status}`;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};
