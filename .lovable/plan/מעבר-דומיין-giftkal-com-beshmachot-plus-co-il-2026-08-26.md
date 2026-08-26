# מעבר דומיין: giftkal.com → beshmachot-plus.co.il

הדומיין הישן נסגר לגמרי. לכן כל מקום שמייצר קישור או שולח כתובת חייב לעבור לדומיין החדש, אחרת קישורים שנשלחו/נשלחים יישברו.

## שלב 1 — חיבור הדומיין (בהגדרות, לא בקוד)
1. Project Settings → Domains → Connect Domain: להוסיף `beshmachot-plus.co.il` וגם `www.beshmachot-plus.co.il`, ולסמן את אחד מהם כ-Primary.
2. אצל רשם הדומיין: רשומות A ל-@ ול-www לכתובת 185.158.133.1 + רשומת TXT `_lovable` שתוצג בממשק.
3. להמתין לאימות ולהנפקת SSL, ואז לפרסם מחדש.
4. אחרי שהחדש פעיל — להסיר את `giftkal.com` מהפרויקט.

## שלב 2 — הגדרות Auth (חובה, אחרת ההתחברות תישבר)
- Site URL: `https://beshmachot-plus.co.il`
- Redirect URLs: `https://beshmachot-plus.co.il/*`, `https://www.beshmachot-plus.co.il/*`, וגם כתובת ה-preview.
- אם מוגדר Google Sign-In — לעדכן את ה-Authorized redirect URI בהתאם.

## שלב 3 — קישורים שהמערכת מייצרת (קוד)
כל אלה מחזירים היום כתובות `giftkal.com` ויוחלפו:
- קישור מתנה לאירוע — `src/pages/event/Settings.tsx`
- דף נחיתה לאולם — `src/pages/venue/Settings.tsx`
- קישורי מתנה/כניסה/קיוסק שנוצרים בשרת — `supabase/functions/public-api/index.ts`, `nedarim-gift`, `nedarim-event-signup`, `payme-generate-link`
- התחזות מנהל (impersonation) — `supabase/functions/impersonate-user/index.ts` (עובר לדומיין החדש + כתובת ה-lovable.app)

בנוסף: במקום כתובות "קשיחות" בקוד, הקישורים שנוצרים בצד הדפדפן יעברו לשימוש בכתובת האתר הנוכחית, ובצד השרת לקבוע דומיין אחד מרכזי במשתנה סביבה כדי שהחלפה עתידית תהיה במקום אחד.

## שלב 4 — סליקה וספקים חיצוניים
- PayMe: שדה `seller_site_url` שנשלח בפתיחת/עדכון סוחר, וברירת המחדל בטופס — `src/pages/event/PaymeSetup.tsx`, `payme-create-seller`, `payme-update-seller`.
- חשוב: כתובות ה-Callback/Webhook של PayMe ושל נדרים פלוס מצביעות ל-Edge Functions (דומיין הבקנד) ולא לדומיין האתר — לכן הן לא נשברות.
- אם מוגדרים אצל PayMe/נדרים דומיינים מאושרים (whitelist) — צריך להוסיף שם את הדומיין החדש.

## שלב 5 — טקסטים, תמיכה ותיעוד
- מייל תמיכה: `support@giftkal.com` → `support@beshmachot-plus.co.il` (בתיעוד ה-API, `partner-api.md`, `partner-api.openapi.yaml`, עמוד התיעוד).
- כיתובים כמו "תשלום מאובטח · giftkal.com" בעמוד המתנה המוטמע, ודוגמאות ה-URL בתיעוד (NedarimApiDocs).
- מטא-נתונים: `index.html` — canonical/og לדומיין החדש; `robots.txt` / sitemap אם קיים.

## מה נשאר בלי שינוי (בכוונה)
- כותרות ה-Webhook לשותפים `X-Giftkal-Event` / `X-Giftkal-Signature` ומשתנה `GIFTKAL_WEBHOOK_SECRET` — חוזה API קיים; שינוי ישבור את השותפים.
- קוד קופון הבדיקה `GIFTKAL-TEST`.
- כתובת הבקנד/Edge Functions.

## דברים שדורשים תשומת לב אחרי המעבר
- **קישורים שכבר נשלחו** ללקוחות/מוזמנים עם `giftkal.com` יפסיקו לעבוד. אם יש קישורים חיים באירועים קרובים — כדאי להשאיר את הדומיין הישן פעיל כהפניה עד שהאירועים יסתיימו, גם אם התוכנית היא לסגור אותו.
- **מיילים יוצאים**: אם יוגדרה שליחת מייל, צריך אימות דומיין חדש (SPF/DKIM/DMARC) על `beshmachot-plus.co.il`.
- **שותפים**: קישורי המתנה שהם מטמיעים אצלם — צריך להודיע להם על הדומיין החדש.
- **קיוסקים / מכשירים בשטח**: כל מכשיר שמוגדר עם URL של הדומיין הישן צריך עדכון ידני.
- **SEO**: אובדן דירוגים אם אין הפניה 301; מומלץ לעדכן ב-Google Search Console.

## בדיקה
- חיפוש חוזר בקוד לוודא שלא נשארו מופעים של הדומיין הישן (למעט המזהים הטכניים למעלה).
- בדיקת התחברות, יצירת קישור מתנה, דף אולם, וקישור התחזות בדומיין החדש.
- Build נקי.
