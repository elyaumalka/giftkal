import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Gift, Sparkles, Phone, MessageCircle, Mail, CreditCard, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { useEffect, useState } from "react";

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

/* ── Venue Contact Popup ── */
function VenueContactPopup({
  venue,
  onClose,
}: {
  venue: any;
  onClose: () => void;
}) {
  const phone = venue?.phone || "";
  const email = venue?.email || "";
  const whatsapp = phone; // fallback to phone for whatsapp

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md mx-3 mb-4 bg-[#051839] rounded-3xl p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Logo + Name */}
        <div className="flex flex-col items-center mb-6">
          {venue?.logo_url ? (
            <img src={venue.logo_url} alt={venue?.name} className="w-16 h-16 rounded-full border-2 border-[#C4A35A]/40 object-cover bg-white/10 mb-3" />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-[#C4A35A]/40 bg-white/10 flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-[#C4A35A]">{venue?.name?.charAt(0)}</span>
            </div>
          )}
          <h3 className="text-xl font-bold text-white">{venue?.name}</h3>
          {venue?.address && <p className="text-white/40 text-sm mt-0.5">{venue.address}</p>}
        </div>

        {/* Contact Options */}
        <div className="space-y-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-[#C4A35A]/15 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-[#C4A35A]" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">התקשרו אלינו</p>
                <p className="text-white/40 text-xs mt-0.5" dir="ltr">{phone}</p>
              </div>
            </a>
          )}

          {phone && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">WhatsApp</p>
                <p className="text-white/40 text-xs mt-0.5">שלחו הודעה ישירה</p>
              </div>
            </a>
          )}

          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">שלחו מייל</p>
                <p className="text-white/40 text-xs mt-0.5 truncate max-w-[200px]">{email}</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventWelcome() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [showVenueContact, setShowVenueContact] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" dir="rtl">

      {/* ═══════ FULL BACKGROUND IMAGE ═══════ */}
      <div className="absolute inset-0 z-0">
        <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, rgba(5,24,57,0.3) 0%, rgba(5,24,57,0.6) 30%, rgba(5,24,57,0.92) 60%, rgba(5,24,57,1) 80%)"
        }} />
      </div>

      <SparkleField />

      {/* ═══════ TOP: VENUE LOGO ═══════ */}
      <div className={`relative z-20 pt-8 flex flex-col items-center transition-all duration-1000 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`}>
        <div
          className={`relative ${venueId ? "cursor-pointer" : ""} group`}
          onClick={() => venueId && setShowVenueContact(true)}
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
          <p className="mt-2 text-sm font-semibold text-white/80">
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

          {/* Credit card hint */}
          <div className="flex items-center gap-2 mt-4 bg-white/5 backdrop-blur-sm rounded-full px-5 py-2 border border-white/10">
            <CreditCard className="w-4 h-4 text-[#C4A35A]" />
            <span className="text-white/60 text-xs font-medium">מתנה באשראי בצורה מאובטחת</span>
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
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Gift className="w-6 h-6 relative z-10" />
          <span className="relative z-10">שלחו מתנה בקליק</span>
          <ArrowLeft className="w-5 h-5 relative z-10" />
        </button>

        {/* Venue contact — text link style, not a button */}
        {venueId && (
          <button
            onClick={() => setShowVenueContact(true)}
            className="w-full mt-4 text-white/40 text-xs font-medium flex items-center justify-center gap-1.5 hover:text-white/60 transition-colors"
          >
            <Phone className="w-3 h-3" />
            צרו קשר עם {venue?.name || "האולם"}
          </button>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-white/25 text-[10px]">Powered by</span>
          <img src={logo} alt="Giftkal" className="h-3 w-auto opacity-20" />
        </div>
      </div>

      {/* ═══════ Venue Contact Popup ═══════ */}
      {showVenueContact && venue && (
        <VenueContactPopup venue={venue} onClose={() => setShowVenueContact(false)} />
      )}

      <style>{`
        @keyframes sparkleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.35s ease-out; }
      `}</style>
    </div>
  );
}
