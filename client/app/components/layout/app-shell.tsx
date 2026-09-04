"use client";

import { useLogout } from "@/lib/api/auth/queries";
import { Button } from "@/app/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SidebarNav } from "./saidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const logout = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Inventory
            </p>
            <h1 className="text-lg font-semibold">Manager</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-[calc(100vh-var(--header-height))] md:min-h-screen">
        {/* Sidebar - Desktop (Fixed) */}
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 shrink-0 border-r border-border/60 bg-background p-6 md:flex md:flex-col">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              LANAB
            </p>
          </div>

          <SidebarNav onLogout={handleLogout} isLoggingOut={logout.isPending} />
        </aside>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border/60 bg-background p-6 shadow-xl md:hidden">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Inventory
                  </p>
                  <h1 className="text-xl font-semibold">Manager</h1>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <SidebarNav
                onNavigate={() => setIsMobileMenuOpen(false)}
                onLogout={handleLogout}
                isLoggingOut={logout.isPending}
              />
            </aside>
          </>
        )}

        {/* Main content with left padding to account for fixed sidebar */}
        <main className="flex-1 p-6 md:ml-64">{children}</main>
      </div>
    </div>
  );
}
