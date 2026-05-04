import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Monitor } from "lucide-react";
import logo from "@/assets/logo.png";

type Status = "detecting" | "resolving" | "not-found" | "no-bridge" | "error";

export default function KioskEntry() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("detecting");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let handled = false;

    const resolve = async (id: string) => {
      if (handled) return;
      handled = true;
      setDeviceId(id);
      setStatus("resolving");

      try {
        const { data, error } = await supabase
          .from("devices")
          .select("id, hall_id, venue_id, is_active")
          .eq("serial_number", id)
          .eq("is_active", true)
          .maybeSingle();

        if (error) throw error;

        if (!data || !data.hall_id) {
          setStatus("not-found");
          return;
        }

        // Save for PWA reopening
        localStorage.setItem("kiosk_hall_id", data.hall_id);
        navigate(`/kiosk/${data.hall_id}`, { replace: true });
      } catch (err: any) {
        console.error("Device resolve error:", err);
        setErrorMsg(err.message || "שגיאה בחיבור לשרת");
        setStatus("error");
      }
    };

    // Method 1: Direct bridge call
    if (window.AndroidDevice && typeof window.AndroidDevice.getDeviceId === "function") {
      const id = window.AndroidDevice.getDeviceId();
      if (id) {
        resolve(id);
        return;
      }
    }

    // Method 2: Listen for custom event from APK
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.deviceId) {
        resolve(detail.deviceId);
      }
    };
    window.addEventListener("android-device-ready", handleEvent);

    // Timeout: if no bridge detected after 3s, show fallback
    const timeout = setTimeout(() => {
      if (!handled) {
        // Check if running in standalone PWA mode
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
        const savedHallId = localStorage.getItem("kiosk_hall_id");

        if (isStandalone && savedHallId) {
          navigate(`/kiosk/${savedHallId}`, { replace: true });
          return;
        }

        setStatus("no-bridge");
      }
    }, 3000);

    return () => {
      window.removeEventListener("android-device-ready", handleEvent);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#051839] via-[#0a2a5e] to-[#051839] flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md text-center">
        <img src={logo} alt="Giftkal" className="h-14 mx-auto mb-8" />

        {(status === "detecting" || status === "resolving") && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <Loader2 className="w-12 h-12 animate-spin text-[#C4A35A] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {status === "detecting" ? "מזהה מכשיר..." : "מחבר לאירוע..."}
            </h2>
            {deviceId && (
              <p className="text-white/50 text-sm font-mono mt-2">{deviceId}</p>
            )}
          </div>
        )}

        {status === "not-found" && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <AlertTriangle className="w-12 h-12 text-[#C41E3A] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">מכשיר לא משויך</h2>
            <p className="text-white/60 mb-4">
              המכשיר הזה לא משויך לאולם. פנו למנהל המערכת לשיוך.
            </p>
            {deviceId && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white/40 text-xs mb-1">מזהה מכשיר:</p>
                <p className="text-white font-mono text-sm select-all">{deviceId}</p>
              </div>
            )}
          </div>
        )}

        {status === "no-bridge" && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <Monitor className="w-12 h-12 text-[#C4A35A] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">מצב דפדפן</h2>
            <p className="text-white/60 mb-6">
              לא זוהה חיבור APK. ניתן להשתמש בקוד גישה ידני.
            </p>
            <button
              onClick={() => navigate("/kiosk-launcher")}
              className="bg-[#C4A35A] hover:bg-[#B4943A] text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              הזן קוד גישה
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <AlertTriangle className="w-12 h-12 text-[#C41E3A] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">שגיאה</h2>
            <p className="text-white/60 mb-4">{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#C4A35A] hover:bg-[#B4943A] text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              נסה שוב
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
