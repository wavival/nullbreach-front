import { Link } from "react-router-dom";
import { Menu, ShieldHalf } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="h-navbar w-full border-b border-border bg-surface-alt">
      <div className="h-full flex items-center justify-between px-xl gap-lg">
        <div className="flex items-center gap-md">
          {isAuthenticated && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu />
            </Button>
          )}
          <Link
            to={isAuthenticated ? "/chat" : "/login"}
            className="flex items-center gap-sm font-headline text-h4 text-foreground"
          >
            <ShieldHalf className="text-primary" />
            <span>NullBreach</span>
          </Link>
        </div>

        <nav className="flex items-center gap-md">
          {isAuthenticated ? (
            <>
              {user?.email && (
                <span className="hidden md:inline text-body-sm text-foreground-muted">
                  {user.email}
                </span>
              )}
              <Button variant="outlined" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
