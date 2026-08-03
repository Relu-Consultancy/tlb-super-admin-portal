/**
 * Auth service — wraps the `/api/v1/admin/auth/` endpoints.
 *
 * The HTTP client unwraps the `{ success, data }` envelope, so these functions
 * receive and return the inner `data` payloads directly.
 */

import { api } from '../core/client';
import { adminPath } from '../core/config';
import { setTokens, clearTokens, getRefreshToken } from '../core/token';
import type { AdminRole } from '../core/roles';

/** Compact admin object returned by the login endpoint. */
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  department: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  admin: AdminUser;
}

/** POST /auth/login/ — stores the returned token pair on success. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>(
    adminPath('auth/login/'),
    { email, password },
    { skipAuth: true },
  );
  setTokens({ access: data.access_token, refresh: data.refresh_token });
  return data;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/**
 * POST /auth/refresh/ — manual refresh. (The client also refreshes
 * automatically on 401; this is exposed for completeness.)
 */
export async function refresh(): Promise<RefreshResponse> {
  const refreshToken = getRefreshToken();
  const data = await api.post<RefreshResponse>(
    adminPath('auth/refresh/'),
    { refresh_token: refreshToken },
    { skipAuth: true },
  );
  setTokens({ access: data.access_token, refresh: data.refresh_token });
  return data;
}

/** POST /auth/logout/ — revokes the current session, then clears local tokens. */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await api.post(adminPath('auth/logout/'), { refresh_token: refreshToken });
    }
  } catch {
    /* best-effort: log out locally regardless of the server response */
  } finally {
    clearTokens();
  }
}

/** POST /auth/logout-all/ — revokes every active session for this admin. */
export async function logoutAll(): Promise<void> {
  try {
    await api.post(adminPath('auth/logout-all/'));
  } finally {
    clearTokens();
  }
}

/** POST /auth/change-password/ */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath('auth/change-password/'), {
    old_password: oldPassword,
    new_password: newPassword,
    // Required by the backend (not in the original doc).
    confirm_new_password: confirmPassword,
  });
}

/** POST /auth/forgot-password/ — always succeeds (no email enumeration). */
export async function forgotPassword(email: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(
    adminPath('auth/forgot-password/'),
    { email },
    { skipAuth: true },
  );
}

/** POST /auth/reset-password/ — completes a reset using the emailed token. */
export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(
    adminPath('auth/reset-password/'),
    {
      token,
      new_password: newPassword,
      // Required by the backend (not in the original doc).
      confirm_new_password: confirmPassword,
    },
    { skipAuth: true },
  );
}
