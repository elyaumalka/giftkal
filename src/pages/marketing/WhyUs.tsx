import { Tag, Eye, Smartphone, Heart, Lock, Layers, Check, X } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";
import ClosingCTA from "@/components/marketing/ClosingCTA";
import whyImg from "@/assets/whyus-hero.jpg";

const NAVY = "#051839";
const GOLD = "#AE842D";

const features = [
  { Icon: Tag, title: "מחיר קבוע — 199₪", body: "משלמים פעם אחת עבור האירוע. ללא דמי מנוי, ללא עמלות סמויות." },
  { Icon: Eye, title: "שקיפות מלאה", body: "כל מתנה מתועדת בזמן אמת. אתם רואים מי, כמה ומתי." },
  { Icon: Smartphone, title: "נוחות לאורחים", body: "אין אפליקציה להתקין. הכל רץ מהדפדפן ותוך פחות מדקה." },
  { Icon: Heart, title: "ליווי אישי", body: "מוקד תמיכה בעברית לפני, במהלך ואחרי האירוע — 24/7." },
  { Icon: Lock, title: "אבטחה ברמה בנקאית", body: "סליקה מאובטחת דרך ספק PCI-DSS מוסמך. הכסף שלכם מוגן." },
  { Icon: Layers, title: "איזור אישי מסודר", body: "כל המתנות, האורחים והדוחות במקום אחד — עם ייצוא לאקסל." },
];

const compareRows = [
  { label: "אין צורך לשמור מזומן", us: true, them: false },
  { label: "רישום אוטומטי של המתנות", us: true, them: false },
  { label: "אפשרות מתנה גם מרחוק", us: true, them: false },
  { label: "העברה ישירה לחשבון הבנק", us: true, them: false },
  { label: "ניהול אורחים ו־RSVP", us: true, them: false },
];

export default function WhyUs() {
  return (
    <div dir="rtl" className="bg-[#f5f5f5]">
      <PageHero
        badge="למה דווקא אנחנו"
        title="לא סתם עוד פלטפורמת מתנות"
        subtitle="בשמחות פלוס נבנתה סביב מי שחוגגים באמת"
        description="לקחנו את כל מה שמעצבן באירועים — מעטפות שנעלמות, מזומן שנספר בבהילות, חוסר סדר בסוף הערב — והפכנו הכל לחוויה שקטה, מסודרת ומכובדת."
        image={whyImg}
        imageAlt="למה דווקא אנחנו"
        primaryCta={{ label: "פתחו אירוע עכשיו ←", to: "/signup" }}
        secondaryCta={{ label: "מחירון", to: "/pricing" }}
        imageContain
      />

      {/* Features */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-32 py-16 lg:py-24">
        <div className="text-right mb-10">
          <p className="text-[13px] font-semibold uppercase mb-2" style={{ color: GOLD }}>
            היתרונות שלנו
          </p>
          <h2 className="font-extrabold text-[32px] lg:text-[44px]" style={{ color: NAVY }}>
            6 סיבות לבחור בבשמחות פלוס
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="bg-white rounded-[20px] p-6 shadow-[0px_8px_16px_rgba(0,0,0,0.06)] flex gap-4 items-start"
            >
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: GOLD }}
              >
                <Icon className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="text-right flex-1">
                <p className="font-bold text-[17px]" style={{ color: NAVY }}>
                  {title}
                </p>
                <p className="font-light text-[14px] text-[#555] leading-[1.55] mt-1">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-16 py-16 lg:py-24">
          <h2
            className="font-extrabold text-[32px] lg:text-[40px] text-center mb-10"
            style={{ color: NAVY }}
          >
            השוואה מהירה
          </h2>
          <div className="rounded-[24px] overflow-hidden border border-[#e8e2d5]">
            <div className="grid grid-cols-3 bg-[#f9f7f3] text-center font-bold" style={{ color: NAVY }}>
              <div className="py-5 px-4 text-right">מה מקבלים</div>
              <div className="py-5 px-4" style={{ color: GOLD }}>
                בשמחות פלוס
              </div>
              <div className="py-5 px-4 text-[#888]">מעטפות מסורתיות</div>
            </div>
            {compareRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 items-center ${i % 2 === 0 ? "bg-white" : "bg-[#faf8f4]"}`}
              >
                <div className="py-4 px-4 text-right text-[15px]" style={{ color: NAVY }}>
                  {row.label}
                </div>
                <div className="py-4 px-4 flex justify-center">
                  {row.us ? <Check className="w-6 h-6" style={{ color: GOLD }} /> : <X className="w-6 h-6 text-[#ccc]" />}
                </div>
                <div className="py-4 px-4 flex justify-center">
                  {row.them ? <Check className="w-6 h-6 text-[#ccc]" /> : <X className="w-6 h-6 text-[#ccc]" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-32 py-16 lg:py-24">
        <div className="bg-white rounded-[24px] p-10 lg:p-14 shadow-[0px_8px_16px_rgba(0,0,0,0.06)] text-right">
          <p
            className="text-[22px] lg:text-[26px] leading-[1.6] font-light"
            style={{ color: NAVY }}
          >
            "פתחנו אירוע בשמחות פלוס לחתונה של הבן שלנו והכל היה חלק להפליא. האורחים אהבו את
            הפשטות, אנחנו קיבלנו את הסיכום המלא בבוקר שאחרי, וזהו — בלי מעטפות, בלי כאב ראש."
          </p>
          <p className="mt-6 font-bold text-[16px]" style={{ color: GOLD }}>
            — משפחת כהן, חתונה בנתניה
          </p>
        </div>
      </section>

      <ClosingCTA />
    </div>
  );
}
