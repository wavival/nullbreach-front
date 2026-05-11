import { useCallback, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { request, type ApiRequestConfig } from "@/services/api";

interface UseApiState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export function useApi<T>(config: ApiRequestConfig, immediate = false) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  });
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
        const data = await request<T>({ ...config, ...override });
        if (mounted.current) setState({ data, error: null, loading: false });
        return data;
      } catch (err) {
        const error =
          err instanceof AxiosError
            ? new Error(err.response?.data?.message ?? err.message)
            : (err as Error);
        if (mounted.current) setState({ data: null, error, loading: false });
        return null;
      }
    },
    [config],
  );

  useEffect(() => {
    if (immediate) void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return { ...state, execute };
}
