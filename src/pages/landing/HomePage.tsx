/**
 * Landing page — בשמחות פלוס.
 *
 * Design brief from the brand collateral: warm wedding-luxury aesthetic, NOT
 * the generic Tailwind SaaS template. Cream candlelight base + deep navy text
 * + bold gold display type + burgundy accent (the heart from the brand mark).
 * Editorial spacing, asymmetric layouts, no card-grid of stock-icon features.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logoAsset from "@/assets/logo.png.asset.json";

const BRAND = {
  cream: "#F8F2E4",      // candlelight base
  creamSoft: "#FBF7EC",
  navy: "#0B1F4A",       // deep navy from the logo
  navyDark: "#06143A",
  gold: "#C9A35E",       // warm gold from the brand mark
  goldLight: "#E5C988",
  burgundy: "#7C2D3F",   // the heart accent
  ink: "#1A2942",
  mute: "#6B6B6B",
};

export default function HomePage() {
  return (
    <div
      dir="rtl"
      className="text-[var(--navy)] overflow-x-hidden"
      style={{
        background: BRAND.cream,
        ["--cream" as any]: BRAND.cream,
        ["--cream-soft" as any]: BRAND.creamSoft,
        ["--navy" as any]: BRAND.navy,
        ["--navy-dark" as any]: BRAND.navyDark,
        ["--gold" as any]: BRAND.gold,
        ["--gold-light" as any]: BRAND.goldLight,
        ["--burgundy" as any]: BRAND.burgundy,
        ["--ink" as any]: BRAND.ink,
      }}
    >
      <TopNav />
      <Hero />
      <Promise />
      <HowItWorks />
      <FeatureMosaic />
      <ForVenues />
      <Numbers />
      <Testimonial />
      <FAQ />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Sticky one-page navigation
   ─────────────────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { id: "top", label: "דף ראשי" },
  { id: "how", label: "איך זה עובד" },
  { id: "features", label: "מה מקבלים" },
  { id: "venues", label: "בעלי אולמות" },
  { id: "faq", label: "שאלות נפוצות" },
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
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    NAV_LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Support deep-link hashes (#how, #contact …) when arriving from old marketing pages
  useEffect(() => {
    const hash = location.hash?.replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
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
    <nav
      dir="rtl"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--cream)]/90 backdrop-blur-xl shadow-[0_4px_30px_-12px_rgba(11,31,74,0.18)] py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
        <a href="#top" onClick={go("top")} className="flex items-center gap-2 shrink-0">
          <img src={logoAsset.url} alt="בשמחות פלוס" className="h-10 lg:h-12" />
        </a>

        <ul className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={go(l.id)}
                className={`text-sm font-bold tracking-wide transition-colors ${
                  active === l.id
                    ? "text-[var(--burgundy)]"
                    : "text-[var(--navy)]/70 hover:text-[var(--navy)]"
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#contact"
            onClick={go("contact")}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--navy)] text-[var(--cream)] text-sm font-bold hover:bg-[var(--navy-dark)] transition-colors"
          >
            דברו איתנו
          </a>
          <Link
            to="/access"
            className="hidden sm:inline-flex text-sm font-bold text-[var(--navy)]/70 hover:text-[var(--navy)] px-3 py-2"
          >
            כניסה
          </Link>
          <button
            aria-label="תפריט"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden w-10 h-10 rounded-full bg-[var(--navy)]/5 flex items-center justify-center text-[var(--navy)]"
          >
            <div className="space-y-1.5">
              <span className="block w-5 h-0.5 bg-current" />
              <span className="block w-5 h-0.5 bg-current" />
              <span className="block w-5 h-0.5 bg-current" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-[var(--cream)] border-t border-[var(--navy)]/10 shadow-lg">
          <ul className="container mx-auto px-6 py-4 space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  onClick={go(l.id)}
                  className={`block py-3 text-base font-bold ${
                    active === l.id ? "text-[var(--burgundy)]" : "text-[var(--navy)]"
                  }`}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/access" className="block py-3 text-base font-bold text-[var(--navy)]/70">
                כניסה למערכת
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Section: Hero
   ─────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section id="top" className="relative min-h-[100vh] flex items-center pt-28 pb-16 scroll-mt-24">
      {/* Soft candlelight bokeh — pure CSS, no stock photo */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 -right-32 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${BRAND.gold}, transparent 70%)` }}
        />
        <div
          className="absolute bottom-1/4 -left-40 w-[520px] h-[520px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${BRAND.burgundy}, transparent 70%)` }}
        />
        <SparkleField />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-[var(--burgundy)]/20 bg-white/50 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-[var(--burgundy)]" />
              <span className="text-xs tracking-wide text-[var(--burgundy)] font-bold uppercase">בס״ד</span>
              <span className="text-xs text-[var(--ink)]/60">· עמדות נדרים פלוס</span>
            </div>

            <h1
              className="font-black leading-[0.95] tracking-tight text-[var(--navy)]"
              style={{ fontSize: "clamp(3.2rem, 7vw, 6rem)" }}
            >
              לחגוג <br />
              <span className="relative inline-block">
                בראש שקט
                <GoldSwoosh />
              </span>
              <span className="text-[var(--burgundy)]">.</span>
            </h1>

            <p className="mt-8 text-lg lg:text-xl text-[var(--ink)]/80 max-w-xl leading-relaxed">
              מעכשיו מתנות לאירועים <strong className="text-[var(--burgundy)]">רק בכרטיס אשראי</strong>.
              <br />
              עמדת אשראי מתקדמת להענקת מתנות —
              <span className="block mt-1">מאובטחת, מהירה, ובפריסה ארצית.</span>
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="tel:02-3131700"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[var(--navy)] text-[var(--cream)] font-bold rounded-full overflow-hidden transition-transform hover:scale-[1.02]"
              >
                <span className="relative z-10">להזמנת עמדה — 02-3131700</span>
                <span aria-hidden className="relative z-10 text-[var(--gold)]">→</span>
                <span className="absolute inset-0 bg-[var(--navy-dark)] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </a>
              <Link
                to="/event-owners"
                className="inline-flex items-center gap-2 px-6 py-4 text-[var(--ink)] font-bold border-b-2 border-[var(--gold)] hover:border-[var(--burgundy)] transition-colors"
              >
                איך זה עובד?
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--ink)]/70">
              <Quickbit icon={<LockIcon />} label="מאובטח לחלוטין" />
              <Quickbit icon={<ZapIcon />} label="3 דקות לסיום" />
              <Quickbit icon={<MapPinIcon />} label="פריסה ארצית" />
            </div>
          </div>

          <HeroCard />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <span className="text-xs text-[var(--ink)]">גוללו לעוד</span>
        <span className="block w-px h-8 bg-[var(--navy)]/40" />
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Section: Promise — three quiet promises with editorial typography
   ─────────────────────────────────────────────────────────────────────────── */

