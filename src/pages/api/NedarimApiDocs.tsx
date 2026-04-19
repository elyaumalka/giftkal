import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, Check, ChevronDown, ExternalLink, UserPlus, CreditCard, Gift, BarChart3, Search, Webhook, Monitor } from "lucide-react";

const BASE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

/* ───── helpers ───── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="absolute top-3 left-3 p-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <Badge className={cn(
      "font-mono text-[10px] font-bold px-2 py-0.5 rounded",
      method === "GET"
        ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
        : "bg-blue-500/15 text-blue-600 border-blue-500/30"
    )}>
      {method}
    </Badge>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="relative">
      {label && <p className="text-xs text-muted-foreground mb-1.5 font-medium">{label}</p>}
      <div className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto" dir="ltr">
        <CopyButton text={code} />
        <pre className="text-xs text-emerald-400 font-mono whitespace-pre leading-relaxed">{code}</pre>
      </div>
    </div>
  );
}

interface ParamRow {
  name: string;
  type: string;
  required: boolean;
  description: string;
  options?: string[];
}

function ParamsTable({ params, title }: { params: ParamRow[]; title?: string }) {
  return (
    <div>
      {title && <p className="text-sm font-semibold mb-2">{title}</p>}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-right px-3 py-2 font-medium">שדה</th>
              <th className="text-right px-3 py-2 font-medium">סוג</th>
              <th className="text-right px-3 py-2 font-medium">חובה</th>
              <th className="text-right px-3 py-2 font-medium">תיאור</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p) => (
              <tr key={p.name} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs text-primary">{p.name}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{p.type}</td>
                <td className="px-3 py-2">{p.required ? <Badge variant="destructive" className="text-[10px]">חובה</Badge> : <span className="text-xs text-muted-foreground">אופציונלי</span>}</td>
                <td className="px-3 py-2 text-xs">
                  {p.description}
                  {p.options && <span className="text-muted-foreground"> ({p.options.join(" / ")})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Section({ id, icon: Icon, title, children, defaultOpen = false }: { id: string; icon: any; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="border border-border rounded-xl bg-card overflow-hidden scroll-mt-24">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-5 hover:bg-muted/30 transition-colors text-right">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="font-bold text-lg">{title}</span>
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground mr-auto transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-border p-5 space-y-5">{children}</div>}
    </div>
  );
}

/* ───── Main component ───── */

