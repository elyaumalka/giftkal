import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuthReady } from "@/hooks/useAuthReady";

export function AdminLayout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isReady, session, role } = useAuthReady();
  const unauthorizedToastShown = useRef(false);

  useEffect(() => {
    if (!isReady) return;

    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    if (role !== "admin") {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "התנתקת בהצלחה",
      description: "להתראות!",
    });
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

  if (!session || role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar onLogout={handleLogout} />
      <main className="mr-60 mt-20 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
