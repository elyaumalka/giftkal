import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

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
    <>
      {/* Top Header */}
      <header className="fixed top-0 right-0 left-0 h-16 bg-[#051839] z-50 flex items-center justify-between px-6">
        {/* Logo on the right */}
        <div className="flex items-center">
          <img src={logo} alt="Giftkal Logo" className="h-10" />
        </div>
        
        {/* Logout button on the left */}
        <Button
          variant="ghost"
          onClick={onLogout}
          className="text-white hover:bg-white/10 hover:text-white gap-2 border border-white/30 rounded-full px-4"
        >
          <span>יציאה מהמערכת</span>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Sidebar Container - with gap from header */}
      <div className="fixed right-4 top-24 z-40">
        <aside
          className={cn(
            "bg-[#051839] rounded-3xl shadow-lg transition-all duration-300 flex flex-col overflow-hidden",
            collapsed ? "w-20" : "w-52"
          )}
        >
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200",
                    isActive
                      ? "bg-[#95742F] text-white font-semibold shadow-lg"
                      : "bg-[#08275E] text-white hover:bg-[#08275E]/80"
                  )}
                >
                  <img 
                    src={item.icon} 
                    alt={item.title} 
                    className="w-6 h-6 shrink-0 brightness-0 invert"
                  />
                  {!collapsed && (
                    <span className="flex-1 text-sm">{item.title}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
}
