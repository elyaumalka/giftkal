/**
 * Landing page — בשמחות פלוס / Giftkal
 *
 * Style: dark editorial fintech. Deep navy background, warm gold halo glow,
 * floating product mockups, oversized display headline, stat strip, alternating
 * dashboard-preview sections. Inspired by Duma — adapted to our brand
 * (navy #051839 / gold #C9A35E / burgundy #7C2D3F) and Hebrew RTL typography.
 */

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logoAsset from "@/assets/logo.png.asset.json";

const BRAND = {
  bg: "#050B1F",
  bgSoft: "#0A1430",
  navy: "#051839",
  ink: "#0E1B3D",
  line: "rgba(255,255,255,0.08)",
  text: "#F4EFE3",
  textDim: "rgba(244,239,227,0.62)",
  gold: "#C9A35E",
  goldSoft: "#E5C988",
  goldDeep: "#95742F",
  burgundy: "#C41E3A",
  burgundyDeep: "#7C2D3F",
};

const FONT_DISPLAY =
  "'Frank Ruhl Libre', 'Heebo', ui-serif, Georgia, serif";
const FONT_SANS =
  "'Heebo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function HomePage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen overflow-x-hidden"
      style={{
        background: BRAND.bg,
        color: BRAND.text,
        fontFamily: FONT_SANS,
      }}
    >
      <TopNav />
      <Hero />
      <StatStrip />
      <ControlSection />
      <HowItWorks />
      <ForVenues />
      <Testimonial />
      <FAQ />
      <ContactCTA />
      <SiteFooter />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── Nav */

const NAV = [
  { id: "top", label: "ראשי" },
  { id: "how", label: "איך זה עובד" },
  { id: "features", label: "יתרונות" },
  { id: "venues", label: "בעלי אולמות" },
  { id: "faq", label: "שאלות" },
  { id: "contact", label: "צור קשר" },
];

