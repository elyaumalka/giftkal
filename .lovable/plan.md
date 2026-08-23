# החלפת מותג: Giftkal → בשמחות פלוס

## מטרה
להחליף כל מופע משתמש-פנוי של המותג "Giftkal"/"גיפטקאל" ב"בשמחות פלוס" (ובאנגלית "Besimchot Plus" או "Bsimchot Plus" לפי הקשר).

## מה ישתנה

### 1. מטא-נתונים וכותרות (index.html)
- `<title>`: Giftkal → בשמחות פלוס
- meta description, author, og:title, twitter:site, apple-mobile-web-app-title

### 2. קומפוננטות Layout
- `MarketingLayout.tsx`: alt texts, טקסט זכויות יוצרים בפוטר.
- `AdminSidebar.tsx`, `EventLayout.tsx`, `VenueLayout.tsx`: alt של הלוגו.

### 3. עמודי שיווק
- `Home.tsx`, `EventOwners.tsx`, `VenueOwners.tsx`, `WhyUs.tsx`, `Testimonials.tsx`, `Pricing.tsx`, `FAQ.tsx`, `HowItWorks.tsx`, `About.tsx`, `Contact.tsx`: כל טקסט "GiftKal" / "גיפטקאל" → "בשמחות פלוס".

### 4. עמודי אירוע / אולם / מתנה
- `EventWelcome.tsx`, `GiftScreen.tsx`, `GiftSearch.tsx`, `PaymeSetup.tsx`, `Upgrade.tsx`, `Settings.tsx` (event), `Settings.tsx` (venue): טקסטים וכותרות.

### 5. מסכי ניהול
- `Wallets.tsx`, `EventDetailsDialog.tsx`, `NedarimBillingDialog.tsx`, `Signup.tsx`: טקסטים, כותרות, הודעות toast.

### 6. תיעוד API
- `partner-api.md`, `SystemApiDocs.tsx`, `NedarimApiDocs.tsx`, `YemotApiDocs.tsx`: כותרות, טקסטי הסבר, כתובת תמיכה.

### 7. PWA / קונפיגורציה
- `vite.config.ts`: `name` ו-`short_name` של ה-PWA.

### 8. קוד ותיעוד פנימי
- `fees.ts`, `public-api/index.ts`, edge functions, הערות קוד: "giftkal master" / "giftkal commission" → "בשמחות פלוס" / "platform" בהתאם להקשר.

## מה יישאר ללא שינוי (מזהים טכניים)
- **כתובות דומיין**: `giftkal.com`, `giftkal.lovable.app` — נשארות כדי לא לשבור קישורים, DNS ואימותים קיימים.
- **כותרות Webhook**: `X-Giftkal-Signature`, `X-Giftkal-Event` — חוזה API עם שותפים; שינוי דורש עדכון מקבלי Webhook.
- **קוד קופון בדיקה**: `GIFTKAL-TEST` — מזהה טכני שמופיע ב-DB/שותפים; ישתנה רק בטקסט תצוגה אם קיים, לא בלוגיקה.
- **מפתחות סביבה / קבועים**: `GIFTKAL_WEBHOOK_SECRET` וכדומה — נשארים כמוגדרים.

## בדיקה
- חיפוש חוזר של Giftkal/giftkal/גיפטקאל לאיתור שאריות (למעט המזהים הטכניים המופיעים לעיל).
- בדיקת build לוודא שאין שגיאות לאחר ההחלפות.
