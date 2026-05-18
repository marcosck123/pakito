"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobileNavItems } from "@/lib/nav-items";

interface MobileNavProps {
  onMoreClick: () => void;
}

export function MobileNav({ onMoreClick }: MobileNavProps) {
  const pathname = usePathname();

  const isMoreActive = !mobileNavItems.some((item) =>
    item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-gray-200 bg-white lg:hidden">
      {mobileNavItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
              isActive ? "text-blue-600" : "text-gray-500"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="leading-none">{item.title}</span>
          </Link>
        );
      })}

      <button
        onClick={onMoreClick}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
          isMoreActive ? "text-blue-600" : "text-gray-500"
        )}
      >
        <MoreHorizontal className="h-5 w-5" />
        <span className="leading-none">Mais</span>
      </button>
    </nav>
  );
}
