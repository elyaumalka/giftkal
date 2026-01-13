import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import logo from "@/assets/logo.png";

// Custom icons for venue
import DashboardIcon from "@/assets/icons/venue/Dashboard.svg";
import InvoicesIcon from "@/assets/icons/venue/Invoices.svg";
import EventsIcon from "@/assets/icons/venue/Events.svg";
import ToolsIcon from "@/assets/icons/venue/Tools.svg";
import SettingsIcon from "@/assets/icons/venue/Settings.svg";

const menuItems = [
  { title: "דשבורד", icon: DashboardIcon, path: "/venue" },
  { title: "חשבוניות", icon: InvoicesIcon, path: "/venue/invoices" },
  { title: "בעלי אירועים", icon: EventsIcon, path: "/venue/events" },
  { title: "פניות ותקלות", icon: ToolsIcon, path: "/venue/support" },
  { title: "הגדרות", icon: SettingsIcon, path: "/venue/settings" },
];

export function VenueLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "התנתקת בהצלחה" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="fixed top-0 right-0 left-0 h-16 bg-[#051839] z-50 flex items-center justify-between px-6">
        {/* Logo on the right */}
        <div className="flex items-center">
          <img src={logo} alt="Giftkal Logo" className="h-10" />
        </div>
        
        {/* Logout button on the left */}
        <Button
          variant="ghost"
          onClick={handleLogout}
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
                    className="w-6 h-6 shrink-0"
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

      <main className="mr-60 mt-20 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
