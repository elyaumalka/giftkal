import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mail,
  Gift,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Heart,
} from "lucide-react";

const menuItems = [
  { title: "דשבורד", icon: LayoutDashboard, path: "/event" },
  { title: "הזמנות", icon: Mail, path: "/event/invitations" },
  { title: "מתנות", icon: Gift, path: "/event/gifts" },
  { title: "הגדרות", icon: Settings, path: "/event/settings" },
];

export function EventLayout() {
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
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed right-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">האירוע שלי</span>
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

        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
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
      <main className={cn("p-6 transition-all duration-300", collapsed ? "mr-16" : "mr-64")}>
        <Outlet />
      </main>
    </div>
  );
}