function Promise() {
  const items = [
    { kicker: "01", title: "בלי תורים", body: "האורח מעניק מתנה בעמדה. סיום מלא ב-3 דקות. ספירת מזומנים בסוף הלילה — נשארת מהעבר." },
    { kicker: "02", title: "בלי לאבד מזומן", body: "כל מתנה נשמרת ישירות בחשבון הזוג בסליקה מאובטחת. אין סכנת אובדן, גניבה או טעויות." },
    { kicker: "03", title: "בלי מורכבות", body: "מערכת מוכנה — עמדה מגיעה למקום, רצה על WiFi או 4G של האולם. אפס הקמה אצלכם." },
  ];
  return (
    <section id="why" className="relative py-24 lg:py-32 bg-[var(--cream-soft)] scroll-mt-24">
      <div className="container mx-auto px-6 lg:px-12">
        <header className="mb-16 max-w-2xl">
          <p className="text-xs tracking-[0.3em] text-[var(--burgundy)] font-bold uppercase mb-3">למה לעבור</p>
          <h2 className="font-black leading-tight text-[var(--navy)]" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
            שלושה דברים שכבר<br />
            <span className="relative inline-block">
              <span className="relative z-10">לא תפספסו.</span>
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-[var(--gold)]/35 -z-0" />
            </span>
          </h2>
        </header>

        <div className="grid md:grid-cols-3 gap-px bg-[var(--navy)]/10">
          {items.map((it) => (
            <div key={it.kicker} className="bg-[var(--cream-soft)] p-8 lg:p-10">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-[5rem] leading-none font-black text-[var(--gold)]">{it.kicker}</span>
                <span className="h-px flex-1 bg-[var(--navy)]/15 mb-2" />
              </div>
              <h3 className="text-2xl font-black text-[var(--navy)] mb-3">{it.title}</h3>
              <p className="text-[var(--ink)]/75 leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Section: HowItWorks — vertical zigzag narrative
   ─────────────────────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    { title: "הזמנה", body: "מתקשרים אלינו, מתאמים תאריך ומקום. עמדה אחת או כמה — לפי כמות האורחים. שולחים את ההסכם בוואטסאפ." },
    { title: "הקמה", body: "ביום האירוע אנחנו מגיעים שעתיים לפני. מקימים, מחברים לרשת, ובודקים שהכל זורם. אתם פנויים לעניין החשוב." },
    { title: "המתנות זורמות", body: "כל אורח מעניק מתנה בקליק — סכום, ברכה, ושם. אם הוא רוצה תשלומים — גם זה אפשרי. רואים את הסכום שעלה בזמן אמת." },
    { title: "סוף הערב", body: "בסיום: לא ספירה ולא דאגות. כל הסכום עובר ישירות לחשבון הזוג. אנחנו אורזים את העמדה ויוצאים, בשקט." },
  ];

  return (
    <section id="how" className="relative py-24 lg:py-32 scroll-mt-24">
      <div className="container mx-auto px-6 lg:px-12">
        <header className="mb-20 max-w-3xl">
          <p className="text-xs tracking-[0.3em] text-[var(--burgundy)] font-bold uppercase mb-3">איך זה עובד</p>
          <h2 className="font-black leading-tight text-[var(--navy)]" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
            ארבעה צעדים. <br />
            <span className="text-[var(--gold)]">אחד עליכם, שלושה אצלנו.</span>
          </h2>
        </header>

        <div className="relative">
          {/* Vertical thread */}
          <div className="absolute right-6 md:right-1/2 top-2 bottom-2 w-px bg-[var(--gold)]/30 md:translate-x-[0.5px]" />

          <ol className="space-y-14 lg:space-y-20">
            {steps.map((step, i) => (
              <li key={i} className="relative pr-12 md:pr-0">
                {/* Step dot */}
                <span className="absolute right-6 md:right-1/2 top-2 md:-translate-x-1/2 -translate-x-[7px] w-3.5 h-3.5 rounded-full bg-[var(--burgundy)] ring-4 ring-[var(--cream)]" />

                <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                  <div className={`${i % 2 === 0 ? "md:order-2 md:pr-10" : "md:order-1 md:pl-10 md:text-left md:items-end"} flex flex-col`}>
                    <span
                      className="font-black text-[var(--navy)]/[0.08] leading-none"
                      style={{ fontSize: "clamp(6rem, 14vw, 12rem)" }}
                    >
                      0{i + 1}
                    </span>
                  </div>

                  <div className={`${i % 2 === 0 ? "md:order-1 md:pl-10 md:text-left" : "md:order-2 md:pr-10"}`}>
                    <h3 className="text-3xl lg:text-4xl font-black text-[var(--navy)] mb-3">{step.title}</h3>
                    <p className="text-lg text-[var(--ink)]/75 leading-relaxed max-w-md">{step.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Section: FeatureMosaic — asymmetric bento
   ─────────────────────────────────────────────────────────────────────────── */

function FeatureMosaic() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-[var(--cream-soft)] scroll-mt-24">
      <div className="container mx-auto px-6 lg:px-12">
        <header className="mb-16 max-w-2xl">
          <p className="text-xs tracking-[0.3em] text-[var(--burgundy)] font-bold uppercase mb-3">מה מקבלים</p>
          <h2 className="font-black leading-tight text-[var(--navy)]" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
            כל מה שצריך, <br />
            ואפס מה שלא.
          </h2>
        </header>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Large feature: secure */}
          <div className="col-span-12 md:col-span-7 bg-[var(--navy)] text-[var(--cream)] rounded-3xl p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden min-h-[360px]">
            <div>
              <p className="text-[var(--gold)] text-xs tracking-[0.3em] font-bold uppercase mb-3">אבטחה ברמת בנק</p>
              <h3 className="text-3xl lg:text-4xl font-black mb-4 leading-tight">
                כל אגורה<br />במקום שלה.
              </h3>
              <p className="text-[var(--cream)]/70 max-w-md leading-relaxed">
                סליקה מבוצעת ישירות מול חברת אשראי מורשית. שום מזומן עובר אצלנו, שום נתון של כרטיס לא נשמר אצלנו.
                המתנה עוברת מהאורח לחשבון הזוג. נקודה.
              </p>
            </div>
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-[var(--cream)]/15">
              <Stat big="100%" small="הצפנת SSL" />
              <Stat big="PCI-DSS" small="עמידה בתקן" />
              <Stat big="EMV" small="כרטיס חכם" />
            </div>
            <svg viewBox="0 0 200 200" className="absolute -bottom-12 -left-12 w-64 h-64 opacity-10">
              <circle cx="100" cy="100" r="80" stroke={BRAND.gold} strokeWidth="1" fill="none" />
              <circle cx="100" cy="100" r="60" stroke={BRAND.gold} strokeWidth="1" fill="none" />
              <circle cx="100" cy="100" r="40" stroke={BRAND.gold} strokeWidth="1" fill="none" />
            </svg>
          </div>

          {/* Speed */}
          <div className="col-span-12 md:col-span-5 bg-white rounded-3xl p-8 flex flex-col justify-between min-h-[240px]">
            <div>
              <p className="text-[var(--burgundy)] text-xs tracking-[0.3em] font-bold uppercase mb-3">מהירות</p>
              <h3 className="text-2xl font-black text-[var(--navy)] mb-2">מתנה ב-3 דקות.</h3>
              <p className="text-[var(--ink)]/70 text-sm">ממוצע אמיתי מאלפי עסקאות שעברו אצלנו.</p>
            </div>
            <p className="text-[6rem] leading-none font-black text-[var(--gold)] self-end -mb-3">
              3<span className="text-2xl text-[var(--ink)] mr-1">דק׳</span>
            </p>
          </div>

          {/* Installments */}
          <div className="col-span-12 md:col-span-5 bg-white rounded-3xl p-6 flex items-center gap-5 min-h-[120px]">
            <div className="w-14 h-14 rounded-full bg-[var(--burgundy)]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-black text-[var(--burgundy)] leading-none">+</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-[var(--navy)]">תשלומים? אין בעיה.</h3>
              <p className="text-sm text-[var(--ink)]/70">האורח מחלק את המתנה — עד 12 תשלומים.</p>
            </div>
          </div>

          {/* Nationwide */}
          <div className="col-span-12 md:col-span-7 bg-white rounded-3xl p-7">
            <p className="text-[var(--burgundy)] text-xs tracking-[0.3em] font-bold uppercase mb-3">פריסה ארצית</p>
            <h3 className="text-2xl font-black text-[var(--navy)] mb-3">מהדרום עד הגליל.</h3>
            <p className="text-[var(--ink)]/70 leading-relaxed mb-4">
              אולמות בכל הארץ עובדים איתנו. עמדה מגיעה לכל מקום — באר שבע, ירושלים, בני ברק, חיפה, צפת.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {["ירושלים", "בני ברק", "בית שמש", "אשדוד", "מודיעין עילית", "חיפה", "צפת", "באר שבע"].map((c) => (
                <span key={c} className="px-3 py-1 rounded-full bg-[var(--gold)]/10 text-[var(--ink)]">{c}</span>
              ))}
            </div>
          </div>

          {/* Blessings */}
          <div className="col-span-12 md:col-span-7 bg-[var(--gold)]/15 border border-[var(--gold)]/30 rounded-3xl p-7 relative overflow-hidden">
            <p className="text-[var(--burgundy)] text-xs tracking-[0.3em] font-bold uppercase mb-3">ברכות</p>
            <h3 className="text-2xl font-black text-[var(--navy)] mb-3">לא רק כסף — גם מילים.</h3>
            <p className="text-[var(--ink)]/75 leading-relaxed max-w-md">
              לכל מתנה מצרפים ברכה אישית, תמונה, וגם סרטון קצר. הזוג מקבל גלריה דיגיטלית מלאה — לזכר חיי הנישואין.
            </p>
            <svg className="absolute -bottom-2 -left-2 w-28 h-28 opacity-25" viewBox="0 0 100 100">
              <path d="M50 82 Q28 60 28 38 Q28 18 50 18 Q72 18 72 38 Q72 60 50 82 Z" fill={BRAND.burgundy} />
            </svg>
          </div>

          {/* Dashboard */}
          <div className="col-span-12 md:col-span-5 bg-white rounded-3xl p-7 flex flex-col justify-between min-h-[200px]">
            <div>
              <p className="text-[var(--burgundy)] text-xs tracking-[0.3em] font-bold uppercase mb-3">שליטה מלאה</p>
              <h3 className="text-2xl font-black text-[var(--navy)] mb-3">דשבורד בזמן אמת.</h3>
              <p className="text-[var(--ink)]/70 leading-relaxed text-sm">
                לזוג ולמנהל האירוע — מבט חי על כמה נכנס, ממי, ומה הברכות שצורפו.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Section: ForVenues
   ─────────────────────────────────────────────────────────────────────────── */

function ForVenues() {
  return (
    <section id="venues" className="bg-[var(--navy)] text-[var(--cream)] scroll-mt-24">
      <div className="container mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <header className="mb-14 max-w-2xl">
          <p className="text-xs tracking-[0.3em] text-[var(--gold)] font-bold uppercase mb-3">לבעלי אולמות</p>
          <h2 className="font-black leading-tight" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
            רוצים להציע<br />
            <span className="text-[var(--gold)]">שירות יוקרתי</span> בלי להחזיק עמדות?
          </h2>
          <p className="mt-6 text-lg text-[var(--cream)]/75 max-w-xl">
            אנחנו משכירים לכם עמדות לפי אירוע, לפי חודש, או על בסיס שותפות. אתם מציעים את השירות ללקוחות — אנחנו מטפלים בלוגיסטיקה.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[var(--cream)]/5 backdrop-blur border border-[var(--cream)]/10 rounded-3xl p-8 lg:p-10">
            <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
              <span className="text-[var(--gold)]">→</span>
              השכרה לפי אירוע
            </h3>
            <ul className="space-y-3 mb-6 text-[var(--cream)]/85">
              <ListBullet>עמדה אחת או כמה לפי כמות האורחים</ListBullet>
              <ListBullet>הקמה ופירוק — אנחנו</ListBullet>
              <ListBullet>תמיכה טכנית בזמן האירוע</ListBullet>
              <ListBullet>תמחור הוגן, ללא הפתעות</ListBullet>
            </ul>
            <a
              href="tel:02-3131700"
              className="inline-flex items-center gap-2 text-[var(--gold)] hover:text-[var(--gold-light)] font-bold border-b border-[var(--gold)]/40 pb-1"
            >
              לפרטים ומחירים →
            </a>
          </div>

          <div className="bg-[var(--burgundy)] rounded-3xl p-8 lg:p-10 relative overflow-hidden">
            <h3 className="text-2xl font-black mb-4 flex items-center gap-3 text-[var(--cream)]">
              <span className="text-[var(--gold-light)]">★</span>
              שותפות אסטרטגית
            </h3>
            <ul className="space-y-3 mb-6 text-[var(--cream)]/85">
              <ListBullet>עמדות קבועות באולם שלכם</ListBullet>
              <ListBullet>נתח מכל אירוע שעובר</ListBullet>
              <ListBullet>מיתוג משותף, שיווק משותף</ListBullet>
              <ListBullet>גישה מלאה לדשבורד אנליטיקה</ListBullet>
            </ul>
            <a
              href="tel:02-3131700"
              className="inline-flex items-center gap-2 text-[var(--gold-light)] hover:text-[var(--cream)] font-bold border-b border-[var(--gold-light)]/40 pb-1"
            >
              נדבר על שותפות →
            </a>
            <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[var(--gold)]/15" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Section: Numbers
   ─────────────────────────────────────────────────────────────────────────── */

function Numbers() {
  const numbers = [
    { figure: "₪3.2M", label: "בסליקה עברו בשנה האחרונה" },
    { figure: "1,200+", label: "אירועים שכבר התקיימו" },
    { figure: "97%", label: "מהאורחים סיימו תוך פחות מ-4 דקות" },
  ];
  return (
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <p className="text-xs tracking-[0.3em] text-[var(--burgundy)] font-bold uppercase mb-16 text-center">המספרים מדברים</p>
        <div className="grid md:grid-cols-3 gap-12 lg:gap-6 text-center">
          {numbers.map((n) => (
            <div key={n.label}>
              <p className="font-black text-[var(--navy)] leading-none" style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
                {n.figure}
              </p>
              <p className="mt-3 text-[var(--ink)]/65 text-sm max-w-[16rem] mx-auto">{n.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Section: Testimonial
   ─────────────────────────────────────────────────────────────────────────── */

function Testimonial() {
  return (
    <section className="py-24 lg:py-32 bg-[var(--cream-soft)]">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
        <span className="block text-[8rem] leading-none text-[var(--gold)] -mb-10 font-black" dir="ltr">”</span>
        <p className="text-2xl lg:text-4xl font-bold text-[var(--navy)] leading-snug relative z-10">
          הזמנו עמדה לחתונה של 600 אורחים, בערב אחד עברו 480 מתנות בלי שאף אחד הרגיש שהוא ממתין בתור.
          כשהגיע בוקר אחרי החתונה — כל הכסף כבר היה בחשבון. <span className="text-[var(--burgundy)]">בלי דאגות.</span>
        </p>
        <footer className="mt-8 flex items-center gap-4 text-[var(--ink)]/70">
          <div className="h-px w-12 bg-[var(--gold)]" />
          <span>
            <span className="font-black text-[var(--navy)]">משפחת לוי</span>
            <span className="mx-2">·</span>
            חתונה באולם "פאר ים", אשדוד
          </span>
        </footer>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Section: FAQ
   ─────────────────────────────────────────────────────────────────────────── */

function FAQ() {
  const items = [
    { q: "מה המחיר?", a: "המחיר משתנה לפי כמות אורחים, מספר עמדות, ואם זה אירוע חד-פעמי או שותפות מתמשכת. מומלץ להתקשר 02-3131700 לקבלת הצעת מחיר תוך 5 דקות." },
    { q: "האם צריך לחבר את העמדה לאינטרנט?", a: "העמדה עובדת על 4G מובנה. אם יש WiFi באולם — נשמח. אם אין — אנחנו מסתדרים." },
    { q: "מה קורה אם האורח טועה ומעניק פעמיים?", a: "כל מתנה נסלקת רק לאחר אישור מפורש. במקרה של טעות, ניתן לבטל באמצעות צוות התמיכה שלנו תוך 24 שעות." },
    { q: "האם המתנות נכנסות לחשבון של הזוג מיד?", a: "כן. כל מתנה זורמת ישירות לחשבון בנק של הזוג (בכפוף לזמני הסליקה של חברת האשראי — לרוב 1-3 ימי עסקים)." },
    { q: "האם אפשר לקבל ברכות עם המתנות?", a: "בוודאי. כל אורח יכול לצרף ברכה כתובה, תמונה, ואף סרטון קצר. הזוג מקבל את הכל בחבילה דיגיטלית לאחר האירוע." },
  ];

  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 lg:py-32 scroll-mt-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-[0.4fr_0.6fr] gap-12">
          <header>
            <p className="text-xs tracking-[0.3em] text-[var(--burgundy)] font-bold uppercase mb-3">שאלות נפוצות</p>
            <h2 className="font-black leading-tight text-[var(--navy)]" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
              לפני שאתם<br />
              <span className="text-[var(--gold)]">מתקשרים אלינו.</span>
            </h2>
            <p className="mt-4 text-[var(--ink)]/70">
              עוד שאלה?{" "}
              <a
                href="tel:02-3131700"
                className="text-[var(--burgundy)] font-bold border-b border-[var(--burgundy)]/50 hover:text-[var(--navy)]"
              >
                חייגו 02-3131700
              </a>
            </p>
          </header>

          <div className="space-y-3">
            {items.map((it, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="border-b border-[var(--navy)]/10 pb-2">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-right group"
                  >
                    <span
                      className={`text-lg font-bold transition-colors ${
                        isOpen ? "text-[var(--burgundy)]" : "text-[var(--navy)] group-hover:text-[var(--burgundy)]"
                      }`}
                    >
                      {it.q}
                    </span>
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        isOpen ? "bg-[var(--burgundy)] border-[var(--burgundy)] text-[var(--cream)] rotate-45" : "border-[var(--navy)]/30 text-[var(--navy)]"
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100 pb-4" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="text-[var(--ink)]/75 leading-relaxed pl-12">{it.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Section: Final CTA
   ─────────────────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section id="contact" className="relative py-24 lg:py-32 bg-[var(--navy-dark)] text-[var(--cream)] overflow-hidden scroll-mt-24">
      <div aria-hidden className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)] to-transparent" />
      <div
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 -right-32 w-96 h-96 rounded-full opacity-15"
        style={{ background: `radial-gradient(circle, ${BRAND.gold}, transparent 70%)` }}
      />

      <div className="container mx-auto px-6 lg:px-12 relative text-center max-w-3xl">
        <p className="text-xs tracking-[0.3em] text-[var(--gold)] font-bold uppercase mb-6">להזמנת עמדה</p>
        <h2 className="font-black leading-tight" style={{ fontSize: "clamp(2.6rem, 5vw, 4.5rem)" }}>
          זה הזמן <br />
          <span className="text-[var(--gold)]">לדבר איתנו.</span>
        </h2>
        <p className="mt-6 text-lg text-[var(--cream)]/75">
          תאמינו, אחרי האירוע שלכם — לא תרצו להחזיר את העמדה.
          <br />
          חייגו ונפתח לכם תאריך תוך 5 דקות.
        </p>

        <div className="mt-12 inline-flex flex-col items-center gap-3">
          <a
            href="tel:02-3131700"
            className="group inline-flex items-center gap-5 px-12 py-6 bg-[var(--gold)] text-[var(--navy-dark)] rounded-full transition-all hover:bg-[var(--gold-light)] hover:scale-[1.02]"
          >
            <span className="text-3xl lg:text-4xl font-black">02-3131700</span>
            <span aria-hidden className="text-2xl">←</span>
          </a>
          <a href="mailto:g023131700@gmail.com" className="text-sm text-[var(--cream)]/60 hover:text-[var(--gold-light)] transition-colors">
            g023131700@gmail.com
          </a>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Footer
   ─────────────────────────────────────────────────────────────────────────── */

function SiteFooter() {
  return (
    <footer className="bg-[var(--navy)] text-[var(--cream)]/60 py-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 text-sm">
          <div>
            <p className="text-[var(--cream)] font-black text-lg mb-1">בשמחות פלוס</p>
            <p>נותנים מתנה בקליק</p>
            <p className="text-xs mt-2 text-[var(--cream)]/40">מופעל ע״י עמדות נדרים פלוס</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <a href="#how" className="hover:text-[var(--gold)]">איך זה עובד</a>
            <a href="#features" className="hover:text-[var(--gold)]">מה מקבלים</a>
            <a href="#venues" className="hover:text-[var(--gold)]">בעלי אולמות</a>
            <a href="#faq" className="hover:text-[var(--gold)]">שאלות נפוצות</a>
            <a href="#contact" className="hover:text-[var(--gold)]">צור קשר</a>
            <Link to="/access" className="hover:text-[var(--gold)]">כניסה למערכת</Link>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--cream)]/10 text-xs text-[var(--cream)]/40 flex flex-col md:flex-row justify-between gap-3">
          <span>© {new Date().getFullYear()} בשמחות פלוס. כל הזכויות שמורות.</span>
          <span>02-3131700 · g023131700@gmail.com</span>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Decorative + reused bits
   ─────────────────────────────────────────────────────────────────────────── */

function HeroCard() {
  return (
    <div className="relative h-[460px] lg:h-[560px] flex items-center justify-center">
      <div className="relative w-[300px] lg:w-[360px]" style={{ transform: "rotate(-8deg)" }}>
        {/* Credit card */}
        <div
          className="relative aspect-[1.586/1] rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyDark} 100%)`,
            boxShadow: "0 30px 60px -20px rgba(0,0,0,0.4), 0 18px 36px -18px rgba(11,31,74,0.5)",
          }}
        >
          {/* Chip */}
          <div
            className="absolute top-7 right-7 w-11 h-8 rounded-md"
            style={{
              background: `linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldLight} 50%, ${BRAND.gold} 100%)`,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            <div className="absolute inset-1 grid grid-cols-2 grid-rows-2 gap-px opacity-50" style={{ background: BRAND.navyDark }} />
          </div>
          {/* Contactless icon */}
          <div className="absolute top-9 right-24 text-[var(--gold)] opacity-80">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 4 Q14 12 8 20" />
              <path d="M12 6 Q16 12 12 18" />
              <path d="M16 8 Q18 12 16 16" />
            </svg>
          </div>
          {/* Card number */}
          <div className="absolute bottom-20 right-7 left-7 font-mono text-[var(--cream)] text-lg tracking-widest" dir="ltr">
            1234 5678 9012 3456
          </div>
          {/* Brand mark */}
          <div className="absolute bottom-7 right-7">
            <span className="text-[var(--gold)] font-black text-sm tracking-wider">בשמחות+</span>
            <p className="text-[var(--cream)]/60 text-[10px] mt-0.5">מתנה. בקליק.</p>
          </div>
          {/* Foil */}
          <div
            className="absolute bottom-7 left-7 w-10 h-7 rounded-sm opacity-40"
            style={{ background: `linear-gradient(45deg, ${BRAND.gold}, ${BRAND.goldLight}, ${BRAND.gold})` }}
          />
        </div>

        <Ribbon />

        {/* Floating heart */}
        <div className="absolute -top-8 -left-8 w-16 h-16 flex items-center justify-center bg-[var(--cream)] rounded-full shadow-lg">
          <svg viewBox="0 0 32 32" className="w-7 h-7" fill={BRAND.burgundy}>
            <path d="M16 28 C 6 20, 4 12, 10 8 C 13 6, 16 8, 16 11 C 16 8, 19 6, 22 8 C 28 12, 26 20, 16 28 Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Ribbon() {
  return (
    <div aria-hidden className="absolute -top-12 left-1/2 -translate-x-1/2 w-full pointer-events-none">
      <svg viewBox="0 0 200 120" className="w-full">
        <ellipse cx="100" cy="80" rx="14" ry="10" fill={BRAND.gold} stroke={BRAND.navyDark} strokeWidth="0.4" />
        <path d="M86 78 Q 50 35, 30 55 Q 25 75, 60 85 Q 78 85, 86 80 Z" fill={BRAND.gold} stroke={BRAND.navyDark} strokeWidth="0.4" />
        <path d="M114 78 Q 150 35, 170 55 Q 175 75, 140 85 Q 122 85, 114 80 Z" fill={BRAND.gold} stroke={BRAND.navyDark} strokeWidth="0.4" />
        <path d="M92 88 Q 75 105, 70 118 L 90 118 L 100 90 Z" fill={BRAND.goldLight} stroke={BRAND.navyDark} strokeWidth="0.4" />
        <path d="M108 88 Q 125 105, 130 118 L 110 118 L 100 90 Z" fill={BRAND.gold} stroke={BRAND.navyDark} strokeWidth="0.4" />
        <ellipse cx="100" cy="78" rx="6" ry="4" fill={BRAND.goldLight} opacity="0.6" />
      </svg>
    </div>
  );
}

function GoldSwoosh() {
  return (
    <svg viewBox="0 0 320 30" preserveAspectRatio="none" className="absolute -bottom-3 right-0 w-full h-4">
      <path d="M 4 22 Q 80 4, 160 14 T 316 8" stroke={BRAND.gold} strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Quickbit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 h-7 rounded-full bg-[var(--gold)]/15 text-[var(--burgundy)] flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div>
      <p className="text-[var(--gold)] font-black text-lg">{big}</p>
      <p className="text-[var(--cream)]/60 text-xs mt-0.5">{small}</p>
    </div>
  );
}

function ListBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] mt-2.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function SparkleField() {
  const sparkleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sparkleRef.current) return;
    const container = sparkleRef.current;
    container.innerHTML = "";
    const count = 18;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("span");
      dot.className = "absolute rounded-full pointer-events-none";
      dot.style.cssText = `
        width: ${2 + Math.random() * 3}px;
        height: ${2 + Math.random() * 3}px;
        background: ${BRAND.gold};
        opacity: ${0.25 + Math.random() * 0.45};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        box-shadow: 0 0 ${4 + Math.random() * 8}px ${BRAND.gold};
        animation: bsmHomeSparkle ${3 + Math.random() * 4}s ease-in-out infinite;
        animation-delay: ${Math.random() * 5}s;
      `;
      container.appendChild(dot);
    }
  }, []);
  return (
    <>
      <div ref={sparkleRef} className="absolute inset-0" />
      <style>{`
        @keyframes bsmHomeSparkle {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 1; }
        }
      `}</style>
    </>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}
function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 22s8-7.58 8-13a8 8 0 1 0-16 0c0 5.42 8 13 8 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
