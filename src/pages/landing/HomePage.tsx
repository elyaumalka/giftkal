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
  BarChart3, 
  Heart,
  Users,
  Building2,
  PartyPopper,
  Phone,
  Mail,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Play,
  Shield,
  Zap,
  TrendingUp
} from "lucide-react";
import logo from "@/assets/logo.png";
import laptopMockup from "@/assets/mockups/laptop-dashboard-mockup.png";
import mobileMockup from "@/assets/mockups/mobile-gift-screen.png";

// Animated counter hook
const useCounter = (end: number, duration: number = 2000, start: number = 0) => {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, start, duration]);

  return { count, ref };
};

// Hero Section - bot-mind style
const HeroSection = () => {
  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-sidebar">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-[#0a2855]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-[10%] animate-bounce" style={{ animationDuration: "3s" }}>
          <Gift className="w-8 h-8 text-primary/40" />
        </div>
        <div className="absolute top-40 left-[15%] animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
          <Heart className="w-6 h-6 text-primary/30" />
        </div>
        <div className="absolute bottom-32 right-[20%] animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}>
          <Sparkles className="w-7 h-7 text-primary/35" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-right">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6 animate-fade-in">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm">+1,000 אירועים מוצלחים</span>
            </div>

            {/* Logo */}
            <div className="mb-6 animate-fade-in">
              <img 
                src={logo} 
                alt="Giftkal" 
                className="h-16 md:h-20"
              />
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-slide-up">
              הפלטפורמה המובילה
              <br />
              <span className="text-gradient-gold">לגביית מתנות דיגיטליות</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/70 max-w-lg mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              מערכת חכמה שמאפשרת לאורחים לשלוח מתנות ישירות לחשבון הבנק שלכם - 
              פשוט, מאובטח ואלגנטי
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button 
                onClick={scrollToForm}
                size="xl"
                className="bg-gradient-gold text-white text-lg shadow-gold hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Gift className="w-5 h-5 ml-2" />
                התחל עכשיו - חינם
              </Button>
              <Button 
                asChild
                variant="outline" 
                size="xl"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white text-lg backdrop-blur-sm"
              >
                <Link to="/login">
                  <Play className="w-5 h-5 ml-2" />
                  כניסה למערכת
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Shield className="w-4 h-4 text-green-400" />
                <span>תשלום מאובטח PCI</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span>העברה מיידית</span>
              </div>
            </div>
          </div>

          {/* Mockup */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary/10 blur-3xl scale-110" />
            
            {/* Laptop mockup */}
            <div className="relative">
              <img 
                src={laptopMockup} 
                alt="לוח בקרה" 
                className="w-full max-w-2xl mx-auto drop-shadow-2xl animate-slide-up hover:scale-105 transition-transform duration-500"
              />
              
              {/* Floating mobile mockup */}
              <div className="absolute -bottom-8 -left-8 md:left-0 w-32 md:w-40 animate-bounce" style={{ animationDuration: "4s" }}>
                <img 
                  src={mobileMockup} 
                  alt="מסך מתנות" 
                  className="w-full drop-shadow-2xl rounded-3xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

// Features Section - Cards style
const FeaturesSection = () => {
  const features = [
    {
      icon: CreditCard,
      title: "תשלום מאובטח",
      description: "גבייה בתקן PCI הגבוה ביותר עם PayMe. הכסף מגיע ישירות לחשבון הבנק שלכם.",
      highlight: "אבטחה מקסימלית"
    },
    {
      icon: Smartphone,
      title: "חוויה דיגיטלית מושלמת",
      description: "הזמנות וברכות דיגיטליות מרהיבות שמותאמות אישית לכל אירוע.",
      highlight: "עיצובים מרהיבים"
    },
    {
      icon: BarChart3,
      title: "ניהול חכם ופשוט",
      description: "דשבורד מתקדם לניהול האירוע, האורחים והמתנות - הכל במקום אחד.",
      highlight: "שליטה מלאה"
    },
    {
      icon: TrendingUp,
      title: "דוחות בזמן אמת",
      description: "עקבו אחרי המתנות, הברכות והסטטיסטיקות בזמן אמת מכל מכשיר.",
      highlight: "נתונים חיים"
    }
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            למה Giftkal?
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            הכל מה שצריך
            <span className="text-gradient-gold"> במקום אחד</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            פלטפורמה מתקדמת שמפשטת את תהליך גביית המתנות ומעניקה חוויה יוצאת דופן לאורחים
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-card rounded-2xl p-8 shadow-lg border border-border/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 shadow-gold group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Highlight badge */}
                <span className="inline-block bg-primary/10 text-primary text-xs px-3 py-1 rounded-full mb-3">
                  {feature.highlight}
                </span>
                
                <h3 className="text-xl font-bold text-secondary mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "נרשמים למערכת",
      description: "פותחים חשבון בקלות ומגדירים את פרטי האירוע תוך דקות"
    },
    {
      number: "02",
      title: "משתפים את הקישור",
      description: "שולחים לאורחים קישור מותאם אישית לשליחת מתנות"
    },
    {
      number: "03",
      title: "מקבלים מתנות",
      description: "המתנות מתקבלות ישירות לחשבון הבנק שלכם - בלי עמלות נסתרות"
    }
  ];

  return (
    <section className="py-24 bg-muted/30 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            תהליך פשוט
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            איך זה
            <span className="text-gradient-gold"> עובד?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            שלושה צעדים פשוטים להתחיל לקבל מתנות דיגיטליות
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 -left-4 w-8 h-0.5 bg-gradient-to-l from-primary to-primary/30" />
              )}
              
              <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Step number */}
                <div className="text-6xl font-bold text-gradient-gold mb-4 opacity-30">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-secondary mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Mockup Showcase Section
