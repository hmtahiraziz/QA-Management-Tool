"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/auth-storage";

export type AccessLevel = "readonly" | "full";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  access: AccessLevel;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isFullAccess: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function authRequest<T>(
  path: string,
  init?: RequestInit & { token?: string | null },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;

  const res = await fetch(apiUrl(path), { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const result = await authRequest<{ data: { user: AuthUser } }>("/api/auth/me", {
        token,
      });
      setUser(result.data.user);
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    function onFocus() {
      void refreshMe();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authRequest<{
      data: { token: string; user: AuthUser };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(result.data.token);
    setUser(result.data.user);
  }, []);

  const signup = useCallback(
    async (input: { email: string; password: string; name?: string }) => {
      const result = await authRequest<{
        data: { token: string; user: AuthUser };
      }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setAuthToken(result.data.token);
      setUser(result.data.user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isFullAccess: user?.access === "full",
      login,
      signup,
      logout,
      refreshMe,
    }),
    [user, loading, login, signup, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const AUTH_PATHS = new Set(["/login", "/signup"]);

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = AUTH_PATHS.has(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isAuthPage) {
      router.replace("/login");
    }
    if (user && isAuthPage) {
      router.replace("/");
    }
  }, [loading, user, isAuthPage, router]);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <span>Loading session…</span>
      </div>
    );
  }

  if (!user && !isAuthPage) return null;
  if (user && isAuthPage) return null;

  return <>{children}</>;
}
