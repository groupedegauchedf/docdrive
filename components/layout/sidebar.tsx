"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, Users, ScrollText, LogOut, FileText,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface SidebarProps {
  userRole: Role;
  userName: string;
}

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, adminOnly: false },
  { href: "/documents", label: "Documents", icon: FolderOpen, adminOnly: false },
  { href: "/admin/users", label: "Utilisateurs", icon: Users, adminOnly: true },
  { href: "/admin/audit", label: "Journal d'audit", icon: ScrollText, adminOnly: true },
];

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "ADMIN"
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <FileText className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-gray-900">DocDrive</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer utilisateur */}
      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{userRole === "ADMIN" ? "Administrateur" : "Utilisateur"}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
