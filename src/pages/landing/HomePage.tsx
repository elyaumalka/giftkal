import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Smartphone, Zap, BarChart3, Gift, Building2, Heart,
  Send, CheckCircle2, TrendingUp, Star, Users, Monitor, ArrowLeft,
  Gem, Inbox, Target, Quote, Wallet
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

const FeatureCard = ({ icon: Icon, text, delay = 0 }: { icon: any; text: string; delay?: number }) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`flex items-start gap-3 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="text-foreground/80 text-sm leading-relaxed pt-2">{text}</p>
    </div>
  );
};

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-b from-secondary via-secondary/95 to-secondary/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(149,116,47,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(149,116,47,0.1),transparent_50%)]" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            מנהלים אירוע חכם —<br />
            <span className="text-primary">ומקבלים יותר מתנות</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-4 leading-relaxed">
            מתנות באשראי, ניהול תקציב והזמנות חכמות<br />
            הכל במקום אחד — לכל סוגי האירועים
          </p>

          {/* שורת אמון */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["חתונות", "בר מצוות", "בריתות", "אירועי חברה"].map(t => (
              <span key={t} className="text-white/40 text-sm border border-white/10 rounded-full px-4 py-1">{t}</span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/access">
              <Button variant="gold" size="lg" className="text-lg px-10 py-6">
                <Gift className="w-5 h-5 ml-2" />
                פתחו אירוע עכשיו
              </Button>
            </Link>
            <Link to="/venues-page">
              <Button size="lg" className="text-lg px-10 py-6 bg-transparent border-2 border-white/30 text-white hover:bg-white/10">
                <Building2 className="w-5 h-5 ml-2" />
                אני בעל אולם
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center mt-16 cursor-pointer group" onClick={() => document.getElementById("audience-split")?.scrollIntoView({ behavior: "smooth" })}>
          <span className="text-white/40 text-sm mb-3 group-hover:text-white/60 transition-colors">גללו למטה</span>
          <div className="relative w-10 h-16 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════ פיצול קהלים ═══════════ */}
      <section id="audience-split" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="🎯" title='למי GiftKal מתאים?' />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* בעלי אירועים */}
            <AudienceCard
              icon={Heart}
              emoji="💍"
              title="לבעלי אירועים"
              features={["קבלו יותר מתנות", "נהלו את התקציב", "שלחו הזמנות בקלות"]}
              cta="לעמוד בעלי אירועים"
              link="/event-owners"
              delay={0}
            />
            {/* בעלי אולמות */}
            <AudienceCard
              icon={Building2}
              emoji="🏛️"
              title="לבעלי אולמות"
              features={["שדרגו את השירות ללקוחות", "קבלו לידים מתוך האולם", "נהלו פניות בצורה מסודרת"]}
              cta="לעמוד בעלי אולמות"
              link="/venues-page"
              delay={150}
            />
          </div>
        </div>
      </section>

      {/* ═══════════ למה זה עובד ═══════════ */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="💰" title="כי כשקל לתת — נותנים יותר" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-10">
            <IconCard icon={CreditCard} title="תשלום באשראי" desc="במקום מזומן — נוח ומוגדל" delay={0} />
            <IconCard icon={Smartphone} title="מכל מקום" desc="שליחת מתנה מהבית, מהעבודה, מכל מקום" delay={100} />
            <IconCard icon={Zap} title="תהליך פשוט ומהיר" desc="תוך שניות האורח שולח מתנה" delay={200} />
          </div>
          <p className="text-center text-xl font-bold text-primary">👈 התוצאה: יותר מתנות, פחות התעסקות</p>
        </div>
      </section>

      {/* ═══════════ איך זה עובד ═══════════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="⚡" title="איך זה עובד" subtitle="פשוט, מהיר, עובד" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: "1", icon: Users, text: "פותחים אירוע / מצטרפים כאולם" },
              { step: "2", icon: Send, text: "מקבלים קישור או עמדת מתנות" },
              { step: "3", icon: Gift, text: "משתמשים במהלך האירוע" },
              { step: "4", icon: Wallet, text: "מקבלים כסף / לידים" },
            ].map((s, i) => {
              const { ref, inView } = useInView();
              return (
                <div key={i} ref={ref} className={`text-center transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 relative">
                    <s.icon className="w-7 h-7 text-primary" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">{s.step}</span>
                  </div>
                  <p className="text-sm text-foreground/80 font-medium">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ טיזר אולמות ═══════════ */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-4xl mb-4 block">🏛️</span>
              <h2 className="text-3xl font-bold text-secondary mb-4">האולם שלכם יכול לעשות יותר</h2>
              <div className="space-y-4 mb-8">
                <FeatureCard icon={Gem} text="חוויית שירות מתקדמת ללקוחות" delay={0} />
                <FeatureCard icon={Inbox} text="קבלת לידים מתוך האירועים עצמם" delay={100} />
                <FeatureCard icon={BarChart3} text="מערכת לניהול כל הפניות במקום אחד" delay={200} />
              </div>
              <Link to="/venues-page">
                <Button variant="outline" size="lg">
                  <ArrowLeft className="w-5 h-5 ml-2" />
                  קראו עוד לאולמות
                </Button>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="w-72 h-72 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <Building2 className="w-24 h-24 text-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ טיזר בעלי אירועים ═══════════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="hidden md:flex items-center justify-center order-2 md:order-1">
              <div className="w-72 h-72 rounded-3xl bg-gradient-to-br from-primary/10 to-pink-500/10 flex items-center justify-center">
                <Heart className="w-24 h-24 text-primary/30" />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="text-4xl mb-4 block">💍</span>
              <h2 className="text-3xl font-bold text-secondary mb-4">האירוע שלכם — בשליטה מלאה</h2>
              <div className="space-y-4 mb-8">
                <FeatureCard icon={CreditCard} text="מתנות באשראי — נוח לאורחים ורווחי לכם" delay={0} />
                <FeatureCard icon={Send} text="הזמנות ואישורי הגעה — סדר מלא" delay={100} />
                <FeatureCard icon={BarChart3} text="ניהול תקציב — שליטה בכל שקל" delay={200} />
              </div>
              <Link to="/event-owners">
                <Button variant="outline" size="lg">
                  <ArrowLeft className="w-5 h-5 ml-2" />
                  קראו עוד לבעלי אירועים
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ יתרונות (טעימה) ═══════════ */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="💎" title="יתרונות מרכזיים" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-10">
            {[
              { icon: Wallet, text: "יותר מתנות", emoji: "💰" },
              { icon: BarChart3, text: "שליטה מלאה", emoji: "📊" },
              { icon: Zap, text: "נוחות לאורחים", emoji: "⚡" },
              { icon: Target, text: "חוויית אירוע מתקדמת", emoji: "🎯" },
            ].map((item, i) => {
              const { ref, inView } = useInView();
              return (
                <div key={i} ref={ref} className={`bg-card rounded-2xl p-6 text-center shadow-lg border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <span className="text-3xl block mb-3">{item.emoji}</span>
                  <p className="font-bold text-secondary text-sm">{item.text}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Link to="/benefits">
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-5 h-5 ml-2" />
                לכל היתרונות
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ טיזר מחירים ═══════════ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="💰" title="פשוט, ברור, משתלם" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
            {[
              { title: "מתנות באשראי", price: "₪199", icon: CreditCard },
              { title: "עמדת מתנות", price: "₪99", icon: Monitor, badge: "מומלץ" },
              { title: "הזמנות + אישורים", price: "₪199", icon: Send },
              { title: "ניהול תקציב", price: "חינם", icon: BarChart3 },
            ].map((p, i) => {
              const { ref, inView } = useInView();
              return (
                <div key={i} ref={ref} className={`relative bg-card rounded-2xl p-6 text-center shadow-lg border border-border/50 hover:shadow-xl transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  {p.badge && (
                    <span className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full">{p.badge}</span>
                  )}
                  <p.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">{p.title}</p>
                  <p className="text-2xl font-black text-secondary">{p.price}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-5 h-5 ml-2" />
                לכל המחירים
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ המלצות (טעימה) ═══════════ */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="💬" title="מה הלקוחות אומרים" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {[
              "קיבלנו יותר מתנות ממה שציפינו — הכל היה מסודר במקום אחד",
              "הכל היה נוח ומסודר. האורחים פשוט אהבו את זה",
              "האורחים עפו על זה — גם מי שלא הביא מזומן שלח מתנה",
            ].map((text, i) => {
              const { ref, inView } = useInView();
              return (
                <div key={i} ref={ref} className={`bg-card rounded-2xl p-6 shadow-lg border border-border/50 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <Quote className="w-6 h-6 text-primary/30 mb-3" />
                  <p className="text-foreground text-sm leading-relaxed mb-4">"{text}"</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Link to="/testimonials-page">
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-5 h-5 ml-2" />
                לכל ההמלצות
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA סופי ═══════════ */}
      <section className="py-24 bg-gradient-to-b from-secondary to-secondary/95">
        <div className="container mx-auto px-4 text-center">
          <span className="text-5xl mb-6 block">🚀</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            מוכנים לשדרג את האירוע שלכם?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
            פתחו אירוע עכשיו ותתחילו לקבל מתנות בצורה חכמה
          </p>
          <Link to="/access">
            <Button variant="gold" size="lg" className="text-lg px-12 py-7">
              <Gift className="w-5 h-5 ml-2" />
              התחילו עכשיו
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

/* ─── Sub-components ─── */

const SectionTitle = ({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`text-center mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <span className="text-4xl mb-4 block">{emoji}</span>
      <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">{title}</h2>
      {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
};

const AudienceCard = ({ icon: Icon, emoji, title, features, cta, link, delay }: {
  icon: any; emoji: string; title: string; features: string[]; cta: string; link: string; delay: number;
}) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`bg-card rounded-2xl p-8 shadow-xl border border-border/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${delay}ms` }}>
      <span className="text-4xl block mb-4">{emoji}</span>
      <h3 className="text-2xl font-bold text-secondary mb-5">{title}</h3>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-foreground/80">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link to={link}>
        <Button variant="gold" className="w-full">
          <ArrowLeft className="w-4 h-4 ml-2" />
          {cta}
        </Button>
      </Link>
    </div>
  );
};

const IconCard = ({ icon: Icon, title, desc, delay = 0 }: { icon: any; title: string; desc: string; delay?: number }) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`bg-card rounded-2xl p-6 text-center shadow-lg border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-bold text-secondary mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm">{desc}</p>
    </div>
  );
};

export default HomePage;
