// In-memory access token store. Survives route changes but not full reloads.
// Refresh token lives in httpOnly cookie or localStorage per backend choice;
// here we keep it in memory too for simplicity.

let accessToken: string | null = null;
let refreshToken: string | null = null;

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export const tokenStore = {
  getAccess(): string | null {
    return accessToken;
  },
  getRefresh(): string | null {
    return refreshToken;
  },
  set(access: string | null, refresh?: string | null): void {
    accessToken = access;
    if (refresh !== undefined) refreshToken = refresh;
    listeners.forEach((l) => l(accessToken));
  },
  clear(): void {
    accessToken = null;
    refreshToken = null;
    listeners.forEach((l) => l(null));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
