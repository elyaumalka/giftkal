import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "gold" | "success" | "warning";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const variantStyles = {
    default: "before:from-primary before:to-primary/50",
    gold: "before:from-primary before:to-warning",
    success: "before:from-success before:to-success/50",
    warning: "before:from-warning before:to-warning/50",
  };

  return (
    <div
      className={cn(
        "stat-card",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold">{value.toLocaleString()}</p>
          {trend && (
            <p
              className={cn(
                "text-sm mt-2 flex items-center gap-1",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">מהחודש שעבר</span>
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
