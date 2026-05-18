import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorClass?: string;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, colorClass = "text-blue-600 bg-blue-50", description }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-snug text-gray-500 sm:text-sm">{title}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
          {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
        </div>
        <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10", colorClass)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}
