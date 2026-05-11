import { AxiosError } from "axios";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface ParsedApiError {
  status: number;
  message: string;
  data: unknown;
}

const FALLBACK = "Algo salió mal.";

const STATUS_DEFAULTS: Record<number, string> = {
  400: "Solicitud inválida.",
  401: "Sesión expirada, inicia sesión.",
  403: "No tienes permiso para esta acción.",
  404: "Recurso no encontrado.",
  409: "Conflicto con el estado actual del recurso.",
  422: "Datos inválidos.",
  429: "Demasiadas solicitudes. Inténtalo en un momento.",
  500: "Error del servidor.",
  502: "Servidor no disponible.",
  503: "Servicio temporalmente fuera de línea.",
  504: "Tiempo de espera del servidor.",
};

function extractBodyMessage(data: unknown): string | null {
  if (typeof data === "string" && data.trim().length > 0) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string" && obj.detail.trim().length > 0) {
      return obj.detail;
    }
    if (typeof obj.message === "string" && obj.message.trim().length > 0) {
      return obj.message;
    }
    const firstField = Object.values(obj).find(
      (v) => Array.isArray(v) && typeof v[0] === "string",
    ) as string[] | undefined;
    if (firstField && firstField[0]) return firstField[0];
  }
  return null;
}

function statusDefault(status: number): string {
  return (
    STATUS_DEFAULTS[status] ??
    (status >= 500 ? "Error del servidor." : FALLBACK)
  );
}

export function parseApiError(err: unknown): ParsedApiError {
  if (err instanceof ApiError) {
    return { status: err.status, message: err.message, data: err.data };
  }
  if (err instanceof AxiosError) {
    if (err.code === "ECONNABORTED") {
      return {
        status: 0,
        message: "Tiempo de espera agotado. Inténtalo de nuevo.",
        data: null,
      };
    }
    if (err.code === "ERR_NETWORK" || !err.response) {
      return {
        status: 0,
        message: "Sin conexión. Verifica tu internet.",
        data: null,
      };
    }
    const status = err.response.status;
    const data = err.response.data ?? null;
    const fromBody = extractBodyMessage(data);
    return {
      status,
      message: fromBody ?? statusDefault(status),
      data,
    };
  }
  if (err instanceof Error) {
    return { status: 0, message: err.message || FALLBACK, data: null };
  }
  return { status: 0, message: FALLBACK, data: null };
}

export function formatApiError(err: unknown): string {
  return parseApiError(err).message;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const parsed = parseApiError(err);
  return new ApiError(parsed.message, parsed.status, parsed.data);
}
