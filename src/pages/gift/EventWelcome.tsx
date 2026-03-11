import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Gift } from "lucide-react";
import logo from "@/assets/logo.png";
import cheersImg from "@/assets/cheers.png";

export default function EventWelcome() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-welcome", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          venues (id, name, address, logo_url, banner_url, phone, email)
        `)
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `url('/landing/bg-hexagon.png') center/cover no-repeat` }}>
        <Loader2 className="w-10 h-10 animate-spin text-[#051839]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl" style={{ background: `url('/landing/bg-hexagon.png') center/cover no-repeat` }}>
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center"><span className="text-4xl">😕</span></div>
        <h1 className="text-2xl font-bold text-[#051839]">האירוע לא נמצא</h1>
        <p className="text-gray-500">נא לבדוק את הקישור ולנסות שוב</p>
      </div>
    );
  }

  const venue = event.venues as any;
  const venueId = venue?.id;

  const eventTypeLabel = (() => {
    switch (event.event_type) {
      case "חתונה": return "לרגל החתונה";
      case "בר מצווה": return "לרגל הבר מצווה";
      case "בת מצווה": return "לרגל הבת מצווה";
      case "ברית": return "לרגל הברית";
      case "יום הולדת": return "לרגל יום ההולדת";
      default: return `לרגל ה${event.event_type}`;
    }
  })();

  const getEventNames = () => {
    if (event.event_type === "חתונה" || event.event_type === "אירוסין") {
      return `${event.groom_name || ""} & ${event.bride_name || ""}`;
    }
    if (event.event_type === "ברית") {
      return event.child_name || event.family_name || "";
    }
    return event.child_name || event.groom_name || event.family_name || "";
  };

  const handleContinue = () => navigate(`/gift/${eventId}/send`);
  const handleVenuePage = () => {
    if (venueId) navigate(`/landing/${venueId}`);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" dir="rtl" style={{ background: `url('/landing/bg-hexagon.png') center/cover no-repeat` }}>

      {/* ═══════ Hero Image ═══════ */}
      <div className="relative w-full flex-shrink-0">
        <img
          src="/landing/hero-banquet.png"
          alt="אולם אירועים"
          className="w-full object-cover"
          style={{ maxHeight: "200px" }}
        />
        {/* Curved bottom */}
        <div className="absolute -bottom-1 left-0 right-0 h-12">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,60 Q720,0 1440,60 L1440,60 L0,60 Z" fill="white" fillOpacity="0" />
          </svg>
        </div>
      </div>

      {/* ═══════ Logo + Venue ═══════ */}
      <div className="relative z-10 -mt-10 flex flex-col items-center flex-shrink-0">
        <div
          className={`relative ${venueId ? "cursor-pointer" : ""}`}
          onClick={handleVenuePage}
        >
          <div className="absolute -inset-1.5 bg-[#C4A35A]/20 rounded-full blur-lg animate-pulse" />
          {venue?.logo_url ? (
            <img
              src={venue.logo_url}
              alt={venue?.name || ""}
              className="relative w-20 h-20 rounded-full border-[3px] border-white shadow-xl object-cover bg-white"
            />
          ) : (
            <div className="relative w-20 h-20 rounded-full border-[3px] border-white shadow-xl bg-[#051839] flex items-center justify-center">
              <img src={logo} alt="Giftkal" className="h-8 w-auto brightness-0 invert" />
            </div>
          )}
        </div>

        {venue?.name && (
          <h3
            className={`mt-2 text-sm font-bold text-[#051839] ${venueId ? "cursor-pointer hover:underline" : ""}`}
            onClick={handleVenuePage}
          >
            {venue.name}
          </h3>
        )}

        {venueId && (
          <button
            onClick={handleVenuePage}
            className="text-[#C4A35A] text-xs font-medium flex items-center gap-1 mt-0.5 hover:underline"
          >
            דברו איתנו
            <ArrowLeft className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* ═══════ Main Content ═══════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        {/* Cheers Image */}
        <img
          src={cheersImg}
          alt="לחיים"
          className="w-32 h-auto mx-auto drop-shadow-2xl mb-3 flex-shrink-0"
        />

        {/* Mazel Tov */}
        <h1 className="text-5xl font-extrabold text-[#051839] mb-2 text-center tracking-tight">
          מזל טוב
        </h1>

        {/* Names */}
        <h2 className="text-3xl font-extrabold text-[#C4A35A] mb-1 text-center">
          {getEventNames()}
        </h2>

        {/* Event Type */}
        <p className="text-base text-gray-400 mb-6 text-center">
          {eventTypeLabel}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          className="bg-[#C41E3A] text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-lg shadow-[#C41E3A]/25 hover:bg-[#A8182F] active:scale-[0.97] transition-all flex items-center gap-3 animate-pulse hover:animate-none flex-shrink-0"
        >
          <Gift className="w-5 h-5" />
          כאן נותנים מתנה בקליק
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ═══════ Footer ═══════ */}
      <div className="py-3 flex items-center justify-center gap-2 flex-shrink-0">
        <span className="text-gray-300 text-xs">Powered by</span>
        <img src={logo} alt="Giftkal" className="h-4 w-auto opacity-40" />
      </div>
    </div>
  );
}
