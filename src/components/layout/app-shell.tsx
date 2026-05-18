"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { MobileDrawer } from "./mobile-drawer";
import { MobileTopbar } from "./mobile-topbar";
import type { User } from "@/types";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar — desktop only */}
        <div className="hidden md:block">
          <Topbar user={user} />
        </div>

        {/* Header mobile */}
        <MobileTopbar user={user} onMenuClick={() => setDrawerOpen(true)} />

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>

        {/* Navegação inferior mobile */}
        <MobileNav onMoreClick={() => setDrawerOpen(true)} />
      </div>

      {/* Drawer lateral mobile */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
