import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Custom icons
import DashboardIcon from "@/assets/icons/Dashboard.svg";
import CustomersIcon from "@/assets/icons/Customers.svg";
import TransactionsIcon from "@/assets/icons/Transactions.svg";
import EventOwnersIcon from "@/assets/icons/EventOwners.svg";
import LeadsIcon from "@/assets/icons/Leads.svg";
import ToolsIcon from "@/assets/icons/Tools.svg";
import ReportsIcon from "@/assets/icons/Reports.svg";
import SettingsIcon from "@/assets/icons/Settings.svg";

const menuItems = [
  {
    title: "דשבורד",
    icon: DashboardIcon,
    path: "/admin",
  },
  {
    title: "לקוחות",
    icon: CustomersIcon,
    path: "/admin/customers",
  },
  {
    title: "עסקאות",
    icon: TransactionsIcon,
    path: "/admin/transactions",
  },
  {
    title: "בעלי אירועים",
    icon: EventOwnersIcon,
    path: "/admin/event-owners",
  },
  {
    title: "לידים",
    icon: LeadsIcon,
    path: "/admin/leads",
  },
  {
    title: "פניות ותקלות",
    icon: ToolsIcon,
    path: "/admin/support",
  },
  {
    title: "דוחות",
    icon: ReportsIcon,
    path: "/admin/reports",
  },
  {
    title: "הגדרות",
    icon: SettingsIcon,
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
              <img src={EventOwnersIcon} alt="Logo" className="w-5 h-5" />
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
              <img 
                src={item.icon} 
                alt={item.title} 
                className={cn(
                  "w-5 h-5 shrink-0",
                  isActive && "brightness-125"
                )} 
              />
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
