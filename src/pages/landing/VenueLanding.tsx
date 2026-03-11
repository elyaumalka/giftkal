import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MessageCircle, Send, Loader2, ArrowLeft } from "lucide-react";

export default function VenueLanding() {
  const { venueId } = useParams();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        .insert({
          venue_id: venueId,
          full_name: fullName,
          phone,
          email,
          event_date: eventDate || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "הפרטים נשלחו בהצלחה! ✨", description: "ניצור איתך קשר בהקדם" });
      setFullName("");
      setPhone("");
      setEmail("");
      setEventDate("");
    },
    onError: () => {
      toast({ title: "שגיאה", description: "אירעה שגיאה בשליחת הפרטים", variant: "destructive" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      toast({ title: "נא למלא שם מלא", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    await submitLead.mutateAsync();
    setIsSubmitting(false);
  };

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
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-4xl">😕</span>
        </div>
        <h1 className="text-2xl font-bold text-[#051839]">האולם לא נמצא</h1>
        <p className="text-gray-500">הקישור אינו תקין או שהאולם הוסר</p>
      </div>
    );
  }

  const config = (venue.landing_page_config as any) || {};
  const venueName = config.venue_name || venue.name;
  const aboutText = config.about || "";
  const phoneNumber = config.phone || "";
  const galleryImages = config.gallery || [];
  const whatsappNumber = config.whatsapp || "";
  const emailAddress = config.email || "";

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: `url('/landing/bg-hexagon.png') center/cover no-repeat fixed` }}>
      {/* Hero Image */}
      <div className="relative w-full">
        <img
          src="/landing/hero-banquet.png"
          alt="אולם אירועים"
          className="w-full object-cover"
          style={{ maxHeight: "340px" }}
        />
        {/* Curved bottom overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: "white",
            borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            transform: "translateY(50%)",
          }}
        />
      </div>

      {/* Logo overlapping hero */}
      <div className="relative z-10 flex justify-center -mt-14">
        {venue.logo_url ? (
          <img
            src={venue.logo_url}
            alt={venueName}
            className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl object-cover bg-white"
          />
        ) : (
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl bg-[#051839] flex items-center justify-center">
            <span className="text-3xl font-bold text-[#C4A35A]">{venueName?.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Venue Name */}
      <div className="text-center mt-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-[#051839]">{venueName}</h1>
        <p className="text-gray-400 mt-1 text-sm">חוויה בלתי נשכחת מתחילה כאן</p>
      </div>

      {/* Contact Icons */}
      <div className="flex justify-center gap-6 mt-6 px-4">
        {emailAddress && (
          <a href={`mailto:${emailAddress}`} className="flex flex-col items-center gap-1.5 group">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <Mail className="w-6 h-6 text-[#051839]" />
            </div>
            <span className="text-[11px] text-gray-500 max-w-[90px] truncate">{emailAddress}</span>
          </a>
        )}
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <MessageCircle className="w-6 h-6 text-[#051839]" />
            </div>
            <span className="text-[11px] text-gray-500">{whatsappNumber}</span>
          </a>
        )}
        {phoneNumber && (
          <a href={`tel:${phoneNumber}`} className="flex flex-col items-center gap-1.5 group">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <Phone className="w-6 h-6 text-[#051839]" />
            </div>
            <span className="text-[11px] text-gray-500">{phoneNumber}</span>
          </a>
        )}
      </div>

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <div className="mt-10 px-4 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-[#051839] text-center mb-5">גלריית תמונות</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {galleryImages.map((url: string, i: number) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden">
                <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Section */}
      {aboutText && (
        <div className="mt-10 px-4 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#051839] mb-4">אודות האולם</h2>
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">{aboutText}</p>
        </div>
      )}

      {/* Lead Form */}
      <div className="mt-10 px-4 pb-12 max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#051839]">השאירו פרטים כאן בטופס</h2>
          <p className="text-[#C4A35A] font-medium mt-1">וקבלו הצעת מחיר משתלמת במיוחד!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-center text-gray-500 text-sm mb-1">שם פרטי ומשפחה</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-xl bg-white border-gray-200 text-center text-[#051839]"
              required
            />
          </div>
          <div>
            <label className="block text-center text-gray-500 text-sm mb-1">טלפון</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 rounded-xl bg-white border-gray-200 text-center text-[#051839]"
              type="tel"
            />
          </div>
          <div>
            <label className="block text-center text-gray-500 text-sm mb-1">כתובת מייל</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-white border-gray-200 text-center text-[#051839]"
              type="email"
            />
          </div>
          <div>
            <label className="block text-center text-gray-500 text-sm mb-1">תאריך האירוע</label>
            <Input
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-12 rounded-xl bg-white border-gray-200 text-center text-[#051839]"
              type="date"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-[#C41E3A] text-white text-lg font-bold hover:bg-[#A8182F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
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

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-gray-300 text-xs">
          Powered by <span className="text-[#C4A35A] font-medium">Giftkal</span>
        </p>
      </div>
    </div>
  );
}
