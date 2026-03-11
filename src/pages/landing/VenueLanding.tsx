import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MessageCircle, Send, Sparkles, Calendar, User, AtSign } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center p-8 backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-4xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">האולם לא נמצא</h1>
          <p className="text-white/60">הקישור אינו תקין או שהאולם הוסר</p>
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
    <div className="min-h-screen overflow-hidden" style={{ background: `url('/landing/bg-hexagon.png') center/cover no-repeat fixed, linear-gradient(to bottom right, #0f172a, #1e1b4b, #0f172a)` }}>
      {/* Background overlay for readability */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-slate-900/40" />
      </div>

      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] flex items-center justify-center">
        {/* Banner Background */}
        {venue.banner_url && (
          <img 
            src={venue.banner_url} 
            alt="Banner" 
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
        
        {/* Content */}
        <div className="relative z-10 text-center px-4">
          {/* Logo */}
          <div className="mb-6 relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-amber-400 to-primary rounded-full blur-xl opacity-50 animate-pulse" />
            {venue.logo_url ? (
              <img 
                src={venue.logo_url} 
                alt={venueName} 
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white/30 shadow-2xl object-cover bg-white/10 backdrop-blur-sm"
              />
            ) : (
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white/30 shadow-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent">{venueName?.charAt(0)}</span>
              </div>
            )}
          </div>
          
          {/* Venue Name */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
              {venueName}
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-white/60 text-lg md:text-xl max-w-md mx-auto">
            חוויה בלתי נשכחת מתחילה כאן
          </p>
        </div>
      </div>

      {/* Contact Icons - Floating */}
      <div className="relative z-10 -mt-8 flex justify-center gap-4 px-4">
        {emailAddress && (
          <a 
            href={`mailto:${emailAddress}`} 
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-white/20">
              <Mail className="w-6 h-6 text-white" />
            </div>
          </a>
        )}
        {whatsappNumber && (
          <a 
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-white/20">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </a>
        )}
        {phoneNumber && (
          <a 
            href={`tel:${phoneNumber}`}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-amber-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-white/20">
              <Phone className="w-6 h-6 text-white" />
            </div>
          </a>
        )}
      </div>

      {/* About Section */}
      {aboutText && (
        <div className="relative z-10 py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-white/80 text-sm">אודות האולם</span>
            </div>
            <p className="text-white/70 text-lg leading-relaxed">
              {aboutText}
            </p>
          </div>
        </div>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <div className="relative z-10 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              <span className="bg-gradient-to-r from-white via-white/80 to-white bg-clip-text text-transparent">
                גלריית תמונות
              </span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {galleryImages.map((url: string, i: number) => (
                <div 
                  key={i} 
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
                >
                  <img 
                    src={url} 
                    alt={`Gallery ${i + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lead Form */}
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Form Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-3xl blur-xl opacity-30" />
            
            <div className="relative backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-amber-500 mb-4 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">השאירו פרטים</h2>
                <p className="text-primary">וקבלו הצעת מחיר משתלמת במיוחד!</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="שם פרטי ומשפחה"
                    className="h-14 pr-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:bg-white/10 transition-all text-right"
                    required
                  />
                </div>
                
                {/* Phone Field */}
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="מספר טלפון"
                    className="h-14 pr-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:bg-white/10 transition-all text-right"
                    type="tel"
                  />
                </div>
                
                {/* Email Field */}
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
                    <AtSign className="w-5 h-5" />
                  </div>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="כתובת אימייל"
                    className="h-14 pr-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:bg-white/10 transition-all text-right"
                    type="email"
                  />
                </div>
                
                {/* Date Field */}
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <Input
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="תאריך האירוע"
                    className="h-14 pr-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:bg-white/10 transition-all text-right"
                    type="date"
                  />
                </div>
                
                {/* Submit Button */}
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-xl text-lg font-medium relative overflow-hidden group"
                  variant="gold"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>שולח...</span>
                      </>
                    ) : (
                      <>
                        <span>שליחת פרטים</span>
                        <Send className="w-5 h-5 rotate-180" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-6 text-center">
        <p className="text-white/30 text-sm">
          Powered by <span className="text-primary font-medium">Giftkal</span>
        </p>
      </div>
    </div>
  );
}
