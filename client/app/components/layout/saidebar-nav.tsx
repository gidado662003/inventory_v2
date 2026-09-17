"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/app/components/ui/button";
import { ThemeToggle } from "@/app/components/theme-toggle";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Boxes,
  LogOut,
} from "lucide-react";

const navItems = [
  // { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/inventory", label: "Inventory", icon: Boxes },
] as const;

interface SidebarNavProps {
  onNavigate?: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function SidebarNav({
  onNavigate,
  onLogout,
  isLoggingOut,
}: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-blue-400/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-border/40 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-border/40 pt-4">
        <div>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </>
  );
}
