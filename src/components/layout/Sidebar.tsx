import { NavLink } from "react-router-dom";
import { MessageSquare, ScanSearch, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/analyzer", label: "Analyzer", icon: ScanSearch },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "z-40 bg-surface-alt border-r border-border",
          "w-sidebar shrink-0 flex flex-col",
          // mobile: fixed overlay
          "fixed inset-y-0 left-0 transition-transform duration-modal ease-modal",
          open ? "translate-x-0" : "-translate-x-full",
          // lg+: static, always visible
          "lg:static lg:translate-x-0 lg:flex",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-lg h-navbar border-b border-border lg:hidden">
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

        <nav className="flex flex-col gap-md p-lg">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-md px-md py-sm rounded text-body font-medium",
                  "transition-colors duration-hover ease-hover",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-surface",
                )
              }
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