const MockupSection = () => {
  return (
    <section className="py-24 bg-sidebar relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-[#0a2855]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            ממשק מתקדם
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            חוויית משתמש
            <span className="text-gradient-gold"> יוצאת דופן</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            ממשק ניהול אינטואיטיבי ומסך מתנות אלגנטי שמותאם לכל מכשיר
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Laptop */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-3xl scale-110 opacity-50 group-hover:opacity-80 transition-opacity" />
            <img 
              src={laptopMockup} 
              alt="מערכת ניהול" 
              className="relative max-w-xl w-full drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          
          {/* Mobile */}
          <div className="relative group lg:-ml-20 lg:mt-20">
            <div className="absolute inset-0 bg-primary/20 blur-2xl scale-110 opacity-50 group-hover:opacity-80 transition-opacity" />
            <img 
              src={mobileMockup} 
              alt="מסך מתנות" 
              className="relative w-48 md:w-56 drop-shadow-2xl rounded-3xl transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// For Who Section
const ForWhoSection = () => {
  const audiences = [
    {
      icon: Users,
      title: "זוגות",
      items: ["חתונות", "אירוסין", "ימי הולדת"],
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Building2,
      title: "בעלי אולמות",
      items: ["ניהול אירועים", "דוחות מפורטים", "עמלות שקופות"],
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: PartyPopper,
      title: "מארגני אירועים",
      items: ["Bar/Bat Mitzvah", "אירועי חברה", "מפגשים משפחתיים"],
      color: "from-amber-500 to-orange-500"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            מתאים לכולם
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            למי זה
            <span className="text-gradient-gold"> מתאים?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            הפתרון המושלם לכל סוגי האירועים והלקוחות
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {audiences.map((audience, index) => (
            <div 
              key={index}
              className="group bg-card rounded-2xl p-8 shadow-lg border border-border/50 text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${audience.color} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <audience.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-4">{audience.title}</h3>
              <ul className="space-y-3">
                {audience.items.map((item, i) => (
                  <li key={i} className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Social Proof Section
const SocialProofSection = () => {
  const eventsCounter = useCounter(1000, 2000);
  const amountCounter = useCounter(10, 2000);
  const guestsCounter = useCounter(50000, 2000);

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            מספרים שמדברים
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            אלפי לקוחות
            <span className="text-gradient-gold"> סומכים עלינו</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
          <div ref={eventsCounter.ref} className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 text-center">
            <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-2">
              +{eventsCounter.count.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-lg">אירועים מוצלחים</p>
          </div>
          <div ref={amountCounter.ref} className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 text-center">
            <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-2">
              ₪{amountCounter.count}M+
            </div>
            <p className="text-muted-foreground text-lg">סכום גבייה כולל</p>
          </div>
          <div ref={guestsCounter.ref} className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 text-center">
            <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-2">
              +{guestsCounter.count.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-lg">אורחים מרוצים</p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl p-10 shadow-xl border border-border/50 relative">
            <div className="absolute -top-4 right-8 text-6xl text-primary/20">"</div>
            <p className="text-xl text-secondary mb-6 leading-relaxed text-center">
              המערכת פשוט עובדת! קיבלנו את כל המתנות ישירות לחשבון, בלי כאב ראש. 
              האורחים היו מרוצים מהחוויה הדיגיטלית והעיצוב המרהיב.
            </p>
            <div className="text-center">
              <p className="font-bold text-secondary">ישראל ושרה כהן</p>
              <p className="text-primary text-sm">חתונה, ספטמבר 2024</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Lead Form Section
const LeadFormSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    leadType: "couple"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את השדות החובה",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("leads").insert({
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        lead_type: formData.leadType,
        venue_name: null,
        venue_address: null,
        status: "new"
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "תודה רבה!",
        description: "קיבלנו את הפרטים שלך ונחזור אליך בהקדם",
      });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת הטופס. אנא נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="lead-form" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-card rounded-2xl p-12 shadow-xl border border-border/50 animate-scale-in">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-secondary mb-4">תודה רבה!</h3>
              <p className="text-muted-foreground mb-8 text-lg">
                קיבלנו את הפרטים שלך ונחזור אליך בהקדם האפשרי
              </p>
              <Button onClick={() => setIsSubmitted(false)} variant="outline" size="lg">
                שלח פרטים נוספים
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="lead-form" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div className="text-right">
            <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              צור קשר
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-6">
              מעוניינים
              <span className="text-gradient-gold"> לשמוע עוד?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              השאירו פרטים ונחזור אליכם בהקדם עם כל המידע שתצטרכו. 
              אנחנו כאן לעזור לכם להפוך את האירוע שלכם למושלם!
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <span className="text-secondary">ייעוץ חינם ללא התחייבות</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <span className="text-secondary">מענה תוך 24 שעות</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <span className="text-secondary">הדרכה אישית למערכת</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-xl border border-border/50">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="fullName" className="text-secondary font-medium mb-2 block">
                    שם מלא *
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="הכנס את שמך המלא"
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-secondary font-medium mb-2 block">
                    טלפון *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="050-0000000"
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-secondary font-medium mb-2 block">
                    אימייל
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    className="h-12 text-base"
                  />
                </div>

                <div>
                  <Label className="text-secondary font-medium mb-3 block">
                    סוג לקוח
                  </Label>
                  <RadioGroup
                    value={formData.leadType}
                    onValueChange={(value) => setFormData({...formData, leadType: value})}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors">
                      <RadioGroupItem value="couple" id="couple" />
                      <Label htmlFor="couple" className="cursor-pointer text-sm">זוג מתחתן</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors">
                      <RadioGroupItem value="venue" id="venue" />
                      <Label htmlFor="venue" className="cursor-pointer text-sm">בעל אולם</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors">
                      <RadioGroupItem value="organizer" id="organizer" />
                      <Label htmlFor="organizer" className="cursor-pointer text-sm">מארגן אירועים</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="cursor-pointer text-sm">אחר</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg bg-gradient-gold text-white shadow-gold hover:shadow-lg transition-all"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      שולח...
                    </span>
                  ) : (
                    <>
                      <Gift className="w-5 h-5 ml-2" />
                      שלח פרטים
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = () => {
  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 bg-gradient-gold relative overflow-hidden">
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ 
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }} />
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          מוכנים להתחיל?
        </h2>
        <p className="text-white/90 text-lg max-w-xl mx-auto mb-10">
          הצטרפו לאלפי זוגות ובעלי אולמות שכבר נהנים מהפלטפורמה המובילה
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            asChild
            size="xl"
            className="bg-white text-secondary hover:bg-white/90 text-lg shadow-lg"
          >
            <Link to="/login">
              <ArrowLeft className="w-5 h-5 ml-2" />
              כניסה למערכת
            </Link>
          </Button>
          <Button 
            onClick={scrollToForm}
            size="xl"
            variant="outline"
            className="border-white text-white hover:bg-white/10 hover:text-white text-lg"
          >
            <MessageCircle className="w-5 h-5 ml-2" />
            צור קשר
          </Button>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="bg-sidebar py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <img src={logo} alt="Giftkal" className="h-14 mb-6" />
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              Giftkal - הפלטפורמה המובילה לגביית מתנות דיגיטליות באירועים. 
              מערכת פשוטה, מאובטחת ואלגנטית שמפשטת את חוויית שליחת המתנות.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">קישורים</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-white/60 hover:text-primary transition-colors text-sm">
                  כניסה למערכת
                </Link>
              </li>
              <li>
                <a href="#lead-form" className="text-white/60 hover:text-primary transition-colors text-sm">
                  צור קשר
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">יצירת קשר</h4>
            <ul className="space-y-4">
              <li>
                <a href="tel:+972500000000" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  050-000-0000
                </a>
              </li>
              <li>
                <a href="mailto:info@giftkal.com" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  info@giftkal.com
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/972500000000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Giftkal. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
};

// Main HomePage Component
const HomePage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <MockupSection />
      <ForWhoSection />
      <SocialProofSection />
      <LeadFormSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default HomePage;
