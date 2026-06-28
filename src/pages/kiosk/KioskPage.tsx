import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Gift, Monitor, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import logoAsset from "@/assets/logo.png.asset.json";

interface HallInfo {
  id: string;
  name: string;
  default_message: string | null;
  logo_url: string | null;
  venue_id: string;
  venues?: { name: string; logo_url: string | null } | null;
}

interface ActiveEvent {
  id: string;
  groom_name: string | null;
  bride_name: string | null;
  child_name: string | null;
  family_name: string | null;
  event_type: string;
  event_date: string;
  reception_time: string | null;
  ceremony_time: string | null;
}

export default function KioskPage() {
  const { hallId } = useParams();
  const [hall, setHall] = useState<HallInfo | null>(null);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showLanding, setShowLanding] = useState(false);

  // Save kiosk hallId for PWA reopening
  useEffect(() => {
    if (hallId) {
      localStorage.setItem("kiosk_hall_id", hallId);
    }
  }, [hallId]);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch hall info
  useEffect(() => {
    if (!hallId) return;
    const fetchHall = async () => {
      const { data, error } = await supabase
        .from("halls")
        .select("id, name, default_message, logo_url, venue_id, venues(name, logo_url)")
        .eq("id", hallId)
        .single();

      if (error || !data) {
        setError("האולם לא נמצא");
        setLoading(false);
        return;
      }
      setHall(data as unknown as HallInfo);
    };
    fetchHall();
  }, [hallId]);

  // Check for active event - runs every 2 minutes
  const checkActiveEvent = useCallback(async () => {
    if (!hallId) return;

    const today = new Date().toISOString().split("T")[0];

    const { data: events } = await supabase
      .from("public_events")
      .select("id, groom_name, bride_name, child_name, family_name, event_type, event_date, reception_time, ceremony_time")
      .eq("hall_id", hallId)
      .eq("event_date", today);

    if (events && events.length > 0) {
      // If multiple events today, pick the one closest to now
      setActiveEvent(events[0]);
    } else {
      setActiveEvent(null);
    }
    setLoading(false);
  }, [hallId]);

  useEffect(() => {
    checkActiveEvent();
    const interval = setInterval(checkActiveEvent, 120_000); // every 2 min
    return () => clearInterval(interval);
  }, [checkActiveEvent]);

  // Format time
  const timeStr = currentTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  const dateStr = currentTime.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#051839] flex items-center justify-center" dir="rtl">
        <Loader2 className="w-16 h-16 text-[#C4A35A] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#051839] flex items-center justify-center text-white" dir="rtl">
        <div className="text-center space-y-4">
          <Monitor className="w-20 h-20 mx-auto text-red-400" />
          <h1 className="text-3xl font-bold">{error}</h1>
          <p className="text-gray-400">בדוק שהקישור נכון</p>
        </div>
      </div>
    );
  }

  // If there's an active event, show the gift page in an iframe
  if (activeEvent) {
    const eventTitle = activeEvent.event_type === "חתונה" || activeEvent.event_type === "אירוסין"
      ? `${activeEvent.groom_name || ""} & ${activeEvent.bride_name || ""}`
      : activeEvent.event_type === "ברית"
        ? activeEvent.child_name || activeEvent.family_name || ""
        : `${activeEvent.groom_name || activeEvent.family_name || ""}`;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8E8] to-[#F5EDD6]" dir="rtl">
        {/* Top bar with hall info */}
        <div className="bg-[#051839]/90 backdrop-blur-sm text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hall?.logo_url ? (
              <img src={hall.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <img src={logoAsset.url} alt="Giftkal" className="h-8" />
            )}
            <span className="text-sm opacity-70">{hall?.name}</span>
          </div>
          <div className="text-left text-sm opacity-70">
            <div>{timeStr}</div>
            <div className="text-xs">{dateStr}</div>
          </div>
        </div>

        {/* Gift page iframe - responsive, fills screen */}
        <div className="flex justify-center" style={{ height: "calc(100vh - 56px)" }}>
          <iframe
            src={`/gift/${activeEvent.id}`}
            className="border-0 w-full h-full"
            title={`מתנה ל${eventTitle}`}
          />
        </div>
      </div>
    );
  }

  // Idle screen - no active event
  const venueLogo = hall?.logo_url || (hall?.venues as any)?.logo_url;
  const venueName = (hall?.venues as any)?.name || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#051839] via-[#0a2a5e] to-[#051839] flex items-center justify-center" dir="rtl">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Logo */}
        {venueLogo ? (
          <img
            src={venueLogo}
            alt={venueName}
            className="h-32 mx-auto rounded-2xl object-contain cursor-pointer hover:ring-2 hover:ring-[#C4A35A]/50 transition-all"
            onClick={() => setShowLanding(true)}
          />
        ) : (
          <img src={logoAsset.url} alt="Giftkal" className="h-20 mx-auto" />
        )}

        {/* Hall name */}
        <div>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-2">{hall?.name}</h1>
          {venueName && <p className="text-xl text-[#C4A35A]">{venueName}</p>}
        </div>

        {/* Default message */}
        <p className="text-4xl md:text-5xl text-white/80 font-light">
          {hall?.default_message || "ברוכים הבאים"}
        </p>

        {/* Gift CTA text */}
        <div className="flex items-center gap-3 justify-center">
          <Gift className="w-8 h-8 text-[#C4A35A]" />
          <p className="text-2xl md:text-3xl text-[#C4A35A] font-bold">מעניקים מתנה בקליק</p>
        </div>

        {/* Clock */}
        <div className="text-white/60 space-y-1">
          <p className="text-6xl font-light tracking-wider">{timeStr}</p>
          <p className="text-lg">{dateStr}</p>
        </div>

        {/* Install button */}
        {!isInstalled && deferredPrompt && (
          <div className="pt-4">
            <Button
              onClick={handleInstall}
              className="bg-[#C4A35A] hover:bg-[#B4943A] text-white rounded-full px-8 py-3 text-lg gap-3 shadow-xl"
            >
              <Download className="w-5 h-5" />
              התקן אפליקציה
            </Button>
          </div>
        )}

        {/* QR Code */}
        <div className="pt-4">
          {activeEvent ? (
            <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
              <QRCodeSVG
                value={`${window.location.origin}/gift/${activeEvent.id}`}
                size={160}
                level="H"
                fgColor="#051839"
              />
              <p className="text-[#051839] text-xs mt-2 font-medium text-center">סרקו לשליחת מתנה</p>
            </div>
          ) : (
            <Gift className="w-12 h-12 mx-auto text-[#C4A35A]/30" />
          )}
        </div>

        {/* Powered by */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <div className="flex items-center justify-center gap-2 text-white/20 text-sm">
            <span>Powered by</span>
            <img src={logoAsset.url} alt="Giftkal" className="h-5 opacity-30" />
          </div>
        </div>

        {/* Venue Landing Dialog */}
        <Dialog open={showLanding} onOpenChange={setShowLanding}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
            <iframe
              src={`/landing/${hall?.venue_id}`}
              className="w-full h-full border-0"
              title={`דף נחיתה - ${venueName}`}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
