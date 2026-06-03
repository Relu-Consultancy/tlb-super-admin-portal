/**
 * Auth context — single source of truth for the admin session.
 *
 * Holds the authenticated admin profile, exposes `login`/`logout`, and provides
 * permission helpers for gating UI. Listens for `auth:expired` (emitted by the
 * HTTP client when a refresh fails) to drop the session and surface a message.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  logoutAll as apiLogoutAll,
  getProfile,
  hasSession,
  SESSION_EXPIRED_EVENT,
  type AdminProfile,
  type SessionExpiredDetail,
} from '../lib/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  admin: AdminProfile | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  /** A message to show on the login screen after a forced logout / expiry. */
  sessionMessage: string | null;
  clearSessionMessage: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Revoke every active session for this admin (logs out everywhere). */
  logoutAll: () => Promise<void>;
  /** Re-fetch the profile (e.g. after a permissions/role change). */
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Map a session-expiry code to a user-facing message (API doc §8). */
function expiryMessage(detail?: SessionExpiredDetail): string {
  switch (detail?.code) {
    case 'SESSION_REVOKED':
      return 'You were signed out. Please log in again.';
    case 'TOKEN_REVOKED':
      return 'Your session has ended. Please log in again.';
    case 'ADMIN_INACTIVE':
      return 'Your account has been deactivated.';
    default:
      return 'Your session has expired. Please log in again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const profile = await getProfile();
    setAdmin(profile);
    setStatus('authenticated');
  }, []);

  // On mount: if a session token exists, validate it by loading the profile.
  useEffect(() => {
    let cancelled = false;
    if (!hasSession()) {
      setStatus('unauthenticated');
      return;
    }
    getProfile()
      .then((profile) => {
        if (!cancelled) {
          setAdmin(profile);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdmin(null);
          setStatus('unauthenticated');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // React to forced logout / token-refresh failure from the HTTP client.
  useEffect(() => {
    const onExpired = (e: Event) => {
      const detail = (e as CustomEvent<SessionExpiredDetail>).detail;
      setAdmin(null);
      setStatus('unauthenticated');
      setSessionMessage(expiryMessage(detail));
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setSessionMessage(null);
      await apiLogin(email, password);
      // Fetch the full profile so we have effective_permissions for gating.
      await loadProfile();
    },
    [loadProfile],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setAdmin(null);
      setStatus('unauthenticated');
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await apiLogoutAll();
    } finally {
      setAdmin(null);
      setStatus('unauthenticated');
    }
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!admin) return false;
      if (admin.role === 'SUPER_ADMIN') return true;
      return admin.effective_permissions.includes(permission);
    },
    [admin],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => permissions.some((p) => hasPermission(p)),
    [hasPermission],
  );

  const value: AuthContextValue = {
    admin,
    status,
    isAuthenticated: status === 'authenticated',
    sessionMessage,
    clearSessionMessage: () => setSessionMessage(null),
    login,
    logout,
    logoutAll,
    refreshProfile: loadProfile,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
