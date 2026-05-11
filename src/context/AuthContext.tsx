import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { tokenStore } from "@/services/tokenStore";
import type { AuthContextValue, User } from "@/types/auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(tokenStore.getAccess());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => tokenStore.subscribe(setTokenState), []);

  // Reserved for future bootstrap (e.g., fetch /auth/me on app start
  // if a refresh-token cookie is present). Currently no-op.
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const setToken = useCallback(
    (access: string | null, refresh?: string | null) => {
      if (access === null) {
        tokenStore.clear();
      } else {
        tokenStore.set(access, refresh ?? undefined);
      }
    },
    [],
  );

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, setToken, setUser, logout }),
    [user, token, isLoading, setToken, setUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
