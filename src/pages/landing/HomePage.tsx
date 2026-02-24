import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Gift,
  CreditCard,
  Smartphone,
  BarChart3,
  Heart,
  Users,
  Building2,
  PartyPopper,
  Phone,
  Mail,
  MessageCircle,
  Sparkles,
  ArrowDown,
  CheckCircle2,
  Shield,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Send,
  Star,
  X,
  Check,
  AlertTriangle,
  Wallet,
  HandCoins,
  Search,
  UserPlus,
  LogIn,
} from "lucide-react";
import logo from "@/assets/logo.png";
import laptopMockup from "@/assets/mockups/laptop-dashboard-mockup.png";
import mobileMockup from "@/assets/mockups/mobile-gift-screen.png";
import dashboardScreenshot from "@/assets/mockups/dashboard-screenshot.png";
import mobileGiftSending from "@/assets/mockups/mobile-gift-sending.png";
import analyticsScreenshot from "@/assets/mockups/analytics-screenshot.png";

// ─── Hooks ───
const useCounter = (end: number, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
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
      setCount(Math.floor(p * (end - start) + start));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, start, duration]);

  return { count, ref };
};

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

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

// ─── Navbar ───
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "bg-sidebar/95 backdrop-blur-xl shadow-2xl py-2" : "bg-transparent py-4"
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <img src={logo} alt="Giftkal" className="h-10 md:h-12" />

        <div className="hidden md:flex items-center gap-6">
          {[
            { label: "בית", id: "hero" },
            { label: "איך זה עובד", id: "solution" },
            { label: "עמדות באולמות", id: "stations" },
            { label: "למה Giftkal", id: "why-guests" },
            { label: "המלצות", id: "testimonials" },
          ].map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)} className="text-white/70 hover:text-primary transition-colors text-sm font-medium">
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => scrollTo("access")} variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:inline-flex">
            <LogIn className="w-4 h-4 ml-2" />
            כניסה למערכת
          </Button>
          <Button onClick={() => scrollTo("lead-form")} className="bg-gradient-gold text-white shadow-gold hover:shadow-lg transition-all hover:scale-105">
            פתחו אירוע עכשיו
          </Button>
          {/* Mobile hamburger */}
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : (
              <div className="space-y-1.5">
                <span className="block w-6 h-0.5 bg-white" />
                <span className="block w-6 h-0.5 bg-white" />
                <span className="block w-6 h-0.5 bg-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-sidebar/98 backdrop-blur-xl border-t border-white/10 animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {["hero:בית", "solution:איך זה עובד", "stations:עמדות באולמות", "why-guests:למה Giftkal", "lead-form:צור קשר"].map(s => {
              const [id, label] = s.split(":");
              return (
                <button key={id} onClick={() => { scrollTo(id); setMenuOpen(false); }} className="block w-full text-right text-white/80 hover:text-primary py-2 text-sm">
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

// ─── Hero Section ───
const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-sidebar" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,_hsl(38_92%_50%_/_0.14),_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_85%_20%,_hsl(38_92%_50%_/_0.08),_transparent_60%)]" />

      {/* Floating decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Heart className="absolute top-[18%] right-[15%] w-6 h-6 text-primary/20 animate-bounce" style={{ animationDuration: "3s" }} />
        <Gift className="absolute top-[30%] left-[8%] w-7 h-7 text-primary/15 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }} />
        <Sparkles className="absolute bottom-[35%] right-[25%] w-5 h-5 text-primary/20 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }} />
        <CreditCard className="absolute top-[55%] left-[15%] w-5 h-5 text-primary/15 animate-bounce" style={{ animationDuration: "4.5s", animationDelay: "2s" }} />
        <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-primary/30 rounded-full animate-pulse" />
        <div className="absolute bottom-[40%] right-[10%] w-3 h-3 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="text-right order-2 lg:order-1">
            <div className="inline-block bg-primary/15 backdrop-blur-sm rounded-full px-5 py-2 mb-6 animate-fade-in">
              <span className="text-primary text-sm font-medium">✨ הדרך החכמה לקבל מתנות באירועים</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.15] animate-slide-up">
              המתנות של 2026
              <br />
              כבר לא נכנסות
              <br />
              <span className="text-gradient-gold">למעטפה.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/65 max-w-lg mb-4 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Giftkal מאפשרת לאורחים לשלוח מתנה באשראי בלחיצה אחת —
              <br />
              והכסף נכנס ישירות לחשבון שלכם.
            </p>
            <p className="text-primary/80 font-medium mb-10 animate-slide-up" style={{ animationDelay: "0.15s" }}>
              דיגיטלית. מאובטחת. מסודרת.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button
                onClick={() => scrollTo("lead-form")}
                size="xl"
                className="bg-gradient-gold text-white text-lg shadow-gold hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Gift className="w-5 h-5 ml-2" />
                פתחו אירוע עכשיו
              </Button>
              <Button
                onClick={() => scrollTo("solution")}
                variant="outline"
                size="xl"
                className="border-white/25 text-white hover:bg-white/10 hover:text-white text-lg backdrop-blur-sm"
              >
                <ArrowDown className="w-5 h-5 ml-2" />
                איך זה עובד?
              </Button>
            </div>
          </div>

          {/* Mockup */}
          <div className="relative order-1 lg:order-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 bg-primary/15 blur-[80px] scale-125 rounded-full" />
            <div className="relative">
              <img src={laptopMockup} alt="מערכת Giftkal" className="w-full max-w-2xl mx-auto drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700" />
              <div className="absolute -bottom-6 -left-4 md:left-4 w-32 md:w-40" style={{ animation: "float 5s ease-in-out infinite" }}>
                <img src={mobileMockup} alt="מסך מתנות" className="w-full drop-shadow-2xl rounded-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-auto" preserveAspectRatio="none">
          <path fill="hsl(220 20% 97%)" d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" />
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </section>
  );
};