function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    NAV.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const hash = location.hash?.replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 60);
  }, [location.hash]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(5,11,31,0.78)" : "transparent",
        backdropFilter: scrolled ? "blur(18px) saturate(140%)" : "none",
        borderBottom: scrolled ? `1px solid ${BRAND.line}` : "1px solid transparent",
        padding: scrolled ? "10px 0" : "18px 0",
      }}
    >
      <div className="container mx-auto px-6 lg:px-10 flex items-center justify-between gap-6">
        <a href="#top" onClick={go("top")} className="flex items-center shrink-0">
          <img src={logoAsset.url} alt="בשמחות פלוס" className="h-9 lg:h-11" />
        </a>

        <nav className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-full"
             style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BRAND.line}` }}>
          {NAV.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={go(l.id)}
              className="relative px-4 py-2 text-[13px] font-medium rounded-full transition-colors"
              style={{
                color: active === l.id ? BRAND.bg : BRAND.textDim,
                background: active === l.id ? BRAND.gold : "transparent",
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: active === l.id ? BRAND.bg : BRAND.gold }}
                />
                {l.label}
              </span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/access"
            className="hidden sm:inline-flex px-4 py-2 text-[13px] font-medium rounded-full transition-colors"
            style={{ color: BRAND.textDim }}
          >
            כניסה
          </Link>
          <a
            href="#contact"
            onClick={go("contact")}
            className="inline-flex items-center px-5 py-2.5 text-[13px] font-bold rounded-full transition-all hover:scale-[1.02]"
            style={{ background: BRAND.text, color: BRAND.bg }}
          >
            בואו נדבר
          </a>
          <button
            aria-label="תפריט"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div className="space-y-1.5">
              <span className="block w-4 h-px" style={{ background: BRAND.text }} />
              <span className="block w-4 h-px" style={{ background: BRAND.text }} />
              <span className="block w-4 h-px" style={{ background: BRAND.text }} />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div
          className="lg:hidden mx-4 mt-2 rounded-3xl overflow-hidden"
          style={{ background: BRAND.bgSoft, border: `1px solid ${BRAND.line}` }}
        >
          <ul className="p-2">
            {NAV.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  onClick={go(l.id)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-2xl"
                  style={{
                    color: active === l.id ? BRAND.gold : BRAND.text,
                    background: active === l.id ? "rgba(201,163,94,0.08)" : "transparent",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: BRAND.gold }}
                  />
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to="/access"
                className="block px-4 py-3 text-sm font-medium rounded-2xl"
                style={{ color: BRAND.textDim }}
              >
                כניסה למערכת
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

/* ───────────────────────────────────────────────────────────── Hero */

function Hero() {
  return (
    <section
      id="top"
      className="relative pt-40 pb-24 lg:pt-48 lg:pb-32 scroll-mt-24 overflow-hidden"
    >
      {/* Halo arc glow */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 -top-[55%] w-[180vw] h-[180vw] max-w-[1800px] max-h-[1800px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(closest-side, ${BRAND.gold}55 0%, ${BRAND.burgundyDeep}22 35%, transparent 60%)`,
          filter: "blur(20px)",
        }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 -top-[54%] w-[180vw] h-[180vw] max-w-[1800px] max-h-[1800px] rounded-full pointer-events-none"
        style={{
          border: `2px solid ${BRAND.gold}`,
          opacity: 0.35,
          maskImage: "linear-gradient(to bottom, white 30%, transparent 55%)",
          WebkitMaskImage: "linear-gradient(to bottom, white 30%, transparent 55%)",
        }}
      />

      <div className="container mx-auto px-6 lg:px-10 relative">
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${BRAND.line}`,
              color: BRAND.textDim,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BRAND.gold }} />
            מערכת המתנות מס׳ 1 בישראל
          </span>

          <h1
            className="mt-7 leading-[0.95] font-black tracking-tight"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(2.8rem, 7vw, 6rem)",
              color: BRAND.text,
            }}
          >
            מתנות דיגיטליות,
            <br />
            <span style={{ color: BRAND.goldSoft }}>אירועים שלמים.</span>
          </h1>

          <p
            className="mt-6 text-base lg:text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: BRAND.textDim }}
          >
            עמדה אחת באולם, אפליקציה אחת לאורח. כל מתנה זורמת ישירות לחשבון
            הזוג — בלי תורים, בלי מזומן, בלי דאגות.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-7 py-3.5 rounded-full text-sm font-bold transition-transform hover:scale-[1.03]"
              style={{ background: BRAND.gold, color: BRAND.bg }}
            >
              להזמנת עמדה
            </a>
            <a
              href="#how"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-7 py-3.5 rounded-full text-sm font-bold transition-colors"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${BRAND.line}`,
                color: BRAND.text,
              }}
            >
              איך זה עובד
            </a>
          </div>
        </div>

        {/* Floating cards */}
        <FloatingCards />
      </div>
    </section>
  );
}

