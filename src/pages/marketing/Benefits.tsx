import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Smartphone, Zap, BarChart3, MessageCircle, TrendingUp,
  Shield, Monitor, Send, Clock, CheckCircle2, Lock, Eye, Wallet,
  Gift, Users, Star, ArrowLeft, MapPin, Heart
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

const SectionTitle = ({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`text-center mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <span className="text-4xl mb-4 block">{emoji}</span>
      <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">{title}</h2>
      {subtitle && <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: { icon: any; title: string; description: string; delay?: number }) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`bg-card rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-secondary mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const Benefits = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-secondary via-secondary/95 to-secondary/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(149,116,47,0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            למה כולם עוברים ל-<span className="text-primary">GiftKal</span>?
          </h1>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            כי אירוע חכם הוא אירוע שמכניס יותר כסף, פחות לחץ ויותר שליטה
          </p>
        </div>
      </section>

      {/* יתרון מרכזי - יותר מתנות */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="💰" title="פשוט מקבלים יותר מתנות" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-10">
            <FeatureCard icon={CreditCard} title="תשלום באשראי" description="במקום מזומן — נוח, מהיר ומוגדל" delay={0} />
            <FeatureCard icon={Smartphone} title="מכל מקום" description="אפשרות לשלוח מתנה מהבית, מהעבודה, מכל מקום" delay={100} />
            <FeatureCard icon={Zap} title="תהליך קל ומהיר" description="תוך כמה שניות האורח שולח מתנה — בלי חיכוך" delay={200} />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">👈 כשקל לתת — נותנים יותר</p>
          </div>
        </div>
      </section>

      {/* שליטה מלאה */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="🎯" title="שליטה מלאה" subtitle="יודעים בדיוק מה קורה — בכל רגע" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-10">
            <FeatureCard icon={BarChart3} title="עסקאות בזמן אמת" description="צפייה בכל העסקאות ברגע שהן מתבצעות" delay={0} />
            <FeatureCard icon={MessageCircle} title="ברכות מהאורחים" description="כל הברכות נשמרות במקום אחד — זיכרון לכל החיים" delay={100} />
            <FeatureCard icon={TrendingUp} title="מעקב סכומים" description="תמיד יודעים כמה כסף נכנס ומאיפה" delay={200} />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">👈 אין הפתעות — הכל שקוף</p>
          </div>
        </div>
      </section>

      {/* לפני ובמהלך האירוע */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="⚡" title="גם לפני וגם במהלך האירוע" subtitle="לא מחכים לאירוע כדי להתחיל לקבל כסף" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-10">
            <FeatureCard icon={Send} title="קישור מראש" description="שליחת קישור לאורחים עוד לפני האירוע" delay={0} />
            <FeatureCard icon={Gift} title="מתנות מוקדמות" description="קבלת מתנות ימים ושבועות לפני האירוע" delay={100} />
            <FeatureCard icon={Monitor} title="עמדה באירוע" description="עמדת מתנות פיזית בזמן האירוע עצמו" delay={200} />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">👈 ממקסמים כל רגע</p>
          </div>
        </div>
      </section>

      {/* עמדה באולם */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="🏛️" title="עמדה באולם" subtitle="לא מפספסים אף אורח" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-10">
            <FeatureCard icon={Users} title="פתרון למי שלא שלח" description="גם מי שלא שלח מתנה מראש — יכול לשלוח במקום" delay={0} />
            <FeatureCard icon={Zap} title="שליחה מהירה" description="תוך כמה שניות, ישירות מהעמדה" delay={100} />
            <FeatureCard icon={TrendingUp} title="אחוזי המרה גבוהים" description="מעלה משמעותית את כמות המתנות באירוע" delay={200} />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">👈 האירוע עצמו הופך למנוע הכנסה</p>
          </div>
        </div>
      </section>

      {/* הזמנות */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="📩" title="הזמנות ואישורי הגעה" subtitle="סדר מלא ברשימת האורחים" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-10">
            <FeatureCard icon={Send} title="שליחה מרוכזת" description="בוואטסאפ ובמייל — הכל ממקום אחד" delay={0} />
            <FeatureCard icon={CheckCircle2} title="מעקב אישורים" description="מי אישר, מי לא — הכל מעודכן בזמן אמת" delay={100} />
            <FeatureCard icon={Clock} title="חיסכון בזמן" description="פחות טלפונים, פחות כאב ראש" delay={200} />
          </div>
        </div>
      </section>

      {/* ניהול תקציב */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="📊" title="ניהול תקציב" subtitle="לא רק מקבלים כסף — גם מנהלים אותו נכון" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-10">
            <FeatureCard icon={Wallet} title="ניהול הוצאות" description="מעקב אחרי כל ההוצאות של האירוע" delay={0} />
            <FeatureCard icon={Eye} title="מעקב חריגות" description="התראות כשעוברים את התקציב המתוכנן" delay={100} />
            <FeatureCard icon={BarChart3} title="שליטה מלאה" description="תמיד יודעים בדיוק איפה עומדים" delay={200} />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">👈 אירוע בלי הפתעות</p>
          </div>
        </div>
      </section>

      {/* אבטחה */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <SectionTitle emoji="🔒" title="אבטחה ואמינות" subtitle="הכל מאובטח ומסודר" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <FeatureCard icon={Lock} title="סליקה מאובטחת" description="תקן PCI DSS — הנתונים שלכם מוגנים" delay={0} />
            <FeatureCard icon={Shield} title="מערכת יציבה" description="אמינות גבוהה עם זמינות 24/7" delay={100} />
            <FeatureCard icon={Zap} title="ביצועים מהירים" description="חוויה חלקה ומהירה לכל המשתמשים" delay={200} />
          </div>
        </div>
      </section>

      {/* סיכום + CTA */}
      <section className="py-20 bg-gradient-to-b from-secondary to-secondary/95">
        <div className="container mx-auto px-4 text-center">
          <span className="text-5xl mb-6 block">💎</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            GiftKal לא רק עוזר לכם לנהל אירוע —<br />
            <span className="text-primary">הוא עוזר לכם להרוויח ממנו יותר</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link to="/pricing">
              <Button variant="gold" size="lg" className="text-lg px-10 py-6">
                צפו במחירים
              </Button>
            </Link>
            <Link to="/event-owners">
              <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-white/30 text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5 ml-2" />
                חזרה לבעלי אירועים
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Benefits;
