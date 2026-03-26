import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Send,
  BarChart3,
  MessageSquareHeart,
  TrendingUp,
  Smartphone,
  Monitor,
  MapPin,
  Zap,
  Target,
  Gift,
  Clock,
  CheckCircle2,
  Star,
  Users,
  ArrowDown,
  Sparkles,
  Heart,
  CalendarCheck,
  Eye,
  ListChecks,
  AlertTriangle,
  PartyPopper,
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

// ─── Hero ───
const Hero = () => (
  <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
    {/* bg */}
    <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar/95 to-primary/20" />
    <div className="absolute inset-0 opacity-10" style={{
      backgroundImage: "radial-gradient(circle at 20% 50%, hsl(var(--primary)/0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--gold)/0.2) 0%, transparent 40%)",
    }} />

    <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
      <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8">
        <PartyPopper className="w-4 h-4 text-primary" />
        <span className="text-primary text-sm font-medium">מערכת ניהול אירועים חכמה</span>
      </div>

      <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
        כך תנהלו את האירוע שלכם
        <br />
        <span className="bg-gradient-to-l from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
          ותקבלו יותר מתנות
        </span>
      </h1>

      <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-4 leading-relaxed">
        מתנות באשראי, הזמנות חכמות וניהול תקציב
        <br />
        הכל במקום אחד — פשוט, מסודר ונוח
      </p>

      <p className="text-white/40 text-sm mb-10">
        מתאים לכל סוגי האירועים • הקמה תוך דקות
      </p>

      <Link to="/signup">
        <Button variant="gold" size="lg" className="text-lg px-10 py-6 shadow-2xl">
          <Sparkles className="w-5 h-5 ml-2" />
          פתחו אירוע עכשיו
        </Button>
      </Link>

      {/* scroll indicator */}
      <div
        className="mt-16 cursor-pointer group flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity"
        onClick={() => document.getElementById("what-you-get")?.scrollIntoView({ behavior: "smooth" })}
      >
        <span className="text-white/60 text-sm">לפירוט המלא גללו למטה</span>
        <div className="relative w-8 h-14 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-[scrollDot_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  </section>
);

