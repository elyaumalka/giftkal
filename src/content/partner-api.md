# Giftkal – מסמך API לשותפים

**גרסה:** 1.0
**עודכן:** יולי 2026
**כתובת בסיס:** `https://xadihaigjkbvphzphxxk.supabase.co/functions/v1/public-api`
**תמיכה:** support@giftkal.com

---

## 1. סקירה כללית

ה-API של Giftkal לשותפים מאפשר למערכת שלכם:

1. ליצור משתמשי קצה (בעלי אירוע, בעלי אולם) בתוך Giftkal.
2. ליצור ולנהל אירועים, מוזמנים, אישורי הגעה, תשלומים, אולמות, אולמות אירועים ומכשירי קיוסק בשמם.
3. לקבל **התראות webhook בזמן אמת** כשמתבצעים תשלומים, כשמאושרים מוכרים ב-PayMe וכשמסתיימות משיכות כספים.

**שותף** הוא זהות מבודדת בתוך Giftkal. כל מפתח API שמונפק לכם משויך למזהה השותף שלכם, ולכן:

- כל קריאת קריאה/רשימה מסוננת אוטומטית — **תוכלו לראות רק אירועים, משתמשים ונתונים שהמפתח שלכם יצר.**
- כל קריאת יצירה מתויגת אוטומטית במזהה השותף שלכם.
- אין אפשרות לקרוא או לשנות נתונים ששייכים לשותף אחר או ללקוחות ישירים של Giftkal.

---

## 2. אימות (Authentication)

בכל בקשה יש לכלול את מפתח ה-API בכותרת:

```
x-api-key: <YOUR_API_KEY>
Content-Type: application/json
```

בקשות ללא מפתח תקין ופעיל יחזירו `401 Unauthorized`.

> 🔐 **שמרו את מפתח ה-API בצד השרת בלבד.** לעולם אל תטמיעו אותו בדפדפן, באפליקציית מובייל או במאגר קוד ציבורי. במקרה של חשש לדליפה — צרו קשר עם Giftkal מיידית להחלפת המפתח.

---

## 3. פורמט בקשות

כל ה-endpoints עוברים דרך כתובת אחת. שם ה-**action** מועבר כפרמטר query, וגוף הבקשה כ-JSON:

```
POST https://xadihaigjkbvphzphxxk.supabase.co/functions/v1/public-api?action=CreateEvent
x-api-key: sk_live_xxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "owner_id": "6f1b...",
  "event_date": "2026-11-05",
  "event_type": "חתונה",
  "groom_name": "דוד",
  "bride_name": "שרה"
}
```

פעולות קריאה בלבד (read-only) תומכות גם ב-`GET` עם query params במקום body.

### מבנה תשובה

הצלחה:
```json
{ "responseStatus": "OK", "event": { ... } }
```

שגיאה:
```json
{ "responseStatus": "ERROR", "error": "event_id is required", "code": 400 }
```

קודי HTTP: `200` הצלחה, `400` בקשה שגויה, `401` לא מאומת, `403` אין הרשאה (גישה חוצת שותפים), `404` לא נמצא, `500` שגיאת שרת.

---

## 4. פירוט פעולות (Actions)

### 4.1 משתמשים ופרופילים

| Action | Method | תיאור |
|---|---|---|
| `CreateEventOwner` | POST | יצירת בעל אירוע + אירוע התחלתי (אופציונלי). |
| `CreateVenueOwner` | POST | יצירת בעל אולם + אולם התחלתי (אופציונלי). |
| `ListProfiles` | GET | רשימת כל הפרופילים שיצר מפתח השותף שלכם. |
| `GetProfile` | GET | פרופיל בודד לפי `user_id`. |
| `UpdateProfile` | POST | עדכון `full_name`, `phone`, `avatar_url`. |

