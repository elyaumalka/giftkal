import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Gift, Sparkles, Phone, MessageCircle, Mail, CreditCard, X, ChevronDown } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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

/* ══════════════════════════════════════════════
   Venue Landing Popup — full venue page in overlay
   ══════════════════════════════════════════════ */
function VenueLandingPopup({ venueId, onClose }: { venueId: string; onClose: () => void }) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);

  const { data: venue, isLoading } = useQuery({
    queryKey: ["popup-venue", venueId],
    queryFn: async () => {
      const { data } = await supabase
        .from("venues")
        .select("id, name, logo_url, banner_url, landing_page_config, phone, email, address")
        .eq("id", venueId)
        .maybeSingle();
      return data;
    },
  });

  const submitLead = useMutation({
    mutationFn: async () => {
      if (!venueId || !fullName) throw new Error("Missing");
      const { error } = await supabase
        .from("landing_page_leads")
        .insert({ venue_id: venueId, full_name: fullName, phone, email, event_date: eventDate || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "הפרטים נשלחו בהצלחה! ✨", description: "ניצור איתך קשר בהקדם" });
      setFullName(""); setPhone(""); setEmail(""); setEventDate("");
    },
    onError: () => {
      toast({ title: "שגיאה", description: "אירעה שגיאה בשליחת הפרטים", variant: "destructive" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) { toast({ title: "נא למלא שם מלא", variant: "destructive" }); return; }
    setIsSubmitting(true);
    await submitLead.mutateAsync();
    setIsSubmitting(false);
  };

  const STORY_DURATION = 4000;
  const config = (venue?.landing_page_config as any) || {};
  const galleryImages: string[] = config.gallery || [];
  const venueName = config.venue_name || venue?.name || "";
  const aboutText = config.about || "";
  const phoneNumber = config.phone || venue?.phone || "";
  const whatsappNumber = config.whatsapp || "";
  const emailAddress = config.email || venue?.email || "";

  useEffect(() => {
    if (galleryImages.length === 0) return;
    const tick = 30;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += tick;
      setStoryProgress((elapsed / STORY_DURATION) * 100);
      if (elapsed >= STORY_DURATION) {
        elapsed = 0;
        setStoryIndex((prev) => (prev + 1) % galleryImages.length);
        setStoryProgress(0);
      }
    }, tick);
    return () => clearInterval(timer);
  }, [storyIndex, galleryImages.length]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 flex flex-col mt-12 mx-2 md:mx-auto md:max-w-2xl mb-2 rounded-t-3xl rounded-b-2xl overflow-hidden bg-white max-h-[85vh] animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto" />
          <div className="w-8" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#051839]" /></div>
          ) : !venue ? (
            <div className="text-center py-20 text-gray-400">האולם לא נמצא</div>
          ) : (
            <>
              <div className="relative w-full">
                <img src="/landing/hero-banquet.png" alt="" className="w-full object-cover" style={{ maxHeight: "220px" }} />
              </div>
              <div className="relative z-10 -mt-12 flex flex-col items-center">
                {venue.logo_url ? (
                  <img src={venue.logo_url} alt={venueName} className="w-24 h-24 rounded-full border-4 border-white shadow-2xl object-cover bg-white" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl bg-[#051839] flex items-center justify-center">
                    <span className="text-3xl font-bold text-[#C4A35A]">{venueName?.charAt(0)}</span>
                  </div>
                )}
                <h2 className="mt-4 text-3xl font-extrabold text-[#051839]">{venueName}</h2>
              </div>
              <div className="mt-6 mx-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg py-4 px-4 flex justify-center gap-6">
                {emailAddress && (
                  <a href={`mailto:${emailAddress}`} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-xl bg-[#051839]/5 flex items-center justify-center"><Mail className="w-5 h-5 text-[#051839]" /></div>
                  </a>
                )}
                {whatsappNumber && (
                  <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-xl bg-[#051839]/5 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-[#051839]" /></div>
                  </a>
                )}
                {phoneNumber && (
                  <a href={`tel:${phoneNumber}`} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-xl bg-[#051839]/5 flex items-center justify-center"><Phone className="w-5 h-5 text-[#051839]" /></div>
                  </a>
                )}
              </div>
              {galleryImages.length > 0 && (
                <div className="mt-10 px-4 max-w-lg mx-auto">
                  <h3 className="text-2xl font-extrabold text-[#051839] text-center mb-5">גלריית תמונות</h3>
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black aspect-[9/14]">
                    <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
                      {galleryImages.map((_: string, i: number) => (
                        <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                          <div className="h-full bg-white rounded-full" style={{
                            width: i < storyIndex ? "100%" : i === storyIndex ? `${storyProgress}%` : "0%",
                            transition: i === storyIndex ? "width 30ms linear" : "none",
                          }} />
                        </div>
                      ))}
                    </div>
                    <img src={galleryImages[storyIndex]} alt={`תמונה ${storyIndex + 1}`} className="w-full h-full object-cover" key={storyIndex} />
                  </div>
                </div>
              )}
              {aboutText && (
                <div className="mt-10 mx-3">
                  <div className="bg-white/90 backdrop-blur-md rounded-[2rem] shadow-lg py-8 px-5 max-w-3xl mx-auto text-center">
                    <h3 className="text-2xl font-extrabold text-[#051839] mb-4">אודות האולם</h3>
                    <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{aboutText}</p>
                  </div>
                </div>
              )}
              <div className="mt-10 mx-3 pb-8">
                <div className="bg-white rounded-[2rem] shadow-2xl max-w-md mx-auto py-8 px-5 space-y-5">
                  <div className="text-center">
                    <h3 className="text-2xl font-extrabold text-[#051839]">השאירו פרטים</h3>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {[
                      { label: "שם פרטי ומשפחה", value: fullName, setter: setFullName, type: "text", required: true },
                      { label: "טלפון", value: phone, setter: setPhone, type: "tel" },
                      { label: "כתובת מייל", value: email, setter: setEmail, type: "email" },
                      { label: "תאריך האירוע", value: eventDate, setter: setEventDate, type: "date" },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="block text-center text-gray-500 text-xs mb-1 font-medium">{f.label}</label>
                        <Input value={f.value} onChange={(e) => f.setter(e.target.value)}
                          className="h-12 rounded-xl bg-gray-50 border-gray-200 text-center text-[#051839] text-sm"
                          type={f.type} required={f.required} />
                      </div>
                    ))}
                    <button type="submit" disabled={isSubmitting}
                      className="w-full h-16 rounded-2xl bg-[#C41E3A] text-white text-xl font-bold hover:bg-[#A8182F] disabled:opacity-50 flex items-center justify-center gap-2 mt-3 shadow-lg">
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <>לשליחת הפרטים <ArrowLeft className="w-5 h-5" /></>}
                    </button>
                  </form>
                </div>
              </div>
              <div className="py-6 text-center">
                <p className="text-gray-400 text-xs">Powered by <span className="text-[#C4A35A] font-semibold">Giftkal</span></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Event Welcome Page
   ══════════════════════════════════════════════ */
export default function EventWelcome() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [showVenueLanding, setShowVenueLanding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(t);
  }, []);

  const { data: event, isLoading } = useQuery<any>({
    queryKey: ["event-welcome", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      // If venue_id exists, fetch venue details separately
      if (data?.venue_id) {
        const { data: venue } = await supabase
          .from("venues")
          .select("id, name, address, logo_url, banner_url, phone, email")
          .eq("id", data.venue_id)
          .maybeSingle();
        return { ...data, venues: venue };
      }
      return { ...data, venues: null };
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Check PayMe seller approval status
  const { data: paymeStatus, isLoading: isLoadingPayme } = useQuery({
    queryKey: ["payme-status", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-payme-key', {
        body: { eventId },
      });
      if (error) return { sellerApproved: false };
      return data as { sellerApproved?: boolean; clientKey?: string | null };
    },
    enabled: !!eventId && !!event?.seller_payme_id,
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

  // Block gifts if no active payment account
  if (!event.seller_payme_id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#051839]" dir="rtl">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center"><span className="text-4xl">🔒</span></div>
        <h1 className="text-2xl font-bold text-white">שירות המתנות אינו פעיל</h1>
        <p className="text-white/50 text-center max-w-sm">שירות המתנות באשראי לא הופעל עדיין לאירוע זה</p>
      </div>
    );
  }

  // Wait for PayMe approval check
  if (isLoadingPayme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#051839]">
        <Loader2 className="w-10 h-10 animate-spin text-[#C4A35A]" />
      </div>
    );
  }

  // Block entire gift flow if seller is not yet approved by PayMe
  if (paymeStatus && paymeStatus.sellerApproved === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#051839] px-6" dir="rtl">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center"><span className="text-4xl">⏳</span></div>
        <h1 className="text-2xl font-bold text-white text-center">שירות המתנות יופעל בקרוב</h1>
        <p className="text-white/60 text-center max-w-sm leading-relaxed">
          חשבון הסליקה של בעל האירוע נמצא בתהליך אישור סופי מול חברת הסליקה.
          <br />
          ברגע שהאישור יושלם, ניתן יהיה להעניק מתנה באשראי.
        </p>
        <p className="text-white/40 text-xs text-center mt-2">נסו שוב בעוד מספר שעות</p>
      </div>
    );
  }


  // Web: no date restriction — gifts are always allowed via the website.
  // (Kiosk keeps its own same-day restriction in KioskPage.)

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
    if (event.event_type === "ברית") return event.child_name || event.family_name || "";
    return event.child_name || event.groom_name || event.family_name || "";
  };

  const handleContinue = () => navigate(`/gift/${eventId}/send`);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" dir="rtl">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, rgba(5,24,57,0.3) 0%, rgba(5,24,57,0.6) 30%, rgba(5,24,57,0.92) 60%, rgba(5,24,57,1) 80%)"
        }} />
      </div>

      <SparkleField />

      {/* Venue Logo */}
      <div className={`relative z-20 pt-8 flex flex-col items-center transition-all duration-1000 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`}>
        <div className={`relative ${venueId ? "cursor-pointer" : ""} group`} onClick={() => venueId && setShowVenueLanding(true)}>
          <div className="absolute -inset-3 bg-[#C4A35A]/25 rounded-full blur-xl animate-pulse" />
          {venue?.logo_url ? (
            <img src={venue.logo_url} alt={venue?.name || ""} className="relative w-20 h-20 rounded-full border-2 border-[#C4A35A]/50 shadow-2xl object-cover bg-white/10 backdrop-blur-sm group-hover:scale-105 transition-transform" />
          ) : (
            <div className="relative w-20 h-20 rounded-full border-2 border-[#C4A35A]/50 shadow-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <img src={logoAsset.url} alt="Giftkal" className="h-8 w-auto brightness-0 invert" />
            </div>
          )}
        </div>
        {venue?.name && <p className="mt-2 text-sm font-semibold text-white/80">{venue.name}</p>}
      </div>

      {/* Event Info */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6">
        <div className={`flex flex-col items-center transition-all duration-1000 delay-300 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C4A35A]/60" />
            <Sparkles className="w-4 h-4 text-[#C4A35A]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C4A35A]/60" />
          </div>
          <p className="text-[#C4A35A]/80 text-sm font-medium tracking-widest uppercase mb-2">{eventTypeLabel}</p>
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-3 text-center leading-none" style={{ textShadow: "0 4px 30px rgba(196,163,90,0.3)" }}>מזל טוב</h1>
          <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-2 leading-tight" style={{
            background: "linear-gradient(135deg, #C4A35A 0%, #E8D5A3 50%, #C4A35A 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 2px 10px rgba(196,163,90,0.3))",
          }}>{getEventNames()}</h2>
          <div className="flex items-center gap-2 mt-4 bg-white/5 backdrop-blur-sm rounded-full px-5 py-2 border border-white/10">
            <CreditCard className="w-4 h-4 text-[#C4A35A]" />
            <span className="text-white/60 text-xs font-medium">מתנה באשראי בצורה מאובטחת</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className={`relative z-20 pb-6 px-5 transition-all duration-1000 delay-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <button onClick={handleContinue}
          className="w-full relative overflow-hidden group py-5 rounded-2xl font-bold text-xl text-white flex items-center justify-center gap-3 shadow-2xl active:scale-[0.97] transition-transform"
          style={{ background: "linear-gradient(135deg, #C41E3A 0%, #E8344E 50%, #C41E3A 100%)", boxShadow: "0 8px 32px rgba(196,30,58,0.4), 0 0 60px rgba(196,30,58,0.15)" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Gift className="w-6 h-6 relative z-10" />
          <span className="relative z-10">מעניקים מתנה בקליק</span>
          <ArrowLeft className="w-5 h-5 relative z-10" />
        </button>

        {venueId && (
          <button onClick={() => setShowVenueLanding(true)}
            className="w-full mt-4 text-white/40 text-xs font-medium flex items-center justify-center gap-1.5 hover:text-white/60 transition-colors">
            <Phone className="w-3 h-3" />
            צרו קשר עם {venue?.name || "האולם"}
          </button>
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-white/25 text-[10px]">Powered by</span>
          <img src={logoAsset.url} alt="Giftkal" className="h-3 w-auto opacity-20" />
        </div>
      </div>

      {/* Venue Landing Popup */}
      {showVenueLanding && venueId && (
        <VenueLandingPopup venueId={venueId} onClose={() => setShowVenueLanding(false)} />
      )}

      <style>{`
        @keyframes sparkleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
