import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Send, Monitor, Gift, Star,
  MessageCircle, Sparkles, CheckCircle2, UserPlus, Wallet, Package, MapPin
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
            <span className="text-primary text-sm font-medium">חבילת הכל כלול לאירוע שלכם</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            נהלו את האירוע שלכם<br />
            <span className="text-primary">וקבלו יותר מתנות</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
            אישורי הגעה + מתנות באשראי + עמדת מתנות — הכל בחבילה אחת
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="gold" size="lg" className="text-lg px-10 py-6">
                <Gift className="w-5 h-5 ml-2" />
                הרשמה לחבילה המלאה
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

      {/* חבילה הכל כלול */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">🎁</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-2">חבילת הכל כלול</h2>
            <p className="text-muted-foreground">כל מה שצריך לאירוע מוצלח — במקום אחד</p>
          </div>

          {/* Bundle card */}
          <div className="max-w-3xl mx-auto bg-card rounded-3xl shadow-xl border-2 border-primary/30 p-8 md:p-10 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-bold px-6 py-1 rounded-full">מומלץ</span>
            
            <div className="space-y-5 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-secondary text-lg">אישורי הגעה דיגיטליים</h3>
                  <p className="text-muted-foreground text-sm">שליחת הזמנות למוזמנים וקבלת אישורי הגעה בזמן אמת</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-secondary text-lg">מתנות באשראי — קישור אישי</h3>
                  <p className="text-muted-foreground text-sm">שליחת קישור אישי למוזמנים שלכם לשליחת מתנה באשראי מכל מקום</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-secondary text-lg">ניהול תקציב</h3>
                  <p className="text-muted-foreground text-sm">מעקב אחר הוצאות והכנסות — שליטה מלאה בתקציב האירוע</p>
                </div>
              </div>
            </div>

            <div className="text-center border-t border-border pt-6">
              <p className="text-3xl font-black text-primary mb-1">₪399</p>
              <p className="text-muted-foreground text-sm mb-6">חד פעמי לכל האירוע</p>
              <Link to="/signup">
                <Button variant="gold" size="lg" className="text-lg px-10 py-6">
                  <Package className="w-5 h-5 ml-2" />
                  הרשמה עכשיו
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* עמדת מתנות באולם */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">🖥️</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-2">עמדת מתנות באולם</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              עמדת טאץ' פיזית שמאפשרת לאורחים לשלוח מתנות באשראי ישירות באירוע — גם מי שלא הביא מזומן
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* אופציה 1 - יש עמדה באולם */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-secondary text-lg">יש עמדה באולם שלכם?</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                אם באולם שלכם כבר קיימת עמדת GiftKal — אנחנו מפעילים אותה עבורכם ללא עלות נוספת!
              </p>
              <p className="text-sm text-foreground/70 mb-4">
                👈 השאירו את פרטי בעל האולם ואנחנו נדאג לכל השאר
              </p>
              <a href="https://wa.me/97223131700?text=היי, יש עמדת GiftKal באולם שלנו ואשמח להפעיל אותה לאירוע" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <MessageCircle className="w-4 h-4 ml-2" />
                  שלחו פרטי בעל האולם
                </Button>
              </a>
            </div>

            {/* אופציה 2 - השכרת עמדה */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border-2 border-primary/40 relative">
              <span className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full">פופולרי</span>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-secondary text-lg">אין עמדה באולם?</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                ניתן להשכיר עמדת מתנות ממוקדי GiftKal הפרוסים ברחבי הארץ
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                <p className="text-2xl font-black text-primary text-center">₪100</p>
                <p className="text-xs text-muted-foreground text-center">בנוסף לתשלום על החבילה</p>
              </div>
              <a href="https://wa.me/97223131700?text=היי, אשמח להשכיר עמדת מתנות לאירוע שלי" target="_blank" rel="noopener noreferrer">
                <Button variant="gold" className="w-full">
                  <Monitor className="w-4 h-4 ml-2" />
                  הזמינו עמדה לאירוע
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* איך זה עובד */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">⚡</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">איך זה עובד?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: "1", icon: UserPlus, text: "נרשמים ופותחים אירוע" },
              { step: "2", icon: Send, text: "שולחים הזמנות ומקבלים אישורי הגעה" },
              { step: "3", icon: Gift, text: "האורחים שולחים מתנות בקישור או בעמדה" },
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
      </section>

      {/* המלצות */}
      <section className="py-16 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-secondary">💬 מה הלקוחות אומרים</h2>
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            🚀 מוכנים לשדרג את האירוע?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
            הרשמו עכשיו לחבילה הכל כלול או דברו עם נציג
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="gold" size="lg" className="text-lg px-12 py-7">
                <Gift className="w-5 h-5 ml-2" />
                הרשמה לחבילה המלאה
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