// ─── Pain Section ───
const PainSection = () => {
  const { ref, inView } = useInView();

  const pains = [
    { icon: AlertTriangle, text: "מעטפות הולכות לאיבוד" },
    { icon: X, text: "צ׳קים חוזרים" },
    { icon: Wallet, text: "צריך לספור מזומן בלילה של החתונה" },
    { icon: Users, text: "ולרדוף אחרי מי שלא הביא" },
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-secondary text-center mb-4 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            בואו נדבר רגע <span className="text-gradient-gold">בכנות.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-12">
            {pains.map((pain, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 bg-destructive/5 border border-destructive/15 rounded-2xl p-6 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <pain.icon className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-secondary font-medium text-lg">{pain.text}</p>
              </div>
            ))}
          </div>

          <div className={`text-center mt-12 transition-all duration-700 delay-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="text-2xl text-muted-foreground mb-2">זה לא אמור להיראות ככה.</p>
            <p className="text-3xl font-bold text-gradient-gold">Giftkal משנה את זה.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Solution Section ───
const SolutionSection = () => {
  const { ref, inView } = useInView();

  const steps = [
    { icon: Smartphone, title: "מקימים אירוע", desc: "פותחים חשבון בקלות ומגדירים את פרטי האירוע" },
    { icon: Send, title: "שולחים קישור", desc: "האורחים מקבלים קישור אישי לשליחת מתנות" },
    { icon: Banknote, title: "מקבלים מתנות", desc: "הכסף נכנס ישירות לחשבון הבנק שלכם" },
  ];

  const benefits = [
    "האורחים מקבלים קישור אישי",
    "בוחרים סכום וברכה",
    "משלמים באשראי (גם בתשלומים)",
    "הכסף נכנס אליכם ישירות",
  ];

  return (
    <section id="solution" className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            מקימים אירוע. שולחים קישור.
            <br />
            <span className="text-gradient-gold">מקבלים מתנות.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 -left-4 w-8 h-[2px] bg-gradient-to-l from-primary/60 to-primary/20" />
              )}
              <div className="bg-card rounded-3xl p-10 shadow-lg border border-border/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-gold rounded-2xl rotate-3 group-hover:rotate-6 transition-transform duration-300" />
                  <div className="relative w-full h-full bg-gradient-gold rounded-2xl flex items-center justify-center shadow-gold">
                    <step.icon className="w-9 h-9 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-sidebar text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-secondary mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard screenshot showcase */}
        <div className={`max-w-5xl mx-auto mb-16 transition-all duration-700 delay-300 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-[40px] scale-105 rounded-3xl" />
            <div className="relative bg-sidebar rounded-3xl p-4 shadow-2xl overflow-hidden">
              <img src={dashboardScreenshot} alt="דשבורד ניהול מתנות - Giftkal" className="w-full rounded-2xl" />
            </div>
          </div>
          <p className="text-center text-muted-foreground text-sm mt-4">דשבורד ניהול מתנות ואירועים — שליטה מלאה בלחיצה</p>
        </div>

        {/* Benefits list */}
        <div className={`max-w-2xl mx-auto bg-card rounded-3xl p-8 shadow-lg border border-border/50 transition-all duration-700 delay-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-secondary font-medium">{b}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-border/50 text-center space-y-1">
            <p className="text-muted-foreground">בלי עמלות נסתרות. בלי בירוקרטיה. בלי אי נעימויות.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Venue Stations Section ───
const StationsSection = () => {
  const { ref, inView } = useInView();

  const features = [
    { icon: CreditCard, title: "תשלום באשראי במקום", desc: "האורחים משלמים בנוחות בעמדה פיזית" },
    { icon: Smartphone, title: "שליחה מהירה בלי תור", desc: "חוויה דיגיטלית מהירה וחלקה" },
    { icon: BarChart3, title: "הכל מתועד במערכת", desc: "מעקב בזמן אמת על כל התשלומים" },
  ];

  return (
    <section id="stations" className="py-24 bg-sidebar relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(38_92%_50%_/_0.08),_transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Text */}
          <div className={`text-right transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            <div className="inline-block bg-primary/15 backdrop-blur-sm rounded-full px-5 py-2 mb-6">
              <span className="text-primary text-sm font-medium">🏛️ עמדות פיזיות באולמות</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              יש לנו גם עמדות פיזיות
              <br />
              <span className="text-gradient-gold">בתוך האולמות.</span>
            </h2>

            <p className="text-white/65 text-lg mb-8 leading-relaxed">
              לא כל האורחים רוצים לשלוח מראש?
              <br />
              באולם עצמו מחכות עמדות Giftkal:
            </p>

            <div className="space-y-5">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{f.title}</h4>
                    <p className="text-white/55 text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-primary/80 font-medium mt-8 text-lg">חוויה חלקה. מכובדת. מודרנית.</p>
          </div>

          {/* Visual */}
          <div className={`relative transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <div className="absolute inset-0 bg-primary/10 blur-[60px] scale-110 rounded-full" />
            <div className="relative bg-sidebar-accent rounded-3xl p-6 shadow-2xl overflow-hidden border border-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_50%_/_0.1),_transparent_70%)]" />
              <img 
                src={mobileGiftSending} 
                alt="עמדת Giftkal - מסך שליחת מתנה" 
                className="relative w-full rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Nedarim Plus Section ───
const NedarimSection = () => {
  const { ref, inView } = useInView();

  return (
    <section className="py-20 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className={`max-w-4xl mx-auto bg-card rounded-3xl p-10 md:p-14 shadow-xl border border-border/50 text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-block bg-primary/10 rounded-full px-5 py-2 mb-6">
            <span className="text-primary font-medium text-sm">💳 נדרים פלוס</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
            גם דרך <span className="text-gradient-gold">נדרים פלוס</span>
          </h2>

          <p className="text-muted-foreground text-lg mb-6 max-w-xl mx-auto leading-relaxed">
            לאורחים שמעדיפים —
            <br />
            ניתן לשלם גם דרך נדרים פלוס בצורה מסודרת ומאובטחת.
          </p>

          <div className="bg-accent/50 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-accent-foreground font-medium text-lg">
              אתם מקבלים פתרון רחב שמכסה את כולם.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Why Guests Love It ───
const WhyGuestsSection = () => {
  const { ref, inView } = useInView();

  const reasons = [
    "אפשר לשלם בתשלומים",
    "לא צריך לחפש כספומט",
    "לא צריך מעטפה",
    "לא צריך להגיע לאירוע כדי לפרגן",
    "שליחה גם לפני וגם אחרי האירוע",
  ];

  return (
    <section id="why-guests" className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
          {/* Guests */}
          <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-block bg-primary/10 rounded-full px-5 py-2 mb-6">
              <span className="text-primary font-medium text-sm">🔥 למה האורחים אוהבים את זה?</span>
            </div>

            <div className="space-y-4">
              {reasons.map((r, i) => (
                <div key={i} className="flex items-center gap-4 bg-card rounded-2xl p-5 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-secondary font-medium text-lg">{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Couples */}
          <div className={`transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-block bg-primary/10 rounded-full px-5 py-2 mb-6">
              <span className="text-primary font-medium text-sm">🏦 למה הזוגות אוהבים את זה?</span>
            </div>

            <div className="space-y-4">
              {[
                "הכסף נכנס ישירות לחשבון",
                "דוחות מסודרים",
                "מעקב מלא",
                "בלי ספירה בלילה",
                "בלי טעויות",
                "בלי לרדוף אחרי צ׳קים",
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-4 bg-card rounded-2xl p-5 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-secondary font-medium text-lg">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics screenshot */}
        <div className={`max-w-5xl mx-auto mt-16 transition-all duration-700 delay-400 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-[40px] scale-105 rounded-3xl" />
            <div className="relative bg-sidebar rounded-3xl p-4 shadow-2xl overflow-hidden">
              <img src={analyticsScreenshot} alt="ניתוח נתונים ודוחות - Giftkal" className="w-full rounded-2xl" />
            </div>
          </div>
          <p className="text-center text-muted-foreground text-sm mt-4">מעקב מלא על כל מתנה, אורח ותשלום — הכל במקום אחד</p>
        </div>
      </div>
    </section>
  );
};

// ─── Economic Trigger ───
const EconomicSection = () => {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-sidebar relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(38_92%_50%_/_0.1),_transparent_60%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            תכלס?
            <br />
            <span className="text-gradient-gold">באשראי מפרגנים יותר.</span>
          </h2>

          <p className="text-xl text-white/65 mb-8 leading-relaxed max-w-xl mx-auto">
            כשנותנים באשראי —
            <br />
            הסכום הממוצע גבוה יותר.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
            {[
              { label: "יותר נוח", icon: HandCoins },
              { label: "יותר מכובד", icon: Heart },
              { label: "יותר משתלם", icon: TrendingUp },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-white/80 font-medium text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Comparison Table ───
const ComparisonSection = () => {
  const { ref, inView } = useInView();

  const rows = [
    { envelope: "מזומן הולך לאיבוד", giftkal: "כסף נכנס ישירות לבנק" },
    { envelope: "צריך לספור", giftkal: "דוחות מסודרים" },
    { envelope: "אי נעימות", giftkal: "הכל דיגיטלי" },
    { envelope: "רק באירוע", giftkal: "גם לפני ואחרי" },
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            מעטפות <span className="text-muted-foreground">vs</span> <span className="text-gradient-gold">Giftkal</span>
          </h2>
        </div>

        <div className={`max-w-3xl mx-auto overflow-hidden rounded-3xl shadow-xl border border-border/50 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Header */}
          <div className="grid grid-cols-2">
            <div className="bg-muted/80 p-5 text-center border-l border-border/50">
              <p className="text-muted-foreground font-bold text-lg">מעטפות 😞</p>
            </div>
            <div className="bg-gradient-gold p-5 text-center">
              <p className="text-white font-bold text-lg">Giftkal ✨</p>
            </div>
          </div>
          {/* Rows */}
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-2 border-t border-border/30">
              <div className="p-5 text-center bg-card border-l border-border/50 flex items-center justify-center gap-2">
                <X className="w-5 h-5 text-destructive flex-shrink-0" />
                <span className="text-muted-foreground">{row.envelope}</span>
              </div>
              <div className="p-5 text-center bg-accent/30 flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-secondary font-medium">{row.giftkal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Social Proof Stats ───
const SocialProofSection = () => {
  const eventsCounter = useCounter(1000, 2000);
  const guestsCounter = useCounter(50000, 2000);

  return (
    <section className="py-20 bg-sidebar relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(38_92%_50%_/_0.1),_transparent_60%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div ref={eventsCounter.ref}>
            <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-2">+{eventsCounter.count.toLocaleString()}</div>
            <p className="text-white/60 text-lg">אירועים מוצלחים</p>
          </div>
          <div ref={guestsCounter.ref}>
            <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-2">+{guestsCounter.count.toLocaleString()}</div>
            <p className="text-white/60 text-lg">אורחים מרוצים</p>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-2">₪M+</div>
            <p className="text-white/60 text-lg">מיליוני שקלים דרך המערכת</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Testimonials ───
const TestimonialsSection = () => {
  const [active, setActive] = useState(0);
  const { ref, inView } = useInView();

  const testimonials = [
    { text: "איזה פתרון מדהים! הכנסנו מתנה תוך שנייה, לגמרי העתיד של המתנות בחתונות.", name: "יעל ואלעד", event: "חתונה, 2024" },
    { text: "עכשיו אני פחות מחשבן אם לבוא לחתונות. פיצלתי ל-3 תשלומים ולא נחנקתי בסוף החודש.", name: "יוסף חיים שטרית", event: "אורח" },
    { text: "היה לנו פשוט וקל. שלחנו מתנה וזהו, בלי יותר מדי מחשבה. מומלץ בחום!", name: "משפחת כהן", event: "אורחים, חתונה 2024" },
    { text: "הכול היה פשוט וזורם. לא היינו צריכים להתארגן מראש או לחשוב על מזומן.", name: "נועה ותומר", event: "חתונה, 2025" },
    { text: "המערכת פשוט עובדת! קיבלנו את כל המתנות ישירות לחשבון, בלי כאב ראש.", name: "ישראל ושרה", event: "חתונה, 2024" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActive(prev => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section id="testimonials" className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            מה אומרים על <span className="text-gradient-gold">Giftkal</span>
          </h2>
        </div>

        <div className={`max-w-4xl mx-auto transition-all duration-700 ${inView ? "opacity-100" : "opacity-0"}`}>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(${active * 100}%)` }}>
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-4">
                    <div className="bg-card rounded-3xl p-10 md:p-14 shadow-xl border border-border/50 text-center relative">
                      <div className="absolute -top-4 right-10 text-7xl text-primary/15 font-serif">"</div>
                      <div className="flex justify-center gap-1 mb-6">
                        {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 text-primary fill-primary" />)}
                      </div>
                      <p className="text-xl md:text-2xl text-secondary mb-8 leading-relaxed font-medium">{t.text}</p>
                      <p className="font-bold text-secondary text-lg">{t.name}</p>
                      <p className="text-primary text-sm">{t.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setActive(prev => (prev + 1) % testimonials.length)} className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6 w-12 h-12 rounded-full bg-card shadow-lg border border-border/50 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setActive(prev => (prev - 1 + testimonials.length) % testimonials.length)} className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6 w-12 h-12 rounded-full bg-card shadow-lg border border-border/50 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className={`w-3 h-3 rounded-full transition-all duration-300 ${i === active ? "bg-primary w-8" : "bg-border hover:bg-primary/30"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Audience-Specific Messaging ───
const AudienceSection = () => {
  const { ref, inView } = useInView();

  const audiences = [
    {
      icon: Users,
      title: "לזוגות",
      subtitle: "רגשי + שקט נפשי",
      items: ["חתונות ואירוסין", "ימי הולדת ומסיבות", "קבלת כסף בלי עמלות", "דוחות מסודרים"],
      color: "from-pink-500/20 to-primary/10",
    },
    {
      icon: Building2,
      title: "לבעלי אולמות",
      subtitle: "שליטה + סדר + יתרון תחרותי",
      items: ["עמדות פיזיות באולם", "דשבורד ניהול מתקדם", "דוחות ועמלות שקופות", "יתרון תחרותי על אולמות אחרים"],
      color: "from-blue-500/20 to-primary/10",
    },
    {
      icon: PartyPopper,
      title: "למארגני אירועים",
      subtitle: "מערכת מקצועית + דוחות + שקיפות",
      items: ["Bar/Bat Mitzvah", "אירועי חברה", "שקיפות מלאה ללקוחות", "מערכת ניהול מקצועית"],
      color: "from-amber-500/20 to-primary/10",
    },
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            למי זה <span className="text-gradient-gold">מתאים?</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {audiences.map((a, index) => (
            <div
              key={index}
              className={`group bg-card rounded-3xl p-8 shadow-lg border border-border/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <a.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-2">{a.title}</h3>
              <p className="text-primary text-sm font-medium mb-5">{a.subtitle}</p>
              <ul className="space-y-3">
                {a.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Aggressive CTA ───
const AggressiveCTA = () => {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-gold" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.15),_transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            עומדים להתחתן?
          </h2>
          <p className="text-2xl text-white/85 mb-4 font-medium">
            אל תנהלו מעטפות.
          </p>
          <p className="text-3xl text-white font-bold mb-10">
            תנהלו מערכת.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => scrollTo("lead-form")}
              size="xl"
              className="bg-sidebar text-white text-lg shadow-2xl hover:bg-sidebar/90 transition-all hover:scale-105"
            >
              <Gift className="w-5 h-5 ml-2" />
              פתחו אירוע עכשיו
            </Button>
            <Button
              onClick={() => scrollTo("lead-form")}
              size="xl"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/20 hover:text-white text-lg backdrop-blur-sm"
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              דברו עם נציג
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Lead Form Section ───
const LeadFormSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", phone: "", email: "", leadType: "couple" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      toast({ title: "שגיאה", description: "אנא מלא את השדות החובה", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        lead_type: formData.leadType,
        venue_name: null,
        venue_address: null,
        status: "new",
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast({ title: "תודה רבה!", description: "קיבלנו את הפרטים שלך ונחזור אליך בהקדם" });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({ title: "שגיאה", description: "אירעה שגיאה בשליחת הטופס. אנא נסה שוב.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="lead-form" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-card rounded-3xl p-12 shadow-xl border border-border/50 animate-scale-in">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-secondary mb-4">תודה רבה!</h3>
              <p className="text-muted-foreground mb-8 text-lg">קיבלנו את הפרטים שלך ונחזור אליך בהקדם</p>
              <Button onClick={() => setIsSubmitted(false)} variant="outline" size="lg">שלח פרטים נוספים</Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="lead-form" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div className="text-right">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-6">
              רוצים להבין איך זה עובד
              <br />
              <span className="text-gradient-gold">אצלכם באירוע?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              השאירו פרטים ונחזור אליכם עם:
            </p>

            <div className="space-y-4">
              {[
                "הסבר קצר וממוקד",
                "הדגמה חיה של המערכת",
                "התאמה לאולם / סוג האירוע שלכם",
                "בדיקה לגבי עמדות פיזיות במקום",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-secondary font-medium">{text}</span>
                </div>
              ))}
            </div>

            <p className="text-primary font-medium mt-8 text-lg">ייעוץ חינם. ללא התחייבות.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-8 shadow-xl border border-border/50">
            <div className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-secondary font-medium mb-2 block">שם מלא *</Label>
                <Input id="fullName" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="הכנס את שמך המלא" className="h-12 text-base" required />
              </div>
              <div>
                <Label htmlFor="phone" className="text-secondary font-medium mb-2 block">טלפון *</Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="050-0000000" className="h-12 text-base" required />
              </div>
              <div>
                <Label htmlFor="email" className="text-secondary font-medium mb-2 block">אימייל</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="your@email.com" className="h-12 text-base" />
              </div>
              <div>
                <Label className="text-secondary font-medium mb-3 block">סוג לקוח</Label>
                <RadioGroup value={formData.leadType} onValueChange={value => setFormData({ ...formData, leadType: value })} className="grid grid-cols-2 gap-3">
                  {[
                    { value: "couple", label: "זוג מתחתן" },
                    { value: "venue", label: "בעל אולם" },
                    { value: "organizer", label: "מארגן אירועים" },
                    { value: "other", label: "אחר" },
                  ].map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2 space-x-reverse bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="cursor-pointer text-sm">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg bg-gradient-gold text-white shadow-gold hover:shadow-lg transition-all">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    שולח...
                  </span>
                ) : (
                  <>
                    <Gift className="w-5 h-5 ml-2" />
                    שלח פרטים
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

// ─── Access Section (Navigation Cards) ───
const AccessSection = () => {
  const { ref, inView } = useInView();

  const panels = [
    { icon: PartyPopper, label: "בעלי אירועים", desc: "יש לכם אירוע? נכנסים כאן 🎉", href: "/login/event", color: "from-pink-500/20 to-primary/10" },
    { icon: Building2, label: "בעלי אולמות", desc: "מנהלים אולם? כאן הכניסה 🏛️", href: "/login/venue", color: "from-blue-500/20 to-primary/10" },
    { icon: Gift, label: "רוצים להעביר מתנה?", desc: "חפשו את האירוע ושלחו מתנה 🎁", href: "/gift-search", color: "from-amber-500/20 to-primary/10" },
    { icon: UserPlus, label: "רוצים להצטרף?", desc: "פתחו אירוע חדש ב-Giftkal ✨", href: "/signup", color: "from-green-500/20 to-primary/10" },
  ];

  return (
    <section id="access" className="py-24 bg-sidebar relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,_hsl(38_92%_50%_/_0.1),_transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            ברוכים הבאים ל-<span className="text-gradient-gold">Giftkal</span>
          </h2>
          <p className="text-white/60 text-lg">בחרו את הכניסה המתאימה לכם</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {panels.map((p, i) => (
            <Link
              key={i}
              to={p.href}
              className={`group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center hover:bg-white/10 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <p.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{p.label}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Footer ───
const Footer = () => {
  return (
    <footer className="bg-sidebar py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <img src={logo} alt="Giftkal" className="h-14 mb-6" />
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              Giftkal - הפלטפורמה המובילה לגביית מתנות דיגיטליות באירועים.
              מערכת פשוטה, מאובטחת ואלגנטית.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">קישורים</h4>
            <ul className="space-y-3">
              <li><button onClick={() => scrollTo("access")} className="text-white/60 hover:text-primary transition-colors text-sm">כניסה למערכת</button></li>
              <li><a href="#lead-form" className="text-white/60 hover:text-primary transition-colors text-sm">צור קשר</a></li>
              <li><a href="#why-guests" className="text-white/60 hover:text-primary transition-colors text-sm">למה Giftkal</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">יצירת קשר</h4>
            <ul className="space-y-4">
              <li>
                <a href="tel:+972500000000" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                  050-000-0000
                </a>
              </li>
              <li>
                <a href="mailto:info@giftkal.com" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Mail className="w-4 h-4" /></div>
                  info@giftkal.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/972500000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-4 h-4" /></div>
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/40 text-sm">© {new Date().getFullYear()} Giftkal. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
};

// ─── Main Component ───
const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <PainSection />
      <SolutionSection />
      <StationsSection />
      <NedarimSection />
      <WhyGuestsSection />
      <EconomicSection />
      <ComparisonSection />
      <SocialProofSection />
      <TestimonialsSection />
      <AudienceSection />
      <AggressiveCTA />
      <AccessSection />
      <LeadFormSection />
      <Footer />
    </div>
  );
};

export default HomePage;
