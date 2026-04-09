import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut, Loader2, Gift, Send, CreditCard, Lock } from "lucide-react";
import logo from "@/assets/logo.png";

// Custom icons for event
import DashboardIcon from "@/assets/icons/event/Dashboard.svg";
import InvitationsIcon from "@/assets/icons/event/Invitations.svg";
import GiftsIcon from "@/assets/icons/event/Gifts.svg";
import SettingsIcon from "@/assets/icons/event/Settings.svg";

import StatIcon from "@/assets/icons/event/StatIcon.svg";

const allMenuItems = [
  { title: "דשבורד", icon: DashboardIcon, path: "/event", key: "dashboard" },
  { title: "הזמנות", icon: InvitationsIcon, path: "/event/invitations", key: "invitations" },
  { title: "אישורי הגעה", icon: StatIcon, path: "/event/rsvp", key: "rsvp" },
  { title: "מתנות", icon: GiftsIcon, path: "/event/gifts", key: "gifts" },
  { title: "תקציב", icon: StatIcon, path: "/event/budget", key: "budget" },
  { title: "הגדרות", icon: SettingsIcon, path: "/event/settings", key: "settings" },
];

export function EventLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/login");
          return;
        }

        // Check if user has event_owner role
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "event_owner");

        if (error || !roles || roles.length === 0) {
          toast({
            title: "אין הרשאה",
            description: "אין לך הרשאות גישה לעמוד זה",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          navigate("/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Check if budget is enabled for this event
  const { data: eventData } = useQuery({
    queryKey: ["event-features"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("events")
        .select("budget_enabled, gifts_enabled, invitations_enabled, rsvp_enabled")
        .eq("owner_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: authorized,
  });

  const menuItems = allMenuItems.filter(item => {
    if (item.key === "budget" && !eventData?.budget_enabled) return false;
    if (item.key === "gifts" && !eventData?.gifts_enabled) return false;
    if (item.key === "invitations" && !eventData?.invitations_enabled) return false;
    if (item.key === "rsvp" && !eventData?.rsvp_enabled) return false;
    return true;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "התנתקת בהצלחה" });
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#C4A35A]" />
          <p className="text-gray-600">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

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
