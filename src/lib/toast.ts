import { showError, showSuccess, showWarning } from "@/components/ui/Toast";
import { toast as hotToast } from "react-hot-toast";

export type ToastVariant = "error" | "success" | "info" | "warning";

export interface ToastOptions {
  title?: string;
  duration?: number;
}

function withTitle(message: string, title?: string): string {
  return title ? `${title}\n${message}` : message;
}

export const toast = {
  error: (message: string, opts?: ToastOptions): string =>
    showError(withTitle(message, opts?.title), opts?.duration),
  success: (message: string, opts?: ToastOptions): string =>
    showSuccess(withTitle(message, opts?.title), opts?.duration),
  warning: (message: string, opts?: ToastOptions): string =>
    showWarning(withTitle(message, opts?.title), opts?.duration),
  info: (message: string, opts?: ToastOptions): string =>
    hotToast(withTitle(message, opts?.title), {
      duration: opts?.duration ?? 3000,
      style: {
        background: "#1E293B",
        color: "#F1F5F9",
        border: "1px solid #3B82F6",
      },
    }),
  dismiss: (id?: string): void => hotToast.dismiss(id),
};