export default function NedarimApiDocs() {
  const publicApiUrl = `${BASE_URL}/public-api`;
  const nedarimGiftUrl = `${BASE_URL}/nedarim-gift`;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">GiftKal API – מדריך לנדרים פלוס</h1>
            <p className="text-sm text-muted-foreground mt-1">כל מה שצריך כדי לחבר את הטופס החיצוני למערכת GiftKal</p>
          </div>
          <Badge variant="outline" className="text-xs">v1.0</Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Quick Overview */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-3">
          <h2 className="font-bold text-lg">🔑 פרטי חיבור</h2>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-[120px]">API Key:</span>
              <span className="text-muted-foreground">יסופק על ידי צוות GiftKal (נשלח בהדר <code className="bg-muted px-1 rounded text-xs">X-API-Key</code>)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-[120px]">כתובת בסיס:</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono" dir="ltr">{BASE_URL}</code>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-[120px]">פורמט:</span>
              <span className="text-muted-foreground">JSON (Content-Type: application/json)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-[120px]">אימות:</span>
              <span className="text-muted-foreground">בכל בקשה יש לשלוח <code className="bg-muted px-1 rounded text-xs">X-API-Key: YOUR_API_KEY</code> בהדרים</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "webhook-signup", label: "0. Webhook רישום אוטומטי", icon: Webhook },
            { id: "create-customer", label: "1. הקמת לקוח", icon: UserPlus },
            { id: "setup-payment", label: "2. הקמת סליקה", icon: CreditCard },
            { id: "gift-flow", label: "3. שליחת מתנה", icon: Gift },
            { id: "transactions", label: "4. עסקאות וסטטוס", icon: BarChart3 },
            { id: "search-event", label: "5. חיפוש אירוע", icon: Search },
            { id: "identify-device", label: "6. זיהוי קיוסק", icon: Monitor },
          ].map((item) => (
            <a key={item.id} href={`#${item.id}`} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 transition-colors text-sm">
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </div>

        {/* ═══ SECTION 0: WEBHOOK SIGNUP ═══ */}
        <Section id="webhook-signup" icon={Webhook} title="שלב 0: Webhook קליטת רישום אוטומטי מנדרים" defaultOpen>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>זרימה מומלצת:</strong> כאשר לקוח ממלא טופס רישום במערכת נדרים פלוס, נדרים שולחים POST אוטומטי לכתובת הזו.
            המערכת יוצרת בעל אירוע חדש (אם לא קיים) + אירוע פעיל, ומחזירה קישור התחברות וקישור גביית מתנות.
          </p>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MethodBadge method="POST" />
              <code className="text-xs font-mono text-muted-foreground" dir="ltr">{BASE_URL}/nedarim-event-signup</code>
            </div>
            <p className="text-xs text-muted-foreground">Header: <code className="bg-muted px-1 rounded">X-API-Key: YOUR_API_KEY</code></p>
          </div>

          <ParamsTable params={[
            { name: "email", type: "string", required: true, description: "אימייל בעל האירוע (משמש לכניסה למערכת)" },
            { name: "full_name", type: "string", required: true, description: "שם מלא" },
            { name: "phone", type: "string", required: false, description: "טלפון" },
            { name: "event_date", type: "date", required: true, description: "תאריך האירוע (YYYY-MM-DD)" },
            { name: "event_type", type: "string", required: false, description: "סוג אירוע", options: ["חתונה", "אירוסין", "בר מצווה", "בת מצווה", "ברית"] },
            { name: "groom_name", type: "string", required: false, description: "שם החתן" },
            { name: "bride_name", type: "string", required: false, description: "שם הכלה" },
            { name: "child_name", type: "string", required: false, description: "שם הילד/ה (לבר/בת מצווה/ברית)" },
            { name: "family_name", type: "string", required: false, description: "שם משפחה (לברית)" },
            { name: "venue_id", type: "uuid", required: false, description: "מזהה אולם (אם רלוונטי)" },
            { name: "hall_id", type: "uuid", required: false, description: "מזהה אולם ספציפי" },
            { name: "custom_venue_name", type: "string", required: false, description: "שם מקום אירוע (אם לא אולם מהמערכת)" },
            { name: "custom_venue_location", type: "string", required: false, description: "כתובת" },
            { name: "reception_time", type: "string", required: false, description: "שעת קבלת פנים" },
            { name: "ceremony_time", type: "string", required: false, description: "שעת חופה/טקס" },
            { name: "seller_payme_id", type: "string", required: false, description: "מזהה Seller לסליקה (אם הוקם מראש)" },
            { name: "nedarim_customer_id", type: "string", required: false, description: "מזהה לקוח אצל נדרים (יוחזר חזרה לסנכרון)" },
          ]} />

          <CodeBlock label="דוגמת בקשה:" code={`POST ${BASE_URL}/nedarim-event-signup
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "email": "david@example.com",
  "full_name": "דוד כהן",
  "phone": "0521234567",
  "event_date": "2025-09-15",
  "event_type": "חתונה",
  "groom_name": "דוד",
  "bride_name": "רחל",
  "custom_venue_name": "אולם השמחה",
  "reception_time": "18:30",
  "nedarim_customer_id": "NDR-9876"
}`} />

          <CodeBlock label="תגובה:" code={`{
  "status": "success",
  "user": { "id": "...", "email": "david@example.com", "full_name": "דוד כהן" },
  "event": {
    "id": "EVENT_ID",
    "gift_link": "https://giftkal.com/gift/EVENT_ID",
    "login_url": "https://giftkal.com/login/event"
  },
  "credentials": { "email": "david@example.com", "password": "AUTO_GENERATED" },
  "nedarim_customer_id": "NDR-9876"
}`} />

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs">
            💡 <strong>הערה:</strong> אם הלקוח כבר קיים (לפי email), המערכת תיצור רק אירוע חדש ותחזיר <code>credentials: null</code>.
          </div>
        </Section>

        {/* ═══ SECTION 1: CREATE CUSTOMER ═══ */}
        <Section id="create-customer" icon={UserPlus} title="שלב 1: הקמת לקוח (בעל אירוע)" defaultOpen>
          <p className="text-sm text-muted-foreground leading-relaxed">
            יצירת בעל אירוע חדש במערכת GiftKal. הפעולה יוצרת משתמש + פרופיל + אירוע בבת אחת.
            <br />
            אם הלקוח כבר קיים במערכת – אפשר ליצור רק אירוע חדש (ראה <strong>CreateEvent</strong> למטה).
          </p>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MethodBadge method="POST" />
              <code className="text-xs font-mono text-muted-foreground" dir="ltr">{publicApiUrl}?action=CreateEventOwner</code>
            </div>
          </div>

          <ParamsTable params={[
            { name: "email", type: "string", required: true, description: "אימייל של בעל האירוע (ישמש גם להתחברות)" },
            { name: "password", type: "string", required: true, description: "סיסמה לכניסה למערכת" },
            { name: "full_name", type: "string", required: true, description: "שם מלא של בעל האירוע" },
            { name: "phone", type: "string", required: false, description: "מספר טלפון" },
            { name: "event", type: "object", required: false, description: "אובייקט אירוע – אם נשלח, האירוע נוצר אוטומטית" },
            { name: "event.event_date", type: "date", required: true, description: "תאריך האירוע (YYYY-MM-DD)" },
            { name: "event.event_type", type: "string", required: false, description: "סוג אירוע", options: ["חתונה", "אירוסין", "בר מצווה", "בת מצווה", "ברית"] },
            { name: "event.groom_name", type: "string", required: false, description: "שם החתן" },
            { name: "event.bride_name", type: "string", required: false, description: "שם הכלה" },
            { name: "event.child_name", type: "string", required: false, description: "שם הילד/ה (בר/בת מצווה, ברית)" },
            { name: "event.family_name", type: "string", required: false, description: "שם משפחה (ברית)" },
            { name: "event.venue_id", type: "uuid", required: false, description: "שיוך לאולם (אם רלוונטי)" },
            { name: "event.custom_venue_name", type: "string", required: false, description: "שם מקום האירוע (אם לא אולם מהמערכת)" },
            { name: "event.custom_venue_location", type: "string", required: false, description: "כתובת מקום האירוע" },
            { name: "event.reception_time", type: "string", required: false, description: "שעת קבלת פנים" },
            { name: "event.ceremony_time", type: "string", required: false, description: "שעת טקס" },
          ]} />

          <CodeBlock label="דוגמת בקשה:" code={`POST ${publicApiUrl}?action=CreateEventOwner
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "email": "david@example.com",
  "password": "SecurePass123!",
  "full_name": "דוד כהן",
  "phone": "0521234567",
  "event": {
    "event_date": "2025-09-15",
    "event_type": "חתונה",
    "groom_name": "דוד",
    "bride_name": "רחל",
    "custom_venue_name": "אולם השמחה",
    "custom_venue_location": "ירושלים",
    "reception_time": "18:30",
    "ceremony_time": "19:30"
  }
}`} />

          <CodeBlock label="תגובה:" code={`{
  "responseStatus": "OK",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "david@example.com",
    "full_name": "דוד כהן"
  },
  "event": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "event_date": "2025-09-15",
    "event_type": "חתונה",
    "groom_name": "דוד",
    "bride_name": "רחל",
    "seller_payme_id": null
  }
}`} />

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm space-y-1">
            <p className="font-bold text-amber-600">⚠️ חשוב</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>שמרו את ה-<code className="bg-muted px-1 rounded text-xs">user.id</code> – זה ה-<strong>owner_id</strong> (מזהה הבעלים)</li>
              <li>שמרו את ה-<code className="bg-muted px-1 rounded text-xs">event.id</code> – זה ה-<strong>event_id</strong> (מזהה האירוע) לשימוש בשלבים הבאים</li>
              <li>אם <code className="bg-muted px-1 rounded text-xs">seller_payme_id</code> הוא <code>null</code> – הסליקה טרם הוגדרה (ראו שלב 2)</li>
            </ul>
          </div>

          {/* CreateEvent for existing user */}
          <div className="border-t pt-5 space-y-4">
            <h3 className="font-bold">🔄 יצירת אירוע נוסף ללקוח קיים</h3>
            <p className="text-sm text-muted-foreground">אם הלקוח כבר נרשם ויש לכם את ה-<code className="bg-muted px-1 rounded text-xs">owner_id</code>:</p>
            
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MethodBadge method="POST" />
                <code className="text-xs font-mono text-muted-foreground" dir="ltr">{publicApiUrl}?action=CreateEvent</code>
              </div>
            </div>

            <CodeBlock code={`POST ${publicApiUrl}?action=CreateEvent
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_date": "2026-03-20",
  "event_type": "חתונה",
  "groom_name": "דוד",
  "bride_name": "שרה"
}`} />
          </div>
        </Section>

        {/* ═══ SECTION 2: PAYMENT SETUP ═══ */}
        <Section id="setup-payment" icon={CreditCard} title="שלב 2: הקמת סליקה (PayMe)">
          <p className="text-sm text-muted-foreground leading-relaxed">
            כדי שאורחים יוכלו לשלוח מתנות באשראי, צריך לשייך <strong>מזהה מוכר PayMe</strong> לאירוע.
            <br />
            הלקוח יצטרך לעבור תהליך הקמת מוכר ב-PayMe ולקבל <code className="bg-muted px-1 rounded text-xs">seller_payme_id</code>.
          </p>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm space-y-2">
            <p className="font-bold text-blue-600">📋 תהליך הקמת סליקה</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>הלקוח מקבל <code className="bg-muted px-1 rounded text-xs">seller_payme_id</code> מ-PayMe (לאחר אישור KYC)</li>
              <li>אתם שולחים בקשת <strong>UpdateEvent</strong> עם ה-<code className="bg-muted px-1 rounded text-xs">seller_payme_id</code></li>
              <li>מרגע שה-<code className="bg-muted px-1 rounded text-xs">seller_payme_id</code> מעודכן – המערכת מוכנה לקבל מתנות!</li>
            </ol>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MethodBadge method="POST" />
              <code className="text-xs font-mono text-muted-foreground" dir="ltr">{publicApiUrl}?action=UpdateEvent</code>
            </div>
          </div>

          <ParamsTable params={[
            { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
            { name: "seller_payme_id", type: "string", required: true, description: "מזהה המוכר ב-PayMe (מתקבל לאחר אישור)" },
            { name: "gifts_enabled", type: "boolean", required: false, description: "הפעלת מודול מתנות (ברירת מחדל: false)" },
          ]} />

          <CodeBlock label="דוגמת בקשה – עדכון סליקה:" code={`POST ${publicApiUrl}?action=UpdateEvent
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "event_id": "660e8400-e29b-41d4-a716-446655440000",
  "seller_payme_id": "MPL12345-XXXX-YYYY",
  "gifts_enabled": true
}`} />

          <CodeBlock label="תגובה:" code={`{
  "responseStatus": "OK",
  "event": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "seller_payme_id": "MPL12345-XXXX-YYYY",
    "gifts_enabled": true,
    ...
  }
}`} />

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-sm">
            <p className="font-bold text-emerald-600">✅ אחרי העדכון</p>
            <p className="text-muted-foreground mt-1">ניתן לשלוח מתנות לאירוע דרך ה-API של <strong>nedarim-gift</strong> (שלב 3)</p>
          </div>
        </Section>

        {/* ═══ SECTION 3: GIFT FLOW ═══ */}
        <Section id="gift-flow" icon={Gift} title="שלב 3: שליחת מתנה (nedarim-gift)">
          <p className="text-sm text-muted-foreground leading-relaxed">
            ה-endpoint הזה יוצר עסקת תשלום ב-PayMe ומחזיר קישור לדף סליקה.
            <br />
            האורח מועבר לקישור, משלם, והמערכת מעדכנת אוטומטית את סטטוס העסקה.
          </p>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MethodBadge method="POST" />
              <code className="text-xs font-mono text-muted-foreground" dir="ltr">{nedarimGiftUrl}</code>
            </div>
          </div>

          <ParamsTable title="שדות הבקשה (body):" params={[
            { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
            { name: "payer_name", type: "string", required: true, description: "שם שולח המתנה" },
            { name: "amount", type: "number", required: true, description: "סכום המתנה בשקלים" },
            { name: "payer_phone", type: "string", required: false, description: "טלפון השולח" },
            { name: "payer_email", type: "string", required: false, description: "אימייל השולח" },
            { name: "relationship", type: "string", required: false, description: "קרבה (חבר, משפחה, עבודה...)" },
            { name: "side", type: "string", required: false, description: "צד באירוע", options: ["groom", "bride", "general"] },
            { name: "blessing_text", type: "string", required: false, description: "טקסט ברכה" },
            { name: "return_url", type: "string", required: false, description: "כתובת חזרה לאחר תשלום (אופציונלי)" },
          ]} />

          <CodeBlock label="דוגמת בקשה:" code={`POST ${nedarimGiftUrl}
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "event_id": "660e8400-e29b-41d4-a716-446655440000",
  "payer_name": "משה כהן",
  "amount": 500,
  "payer_phone": "0501234567",
  "payer_email": "moshe@example.com",
  "relationship": "דוד",
  "side": "groom",
  "blessing_text": "מזל טוב! שתזכו לבנות בית נאמן בישראל"
}`} />

          <CodeBlock label="תגובה (הצלחה):" code={`{
  "success": true,
  "status": "pending",
  "sale_url": "https://ng.payme.io/sale/XXXXX",
  "transaction_id": "770e8400-e29b-41d4-a716-446655440000",
  "payme_sale_id": "abc123xyz"
}`} />

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm space-y-2">
            <p className="font-bold">🔗 מה עושים עם התגובה?</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>שלחו את האורח ל-<code className="bg-muted px-1 rounded text-xs">sale_url</code> לביצוע התשלום</li>
              <li>שמרו את <code className="bg-muted px-1 rounded text-xs">transaction_id</code> לבדיקת סטטוס (שלב 4)</li>
              <li>לאחר שהאורח משלם, ה-webhook של PayMe מעדכן אוטומטית את הסטטוס ל-<code className="bg-muted px-1 rounded text-xs">completed</code></li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm space-y-2">
            <p className="font-bold text-amber-600">⚠️ שגיאות אפשריות</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b"><th className="text-right px-2 py-1">קוד</th><th className="text-right px-2 py-1">משמעות</th></tr></thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b"><td className="px-2 py-1 font-mono">UNAUTHORIZED</td><td className="px-2 py-1">API Key לא תקין או חסר</td></tr>
                  <tr className="border-b"><td className="px-2 py-1 font-mono">MISSING_FIELD</td><td className="px-2 py-1">חסר שדה חובה (event_id / amount / payer_name)</td></tr>
                  <tr className="border-b"><td className="px-2 py-1 font-mono">NOT_FOUND</td><td className="px-2 py-1">אירוע לא נמצא</td></tr>
                  <tr className="border-b"><td className="px-2 py-1 font-mono">NO_SELLER</td><td className="px-2 py-1">הסליקה לא הוגדרה לאירוע (חסר seller_payme_id)</td></tr>
                  <tr><td className="px-2 py-1 font-mono">PAYME_ERROR</td><td className="px-2 py-1">שגיאה מ-PayMe (פרטים ב-details)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 4: TRANSACTIONS ═══ */}
        <Section id="transactions" icon={BarChart3} title="שלב 4: עסקאות – בדיקת סטטוס ורשימה">
          
          {/* Status check */}
          <div className="space-y-4">
            <h3 className="font-bold">📊 בדיקת סטטוס עסקה בודדת</h3>
            <p className="text-sm text-muted-foreground">בדיקה האם התשלום הושלם:</p>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MethodBadge method="POST" />
                <code className="text-xs font-mono text-muted-foreground" dir="ltr">{nedarimGiftUrl}</code>
              </div>
            </div>

            <CodeBlock code={`POST ${nedarimGiftUrl}
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "action": "status",
  "transaction_id": "770e8400-e29b-41d4-a716-446655440000"
}`} />

            <CodeBlock label="תגובה:" code={`{
  "success": true,
  "transaction_id": "770e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "amount": 500,
  "payer_name": "משה כהן",
  "created_at": "2025-06-10T14:30:00Z"
}`} />

            <div className="bg-muted/30 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1">סטטוסים אפשריים:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">pending – ממתין לתשלום</Badge>
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600">completed – שולם בהצלחה</Badge>
                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600">failed – נכשל</Badge>
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600">refunded – זוכה</Badge>
              </div>
            </div>
          </div>

          {/* List transactions */}
          <div className="border-t pt-5 space-y-4">
            <h3 className="font-bold">📋 רשימת כל העסקאות של אירוע</h3>
            <p className="text-sm text-muted-foreground">קבלת כל המתנות והעסקאות + סכום כולל:</p>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MethodBadge method="GET" />
                <code className="text-xs font-mono text-muted-foreground" dir="ltr">{publicApiUrl}?action=GetTransactions&event_id=EVENT_ID</code>
              </div>
            </div>

            <CodeBlock code={`GET ${publicApiUrl}?action=GetTransactions&event_id=660e8400-...
X-API-Key: YOUR_API_KEY`} />

            <CodeBlock label="תגובה:" code={`{
  "responseStatus": "OK",
  "transactions": [
    {
      "id": "uuid",
      "payer_name": "משה כהן",
      "amount": 500,
      "relationship": "דוד",
      "side": "groom",
      "blessing_text": "מזל טוב!",
      "payment_status": "completed",
      "transaction_date": "2025-06-10T14:30:00Z"
    },
    ...
  ],
  "count": 42,
  "stats": {
    "total_amount": 75000
  }
}`} />
          </div>

          {/* Create transaction manually */}
          <div className="border-t pt-5 space-y-4">
            <h3 className="font-bold">➕ יצירת עסקה ידנית (ללא סליקה)</h3>
            <p className="text-sm text-muted-foreground">לרישום מתנות שהתקבלו מחוץ למערכת (מזומן, צ'ק, העברה):</p>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MethodBadge method="POST" />
                <code className="text-xs font-mono text-muted-foreground" dir="ltr">{publicApiUrl}?action=CreateTransaction</code>
              </div>
            </div>

            <ParamsTable params={[
              { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
              { name: "payer_name", type: "string", required: true, description: "שם הנותן" },
              { name: "amount", type: "number", required: true, description: "סכום" },
              { name: "payer_phone", type: "string", required: false, description: "טלפון" },
              { name: "payer_email", type: "string", required: false, description: "אימייל" },
              { name: "relationship", type: "string", required: false, description: "קרבה" },
              { name: "side", type: "string", required: false, description: "צד", options: ["groom", "bride", "general"] },
              { name: "blessing_text", type: "string", required: false, description: "ברכה" },
              { name: "payment_status", type: "string", required: false, description: "סטטוס (ברירת מחדל: completed)", options: ["completed", "pending"] },
            ]} />

            <CodeBlock code={`POST ${publicApiUrl}?action=CreateTransaction
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "event_id": "660e8400-...",
  "payer_name": "אברהם לוי",
  "amount": 1000,
  "relationship": "סב",
  "side": "bride",
  "blessing_text": "מזל טוב לנכדתי האהובה!"
}`} />
          </div>
        </Section>

        {/* ═══ SECTION 5: SEARCH EVENT ═══ */}
        <Section id="search-event" icon={Search} title="שלב 5: חיפוש וקבלת פרטי אירוע">
          <p className="text-sm text-muted-foreground">שליפת פרטי אירוע לפי מזהה – שימושי לבדיקה שהאירוע מוגדר נכון:</p>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MethodBadge method="GET" />
              <code className="text-xs font-mono text-muted-foreground" dir="ltr">{publicApiUrl}?action=GetEvent&event_id=EVENT_ID</code>
            </div>
          </div>

          <CodeBlock code={`GET ${publicApiUrl}?action=GetEvent&event_id=660e8400-...
X-API-Key: YOUR_API_KEY`} />

          <CodeBlock label="תגובה:" code={`{
  "responseStatus": "OK",
  "event": {
    "id": "660e8400-...",
    "event_type": "חתונה",
    "groom_name": "דוד",
    "bride_name": "רחל",
    "event_date": "2025-09-15",
    "seller_payme_id": "MPL12345-XXXX",
    "gifts_enabled": true,
    "custom_venue_name": "אולם השמחה",
    "custom_venue_location": "ירושלים"
  }
}`} />

          <div className="border-t pt-5 space-y-4">
            <h3 className="font-bold">📊 סטטיסטיקות מלאות של אירוע</h3>
            <p className="text-sm text-muted-foreground">קבלת סיכום מקיף: אורחים + מתנות + סכומים:</p>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MethodBadge method="GET" />
                <code className="text-xs font-mono text-muted-foreground" dir="ltr">{publicApiUrl}?action=GetEventStats&event_id=EVENT_ID</code>
              </div>
            </div>

            <CodeBlock label="תגובה:" code={`{
  "responseStatus": "OK",
  "event": { ... },
  "stats": {
    "guests_total": 150,
    "guests_approved": 95,
    "guests_approved_total": 280,
    "guests_declined": 10,
    "guests_pending": 45,
    "transactions_count": 42,
    "transactions_total_amount": 75000
  }
}`} />
          </div>
        </Section>

        {/* ═══ SECTION 6: IDENTIFY DEVICE ═══ */}
        <Section id="identify-device" icon={Monitor} title="שלב 6: זיהוי מכשיר קיוסק (אופציונלי)">
          <p className="text-sm text-muted-foreground leading-relaxed">
            מאפשר למכשיר קיוסק לזהות את האולם המשויך אליו ולקבל את האירוע הפעיל היום.
            ניתן לזהות לפי <code className="bg-muted px-1 rounded text-xs">serial_number</code> של המכשיר או לפי <code className="bg-muted px-1 rounded text-xs">hall_id</code> ישירות.
          </p>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MethodBadge method="POST" />
              <code className="text-xs font-mono text-muted-foreground" dir="ltr">{publicApiUrl}?action=IdentifyDevice</code>
            </div>
          </div>

          <ParamsTable params={[
            { name: "serial_number", type: "string", required: false, description: "מספר סידורי של המכשיר (אם נשלח – המערכת תאתר את האולם לפיו)" },
            { name: "hall_id", type: "uuid", required: false, description: "מזהה אולם ישיר (חלופה ל-serial_number)" },
          ]} />

          <CodeBlock label="דוגמת בקשה:" code={`POST ${publicApiUrl}?action=IdentifyDevice
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{ "serial_number": "DEV-12345" }`} />

          <CodeBlock label="תגובה (כשיש אירוע פעיל היום):" code={`{
  "responseStatus": "OK",
  "device": { "id": "...", "name": "קיוסק כניסה", "hall_id": "..." },
  "hall": {
    "id": "uuid", "name": "אולם הזהב",
    "kiosk_url": "https://giftkal.com/kiosk/HALL_ID"
  },
  "active_event": {
    "id": "EVENT_ID", "event_type": "חתונה",
    "groom_name": "דוד", "bride_name": "רחל",
    "gift_url": "https://giftkal.com/gift/EVENT_ID"
  },
  "has_active_event": true
}`} />
        </Section>

        {/* Footer */}
        <div className="border-t pt-8 pb-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            לשאלות ותמיכה טכנית: <a href="tel:023131700" className="text-primary hover:underline">02-3131700</a> | <a href="mailto:g023131700@gmail.com" className="text-primary hover:underline">g023131700@gmail.com</a>
          </p>
          <p className="text-xs text-muted-foreground">
            © GiftKal {new Date().getFullYear()} – כל הזכויות שמורות
          </p>
        </div>
      </div>
    </div>
  );
}
