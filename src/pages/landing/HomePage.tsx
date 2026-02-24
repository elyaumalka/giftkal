import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
  Shield,
  Zap,
  Clock,
  Send,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Users,
  Phone,
  Mail,
  MessageCircle,
  Eye,
  Banknote,
  Monitor,
  ArrowLeft,
  FileText,
  HeartHandshake,
  X,
  Check,
} from "lucide-react";
import logo from "@/assets/logo.png";
import mobileMockup from "@/assets/mockups/mobile-gift-screen.png";

// ── Hooks ──
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

const useInView = (threshold = 0.2) => {
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

// ── Color constants (used inline for this premium dark theme) ──
const C = {
  bg: "#0D1B2A",
  bgDark: "#0A1623",
  gold: "#C6A85A",
  goldHover: "#E5C97A",
  white: "#F8F9FA",
  muted: "#B8C1CC",
  cardBg: "rgba(13, 27, 42, 0.7)",
  cardBorder: "rgba(198, 168, 90, 0.15)",
  cardBorderHover: "rgba(198, 168, 90, 0.4)",
  goldGlow: "rgba(198, 168, 90, 0.08)",
  goldGlowStrong: "rgba(198, 168, 90, 0.15)",
};

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔹 NAVBAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { label: "בית", id: "hero" },
    { label: "איך זה עובד", id: "how-it-works" },
    { label: "יתרונות", id: "benefits" },
    { label: "המלצות", id: "testimonials" },
    { label: "צור קשר", id: "lead-form" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(10, 22, 35, 0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
        padding: scrolled ? "12px 0" : "20px 0",
      }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <img src={logo} alt="Giftkal" className="h-10 md:h-12" />

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="text-sm font-heebo font-medium transition-colors duration-300"
              style={{ color: C.muted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex font-heebo" style={{ color: C.muted }}>
            <Link to="/login">התחברות</Link>
          </Button>
          <button
            onClick={() => scrollTo("lead-form")}
            className="px-6 py-2.5 rounded-xl font-heebo font-medium text-sm transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
              color: C.bg,
              boxShadow: `0 4px 20px ${C.goldGlowStrong}`,
            }}
          >
            התחילו עכשיו
          </button>
          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: C.white }}>
            {mobileOpen ? <X className="w-6 h-6" /> : (
              <div className="space-y-1.5">
                <div className="w-6 h-0.5" style={{ background: C.white }} />
                <div className="w-6 h-0.5" style={{ background: C.white }} />
                <div className="w-6 h-0.5" style={{ background: C.white }} />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden mt-4 px-4 pb-4 space-y-3" style={{ background: C.bgDark }}>
          {links.map((l) => (
            <button key={l.id} onClick={() => { scrollTo(l.id); setMobileOpen(false); }} className="block w-full text-right py-2 font-heebo" style={{ color: C.muted }}>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1️⃣ HERO SECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden" style={{ background: C.bg }}>
      {/* Animated radial gold glow */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${C.goldGlowStrong}, transparent 70%)` }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 40% 50% at 80% 20%, ${C.goldGlow}, transparent 60%)` }} />
      {/* Subtle animated gold particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full animate-pulse" style={{
            width: `${3 + i * 2}px`, height: `${3 + i * 2}px`,
            background: C.gold, opacity: 0.15 + i * 0.03,
            top: `${15 + i * 13}%`, right: `${8 + i * 14}%`,
            animationDelay: `${i * 0.5}s`, animationDuration: `${3 + i}s`,
          }} />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-right order-2 lg:order-1">
            <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.15] animate-slide-up" style={{ color: C.white }}>
              המתנות של 2026
              <br />
              כבר לא נכנסות
              <br />
              <span style={{ color: C.gold }}>למעטפה.</span>
            </h1>

            <p className="font-heebo text-lg md:text-xl mb-4 leading-relaxed animate-slide-up" style={{ color: C.muted, animationDelay: "0.15s" }}>
              Giftkal מאפשרת לאורחים לשלוח מתנה באשראי בלחיצה אחת —
              <br />
              והכסף נכנס ישירות לחשבון שלכם.
            </p>
            <p className="font-heebo text-base mb-10 animate-slide-up" style={{ color: C.gold, animationDelay: "0.2s" }}>
              דיגיטלית. מאובטחת. מסודרת.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.25s" }}>
              <button
                onClick={() => scrollTo("lead-form")}
                className="px-8 py-4 rounded-2xl font-heebo font-semibold text-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
                  color: C.bg,
                  boxShadow: `0 8px 30px rgba(198, 168, 90, 0.3)`,
                }}
              >
                פתחו אירוע עכשיו
              </button>
              <button
                onClick={() => scrollTo("lead-form")}
                className="px-8 py-4 rounded-2xl font-heebo font-medium text-lg transition-all duration-300 hover:scale-105"
                style={{
                  border: `1px solid ${C.gold}40`,
                  color: C.white,
                  background: "transparent",
                }}
              >
                דברו עם נציג
              </button>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative order-1 lg:order-2 flex justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="absolute w-80 h-80 rounded-full" style={{ background: `radial-gradient(circle, ${C.goldGlowStrong}, transparent 70%)`, top: "10%", left: "10%" }} />
            <img
              src={mobileMockup}
              alt="מסך מתנות Giftkal"
              className="relative w-56 md:w-72 drop-shadow-2xl hover:scale-[1.03] transition-transform duration-700 rounded-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣ PAIN SECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PainSection = () => {
  const { ref, inView } = useInView();

  const comparison = [
    { envelope: "מזומן הולך לאיבוד", giftkal: "כסף נכנס ישירות לבנק" },
    { envelope: "צריך לספור בלילה", giftkal: "דוחות מסודרים" },
    { envelope: "אי נעימות", giftkal: "הכל דיגיטלי" },
    { envelope: "אין תיעוד", giftkal: "מעקב מלא ושקיפות" },
  ];

  return (
    <section className="py-28 relative overflow-hidden" ref={ref} style={{ background: C.bgDark }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${C.goldGlow}, transparent 70%)` }} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className={`font-playfair text-3xl md:text-5xl font-bold mb-8 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ color: C.white }}
          >
            בואו נדבר רגע <span style={{ color: C.gold }}>בכנות.</span>
          </h2>

          <div className={`font-heebo text-lg leading-loose mb-12 transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ color: C.muted }}>
            <p>מעטפות הולכות לאיבוד.</p>
            <p>צ׳קים חוזרים.</p>
            <p>צריך לספור מזומן בלילה של החתונה.</p>
            <p>ולרדוף אחרי מי שלא הביא.</p>
            <p className="mt-6 font-medium" style={{ color: C.white }}>זה לא אמור להיראות ככה.</p>
            <p className="mt-2 font-semibold text-xl" style={{ color: C.gold }}>Giftkal משנה את זה.</p>
          </div>

          {/* Comparison table */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-700 delay-300 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ border: `1px solid ${C.cardBorder}`, background: C.cardBg, backdropFilter: "blur(20px)" }}>
            <div className="grid grid-cols-2">
              <div className="py-4 px-6 font-heebo font-bold text-center" style={{ background: "rgba(255,255,255,0.05)", color: C.muted }}>
                מעטפות
              </div>
              <div className="py-4 px-6 font-heebo font-bold text-center" style={{ background: `${C.gold}15`, color: C.gold }}>
                Giftkal
              </div>
            </div>
            {comparison.map((row, i) => (
              <div key={i} className="grid grid-cols-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <div className="py-4 px-6 flex items-center justify-center gap-2 font-heebo text-sm" style={{ color: "#ff6b6b" }}>
                  <X className="w-4 h-4" />
                  {row.envelope}
                </div>
                <div className="py-4 px-6 flex items-center justify-center gap-2 font-heebo text-sm" style={{ color: "#51cf66" }}>
                  <Check className="w-4 h-4" />
                  {row.giftkal}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣ HOW IT WORKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HowItWorksSection = () => {
  const { ref, inView } = useInView();

  const steps = [
    { icon: Smartphone, title: "נרשמים ופותחים אירוע", desc: "מגדירים פרטי אירוע תוך דקות." },
    { icon: Send, title: "משתפים קישור אישי", desc: "האורחים מקבלים קישור מותאם לתשלום וברכה." },
    { icon: Banknote, title: "מקבלים את הכסף", desc: "התשלומים נכנסים ישירות לחשבון הבנק." },
  ];

  return (
    <section id="how-it-works" className="py-28 relative" ref={ref} style={{ background: C.bg }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at bottom, ${C.goldGlow}, transparent 60%)` }} />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className={`font-playfair text-3xl md:text-5xl font-bold text-center mb-6 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ color: C.white }}>
          מקימים אירוע. משתפים קישור. <span style={{ color: C.gold }}>מקבלים מתנות.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              <div
                className="rounded-3xl p-10 relative group hover:-translate-y-2 transition-all duration-500"
                style={{
                  background: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  backdropFilter: "blur(20px)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.cardBorderHover)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.cardBorder)}
              >
                {/* Number badge */}
                <div className="absolute -top-4 right-6 w-8 h-8 rounded-full flex items-center justify-center font-heebo font-bold text-sm" style={{ background: C.gold, color: C.bg }}>
                  {i + 1}
                </div>

                <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: `${C.gold}15` }}>
                  <s.icon className="w-8 h-8" style={{ color: C.gold }} />
                </div>
                <h3 className="font-playfair text-xl font-bold mb-3" style={{ color: C.white }}>{s.title}</h3>
                <p className="font-heebo text-sm leading-relaxed" style={{ color: C.muted }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4️⃣ HALL STATIONS SECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HallStationsSection = () => {
  const { ref, inView } = useInView();
  const features = [
    "תשלום באשראי במקום",
    "חוויית שימוש מהירה ומכובדת",
    "הכל מתועד במערכת",
    "בלי תורים, בלי מזומן",
  ];

  return (
    <section className="py-28 relative overflow-hidden" ref={ref} style={{ background: C.bgDark }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at right, ${C.goldGlow}, transparent 60%)` }} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className={`text-right transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <h2 className="font-playfair text-3xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: C.white }}>
              גם בתוך האולמות —
              <br />
              <span style={{ color: C.gold }}>עם עמדות Giftkal.</span>
            </h2>
            <p className="font-heebo text-lg mb-8 leading-relaxed" style={{ color: C.muted }}>
              לא כל האורחים שולחים מראש.
              <br />
              לכן Giftkal מציעה עמדות תשלום פיזיות בתוך האולמות.
            </p>
            <ul className="space-y-4">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 font-heebo" style={{ color: C.white }}>
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: C.gold }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className={`relative flex justify-center transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            <div className="rounded-3xl p-12 text-center" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, backdropFilter: "blur(20px)" }}>
              <Monitor className="w-32 h-32 mx-auto mb-6" style={{ color: C.gold }} />
              <p className="font-playfair text-2xl font-bold" style={{ color: C.white }}>עמדת תשלום</p>
              <p className="font-heebo text-sm mt-2" style={{ color: C.muted }}>חוויה פרימיום באולם</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5️⃣ NEDARIM PLUS SECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NedarimSection = () => {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 relative" ref={ref} style={{ background: C.bg }}>
      <div className="container mx-auto px-4">
        <div className={`max-w-4xl mx-auto text-center rounded-3xl p-12 md:p-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, backdropFilter: "blur(20px)" }}>
          <HeartHandshake className="w-16 h-16 mx-auto mb-6" style={{ color: C.gold }} />
          <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6" style={{ color: C.white }}>
            גם דרך <span style={{ color: C.gold }}>נדרים פלוס.</span>
          </h2>
          <p className="font-heebo text-lg leading-relaxed max-w-2xl mx-auto mb-4" style={{ color: C.muted }}>
            לאורחים שמעדיפים — ניתן לשלם גם דרך נדרים פלוס בצורה מסודרת ומאובטחת.
          </p>
          <p className="font-heebo text-base leading-relaxed max-w-2xl mx-auto" style={{ color: C.muted }}>
            Giftkal מעניקה פתרון רחב שמכסה את כל סוגי האורחים, בלי להשאיר אף אחד מאחור.
          </p>
        </div>
      </div>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6️⃣ BENEFITS GRID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BenefitsSection = () => {
  const { ref, inView } = useInView();

  const benefits = [
    { icon: Shield, title: "אבטחה מקסימלית", desc: "תשלומים מוצפנים בתקן SSL מחמיר." },
    { icon: Zap, title: "כסף עובר מהר", desc: "הכסף נכנס לחשבון תוך 1–7 ימי עסקים." },
    { icon: CreditCard, title: "תשלומים נוחים", desc: "אפשרות לפריסה לתשלומים, ובעלי השמחה מקבלים בפעם אחת." },
    { icon: Send, title: "גם מרחוק מפרגנים", desc: "שליחה לפני או אחרי האירוע בלחיצה אחת." },
    { icon: Eye, title: "שקיפות מלאה", desc: "דוחות מסודרים וניהול מתנות ברור." },
    { icon: Lock, title: "מערכת מפוקחת", desc: "פועלת לפי תקנים מחמירים ובאחריות מלאה." },
  ];

  return (
    <section id="benefits" className="py-28 relative" ref={ref} style={{ background: C.bgDark }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top, ${C.goldGlow}, transparent 60%)` }} />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className={`font-playfair text-3xl md:text-5xl font-bold text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ color: C.white }}>
          למה כולם בוחרים <span style={{ color: C.gold }}>Giftkal?</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((b, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 group hover:-translate-y-1 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{
                background: C.cardBg,
                border: `1px solid ${C.cardBorder}`,
                backdropFilter: "blur(20px)",
                transitionDelay: `${i * 100}ms`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.cardBorderHover)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.cardBorder)}
            >
              <div className="w-14 h-14 rounded-xl mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: `${C.gold}15` }}>
                <b.icon className="w-7 h-7" style={{ color: C.gold }} />
              </div>
              <h3 className="font-playfair text-lg font-bold mb-2" style={{ color: C.white }}>{b.title}</h3>
              <p className="font-heebo text-sm leading-relaxed" style={{ color: C.muted }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7️⃣ SOCIAL PROOF / TESTIMONIALS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TestimonialsSection = () => {
  const [active, setActive] = useState(0);
  const { ref, inView } = useInView();

  const testimonials = [
    { text: "איזה פתרון מדהים! הכנסנו מתנה תוך שנייה, לגמרי העתיד של המתנות בחתונות.", name: "יעל ואלעד", event: "חתונה, 2024" },
    { text: "עכשיו אני פחות מחשבן אם לבוא לחתונות. פיצלתי ל-3 תשלומים ולא נחנקתי.", name: "יוסף חיים שטרית", event: "אורח" },
    { text: "היה לנו פשוט וקל. שלחנו מתנה וזהו, בלי יותר מדי מחשבה. מומלץ בחום!", name: "משפחת כהן", event: "אורחים, חתונה 2024" },
    { text: "הכול היה פשוט וזורם. לא היינו צריכים להתארגן מראש.", name: "נועה ותומר", event: "חתונה, 2025" },
    { text: "המערכת פשוט עובדת! קיבלנו את כל המתנות ישירות לחשבון.", name: "ישראל ושרה", event: "חתונה, 2024" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActive((p) => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const eventsCounter = useCounter(1000, 2000);
  const guestsCounter = useCounter(50000, 2000);

  return (
    <section id="testimonials" className="py-28 relative" ref={ref} style={{ background: C.bg }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at bottom, ${C.goldGlow}, transparent 60%)` }} />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className={`font-playfair text-3xl md:text-5xl font-bold text-center mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ color: C.white }}>
          חוויית מתנה <span style={{ color: C.gold }}>שמרגישים.</span>
        </h2>

        {/* Carousel */}
        <div className={`max-w-4xl mx-auto relative transition-all duration-700 ${inView ? "opacity-100" : "opacity-0"}`}>
          <div className="overflow-hidden rounded-3xl">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(${active * 100}%)` }}>
              {testimonials.map((t, i) => (
                <div key={i} className="w-full flex-shrink-0 px-4">
                  <div className="rounded-3xl p-10 md:p-14 text-center relative" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, backdropFilter: "blur(20px)" }}>
                    <div className="absolute -top-2 right-10 text-7xl font-serif" style={{ color: `${C.gold}25` }}>"</div>
                    <div className="flex justify-center gap-1 mb-6">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-5 h-5" style={{ color: C.gold, fill: C.gold }} />
                      ))}
                    </div>
                    <p className="font-heebo text-xl md:text-2xl mb-8 leading-relaxed font-medium" style={{ color: C.white }}>{t.text}</p>
                    <p className="font-heebo font-bold text-lg" style={{ color: C.white }}>{t.name}</p>
                    <p className="font-heebo text-sm" style={{ color: C.gold }}>{t.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav arrows */}
          <button onClick={() => setActive((p) => (p + 1) % testimonials.length)} className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6 w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.white }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setActive((p) => (p - 1 + testimonials.length) % testimonials.length)} className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6 w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.white }}>
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className="rounded-full transition-all duration-300" style={{ width: i === active ? 32 : 12, height: 12, background: i === active ? C.gold : `${C.gold}30` }} />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-20">
          <div ref={eventsCounter.ref} className="text-center">
            <div className="font-playfair text-4xl md:text-5xl font-bold mb-2" style={{ color: C.gold }}>+{eventsCounter.count.toLocaleString()}</div>
            <p className="font-heebo text-sm" style={{ color: C.muted }}>אירועים מוצלחים</p>
          </div>
          <div ref={guestsCounter.ref} className="text-center">
            <div className="font-playfair text-4xl md:text-5xl font-bold mb-2" style={{ color: C.gold }}>+{guestsCounter.count.toLocaleString()}</div>
            <p className="font-heebo text-sm" style={{ color: C.muted }}>אורחים מרוצים</p>
          </div>
          <div className="text-center">
            <div className="font-playfair text-4xl md:text-5xl font-bold mb-2 flex items-center justify-center gap-2" style={{ color: C.gold }}>
              <Clock className="w-8 h-8" /> 0
            </div>
            <p className="font-heebo text-sm" style={{ color: C.muted }}>שניות התעסקות</p>
          </div>
          <div className="text-center">
            <div className="font-playfair text-4xl md:text-5xl font-bold mb-2 flex items-center justify-center gap-2" style={{ color: C.gold }}>
              <Shield className="w-8 h-8" /> 100%
            </div>
            <p className="font-heebo text-sm" style={{ color: C.muted }}>מאובטח ומפוקח</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8️⃣ FINAL CONVERSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ConversionSection = () => {
  const { ref, inView } = useInView();

  return (
    <section className="py-28 relative overflow-hidden" ref={ref} style={{ background: C.bgDark }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 100% 80% at 50% 50%, ${C.goldGlowStrong}, transparent 60%)` }} />
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className={`font-playfair text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ color: C.white }}>
          אל תנהלו מעטפות.
          <br />
          <span style={{ color: C.gold }}>תנהלו מערכת.</span>
        </h2>
        <p className={`font-heebo text-xl mb-4 transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ color: C.muted }}>
          עומדים לערוך שמחה?
        </p>
        <p className={`font-heebo text-lg mb-12 transition-all duration-700 delay-300 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ color: C.white }}>
          תהיו חכמים. תפעילו Giftkal.
        </p>
        <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-400 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <button onClick={() => scrollTo("lead-form")} className="px-10 py-4 rounded-2xl font-heebo font-semibold text-lg transition-all duration-300 hover:scale-105" style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`, color: C.bg, boxShadow: `0 8px 30px rgba(198,168,90,0.3)` }}>
            פתחו אירוע עכשיו
          </button>
          <button onClick={() => scrollTo("lead-form")} className="px-10 py-4 rounded-2xl font-heebo font-medium text-lg transition-all duration-300 hover:scale-105" style={{ border: `1px solid ${C.gold}40`, color: C.white, background: "transparent" }}>
            קבעו שיחה עם נציג
          </button>
        </div>
      </div>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9️⃣ LEAD FORM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        full_name: formData.fullName, phone: formData.phone, email: formData.email || null,
        lead_type: formData.leadType, venue_name: null, venue_address: null, status: "new",
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast({ title: "תודה רבה!", description: "קיבלנו את הפרטים שלך ונחזור אליך בהקדם" });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({ title: "שגיאה", description: "אירעה שגיאה בשליחת הטופס. אנא נסה שוב.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const bulletPoints = [
    "הסבר קצר וממוקד",
    "הדגמה חיה של המערכת",
    "התאמה לסוג האירוע שלכם",
    "בדיקה לגבי עמדות באולם",
  ];

  if (isSubmitted) {
    return (
      <section id="lead-form" className="py-28" style={{ background: C.bg }}>
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="rounded-3xl p-12 animate-scale-in" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "#51cf6620" }}>
                <CheckCircle2 className="w-12 h-12" style={{ color: "#51cf66" }} />
              </div>
              <h3 className="font-playfair text-3xl font-bold mb-4" style={{ color: C.white }}>תודה רבה!</h3>
              <p className="font-heebo mb-8 text-lg" style={{ color: C.muted }}>קיבלנו את הפרטים שלך ונחזור אליך בהקדם</p>
              <button onClick={() => setIsSubmitted(false)} className="px-6 py-3 rounded-xl font-heebo" style={{ border: `1px solid ${C.gold}40`, color: C.white }}>שלח פרטים נוספים</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="lead-form" className="py-28 relative" style={{ background: C.bg }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top, ${C.goldGlow}, transparent 60%)` }} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Text */}
          <div className="text-right">
            <h2 className="font-playfair text-3xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: C.white }}>
              רוצים להבין איך זה יעבוד
              <br />
              <span style={{ color: C.gold }}>באירוע שלכם?</span>
            </h2>
            <p className="font-heebo text-lg mb-8 leading-relaxed" style={{ color: C.muted }}>
              השאירו פרטים ונחזור אליכם עם:
            </p>
            <ul className="space-y-4 mb-8">
              {bulletPoints.map((bp, i) => (
                <li key={i} className="flex items-center gap-3 font-heebo" style={{ color: C.white }}>
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: C.gold }} />
                  {bp}
                </li>
              ))}
            </ul>
            <p className="font-heebo text-sm" style={{ color: C.gold }}>ייעוץ חינם. ללא התחייבות.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-3xl p-8 md:p-10" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, backdropFilter: "blur(20px)" }}>
            <div className="space-y-6">
              <div>
                <label className="block font-heebo font-medium mb-2 text-sm" style={{ color: C.white }}>שם מלא *</label>
                <input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="הכנס את שמך המלא" required className="w-full h-12 rounded-xl px-4 font-heebo text-base outline-none transition-all duration-300" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.cardBorder}`, color: C.white }} onFocus={(e) => (e.currentTarget.style.borderColor = C.gold)} onBlur={(e) => (e.currentTarget.style.borderColor = C.cardBorder)} />
              </div>
              <div>
                <label className="block font-heebo font-medium mb-2 text-sm" style={{ color: C.white }}>טלפון *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="050-0000000" required className="w-full h-12 rounded-xl px-4 font-heebo text-base outline-none transition-all duration-300" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.cardBorder}`, color: C.white }} onFocus={(e) => (e.currentTarget.style.borderColor = C.gold)} onBlur={(e) => (e.currentTarget.style.borderColor = C.cardBorder)} />
              </div>
              <div>
                <label className="block font-heebo font-medium mb-2 text-sm" style={{ color: C.white }}>אימייל</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="your@email.com" className="w-full h-12 rounded-xl px-4 font-heebo text-base outline-none transition-all duration-300" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.cardBorder}`, color: C.white }} onFocus={(e) => (e.currentTarget.style.borderColor = C.gold)} onBlur={(e) => (e.currentTarget.style.borderColor = C.cardBorder)} />
              </div>
              <div>
                <label className="block font-heebo font-medium mb-3 text-sm" style={{ color: C.white }}>סוג לקוח</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "couple", label: "זוג מתחתן" },
                    { value: "venue", label: "בעל אולם" },
                    { value: "organizer", label: "מארגן אירועים" },
                    { value: "other", label: "אחר" },
                  ].map((opt) => (
                    <button type="button" key={opt.value} onClick={() => setFormData({ ...formData, leadType: opt.value })} className="rounded-xl p-3 font-heebo text-sm text-center transition-all duration-300" style={{ background: formData.leadType === opt.value ? `${C.gold}20` : "rgba(255,255,255,0.03)", border: `1px solid ${formData.leadType === opt.value ? C.gold : C.cardBorder}`, color: formData.leadType === opt.value ? C.gold : C.muted }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-heebo font-semibold text-lg transition-all duration-300 hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`, color: C.bg, boxShadow: `0 8px 30px rgba(198,168,90,0.3)` }}>
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${C.bg}30`, borderTopColor: C.bg }} />
                    שולח...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5" />
                    שלח פרטים
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔹 FOOTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Footer = () => {
  return (
    <footer className="py-16" style={{ background: C.bgDark, borderTop: `1px solid ${C.cardBorder}` }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <img src={logo} alt="Giftkal" className="h-14 mb-6" />
            <p className="font-heebo text-sm max-w-md leading-relaxed" style={{ color: C.muted }}>
              Giftkal - הפלטפורמה המובילה לגביית מתנות דיגיטליות באירועים.
              מערכת פשוטה, מאובטחת ואלגנטית.
            </p>
          </div>
          <div>
            <h4 className="font-playfair font-bold mb-6 text-lg" style={{ color: C.white }}>קישורים</h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="font-heebo text-sm transition-colors hover:underline" style={{ color: C.muted }}>כניסה למערכת</Link></li>
              <li><button onClick={() => scrollTo("lead-form")} className="font-heebo text-sm transition-colors hover:underline" style={{ color: C.muted }}>צור קשר</button></li>
              <li><button onClick={() => scrollTo("benefits")} className="font-heebo text-sm transition-colors hover:underline" style={{ color: C.muted }}>למה Giftkal</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-playfair font-bold mb-6 text-lg" style={{ color: C.white }}>יצירת קשר</h4>
            <ul className="space-y-4">
              <li>
                <a href="tel:+972500000000" className="flex items-center gap-3 font-heebo text-sm transition-colors" style={{ color: C.muted }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}><Phone className="w-4 h-4" style={{ color: C.gold }} /></div>
                  050-000-0000
                </a>
              </li>
              <li>
                <a href="mailto:info@giftkal.com" className="flex items-center gap-3 font-heebo text-sm transition-colors" style={{ color: C.muted }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}><Mail className="w-4 h-4" style={{ color: C.gold }} /></div>
                  info@giftkal.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/972500000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-heebo text-sm transition-colors" style={{ color: C.muted }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}><MessageCircle className="w-4 h-4" style={{ color: C.gold }} /></div>
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 text-center" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
          <p className="font-heebo text-sm" style={{ color: `${C.muted}80` }}>© {new Date().getFullYear()} Giftkal. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HomePage = () => {
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <Navbar />
      <HeroSection />
      <PainSection />
      <HowItWorksSection />
      <HallStationsSection />
      <NedarimSection />
      <BenefitsSection />
      <TestimonialsSection />
      <ConversionSection />
      <LeadFormSection />
      <Footer />
    </div>
  );
};

export default HomePage;
