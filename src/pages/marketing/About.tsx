import { Link } from "react-router-dom";
import {
  Link as LinkIcon,
  CreditCard,
  CheckSquare,
  Zap,
  Tag,
  Smartphone,
  Layers,
  Heart,
  BellRing,
  Cake,
  Users,
  Star,
} from "lucide-react";
import heroImg from "@/assets/about-hero.jpg";
import valuesImg from "@/assets/about-values.jpg";
import whyImg from "@/assets/about-why.jpg";

const GOLD = "#AE842D";
const NAVY = "#051839";

const stats = [
  { num: "1,000+", title: "אירועים מאושרים", sub: "ומתמשכים מדי שנה" },
  { num: "199₪", title: "מחיר קבוע לאירוע", sub: "ללא הפתעות וללא עלויות נסתרות" },
  { num: "100%", title: "שקיפות מלאה", sub: "בכל מתנה ובכל רגע" },
  { num: "24/7", title: "זמינות ותמיכה", sub: "לפני, במהלך ואחרי האירוע" },
];

const steps = [
  {
    num: 1,
    Icon: CheckSquare,
    title: "סדר ושליטה",
    body: "בעלי האירוע מקבלים מערכת מסודרת שבה ניתן לראות את המתנות ואת כל הפרטים החשובים - בלי ניירת, בלי בלגן.",
  },
  {
    num: 2,
    Icon: CreditCard,
    title: "האורחים משלימים בקלות",
    body: "האורחים נכנסים לעמוד, בוחרים את סכום המתנה ומשלימים את התהליך במהירות ובנוחות.",
  },
  {
    num: 3,
    Icon: LinkIcon,
    title: "עמוד מתנות אישי",
    body: "לכל אירוע נפתח עמוד מתנות אישי, שאותו ניתן לשתף עם האורחים לפני האירוע, במהלכו או לאחריו.",
  },
];

const values = [
  { Icon: Zap, title: "חווית משתמש במקסימום", body: "תהליך קצר וברור לכל אורח." },
  { Icon: Tag, title: "מחירון פשוט ללא הפתעות", body: "199 ₪ קבוע, ללא הפתעות." },
  { Icon: Smartphone, title: "נוחות", body: "מתנה דרך הטלפון או בעמדה באולם." },
  { Icon: Layers, title: "איזור אישי", body: "כל המתנות מרוכזות במקום אחד." },
  { Icon: Heart, title: "שירות אישי", body: "ליווי מלא מפתיחת האירוע ועד סיומו." },
];

