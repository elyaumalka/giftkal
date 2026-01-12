import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserPlus,
  Settings,
  MessageSquare,
  FileText,
  Gift,
  Building2,
  ChevronRight,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "דשבורד",
    icon: LayoutDashboard,
    path: "/admin",
  },
  {
    title: "לקוחות",
    icon: Users,
    path: "/admin/customers",
  },
  {
    title: "עסקאות",
    icon: CreditCard,
    path: "/admin/transactions",
  },
  {
    title: "בעלי אירועים",
    icon: Gift,
    path: "/admin/event-owners",
  },
  {
    title: "לידים",
    icon: UserPlus,
    path: "/admin/leads",
  },
  {
    title: "פניות ותקלות",
    icon: MessageSquare,
    path: "/admin/support",
  },
  {
    title: "דוחות",
    icon: FileText,
    path: "/admin/reports",
  },
  {
    title: "הגדרות",
    icon: Settings,
    path: "/admin/settings",
  },
];

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">מתנות</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {isActive && <ChevronRight className="w-4 h-4 rotate-180" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={onLogout}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-destructive",
            collapsed ? "justify-center" : "justify-start gap-3"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>התנתק</span>}
        </Button>
      </div>
    </aside>
  );
}
