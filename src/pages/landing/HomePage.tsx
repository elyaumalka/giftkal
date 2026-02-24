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
  Shield,
  Zap,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Lock,
  Send,
  Star
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
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * (end - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, start, duration]);

  return { count, ref };
};

// Intersection observer hook for animations
const useInView = (threshold = 0.2) => {
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

// ─── Navbar ───
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? "bg-sidebar/95 backdrop-blur-xl shadow-2xl py-3" 
        : "bg-transparent py-5"
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <img src={logo} alt="Giftkal" className="h-10 md:h-12" />
        
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo("hero")} className="text-white/80 hover:text-primary transition-colors text-sm font-medium">בית</button>
          <button onClick={() => scrollTo("how-it-works")} className="text-white/80 hover:text-primary transition-colors text-sm font-medium">איך זה עובד</button>
          <button onClick={() => scrollTo("why-us")} className="text-white/80 hover:text-primary transition-colors text-sm font-medium">למה אנחנו</button>
          <button onClick={() => scrollTo("about")} className="text-white/80 hover:text-primary transition-colors text-sm font-medium">עלינו</button>
          <button onClick={() => scrollTo("testimonials")} className="text-white/80 hover:text-primary transition-colors text-sm font-medium">המלצות</button>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 hidden sm:inline-flex">
            <Link to="/login">התחברות</Link>
          </Button>
          <Button 
            onClick={() => scrollTo("lead-form")}
            className="bg-gradient-gold text-white shadow-gold hover:shadow-lg transition-all hover:scale-105"
          >
            התחילו עכשיו
          </Button>
        </div>
      </div>
    </nav>
  );
};

// ─── Hero Section ─── Full screen with big image feel
const HeroSection = () => {
  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Deep navy background with warm gold radial glow */}
      <div className="absolute inset-0 bg-sidebar" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_hsl(38_92%_50%_/_0.12),_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,_hsl(38_92%_50%_/_0.08),_transparent_60%)]" />
      
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] right-[8%] w-3 h-3 bg-primary/40 rounded-full animate-pulse" />
        <div className="absolute top-[25%] left-[12%] w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-[30%] right-[15%] w-4 h-4 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-[60%] left-[8%] w-2 h-2 bg-primary/25 rounded-full animate-pulse" style={{ animationDelay: "1.5s" }} />
        {/* Floating hearts like mazlatgift */}
        <Heart className="absolute top-[20%] right-[20%] w-5 h-5 text-primary/20 animate-bounce" style={{ animationDuration: "3s" }} />
        <Heart className="absolute top-[40%] left-[10%] w-4 h-4 text-primary/15 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }} />
        <Gift className="absolute bottom-[25%] right-[25%] w-6 h-6 text-primary/15 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }} />
        <Sparkles className="absolute top-[35%] right-[40%] w-4 h-4 text-primary/20 animate-bounce" style={{ animationDuration: "4.5s", animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text content */}
          <div className="text-right order-2 lg:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white mb-6 leading-[1.2] animate-slide-up">
              <span className="text-gradient-gold">Giftkal,</span> קל לתת.
              <br />
              פשוט לקבל יותר!
            </h1>

            <h3 className="text-xl md:text-2xl text-primary/90 font-medium mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              מהיום מקליקים ומפרגנים
            </h3>

            <p className="text-lg text-white/70 max-w-lg mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.15s" }}>
              Giftkal הינו שירות פשוט וקל להענקת מתנות באשראי.
              <br />
              מקליקים סכום למתנה, בוחרים ברכה אישית, ומשגרים לבעלי השמחה.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button 
                onClick={scrollToForm}
                size="xl"
                className="bg-gradient-gold text-white text-lg shadow-gold hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Gift className="w-5 h-5 ml-2" />
                למה זה כדאי?
              </Button>
              <Button 
                asChild
                variant="outline" 
                size="xl"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white text-lg backdrop-blur-sm"
              >
                <Link to="/login">
                  כניסה למערכת
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Mockup visual */}
          <div className="relative order-1 lg:order-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 bg-primary/15 blur-[80px] scale-125 rounded-full" />
            <div className="relative">
              <img 
                src={laptopMockup} 
                alt="מערכת Giftkal" 
                className="w-full max-w-2xl mx-auto drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute -bottom-6 -left-4 md:left-4 w-32 md:w-40 animate-bounce" style={{ animationDuration: "5s" }}>
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

      {/* Smooth wave transition */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-auto" preserveAspectRatio="none">
          <path fill="hsl(220 20% 97%)" d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
};

