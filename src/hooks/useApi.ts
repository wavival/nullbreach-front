import { useCallback, useEffect, useRef, useState } from "react";
import { request, type ApiRequestConfig } from "@/services/api";
import { ApiError, parseApiError } from "@/lib/errors";

interface UseApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

/**
 * Pass a memoized `config` (via useMemo) — the hook treats it as a stable
 * reference. `execute` accepts a per-call override.
 */
export function useApi<T>(config: ApiRequestConfig, immediate = false) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  });
  const configRef = useRef(config);
  configRef.current = config;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const execute = useCallback(
    async (override?: Partial<ApiRequestConfig>): Promise<T | null> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await request<T>({ ...configRef.current, ...override });
        if (mounted.current) setState({ data, error: null, loading: false });
        return data;
      } catch (err) {
        const parsed = parseApiError(err);
        const apiError = new ApiError(parsed.message, parsed.status, parsed.data);
        if (mounted.current) {
          setState({ data: null, error: apiError, loading: false });
        }
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (immediate) void execute();
  }, [immediate, execute]);

  return { ...state, execute };
}
