import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PageHero from "@/components/marketing/PageHero";
import ClosingCTA from "@/components/marketing/ClosingCTA";
import faqImg from "@/assets/faq-hero.jpg";

const NAVY = "#051839";
const GOLD = "#AE842D";

const groups = [
  {
    title: "כללי",
    items: [
      {
        q: "מה זה בשמחות פלוס?",
        a: "בשמחות פלוס היא פלטפורמה דיגיטלית להענקת מתנות באירועים — האורחים נותנים מתנה בקליק דרך עמוד ייעודי, והכסף עובר ישירות לחשבון הבנק של בעלי השמחה.",
      },
      {
        q: "לאילו סוגי אירועים זה מתאים?",
        a: "לחתונות, בר ובת מצווה, בריתות, אירוסין, ימי הולדת, יובלים, אירועים משפחתיים ואירועים עסקיים.",
      },
      {
        q: "כמה זמן לוקח להקים אירוע?",
        a: "רישום ופתיחת עמוד אירוע לוקחים כ־3 דקות. תוך פחות מרבע שעה תוכלו לשתף את הקישור עם האורחים.",
      },
    ],
  },
  {
    title: "תשלום ומחיר",
    items: [
      {
        q: "כמה זה עולה?",
        a: "199 ₪ לאירוע — מחיר קבוע וחד־פעמי. ללא דמי מנוי, ללא עמלות סמויות וללא חידוש.",
      },
      {
        q: "יש עמלות נוספות?",
        a: "עמלת סליקה של חברת האשראי חלה על האורח בתהליך המתנה, ולא על בעלי האירוע. הסכום המלא של המתנה מגיע אליכם.",
      },
      {
        q: "מתי ואיך הכסף מגיע אליי?",
        a: "הכספים מועברים לחשבון הבנק שלכם ישירות מספק הסליקה, בהתאם ללוחות הזמנים הסטנדרטיים של סליקה בישראל (בין 1 ל־3 ימי עסקים).",
      },
    ],
  },
  {
    title: "אורחים",
    items: [
      {
        q: "האורחים צריכים להוריד אפליקציה?",
        a: "לא. הכל רץ מהדפדפן של הטלפון — האורח לוחץ על הקישור, בוחר סכום, מזין פרטי אשראי וסיים.",
      },
      {
        q: "האורח יכול לתת מתנה מרחוק?",
        a: "כן. הקישור לעמוד המתנות עובד מכל מקום בעולם, לפני האירוע, במהלכו או אחריו.",
      },
      {
        q: "מה קורה אם האורח לא רוצה תשלום דיגיטלי?",
        a: "אין בעיה — אפשר להמשיך לקבל מזומן/צ'ק במקביל. הפלטפורמה היא תוספת נוחה, לא החלפה כפויה.",
      },
    ],
  },
  {
    title: "לבעלי אירוע",
    items: [
      {
        q: "איך אני יודע/ת כמה מתנות קיבלתי?",
        a: "באיזור האישי במערכת תראו את סך המתנות, פילוח לפי אורח, זמן וסכום. אפשר לייצא הכל לאקסל.",
      },
      {
        q: "האם המידע שלי מאובטח?",
        a: "כן. הסליקה עוברת דרך ספק PCI-DSS מוסמך, פרטי האשראי לא נשמרים אצלנו, וכל המידע מוצפן.",
      },
      {
        q: "אפשר לבטל אירוע ולקבל החזר?",
        a: "כן — ניתן לבטל את השירות עד 14 ימים ממועד הרכישה בהתאם לחוק. פנו אלינו דרך עמוד יצירת הקשר.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div dir="rtl" className="bg-[#f5f5f5]">
      <PageHero
        badge="שאלות ותשובות"
        title="כל התשובות במקום אחד"
        subtitle="לא מצאתם? אנחנו כאן 24/7"
        description="ריכזנו את השאלות הנפוצות שאנחנו מקבלים מבעלי אירוע ומאורחים. אם משהו לא ברור — פשוט לחצו על יצירת קשר."
        image={faqImg}
        imageAlt="שאלות ותשובות"
        primaryCta={{ label: "יצירת קשר ←", to: "/contact" }}
        secondaryCta={{ label: "מחירון", to: "/pricing" }}
        imageContain
      />

      <section className="max-w-[1000px] mx-auto px-6 py-12 lg:py-20 space-y-10">
        {groups.map((group) => (
          <div key={group.title}>
            <h2
              className="font-extrabold text-[24px] lg:text-[28px] text-right mb-5"
              style={{ color: GOLD }}
            >
              {group.title}
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {group.items.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`${group.title}-${i}`}
                  className="bg-white rounded-[16px] px-6 border-none shadow-[0px_4px_10px_rgba(0,0,0,0.04)]"
                >
                  <AccordionTrigger
                    className="text-right font-bold text-[17px] py-5 hover:no-underline"
                    style={{ color: NAVY }}
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-right font-light text-[15px] leading-[1.7] text-[#444] pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </section>

      <ClosingCTA
        title="לא מצאתם תשובה?"
        subtitle="צוות התמיכה שלנו זמין בטלפון, במייל ובוואטסאפ."
        primary={{ label: "דברו איתנו ←", to: "/contact" }}
        secondary={{ label: "חזרה למחירון", to: "/pricing" }}
      />
    </div>
  );
}