function FloatingCards() {
  return (
    <div className="relative mt-20 lg:mt-28 h-[300px] lg:h-[420px] flex items-center justify-center">
      {/* Back card — gift */}
      <div
        className="absolute w-[280px] lg:w-[400px] aspect-[1.6/1] rounded-3xl p-6 lg:p-8 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${BRAND.burgundyDeep} 0%, ${BRAND.burgundy} 100%)`,
          transform: "translate(20%, -8%) rotate(-9deg)",
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08) inset",
        }}
      >
        <div className="flex items-start justify-between text-[10px] lg:text-xs tracking-widest uppercase opacity-80">
          <span>Gift Card</span>
          <div className="flex gap-1">
            <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-full" style={{ background: BRAND.gold, opacity: 0.85 }} />
            <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-full -mr-2" style={{ background: BRAND.goldSoft, opacity: 0.7 }} />
          </div>
        </div>
        <div
          className="mt-8 lg:mt-14 font-black tabular-nums"
          style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(1.4rem, 3vw, 2.2rem)" }}
        >
          ₪ 360
        </div>
        <div className="mt-3 lg:mt-5 flex items-end justify-between text-[10px] lg:text-xs opacity-80">
          <div>
            <p className="opacity-60">לכבוד</p>
            <p className="font-bold tracking-wide mt-0.5">משפחת לוי</p>
          </div>
          <div className="text-left">
            <p className="opacity-60">מאת</p>
            <p className="font-bold tracking-wide mt-0.5">דוד וחנה</p>
          </div>
        </div>
      </div>

      {/* Front card — receipt / kiosk */}
      <div
        className="absolute w-[280px] lg:w-[400px] aspect-[1.6/1] rounded-3xl p-6 lg:p-8 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 60%, ${BRAND.bgSoft} 100%)`,
          transform: "translate(-20%, 12%) rotate(7deg)",
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,163,94,0.18) inset",
        }}
      >
        <div className="flex items-start justify-between text-[10px] lg:text-xs tracking-widest uppercase" style={{ color: BRAND.goldSoft }}>
          <span>עמדת מתנות</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BRAND.gold }} />
            <span>LIVE</span>
          </div>
        </div>
        <div
          className="mt-7 lg:mt-12 font-black tabular-nums"
          style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(1.4rem, 3vw, 2.2rem)", color: BRAND.text }}
        >
          ₪ 248,500
        </div>
        <p className="text-[10px] lg:text-xs mt-1" style={{ color: BRAND.textDim }}>נסלק עד עכשיו · 412 אורחים</p>
        <div className="mt-4 lg:mt-6 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full" style={{ width: "78%", background: `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.goldSoft})` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] lg:text-xs" style={{ color: BRAND.textDim }}>
          <span>יעד: ₪320,000</span>
          <span style={{ color: BRAND.goldSoft }}>78%</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── Stats */

function StatStrip() {
  const stats = [
    { v: "100%", l: "כסף מאובטח" },
    { v: "1,200+", l: "אירועים שבוצעו" },
    { v: "4.9", l: "דירוג ממוצע" },
    { v: "3 דק׳", l: "זמן מתנה ממוצע" },
  ];
  return (
    <section className="relative py-16 lg:py-20 border-y" style={{ borderColor: BRAND.line }}>
      <div className="container mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
          {stats.map((s) => (
            <div key={s.l} className="text-center lg:text-right">
              <p
                className="font-black tabular-nums leading-none"
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
                  color: BRAND.text,
                }}
              >
                {s.v}
              </p>
              <p className="mt-3 text-sm" style={{ color: BRAND.textDim }}>
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── Control / Features section */

function ControlSection() {
  return (
    <section
      id="features"
      className="relative py-24 lg:py-36 scroll-mt-24"
    >
      <div className="container mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span
              className="inline-flex px-4 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${BRAND.line}`,
                color: BRAND.textDim,
              }}
            >
              מה מקבלים
            </span>
            <h2
              className="mt-6 leading-[1.05] font-black"
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(2.2rem, 4.5vw, 4rem)",
                color: BRAND.text,
              }}
            >
              שליטה מלאה
              <br />
              <span style={{ color: BRAND.goldSoft }}>על כל מתנה.</span>
            </h2>
            <p className="mt-6 text-base lg:text-lg leading-relaxed max-w-md" style={{ color: BRAND.textDim }}>
              דשבורד אישי שמלווה אתכם מהרגע שאישרתם עמדה ועד שאחרון האורחים
              עזב. רואים מי תרם, כמה, ומתי — בזמן אמת.
            </p>

            <ul className="mt-10 space-y-5">
              {[
                { t: "מעקב חי", d: "כל מתנה מופיעה תוך שניות בדשבורד." },
                { t: "ברכות אישיות", d: "כל אורח מוסיף הקדשה, וידאו או הודעה קולית." },
                { t: "סליקה ישירה", d: "הכסף עובר ישירות לחשבון הזוג, ללא תיווך." },
              ].map((f) => (
                <li key={f.t} className="flex gap-4">
                  <span
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
                    style={{
                      background: "rgba(201,163,94,0.1)",
                      border: `1px solid ${BRAND.gold}44`,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke={BRAND.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-bold text-base" style={{ color: BRAND.text }}>{f.t}</p>
                    <p className="text-sm mt-1" style={{ color: BRAND.textDim }}>{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[40px] pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${BRAND.gold}33 0%, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Main card: weekly gifts */}
      <div
        className="relative rounded-3xl p-6 lg:p-7"
        style={{
          background: `linear-gradient(180deg, ${BRAND.bgSoft} 0%, ${BRAND.navy} 100%)`,
          border: `1px solid ${BRAND.line}`,
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: BRAND.textDim }}>
              סך מתנות
            </p>
            <p
              className="mt-2 font-black tabular-nums leading-none"
              style={{ fontFamily: FONT_DISPLAY, fontSize: "2.5rem", color: BRAND.text }}
            >
              ₪ 312,840
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: `${BRAND.gold}22`, color: BRAND.goldSoft }}
          >
            +18% השבוע
          </span>
        </div>

        {/* Chart */}
        <div className="mt-6 h-32 relative">
          <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND.gold} stopOpacity="0.4" />
                <stop offset="100%" stopColor={BRAND.gold} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,80 L40,65 L80,72 L120,40 L160,48 L200,25 L240,32 L300,15 L300,100 L0,100 Z"
              fill="url(#chartFill)"
            />
            <path
              d="M0,80 L40,65 L80,72 L120,40 L160,48 L200,25 L240,32 L300,15"
              fill="none"
              stroke={BRAND.gold}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="300" cy="15" r="4" fill={BRAND.goldSoft} />
          </svg>
        </div>
        <div className="mt-2 flex justify-between text-[11px]" style={{ color: BRAND.textDim }}>
          {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>

      {/* Floating mini card */}
      <div
        className="absolute -bottom-8 -right-6 lg:-right-10 w-[240px] rounded-2xl p-5"
        style={{
          background: BRAND.bg,
          border: `1px solid ${BRAND.line}`,
          boxShadow: "0 30px 60px -10px rgba(0,0,0,0.7)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-black"
            style={{ background: BRAND.burgundy, color: BRAND.text, fontFamily: FONT_DISPLAY }}
          >
            ר
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: BRAND.text }}>רחל מ.</p>
            <p className="text-xs" style={{ color: BRAND.textDim }}>זה עתה תרמה</p>
          </div>
          <p
            className="font-black tabular-nums text-base"
            style={{ color: BRAND.goldSoft, fontFamily: FONT_DISPLAY }}
          >
            ₪500
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── How it works */

function HowItWorks() {
  const steps = [
    { n: "01", t: "הזמנה", d: "מתקשרים, מתאמים תאריך ומקום, וחותמים בוואטסאפ. תוך 5 דקות." },
    { n: "02", t: "הקמה", d: "מגיעים שעתיים לפני האירוע, מתקינים את העמדה, וזורמים." },
    { n: "03", t: "מתנות בזמן אמת", d: "האורחים מעניקים בקליק. אתם רואים כל מתנה כשהיא קורית." },
    { n: "04", t: "סוף הערב", d: "בלי ספירה, בלי מזומן. הכסף כבר בחשבון הזוג." },
  ];
  return (
    <section
      id="how"
      className="relative py-24 lg:py-36 scroll-mt-24"
      style={{ background: BRAND.bgSoft }}
    >
      <div className="container mx-auto px-6 lg:px-10">
        <div className="max-w-2xl">
          <span
            className="inline-flex px-4 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${BRAND.line}`,
              color: BRAND.textDim,
            }}
          >
            התהליך
          </span>
          <h2
            className="mt-6 leading-[1.05] font-black"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(2.2rem, 4.5vw, 4rem)",
              color: BRAND.text,
            }}
          >
            ארבעה שלבים.
            <br />
            <span style={{ color: BRAND.goldSoft }}>ערב אחד מושלם.</span>
          </h2>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-px"
             style={{ background: BRAND.line }}>
          {steps.map((s) => (
            <div
              key={s.n}
              className="p-8 lg:p-10 transition-colors hover:bg-white/[0.02]"
              style={{ background: BRAND.bgSoft }}
            >
              <p
                className="font-black"
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "3rem",
                  color: BRAND.gold,
                  opacity: 0.9,
                  lineHeight: 1,
                }}
              >
                {s.n}
              </p>
              <h3 className="mt-6 text-xl font-bold" style={{ color: BRAND.text }}>{s.t}</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: BRAND.textDim }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── For venues */

function ForVenues() {
  return (
    <section id="venues" className="relative py-24 lg:py-36 scroll-mt-24 overflow-hidden">
      <div
        aria-hidden
        className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${BRAND.burgundy}22 0%, transparent 60%)`,
          filter: "blur(60px)",
        }}
      />

      <div className="container mx-auto px-6 lg:px-10 relative">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              {[
                { v: "+34%", l: "הכנסה ממוצעת לאירוע" },
                { v: "0₪", l: "השקעה ראשונית" },
                { v: "24/7", l: "תמיכה טכנית" },
                { v: "100%", l: "מיתוג של האולם" },
              ].map((c) => (
                <div
                  key={c.l}
                  className="rounded-2xl p-6 lg:p-7"
                  style={{
                    background: BRAND.bgSoft,
                    border: `1px solid ${BRAND.line}`,
                  }}
                >
                  <p
                    className="font-black tabular-nums leading-none"
                    style={{ fontFamily: FONT_DISPLAY, fontSize: "2.2rem", color: BRAND.goldSoft }}
                  >
                    {c.v}
                  </p>
                  <p className="mt-3 text-sm" style={{ color: BRAND.textDim }}>{c.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span
              className="inline-flex px-4 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: `${BRAND.burgundy}22`,
                border: `1px solid ${BRAND.burgundy}55`,
                color: BRAND.text,
              }}
            >
              לבעלי אולמות
            </span>
            <h2
              className="mt-6 leading-[1.05] font-black"
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(2.2rem, 4.5vw, 4rem)",
                color: BRAND.text,
              }}
            >
              שירות יוקרתי, <br />
              <span style={{ color: BRAND.goldSoft }}>בלי לוגיסטיקה.</span>
            </h2>
            <p className="mt-6 text-base lg:text-lg leading-relaxed max-w-lg" style={{ color: BRAND.textDim }}>
              משכירים לכם עמדות לפי אירוע, חודש או שותפות. אתם מציעים שירות
              פרימיום ללקוחות — אנחנו דואגים לכל השאר.
            </p>
            <div className="mt-10 flex gap-3">
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-7 py-3.5 rounded-full text-sm font-bold transition-transform hover:scale-[1.03]"
                style={{ background: BRAND.gold, color: BRAND.bg }}
              >
                לפרטים ושותפויות
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── Testimonial */

function Testimonial() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-10 max-w-4xl text-center">
        <span
          className="inline-block text-7xl lg:text-9xl font-black leading-none"
          style={{ color: BRAND.gold, fontFamily: FONT_DISPLAY }}
          dir="ltr"
        >
          ”
        </span>
        <p
          className="-mt-4 lg:-mt-8 leading-snug font-medium"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
            color: BRAND.text,
          }}
        >
          הזמנו עמדה לחתונה של 600 אורחים. בערב אחד עברו 480 מתנות בלי שאף
          אחד הרגיש שהוא ממתין בתור. בבוקר — כל הכסף כבר היה בחשבון.{" "}
          <span style={{ color: BRAND.goldSoft }}>בלי דאגות.</span>
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 text-sm" style={{ color: BRAND.textDim }}>
          <span className="h-px w-12" style={{ background: BRAND.gold }} />
          <span>
            <strong style={{ color: BRAND.text }}>משפחת לוי</strong> · אולם פאר ים, אשדוד
          </span>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── FAQ */

function FAQ() {
  const items = [
    { q: "מה המחיר?", a: "המחיר נקבע לפי כמות אורחים, מספר עמדות וסוג האירוע. התקשרו 02-3131700 לקבלת הצעת מחיר תוך 5 דקות." },
    { q: "האם צריך אינטרנט באולם?", a: "העמדה עובדת על 4G מובנה. אם יש WiFi באולם — מעולה. אם אין — אנחנו מסודרים." },
    { q: "מתי הכסף מגיע לחשבון?", a: "תוך 1-3 ימי עסקים. הסליקה ישירה לחשבון של הזוג, ללא תיווך וללא חסימת כספים." },
    { q: "מה אם אורח טועה בסכום?", a: "ניתן לבטל או לתקן מתנה תוך 30 דקות מההזמנה — גם דרך האפליקציה, גם דרכנו." },
    { q: "כמה זמן לוקח להקים?", a: "אנחנו מגיעים שעתיים לפני האירוע, מקימים תוך 20 דקות, ובודקים שהכל זורם." },
  ];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative py-24 lg:py-36 scroll-mt-24"
      style={{ background: BRAND.bgSoft }}
    >
      <div className="container mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-16">
          <div>
            <span
              className="inline-flex px-4 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${BRAND.line}`,
                color: BRAND.textDim,
              }}
            >
              שאלות נפוצות
            </span>
            <h2
              className="mt-6 leading-[1.05] font-black"
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                color: BRAND.text,
              }}
            >
              שאלה?
              <br />
              <span style={{ color: BRAND.goldSoft }}>יש תשובה.</span>
            </h2>
            <p className="mt-6 text-sm leading-relaxed max-w-xs" style={{ color: BRAND.textDim }}>
              לא מצאתם את התשובה? התקשרו 02-3131700 ונשמח לעזור.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((it, i) => {
              const isOpen = open === i;
              return (
                <button
                  key={it.q}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-right rounded-2xl p-6 lg:p-7 transition-colors"
                  style={{
                    background: isOpen ? BRAND.bg : "rgba(255,255,255,0.025)",
                    border: `1px solid ${isOpen ? BRAND.gold + "55" : BRAND.line}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-bold text-base lg:text-lg" style={{ color: BRAND.text }}>
                      {it.q}
                    </span>
                    <span
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform"
                      style={{
                        background: isOpen ? BRAND.gold : "rgba(255,255,255,0.06)",
                        color: isOpen ? BRAND.bg : BRAND.text,
                        transform: isOpen ? "rotate(45deg)" : "none",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </div>
                  {isOpen && (
                    <p className="mt-4 text-sm leading-relaxed" style={{ color: BRAND.textDim }}>
                      {it.a}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── Contact CTA */

function ContactCTA() {
  return (
    <section id="contact" className="relative py-28 lg:py-40 scroll-mt-24 overflow-hidden">
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[110vw] h-[110vw] max-w-[1200px] max-h-[1200px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${BRAND.gold}22 0%, ${BRAND.burgundy}11 40%, transparent 65%)`,
          filter: "blur(40px)",
        }}
      />

      <div className="container mx-auto px-6 lg:px-10 relative text-center max-w-3xl">
        <span
          className="inline-flex px-4 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${BRAND.line}`,
            color: BRAND.textDim,
          }}
        >
          להזמנת עמדה
        </span>
        <h2
          className="mt-6 leading-[0.98] font-black"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(2.6rem, 6vw, 5rem)",
            color: BRAND.text,
          }}
        >
          זה הזמן <br />
          <span style={{ color: BRAND.goldSoft }}>לדבר איתנו.</span>
        </h2>
        <p className="mt-6 text-base lg:text-lg" style={{ color: BRAND.textDim }}>
          חייגו ונפתח לכם תאריך תוך 5 דקות. ובלי לחץ — גם בוואטסאפ זה עובד.
        </p>

        <div className="mt-12 flex flex-col items-center gap-3">
          <a
            href="tel:02-3131700"
            className="group inline-flex items-center gap-4 px-10 py-5 rounded-full transition-all hover:scale-[1.02]"
            style={{ background: BRAND.gold, color: BRAND.bg }}
          >
            <span
              className="font-black tabular-nums"
              style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
            >
              02-3131700
            </span>
            <span aria-hidden className="text-xl">←</span>
          </a>
          <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: BRAND.textDim }}>
            <a href="mailto:g023131700@gmail.com" className="hover:underline">g023131700@gmail.com</a>
            <span>·</span>
            <a href="https://wa.me/97223131700" target="_blank" rel="noreferrer" className="hover:underline">WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── Footer */

