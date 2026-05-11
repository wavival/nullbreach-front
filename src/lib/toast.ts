export type ToastVariant = "error" | "success" | "info" | "warning";

export interface ToastPayload {
  id: number;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration: number;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
}

type Listener = (t: ToastPayload) => void;

const DEFAULT_DURATION = 4000;
const listeners = new Set<Listener>();
let counter = 1;

function emit(
  variant: ToastVariant,
  message: string,
  opts?: ToastOptions,
): void {
  if (!message) return;
  const payload: ToastPayload = {
    id: counter++,
    variant,
    message,
    title: opts?.title,
    duration: opts?.duration ?? DEFAULT_DURATION,
  };
  listeners.forEach((l) => l(payload));
}

export const toast = {
  emit,
  error: (message: string, opts?: ToastOptions) => emit("error", message, opts),
  success: (message: string, opts?: ToastOptions) =>
    emit("success", message, opts),
  info: (message: string, opts?: ToastOptions) => emit("info", message, opts),
  warning: (message: string, opts?: ToastOptions) =>
    emit("warning", message, opts),
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
