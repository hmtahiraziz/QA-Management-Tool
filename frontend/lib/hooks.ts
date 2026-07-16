"use client";

import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "./api";
import { getAuthToken, clearAuthToken } from "./auth-storage";
import { DEFAULT_CHOICES, type AppChoices } from "./types";
import { sortByNewest } from "./utils";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined") {
    clearAuthToken();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }
  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json as T;
}

export function useChoices() {
  const [choices, setChoices] = useState<AppChoices>(DEFAULT_CHOICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const path = force ? "/api/choices?refresh=1" : "/api/choices";
      const result = await request<{ data: AppChoices }>(path, {
        signal: controller.signal,
      });
      setChoices({ ...DEFAULT_CHOICES, ...result.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load choices");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { choices, loading, error, refresh };
}

export function useCollection<T extends { id: string; createdTime?: string }>(
  endpoint: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await request<{ data: T[] }>(endpoint);
      setData(sortByNewest(result.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (body: unknown) => {
      const result = await request<{ data: T }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setData((prev) => sortByNewest([result.data, ...prev]));
      return result.data;
    },
    [endpoint],
  );

  const update = useCallback(
    async (id: string, body: unknown) => {
      const result = await request<{ data: T }>(`${endpoint}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setData((prev) =>
        sortByNewest(prev.map((item) => (item.id === id ? result.data : item))),
      );
      return result.data;
    },
    [endpoint],
  );

  const remove = useCallback(
    async (id: string) => {
      await request(`${endpoint}/${id}`, { method: "DELETE" });
      setData((prev) => prev.filter((item) => item.id !== id));
    },
    [endpoint],
  );

  return { data, loading, error, refresh, create, update, remove };
}
