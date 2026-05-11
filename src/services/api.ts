import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { tokenStore } from "./tokenStore";
import type { RefreshResponse } from "@/types/auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipAuth?: boolean;
}

api.interceptors.request.use((config) => {
  const cfg = config as RetriableConfig;
  if (cfg._skipAuth) return cfg;
  const token = tokenStore.getAccess();
  if (token) {
    cfg.headers.set("Authorization", `Bearer ${token}`);
  }
  return cfg;
});

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const res = await axios.post<RefreshResponse>(
      `${BASE_URL}/auth/refresh/`,
      { refresh },
      { headers: { "Content-Type": "application/json" } },
    );
    tokenStore.set(res.data.access, res.data.refresh ?? refresh);
    return res.data.access;
  } catch {
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (!original || original._retry || original._skipAuth) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= performRefresh().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }
    original.headers.set("Authorization", `Bearer ${newToken}`);
    return api.request(original);
  },
);

export type ApiRequestConfig = AxiosRequestConfig & { skipAuth?: boolean };

export async function request<T>(config: ApiRequestConfig): Promise<T> {
  const { skipAuth, ...rest } = config;
  const res = await api.request<T>({
    ...rest,
    ...(skipAuth ? { _skipAuth: true } : {}),
  } as AxiosRequestConfig);
  return res.data;
}