function SiteFooter() {
  return (
    <footer
      className="border-t py-12"
      style={{ borderColor: BRAND.line, background: BRAND.bg }}
    >
      <div className="container mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 text-sm">
          <div>
            <img src={logoAsset.url} alt="בשמחות פלוס" className="h-10 mb-4" />
            <p style={{ color: BRAND.textDim }}>נותנים מתנה בקליק</p>
            <p className="text-xs mt-1" style={{ color: BRAND.textDim, opacity: 0.7 }}>מופעל ע״י עמדות נדרים פלוס</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3" style={{ color: BRAND.textDim }}>
            {NAV.map((l) => (
              <a key={l.id} href={`#${l.id}`} className="hover:opacity-100 transition-opacity"
                 style={{ opacity: 0.75 }}>
                {l.label}
              </a>
            ))}
            <Link to="/access" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.75 }}>
              כניסה למערכת
            </Link>
          </div>
        </div>
        <div
          className="mt-10 pt-6 border-t text-xs flex flex-col md:flex-row justify-between gap-3"
          style={{ borderColor: BRAND.line, color: BRAND.textDim, opacity: 0.7 }}
        >
          <span>© {new Date().getFullYear()} בשמחות פלוס. כל הזכויות שמורות.</span>
          <span>02-3131700 · g023131700@gmail.com</span>
        </div>
      </div>
    </footer>
  );
}
