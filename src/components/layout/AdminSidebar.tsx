import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
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
    title: "הגדרות",
    icon: SettingsIcon,
    path: "/admin/settings",
  },
  {
    title: "דוחות",
    icon: ReportsIcon,
    path: "/admin/reports",
  },
  {
    title: "פניות ותקלות",
    icon: ToolsIcon,
    path: "/admin/support",
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
        collapsed ? "w-20" : "w-56"
      )}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-center p-3">
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
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-lg"
                  : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
              )}
            >
              <img 
                src={item.icon} 
                alt={item.title} 
                className={cn(
                  "w-6 h-6 shrink-0",
                  isActive ? "brightness-0 invert" : ""
                )} 
              />
              {!collapsed && (
                <span className="flex-1 text-sm">{item.title}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={onLogout}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-destructive rounded-full",
            collapsed ? "justify-center" : "justify-start gap-3 px-4"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>התנתק</span>}
        </Button>
      </div>
    </aside>
  );
}