**דוגמה — CreateEventOwner:**
```json
POST ?action=CreateEventOwner
{
  "email": "chatan@example.com",
  "password": "SecurePass123!",
  "full_name": "דוד כהן",
  "phone": "+972501234567",
  "event": {
    "event_type": "חתונה",
    "event_date": "2026-11-05",
    "groom_name": "דוד",
    "bride_name": "שרה"
  }
}
```
מחזיר `{ user: { id, email, full_name }, event: { ... } }`.

### 4.2 אירועים

| Action | Method | תיאור |
|---|---|---|
| `CreateEvent` | POST | יצירת אירוע לבעל אירוע קיים. חובה: `owner_id`, `event_date`. |
| `GetEvent` | GET | קבלת אירוע לפי `event_id`. |
| `ListEvents` | GET | רשימת כל האירועים שלכם. סינון אופציונלי: `venue_id`, `owner_id`. |
| `UpdateEvent` | POST | עדכון כל שדה באירוע. חובה: `event_id`. |
| `GetEventStats` | GET | סיכום מוזמנים ותשלומים לאירוע. |

### 4.3 מוזמנים ואישורי הגעה

| Action | Method | תיאור |
|---|---|---|
| `ListGuests` | GET | רשימת מוזמנים לפי `event_id`. סינון אופציונלי לפי `status` (`approved`/`declined`/`pending`). מחזיר גם סטטיסטיקות. |
| `AddGuest` | POST | הוספת מוזמן בודד. |
| `BulkAddGuests` | POST | הוספה מרובה. Body: `{ event_id, guests: [{ full_name, phone, ... }] }`. |
| `UpdateGuest` | POST | עדכון כל שדה של מוזמן. חובה: `guest_id`. |
| `UpdateRSVP` | POST | עדכון `rsvp_status` (`approved`/`declined`/`pending`) ו-`number_of_guests`. |
| `BulkUpdateRSVP` | POST | Body: `{ updates: [{ guest_id, rsvp_status, number_of_guests }] }`. |
| `DeleteGuest` | DELETE/GET | מחיקה לפי `guest_id`. |

### 4.4 תשלומים (Transactions)

| Action | Method | תיאור |
|---|---|---|
| `GetTransactions` | GET | רשימת תשלומים לאירוע `event_id` כולל סכום כולל. |
| `GetTransaction` | GET | תשלום בודד לפי `transaction_id`. |
| `CreateTransaction` | POST | תיעוד תשלום ידני (נדרש לעיתים רחוקות — רוב התשלומים נכנסים מ-Giftkal אוטומטית). |

### 4.5 אולמות, אולמות פנים ומכשירים

| Action | Method | תיאור |
|---|---|---|
| `CreateVenue` / `GetVenue` / `ListVenues` / `UpdateVenue` / `DeleteVenue` | mixed | ניהול אולמות. |
| `CreateDevice` / `ListDevices` / `UpdateDevice` / `DeleteDevice` | mixed | ניהול מכשירי קיוסק (דורש `venue_id`, `serial_number`). |
| `IdentifyDevice` | GET | זיהוי מכשיר בהפעלה — לפי `serial_number` או `hall_id`, מחזיר את האירוע הפעיל היום + קישור למסך המתנות. |

### 4.6 לידים ולידים מדפי נחיתה

| Action | Method | תיאור |
|---|---|---|
| `ListLeads` / `GetLead` / `CreateLead` / `UpdateLead` / `DeleteLead` | mixed | לידים ב-CRM. |
| `ListLandingLeads` / `CreateLandingLead` / `UpdateLandingLead` / `DeleteLandingLead` | mixed | לידים שנקלטו מדפי נחיתה של אולמות. |

### 4.7 תמיכה, חשבוניות, מסמכים, הערות ומשימות

פעולות CRUD סטנדרטיות — ראו רשימה מלאה בסעיף 8.

### 4.8 סטטיסטיקות מערכת

| Action | Method | תיאור |
|---|---|---|
| `GetSystemStats` | GET | סיכומים ברמה גבוהה (אירועים, אולמות, משתמשים, לידים, סה״כ תשלומים). |

---

## 5. Webhooks

