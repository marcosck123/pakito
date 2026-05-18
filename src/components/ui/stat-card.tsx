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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
