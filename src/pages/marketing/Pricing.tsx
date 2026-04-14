import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  CreditCard, Monitor, Send, BarChart3, CheckCircle2, Gift,
  MessageCircle
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

const plans = [
  {
    icon: CreditCard, title: "מתנות באשראי", price: "₪199", period: "לכל האירוע", badge: null,
    features: ["קבלת מתנות באשראי מכל מקום", "קישור אישי לשליחה לאורחים", "צפייה בעסקאות ובברכות בזמן אמת"],
    gradient: "from-primary/10 to-primary/5", borderColor: "border-primary/30",
  },
  {
    icon: Monitor, title: "עמדת מתנות באולם", price: "₪99", period: "חד פעמי", badge: "🔥 מומלץ",
    features: ["עמדת טאץ' באירוע עצמו", "אפשרות לשלוח מתנות במקום", "הגדלת משמעותית של כמות המתנות"],
    gradient: "from-yellow-500/15 to-primary/10", borderColor: "border-primary",
  },
  {
    icon: Send, title: "הזמנות + אישורי הגעה", price: "₪199", period: "חד פעמי", badge: null,
    features: ["שליחה מרוכזת בוואטסאפ ובמייל", "מעקב אחרי אישורי הגעה", "סדר מלא ברשימת האורחים"],
    gradient: "from-blue-500/10 to-secondary/5", borderColor: "border-secondary/30",
  },
  {
    icon: BarChart3, title: "ניהול תקציב", price: "חינם", period: "", badge: "🎁",
    features: ["ניהול הוצאות מלא", "מעקב תקציב והשוואה", "שליטה מלאה על הכספים"],
    gradient: "from-green-500/10 to-green-500/5", borderColor: "border-green-500/30",
  },
];

const faqs = [
  { q: "מתי מקבלים את הכסף?", a: "בהתאם לתנאי הסליקה — בדרך כלל תוך מספר ימי עסקים." },
  { q: "חייב לקחת את כל השירותים?", a: "לא, בוחרים רק מה שמתאים. כל שירות עומד בפני עצמו." },
  { q: "אפשר להתחיל בלי לשלם?", a: "כן! ניהול תקציב ללא עלות. אפשר להוסיף שירותים בכל שלב." },
  { q: "איך עובדת העמדה באולם?", a: "עמדת טאבלט שמוצבת באולם. האורחים ניגשים ושולחים מתנה תוך שניות." },
  { q: "יש התחייבות?", a: "ללא התחייבות. משלמים חד פעמי לכל אירוע." },
];

const PlanCard = ({ plan, delay }: { plan: typeof plans[0]; delay: number }) => {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`relative bg-gradient-to-b ${plan.gradient} rounded-2xl p-8 border-2 ${plan.borderColor} shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {plan.badge && (
        <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-sm font-bold px-4 py-1 rounded-full shadow-lg">
          {plan.badge}
        </div>
      )}
      <div className="w-14 h-14 rounded-xl bg-card flex items-center justify-center mb-6 shadow-sm">
        <plan.icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-secondary mb-2">{plan.title}</h3>
      <div className="mb-6">
        <span className="text-4xl font-black text-secondary">{plan.price}</span>
        {plan.period && <span className="text-muted-foreground text-sm mr-2">{plan.period}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {plan.features.map((f, j) => (
          <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Link to="/signup">
        <Button variant={plan.badge === "🔥 מומלץ" ? "gold" : "outline"} className="w-full">
          בחירה
        </Button>
      </Link>
    </div>
  );
};

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-secondary via-secondary/95 to-secondary/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(149,116,47,0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            משלמים רק על מה שצריך —<br />
            <span className="text-primary">ומתחילים להרוויח</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            ללא התחייבות • ללא עלויות נסתרות
          </p>
        </div>
      </section>

      {/* כרטיסי מחירים */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <PlanCard key={i} plan={plan} delay={i * 100} />
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-lg font-bold text-primary">💡 מספיק תוספת של מתנה אחת–שתיים כדי להחזיר את העלות</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-4xl mb-4 block">❓</span>
            <h2 className="text-3xl font-bold text-secondary">שאלות נפוצות</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-xl border border-border/50 px-6 shadow-sm">
                <AccordionTrigger className="text-right text-secondary font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-right">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-secondary to-secondary/95">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            מוכנים להתחיל?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
            פתחו אירוע עכשיו או דברו עם נציג
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="gold" size="lg" className="text-lg px-12 py-6">
                <Gift className="w-5 h-5 ml-2" />
                פתחו אירוע עכשיו
              </Button>
            </Link>
            <a href="https://wa.me/97223131700" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-lg px-12 py-6 bg-white/10 border-2 border-white/30 text-white hover:bg-white/20">
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

export default Pricing;
