import { Link } from "react-router-dom";
import { PartyPopper, Building2, Gift, UserPlus, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

const AccessPage = () => {
  const panels = [
    { icon: PartyPopper, label: "בעלי אירועים", desc: "יש לכם אירוע? נכנסים כאן 🎉", href: "/login/event", color: "from-pink-500/20 to-primary/10" },
    { icon: Building2, label: "בעלי אולמות", desc: "מנהלים אולם? כאן הכניסה 🏛️", href: "/login/venue", color: "from-blue-500/20 to-primary/10" },
    { icon: Gift, label: "רוצים להעביר מתנה?", desc: "חפשו את האירוע ושלחו מתנה 🎁", href: "/gift-search", color: "from-amber-500/20 to-primary/10" },
    { icon: UserPlus, label: "רוצים להצטרף?", desc: "פתחו אירוע חדש ב-Giftkal ✨", href: "/signup", color: "from-green-500/20 to-primary/10" },
  ];

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,_hsl(38_92%_50%_/_0.12),_transparent_70%)]" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Link to="/">
            <img src={logo} alt="Giftkal" className="h-14 mx-auto mb-8" />
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            ברוכים הבאים ל-<span className="text-gradient-gold">Giftkal</span>
          </h1>
          <p className="text-white/60 text-lg">בחרו את הכניסה המתאימה לכם</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {panels.map((p, i) => (
            <Link
              key={i}
              to={p.href}
              className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center hover:bg-white/10 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <p.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{p.label}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/" className="text-white/40 hover:text-white/70 text-sm inline-flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessPage;