// ─── What You Get ───
const WhatYouGet = () => {
  const { ref, inView } = useInView();
  const features = [
    { icon: CreditCard, title: "גביית מתנות באשראי", desc: "קבלו מתנות בצורה נוחה ומאובטחת" },
    { icon: Send, title: "הזמנות ואישורי הגעה", desc: "שליחה מרוכזת ומעקב חכם" },
    { icon: BarChart3, title: "ניהול תקציב מלא", desc: "שליטה על כל ההוצאות בזמן אמת" },
    { icon: MessageSquareHeart, title: "ברכות מהאורחים", desc: "כל הברכות נשמרות לזיכרון" },
    { icon: TrendingUp, title: "מעקב אחרי הכל", desc: "דשבורד חי עם כל המספרים" },
  ];

  return (
    <section id="what-you-get" className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-bold tracking-wider">💡 מה מקבלים</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-4">
            כל מה שצריך לניהול האירוע
            <span className="text-primary"> במקום אחד</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`group bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/40 hover:shadow-xl transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Credit Gifts Section ───
const CreditGifts = () => {
  const { ref, inView } = useInView();
  const points = [
    { icon: CreditCard, text: "תשלום באשראי — בלי מזומן" },
    { icon: MapPin, text: "גם באולם וגם מהבית" },
    { icon: Smartphone, text: "קישור אישי לשליחה לאורחים" },
    { icon: Zap, text: "תהליך מהיר ונוח" },
  ];

  return (
    <section className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <span className="text-primary text-sm font-bold">💰 סקשן מרכזי</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mt-3 mb-4">
              קבלו מתנות בקלות
              <span className="text-primary"> — מכל מקום</span>
            </h2>
            <div className="space-y-4 mb-8">
              {points.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{p.text}</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-l from-primary/10 to-transparent border-r-4 border-primary rounded-lg p-4">
              <p className="text-foreground font-bold">👉 יותר נוחות לאורחים = יותר כסף לכם</p>
            </div>
          </div>

          <div className={`transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-primary to-yellow-400" />
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Gift className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2">מתנה דיגיטלית</h3>
                <p className="text-muted-foreground mb-6">תהליך פשוט ומהיר לאורח</p>
                <div className="space-y-3 text-right">
                  {["בוחר סכום", "מוסיף ברכה אישית", "משלם באשראי", "המתנה נשלחת מיד"].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{i + 1}</div>
                      <span className="text-foreground text-sm font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Kiosk Station ───
const KioskStation = () => {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-sidebar text-white" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`order-2 lg:order-1 transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-40 bg-white/10 rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center gap-2 p-3">
                    <Monitor className="w-8 h-8 text-primary" />
                    <div className="w-full h-1 bg-primary/30 rounded" />
                    <div className="w-3/4 h-1 bg-primary/20 rounded" />
                    <div className="w-1/2 h-1 bg-primary/20 rounded" />
                  </div>
                  <div className="absolute -top-2 -left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">TOUCH</div>
                </div>
              </div>
              <p className="text-center text-white/60 text-sm">עמדת מסך מגע באולם — האורח שולח מתנה תוך שניות</p>
            </div>
          </div>

          <div className={`order-1 lg:order-2 transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-bold">מומלץ • מגדיל מתנות באירוע</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              🏛️ עמדת מתנות באירוע
            </h2>
            <p className="text-white/60 text-lg mb-6">לא רק לינק — גם עמדה פיזית באירוע</p>

            <div className="space-y-4 mb-8">
              {[
                { icon: MapPin, text: "עמדת טאץ' באולם לשליחת מתנות במקום" },
                { icon: CreditCard, text: "מתאים לאורחים שלא שלחו מראש" },
                { icon: Zap, text: "שליחה תוך כמה שניות" },
                { icon: Target, text: "מגדיל משמעותית את כמות המתנות באירוע" },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-white/90 font-medium">{p.text}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-white font-bold text-lg mb-1">💰 רק ₪99 לאירוע</p>
              <p className="text-white/50 text-sm">תוספת קטנה שיכולה להכניס אלפי שקלים נוספים</p>
            </div>

            <div className="mt-6 bg-gradient-to-l from-primary/20 to-transparent border-r-4 border-primary rounded-lg p-4">
              <p className="text-white font-bold">🔥 גם מי שלא הביא מזומן — עדיין שולח מתנה</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Early Gifts ───
const EarlyGifts = () => {
  const { ref, inView } = useInView();
  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="text-primary text-sm font-bold">🚀 כסף עוד לפני האירוע</span>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mt-3 mb-4">
            לא מחכים לאירוע
            <span className="text-primary"> כדי להתחיל לקבל</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-12">
            {[
              { icon: Send, title: "שליחת קישור מראש", desc: "שלחו לאורחים לינק לתשלום לפני האירוע" },
              { icon: Gift, title: "קבלת מתנות מוקדם", desc: "האורחים יכולים לשלוח מתנה כשנוח להם" },
              { icon: Eye, title: "צפייה בזמן אמת", desc: "עקבו אחרי כל סכום שנכנס — בלייב" },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Invitations ───
const Invitations = () => {
  const { ref, inView } = useInView();
  return (
    <section className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <span className="text-primary text-sm font-bold">📩 הזמנות ואישורי הגעה</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mt-3 mb-4">
              שלחו הזמנות ועקבו
              <span className="text-primary"> אחרי הכל במקום אחד</span>
            </h2>
            <div className="space-y-4 mb-8">
              {[
                { icon: Send, text: "שליחה מרוכזת בוואטסאפ ובמייל" },
                { icon: CalendarCheck, text: "מעקב אחרי מי אישר הגעה" },
                { icon: ListChecks, text: "סדר מלא ברשימת האורחים" },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{p.text}</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-l from-primary/10 to-transparent border-r-4 border-primary rounded-lg p-4">
              <p className="text-foreground font-bold">פחות טלפונים — יותר שליטה</p>
            </div>
          </div>

          <div className={`transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
              <div className="space-y-4">
                {["דוד כהן — אישר הגעה ✅", "שרה לוי — ממתין לאישור ⏳", "יוסי אברהם — אישר + 3 ✅", "רחל מזרחי — אישרה הגעה ✅"].map((guest, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground text-sm font-medium">{guest}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Budget ───
const BudgetSection = () => {
  const { ref, inView } = useInView();
  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className={`text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="text-primary text-sm font-bold">📊 ניהול תקציב</span>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mt-3 mb-4">
            שליטה מלאה על
            <span className="text-primary"> ההוצאות שלכם</span>
          </h2>

          <div className="grid sm:grid-cols-3 gap-6 mt-12 mb-8">
            {[
              { icon: ListChecks, title: "ניהול הוצאות", desc: "כל ההוצאות של האירוע במקום אחד" },
              { icon: BarChart3, title: "תכנון מול ביצוע", desc: "השוואה בזמן אמת בין מה שתכננתם לביצוע" },
              { icon: AlertTriangle, title: "התראות חריגה", desc: "מעקב אוטומטי אחרי חריגות בתקציב" },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-foreground font-medium">אתם יודעים בדיוק איפה אתם עומדים — <span className="text-primary font-bold">בכל רגע</span></p>
          <div className="inline-flex items-center gap-2 mt-4 bg-green-500/10 border border-green-500/20 rounded-full px-5 py-2">
            <Gift className="w-4 h-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400 font-bold text-sm">ניתן ללא עלות 🎁</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Blessings ───
const BlessingsSection = () => {
  const { ref, inView } = useInView();
  return (
    <section className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="text-primary text-sm font-bold">💬 ברכות מהאורחים</span>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mt-3 mb-12">
            כל הברכות נשמרות
            <span className="text-primary"> במקום אחד</span>
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "ברכות דיגיטליות", desc: "הודעות אישיות מכל אורח" },
              { icon: Smartphone, title: "צפייה מכל מכשיר", desc: "נגישות מלאה מהנייד" },
              { icon: Star, title: "זיכרון לכל החיים", desc: "כל הברכות שמורות לתמיד" },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── How It Works ───
const HowItWorks = () => {
  const { ref, inView } = useInView();
  const steps = [
    { num: "1", title: "פותחים אירוע", icon: PartyPopper },
    { num: "2", title: "מקבלים קישור אישי", icon: Send },
    { num: "3", title: "שולחים לאורחים", icon: Users },
    { num: "4", title: "מקבלים מתנות וברכות", icon: Gift },
    { num: "5", title: "עוקבים אחרי הכל בלייב", icon: Eye },
  ];

  return (
    <section className="py-24 bg-sidebar text-white" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-bold">🎬 איך זה עובד</span>
          <h2 className="text-3xl md:text-4xl font-black mt-3">
            חמישה צעדים — ו<span className="text-primary">האירוע שלכם מוכן</span>
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative bg-white/5 border border-white/10 rounded-2xl p-6 w-44 text-center transition-all duration-500 hover:bg-white/10 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 text-primary font-black text-lg">
                {step.num}
              </div>
              <step.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-white/90 text-sm font-medium">{step.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Gold Quote (reusable) ───
const GoldQuote = ({ className = "" }: { className?: string }) => (
  <section className={`py-16 bg-gradient-to-l from-primary/5 via-background to-primary/5 ${className}`}>
    <div className="container mx-auto px-4 text-center">
      <p className="text-2xl md:text-3xl font-black text-foreground max-w-3xl mx-auto leading-relaxed">
        🎯 האירוע שלכם לא צריך להיות בלחץ —
        <span className="text-primary"> הוא צריך להיות בשליטה</span>
      </p>
    </div>
  </section>
);

// ─── Pricing ───
const Pricing = () => {
  const { ref, inView } = useInView();
  const plans = [
    {
      title: "מתנות באשראי",
      icon: CreditCard,
      price: "₪199",
      period: "לכל האירוע",
      features: ["גביית מתנות מאורחים", "קישור אישי לשיתוף", "דשבורד מעקב בזמן אמת", "ברכות דיגיטליות"],
      popular: false,
    },
    {
      title: "עמדת מתנות באולם",
      icon: Monitor,
      price: "₪99",
      period: "חד פעמי",
      features: ["עמדת טאץ' באולם", "מגדיל מתנות באירוע", "מתאים למי שלא שלח מראש", "התקנה מהירה"],
      popular: true,
      badge: "הכי פופולרי",
    },
    {
      title: "הזמנות + אישורי הגעה",
      icon: Send,
      price: "₪199",
      period: "חד פעמי",
      features: ["שליחה בוואטסאפ ומייל", "מעקב אישורי הגעה", "ניהול רשימת אורחים", "תזכורות אוטומטיות"],
      popular: false,
    },
    {
      title: "ניהול תקציב",
      icon: BarChart3,
      price: "חינם",
      period: "",
      features: ["ניהול הוצאות מלא", "השוואת תכנון לביצוע", "התראות חריגה", "גרפים ודוחות"],
      popular: false,
      free: true,
    },
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-bold">💰 מחירים</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mt-3">
            בחרו מה
            <span className="text-primary"> מתאים לכם</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative bg-card border rounded-2xl p-6 text-center transition-all duration-500 hover:shadow-xl ${plan.popular ? "border-primary shadow-lg scale-105" : "border-border"} ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              {plan.free && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  🎁 חינם
                </div>
              )}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <plan.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-3">{plan.title}</h3>
              <div className="mb-1">
                <span className="text-3xl font-black text-foreground">{plan.price}</span>
              </div>
              {plan.period && <p className="text-muted-foreground text-sm mb-6">{plan.period}</p>}
              {!plan.period && <div className="mb-6" />}
              <ul className="space-y-2 text-right">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-foreground font-medium">משלמים רק על מה שצריך — <span className="text-primary font-bold">ומתחילים להרוויח מהאירוע</span></p>
          <p className="text-muted-foreground text-sm mt-2">💡 מספיק תוספת של מתנה אחת–שתיים כדי להחזיר את העלות</p>
        </div>
      </div>
    </section>
  );
};

// ─── Testimonial ───
const Testimonial = () => {
  const { ref, inView } = useInView();
  return (
    <section className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <div className={`transition-all duration-700 ${inView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-primary fill-primary" />
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed mb-8">
            "ראינו בדיוק כמה נכנס בכל רגע, והאורחים פשוט אהבו את הנוחות.
            <br />
            <span className="text-primary font-bold">זה שדרג לנו את כל האירוע</span>"
          </blockquote>
          <p className="text-muted-foreground">— זוג שהשתמש במערכת</p>
        </div>
      </div>
    </section>
  );
};

// ─── Final CTA ───
const FinalCTA = () => (
  <section className="py-24 bg-gradient-to-br from-sidebar via-sidebar/95 to-primary/20 text-white">
    <div className="container mx-auto px-4 text-center max-w-3xl">
      <h2 className="text-3xl md:text-5xl font-black mb-4">
        רוצים אירוע מסודר יותר
        <br />
        <span className="text-primary">ורווחי יותר?</span>
      </h2>
      <p className="text-white/60 text-lg mb-10">
        פתחו אירוע עכשיו תוך פחות מדקה
      </p>
      <Link to="/signup">
        <Button variant="gold" size="lg" className="text-lg px-10 py-6 shadow-2xl">
          <Sparkles className="w-5 h-5 ml-2" />
          התחילו עכשיו
        </Button>
      </Link>
    </div>
  </section>
);

// ─── Kiosk Gold Quote ───
const KioskGoldQuote = () => (
  <section className="py-12 bg-sidebar">
    <div className="container mx-auto px-4 text-center">
      <p className="text-xl md:text-2xl font-black text-white max-w-3xl mx-auto">
        🔥 האירוע עצמו הוא הרגע שבו נכנסות הכי הרבה מתנות —
        <span className="text-primary"> אל תפספסו אותו</span>
      </p>
    </div>
  </section>
);

// ─── Page ───
const EventOwnersPage = () => {
  return (
    <>
      <Hero />
      <WhatYouGet />
      <CreditGifts />
      <KioskStation />
      <KioskGoldQuote />
      <EarlyGifts />
      <GoldQuote />
      <Invitations />
      <BudgetSection />
      <BlessingsSection />
      <HowItWorks />
      <Pricing />
      <Testimonial />
      <GoldQuote className="!bg-muted/20" />
      <FinalCTA />
    </>
  );
};

export default EventOwnersPage;
