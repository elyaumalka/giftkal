import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Smartphone, Zap, BarChart3, Gift, Building2, Heart,
  Send, CheckCircle2, Star, Users, Monitor, ArrowLeft,
  Gem, Inbox, Target, Quote, Wallet, LogIn, Phone, MessageCircle, UserPlus
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

/* ─── Extracted components to avoid hooks in .map() ─── */

const ServiceCard = ({ icon: Icon, title, desc, price, badge, delay }: {
  icon: any; title: string; desc: string; price: string; badge?: string; delay: number;
}) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`relative bg-card rounded-2xl p-5 text-center shadow-lg border border-border/50 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${delay}ms` }}>
      {badge && <span className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full">{badge}</span>}
      <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
      <p className="font-bold text-secondary text-sm mb-1">{title}</p>
      <p className="text-muted-foreground text-xs mb-2">{desc}</p>
      <p className="text-lg font-black text-primary">{price}</p>
    </div>
  );
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

const TestimonialCard = ({ text, delay }: { text: string; delay: number }) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`bg-card rounded-2xl p-6 shadow-lg border border-border/50 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${delay}ms` }}>
      <Quote className="w-6 h-6 text-primary/30 mb-3" />
      <p className="text-foreground text-sm leading-relaxed mb-4">"{text}"</p>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, j) => (
          <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
        ))}
      </div>
    </div>
  );
};

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

