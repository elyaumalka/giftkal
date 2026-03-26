import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Phone, Mail, MessageCircle, MapPin, Clock, Send, CheckCircle2, Sparkles
} from "lucide-react";

const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
};

const contactMethods = [
  {
    icon: Phone,
    title: "טלפון",
    value: "02-3131700",
    href: "tel:+97223131700",
    description: "ימים א׳–ה׳, 9:00–18:00",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "שלחו הודעה",
    href: "https://wa.me/97223131700",
    description: "מענה מהיר תוך דקות",
  },
  {
    icon: Mail,
    title: "אימייל",
    value: "g023131700@gmail.com",
    href: "mailto:g023131700@gmail.com",
    description: "מענה תוך 24 שעות",
  },
];

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name.trim() || form.full_name.trim().length > 100) {
      toast({ title: "שם מלא נדרש (עד 100 תווים)", variant: "destructive" });
      return;
    }
    if (!form.phone.trim() || !/^[\d\-+() ]{7,15}$/.test(form.phone.trim())) {
      toast({ title: "מספר טלפון לא תקין", variant: "destructive" });
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast({ title: "כתובת אימייל לא תקינה", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        lead_type: "contact_form",
        venue_name: form.message.trim() || null,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "הפנייה נשלחה בהצלחה! ✨", description: "נחזור אליכם בהקדם" });
    } catch {
      toast({ title: "שגיאה בשליחה, נסו שוב", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const heroRef = useInView();
  const formRef = useInView();
  const methodsRef = useInView();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* HERO */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-secondary via-secondary/95 to-secondary/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(149,116,47,0.15),transparent_60%)]" />
        <div
          ref={heroRef.ref}
          className={`container mx-auto px-4 text-center relative z-10 transition-all duration-700 ${heroRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            נשמח לשמוע <span className="text-primary">מכם</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            יש שאלה? רוצים הדגמה? השאירו פרטים ונחזור אליכם בהקדם
          </p>
        </div>
      </section>

      {/* תוכן ראשי */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* טופס */}
            <div
              ref={formRef.ref}
              className={`transition-all duration-700 ${formRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <h2 className="text-2xl font-bold text-secondary mb-2">השאירו פרטים</h2>
              <p className="text-muted-foreground mb-8">ונחזור אליכם עם כל המידע שתצטרכו</p>

              {sent ? (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-secondary mb-3">תודה רבה! 🎉</h3>
                  <p className="text-muted-foreground text-lg">קיבלנו את הפנייה שלכם ונחזור אליכם בהקדם.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">שם מלא *</label>
                    <Input
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="הכניסו את שמכם"
                      className="h-12 text-base"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">טלפון *</label>
                    <Input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="02-3131700"
                      className="h-12 text-base"
                      maxLength={15}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">אימייל</label>
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="h-12 text-base"
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">הודעה</label>
                    <Textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="ספרו לנו במה נוכל לעזור..."
                      className="min-h-[120px] text-base resize-none"
                      maxLength={1000}
                    />
                  </div>
                  <Button type="submit" variant="gold" size="lg" className="w-full text-lg py-6" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2"><Sparkles className="w-5 h-5 animate-spin" /> שולח...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Send className="w-5 h-5" /> שלחו פנייה</span>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* דרכי יצירת קשר */}
            <div
              ref={methodsRef.ref}
              className={`transition-all duration-700 delay-200 ${methodsRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <h2 className="text-2xl font-bold text-secondary mb-2">דרכים נוספות ליצירת קשר</h2>
              <p className="text-muted-foreground mb-8">בחרו את הדרך הנוחה לכם</p>

              <div className="space-y-5">
                {contactMethods.map((method, i) => (
                  <a
                    key={i}
                    href={method.href}
                    target={method.href.startsWith("http") ? "_blank" : undefined}
                    rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-5 bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <method.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-secondary text-lg">{method.title}</h3>
                      <p className="text-primary font-medium">{method.value}</p>
                      <p className="text-muted-foreground text-sm">{method.description}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* שעות פעילות */}
              <div className="mt-8 bg-secondary/5 rounded-2xl p-6 border border-secondary/10">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                  <h3 className="font-bold text-secondary text-lg">שעות פעילות</h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>ימים א׳–ה׳</span>
                    <span className="font-medium text-foreground">9:00 – 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>יום ו׳</span>
                    <span className="font-medium text-foreground">9:00 – 13:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>שבת</span>
                    <span className="text-muted-foreground">סגור</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA תחתון */}
      <section className="py-16 bg-gradient-to-b from-secondary to-secondary/95">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            מעדיפים לדבר? <span className="text-primary">אנחנו כאן</span>
          </h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            צרו קשר בוואטסאפ ונחזור אליכם תוך דקות
          </p>
          <a href="https://wa.me/97223131700" target="_blank" rel="noopener noreferrer">
            <Button variant="gold" size="lg" className="text-lg px-10 py-6">
              <MessageCircle className="w-5 h-5 ml-2" />
              שלחו הודעה בוואטסאפ
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Contact;
