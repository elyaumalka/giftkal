import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface RecentListProps {
  title: string;
  viewAllPath: string;
  viewAllText?: string;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function RecentList({
  title,
  viewAllPath,
  viewAllText = "לכל הפריטים",
  children,
  emptyMessage = "אין פריטים להצגה",
  isEmpty = false,
}: RecentListProps) {
  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <h3 className="font-bold text-xl text-secondary">{title}</h3>
        <Link to={viewAllPath}>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-secondary">
            {viewAllText}
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      <div className="px-4 pb-4">
        {isEmpty ? (
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
