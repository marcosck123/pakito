"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Package,
  FileText,
  DollarSign,
  BarChart3,
  ClipboardList,
  CheckSquare,
  Truck,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Fornecedores", href: "/fornecedores", icon: Store },
  { title: "Peças", href: "/pecas", icon: Package },
  { title: "Cotações", href: "/cotacoes", icon: FileText },
  { title: "Orçamentos", href: "/orcamentos", icon: DollarSign },
  { title: "Comparador", href: "/comparador", icon: BarChart3 },
  { title: "Requisições", href: "/requisicoes", icon: ClipboardList },
  { title: "Aprovação", href: "/aprovacao", icon: CheckSquare },
  { title: "Recebimento", href: "/recebimento", icon: Truck },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4">
        <ShoppingCart className="h-6 w-6 text-blue-600" />
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">Central de</p>
          <p className="text-sm font-bold text-blue-600 leading-tight">Cotações</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}