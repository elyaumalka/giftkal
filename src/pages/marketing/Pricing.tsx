import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/marketing/PageHero";
import ClosingCTA from "@/components/marketing/ClosingCTA";
import pricingImg from "@/assets/pricing-hero.jpg";

const NAVY = "#051839";
const GOLD = "#AE842D";

const included = [
  "עמוד מתנות אישי מעוצב לאירוע",
  "קישור אישי ו־QR לשיתוף באולם",
  "סליקה מאובטחת ברמה בנקאית",
  "התראות בזמן אמת לכל מתנה",
  "אזור אישי לניהול המתנות והאורחים",
  "ייצוא לאקסל של כל הנתונים",
  "ניהול RSVP ורשימת מוזמנים",
  "תמיכה 24/7 בעברית",
];

const notIncluded = [
  "עמלות סליקה של חברת האשראי (חלות על האורח)",
  "השכרת עמדות קיוסק פיזיות באולם (בתשלום נפרד)",
];

export default function Pricing() {
  return (
    <div dir="rtl" className="bg-[#f5f5f5]">
      <PageHero
        badge="מחירון"
        title="199 ₪ לאירוע"
        subtitle="מחיר קבוע. ללא הפתעות. ללא דמי מנוי."
        description="משלמים פעם אחת ומקבלים גישה מלאה למערכת עד סיום האירוע. אין דמי הקמה, אין דמי שימוש חודשיים ואין עמלות סמויות בסוף הדרך."
        image={pricingImg}
        imageAlt="מחירון"
        primaryCta={{ label: "פתחו אירוע עכשיו ←", to: "/signup" }}
        secondaryCta={{ label: "יש שאלות?", to: "/faq" }}
        imageContain
      />

      {/* Big price card */}
      <section className="max-w-[900px] mx-auto px-6 py-12 lg:py-20">
        <div className="bg-white rounded-[30px] shadow-[0px_20px_60px_-20px_rgba(11,31,74,0.15)] overflow-hidden">
          <div
            className="px-8 lg:px-14 py-10 text-center text-white"
            style={{ background: NAVY }}
          >
            <p className="text-[14px] font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
              חבילת אירוע מלאה
            </p>
            <div className="mt-4 flex items-baseline justify-center gap-2">
              <span className="font-extrabold text-[80px] lg:text-[100px] leading-none" style={{ color: GOLD }}>
                199
              </span>
              <span className="text-[28px] font-light">₪</span>
            </div>
            <p className="mt-2 text-white/80 font-light">חד־פעמי לאירוע, ללא חידוש</p>
          </div>

          <div className="px-8 lg:px-14 py-10">
            <p className="font-bold text-[20px] text-right mb-6" style={{ color: NAVY }}>
              מה כלול?
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {included.map((item) => (
                <li key={item} className="flex gap-3 items-start text-right">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: GOLD }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] font-light" style={{ color: NAVY }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-[#eee] text-right">
              <p className="text-[14px] font-semibold text-[#888] mb-3">מה לא כלול?</p>
              <ul className="space-y-1.5">
                {notIncluded.map((item) => (
                  <li key={item} className="text-[13px] font-light text-[#888]">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row-reverse gap-3">
              <Link
                to="/signup"
                className="flex-1 text-center rounded-[12px] px-8 py-4 text-[16px] font-bold text-white transition hover:opacity-90"
                style={{ background: GOLD }}
              >
                פתחו אירוע עכשיו ←
              </Link>
              <Link
                to="/contact"
                className="flex-1 text-center rounded-[12px] border-2 px-7 py-4 text-[16px] font-semibold transition hover:bg-[#ae842d]/5"
                style={{ borderColor: GOLD, color: GOLD }}
              >
                דברו איתנו
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[13px] text-[#888] mt-6 font-light">
          יש לכם קוד קופון? תוכלו להזין אותו בעת פתיחת האירוע.
        </p>
      </section>

      <ClosingCTA
        title="עוד שאלות לפני שמתחילים?"
        subtitle="ריכזנו את כל השאלות הנפוצות בעמוד השאלות והתשובות."
        primary={{ label: "לשאלות נפוצות ←", to: "/faq" }}
        secondary={{ label: "דברו איתנו", to: "/contact" }}
      />
    </div>
  );
}
