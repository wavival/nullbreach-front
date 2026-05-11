import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast, type ToastPayload, type ToastVariant } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastVariant, LucideIcon> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  error: "border-error text-error bg-[rgba(255,139,124,0.1)]",
  success: "border-primary text-primary bg-primary/10",
  info: "border-secondary text-secondary bg-secondary/10",
  warning: "border-warning text-warning bg-warning/10",
};

export function Toaster() {
  const [items, setItems] = useState<ToastPayload[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  useEffect(() => {
    return toast.subscribe((t) => {
      setItems((prev) => [...prev, t]);
      window.setTimeout(() => dismiss(t.id), t.duration);
    });
  }, [dismiss]);

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      className={cn(
        "fixed z-[60] flex flex-col gap-sm",
        "top-md right-md max-w-sm w-[calc(100%-2rem)]",
        "pointer-events-none",
      )}
    >
      {items.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast: t,
  onDismiss,
}: {
  toast: ToastPayload;
  onDismiss: () => void;
}) {
  const Icon = ICONS[t.variant];
  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto",
        "flex items-start gap-sm rounded px-md py-sm",
        "border bg-surface-alt/90 backdrop-blur-xl shadow-medium",
        "animate-slide-down",
        VARIANT_CLASSES[t.variant],
      )}
    >
      <Icon className="size-4 shrink-0 mt-[2px]" />
      <div className="flex-1 min-w-0">
        {t.title && (
          <p className="text-body font-medium text-foreground truncate">
            {t.title}
          </p>
        )}
        <p className="text-body-sm text-foreground break-words">{t.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className={cn(
          "shrink-0 size-6 inline-flex items-center justify-center rounded",
          "text-foreground-muted hover:text-foreground",
          "hover:bg-surface/60 transition-colors duration-hover",
        )}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
