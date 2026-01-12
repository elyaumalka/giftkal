import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string | LucideIcon;
  variant?: "default" | "gold" | "success" | "warning";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  className,
}: StatCardProps) {
  const isStringIcon = typeof Icon === "string";
  
  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      {isStringIcon ? (
        <img src={Icon} alt={title} className="w-12 h-12 mb-3" />
      ) : (
        <div className="w-12 h-12 mb-3 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      )}
      <p className="text-3xl font-bold text-secondary mb-1">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-muted-foreground text-sm">{title}</p>
    </div>
  );
}