// ─── How It Works Section ─── mazlatgift style steps
const HowItWorksSection = () => {
  const { ref, inView } = useInView();
  
  const steps = [
    {
      icon: Smartphone,
      number: "1",
      title: "נרשמים למערכת",
      description: "פותחים חשבון בקלות ומגדירים את פרטי האירוע תוך דקות ספורות"
    },
    {
      icon: Send,
      number: "2",
      title: "משתפים את הקישור",
      description: "שולחים לאורחים קישור מותאם אישית לשליחת מתנות וברכות"
    },
    {
      icon: Banknote,
      number: "3",
      title: "מקבלים מתנות",
      description: "המתנות מתקבלות ישירות לחשבון הבנק שלכם - בלי עמלות נסתרות"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background relative" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            איך נותנים
            <span className="text-gradient-gold"> מתנה?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            שלושה צעדים פשוטים - וזהו!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`relative text-center transition-all duration-700 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 -left-4 w-8 h-[2px] bg-gradient-to-l from-primary/60 to-primary/20" />
              )}
              
              <div className="bg-card rounded-3xl p-10 shadow-lg border border-border/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                {/* Step number badge */}
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-gold rounded-2xl rotate-3 group-hover:rotate-6 transition-transform duration-300" />
                  <div className="relative w-full h-full bg-gradient-gold rounded-2xl flex items-center justify-center shadow-gold">
                    <step.icon className="w-9 h-9 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-sidebar text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg">
                    {step.number}
                  </span>
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

// ─── Big Statement Section ─── mazlatgift "המתנות של היום" style
const StatementSection = () => {
  const { ref, inView } = useInView();

  return (
    <section className="py-20 bg-sidebar relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(38_92%_50%_/_0.08),_transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl md:text-5xl font-bold text-white mb-8 leading-tight transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}>
            המתנות של היום כבר לא נכנסות למעטפה.
          </h2>
          <p className={`text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}>
            בלחיצה אחת מקימים אירוע ומתחילים לפרגן בצורה פשוטה, בטוחה ונוחה.
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-300 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}>
            <Button 
              onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" })}
              size="xl"
              className="bg-gradient-gold text-white text-lg shadow-gold hover:shadow-lg transition-all hover:scale-105"
            >
              <Gift className="w-5 h-5 ml-2" />
              הקמת אירוע אונליין
            </Button>
            <Button 
              onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" })}
              size="xl"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white text-lg"
            >
              <Phone className="w-5 h-5 ml-2" />
              הקמת אירוע עם נציג
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Why Us Section ─── mazlatgift "למה כולם בוחרים" style
const WhyUsSection = () => {
  const { ref, inView } = useInView();

  const benefits = [
    {
      icon: Shield,
      title: "אבטחה מקסימלית",
      description: "תשלומים מאובטחים ומוצפנים לפי תקן מחמיר SSL ולמניעת גניבות אשראי"
    },
    {
      icon: Zap,
      title: "הכסף עובר מהר",
      description: "בעלי השמחה מקבלים את הכסף ישירות לחשבון הבנק תוך 1-7 ימי עסקים"
    },
    {
      icon: Lock,
      title: "מערכת מפוקחת",
      description: "Giftkal פועלת בהתאם לתקנים המחמירים ביותר, כך נותנים מתנה בביטחון מלא"
    },
    {
      icon: Send,
      title: "גם מרחוק מפרגנים קרוב",
      description: "לא באירוע? שולחים מתנה עם קישור ישיר לפני או אחרי האירוע בלחיצה אחת"
    },
    {
      icon: CreditCard,
      title: "גם בתשלומים",
      description: "מעניקים באשראי בנוחות מירבית, גם בתשלומים, ובעל השמחה מקבל בפעם אחת"
    },
    {
      icon: Users,
      title: "בוחרים למי לתת",
      description: "אפשר לבחור למי מיועדת המתנה - לזוג או להורים, בלחיצה אחת"
    }
  ];

  return (
    <section id="why-us" className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            למה כולם בוחרים
            <span className="text-gradient-gold"> Giftkal</span>
          </h2>
          <p className="text-primary text-lg font-medium">
            תכלס, באשראי מפרגנים יותר!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className={`group bg-card rounded-2xl p-8 shadow-sm border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center mb-5 shadow-gold group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-secondary mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── About Section ─── mazlatgift "מובילים את מתנות האירועים" style
const AboutSection = () => {
  const { ref, inView } = useInView();

  return (
    <section id="about" className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Image / Mockup side */}
          <div className={`relative transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <div className="absolute inset-0 bg-primary/10 blur-[60px] scale-110 rounded-full" />
            <div className="relative bg-sidebar rounded-3xl p-8 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_50%_/_0.1),_transparent_70%)]" />
              <img 
                src={laptopMockup} 
                alt="מערכת Giftkal" 
                className="relative w-full rounded-xl"
              />
            </div>
          </div>

          {/* Text side */}
          <div className={`text-right transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-6 leading-tight">
              מובילים את מתנות האירועים
              <br />
              <span className="text-gradient-gold">לעידן החדש</span>
            </h2>
            
            <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>
                Giftkal הוקמה מתוך חזון להנגיש את ההשתתפות בשמחה, על ידי הפיכת נתינת המתנה לקלה, בטוחה ומכבדת.
              </p>
              <p>
                בלי צ׳קים, בלי מזומן, בלי כאב ראש.
              </p>
              <p>
                המערכת מאפשרת לפרגן בלחיצה אחת והכסף נכנס לחשבון בעלי השמחה בבטחה ובמהירות.
              </p>
              <p className="text-secondary font-medium">
                עומדים לערוך שמחה? תהיו חכמים, תפעילו Giftkal.
              </p>
            </div>

            <Button 
              onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" })}
              size="lg"
              className="bg-gradient-gold text-white shadow-gold hover:shadow-lg transition-all hover:scale-105 mt-8"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              תכירו את Giftkal
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Testimonials Section ─── mazlatgift carousel style
const TestimonialsSection = () => {
  const [active, setActive] = useState(0);
  const { ref, inView } = useInView();

  const testimonials = [
    {
      text: "איזה פתרון מדהים! הכנסנו מתנה תוך שנייה, לגמרי העתיד של המתנות בחתונות.",
      name: "יעל ואלעד",
      event: "חתונה, 2024"
    },
    {
      text: "עכשיו אני פחות מחשבן אם לבוא לחתונות. פיצלתי ל-3 תשלומים ולא נחנקתי בסוף החודש.",
      name: "יוסף חיים שטרית",
      event: "אורח"
    },
    {
      text: "היה לנו פשוט וקל. שלחנו מתנה וזהו, בלי יותר מדי מחשבה. מומלץ בחום!",
      name: "משפחת כהן",
      event: "אורחים, חתונה 2024"
    },
    {
      text: "הכול היה פשוט וזורם. לא היינו צריכים להתארגן מראש או לחשוב על מזומן.",
      name: "נועה ותומר",
      event: "חתונה, 2025"
    },
    {
      text: "המערכת פשוט עובדת! קיבלנו את כל המתנות ישירות לחשבון, בלי כאב ראש.",
      name: "ישראל ושרה",
      event: "חתונה, 2024"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section id="testimonials" className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            מה אומרים על
            <span className="text-gradient-gold"> Giftkal</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            חוויית מתנה שמרגישים. תראו מה מספרים עלינו.
          </p>
        </div>

        <div className={`max-w-4xl mx-auto transition-all duration-700 ${inView ? "opacity-100" : "opacity-0"}`}>
          {/* Carousel */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(${active * 100}%)` }}
              >
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-4">
                    <div className="bg-card rounded-3xl p-10 md:p-14 shadow-xl border border-border/50 text-center relative">
                      <div className="absolute -top-4 right-10 text-7xl text-primary/15 font-serif">"</div>
                      
                      {/* Stars */}
                      <div className="flex justify-center gap-1 mb-6">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="w-5 h-5 text-primary fill-primary" />
                        ))}
                      </div>

                      <p className="text-xl md:text-2xl text-secondary mb-8 leading-relaxed font-medium">
                        {t.text}
                      </p>
                      <p className="font-bold text-secondary text-lg">{t.name}</p>
                      <p className="text-primary text-sm">{t.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation arrows */}
            <button 
              onClick={() => setActive(prev => (prev + 1) % testimonials.length)}
              className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6 w-12 h-12 rounded-full bg-card shadow-lg border border-border/50 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActive(prev => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6 w-12 h-12 rounded-full bg-card shadow-lg border border-border/50 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i === active ? "bg-primary w-8" : "bg-border hover:bg-primary/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Stats Banner ─── mazlatgift bottom stats style
const StatsBanner = () => {
  const eventsCounter = useCounter(1000, 2000);
  const guestsCounter = useCounter(50000, 2000);

  return (
    <section className="py-20 bg-sidebar relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(38_92%_50%_/_0.1),_transparent_60%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            קל. פשוט.
            <span className="text-gradient-gold"> בטוח.</span>
          </h2>
          <p className="text-white/70 text-xl">ככה נותנים היום מתנה.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div ref={eventsCounter.ref} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-gradient-gold mb-2">
              +{eventsCounter.count.toLocaleString()}
            </div>
            <p className="text-white/60 text-sm">אירועים מוצלחים</p>
          </div>
          <div ref={guestsCounter.ref} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-gradient-gold mb-2">
              +{guestsCounter.count.toLocaleString()}
            </div>
            <p className="text-white/60 text-sm">אורחים מרוצים</p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-gradient-gold mb-2 flex items-center justify-center gap-2">
              <Clock className="w-8 h-8" />
              0
            </div>
            <p className="text-white/60 text-sm">שניות להעברה</p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-gradient-gold mb-2 flex items-center justify-center gap-2">
              <Shield className="w-8 h-8" />
              100%
            </div>
            <p className="text-white/60 text-sm">מפוקח ומאובטח</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── For Who Section ─── 
const ForWhoSection = () => {
  const { ref, inView } = useInView();

  const audiences = [
    {
      icon: Users,
      title: "זוגות",
      items: ["חתונות", "אירוסין", "ימי הולדת"],
    },
    {
      icon: Building2,
      title: "בעלי אולמות",
      items: ["ניהול אירועים", "דוחות מפורטים", "עמלות שקופות"],
    },
    {
      icon: PartyPopper,
      title: "מארגני אירועים",
      items: ["Bar/Bat Mitzvah", "אירועי חברה", "מפגשים משפחתיים"],
    }
  ];

  return (
    <section className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
            למי זה
            <span className="text-gradient-gold"> מתאים?</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {audiences.map((a, index) => (
            <div 
              key={index}
              className={`group bg-card rounded-3xl p-10 shadow-lg border border-border/50 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-6 shadow-gold group-hover:scale-110 transition-transform duration-300">
                <a.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-4">{a.title}</h3>
              <ul className="space-y-3">
                {a.items.map((item, i) => (
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

// ─── Lead Form Section ───
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
      toast({ title: "שגיאה", description: "אנא מלא את השדות החובה", variant: "destructive" });
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
      toast({ title: "תודה רבה!", description: "קיבלנו את הפרטים שלך ונחזור אליך בהקדם" });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({ title: "שגיאה", description: "אירעה שגיאה בשליחת הטופס. אנא נסה שוב.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="lead-form" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-card rounded-3xl p-12 shadow-xl border border-border/50 animate-scale-in">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-secondary mb-4">תודה רבה!</h3>
              <p className="text-muted-foreground mb-8 text-lg">קיבלנו את הפרטים שלך ונחזור אליך בהקדם</p>
              <Button onClick={() => setIsSubmitted(false)} variant="outline" size="lg">שלח פרטים נוספים</Button>
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
            <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-6">
              מעוניינים
              <span className="text-gradient-gold"> לשמוע עוד?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              השאירו פרטים ונחזור אליכם בהקדם עם כל המידע שתצטרכו.
            </p>
            
            <div className="space-y-4">
              {["ייעוץ חינם ללא התחייבות", "מענה תוך 24 שעות", "הדרכה אישית למערכת"].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-secondary">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-8 shadow-xl border border-border/50">
            <div className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-secondary font-medium mb-2 block">שם מלא *</Label>
                <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="הכנס את שמך המלא" className="h-12 text-base" required />
              </div>
              <div>
                <Label htmlFor="phone" className="text-secondary font-medium mb-2 block">טלפון *</Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="050-0000000" className="h-12 text-base" required />
              </div>
              <div>
                <Label htmlFor="email" className="text-secondary font-medium mb-2 block">אימייל</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="your@email.com" className="h-12 text-base" />
              </div>
              <div>
                <Label className="text-secondary font-medium mb-3 block">סוג לקוח</Label>
                <RadioGroup value={formData.leadType} onValueChange={(value) => setFormData({...formData, leadType: value})} className="grid grid-cols-2 gap-3">
                  {[
                    { value: "couple", label: "זוג מתחתן" },
                    { value: "venue", label: "בעל אולם" },
                    { value: "organizer", label: "מארגן אירועים" },
                    { value: "other", label: "אחר" }
                  ].map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2 space-x-reverse bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="cursor-pointer text-sm">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg bg-gradient-gold text-white shadow-gold hover:shadow-lg transition-all">
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
    </section>
  );
};

// ─── Footer ───
const Footer = () => {
  return (
    <footer className="bg-sidebar py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <img src={logo} alt="Giftkal" className="h-14 mb-6" />
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              Giftkal - הפלטפורמה המובילה לגביית מתנות דיגיטליות באירועים. 
              מערכת פשוטה, מאובטחת ואלגנטית.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">קישורים</h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-white/60 hover:text-primary transition-colors text-sm">כניסה למערכת</Link></li>
              <li><a href="#lead-form" className="text-white/60 hover:text-primary transition-colors text-sm">צור קשר</a></li>
              <li><a href="#why-us" className="text-white/60 hover:text-primary transition-colors text-sm">למה Giftkal</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">יצירת קשר</h4>
            <ul className="space-y-4">
              <li>
                <a href="tel:+972500000000" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                  050-000-0000
                </a>
              </li>
              <li>
                <a href="mailto:info@giftkal.com" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Mail className="w-4 h-4" /></div>
                  info@giftkal.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/972500000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><MessageCircle className="w-4 h-4" /></div>
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/40 text-sm">© {new Date().getFullYear()} Giftkal. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
};

// ─── Main Component ───
const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <StatementSection />
      <WhyUsSection />
      <AboutSection />
      <ForWhoSection />
      <TestimonialsSection />
      <StatsBanner />
      <LeadFormSection />
      <Footer />
    </div>
  );
};

export default HomePage;
