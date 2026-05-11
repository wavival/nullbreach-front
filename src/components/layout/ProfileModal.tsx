import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, Mail, Trash, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { profileStore } from "@/services/profileStore";

interface ProfileModalProps {
  onClose: () => void;
}

const MAX_AVATAR_BYTES = 512 * 1024;

function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatar, setAvatar] = useState<string | null>(() =>
    user ? profileStore.getAvatar(user.email) : null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!user) return null;
  if (typeof document === "undefined") return null;

  const lastLogin = profileStore.getLastLogin(user.email);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    setUploadError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Selecciona una imagen.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setUploadError("Máximo 512 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) {
        setUploadError("No se pudo leer la imagen.");
        return;
      }
      profileStore.setAvatar(user.email, dataUrl);
      setAvatar(dataUrl);
    };
    reader.onerror = () => setUploadError("Error leyendo archivo.");
    reader.readAsDataURL(file);
  }

  function clearAvatar() {
    if (!user) return;
    profileStore.clearAvatar(user.email);
    setAvatar(null);
    setUploadError(null);
  }

  function handleLogout() {
    onClose();
    logout();
    navigate("/login", { replace: true });
  }

  const initial = (user.email || "?").trim().charAt(0).toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-lg">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className={cn(
          "relative z-10 w-full max-w-[400px]",
          "rounded border border-border/70",
          "bg-surface-alt/90 backdrop-blur-xl shadow-large",
          "p-xl animate-card-in",
        )}
      >
        <div className="flex items-start justify-between mb-lg">
          <h3
            id="profile-modal-title"
            className="font-headline text-h3 text-foreground"
          >
            Perfil
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={cn(
              "size-9 inline-flex items-center justify-center rounded",
              "text-foreground-muted hover:text-foreground",
              "hover:bg-surface/60 transition-colors duration-hover",
            )}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-md mb-xl">
          <div className="relative">
            <div
              className={cn(
                "size-20 rounded-full overflow-hidden flex items-center justify-center",
                "bg-primary/10 border border-primary/40",
                "shadow-[0_0_24px_-6px_rgba(34,197,94,0.45)]",
              )}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-headline text-h2 text-primary">
                  {initial}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cambiar avatar"
              className={cn(
                "absolute -bottom-1 -right-1 size-8 rounded-full",
                "inline-flex items-center justify-center",
                "bg-primary text-primary-foreground",
                "border-2 border-surface-alt",
                "transition-all duration-hover ease-hover",
                "hover:scale-110 hover:brightness-110",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              )}
            >
              <Camera className="size-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
          </div>
          <div className="min-w-0">
            <p className="text-body-sm text-foreground-muted">Signed in as</p>
            <p className="text-body font-medium text-foreground truncate">
              {user.email}
            </p>
            {avatar && (
              <button
                type="button"
                onClick={clearAvatar}
                className={cn(
                  "mt-xs inline-flex items-center gap-xs text-body-sm text-error",
                  "hover:underline underline-offset-2 transition-colors",
                )}
              >
                <Trash className="size-3.5" />
                Quitar avatar
              </button>
            )}
          </div>
        </div>

        {uploadError && (
          <p
            role="alert"
            className="mb-md text-body-sm text-error animate-fade-in"
          >
            {uploadError}
          </p>
        )}

        <dl className="flex flex-col gap-md mb-xl">
          <ProfileRow icon={Mail} label="Email" value={user.email} readonly />
          <ProfileRow
            label="Fecha de registro"
            value={formatDate(user.date_joined)}
          />
          <ProfileRow
            label="Último inicio de sesión"
            value={
              lastLogin
                ? formatDate(lastLogin)
                : "Esta es tu primera sesión registrada"
            }
          />
        </dl>

        <div className="flex justify-end gap-sm">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "h-10 px-lg rounded text-body font-medium",
              "bg-transparent border border-border text-foreground",
              "hover:bg-surface/60 hover:border-neutral",
              "transition-colors duration-hover ease-hover",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40",
            )}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "h-10 px-lg rounded text-body font-medium",
              "inline-flex items-center gap-sm",
              "bg-error text-tertiary-foreground",
              "transition-all duration-hover ease-hover",
              "hover:brightness-110 hover:shadow-[0_8px_24px_-6px_rgba(255,139,124,0.55)]",
              "active:brightness-90 active:scale-[0.99]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/50",
            )}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface ProfileRowProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  readonly?: boolean;
}

function ProfileRow({ icon: Icon, label, value, readonly }: ProfileRowProps) {
  return (
    <div className="flex flex-col gap-xs">
      <dt className="text-body-sm text-foreground-muted flex items-center gap-xs">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </dt>
      <dd
        className={cn(
          "text-body text-foreground rounded px-md py-sm",
          "bg-surface/40 border border-border",
          readonly && "text-foreground-muted",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
