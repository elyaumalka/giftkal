import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MessageCircle, Loader2, ArrowLeft, Sparkles } from "lucide-react";

/* ── tiny hook: fade-in on scroll ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

export default function VenueLanding() {
  const { venueId } = useParams();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);

  
  const revealGallery = useReveal();
  const revealAbout = useReveal();
  const revealForm = useReveal();

  const { data: venue, isLoading } = useQuery({
    queryKey: ["landing-venue", venueId],
    queryFn: async () => {
      if (!venueId) return null;
      const { data } = await supabase
        .from("venues")
        .select("id, name, logo_url, banner_url, landing_page_config")
        .eq("id", venueId)
        .maybeSingle();
      return data;
    },
  });

  const submitLead = useMutation({
    mutationFn: async () => {
      if (!venueId || !fullName) throw new Error("Missing required fields");
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

  /* ── stories auto-advance ── */
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `url('/landing/bg-hexagon.png') center/cover no-repeat` }}>
        <Loader2 className="w-10 h-10 animate-spin text-[#051839]" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl" style={{ background: `url('/landing/bg-hexagon.png') center/cover no-repeat` }}>
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center"><span className="text-4xl">😕</span></div>
        <h1 className="text-2xl font-bold text-[#051839]">האולם לא נמצא</h1>
        <p className="text-gray-500">הקישור אינו תקין או שהאולם הוסר</p>
      </div>
    );
  }

  const venueName = config.venue_name || venue.name;
  const aboutText = config.about || "";
  const phoneNumber = config.phone || "";
  const whatsappNumber = config.whatsapp || "";
  const emailAddress = config.email || "";

  return (
    <div className="min-h-screen overflow-x-hidden" dir="rtl" style={{ background: `url('/landing/bg-hexagon.png') center/cover no-repeat fixed` }}>

      {/* ═══════ HERO ═══════ */}
      <div className="relative w-full">
        <img
          src="/landing/hero-banquet.png"
          alt="אולם אירועים"
          className="w-full object-cover animate-fade-in"
          style={{ maxHeight: "380px" }}
        />
        {/* curved white edge */}
        <div className="absolute -bottom-1 left-0 right-0 h-20" style={{ background: "transparent" }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,80 Q720,0 1440,80 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* ═══════ LOGO + NAME ═══════ */}
      <div className="relative z-10 -mt-16 flex flex-col items-center">
        <div className="relative">
          <div className="absolute -inset-2 bg-[#C4A35A]/20 rounded-full blur-xl animate-pulse" />
          {venue.logo_url ? (
            <img src={venue.logo_url} alt={venueName}
              className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-2xl object-cover bg-white" />
          ) : (
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-2xl bg-[#051839] flex items-center justify-center">
              <span className="text-4xl font-bold text-[#C4A35A]">{venueName?.charAt(0)}</span>
            </div>
          )}
        </div>

        <h1 className="mt-5 text-4xl md:text-5xl font-extrabold text-[#051839] tracking-tight">{venueName}</h1>
        <p className="text-gray-400 mt-1 text-base md:text-lg">חוויה בלתי נשכחת מתחילה כאן</p>
      </div>

      {/* ═══════ CONTACT STRIP ═══════ */}
      <div className="mt-8 mx-4 md:mx-auto md:max-w-lg bg-white/80 backdrop-blur-md rounded-2xl shadow-lg py-5 px-4 flex justify-center gap-8">
        {emailAddress && (
          <a href={`mailto:${emailAddress}`} className="flex flex-col items-center gap-2 group hover-scale">
            <div className="w-14 h-14 rounded-2xl bg-[#051839]/5 flex items-center justify-center group-hover:bg-[#051839]/10 transition-colors">
              <Mail className="w-6 h-6 text-[#051839]" />
            </div>
            <span className="text-[11px] text-gray-500 max-w-[90px] truncate">{emailAddress}</span>
          </a>
        )}
        {whatsappNumber && (
          <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group hover-scale">
            <div className="w-14 h-14 rounded-2xl bg-[#051839]/5 flex items-center justify-center group-hover:bg-[#051839]/10 transition-colors">
              <MessageCircle className="w-6 h-6 text-[#051839]" />
            </div>
            <span className="text-[11px] text-gray-500">{whatsappNumber}</span>
          </a>
        )}
        {phoneNumber && (
          <a href={`tel:${phoneNumber}`} className="flex flex-col items-center gap-2 group hover-scale">
            <div className="w-14 h-14 rounded-2xl bg-[#051839]/5 flex items-center justify-center group-hover:bg-[#051839]/10 transition-colors">
              <Phone className="w-6 h-6 text-[#051839]" />
            </div>
            <span className="text-[11px] text-gray-500">{phoneNumber}</span>
          </a>
        )}
      </div>

      {/* ═══════ GALLERY — Stories Style ═══════ */}
      {galleryImages.length > 0 && (
        <div
          ref={revealGallery.ref}
          className={`mt-12 px-4 max-w-lg mx-auto transition-all duration-700 ${revealGallery.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#051839] text-center mb-6">גלריית תמונות</h2>

          {/* Stories viewer */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black aspect-[9/14]">
            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
              {galleryImages.map((_: string, i: number) => (
                <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{
                      width: i < storyIndex ? "100%" : i === storyIndex ? `${storyProgress}%` : "0%",
                      transition: i === storyIndex ? "width 30ms linear" : "none",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Image */}
            <img
              src={galleryImages[storyIndex]}
              alt={`תמונה ${storyIndex + 1}`}
              className="w-full h-full object-cover"
              key={storyIndex}
            />

            {/* Tap zones */}
            <div
              className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer"
              onClick={() => { setStoryIndex((storyIndex - 1 + galleryImages.length) % galleryImages.length); setStoryProgress(0); }}
            />
            <div
              className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
              onClick={() => { setStoryIndex((storyIndex + 1) % galleryImages.length); setStoryProgress(0); }}
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-xs font-medium">
              {storyIndex + 1} / {galleryImages.length}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ABOUT — framed section ═══════ */}
      {aboutText && (
        <div
          ref={revealAbout.ref}
          className={`mt-12 mx-3 md:mx-6 transition-all duration-700 ${revealAbout.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="bg-white/90 backdrop-blur-md rounded-[2rem] shadow-lg py-10 px-6 md:px-12 max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#051839] mb-5">אודות האולם</h2>
            <p className="text-gray-600 leading-relaxed text-base md:text-lg whitespace-pre-line">{aboutText}</p>
          </div>
        </div>
      )}

      {/* ═══════ LEAD FORM — framed ═══════ */}
      <div
        ref={revealForm.ref}
        className={`mt-12 mx-3 md:mx-6 pb-12 transition-all duration-700 ${revealForm.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="bg-white rounded-[2rem] shadow-2xl max-w-md mx-auto py-10 px-6 md:px-10 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#C41E3A]/10 mb-3">
              <Sparkles className="w-7 h-7 text-[#C41E3A]" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#051839]">השאירו פרטים כאן בטופס</h2>
            <p className="text-[#C4A35A] font-semibold mt-1 text-lg">וקבלו הצעת מחיר משתלמת במיוחד!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "שם פרטי ומשפחה", value: fullName, setter: setFullName, type: "text", required: true },
              { label: "טלפון", value: phone, setter: setPhone, type: "tel" },
              { label: "כתובת מייל", value: email, setter: setEmail, type: "email" },
              { label: "תאריך האירוע", value: eventDate, setter: setEventDate, type: "date" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-center text-gray-500 text-sm mb-1 font-medium">{f.label}</label>
                <Input
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  className="h-13 rounded-xl bg-gray-50 border-gray-200 text-center text-[#051839] text-base focus:ring-2 focus:ring-[#C4A35A]/30"
                  type={f.type}
                  required={f.required}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-[#C41E3A] text-white text-lg font-bold hover:bg-[#A8182F] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-3 shadow-lg shadow-[#C41E3A]/25"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  לשליחת הפרטים
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <div className="py-8 text-center">
        <p className="text-gray-400 text-xs">
          Powered by <span className="text-[#C4A35A] font-semibold">Giftkal</span>
        </p>
      </div>
    </div>
  );
}
