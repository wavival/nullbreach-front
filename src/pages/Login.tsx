import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Login() {
  const { token } = useAuth();
  if (token) return <Navigate to="/chat" replace />;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface px-md">
      <div className="w-full max-w-[400px] rounded border border-border bg-surface-alt p-xl shadow-base">
        <h1 className="font-headline text-h3 text-foreground">Login</h1>
        <p className="text-body-sm text-foreground-muted mt-xs">
          Page stub — form goes here.
        </p>
      </div>
    </div>
  );
}
