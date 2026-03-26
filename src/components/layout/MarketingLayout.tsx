import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle, LogIn, X } from "lucide-react";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "דף ראשי", href: "/" },
  { label: "בעלי אירועים", href: "/event-owners" },
  { label: "בעלי אולמות", href: "/venues-page" },
  { label: "יתרונות", href: "/benefits" },
  { label: "מחירים", href: "/pricing" },
  { label: "המלצות", href: "/testimonials-page" },
  { label: "צור קשר", href: "/contact" },
];

const MarketingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
          <Link to="/signup" className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium">
            <LogIn className="w-4 h-4 ml-2" />
            כניסה למערכת
          </Link>
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
            <Link to="/signup" className="block w-full text-right text-white/80 hover:text-primary py-2 text-sm">
              כניסה למערכת
            </Link>
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
                <Link to="/signup" className="text-white/60 hover:text-primary transition-colors text-sm">
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
