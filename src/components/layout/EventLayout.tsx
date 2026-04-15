import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut, Loader2, Gift, Send, CreditCard, Lock } from "lucide-react";
import { useAuthReady } from "@/hooks/useAuthReady";
import logo from "@/assets/logo.png";

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
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isReady, session, role } = useAuthReady();
  const unauthorizedToastShown = useRef(false);

  useEffect(() => {
    if (!isReady) return;

    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    if (role !== "event_owner") {
      if (!unauthorizedToastShown.current) {
        toast({
          title: "אין הרשאה",
          description: "אין לך הרשאות גישה לעמוד זה",
          variant: "destructive",
        });
        unauthorizedToastShown.current = true;
      }
      navigate("/login", { replace: true });
      return;
    }

    unauthorizedToastShown.current = false;
  }, [isReady, session, role, navigate, toast]);

  const { data: eventData } = useQuery({
    queryKey: ["event-features", session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;
      const { data } = await supabase
        .from("events")
        .select("budget_enabled, gifts_enabled, invitations_enabled, rsvp_enabled")
        .eq("owner_id", session.user.id)
        .maybeSingle();
      return data;
    },
    enabled: isReady && !!session?.user && role === "event_owner",
  });

  const isBudgetOnly = eventData && !eventData.gifts_enabled && !eventData.invitations_enabled && !eventData.rsvp_enabled;

  const menuItems = allMenuItems.filter((item) => {
    if (item.key === "budget" && !eventData?.budget_enabled) return false;
    if (item.key === "gifts" && !eventData?.gifts_enabled) return false;
    if (item.key === "invitations" && !eventData?.invitations_enabled) return false;
    if (item.key === "rsvp" && !eventData?.rsvp_enabled) return false;
    if (isBudgetOnly && (item.key === "dashboard" || item.key === "settings")) return false;
    return true;
  });

  const lockedItems = [
    ...(!eventData?.gifts_enabled ? [{ key: "gifts", label: "מתנות באשראי", icon: Gift }] : []),
    ...(!eventData?.invitations_enabled ? [{ key: "invitations", label: "הזמנות דיגיטליות", icon: Send }] : []),
    ...(!eventData?.rsvp_enabled ? [{ key: "rsvp", label: "אישורי הגעה", icon: CreditCard }] : []),
  ];

  useEffect(() => {
    if (isBudgetOnly && location.pathname === "/event") {
      navigate("/event/budget", { replace: true });
    }
  }, [isBudgetOnly, location.pathname, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "התנתקת בהצלחה" });
    navigate("/login", { replace: true });
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#C4A35A]" />
          <p className="text-gray-600">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  if (!session || role !== "event_owner") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="fixed top-0 right-0 left-0 h-16 bg-[#051839] z-50 flex items-center justify-between px-6">
        <div className="flex items-center">
          <img src={logo} alt="Giftkal Logo" className="h-10" />
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-white hover:bg-white/10 hover:text-white gap-2 border border-white/30 rounded-full px-4"
        >
          <span>יציאה מהמערכת</span>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="fixed right-4 top-24 z-40">
        <aside
          className={cn(
            "bg-[#051839] rounded-3xl shadow-lg transition-all duration-300 flex flex-col overflow-hidden",
            collapsed ? "w-20" : "w-52"
          )}
        >
          <nav className="p-3 space-y-2">
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

          {!collapsed && lockedItems.length > 0 && (
            <div className="px-3 pb-3 space-y-1.5">
              <div className="border-t border-white/10 pt-3 mb-1">
                <p className="text-[10px] text-white/40 text-center font-medium tracking-wide mb-2">שדרגו את האירוע</p>
              </div>
              {lockedItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => navigate("/event/upgrade")}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full w-full transition-all duration-200 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 group"
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-xs text-right">{item.label}</span>
                  <Lock className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>

      <main className="mr-60 mt-20 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
