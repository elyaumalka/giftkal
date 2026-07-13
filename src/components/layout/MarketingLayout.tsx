import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Phone, Mail, MessageCircle, User, Menu, X } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";

const NAV_LINKS = [
  { label: "דף הבית", href: "/" },
  { label: "איך זה עובד?", href: "/#how" },
  { label: "למה דווקא אנחנו?", href: "/#features" },
  { label: "מחירון", href: "/#pricing" },
  { label: "שאלות ותשובות", href: "/#faq" },
  { label: "אודות", href: "/about" },
  { label: "יצירת קשר", href: "/contact" },
];

const MarketingNavbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isActive = (href: string) =>
    href.startsWith("/") && !href.includes("#") ? location.pathname === href : false;

  return (
    <header className="pt-3 px-3 md:px-6 bg-[#F5F5F5]">
      <nav className="mx-auto max-w-[1402px] bg-[#051839] rounded-[30px] h-[72px] md:h-[93px] flex items-center justify-between px-4 md:px-6 gap-4">
        {/* Logo circle (RIGHT in RTL — first child) */}
        <Link
          to="/"
          className="bg-white rounded-[30px] h-[56px] md:h-[69px] w-[110px] md:w-[129px] flex items-center justify-center shrink-0 shadow-sm"
        >
          <img src={logoAsset.url} alt="Giftkal" className="max-h-[48px] md:max-h-[58px] w-auto object-contain" />
        </Link>

        {/* Center nav (desktop) */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-center">
          {NAV_LINKS.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-[15px] transition-colors whitespace-nowrap ${
                isActive(item.href)
                  ? "text-white font-bold"
                  : "text-white/90 hover:text-[#AE842D] font-light"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/access" className="flex items-center gap-1.5 text-white/90 hover:text-[#AE842D] text-[15px] transition-colors">
            <User className="w-4 h-4" />
            <span>כניסה למערכת</span>
          </Link>
        </div>

        {/* Phone chip (LEFT in RTL — last child) */}
        <a
          href="tel:02-3131700"
          className="hidden sm:flex items-center gap-2 bg-[#ECEDF0] hover:bg-white transition-colors rounded-[20px] h-[46px] px-4 min-w-[180px] justify-center"
        >
          <Phone className="w-5 h-5 text-[#051839]" strokeWidth={2.2} />
          <span className="text-[#051839] text-lg font-medium">02-3131700</span>
        </a>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="תפריט"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden mx-auto max-w-[1402px] mt-2 bg-[#051839] rounded-[24px] p-4 space-y-2 animate-fade-in">
          {NAV_LINKS.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`block w-full text-right py-2 px-3 rounded-lg text-[15px] ${
                isActive(item.href)
                  ? "text-white font-bold bg-white/10"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/access" className="flex items-center justify-end gap-2 w-full text-right py-2 px-3 text-white/90 border-t border-white/10 mt-2 pt-3">
            <span>כניסה למערכת</span>
            <User className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  );
};

const MarketingFooter = () => {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-[#F5F5F5] px-3 md:px-6 pt-8 pb-6">
      <div className="mx-auto max-w-[1408px] bg-[#051839] rounded-[30px] p-6 md:p-10 lg:p-12 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Nav menu — RIGHT in RTL */}
          <div className="text-right order-2 lg:order-1">
            <h4 className="text-2xl md:text-3xl font-extrabold mb-6">תפריט ניווט</h4>
            <ul className="space-y-3 text-lg md:text-xl font-light">
              {NAV_LINKS.map(item => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`hover:text-[#AE842D] transition-colors ${
                      item.href === "/contact" ? "font-extrabold" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful links */}
          <div className="text-right order-3 lg:order-2">
            <h4 className="text-2xl md:text-3xl font-extrabold mb-6">קישורים שימושיים</h4>
            <ul className="space-y-3 text-lg md:text-xl font-light">
              <li><Link to="/accessibility" className="hover:text-[#AE842D] transition-colors">הצהרת נגישות</Link></li>
              <li><Link to="/terms" className="hover:text-[#AE842D] transition-colors">תנאי שימוש</Link></li>
              <li><Link to="/privacy" className="hover:text-[#AE842D] transition-colors">מדיניות פרטיות</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="text-right order-4 lg:order-3">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3 leading-tight">
              עדכונים וחדשות
              <br />
              בתחום האירועים
            </h3>
            <p className="text-white/80 text-base md:text-lg font-light mb-5">
              הצטרפו עכשיו לרשימת התפוצה במייל
            </p>
            <div className="space-y-3 max-w-[320px] mr-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="מה כתובת המייל שלך?"
                className="w-full h-[56px] rounded-full bg-white text-[#051839] placeholder:text-[#051839]/60 text-right px-6 outline-none focus:ring-2 focus:ring-[#AE842D]"
              />
              <button className="w-full h-[56px] rounded-full bg-[#AE842D] hover:bg-[#c69838] transition-colors text-white font-bold text-lg">
                להצטרפות ←
              </button>
            </div>
          </div>

          {/* Contact card — LEFT in RTL */}
          <div className="order-1 lg:order-4">
            <div className="bg-white text-[#051839] rounded-[24px] p-6 h-full flex flex-col">
              <Link to="/" className="mb-6 flex justify-center">
                <img src={logoAsset.url} alt="Giftkal" className="h-16 md:h-20 w-auto" />
              </Link>
              <div className="space-y-4">
                <a href="tel:02-3131700" className="flex items-center justify-between gap-3 hover:text-[#AE842D] transition-colors">
                  <span className="text-lg font-medium">02-3131700</span>
                  <span className="w-10 h-10 rounded-full bg-[#F2F0EB] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </span>
                </a>
                <a href="mailto:g023131700@gmail.com" className="flex items-center justify-between gap-3 hover:text-[#AE842D] transition-colors">
                  <span className="text-base md:text-lg font-medium break-all">g023131700@gmail.com</span>
                  <span className="w-10 h-10 rounded-full bg-[#F2F0EB] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </span>
                </a>
                <a href="https://wa.me/97223131700" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 hover:text-[#AE842D] transition-colors">
                  <span className="text-lg font-medium">02-3131700</span>
                  <span className="w-10 h-10 rounded-full bg-[#F2F0EB] flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-white/50 text-sm">
          © {new Date().getFullYear()} Giftkal. כל הזכויות שמורות.
        </div>
      </div>
    </footer>
  );
};

const MarketingLayout = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F5]" dir="rtl">
      <MarketingNavbar />
      <main>
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;
