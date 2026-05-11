import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, ShieldHalf, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, token, logout } = useAuth();
  const isAuthenticated = !!token;
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="h-navbar w-full border-b border-border bg-surface">
      <div className="h-full flex items-center justify-between px-lg md:px-xl gap-lg">
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
            className="flex items-center gap-sm font-headline text-h4"
          >
            <ShieldHalf className="text-primary size-6" />
            <span className="text-primary">NullBreach</span>
          </Link>
        </div>

        <div className="flex items-center gap-md">
          {isAuthenticated ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-sm rounded px-md py-sm",
                  "text-body text-foreground",
                  "hover:bg-surface-alt transition-colors duration-hover ease-hover",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                )}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <UserIcon className="size-5 text-foreground-muted" />
                <span className="hidden md:inline max-w-[180px] truncate">
                  {user?.email ?? "Account"}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-foreground-muted transition-transform duration-hover",
                    menuOpen && "rotate-180",
                  )}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className={cn(
                    "absolute right-0 mt-sm w-56",
                    "rounded border border-border bg-surface-alt shadow-medium",
                    "py-xs animate-fade-in",
                  )}
                >
                  <div className="px-md py-sm border-b border-border">
                    <p className="text-body-sm text-foreground-muted">
                      Signed in as
                    </p>
                    <p className="text-body text-foreground truncate">
                      {user?.email ?? "—"}
                    </p>
                  </div>
                  <MenuItem
                    icon={UserIcon}
                    label="Profile"
                    onClick={() => setMenuOpen(false)}
                  />
                  <MenuItem
                    icon={LogOut}
                    label="Logout"
                    onClick={handleLogout}
                    danger
                  />
                </div>
              )}
            </div>
          ) : (
            <Button variant="primary" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-sm px-md py-sm text-body text-left",
        "transition-colors duration-hover ease-hover",
        "hover:bg-surface focus-visible:outline-none focus-visible:bg-surface",
        danger ? "text-error" : "text-foreground",
      )}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </button>
  );
}
