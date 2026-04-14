import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Send, BarChart3, Monitor, Gift, Zap, Star,
  MessageCircle, Sparkles, CheckCircle2, UserPlus, Wallet
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

const ServiceCard = ({ icon: Icon, title, desc, price, badge, delay }: {
  icon: any; title: string; desc: string; price: string; badge?: string; delay: number;
}) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`relative bg-card rounded-2xl p-6 text-center shadow-lg border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${delay}ms` }}>
      {badge && <span className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full">{badge}</span>}
      <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
      <h3 className="font-bold text-secondary mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-2">{desc}</p>
      <p className="text-2xl font-black text-primary">{price}</p>
    </div>
  );
};

const TestimonialCard = ({ text, name, event }: { text: string; name: string; event: string }) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`bg-card rounded-2xl p-6 shadow-lg border border-border/50 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, j) => (
          <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
        ))}
      </div>
      <p className="text-foreground text-sm leading-relaxed mb-4">"{text}"</p>
      <p className="text-sm font-bold text-secondary">{name}</p>
      <p className="text-xs text-muted-foreground">{event}</p>
    </div>
  );
};

const EventOwnersPage = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-secondary via-secondary/95 to-secondary/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(149,116,47,0.2),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">מערכת ניהול אירועים חכמה</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            נהלו את האירוע שלכם<br />
            <span className="text-primary">וקבלו יותר מתנות</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
            מתנות באשראי, הזמנות חכמות וניהול תקציב — הכל במקום אחד
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="gold" size="lg" className="text-lg px-10 py-6">
                <Gift className="w-5 h-5 ml-2" />
                פתחו אירוע עכשיו
              </Button>
            </Link>
            <a href="https://wa.me/97223131700?text=היי, אשמח לשמוע פרטים על GiftKal לאירוע שלי" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-lg px-10 py-6 bg-transparent border-2 border-white/30 text-white hover:bg-white/10">
                <MessageCircle className="w-5 h-5 ml-2" />
                דברו עם נציג
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* שירותים */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">💡</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">מה מקבלים?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <ServiceCard icon={CreditCard} title="מתנות באשראי" desc="גביייה מאובטחת מכל מקום" price="₪199" delay={0} />
            <ServiceCard icon={Monitor} title="עמדת מתנות באולם" desc="עמדת טאץ' פיזית באירוע" price="₪99" badge="מומלץ" delay={80} />
            <ServiceCard icon={Send} title="הזמנות דיגיטליות" desc="שליחה + אישורי הגעה" price="₪199" delay={160} />
            <ServiceCard icon={BarChart3} title="ניהול תקציב" desc="שליטה בכל שקל" price="חינם" delay={240} />
          </div>
        </div>
      </section>

      {/* איך זה עובד */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">⚡</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">איך זה עובד?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
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
          <div className="text-center mt-10">
            <p className="text-lg font-bold text-primary">👈 כשקל לתת — נותנים יותר</p>
          </div>
        </div>
      </section>

      {/* המלצות */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">💬</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">מה הלקוחות אומרים</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <TestimonialCard text="קיבלנו יותר מתנות ממה שציפינו — הכל היה מסודר" name="יעל ודני" event="חתונה" />
            <TestimonialCard text="האורחים אהבו את הנוחות. גם מי שלא הביא מזומן שלח מתנה" name="רחל ויוסי" event="חתונה" />
            <TestimonialCard text="ההזמנות + אישורי הגעה עשו לנו סדר מטורף" name="משפחת כהן" event="ברית" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-secondary to-secondary/95">
        <div className="container mx-auto px-4 text-center">
          <span className="text-5xl mb-6 block">🚀</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            מוכנים לשדרג את האירוע?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
            פתחו אירוע עכשיו או דברו עם נציג
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="gold" size="lg" className="text-lg px-12 py-7">
                <Gift className="w-5 h-5 ml-2" />
                פתחו אירוע עכשיו
              </Button>
            </Link>
            <a href="https://wa.me/97223131700?text=היי, אשמח לשמוע פרטים על GiftKal לאירוע שלי" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-lg px-12 py-7 bg-white/10 border-2 border-white/30 text-white hover:bg-white/20">
                <MessageCircle className="w-5 h-5 ml-2" />
                דברו עם נציג
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventOwnersPage;
