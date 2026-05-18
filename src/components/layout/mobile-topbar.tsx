"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, ChevronDown, ShoppingCart } from "lucide-react";
import type { User } from "@/types";
import { roleLabels } from "@/lib/security/roles";

interface MobileTopbarProps {
  user: User;
  onMenuClick: () => void;
}

export function MobileTopbar({ user, onMenuClick }: MobileTopbarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
      <button
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1.5">
        <ShoppingCart className="h-5 w-5 text-blue-600" />
        <span className="text-sm font-bold text-gray-900">Central de <span className="text-blue-600">Cotações</span></span>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-md p-1 text-sm text-gray-700 hover:bg-gray-100"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
            {user.nome[0]}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-52 rounded-md border border-gray-200 bg-white py-1 shadow-lg z-50">
            <div className="border-b border-gray-100 px-3 py-2">
              <p className="text-sm font-medium text-gray-900">{user.nome}</p>
              <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
