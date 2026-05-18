"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import type { User as UserType } from "@/types";
import { roleLabels } from "@/lib/security/roles";

interface TopbarProps {
  user: UserType;
}

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
            {user.nome[0]}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 leading-none">{user.nome}</p>
            <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg z-50">
            <div className="border-b border-gray-100 px-3 py-2">
              <p className="text-xs text-gray-500">{user.email}</p>
              <p className="text-xs font-medium text-gray-700">{user.setor}</p>
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