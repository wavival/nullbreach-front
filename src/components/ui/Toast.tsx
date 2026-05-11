import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast";

const SUCCESS_DURATION = 3000;
const ERROR_DURATION = 4000;
const WARNING_DURATION = 3000;

const SUCCESS_STYLE = {
  background: "#1E293B",
  color: "#F1F5F9",
  border: "1px solid #22C55E",
} as const;

const ERROR_STYLE = {
  background: "#1E293B",
  color: "#F1F5F9",
  border: "1px solid #FF8B7C",
} as const;

const WARNING_STYLE = {
  background: "#1E293B",
  color: "#F1F5F9",
  border: "1px solid #FBBF24",
} as const;

export function showSuccess(message: string, duration?: number): string {
  return hotToast.success(message, {
    duration: duration ?? SUCCESS_DURATION,
    style: SUCCESS_STYLE,
    iconTheme: { primary: "#22C55E", secondary: "#0F172A" },
  });
}

export function showError(message: string, duration?: number): string {
  return hotToast.error(message, {
    duration: duration ?? ERROR_DURATION,
    style: ERROR_STYLE,
    iconTheme: { primary: "#FF8B7C", secondary: "#0F172A" },
  });
}

export function showWarning(message: string, duration?: number): string {
  return hotToast(message, {
    duration: duration ?? WARNING_DURATION,
    icon: "⚠️",
    style: WARNING_STYLE,
  });
}

export function ToastViewport() {
  return (
    <HotToaster
      position="top-right"
      gutter={8}
      containerStyle={{ top: 16, right: 16 }}
      toastOptions={{
        style: {
          fontSize: "14px",
          padding: "12px 16px",
          borderRadius: "4px",
          boxShadow: "0 8px 12px rgba(0, 0, 0, 0.4)",
          maxWidth: "420px",
        },
      }}
    />
  );
}
