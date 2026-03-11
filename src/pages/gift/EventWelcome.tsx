import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Gift, Sparkles, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { useEffect, useState, useRef } from "react";

/* ── floating sparkle particles ── */
function SparkleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: `hsl(${38 + Math.random() * 10}, 92%, ${55 + Math.random() * 20}%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `sparkleFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.4 + Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
}

export default function EventWelcome() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(t);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-[#051839]">
        <Loader2 className="w-10 h-10 animate-spin text-[#C4A35A]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#051839]" dir="rtl">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center"><span className="text-4xl">😕</span></div>
        <h1 className="text-2xl font-bold text-white">האירוע לא נמצא</h1>
        <p className="text-white/50">נא לבדוק את הקישור ולנסות שוב</p>
      </div>
    );
  }

  const venue = event.venues as any;
  const venueId = venue?.id;
  const bannerUrl = venue?.banner_url || "/landing/hero-banquet.png";

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
    <div className="min-h-screen flex flex-col relative overflow-hidden" dir="rtl">

      {/* ═══════ FULL BACKGROUND IMAGE ═══════ */}
      <div className="absolute inset-0 z-0">
        <img
          src={bannerUrl}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, rgba(5,24,57,0.3) 0%, rgba(5,24,57,0.6) 30%, rgba(5,24,57,0.92) 60%, rgba(5,24,57,1) 80%)"
        }} />
      </div>

      {/* Sparkle particles */}
      <SparkleField />

      {/* ═══════ TOP: VENUE LOGO ═══════ */}
      <div className={`relative z-20 pt-8 flex flex-col items-center transition-all duration-1000 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`}>
        <div
          className={`relative ${venueId ? "cursor-pointer" : ""} group`}
          onClick={handleVenuePage}
        >
          <div className="absolute -inset-3 bg-[#C4A35A]/25 rounded-full blur-xl animate-pulse" />
          {venue?.logo_url ? (
            <img
              src={venue.logo_url}
              alt={venue?.name || ""}
              className="relative w-20 h-20 rounded-full border-2 border-[#C4A35A]/50 shadow-2xl object-cover bg-white/10 backdrop-blur-sm group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="relative w-20 h-20 rounded-full border-2 border-[#C4A35A]/50 shadow-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <img src={logo} alt="Giftkal" className="h-8 w-auto brightness-0 invert" />
            </div>
          )}
        </div>

        {venue?.name && (
          <p
            className={`mt-2 text-sm font-semibold text-white/80 ${venueId ? "cursor-pointer hover:text-[#C4A35A] transition-colors" : ""}`}
            onClick={handleVenuePage}
          >
            {venue.name}
          </p>
        )}
      </div>

      {/* ═══════ CENTER: EVENT INFO ═══════ */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6">
        <div className={`flex flex-col items-center transition-all duration-1000 delay-300 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

          {/* Decorative line */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C4A35A]/60" />
            <Sparkles className="w-4 h-4 text-[#C4A35A]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C4A35A]/60" />
          </div>

          {/* Event Type Label */}
          <p className="text-[#C4A35A]/80 text-sm font-medium tracking-widest uppercase mb-2">
            {eventTypeLabel}
          </p>

          {/* Mazel Tov */}
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-3 text-center leading-none"
            style={{ textShadow: "0 4px 30px rgba(196,163,90,0.3)" }}>
            מזל טוב
          </h1>

          {/* Names */}
          <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-2 leading-tight"
            style={{
              background: "linear-gradient(135deg, #C4A35A 0%, #E8D5A3 50%, #C4A35A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 10px rgba(196,163,90,0.3))",
            }}>
            {getEventNames()}
          </h2>

          {/* Decorative line */}
          <div className="flex items-center gap-3 mt-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C4A35A]/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C4A35A]/60" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C4A35A]/40" />
          </div>
        </div>
      </div>

      {/* ═══════ BOTTOM: CTA + FOOTER ═══════ */}
      <div className={`relative z-20 pb-6 px-5 transition-all duration-1000 delay-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          className="w-full relative overflow-hidden group py-5 rounded-2xl font-bold text-xl text-white flex items-center justify-center gap-3 shadow-2xl active:scale-[0.97] transition-transform"
          style={{
            background: "linear-gradient(135deg, #C41E3A 0%, #E8344E 50%, #C41E3A 100%)",
            boxShadow: "0 8px 32px rgba(196,30,58,0.4), 0 0 60px rgba(196,30,58,0.15)",
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Gift className="w-6 h-6 relative z-10" />
          <span className="relative z-10">שלחו מתנה בקליק</span>
          <ArrowLeft className="w-5 h-5 relative z-10" />
        </button>

        {/* Venue contact link */}
        {venueId && (
          <button
            onClick={handleVenuePage}
            className="w-full mt-3 py-3 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm text-white/70 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-[0.98]"
          >
            <Phone className="w-3.5 h-3.5" />
            צרו קשר עם האולם
          </button>
        )}

        {/* Footer */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="text-white/25 text-[10px]">Powered by</span>
          <img src={logo} alt="Giftkal" className="h-3 w-auto opacity-20" />
        </div>
      </div>

      {/* ═══════ CSS for sparkle animation ═══════ */}
      <style>{`
        @keyframes sparkleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
