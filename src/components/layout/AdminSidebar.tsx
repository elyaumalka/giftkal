import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/logo.png.asset.json";

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
  { title: "דשבורד", icon: DashboardIcon, path: "/admin" },
  { title: "לקוחות", icon: CustomersIcon, path: "/admin/customers" },
  { title: "עסקאות", icon: TransactionsIcon, path: "/admin/transactions" },
  { title: "ארנקים", icon: TransactionsIcon, path: "/admin/wallets" },
  { title: "בעלי אירועים", icon: EventOwnersIcon, path: "/admin/event-owners" },
  { title: "לידים", icon: LeadsIcon, path: "/admin/leads" },
  { title: "הגדרות", icon: SettingsIcon, path: "/admin/settings" },
  { title: "אולמות ומכשירים", icon: CustomersIcon, path: "/admin/halls-devices" },
  { title: "דוחות", icon: ReportsIcon, path: "/admin/reports" },
  { title: "חיוב לקוחות", icon: TransactionsIcon, path: "/admin/billing" },
  { title: "קופונים", icon: SettingsIcon, path: "/admin/coupons" },
  { title: "פניות ותקלות", icon: ToolsIcon, path: "/admin/support" },
  { title: "רשימת תפוצה", icon: LeadsIcon, path: "/admin/newsletter" },
];

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const [collapsed] = useState(false);
  const location = useLocation();

  // Count pending approval events
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-approval-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("payment_setup_status", "pending_approval")
        .is("seller_payme_id", null);
      return count || 0;
    },
    refetchInterval: 30000, // refresh every 30s
  });

  const getBadgeCount = (path: string) => {
    if (path === "/admin/event-owners") return pendingCount;
    return 0;
  };

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 right-0 left-0 h-16 bg-[#051839] z-50 flex items-center justify-between px-6">
        <div className="flex items-center">
          <img src={logoAsset.url} alt="Giftkal Logo" className="h-10" />
        </div>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="text-white hover:bg-white/10 hover:text-white gap-2 border border-white/30 rounded-full px-4"
        >
          <span>יציאה מהמערכת</span>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Sidebar Container */}
      <div className="fixed right-4 top-24 z-40">
        <aside
          className={cn(
            "bg-[#051839] rounded-3xl shadow-lg transition-all duration-300 flex flex-col overflow-hidden",
            collapsed ? "w-20" : "w-52"
          )}
        >
          <nav className="flex-1 p-3 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const badgeCount = getBadgeCount(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200",
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
                  {badgeCount > 0 && (
                    <span
                      className={cn(
                        "absolute flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold rounded-full bg-red-500 text-white shadow-md ring-2 ring-[#051839] animate-pulse",
                        collapsed ? "-top-1 -left-1" : "left-2 top-1/2 -translate-y-1/2"
                      )}
                    >
                      {badgeCount}
                    </span>
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
