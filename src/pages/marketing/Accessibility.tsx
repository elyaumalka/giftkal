import { useEffect } from "react";
import { Accessibility as A11yIcon, Phone, Mail, CheckCircle2 } from "lucide-react";

const NAVY = "#051839";
const GOLD = "#AE842D";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border" style={{ borderColor: `${GOLD}22` }}>
    <h2 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: NAVY }}>
      {title}
    </h2>
    <div className="space-y-3 text-[17px] leading-[1.8] font-light" style={{ color: NAVY }}>
      {children}
    </div>
  </section>
);

const AccessibilityStatement = () => {
  useEffect(() => {
    document.title = "הצהרת נגישות | בשמחות פלוס";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "הצהרת הנגישות של בשמחות פלוס — התאמות הנגישות באתר, תקן ת\"י 5568 ורמת AA, ודרכי פנייה לרכז הנגישות."
      );
    }
  }, []);

  const features = [
    "תפריט נגישות קבוע בכל עמודי האתר (כפתור בפינת המסך)",
    "הגדלה והקטנה של גודל הטקסט עד 160%",
    "מצב ניגודיות גבוהה ומצב גווני אפור",
    "הדגשת קישורים, גופן קריא וריווח שורות מוגדל",
    "עצירת אנימציות ותנועה בעמודים",
    "סמן עכבר מוגדל",
    "ניווט מלא באמצעות מקלדת (Tab / Shift+Tab / Enter)",
    "מבנה כתוביות וכותרות סמנטי לקוראי מסך",
    "טקסט חלופי לתמונות ותוויות לשדות טפסים",
    "תמיכה מלאה בכתיבה מימין לשמאל (RTL) בעברית",
  ];

  return (
    <div dir="rtl" className="bg-[#F5F5F5] py-12 md:py-16 px-4 md:px-6">
      <div className="max-w-[1000px] mx-auto space-y-6">
        <header className="text-right">
          <span
            className="inline-flex items-center gap-2 rounded-[20px] px-4 py-1.5 text-[13px] font-semibold text-white"
            style={{ background: GOLD }}
          >
            <A11yIcon className="w-4 h-4" />
            נגישות
          </span>
          <h1 className="mt-4 text-[36px] md:text-[52px] font-extrabold leading-[1.15]" style={{ color: NAVY }}>
            הצהרת נגישות
          </h1>
          <p className="mt-3 text-[18px] font-light" style={{ color: `${NAVY}AA` }}>
            אתר בשמחות פלוס — מחויבים לחוויית שימוש שווה לכל אדם
          </p>
        </header>

        <Section title="המחויבות שלנו">
          <p>
            בבשמחות פלוס אנו רואים בנגישות האתר ערך עליון ומאמינים שלכל אדם, לרבות אנשים עם מוגבלות,
            הזכות לקבל שירות דיגיטלי מלא, עצמאי ומכבד. אנו פועלים באופן שוטף לשיפור הנגישות של האתר
            והמערכת בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998, ולתקנות שוויון זכויות
            לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.
          </p>
        </Section>

        <Section title="רמת הנגישות באתר">
          <p>
            האתר הונגש בהתאם לתקן הישראלי ת"י 5568 המבוסס על הנחיות WCAG 2.1 של ארגון W3C, ברמת
            הנגישות AA. הנגשת האתר בוצעה בקוד האתר עצמו, בשילוב תפריט נגישות המאפשר התאמה אישית של
            תצוגת האתר לצורכי המשתמש.
          </p>
        </Section>

        <Section title="התאמות הנגישות שבוצעו">
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-1 shrink-0" style={{ color: GOLD }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="שימוש בתפריט הנגישות">
          <p>
            בכל עמוד באתר מופיע כפתור נגישות בפינת המסך. לחיצה עליו פותחת את תפריט הנגישות, שבו ניתן
            להפעיל ולכבות את ההתאמות. ההגדרות נשמרות בדפדפן שלכם וממשיכות לפעול גם בביקורים הבאים,
            וניתן לאפס אותן בכל רגע בלחיצה על "איפוס הגדרות".
          </p>
        </Section>

        <Section title="מגבלות ותכנים חריגים">
          <p>
            למרות מאמצינו, ייתכנו באתר עמודים, רכיבים או קבצים שטרם הונגשו במלואם, בין היתר תכנים
            שהועלו על ידי משתמשים (כגון קבצי הזמנה, תמונות או סרטוני וידאו) וכן רכיבים של ספקים
            חיצוניים, לרבות עמודי סליקת אשראי. אנו ממשיכים לתקן ולשפר באופן שוטף, ואם נתקלתם ברכיב
            שאינו נגיש — נשמח לשמוע ולטפל בכך בהקדם.
          </p>
        </Section>

        <Section title="פנייה לרכז הנגישות">
          <p>
            נתקלתם בבעיית נגישות באתר או זקוקים לסיוע? נשמח לעמוד לרשותכם. אנו משתדלים להשיב לכל
            פנייה בתוך זמן סביר.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="tel:02-3131700"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] px-6 py-3 font-bold text-white"
              style={{ background: GOLD }}
            >
              <Phone className="w-5 h-5" />
              02-3131700
            </a>
            <a
              href="mailto:g023131700@gmail.com"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] border-2 px-6 py-3 font-semibold"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              <Mail className="w-5 h-5" />
              g023131700@gmail.com
            </a>
          </div>
        </Section>

        <p className="text-center text-sm" style={{ color: `${NAVY}88` }}>
          הצהרת הנגישות עודכנה לאחרונה בתאריך 28.08.2026
        </p>
      </div>
    </div>
  );
};

export default AccessibilityStatement;
