import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const { token } = useAuth();
  const isAuthenticated = !!token;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const fullWidth = location.pathname.startsWith("/chat");

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <Navbar
        onToggleSidebar={
          isAuthenticated ? () => setSidebarOpen((v) => !v) : undefined
        }
      />
      <div className="flex flex-1 min-h-0">
        {isAuthenticated && (
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          {fullWidth ? (
            <Outlet />
          ) : (
            <div className="mx-auto max-w-[1200px] px-md md:px-lg lg:px-xl py-xl">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
