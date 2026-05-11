import { NavLink, useNavigate } from "react-router-dom";
import { Code2, Home, LogOut, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/analyzer", label: "Analyzer", icon: Code2 },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    onClose();
    logout();
    navigate("/login", { replace: true });
  }

  const itemClass =
    "flex items-center gap-md px-md py-sm rounded text-body font-medium transition-colors duration-hover ease-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-alt";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/50 md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "z-40 bg-surface-alt border-r border-border",
          "w-sidebar shrink-0 flex flex-col",
          "fixed inset-y-0 left-0 transition-transform duration-modal ease-modal",
          open ? "translate-x-0" : "-translate-x-full",
          "md:static md:translate-x-0 md:flex",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-lg h-navbar border-b border-border md:hidden">
          <span className="font-headline text-h4">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </Button>
        </div>

        <nav className="flex-1 flex flex-col gap-md p-lg">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  itemClass,
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-surface",
                )
              }
            >
              <Icon className="size-6 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-lg border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(itemClass, "w-full text-error hover:bg-surface")}
          >
            <LogOut className="size-6 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
