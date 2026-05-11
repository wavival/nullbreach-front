import { useState, type CSSProperties } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm, type UseFormRegister, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { z } from "zod";
import {
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  ShieldHalf,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { request } from "@/services/api";
import { cn } from "@/lib/utils";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "@/types/auth";

/* ------------------------------------------------------------------ */
/*  Schemas + form types                                              */
/* ------------------------------------------------------------------ */

const loginSchema = z.object({
  email: z.string().min(1, "Email requerido").email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const registerSchema = z
  .object({
    email: z.string().min(1, "Email requerido").email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type Tab = "login" | "register";

/* ------------------------------------------------------------------ */
/*  Utils                                                             */
/* ------------------------------------------------------------------ */

function extractApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as unknown;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.detail === "string") return obj.detail;
      if (typeof obj.message === "string") return obj.message;
      const firstField = Object.values(obj).find(
        (v) => Array.isArray(v) && typeof v[0] === "string",
      ) as string[] | undefined;
      if (firstField && firstField[0]) return firstField[0];
    }
    return err.message || "Error de red";
  }
  return "Error inesperado";
}

const GRID_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(51,65,85,0.6) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(51,65,85,0.6) 0.5px, transparent 0.5px)",
  backgroundSize: "40px 40px",
};

/* Pseudo-random but stable: positions for particles. */
const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const left = ((i * 73) % 100) + (i % 2 === 0 ? 0 : 3);
  const top = ((i * 47) % 100) + (i % 3 === 0 ? 2 : 0);
  const size = 2 + (i % 3);
  const delay = (i * 0.7) % 6;
  const duration = 8 + (i % 5) * 2;
  return { left, top, size, delay, duration, idx: i };
});

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Login() {
  const { token, setToken, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/chat";
  const [tab, setTab] = useState<Tab>("login");

  if (token) return <Navigate to={from} replace />;

  function handleAuthSuccess(data: AuthResponse) {
    setToken(data.access, data.refresh);
    setUser(data.user);
    navigate(from, { replace: true });
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-surface via-surface to-surface-alt">
      {/* Grid overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={GRID_BG}
      />
      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 size-[480px] rounded-full bg-primary/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-40 size-[520px] rounded-full bg-secondary/10 blur-3xl pointer-events-none"
      />

      {/* Floating particles */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {PARTICLES.map((p) => (
          <span
            key={p.idx}
            className={cn(
              "absolute rounded-full",
              p.idx % 2 === 0 ? "bg-primary/30" : "bg-secondary/30",
              p.idx % 4 === 0 ? "animate-float-lg" : "animate-float",
            )}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-md py-2xl">
        <div className="w-full max-w-[400px] animate-card-in">
          <div className="flex items-center justify-center gap-sm mb-xl">
            <ShieldHalf className="text-primary size-7 drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
            <span className="font-headline text-h3 text-primary">
              NullBreach
            </span>
          </div>

          <div
            className={cn(
              "relative rounded p-xl",
              "border border-border/70",
              "bg-surface-alt/60 backdrop-blur-xl",
              "shadow-large",
            )}
          >
            {/* Tab bar */}
            <div
              role="tablist"
              aria-label="Authentication"
              className="relative flex border-b border-border mb-xl"
            >
              <TabButton
                active={tab === "login"}
                onClick={() => setTab("login")}
                id="tab-login"
                controls="panel-login"
              >
                Login
              </TabButton>
              <TabButton
                active={tab === "register"}
                onClick={() => setTab("register")}
                id="tab-register"
                controls="panel-register"
              >
                Registro
              </TabButton>
              {/* Sliding underline indicator */}
              <span
                aria-hidden="true"
                className="absolute bottom-[-1px] h-[2px] w-1/2 bg-primary rounded-full transition-transform duration-slow ease-slow shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                style={{
                  transform: `translateX(${tab === "login" ? "0%" : "100%"})`,
                }}
              />
            </div>

            {/* Cross-fade panels (remount on tab change) */}
            <div key={tab} className="animate-fade-in">
              {tab === "login" ? (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToRegister={() => setTab("register")}
                />
              ) : (
                <RegisterForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setTab("login")}
                />
              )}
            </div>
          </div>

          <p className="text-center text-body-sm text-foreground-muted mt-lg">
            Protected by NullBreach · Secure auth
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab button                                                        */
/* ------------------------------------------------------------------ */

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  id: string;
  controls: string;
}

function TabButton({
  active,
  onClick,
  children,
  id,
  controls,
}: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-controls={controls}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        "flex-1 px-md py-md text-body font-medium",
        "transition-colors duration-hover ease-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-t",
        active
          ? "text-foreground"
          : "text-foreground-muted hover:text-secondary",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating-label field with icon                                    */
/* ------------------------------------------------------------------ */

interface FloatingFieldProps<TForm extends Record<string, unknown>> {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  icon: LucideIcon;
  name: FieldPath<TForm>;
  register: UseFormRegister<TForm>;
  error?: string;
  delay?: number;
}

function FloatingField<TForm extends Record<string, unknown>>({
  id,
  label,
  type = "text",
  autoComplete,
  icon: Icon,
  name,
  register,
  error,
  delay = 0,
}: FloatingFieldProps<TForm>) {
  const errorId = `${id}-error`;
  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder=" "
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          {...register(name)}
          className={cn(
            "peer h-14 w-full rounded",
            "bg-surface/40 backdrop-blur-sm",
            "pl-10 pr-3 pt-5 pb-1 text-body text-foreground",
            "border placeholder-transparent",
            "transition-all duration-hover ease-hover",
            "focus:outline-none focus:bg-surface/70",
            error
              ? "border-error focus:border-error focus:shadow-[0_0_0_4px_rgba(255,139,124,0.15)]"
              : "border-border hover:border-neutral focus:border-primary focus:shadow-[0_0_0_4px_rgba(34,197,94,0.18)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
        <label
          htmlFor={id}
          className={cn(
            "absolute left-10 top-1/2 -translate-y-1/2 origin-left",
            "text-body pointer-events-none select-none",
            "transition-all duration-hover ease-hover",
            "peer-focus:top-[10px] peer-focus:translate-y-0 peer-focus:scale-[0.82]",
            "peer-[:not(:placeholder-shown)]:top-[10px]",
            "peer-[:not(:placeholder-shown)]:translate-y-0",
            "peer-[:not(:placeholder-shown)]:scale-[0.82]",
            error
              ? "text-error peer-focus:text-error"
              : "text-foreground-muted peer-focus:text-primary",
          )}
        >
          {label}
        </label>
        <Icon
          aria-hidden="true"
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none",
            "transition-colors duration-hover",
            error
              ? "text-error"
              : "text-foreground-muted peer-focus:text-primary",
          )}
        />
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-xs ml-xs text-body-sm text-error animate-fade-in"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Primary submit button (page-local; spec differs from DS Button)   */
/* ------------------------------------------------------------------ */

interface SubmitButtonProps {
  loading: boolean;
  children: React.ReactNode;
}

function SubmitButton({ loading, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "relative w-full h-12 rounded font-medium text-body",
        "bg-primary text-primary-foreground",
        "flex items-center justify-center gap-sm",
        "transition-all duration-hover ease-hover",
        "hover:brightness-110 hover:shadow-[0_8px_24px_-6px_rgba(34,197,94,0.55)]",
        "active:brightness-90 active:scale-[0.99]",
        "disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:brightness-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt",
        loading && "animate-pulse-glow",
      )}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" aria-label="Loading" />
      ) : (
        children
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Error banner                                                      */
/* ------------------------------------------------------------------ */

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-sm rounded px-md py-sm",
        "border border-error text-error",
        "bg-[rgba(255,139,124,0.1)]",
        "animate-slide-down",
      )}
    >
      <AlertCircle className="size-4 shrink-0 mt-[2px]" />
      <span className="text-body-sm">{message}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Login form                                                        */
/* ------------------------------------------------------------------ */

interface LoginFormProps {
  onSuccess: (data: AuthResponse) => void;
  onSwitchToRegister: () => void;
}

function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormData) {
    setApiError(null);
    try {
      const data = await request<AuthResponse>({
        url: "/auth/login/",
        method: "POST",
        data: values satisfies LoginRequest,
        skipAuth: true,
      });
      onSuccess(data);
    } catch (err) {
      setApiError(extractApiError(err));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      id="panel-login"
      role="tabpanel"
      aria-labelledby="tab-login"
      className="flex flex-col gap-lg"
      noValidate
    >
      <FormError message={apiError} />

      <FloatingField<LoginFormData>
        id="login-email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        icon={Mail}
        register={register}
        error={errors.email?.message}
        delay={0}
      />

      <FloatingField<LoginFormData>
        id="login-password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        icon={Lock}
        register={register}
        error={errors.password?.message}
        delay={50}
      />

      <div
        className="animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <SubmitButton loading={isSubmitting}>Login</SubmitButton>
      </div>

      <p
        className="text-body-sm text-foreground-muted text-center animate-fade-in-up"
        style={{ animationDelay: "150ms" }}
      >
        ¿No tienes cuenta?{" "}
        <SwitchLink onClick={onSwitchToRegister}>Regístrate</SwitchLink>
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Register form                                                     */
/* ------------------------------------------------------------------ */

interface RegisterFormProps {
  onSuccess: (data: AuthResponse) => void;
  onSwitchToLogin: () => void;
}

function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormData) {
    setApiError(null);
    try {
      const payload: RegisterRequest = {
        email: values.email,
        password: values.password,
      };
      const data = await request<AuthResponse>({
        url: "/auth/register/",
        method: "POST",
        data: payload,
        skipAuth: true,
      });
      onSuccess(data);
    } catch (err) {
      setApiError(extractApiError(err));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      id="panel-register"
      role="tabpanel"
      aria-labelledby="tab-register"
      className="flex flex-col gap-lg"
      noValidate
    >
      <FormError message={apiError} />

      <FloatingField<RegisterFormData>
        id="register-email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        icon={Mail}
        register={register}
        error={errors.email?.message}
        delay={0}
      />

      <FloatingField<RegisterFormData>
        id="register-password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        icon={Lock}
        register={register}
        error={errors.password?.message}
        delay={50}
      />

      <FloatingField<RegisterFormData>
        id="register-confirm"
        name="confirmPassword"
        label="Confirmar password"
        type="password"
        autoComplete="new-password"
        icon={Lock}
        register={register}
        error={errors.confirmPassword?.message}
        delay={100}
      />

      <div
        className="animate-fade-in-up"
        style={{ animationDelay: "150ms" }}
      >
        <SubmitButton loading={isSubmitting}>Crear cuenta</SubmitButton>
      </div>

      <p
        className="text-body-sm text-foreground-muted text-center animate-fade-in-up"
        style={{ animationDelay: "200ms" }}
      >
        ¿Ya tienes cuenta?{" "}
        <SwitchLink onClick={onSwitchToLogin}>Inicia sesión</SwitchLink>
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Switch-tab link (animated underline)                              */
/* ------------------------------------------------------------------ */

function SwitchLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-block text-primary font-medium",
        "transition-colors duration-hover ease-hover",
        "hover:text-primary-hover",
        "after:content-[''] after:absolute after:left-0 after:-bottom-[2px]",
        "after:h-[1px] after:w-full after:bg-primary",
        "after:origin-left after:scale-x-0 after:transition-transform after:duration-hover after:ease-hover",
        "hover:after:scale-x-100",
        "focus-visible:outline-none focus-visible:after:scale-x-100",
      )}
    >
      {children}
    </button>
  );
}
