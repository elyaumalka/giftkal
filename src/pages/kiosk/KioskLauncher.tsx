import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Monitor, ArrowLeft, Calendar, MapPin } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";

interface LookupResult {
  entity_type: "hall" | "venue";
  entity_id: string;
  name: string;
  venue_id: string;
  venue_name: string;
}

interface HallOption {
  id: string;
  name: string;
  is_active: boolean;
}

interface EventOption {
  id: string;
  event_type: string;
  event_date: string;
  groom_name: string | null;
  bride_name: string | null;
  child_name: string | null;
  family_name: string | null;
  hall_id: string | null;
}

export default function KioskLauncher() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState(codeParam?.toUpperCase() || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);

  useEffect(() => {
    if (codeParam) {
      handleLookup(codeParam);
    }
  }, [codeParam]);

  const handleLookup = async (lookupCode: string) => {
    setLoading(true);
    setError(null);
    setLookup(null);
    setHalls([]);
    setEvents([]);

    const cleanCode = lookupCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("יש להזין קוד גישה");
      setLoading(false);
      return;
    }

    const { data, error: lookupError } = await supabase.rpc("lookup_by_kiosk_code", {
      _code: cleanCode,
    });

    if (lookupError || !data || data.length === 0) {
      setError("קוד גישה לא נמצא. בדקו עם המנהל");
      setLoading(false);
      return;
    }

    const result = data[0] as LookupResult;
    setLookup(result);

    // Load halls for this venue
    const { data: hallsData } = await supabase
      .from("halls")
      .select("id, name, is_active")
      .eq("venue_id", result.venue_id)
      .eq("is_active", true)
      .order("name");
    setHalls(hallsData || []);

    // Load upcoming events (today + future) for this venue
    const today = new Date().toISOString().split("T")[0];
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, event_type, event_date, groom_name, bride_name, child_name, family_name, hall_id")
      .eq("venue_id", result.venue_id)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(20);
    setEvents(eventsData || []);

    setLoading(false);
  };

  const openHallKiosk = (hallId: string) => {
    window.open(`/kiosk/${hallId}`, "_blank");
  };

  const openEventGift = (eventId: string) => {
    window.open(`/gift/${eventId}`, "_blank");
  };

  const eventTitle = (e: EventOption) => {
    if (e.event_type === "חתונה" || e.event_type === "אירוסין") {
      return `${e.groom_name || ""} & ${e.bride_name || ""}`.trim();
    }
    if (e.event_type === "ברית" || e.event_type === "בר מצווה" || e.event_type === "בת מצווה") {
      return e.child_name || e.family_name || e.event_type;
    }
    return e.family_name || e.groom_name || e.event_type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#051839] via-[#0a2a5e] to-[#051839] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logoAsset.url} alt="Giftkal" className="h-14 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">השקת קיוסק</h1>
          <p className="text-white/60">הכניסו קוד גישה לבחירת אולם או אירוע</p>
        </div>

        {/* Code input */}
        {!lookup && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex flex-col gap-4">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="קוד גישה (לדוגמה: A3F92K)"
                className="bg-white/90 text-center text-2xl font-mono tracking-widest h-16"
                maxLength={10}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/kiosk-launcher/${code.trim()}`);
                  }
                }}
              />
              <Button
                size="lg"
                onClick={() => navigate(`/kiosk-launcher/${code.trim()}`)}
                disabled={loading || !code.trim()}
                className="bg-[#C4A35A] hover:bg-[#B4943A] text-white text-lg h-14"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "המשך"}
              </Button>
              {error && (
                <p className="text-red-300 text-center bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                  {error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && lookup === null && (
          <div className="text-center text-white py-8">
            <Loader2 className="w-12 h-12 animate-spin mx-auto" />
          </div>
        )}

        {/* Results: halls + events */}
        {lookup && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-white/60">אולם:</p>
                  <h2 className="text-2xl font-bold">{lookup.venue_name}</h2>
                </div>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => {
                    setLookup(null);
                    setCode("");
                    navigate("/kiosk-launcher");
                  }}
                >
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  קוד אחר
                </Button>
              </div>
            </div>

            {/* Halls */}
            {halls.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-4 text-[#C4A35A]">
                  <MapPin className="w-5 h-5" />
                  <h3 className="text-xl font-bold">בחר אולם להפעלת קיוסק</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {halls.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => openHallKiosk(h.id)}
                      className="bg-white/5 hover:bg-[#C4A35A]/20 border border-white/20 hover:border-[#C4A35A] rounded-xl p-4 text-right text-white transition-all flex items-center gap-3 group"
                    >
                      <Monitor className="w-6 h-6 text-[#C4A35A] group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-lg">{h.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {events.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-4 text-[#C4A35A]">
                  <Calendar className="w-5 h-5" />
                  <h3 className="text-xl font-bold">או בחר אירוע ספציפי</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {events.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => openEventGift(e.id)}
                      className="bg-white/5 hover:bg-[#C4A35A]/20 border border-white/20 hover:border-[#C4A35A] rounded-xl p-4 text-right text-white transition-all"
                    >
                      <div className="font-semibold">{eventTitle(e)}</div>
                      <div className="text-xs text-white/60 mt-1">
                        {new Date(e.event_date).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}
                        {" · "}{e.event_type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {halls.length === 0 && events.length === 0 && (
              <div className="bg-white/5 rounded-2xl p-6 text-center text-white/70">
                לא נמצאו אולמות או אירועים פעילים
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
