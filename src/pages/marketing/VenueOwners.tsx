import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Target,
  Gem,
  Inbox,
  BarChart3,
  Smartphone,
  Sparkles,
  TrendingUp,
  CreditCard,
  Users,
  Phone as PhoneIcon,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Monitor,
  Star,
  Zap,
  MapPin,
  Gift,
  Wallet,
  Send,
  QrCode,
  Heart,
} from "lucide-react";

// ─── Hooks ───
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

const useCounter = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!isVisible) return;
    let startTime: number;
    const animate = (t: number) => {
      if (!startTime) startTime = t;
      const p = Math.min((t - startTime) / duration, 1);
      setCount(Math.floor(p * end));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);
  return { count, ref };
};

// ─── Hero ───
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-sidebar" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,_hsl(38_92%_50%_/_0.12),_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_20%_80%,_hsl(222_47%_20%_/_0.5),_transparent_60%)]" />

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Building2 className="absolute top-[20%] right-[12%] w-8 h-8 text-primary/15 animate-bounce" style={{ animationDuration: "4s" }} />
        <Sparkles className="absolute top-[35%] left-[10%] w-6 h-6 text-primary/20 animate-bounce" style={{ animationDuration: "3s", animationDelay: "1s" }} />
        <TrendingUp className="absolute bottom-[30%] right-[20%] w-6 h-6 text-primary/15 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }} />
        <div className="absolute top-[25%] left-[25%] w-2 h-2 bg-primary/30 rounded-full animate-pulse" />
        <div className="absolute bottom-[35%] right-[35%] w-3 h-3 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-primary/15 backdrop-blur-sm rounded-full px-5 py-2 mb-8 animate-fade-in">
            <span className="text-primary text-sm font-medium">🏛️ פתרון מתקדם לאולמות אירועים</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.15] animate-slide-up">
            תנו ללקוחות שלכם יותר
            <br />
            <span className="text-gradient-gold">וקבלו יותר פניות לאולם</span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl mb-4 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            מערכת מתקדמת לכל סוגי האירועים
            <br />
            שמשדרגת את חוויית הלקוחות ומייצרת לכם לידים חדשים
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <a href="#lead-form">
              <Button variant="gold" size="xl" className="text-lg px-10">
                הצטרפו ללא עלות 👈
              </Button>
            </a>
          </div>

          <p className="text-white/40 text-sm mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            מתאים לחתונות • בר מצוות • בריתות • אירועי חברה • כנסים
          </p>
        </div>
      </div>

      {/* Bottom curve */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path d="M0 80L1440 80L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 80Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};

// ─── What Is GiftKal ───
const WhatIsGiftkalSection = () => {
  const { ref, inView } = useInView();
  const services = [
    {
      icon: Monitor,
      title: "עמדת GiftKal באולם",
      desc: "עמדה דיגיטלית אלגנטית שמוצבת באולם ומאפשרת לאורחים לשלוח מתנות בצורה נוחה ומודרנית — במקום מעטפות ומזומן.",
      highlight: true,
    },
    {
      icon: Gift,
      title: "מתנות דיגיטליות",
      desc: "האורחים בוחרים סכום, כותבים ברכה אישית ומשלמים באשראי — בתהליך פשוט ומאובטח שלוקח דקה.",
    },
    {
      icon: CreditCard,
      title: "סליקה מאובטחת",
      desc: "גבייה בתקן PCI דרך PayMe. הכסף מועבר ישירות לחשבון הבנק של בעל האירוע.",
    },
    {
      icon: QrCode,
      title: "קישור אישי + QR",
      desc: "כל אירוע מקבל קישור ו-QR ייחודי — אורחים יכולים לשלוח מתנות גם מהטלפון, לפני, במהלך ואחרי האירוע.",
    },
    {
      icon: Heart,
      title: "ברכות אישיות",
      desc: "כל מתנה מלווה בברכה אישית מהאורח — חוויה רגשית ומרגשת לבעלי האירוע.",
    },
    {
      icon: Send,
      title: "הזמנות דיגיטליות",
      desc: "מערכת ליצירת הזמנות דיגיטליות מעוצבות עם אישורי הגעה מובנים — חוסכת הוצאות דפוס.",
    },
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-block bg-primary/10 rounded-full px-5 py-2 mb-4">
            <span className="text-primary text-sm font-medium">🎁 מה זה GiftKal?</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            מערכת מתנות דיגיטלית <span className="text-gradient-gold">לאירועים</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            GiftKal מחליפה את המעטפות והמזומן בפתרון דיגיטלי מלא — עמדה באולם, סליקה מאובטחת, ברכות אישיות והזמנות מעוצבות
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((s, i) => (
            <div
              key={i}
              className={`group relative bg-card rounded-2xl p-8 border transition-all duration-500 ${
                s.highlight
                  ? "border-primary/40 shadow-gold ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30 hover:shadow-lg"
              } hover:-translate-y-1 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {s.highlight && (
                <div className="absolute -top-3 right-6 bg-gradient-gold text-white text-xs font-bold px-4 py-1 rounded-full shadow-gold">
                  ⭐ השירות המרכזי
                </div>
              )}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
                s.highlight ? "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/20"
              }`}>
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── What You Get ───
const BenefitsSection = () => {
  const { ref, inView } = useInView();
  const items = [
    { icon: Target, title: "פתרון מתקדם לכל סוג אירוע", desc: "חתונות, בר מצוות, בריתות, אירועי חברה - הכל במערכת אחת" },
    { icon: Gem, title: "חוויית שירות חדשנית", desc: "שדרגו את השירות שאתם נותנים ללקוחות ובלטו מול המתחרים" },
    { icon: Inbox, title: "לידים ישירות מהאולם", desc: "אורחים באירוע נחשפים למערכת ומשאירים פרטים" },
    { icon: BarChart3, title: "ניהול כל הפניות במקום אחד", desc: "מערכת CRM חכמה לניהול לידים, משימות ומעקב" },
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            מה אתם <span className="text-gradient-gold">מקבלים</span>
          </h2>
          <p className="text-muted-foreground text-lg">שדרוג אמיתי לשירות שאתם נותנים</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className={`group bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Why Venues Join ───
const WhyJoinSection = () => {
  const { ref, inView } = useInView();
  const points = [
    { icon: Smartphone, text: "פתרונות דיגיטליים הם כבר סטנדרט" },
    { icon: Sparkles, text: "אולם שנותן יותר — נתפס יוקרתי יותר" },
    { icon: TrendingUp, text: "חוויית שירות טובה יותר = יותר המלצות" },
  ];

  return (
    <section className="py-24 bg-sidebar relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,_hsl(38_92%_50%_/_0.08),_transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            למה אולמות <span className="text-gradient-gold">מצטרפים</span>
          </h2>
          <p className="text-white/60 text-lg">לקוחות היום מצפים ליותר</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {points.map((p, i) => (
            <div
              key={i}
              className={`flex items-center gap-5 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-500 ${
                inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <p.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-white text-lg font-medium">{p.text}</p>
            </div>
          ))}
        </div>

        <div className={`text-center mt-12 transition-all duration-700 delay-500 ${inView ? "opacity-100" : "opacity-0"}`}>
          <p className="text-primary text-xl font-bold">
            👈 אתם לא רק מקום — אתם חוויה שלמה
          </p>
        </div>
      </div>
    </section>
  );
};

// ─── The Station ───
const StationSection = () => {
  const { ref, inView } = useInView();
  const features = [
    { icon: MapPin, text: "ממוקמת באזורים מרכזיים באולם" },
    { icon: CreditCard, text: "מאפשרת שליחת מתנות בצורה נוחה" },
    { icon: Smartphone, text: "ממשק פשוט שמתאים לכל גיל" },
    { icon: Target, text: "מתאימה לכל סוגי האירועים" },
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-block bg-primary/10 rounded-full px-5 py-2 mb-4">
            <span className="text-primary text-sm font-medium">⚡ העמדה באולם</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            עמדה חכמה שמשרתת <span className="text-gradient-gold">כל אירוע</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {features.map((f, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-foreground font-medium">{f.text}</p>
            </div>
          ))}
        </div>

        <div className={`text-center transition-all duration-700 delay-500 ${inView ? "opacity-100" : "opacity-0"}`}>
          <div className="bg-accent rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-accent-foreground text-lg font-medium">
              ✨ האורחים נהנים מהנוחות — הלקוחות שלכם מרגישים שקיבלו יותר
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Leads Section ───
const LeadsSection = () => {
  const { ref, inView } = useInView();
  const steps = [
    "אורחים נחשפים לעמדה במהלך האירוע",
    "משאירים פרטים או מתעניינים",
    "הפניות נכנסות ישירות למערכת שלכם",
  ];

  return (
    <section className="py-24 bg-sidebar relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_30%,_hsl(38_92%_50%_/_0.08),_transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-block bg-primary/15 rounded-full px-5 py-2 mb-4">
            <span className="text-primary text-sm font-medium">📥 לידים מתוך האולם</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            כל אירוע אצלכם = <span className="text-gradient-gold">הזדמנות ללקוח הבא</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-5 mb-12">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-5 transition-all duration-500 ${
                inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold">
                {i + 1}
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-5 border border-white/10 flex-1">
                <p className="text-white font-medium">{step}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center transition-all duration-700 delay-500 ${inView ? "opacity-100" : "opacity-0"}`}>
          <p className="text-primary text-lg font-bold">
            👈 לידים חמים מתוך חוויה אמיתית — לא מפרסום קר
          </p>
        </div>
      </div>
    </section>
  );
};

// ─── CRM Section ───
const CRMSection = () => {
  const { ref, inView } = useInView();
  const features = [
    { icon: BarChart3, text: "ריכוז כל הלידים במקום אחד" },
    { icon: PhoneIcon, text: "מעקב אחרי כל לקוח" },
    { icon: Clock, text: "תזכורות ומשימות" },
    { icon: Target, text: "ניהול תהליך מכירה מסודר" },
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-block bg-primary/10 rounded-full px-5 py-2 mb-4">
            <span className="text-primary text-sm font-medium">🧠 מערכת ניהול לידים</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            שליטה מלאה על <span className="text-gradient-gold">כל פנייה</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {features.map((f, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-md transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-foreground font-medium">{f.text}</p>
            </div>
          ))}
        </div>

        <div className={`text-center transition-all duration-700 delay-500 ${inView ? "opacity-100" : "opacity-0"}`}>
          <div className="bg-accent rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-accent-foreground text-lg font-medium">
              💪 לא מאבדים פניות — סוגרים יותר אירועים
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── How It Works ───
const HowItWorksSection = () => {
  const { ref, inView } = useInView();
  const steps = [
    { num: "1", title: "מצטרפים למערכת", desc: "תהליך הרשמה פשוט וללא עלות" },
    { num: "2", title: "מקבלים עמדת GiftKal", desc: "עמדה חכמה שמותקנת באולם" },
    { num: "3", title: "הלקוחות והאורחים משתמשים", desc: "במהלך כל אירוע באולם" },
    { num: "4", title: "נאספים לידים אוטומטית", desc: "הפניות מגיעות ישירות למערכת" },
    { num: "5", title: "מנהלים וסוגרים", desc: "מנהלים את הלידים דרך המערכת" },
  ];

  return (
    <section className="py-24 bg-sidebar relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_50%,_hsl(38_92%_50%_/_0.08),_transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-block bg-primary/15 rounded-full px-5 py-2 mb-4">
            <span className="text-primary text-sm font-medium">🎬 איך זה עובד</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            5 שלבים <span className="text-gradient-gold">פשוטים</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto relative">
          {/* Connecting line */}
          <div className="absolute top-0 bottom-0 right-[23px] w-px bg-primary/20 hidden md:block" />

          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-start gap-6 mb-8 last:mb-0 transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-gold relative z-10">
                {step.num}
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-5 border border-white/10 flex-1 hover:bg-white/10 transition-colors">
                <h3 className="text-white font-bold text-lg mb-1">{step.title}</h3>
                <p className="text-white/60 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Why It Works ───
const WhyItWorksSection = () => {
  const { ref, inView } = useInView();
  const reasons = [
    "אנשים כבר נמצאים באירוע",
    "הם חווים את האולם שלכם",
    "הם פתוחים להצעות",
    "והם משאירים פרטים כשהחוויה טרייה",
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            למה זה <span className="text-gradient-gold">עובד</span>
          </h2>
          <p className="text-muted-foreground text-lg">כי זה קורה ברגע הנכון</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4 mb-12">
          {reasons.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 transition-all duration-500 ${
                inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
              <p className="text-foreground text-lg">{r}</p>
            </div>
          ))}
        </div>

        <div className={`text-center transition-all duration-700 delay-700 ${inView ? "opacity-100" : "opacity-0"}`}>
          <p className="text-primary text-xl font-bold">
            👈 זה לא פרסום — זה תזמון מדויק
          </p>
        </div>
      </div>
    </section>
  );
};

// ─── Pricing ───
const PricingSection = () => {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-sidebar relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,_hsl(38_92%_50%_/_0.1),_transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            כמה זה <span className="text-gradient-gold">עולה?</span>
          </h2>
        </div>

        <div className={`max-w-md mx-auto transition-all duration-700 delay-200 ${inView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-primary/30 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-gold" />
            
            <div className="text-7xl font-bold text-gradient-gold mb-2">₪0</div>
            <p className="text-white text-xl font-bold mb-8">ללא עלות</p>

            <div className="space-y-4 mb-10">
              {["ללא עלות", "ללא התחייבות", "ללא סיכון"].map((t, i) => (
                <div key={i} className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-white/80 text-lg">{t}</span>
                </div>
              ))}
            </div>

            <a href="#lead-form">
              <Button variant="gold" size="xl" className="w-full text-lg">
                הצטרפו עכשיו
              </Button>
            </a>
          </div>
        </div>

        <div className={`text-center mt-8 transition-all duration-700 delay-500 ${inView ? "opacity-100" : "opacity-0"}`}>
          <p className="text-white/50 text-lg">רק מוסיפים ערך — בלי להוציא שקל</p>
        </div>
      </div>
    </section>
  );
};

// ─── Testimonial ───
const TestimonialSection = () => {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-primary fill-primary" />
            ))}
          </div>
          
          <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed mb-8">
            "מאז שהכנסנו את המערכת, הלקוחות מרגישים שאנחנו נותנים הרבה מעבר —
            וגם התחילו להגיע אלינו פניות חדשות מתוך האירועים עצמם"
          </blockquote>

          <p className="text-muted-foreground font-medium">— מנהל אולם אירועים</p>
        </div>
      </div>
    </section>
  );
};

// ─── Gold Quote ───
const GoldQuote = ({ text }: { text: string }) => {
  const { ref, inView } = useInView();

  return (
    <section className="py-16 bg-gradient-gold relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,_white_/_0.1,_transparent)]" />
      <div className="container mx-auto px-4 relative z-10">
        <p className={`text-center text-2xl md:text-3xl font-bold text-white max-w-3xl mx-auto transition-all duration-700 ${
          inView ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}>
          {text}
        </p>
      </div>
    </section>
  );
};

// ─── Lead Form ───
const LeadFormSection = () => {
  const { ref, inView } = useInView();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", venue_name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast({ title: "שגיאה", description: "יש למלא שם וטלפון", variant: "destructive" });
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
      toast({ title: "תודה! 🎉", description: "קיבלנו את הפרטים, ניצור קשר בהקדם" });
    } catch {
      toast({ title: "שגיאה", description: "משהו השתבש, נסו שוב", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="lead-form" className="py-24 bg-sidebar relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,_hsl(38_92%_50%_/_0.08),_transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            רוצים לשדרג את <span className="text-gradient-gold">האולם שלכם?</span>
          </h2>
          <p className="text-white/60 text-lg">השאירו פרטים ונחזור אליכם עם הדגמה קצרה</p>
        </div>

        <div className={`max-w-lg mx-auto transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {submitted ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-primary/30 text-center animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
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
                <label className="text-white/80 text-sm mb-2 block">אימייל</label>
                <Input
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12"
                  placeholder="email@example.com"
                  type="email"
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
              <Button type="submit" variant="gold" size="xl" className="w-full text-lg" disabled={loading}>
                {loading ? "שולח..." : "הצטרפו עכשיו ללא עלות 👈"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

// ─── Main Component ───
const VenueOwners = () => {
  return (
    <>
      <HeroSection />
      <WhatIsGiftkalSection />
      <BenefitsSection />
      <GoldQuote text="האולם שלכם לא רק מארח אירועים — הוא מייצר את האירוע הבא" />
      <WhyJoinSection />
      <StationSection />
      <LeadsSection />
      <CRMSection />
      <HowItWorksSection />
      <WhyItWorksSection />
      <PricingSection />
      <TestimonialSection />
      <GoldQuote text="האולם שלכם לא רק מארח אירועים — הוא מייצר את האירוע הבא" />
      <LeadFormSection />
    </>
  );
};

export default VenueOwners;
