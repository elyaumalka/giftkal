import { Link } from "react-router-dom";
import { PartyPopper, Building2, Gift, UserPlus, ArrowLeft, Sparkles } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";

const GOLD = "#AE842D";
const NAVY = "#051839";

const AccessPage = () => {
  const panels = [
    { icon: PartyPopper, label: "בעלי אירועים", desc: "יש לכם אירוע? נכנסים כאן", href: "/login/event" },
    { icon: Building2, label: "בעלי אולמות", desc: "מנהלים אולם? כאן הכניסה", href: "/login/venue" },
    { icon: Gift, label: "רוצים להעביר מתנה?", desc: "חפשו את האירוע ושלחו מתנה", href: "/gift-search" },
    { icon: UserPlus, label: "רוצים להצטרף?", desc: "פתחו אירוע חדש ב-Giftkal", href: "/signup" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] relative overflow-hidden" dir="rtl">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-30" style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }} />
      <div className="pointer-events-none absolute -bottom-40 -left-32 w-[560px] h-[560px] rounded-full blur-3xl opacity-25" style={{ background: `radial-gradient(circle, ${NAVY} 0%, transparent 70%)` }} />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <Link to="/" className="inline-block">
            <img src={logoAsset.url} alt="Giftkal" className="h-14 mx-auto mb-8" />
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border mb-6" style={{ borderColor: `${GOLD}33` }}>
            <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-sm font-medium" style={{ color: NAVY }}>ברוכים הבאים</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: NAVY }}>
            ברוכים הבאים ל-<span style={{ color: GOLD }}>Giftkal</span>
          </h1>
          <p className="text-lg" style={{ color: `${NAVY}99` }}>בחרו את הכניסה המתאימה לכם</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {panels.map((p, i) => (
            <Link
              key={i}
              to={p.href}
              className="group bg-white rounded-[30px] p-8 text-center transition-all duration-500 animate-fade-in hover:-translate-y-2"
              style={{
                animationDelay: `${i * 100}ms`,
                boxShadow: "0 20px 60px -20px rgba(5,24,57,0.15)",
                border: `1px solid ${GOLD}20`,
              }}
            >
              <div
                className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300"
                style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD}CC 100%)` }}
              >
                <p.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: NAVY }}>{p.label}</h3>
              <p className="text-sm leading-relaxed" style={{ color: `${NAVY}88` }}>{p.desc}</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition-colors"
            style={{ color: NAVY, border: `1px solid ${GOLD}33` }}
          >
            <ArrowLeft className="w-4 h-4" />
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessPage;
