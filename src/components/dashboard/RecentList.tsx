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
  viewAllText = "הצג הכל",
  children,
  emptyMessage = "אין פריטים להצגה",
  isEmpty = false,
}: RecentListProps) {
  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-lg">{title}</h3>
        <Link to={viewAllPath}>
          <Button variant="ghost" size="sm" className="gap-1">
            {viewAllText}
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      <div className="p-4">
        {isEmpty ? (
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
