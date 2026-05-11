export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface RefreshResponse {
  access: string;
  refresh?: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setToken: (token: string | null, refresh?: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}