אם סיפקתם `webhook_url` בעת יצירת השותף, Giftkal תשלח בקשות POST לכתובת הזו כשמתרחשים אירועים ב**אירועים שלכם**.

### 5.1 סוגי אירועים

| `event_type` | מתי נשלח |
|---|---|
| `seller-approve` | PayMe סיימה לאשר את המוכר עבור אירוע מסוים — האירוע יכול לקבל תשלומים. |
| `sale-paid` | תשלום מתנה הצליח. |
| `sale-failure` | תשלום מתנה נכשל. |
| `refund` | מתנה זוכתה חזרה. |
| `withdrawal-complete` | משיכת כספים לחשבון הבנק של בעל האירוע הושלמה. |

ההרשמה נעשית על ידי מסירת רשימת `event_type` ל-Giftkal. השארה ריקה = "כל האירועים".

### 5.2 פורמט משלוח

```
POST <ה-webhook_url שלכם>
Content-Type: application/json
X-Giftkal-Event: sale-paid
X-Giftkal-Signature: <hex HMAC-SHA256>

{
  "event_type": "sale-paid",
  "delivered_at": "2026-07-01T12:34:56.789Z",
  "data": {
    "transaction_id": "b3d5...",
    "event_id": "a12b...",
    "payment_status": "completed",
    "amount": 350,
    "gift_amount": 347.70,
    "fee_amount": 2.30,
    "payer_name": "אבי לוי"
  }
}
```

מבנה payload עבור סוגי אירועים נוספים:

- **`seller-approve`** — `{ event_id, seller_payme_id, status: "approved" }`
- **`withdrawal-complete`** — כולל `seller_payme_id`, `payme_payout_code`, `amount`

### 5.3 אימות חתימה (חובה)

כל משלוח חתום ב-**HMAC-SHA256** מעל גוף הבקשה הגולמי, באמצעות הסוד שקיבלתם פעם אחת בעת יצירת השותף.

**דוגמה ב-Node.js:**
```js
import crypto from "crypto";

app.post("/webhooks/giftkal", express.raw({ type: "application/json" }), (req, res) => {
  const secret = process.env.GIFTKAL_WEBHOOK_SECRET;
  const signature = req.header("X-Giftkal-Signature");
  const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");

  if (signature !== expected) return res.status(401).send("bad signature");

  const payload = JSON.parse(req.body.toString());
  // handle payload.event_type, payload.data ...
  res.status(200).send("ok");
});
```

**דוגמה ב-PHP:**
```php
$secret = getenv('GIFTKAL_WEBHOOK_SECRET');
$body = file_get_contents('php://input');
$expected = hash_hmac('sha256', $body, $secret);
if (!hash_equals($expected, $_SERVER['HTTP_X_GIFTKAL_SIGNATURE'] ?? '')) {
    http_response_code(401); exit;
}
```

### 5.4 ניסיונות חוזרים ויומן משלוחים

- החזירו **HTTP 2xx** תוך 10 שניות לאישור קבלה. כל תשובה שאינה 2xx או timeout נרשמת ככשלון.
- כרגע **אין ניסיונות חוזרים אוטומטיים**. Giftkal שומרת כל ניסיון משלוח (סטטוס + גוף התשובה) ומנהל המערכת יכול לשלוח מחדש משלוחים שנכשלו על פי בקשה.
- דאגו לביטול כפילויות לפי `transaction_id` (או `event_id + delivered_at`) — התייחסו ל-webhooks כ-at-least-once.

---

## 6. סביבת בדיקות

Giftkal פועלת בסביבת **פרודקשן יחידה** — אין סביבת sandbox נפרדת. לבדיקות בטוחות:

