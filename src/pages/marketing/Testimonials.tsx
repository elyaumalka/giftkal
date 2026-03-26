import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Quote, TrendingUp, Users, Award } from "lucide-react";

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
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);
  return { count, start: () => setStarted(true) };
};

const testimonials = [
  {
    text: "קיבלנו הרבה יותר ממה שציפינו — והכל היה מסודר במקום אחד. פשוט מדהים",
    name: "יעל ודני",
    event: "חתונה",
    rating: 5,
  },
  {
    text: "האורחים אהבו את הנוחות, ואנחנו אהבנו לראות הכל בלייב",
    name: "שרה ומשה",
    event: "חתונה",
    rating: 5,
  },
  {
    text: "זה הוריד לנו המון לחץ — וידענו בדיוק כמה כסף נכנס בכל רגע",
    name: "משפחת לוי",
    event: "בר מצווה",
    rating: 5,
  },
  {
    text: "העמדה באולם הייתה גאונית. גם מי שלא הביא מזומן — שלח מתנה",
    name: "רחל ויוסי",
    event: "חתונה",
    rating: 5,
  },
  {
    text: "הזמנות + אישורי הגעה עשו לנו סדר מטורף. חסכו לנו שעות של טלפונים",
    name: "משפחת כהן",
    event: "ברית",
    rating: 5,
  },
  {
    text: "מערכת פשוטה, נוחה ומדויקת. כל מי שמתכנן אירוע חייב את זה",
    name: "תמר ואבי",
    event: "חתונה",
    rating: 5,
  },
];

const TestimonialCard = ({ t, delay }: { t: typeof testimonials[0]; delay: number }) => {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`bg-card rounded-2xl p-8 shadow-lg border border-border/50 hover:shadow-xl transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Quote className="w-8 h-8 text-primary/30 mb-4" />
      <p className="text-foreground text-lg leading-relaxed mb-6">"{t.text}"</p>
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: t.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>
      <div>
        <p className="font-bold text-secondary">{t.name}</p>
        <p className="text-sm text-muted-foreground">{t.event}</p>
      </div>
    </div>
  );
};

const Testimonials = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const satisfactionCounter = useCounter(49, 1500);
  const eventsCounter = useCounter(2500, 2000);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsVisible) {
          setStatsVisible(true);
          satisfactionCounter.start();
          eventsCounter.start();
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [statsVisible]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-secondary via-secondary/95 to-secondary/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(149,116,47,0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            אלפי בעלי אירועים כבר עברו ל-<span className="text-primary">GiftKal</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            והם לא חוזרים אחורה
          </p>
        </div>
      </section>

      {/* המלצות */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} t={t} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* מספרים */}
      <section ref={statsRef} className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">📊</span>
            <h2 className="text-3xl font-bold text-secondary">המספרים מדברים</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 text-center shadow-lg border border-border/50">
              <Star className="w-10 h-10 text-primary mx-auto mb-4" />
              <div className="text-4xl font-black text-secondary mb-2">
                {(satisfactionCounter.count / 10).toFixed(1)}/5
              </div>
              <p className="text-muted-foreground">שביעות רצון</p>
            </div>
            <div className="bg-card rounded-2xl p-8 text-center shadow-lg border border-border/50">
              <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
              <div className="text-4xl font-black text-secondary mb-2">+35%</div>
              <p className="text-muted-foreground">יותר מתנות בממוצע</p>
            </div>
            <div className="bg-card rounded-2xl p-8 text-center shadow-lg border border-border/50">
              <Users className="w-10 h-10 text-primary mx-auto mb-4" />
              <div className="text-4xl font-black text-secondary mb-2">
                {eventsCounter.count.toLocaleString()}+
              </div>
              <p className="text-muted-foreground">אירועים השתמשו</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-secondary to-secondary/95">
        <div className="container mx-auto px-4 text-center">
          <span className="text-5xl mb-6 block">🎉</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            רוצים גם חוויה כזאת?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
            פתחו אירוע עכשיו ותתחילו לקבל מתנות בצורה חכמה
          </p>
          <Link to="/access">
            <Button variant="gold" size="lg" className="text-lg px-12 py-6">
              התחילו עכשיו
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Testimonials;