export default function About() {
  return (
    <div dir="rtl" className="bg-[#f5f5f5]">
      {/* Hero */}
      <section className="max-w-[1440px] mx-auto flex flex-col-reverse lg:flex-row items-stretch">
        <div className="flex-1 flex flex-col justify-center gap-7 px-6 lg:px-16 py-12 lg:py-20 text-right">
          <span
            className="inline-block self-start rounded-[20px] px-4 py-1.5 text-[13px] font-semibold text-white uppercase"
            style={{ background: GOLD }}
          >
            בשמחות פלוס
          </span>
          <div>
            <h1
              className="font-extrabold leading-[1.15] text-[40px] lg:text-[56px]"
              style={{ color: NAVY }}
            >
              אודות בשמחות פלוס
            </h1>
            <p className="mt-3 text-[18px] lg:text-[22px] font-light" style={{ color: GOLD }}>
              נותנים מתנה בקליק, וחוגגים בראש שקט
            </p>
          </div>
          <p className="text-[17px] leading-[1.65] font-light" style={{ color: NAVY }}>
            בשמחות פלוס נולדה כדי להפוך את תהליך הענקת וקבלת המתנות באירועים לפשוט, נוח ומתקדם יותר.
          </p>
          <div className="flex gap-4 items-center justify-end">
            <Link
              to="/contact"
              className="rounded-[12px] border-2 px-7 py-3.5 text-[16px] font-semibold transition hover:bg-[#ae842d]/5"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              למידע נוסף
            </Link>
            <Link
              to="/signup"
              className="rounded-[12px] px-8 py-3.5 text-[16px] font-bold text-white transition hover:opacity-90"
              style={{ background: GOLD }}
            >
              פתחו אירוע עכשיו ←
            </Link>
          </div>
        </div>
        <div className="flex-1 min-h-[320px] lg:min-h-[640px] p-4 lg:p-6">
          <img
            src={heroImg}
            alt="אולם אירועים מפואר"
            width={1370}
            height={1280}
            className="w-full h-full object-cover rounded-[30px]"
          />
        </div>
      </section>

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

      {/* How it works */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-40 py-16 lg:py-24">
        <h2
          className="text-center font-extrabold text-[36px] lg:text-[48px] mb-12"
          style={{ color: NAVY }}
        >
          איך זה עובד?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ num, Icon, title, body }) => (
            <div
              key={num}
              className="bg-white rounded-[24px] p-8 shadow-[0px_8px_16px_rgba(0,0,0,0.06)] flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-9 h-9 rounded-[18px] flex items-center justify-center font-extrabold text-[16px] bg-[#f2f0eb]"
                  style={{ color: GOLD }}
                >
                  {num}
                </div>
                <div
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                  style={{ background: GOLD }}
                >
                  <Icon className="w-[22px] h-[22px] text-white" strokeWidth={2} />
                </div>
              </div>
              <h3 className="font-bold text-[22px] text-right" style={{ color: NAVY }}>
                {title}
              </h3>
              <p className="font-light text-[15px] leading-[1.6] text-right text-[#444]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-white">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-10 lg:gap-16 items-center px-6 lg:px-32 py-16 lg:py-24">
          <div className="w-full lg:w-[480px] lg:h-[540px]">
            <img
              src={valuesImg}
              alt="הערכים שלנו"
              width={960}
              height={1080}
              loading="lazy"
              className="w-full h-full object-contain rounded-[32px]"
            />
          </div>
          <div className="flex-1 flex flex-col gap-8">
            <div className="text-right">
              <p className="text-[13px] font-semibold uppercase mb-2" style={{ color: GOLD }}>
                הערכים שלנו
              </p>
              <h2 className="font-extrabold text-[36px] lg:text-[44px]" style={{ color: NAVY }}>
                מה חשוב לנו?
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {values.map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="bg-[#f9f7f3] rounded-[16px] p-5 flex gap-3 items-start"
                >
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ background: GOLD }}
                  >
                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-bold text-[17px]" style={{ color: NAVY }}>
                      {title}
                    </p>
                    <p className="font-light text-[13px] text-[#555] leading-[1.5] mt-1">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why + suitable */}
      <section className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-10 lg:gap-16 items-center px-6 lg:px-32 py-16 lg:py-24">
        <div className="flex-1 flex flex-col gap-8">
          <h2
            className="font-extrabold text-[36px] lg:text-[44px] leading-[1.2] text-right"
            style={{ color: NAVY }}
          >
            למה הקמנו את בשמחות פלוס?
          </h2>
          <p className="font-light text-[17px] leading-[1.7] text-right text-[#333]">
            העולם מתקדם לדיגיטל, אבל תהליך המתנות באירועים עדיין נשאר לעיתים מיושן ומסורבל. רצינו
            ליצור פתרון פשוט עבור האורחים, ומצד שני להעניק לבעלי האירוע שקט נפשי וחוויית שימוש
            נעימה.
          </p>
          <div className="bg-white rounded-[20px] p-7 shadow-[0px_6px_12px_rgba(0,0,0,0.06)] flex flex-col gap-4">
            <p className="font-bold text-[20px] text-right" style={{ color: NAVY }}>
              מתאים לכל שמחה
            </p>
            <p className="font-light text-[15px] leading-[1.65] text-right text-[#444]">
              בשמחות פלוס מתאימה לחתונות, בר מצוות, בת מצוות, בריתות, אירוסין, ימי הולדת ולאירועים
              משפחתיים ועסקיים נוספים.
            </p>
            <div className="flex gap-3 items-center justify-end">
              {[BellRing, Cake, Heart, Users, Star].map((Ic, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-[14px] bg-[#f2f0eb] flex items-center justify-center"
                >
                  <Ic className="w-[22px] h-[22px]" style={{ color: GOLD }} strokeWidth={2} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full lg:w-[480px] lg:h-[520px]">
          <img
            src={whyImg}
            alt="בשמחות פלוס"
            width={960}
            height={1040}
            loading="lazy"
            className="w-full h-full object-contain rounded-[32px]"
          />
        </div>
      </section>
    </div>
  );
}
