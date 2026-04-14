import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Target, Gem, Inbox, BarChart3, Monitor, CreditCard,
  CheckCircle2, Phone as PhoneIcon, MessageCircle, Star, Sparkles
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

const BenefitCard = ({ icon: Icon, title, desc, delay }: {
  icon: any; title: string; desc: string; delay: number;
}) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`bg-card rounded-2xl p-7 shadow-lg border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-bold text-secondary mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  );
};

const VenueOwners = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", venue_name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast({ title: "יש למלא שם וטלפון", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        lead_type: "venue_owner",
        venue_name: form.venue_name || null,
        status: "new",
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "תודה! 🎉", description: "ניצור קשר בהקדם" });
    } catch {
      toast({ title: "שגיאה, נסו שוב", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-secondary via-secondary/95 to-secondary/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(149,116,47,0.12),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">פתרון לאולמות אירועים</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            שדרגו את השירות ללקוחות<br />
            <span className="text-primary">וקבלו יותר פניות</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-6">
            מערכת גביית מתנות באשראי + ניהול לידים — ללא עלות
          </p>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto mb-10 text-right space-y-3">
            <p className="text-white/80 text-base leading-relaxed">
              <span className="font-bold text-primary">GiftKal</span> מאפשרת לאורחים באירועים שלכם להעניק מתנות באשראי — בצורה אלגנטית ומאובטחת, ישירות מעמדה שמוצבת באולם או דרך קישור אישי שנשלח למוזמנים.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              המערכת כוללת דף נחיתה מותאם אישית לאולם שלכם, ניהול לידים מתוך האירועים, ותמיכה מלאה בכל סוגי האירועים — חתונות, בר/בת מצוות, בריתות ועוד.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#lead-form">
              <Button variant="gold" size="lg" className="text-lg px-10 py-6">
                הצטרפו ללא עלות 👈
              </Button>
            </a>
            <a href="https://wa.me/97223131700?text=היי, אשמח לשמוע על GiftKal לאולם שלי" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-lg px-10 py-6 bg-transparent border-2 border-white/30 text-white hover:bg-white/10">
                <MessageCircle className="w-5 h-5 ml-2" />
                דברו עם נציג
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* יתרונות */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">🎁</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">מה GiftKal נותן לאולם שלכם?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <BenefitCard icon={Monitor} title="עמדת מתנות דיגיטלית" desc="עמדה אלגנטית שמוצבת באולם ומאפשרת לאורחים לשלוח מתנות בצורה נוחה — מותאמת לבראנד שלכם" delay={0} />
            <BenefitCard icon={Inbox} title="לידים מתוך האירועים" desc="כל אורח שנותן מתנה הוא ליד פוטנציאלי לאירוע הבא — אוטומטית" delay={100} />
            <BenefitCard icon={BarChart3} title="ניהול פניות מסודר" desc="מערכת מרכזית לניהול כל הלידים והפניות שמגיעים מהאולם" delay={200} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-6">
            <BenefitCard icon={CreditCard} title="סליקה מאובטחת" desc="גבייה בתקן PCI דרך PayMe — הכסף מגיע ישירות ללקוח" delay={300} />
            <BenefitCard icon={Gem} title="חוויית שירות מתקדמת" desc="שדרוג אמיתי שמבדיל את האולם שלכם מהמתחרים" delay={400} />
            <BenefitCard icon={Target} title="מתאים לכל סוג אירוע" desc="חתונות, בר מצוות, בריתות, אירועי חברה — הכל במערכת אחת" delay={500} />
          </div>
        </div>
      </section>

      {/* מחיר */}
      <section className="py-16 bg-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-card rounded-3xl p-10 shadow-xl border border-primary/20 max-w-md mx-auto">
            <p className="text-muted-foreground mb-2">עלות הצטרפות לאולם</p>
            <p className="text-6xl font-black text-primary mb-2">₪0</p>
            <p className="text-muted-foreground mb-6">ללא עלות • ללא התחייבות</p>
            <div className="space-y-2">
              {["עמדה באולם ללא עלות", "מערכת ניהול לידים חינם", "תמיכה טכנית מלאה"].map((t, i) => (
                <div key={i} className="flex items-center gap-2 justify-center text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* המלצה */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-primary fill-primary" />
            ))}
          </div>
          <blockquote className="text-xl text-foreground font-medium leading-relaxed mb-4">
            "מאז שהכנסנו את המערכת, הלקוחות מרגישים שאנחנו נותנים הרבה מעבר — וגם התחילו להגיע פניות חדשות מתוך האירועים"
          </blockquote>
          <p className="text-muted-foreground">— מנהל אולם אירועים</p>
        </div>
      </section>

      {/* טופס לידים */}
      <section id="lead-form" className="py-20 bg-gradient-to-b from-secondary to-secondary/95">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              רוצים לשדרג את <span className="text-primary">האולם שלכם?</span>
            </h2>
            <p className="text-white/60 text-lg">השאירו פרטים ונחזור אליכם עם הדגמה</p>
          </div>

          <div className="max-w-lg mx-auto">
            {submitted ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-primary/30 text-center">
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">תודה רבה! 🎉</h3>
                <p className="text-white/60">ניצור אתכם קשר בהקדם</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 space-y-5">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">שם מלא *</label>
                  <Input
                    value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12"
                    placeholder="שם מלא"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-sm mb-2 block">טלפון *</label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12"
                    placeholder="050-000-0000"
                    type="tel"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-sm mb-2 block">שם האולם</label>
                  <Input
                    value={form.venue_name}
                    onChange={e => setForm(p => ({ ...p, venue_name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12"
                    placeholder="שם האולם שלכם"
                  />
                </div>
                <Button type="submit" variant="gold" size="lg" className="w-full text-lg py-6" disabled={loading}>
                  {loading ? "שולח..." : "הצטרפו עכשיו ללא עלות 👈"}
                </Button>
              </form>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a href="https://wa.me/97223131700" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <MessageCircle className="w-5 h-5 ml-2" />
                  WhatsApp
                </Button>
              </a>
              <a href="tel:+97223131700">
                <Button size="lg" className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                  <PhoneIcon className="w-5 h-5 ml-2" />
                  02-3131700
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VenueOwners;
