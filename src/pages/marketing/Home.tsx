import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Shield, Smartphone } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";
import ClosingCTA from "@/components/marketing/ClosingCTA";
import heroImg from "@/assets/home-hero.jpg";

const NAVY = "#051839";
const GOLD = "#AE842D";

const stats = [
  { num: "1,000+", title: "אירועים מאושרים", sub: "ומתמשכים מדי שנה" },
  { num: "199₪", title: "מחיר קבוע לאירוע", sub: "ללא הפתעות" },
  { num: "100%", title: "שקיפות מלאה", sub: "בכל מתנה ובכל רגע" },
  { num: "24/7", title: "זמינות ותמיכה", sub: "לפני, במהלך ואחרי" },
];

const teasers = [
  {
    Icon: Smartphone,
    title: "איך זה עובד?",
    body: "3 שלבים פשוטים לאירוע דיגיטלי — פתיחת עמוד, שיתוף עם האורחים, וקבלת המתנות ישירות אליכם.",
    to: "/how-it-works",
  },
  {
    Icon: Shield,
    title: "למה דווקא אנחנו?",
    body: "מחיר קבוע, ליווי אישי, שקיפות מלאה וממשק שהאורחים באמת אוהבים להשתמש בו.",
    to: "/why-us",
  },
  {
    Icon: Sparkles,
    title: "מחירון פשוט",
    body: "199 ₪ לאירוע. אין דמי מנוי, אין עמלות נסתרות, אין הפתעות בסוף הערב.",
    to: "/pricing",
  },
];

export default function Home() {
  return (
    <div dir="rtl" className="bg-[#f5f5f5]">
      <PageHero
        badge="בשמחות פלוס"
        title="המתנות המושלמות לאירוע שלכם"
        subtitle="נותנים מתנה בקליק, וחוגגים בראש שקט"
        description="פלטפורמה דיגיטלית שהופכת את הענקת המתנות באירועים לפשוטה, מכובדת ונוחה — לאורחים ולבעלי השמחה."
        image={heroImg}
        imageAlt="אירוע מפואר"
        primaryCta={{ label: "פתחו אירוע עכשיו ←", to: "/signup" }}
        secondaryCta={{ label: "איך זה עובד?", to: "/how-it-works" }}
      />

      {/* Stats */}
      <section className="max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 border-t border-[#e8e2d5]">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`text-center px-6 py-12 border-b border-[#e8e2d5] ${
              i < stats.length - 1 ? "lg:border-l" : ""
            } ${i % 2 === 0 ? "border-l lg:border-l" : ""}`}
          >
            <p className="font-extrabold text-[44px] lg:text-[56px]" style={{ color: GOLD }}>
              {s.num}
            </p>
            <p className="text-[16px] mt-2" style={{ color: NAVY }}>
              {s.title}
            </p>
            <p className="text-[14px] font-light text-[#888] mt-1">{s.sub}</p>
          </div>
        ))}
      </section>

      {/* Teasers */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-32 py-16 lg:py-24">
        <div className="text-center mb-12">
          <p className="text-[13px] font-semibold uppercase mb-2" style={{ color: GOLD }}>
            בשמחות פלוס
          </p>
          <h2
            className="font-extrabold text-[36px] lg:text-[44px]"
            style={{ color: NAVY }}
          >
            כל מה שאירוע מודרני צריך
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {teasers.map(({ Icon, title, body, to }) => (
            <Link
              key={to}
              to={to}
              className="group bg-white rounded-[24px] p-8 shadow-[0px_8px_16px_rgba(0,0,0,0.06)] flex flex-col gap-5 text-right hover:-translate-y-1 transition"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center"
                  style={{ background: GOLD }}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <ArrowLeft className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:-translate-x-1 transition" style={{ color: GOLD }} />
              </div>
              <h3 className="font-bold text-[22px]" style={{ color: NAVY }}>
                {title}
              </h3>
              <p className="font-light text-[15px] leading-[1.6] text-[#444]">{body}</p>
            </Link>
          ))}
        </div>
      </section>

      <ClosingCTA />
    </div>
  );
}
