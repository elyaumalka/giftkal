import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, MessageCircle, LogIn, X, User, Loader2, Eye, EyeOff, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "דף ראשי", href: "/" },
  { label: "בעלי אירועים", href: "/event-owners" },
  { label: "בעלי אולמות", href: "/venues-page" },
  { label: "מחירים", href: "/pricing" },
  { label: "צור קשר", href: "/contact" },
];

const MarketingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const loginRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setLoginOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Get profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", session.user.id)
          .maybeSingle();

        // Get role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        const role = roles?.[0]?.role || "event_owner";
        setUser({
          name: profile?.full_name || session.user.email?.split("@")[0] || "משתמש",
          role,
        });
      } else {
        setUser(null);
      }
    });

    // Initial check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", session.user.id)
          .maybeSingle();

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        const role = roles?.[0]?.role || "event_owner";
        setUser({
          name: profile?.full_name || session.user.email?.split("@")[0] || "משתמש",
          role,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin": return "/admin";
      case "venue_owner": return "/venue";
      case "event_owner": return "/event";
      default: return "/event";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "יש למלא אימייל וסיסמה", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "התחברת בהצלחה! 🎉" });
      setLoginOpen(false);
      setEmail("");
      setPassword("");
      // Fetch role directly and navigate
      const userId = signInData.user?.id;
      if (userId) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
        if (roles?.some(r => r.role === "admin")) {
          navigate("/admin");
        } else if (roles?.some(r => r.role === "venue_owner")) {
          navigate("/venue");
        } else if (roles?.some(r => r.role === "event_owner")) {
          navigate("/event");
        } else {
          navigate("/event");
        }
      }
    } catch (err: any) {
      toast({ title: "שגיאה בהתחברות", description: err.message === "Invalid login credentials" ? "אימייל או סיסמה שגויים" : err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoginOpen(false);
    navigate("/");
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "bg-sidebar/95 backdrop-blur-xl shadow-2xl py-2" : "bg-transparent py-4"
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/">
          <img src={logo} alt="Giftkal" className="h-10 md:h-12" />
        </Link>

        <div className="hidden lg:flex items-center gap-5">
          {navLinks.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "text-primary"
                  : "text-white/70 hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Login / User area */}
          <div className="relative" ref={loginRef}>
            {user ? (
              // Logged in state
              <button
                onClick={() => setLoginOpen(!loginOpen)}
                className="text-white/80 hover:text-white hover:bg-white/10 hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <User className="w-4 h-4 ml-1" />
                ברוך הבא, {user.name}
              </button>
            ) : (
              // Logged out state
              <button
                onClick={() => setLoginOpen(!loginOpen)}
                className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium"
              >
                <LogIn className="w-4 h-4 ml-2" />
                כניסה למערכת
              </button>
            )}

            {/* Dropdown */}
            {loginOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-sidebar/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-5 animate-fade-in z-[100]" dir="rtl">
                {user ? (
                  // Logged in dropdown
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-white/50 text-xs">
                          {user.role === "admin" ? "מנהל מערכת" : user.role === "venue_owner" ? "בעל אולם" : "בעל אירוע"}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      className="flex items-center gap-2 text-white/80 hover:text-primary text-sm py-2 transition-colors"
                      onClick={() => setLoginOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      אזור אישי
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm py-2 transition-colors w-full text-right"
                    >
                      <LogOut className="w-4 h-4" />
                      התנתקות
                    </button>
                  </div>
                ) : (
                  // Login form
                  <form onSubmit={handleLogin} className="space-y-4">
                    <h3 className="text-white font-bold text-lg text-center mb-1">כניסה למערכת</h3>
                    <p className="text-white/50 text-xs text-center mb-3">הזינו את פרטי ההתחברות שלכם</p>

                    <div>
                      <Input
                        type="email"
                        placeholder="אימייל"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-right h-11"
                        dir="ltr"
                      />
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="סיסמה"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-right h-11 pr-3 pl-10"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      variant="gold"
                      className="w-full h-11"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "התחברות"}
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <Link
                        to="/reset-password"
                        className="text-white/50 hover:text-primary transition-colors"
                        onClick={() => setLoginOpen(false)}
                      >
                        שכחתי סיסמה
                      </Link>
                      <Link
                        to="/signup"
                        className="text-primary hover:text-primary/80 font-medium transition-colors"
                        onClick={() => setLoginOpen(false)}
                      >
                        הרשמה חדשה
                      </Link>
                    </div>

                    <div className="border-t border-white/10 pt-3 mt-2">
                      <Link
                        to="/access"
                        className="text-white/40 hover:text-white/60 text-xs flex items-center justify-center gap-1 transition-colors"
                        onClick={() => setLoginOpen(false)}
                      >
                        כניסה כבעל אולם / שליחת מתנה
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <Link to="/pricing">
            <Button variant="gold" size="default">
              הצטרפו עכשיו
            </Button>
          </Link>
          <button className="lg:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : (
              <div className="space-y-1.5">
                <span className="block w-6 h-0.5 bg-white" />
                <span className="block w-6 h-0.5 bg-white" />
                <span className="block w-6 h-0.5 bg-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-sidebar/98 backdrop-blur-xl border-t border-white/10 animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navLinks.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className={`block w-full text-right py-2 text-sm ${
                  location.pathname === item.href ? "text-primary font-medium" : "text-white/80 hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to={getDashboardPath()} className="block w-full text-right text-primary font-medium py-2 text-sm">
                  אזור אישי — {user.name}
                </Link>
                <button onClick={handleLogout} className="block w-full text-right text-red-400 py-2 text-sm">
                  התנתקות
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                className="block w-full text-right text-white/80 hover:text-primary py-2 text-sm"
              >
                כניסה למערכת
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const MarketingFooter = () => {
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
              {navLinks.slice(0, 5).map(item => (
                <li key={item.href}>
                  <Link to={item.href} className="text-white/60 hover:text-primary transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/access" className="text-white/60 hover:text-primary transition-colors text-sm">
                  כניסה למערכת
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">יצירת קשר</h4>
            <ul className="space-y-4">
              <li>
                <a href="tel:+97223131700" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                  02-3131700
                </a>
              </li>
              <li>
                <a href="mailto:g023131700@gmail.com" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Mail className="w-4 h-4" /></div>
                  g023131700@gmail.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/97223131700" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors text-sm">
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

const MarketingLayout = () => {
  return (
    <div className="min-h-screen">
      <MarketingNavbar />
      <Outlet />
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;
