import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle2
} from "lucide-react";
import logo from "@/assets/logo.png";

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

// Hero Section
const HeroSection = () => {
  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-sidebar" />
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10" />
      
      {/* Floating decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 animate-bounce" style={{ animationDuration: "3s" }}>
          <Gift className="w-12 h-12 text-primary/30" />
        </div>
        <div className="absolute top-40 left-20 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
          <Heart className="w-8 h-8 text-primary/20" />
        </div>
        <div className="absolute bottom-40 right-1/4 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}>
          <Sparkles className="w-10 h-10 text-primary/25" />
        </div>
        <div className="absolute top-1/3 left-10 animate-bounce" style={{ animationDuration: "4.5s", animationDelay: "2s" }}>
          <Gift className="w-6 h-6 text-primary/15" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img 
            src={logo} 
            alt="Giftkal" 
            className="h-24 md:h-32 mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-slide-up">
          המתנה המושלמת
          <span className="block text-gradient-gold">לכל אירוע</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          מערכת חכמה לגביית מתנות דיגיטליות באירועים - פשוט, מאובטח, אלגנטי
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button 
            onClick={scrollToForm}
            variant="gold" 
            size="xl"
            className="text-lg shadow-gold"
          >
            <Gift className="w-5 h-5 ml-2" />
            התחל עכשיו
          </Button>
          <Button 
            asChild
            variant="outline" 
            size="xl"
            className="text-lg border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/login">
              <ArrowLeft className="w-5 h-5 ml-2" />
              כניסה למערכת
            </Link>
          </Button>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: CreditCard,
      title: "תשלום מאובטח",
      description: "גבייה מאובטחת בתקן PCI עם PayMe - הכסף מגיע ישירות אליכם"
    },
    {
      icon: Smartphone,
      title: "חוויה דיגיטלית",
      description: "הזמנות וברכות דיגיטליות מרהיבות שמותאמות לכל אירוע"
    },
    {
      icon: BarChart3,
      title: "ניהול חכם",
      description: "דשבורד מתקדם לניהול האירוע, האורחים והמתנות במקום אחד"
    },
    {
      icon: Gift,
      title: "ברכות אישיות",
      description: "אורחים שולחים ברכות מרגשות עם עיצובים מרהיבים לבחירה"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary mb-4">
          למה <span className="text-gradient-gold">Giftkal</span>?
        </h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
          הפלטפורמה המובילה לגביית מתנות דיגיטליות באירועים
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-card rounded-2xl p-6 shadow-md border border-border/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30"
            >
              {/* Glassmorphism effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center mb-4 shadow-gold">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">{feature.title}</h3>
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
      number: "1",
      title: "נרשמים למערכת",
      description: "פותחים חשבון בקלות ומגדירים את פרטי האירוע"
    },
    {
      number: "2",
      title: "משתפים את הקישור",
      description: "שולחים לאורחים קישור מותאם אישית לשליחת מתנות"
    },
    {
      number: "3",
      title: "מקבלים מתנות",
      description: "המתנות מתקבלות ישירות לחשבון הבנק שלכם"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary mb-4">
          איך זה <span className="text-gradient-gold">עובד</span>?
        </h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16">
          שלושה צעדים פשוטים להתחיל לקבל מתנות דיגיטליות
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className="relative bg-card rounded-2xl p-8 shadow-lg border border-border/50 text-center min-w-[280px]">
                {/* Step number */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-gold text-white font-bold text-lg flex items-center justify-center shadow-gold">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-secondary mb-3 mt-4">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
              
              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <div className="hidden md:block mx-4 text-primary">
                  <ArrowLeft className="w-8 h-8" />
                </div>
              )}
            </div>
          ))}
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
      items: ["חתונות", "אירוסין", "ימי הולדת"]
    },
    {
      icon: Building2,
      title: "בעלי אולמות",
      items: ["ניהול אירועים", "דוחות מפורטים", "עמלות שקופות"]
    },
    {
      icon: PartyPopper,
      title: "מארגני אירועים",
      items: ["Bar/Bat Mitzvah", "אירועי חברה", "מפגשים משפחתיים"]
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary mb-4">
          למי זה <span className="text-gradient-gold">מתאים</span>?
        </h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
          הפתרון המושלם לכל סוגי האירועים והלקוחות
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {audiences.map((audience, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-8 shadow-md border border-border/50 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <audience.icon className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-4">{audience.title}</h3>
              <ul className="space-y-2">
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
    <section className="py-20 bg-sidebar text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          המספרים <span className="text-gradient-gold">מדברים</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
          <div ref={eventsCounter.ref} className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-2">
              +{eventsCounter.count.toLocaleString()}
            </div>
            <p className="text-white/80 text-lg">אירועים מוצלחים</p>
          </div>
          <div ref={amountCounter.ref} className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-2">
              ₪{amountCounter.count}M+
            </div>
            <p className="text-white/80 text-lg">סכום גבייה כולל</p>
          </div>
          <div ref={guestsCounter.ref} className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-2">
              +{guestsCounter.count.toLocaleString()}
            </div>
            <p className="text-white/80 text-lg">אורחים מרוצים</p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <p className="text-xl text-white/90 mb-4 leading-relaxed">
              "המערכת פשוט עובדת! קיבלנו את כל המתנות ישירות לחשבון, בלי כאב ראש. ממליצים בחום!"
            </p>
            <p className="text-primary font-semibold">- ישראל ושרה, חתונה 2024</p>
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
    leadType: "couple",
    notes: ""
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
      <section id="lead-form" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-card rounded-2xl p-12 shadow-xl border border-border/50 animate-scale-in">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-4">תודה רבה!</h3>
              <p className="text-muted-foreground mb-6">
                קיבלנו את הפרטים שלך ונחזור אליך בהקדם האפשרי
              </p>
              <Button onClick={() => setIsSubmitted(false)} variant="outline">
                שלח פרטים נוספים
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="lead-form" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary mb-4">
          מעוניינים <span className="text-gradient-gold">לשמוע עוד</span>?
        </h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
          השאירו פרטים ונחזור אליכם בהקדם
        </p>

        <div className="max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-xl border border-border/50">
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName" className="text-secondary font-medium">
                  שם מלא <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="הכנס את שמך המלא"
                  className="mt-2"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-secondary font-medium">
                  טלפון <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="050-0000000"
                  className="mt-2"
                  dir="ltr"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-secondary font-medium">
                  אימייל
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="mt-2"
                  dir="ltr"
                />
              </div>

              {/* Lead Type */}
              <div>
                <Label className="text-secondary font-medium mb-3 block">
                  סוג לקוח
                </Label>
                <RadioGroup
                  value={formData.leadType}
                  onValueChange={(value) => setFormData({ ...formData, leadType: value })}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="couple" id="couple" />
                    <Label htmlFor="couple" className="cursor-pointer">זוג מתחתן</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="venue" id="venue" />
                    <Label htmlFor="venue" className="cursor-pointer">בעל אולם</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="organizer" id="organizer" />
                    <Label htmlFor="organizer" className="cursor-pointer">מארגן אירועים</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="cursor-pointer">אחר</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-secondary font-medium">
                  הודעה (אופציונלי)
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ספרו לנו קצת על האירוע שלכם..."
                  className="mt-2 min-h-[100px]"
                />
              </div>

              <Button 
                type="submit" 
                variant="gold" 
                size="xl" 
                className="w-full text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "שולח..." : "שלח פרטים"}
              </Button>
            </div>
          </form>
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
    <section className="py-16 bg-gradient-gold">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          מוכנים להתחיל?
        </h2>
        <p className="text-white/90 max-w-xl mx-auto mb-8">
          הצטרפו לאלפי זוגות ובעלי אולמות שכבר נהנים מהמערכת
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            asChild
            size="xl"
            className="bg-white text-secondary hover:bg-white/90 text-lg"
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
    <footer className="bg-sidebar py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <img src={logo} alt="Giftkal" className="h-12 mb-4" />
            <p className="text-white/70 text-sm max-w-md">
              Giftkal - המערכת המובילה לגביית מתנות דיגיטליות באירועים. 
              פשוט, מאובטח ואלגנטי.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">קישורים</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-white/70 hover:text-primary transition-colors text-sm">
                  כניסה למערכת
                </Link>
              </li>
              <li>
                <a href="#lead-form" className="text-white/70 hover:text-primary transition-colors text-sm">
                  צור קשר
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">יצירת קשר</h4>
            <ul className="space-y-3">
              <li>
                <a href="tel:+972500000000" className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors text-sm">
                  <Phone className="w-4 h-4" />
                  050-000-0000
                </a>
              </li>
              <li>
                <a href="mailto:info@giftkal.com" className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors text-sm">
                  <Mail className="w-4 h-4" />
                  info@giftkal.com
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/972500000000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/50 text-sm">
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
      <ForWhoSection />
      <SocialProofSection />
      <LeadFormSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default HomePage;