const ActionCard = ({ emoji, title, desc, onClick }: {
  emoji: string; title: string; desc: string; onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15 text-center hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
  >
    <span className="text-3xl block mb-2">{emoji}</span>
    <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
    <p className="text-white/50 text-xs">{desc}</p>
  </div>
);

/* ─── Main Page ─── */

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-b from-secondary via-secondary/95 to-secondary/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(149,116,47,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(149,116,47,0.1),transparent_50%)]" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            המתנה המושלמת<br />
            <span className="text-primary">לכל אירוע</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
            מערכת חכמה לגביית מתנות באשראי, ניהול אירועים והזמנות דיגיטליות
          </p>

          {/* 4 כפתורי פעולה ישירים */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <ActionCard
              emoji="💍"
              title="בעלי אירועים"
              desc="פתחו אירוע וקבלו מתנות"
              onClick={() => document.getElementById("event-owners")?.scrollIntoView({ behavior: "smooth" })}
            />
            <ActionCard
              emoji="🏛️"
              title="בעלי אולמות"
              desc="שדרגו את השירות ללקוחות"
              onClick={() => document.getElementById("venue-owners")?.scrollIntoView({ behavior: "smooth" })}
            />
            <Link to="/gift-search" className="block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15 text-center hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                <span className="text-3xl block mb-2">🎁</span>
                <h3 className="text-white font-bold text-sm mb-1">שליחת מתנה</h3>
                <p className="text-white/50 text-xs">שלחו מתנה לאירוע</p>
              </div>
            </Link>
            <Link to="/access" className="block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15 text-center hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                <LogIn className="w-7 h-7 text-primary mx-auto mb-2" />
                <h3 className="text-white font-bold text-sm mb-1">כניסה למערכת</h3>
                <p className="text-white/50 text-xs">ניהול האירוע שלכם</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ בעלי אירועים ═══════════ */}
      <section id="event-owners" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="💍" title="בעלי אירועים" subtitle="כל מה שצריך לאירוע מושלם — במקום אחד" />
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <ServiceCard icon={CreditCard} title="מתנות באשראי" desc="גבייה מאובטחת מכל מקום" price="₪199" delay={0} />
              <ServiceCard icon={Monitor} title="עמדת מתנות" desc="עמדה פיזית באולם" price="₪99" badge="מומלץ" delay={80} />
              <ServiceCard icon={Send} title="הזמנות דיגיטליות" desc="הזמנות + אישורי הגעה" price="₪199" delay={160} />
              <ServiceCard icon={BarChart3} title="ניהול תקציב" desc="שליטה בכל שקל" price="חינם" delay={240} />
            </div>

            {/* איך זה עובד */}
            <div className="bg-secondary/5 rounded-3xl p-8 mb-10">
              <h3 className="text-xl font-bold text-secondary text-center mb-8">⚡ איך זה עובד?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { step: "1", icon: UserPlus, text: "נרשמים ופותחים אירוע" },
                  { step: "2", icon: Send, text: "מקבלים קישור מתנות אישי" },
                  { step: "3", icon: Gift, text: "האורחים שולחים מתנות" },
                  { step: "4", icon: Wallet, text: "הכסף מגיע ישירות אליכם" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 relative">
                      <s.icon className="w-6 h-6 text-primary" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{s.step}</span>
                    </div>
                    <p className="text-sm text-foreground/80 font-medium">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="gold" size="lg" className="text-lg px-10 py-6">
                  <Gift className="w-5 h-5 ml-2" />
                  פתחו אירוע עכשיו
                </Button>
              </Link>
              <a href="https://wa.me/97223131700?text=היי, אשמח לשמוע פרטים על GiftKal לאירוע שלי" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-lg px-10 py-6">
                  <MessageCircle className="w-5 h-5 ml-2" />
                  דברו עם נציג
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ בעלי אולמות ═══════════ */}
      <section id="venue-owners" className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="🏛️" title="בעלי אולמות" subtitle="שדרגו את חוויית האירוע ללקוחות שלכם" />

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <BenefitCard icon={Gem} title="חוויית שירות מתקדמת" desc="עמדת מתנות דיגיטלית לכל אירוע — מותאמת לבראנד של האולם" delay={0} />
              <BenefitCard icon={Inbox} title="לידים מתוך האירועים" desc="כל אורח שנותן מתנה הוא ליד פוטנציאלי לאירוע הבא שלו" delay={100} />
              <BenefitCard icon={BarChart3} title="ניהול פניות מסודר" desc="מערכת מרכזית לניהול כל הפניות והלידים שמגיעים מהאולם" delay={200} />
            </div>

            <div className="bg-card rounded-3xl p-8 shadow-xl border border-primary/20 text-center mb-10 max-w-md mx-auto">
              <p className="text-muted-foreground mb-2">עלות הצטרפות לאולם</p>
              <p className="text-5xl font-black text-primary mb-2">₪0</p>
              <p className="text-sm text-muted-foreground">ללא עלות — אתם רק מרוויחים</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://wa.me/97223131700?text=היי, אשמח לשמוע פרטים על GiftKal לאולם שלי" target="_blank" rel="noopener noreferrer">
                <Button variant="gold" size="lg" className="text-lg px-10 py-6">
                  <MessageCircle className="w-5 h-5 ml-2" />
                  דברו עם נציג
                </Button>
              </a>
              <a href="tel:+97223131700">
                <Button size="lg" variant="outline" className="text-lg px-10 py-6">
                  <Phone className="w-5 h-5 ml-2" />
                  02-3131700
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ המלצות ═══════════ */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="💬" title="מה הלקוחות אומרים" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <TestimonialCard text="קיבלנו יותר מתנות ממה שציפינו — הכל היה מסודר במקום אחד" delay={0} />
            <TestimonialCard text="הכל היה נוח ומסודר. האורחים פשוט אהבו את זה" delay={100} />
            <TestimonialCard text="האורחים עפו על זה — גם מי שלא הביא מזומן שלח מתנה" delay={200} />
          </div>
        </div>
      </section>

      {/* ═══════════ CTA סופי ═══════════ */}
      <section className="py-24 bg-gradient-to-b from-secondary to-secondary/95">
        <div className="container mx-auto px-4 text-center">
          <span className="text-5xl mb-6 block">🚀</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            מוכנים להתחיל?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
            פתחו אירוע או דברו עם נציג — הצטרפות פשוטה ומהירה
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="gold" size="lg" className="text-lg px-12 py-7">
                <Gift className="w-5 h-5 ml-2" />
                פתחו אירוע עכשיו
              </Button>
            </Link>
            <Link to="/access">
              <Button size="lg" className="text-lg px-12 py-7 bg-white/10 border-2 border-white/30 text-white hover:bg-white/20">
                <LogIn className="w-5 h-5 ml-2" />
                כניסה למערכת
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
