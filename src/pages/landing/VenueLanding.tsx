import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MessageCircle, ArrowLeft } from "lucide-react";

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
      toast({ title: "הפרטים נשלחו בהצלחה!", description: "ניצור איתך קשר בהקדם" });
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin w-8 h-8 border-4 border-[#95742F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#051839] mb-2">האולם לא נמצא</h1>
          <p className="text-gray-500">הקישור אינו תקין או שהאולם הוסר</p>
        </div>
      </div>
    );
  }

  const config = venue.landing_page_config as any || {};
  const venueName = config.venue_name || venue.name;
  const aboutText = config.about || "";
  const phoneNumber = config.phone || "";
  const galleryImages = config.gallery || [];
  const whatsappNumber = config.whatsapp || "";
  const emailAddress = config.email || "";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section with Banner */}
      <div className="relative h-64 md:h-80 bg-gradient-to-b from-[#051839] to-[#0a2a5c]">
        {venue.banner_url && (
          <img 
            src={venue.banner_url} 
            alt="Banner" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        
        {/* Hexagon pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="hexagons" width="20" height="23" patternUnits="userSpaceOnUse">
              <path d="M10 0 L20 5.77 L20 17.32 L10 23.09 L0 17.32 L0 5.77 Z" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#hexagons)"/>
          </svg>
        </div>
        
        {/* Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {venue.logo_url ? (
            <img 
              src={venue.logo_url} 
              alt={venueName} 
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
              <span className="text-2xl font-bold text-[#95742F]">{venueName?.charAt(0)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Venue Name */}
      <div className="text-center py-6 bg-white shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold text-[#95742F]">{venueName}</h1>
        
        {/* Contact Icons */}
        <div className="flex justify-center gap-8 mt-4">
          {emailAddress && (
            <a href={`mailto:${emailAddress}`} className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#95742F] transition-colors">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs">{emailAddress}</span>
            </a>
          )}
          {whatsappNumber && (
            <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#95742F] transition-colors">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-xs">{whatsappNumber}</span>
            </a>
          )}
          {phoneNumber && (
            <a href={`tel:${phoneNumber}`} className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#95742F] transition-colors">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-xs">{phoneNumber}</span>
            </a>
          )}
        </div>
      </div>

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <div className="py-8 px-4">
          <h2 className="text-xl font-bold text-[#051839] text-center mb-6">גלריית תמונות</h2>
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            {galleryImages.map((url: string, i: number) => (
              <div key={i} className="aspect-square rounded-lg bg-gray-200 overflow-hidden">
                <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Section */}
      {aboutText && (
        <div className="py-8 px-4 bg-white">
          <h2 className="text-xl font-bold text-[#051839] text-center mb-4">אודות האולם</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto leading-relaxed">
            {aboutText}
          </p>
        </div>
      )}

      {/* Lead Form */}
      <div className="py-8 px-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-[#051839] text-center mb-2">השאירו פרטים כאן בטופס</h2>
          <p className="text-[#95742F] text-center mb-6">וקבלו הצעת מחיר משתלמת במיוחד!</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[#051839] font-medium text-right block text-sm">שם פרטי ומשפחה</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="שם פרטי ומשפחה"
                className="rounded-full border-0 bg-white text-right h-12"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[#051839] font-medium text-right block text-sm">טלפון</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="טלפון"
                className="rounded-full border-0 bg-white text-right h-12"
                type="tel"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[#051839] font-medium text-right block text-sm">כתובת מייל</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="כתובת מייל"
                className="rounded-full border-0 bg-white text-right h-12"
                type="email"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[#051839] font-medium text-right block text-sm">תאריך האירוע</label>
              <Input
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="תאריך האירוע"
                className="rounded-full border-0 bg-white text-right h-12"
                type="date"
              />
            </div>
            
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-full py-4 flex items-center justify-center gap-2 transition-colors font-medium text-lg disabled:opacity-50"
            >
              <span>לשליחת הפרטים</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-gray-400 text-sm">
        Powered by Giftkal
      </div>
    </div>
  );
}