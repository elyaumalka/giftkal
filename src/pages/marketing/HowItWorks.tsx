import { Link as LinkIcon, CreditCard, CheckSquare, Share2, Bell, Wallet } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";
import ClosingCTA from "@/components/marketing/ClosingCTA";
import howImg from "@/assets/how-hero.jpg";

const NAVY = "#051839";
const GOLD = "#AE842D";

const steps = [
  {
    num: 1,
    Icon: CheckSquare,
    title: "פותחים אירוע במערכת",
    body: "רישום קצר, בחירת סוג האירוע (חתונה, בר/בת מצווה, ברית ועוד) ומילוי הפרטים החשובים. תוך דקות תקבלו עמוד אירוע פעיל.",
  },
  {
    num: 2,
    Icon: LinkIcon,
    title: "משתפים עמוד מתנות אישי",
    body: "כל אירוע מקבל עמוד ייעודי עם עיצוב יפה, טקסטים אישיים ותמונה. אפשר לשתף בוואטסאפ, בהזמנה או ב־QR באולם.",
  },
  {
    num: 3,
    Icon: CreditCard,
    title: "האורחים משלימים בקליק",
    body: "האורח בוחר סכום, מזין פרטי תשלום מאובטח וסיים. כל התהליך אורך פחות מדקה — מהטלפון או מעמדה באולם.",
  },
];

const extras = [
  {
    Icon: Bell,
    title: "התראות בזמן אמת",
    body: "בכל מתנה שמתקבלת מגיעה התראה למייל ולוואטסאפ, כך שאתם תמיד יודעים מה קורה.",
  },
  {
    Icon: Wallet,
    title: "העברה ישירה לחשבון",
    body: "הכספים עוברים לחשבון הבנק שלכם — בלי מזומן באולם, בלי מעטפות, בלי בלגן.",
  },
  {
    Icon: Share2,
    title: "אזור אישי מסודר",
    body: "רואים את כל המתנות בטבלה, מסננים לפי אורח, ומיצאים לאקסל בלחיצה.",
  },
];

export default function HowItWorks() {
  return (
    <div dir="rtl" className="bg-[#f5f5f5]">
      <PageHero
        badge="איך זה עובד"
        title="3 שלבים ואתם מוכנים"
        subtitle="פשוט, מהיר, ובלי כאבי ראש"
        description="בנינו את התהליך כך שגם בעלי אירוע וגם אורחים ירגישו בנוח — בלי אפליקציות להוריד, בלי טפסים ארוכים, ובלי דרישות תשלום מסובכות."
        image={howImg}
        imageAlt="איך זה עובד"
        primaryCta={{ label: "פתחו אירוע עכשיו ←", to: "/signup" }}
        secondaryCta={{ label: "מחירון", to: "/pricing" }}
        imageContain
      />

      {/* Steps */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-32 py-16 lg:py-24">
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

      {/* Extras */}
      <section className="bg-white">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-32 py-16 lg:py-24">
          <div className="text-right mb-10">
            <p className="text-[13px] font-semibold uppercase mb-2" style={{ color: GOLD }}>
              מה מקבלים
            </p>
            <h2 className="font-extrabold text-[32px] lg:text-[40px]" style={{ color: NAVY }}>
              מה קורה מאחורי הקלעים?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {extras.map(({ Icon, title, body }) => (
              <div key={title} className="bg-[#f9f7f3] rounded-[16px] p-6 flex gap-4 items-start">
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
                  <p className="font-light text-[14px] text-[#555] leading-[1.5] mt-1">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ClosingCTA />
    </div>
  );
}