1. בקשו מ-Giftkal להנפיק **שותף + מפתח API ייעודי לבדיקות** כדי שנתוני הבדיקה שלכם יהיו מבודדים מלקוחות אמיתיים.
2. הפנו את ה-`webhook_url` שלכם ל-[https://webhook.site](https://webhook.site) או לטאנל ngrok מקומי כדי לצפות ב-payloads בזמן אמת.
3. לבדיקות end-to-end מלאות של תהליך המתנה ללא חיוב אמיתי — Giftkal תספק **קופון עוקף** (`GIFTKAL-TEST`) שמשלים תשלומים בלי לגעת ב-PayMe, ועדיין תקבלו את ה-webhook המלא.
4. בסיום — מחיקת שותף הבדיקה מוחקת גם את כל מפתחות ה-API שלו.

---

## 7. Best Practices

- **Idempotency:** בעת יצירת בעל אירוע, טפלו בשגיאת `email already registered` כאילו הוא כבר קיים — בלי ניסיונות חוזרים עיוורים.
- **אל תשמרו סיסמאות משתמש** שאתם שולחים ל-`CreateEventOwner`. שלחו סיסמה אקראית באורך 16+ תווים והסתמכו על תהליך איפוס הסיסמה של Giftkal.
- **צד שרת בלבד** — מפתח ה-API אינו מוגן ב-CORS, אך אין לחשוף אותו לדפדפן.
- **תאריכים ושעות** בפורמט ISO 8601 UTC. תאריכים בלבד (`event_date`): `YYYY-MM-DD`.
- **טקסט בעברית** — שלחו UTF-8; Giftkal שומרת שמות בעברית באופן טבעי.

---

## 8. רשימת פעולות מלאה

**אירועים:** `GetEvent`, `ListEvents`, `UpdateEvent`, `CreateEvent`
**מוזמנים:** `ListGuests`, `AddGuest`, `UpdateGuest`, `UpdateRSVP`, `DeleteGuest`, `BulkAddGuests`, `BulkUpdateRSVP`
**תשלומים:** `GetTransactions`, `GetTransaction`, `CreateTransaction`
**אולמות:** `GetVenue`, `ListVenues`, `UpdateVenue`, `CreateVenue`, `DeleteVenue`
**לידים:** `ListLeads`, `GetLead`, `CreateLead`, `UpdateLead`, `DeleteLead`
**משתמשים:** `ListProfiles`, `GetProfile`, `CreateEventOwner`, `CreateVenueOwner`, `ListUsers`, `UpdateProfile`
**מסמכים:** `ListDocuments`, `AddDocument`, `DeleteDocument`
**סטטיסטיקות:** `GetEventStats`, `GetSystemStats`
**תמיכה:** `ListTickets`, `CreateTicket`, `UpdateTicket`
**חשבוניות:** `ListInvoices`, `GetInvoice`, `CreateInvoice`, `UpdateInvoice`
**מכשירים:** `ListDevices`, `CreateDevice`, `UpdateDevice`, `DeleteDevice`, `IdentifyDevice`
**הערות:** `ListNotes`, `CreateNote`, `UpdateNote`, `DeleteNote`
**משימות:** `ListTasks`, `CreateTask`, `UpdateTask`, `DeleteTask`
**לידי דפי נחיתה:** `ListLandingLeads`, `CreateLandingLead`, `UpdateLandingLead`, `DeleteLandingLead`
**הגדרות:** `GetSystemSettings`, `UpdateSystemSettings`, `GetRequiredDocuments`

---

## 9. Checklist להעלאה לאוויר

לפני עלייה לאוויר, Giftkal תספק:

- [ ] שם השותף שנרשם במערכת
- [ ] ערך `x-api-key` (מוצג פעם אחת — שמרו במקום מאובטח)
- [ ] ערך `webhook_secret` (מוצג פעם אחת — שמרו במקום מאובטח)
- [ ] אישור ש-`webhook_url` נגיש מהאינטרנט
- [ ] אישור על סוגי `webhook_events` הרלוונטיים

אתם צריכים להיות מסוגלים:

- [ ] לבצע `CreateEventOwner` ולראות את הפרופיל ב-`ListProfiles`
- [ ] לבצע `CreateEvent` לבעל האירוע הזה ולראות אותו ב-`ListEvents`
- [ ] לקבל לפחות webhook אחד לבדיקה ולאמת את החתימה

---

*© Giftkal · giftkal.com*
