import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Calendar, CreditCard, Building2, BarChart3, Copy, Check, ChevronDown, ChevronLeft, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BASE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/public-api`;

type HttpMethod = "GET" | "POST";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
  options?: string[];
}

interface Endpoint {
  id: string;
  action: string;
  title: string;
  description: string;
  method: HttpMethod;
  category: string;
  params: Param[];
  exampleRequest: string;
  exampleResponse?: string;
  notes?: string[];
}

const categories = [
  { id: "events", label: "ניהול אירועים", icon: Calendar },
  { id: "guests", label: "ניהול מוזמנים", icon: Users },
  { id: "transactions", label: "מתנות ועסקאות", icon: CreditCard },
  { id: "venues", label: "ניהול אולמות", icon: Building2 },
  { id: "stats", label: "סטטיסטיקות", icon: BarChart3 },
];

const endpoints: Endpoint[] = [
  // ===== EVENTS =====
  {
    id: "get-event",
    action: "GetEvent",
    title: "קבלת פרטי אירוע",
    description: "קבלת כל הפרטים של אירוע ספציפי לפי מזהה.",
    method: "GET",
    category: "events",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
    ],
    exampleRequest: `GET ${BASE_URL}?action=GetEvent&event_id=EVENT_ID
X-API-Key: YOUR_API_KEY`,
    exampleResponse: `{
  "responseStatus": "OK",
  "event": {
    "id": "uuid",
    "event_type": "חתונה",
    "groom_name": "ישראל",
    "bride_name": "שרה",
    "event_date": "2025-06-15",
    "venue_id": "uuid",
    "owner_id": "uuid"
  }
}`,
  },
  {
    id: "list-events",
    action: "ListEvents",
    title: "רשימת אירועים",
    description: "קבלת רשימת אירועים עם אפשרות סינון לפי אולם או בעלים.",
    method: "GET",
    category: "events",
    params: [
      { name: "venue_id", type: "uuid", required: false, description: "סינון לפי אולם" },
      { name: "owner_id", type: "uuid", required: false, description: "סינון לפי בעל אירוע" },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListEvents&venue_id=VENUE_ID
X-API-Key: YOUR_API_KEY`,
    exampleResponse: `{
  "responseStatus": "OK",
  "events": [...],
  "count": 15
}`,
  },
  {
    id: "update-event",
    action: "UpdateEvent",
    title: "עדכון אירוע",
    description: "עדכון פרטי אירוע קיים. ניתן לעדכן כל שדה שקיים בטבלה.",
    method: "POST",
    category: "events",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
      { name: "groom_name", type: "string", required: false, description: "שם החתן" },
      { name: "bride_name", type: "string", required: false, description: "שם הכלה" },
      { name: "event_date", type: "date", required: false, description: "תאריך האירוע (YYYY-MM-DD)" },
      { name: "event_type", type: "string", required: false, description: "סוג האירוע" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateEvent
X-API-Key: YOUR_API_KEY
Content-Type: application/json

{
  "event_id": "EVENT_ID",
  "groom_name": "ישראל המעודכן",
  "event_date": "2025-07-20"
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "event": {
    "id": "uuid",
    "groom_name": "ישראל המעודכן",
    "event_date": "2025-07-20",
    ...
  }
}`,
  },

  // ===== GUESTS =====
  {
    id: "list-guests",
    action: "ListGuests",
    title: "רשימת מוזמנים",
    description: "קבלת כל המוזמנים לאירוע, כולל סטטיסטיקות RSVP. ניתן לסנן לפי סטטוס.",
    method: "GET",
    category: "guests",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
      { name: "status", type: "string", required: false, description: "סינון לפי סטטוס", options: ["approved", "declined", "pending"] },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListGuests&event_id=EVENT_ID
X-API-Key: YOUR_API_KEY`,
    exampleResponse: `{
  "responseStatus": "OK",
  "guests": [
    {
      "id": "uuid",
      "full_name": "משה כהן",
      "phone": "0501234567",
      "rsvp_status": "approved",
      "number_of_guests": 3
    }
  ],
  "count": 150,
  "stats": {
    "total": 150,
    "approved": 95,
    "approved_guests_total": 280,
    "declined": 10,
    "pending": 45
  }
}`,
  },
  {
    id: "add-guest",
    action: "AddGuest",
    title: "הוספת מוזמן",
    description: "הוספת מוזמן חדש לאירוע.",
    method: "POST",
    category: "guests",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
      { name: "full_name", type: "string", required: true, description: "שם מלא" },
      { name: "phone", type: "string", required: false, description: "מספר טלפון" },
      { name: "email", type: "string", required: false, description: "אימייל" },
      { name: "relationship", type: "string", required: false, description: "קרבה (משפחה, חברים, עבודה...)" },
      { name: "number_of_guests", type: "integer", required: false, description: "מספר אורחים (ברירת מחדל: 1)" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=AddGuest
X-API-Key: YOUR_API_KEY
Content-Type: application/json

{
  "event_id": "EVENT_ID",
  "full_name": "דוד לוי",
  "phone": "0521234567",
  "relationship": "משפחה",
  "number_of_guests": 4
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "guest": {
    "id": "new-uuid",
    "full_name": "דוד לוי",
    "phone": "0521234567",
    "rsvp_status": "pending",
    "number_of_guests": 4
  }
}`,
  },
  {
    id: "update-guest",
    action: "UpdateGuest",
    title: "עדכון מוזמן",
    description: "עדכון פרטי מוזמן קיים (שם, טלפון, אימייל וכו').",
    method: "POST",
    category: "guests",
    params: [
      { name: "guest_id", type: "uuid", required: true, description: "מזהה המוזמן" },
      { name: "full_name", type: "string", required: false, description: "שם מלא" },
      { name: "phone", type: "string", required: false, description: "מספר טלפון" },
      { name: "email", type: "string", required: false, description: "אימייל" },
      { name: "relationship", type: "string", required: false, description: "קרבה" },
      { name: "number_of_guests", type: "integer", required: false, description: "מספר אורחים" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateGuest
X-API-Key: YOUR_API_KEY
Content-Type: application/json

{
  "guest_id": "GUEST_ID",
  "phone": "0529876543",
  "number_of_guests": 5
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "guest": { ... }
}`,
  },
  {
    id: "update-rsvp",
    action: "UpdateRSVP",
    title: "עדכון אישור הגעה",
    description: "עדכון סטטוס RSVP של מוזמן. זו הפעולה המרכזית לאישורי הגעה מהטלפוניה.",
    method: "POST",
    category: "guests",
    params: [
      { name: "guest_id", type: "uuid", required: true, description: "מזהה המוזמן" },
      { name: "rsvp_status", type: "string", required: true, description: "סטטוס חדש", options: ["approved", "declined", "pending"] },
      { name: "number_of_guests", type: "integer", required: false, description: "עדכון מספר אורחים" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateRSVP
X-API-Key: YOUR_API_KEY
Content-Type: application/json

{
  "guest_id": "GUEST_ID",
  "rsvp_status": "approved",
  "number_of_guests": 3
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "guest": {
    "id": "uuid",
    "rsvp_status": "approved",
    "rsvp_date": "2025-06-10T14:30:00Z",
    "number_of_guests": 3
  }
}`,
    notes: ["זוהי הפעולה שתשתמשו בה מתוך מערכת הטלפוניה (ימות המשיח) לעדכון אישורי הגעה."],
  },
  {
    id: "delete-guest",
    action: "DeleteGuest",
    title: "מחיקת מוזמן",
    description: "מחיקת מוזמן מרשימת האירוע.",
    method: "POST",
    category: "guests",
    params: [
      { name: "guest_id", type: "uuid", required: true, description: "מזהה המוזמן" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=DeleteGuest
X-API-Key: YOUR_API_KEY
Content-Type: application/json

{
  "guest_id": "GUEST_ID"
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "success": true
}`,
  },
  {
    id: "bulk-add-guests",
    action: "BulkAddGuests",
    title: "הוספת מוזמנים מרובים",
    description: "הוספת רשימת מוזמנים בבת אחת לאירוע.",
    method: "POST",
    category: "guests",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
      { name: "guests", type: "array", required: true, description: "מערך אובייקטי מוזמנים (full_name חובה)" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=BulkAddGuests
X-API-Key: YOUR_API_KEY
Content-Type: application/json

{
  "event_id": "EVENT_ID",
  "guests": [
    { "full_name": "אברהם כהן", "phone": "0501111111" },
    { "full_name": "יצחק לוי", "phone": "0502222222", "relationship": "חברים" },
    { "full_name": "יעקב ישראלי", "number_of_guests": 5 }
  ]
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "guests": [...],
  "count": 3
}`,
  },
  {
    id: "bulk-update-rsvp",
    action: "BulkUpdateRSVP",
    title: "עדכון אישורים מרובים",
    description: "עדכון סטטוס RSVP של מספר מוזמנים בבת אחת.",
    method: "POST",
    category: "guests",
    params: [
      { name: "updates", type: "array", required: true, description: "מערך אובייקטים עם guest_id, rsvp_status, ואופציונלי number_of_guests" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=BulkUpdateRSVP
X-API-Key: YOUR_API_KEY
Content-Type: application/json

{
  "updates": [
    { "guest_id": "UUID1", "rsvp_status": "approved", "number_of_guests": 3 },
    { "guest_id": "UUID2", "rsvp_status": "declined" },
    { "guest_id": "UUID3", "rsvp_status": "approved", "number_of_guests": 2 }
  ]
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "results": [
    { "guest_id": "UUID1", "success": true, "data": {...} },
    { "guest_id": "UUID2", "success": true, "data": {...} },
    { "guest_id": "UUID3", "success": true, "data": {...} }
  ]
}`,
    notes: ["שימושי לעדכון מרוכז של אישורי הגעה שהתקבלו מהטלפוניה."],
  },

  // ===== TRANSACTIONS =====
  {
    id: "get-transactions",
    action: "GetTransactions",
    title: "רשימת מתנות/עסקאות",
    description: "קבלת כל המתנות והעסקאות של אירוע, כולל סיכום סכום כולל.",
    method: "GET",
    category: "transactions",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
    ],
    exampleRequest: `GET ${BASE_URL}?action=GetTransactions&event_id=EVENT_ID
X-API-Key: YOUR_API_KEY`,
    exampleResponse: `{
  "responseStatus": "OK",
  "transactions": [
    {
      "id": "uuid",
      "payer_name": "משה כהן",
      "amount": 500,
      "blessing_text": "מזל טוב!",
      "payment_status": "completed",
      "transaction_date": "2025-06-10T14:30:00Z"
    }
  ],
  "count": 42,
  "stats": {
    "total_amount": 75000
  }
}`,
  },

  // ===== VENUES =====
  {
    id: "get-venue",
    action: "GetVenue",
    title: "פרטי אולם",
    description: "קבלת כל הפרטים של אולם ספציפי.",
    method: "GET",
    category: "venues",
    params: [
      { name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" },
    ],
    exampleRequest: `GET ${BASE_URL}?action=GetVenue&venue_id=VENUE_ID
X-API-Key: YOUR_API_KEY`,
    exampleResponse: `{
  "responseStatus": "OK",
  "venue": {
    "id": "uuid",
    "name": "אולם השמחות",
    "address": "רחוב הדוגמה 1",
    "phone": "031234567",
    "email": "info@venue.co.il"
  }
}`,
  },
  {
    id: "list-venues",
    action: "ListVenues",
    title: "רשימת אולמות",
    description: "קבלת רשימת כל האולמות, עם אפשרות סינון לפי בעלים.",
    method: "GET",
    category: "venues",
    params: [
      { name: "owner_id", type: "uuid", required: false, description: "סינון לפי בעל אולם" },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListVenues
X-API-Key: YOUR_API_KEY`,
    exampleResponse: `{
  "responseStatus": "OK",
  "venues": [...],
  "count": 5
}`,
  },

  // ===== STATS =====
  {
    id: "get-event-stats",
    action: "GetEventStats",
    title: "סטטיסטיקות אירוע מלאות",
    description: "קבלת סטטיסטיקות מקיפות על אירוע: אורחים, RSVP, מתנות, סכומים.",
    method: "GET",
    category: "stats",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
    ],
    exampleRequest: `GET ${BASE_URL}?action=GetEventStats&event_id=EVENT_ID
X-API-Key: YOUR_API_KEY`,
    exampleResponse: `{
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
}`,
    notes: ["מחזיר תמונה מלאה של האירוע בקריאה אחת – שימושי לדשבורדים."],
  },
];

function MethodBadge({ method }: { method: HttpMethod }) {
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

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);

  return (
    <div id={endpoint.id} className="border border-border rounded-xl bg-card overflow-hidden scroll-mt-24">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 hover:bg-muted/30 transition-colors text-right"
      >
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono font-semibold text-foreground">{endpoint.action}</code>
        <span className="text-sm text-muted-foreground mr-auto">{endpoint.title}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="p-5 pb-3">
            <p className="text-sm text-muted-foreground leading-relaxed">{endpoint.description}</p>
          </div>

          <div className="px-5 pb-4">
            <div className="bg-muted/50 rounded-lg px-4 py-2.5 font-mono text-xs flex items-center gap-2 overflow-x-auto" dir="ltr">
              <MethodBadge method={endpoint.method} />
              <span className="text-muted-foreground">{BASE_URL}?action={endpoint.action}</span>
            </div>
          </div>

          {/* Parameters */}
          {endpoint.params.length > 0 && (
            <div className="px-5 pb-4">
              <h4 className="text-sm font-semibold mb-3 text-foreground">פרמטרים</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">שם</th>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">סוג</th>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">חובה</th>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">תיאור</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {endpoint.params.map((p) => (
                      <tr key={p.name} className="hover:bg-muted/20">
                        <td className="py-2.5 px-4 font-mono text-xs text-foreground">{p.name}</td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">{p.type}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant={p.required ? "default" : "secondary"} className="text-[10px]">
                            {p.required ? "חובה" : "אופציונלי"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">
                          {p.description}
                          {p.options && (
                            <span className="block mt-1 text-[10px]">
                              ערכים: {p.options.map(o => <code key={o} className="bg-muted px-1 rounded mx-0.5">{o}</code>)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {endpoint.notes && (
            <div className="px-5 pb-4">
              {endpoint.notes.map((note, i) => (
                <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 text-xs text-amber-700">
                  💡 {note}
                </div>
              ))}
            </div>
          )}

          {/* Code Examples */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-border">
            {endpoint.exampleRequest && (
              <div className="bg-[#1e1e2e] p-5 relative">
                <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Request</h4>
                <CopyButton text={endpoint.exampleRequest} />
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed" dir="ltr">
                  {endpoint.exampleRequest}
                </pre>
              </div>
            )}
            {endpoint.exampleResponse && (
              <div className="bg-[#1a1a2e] p-5 relative border-r border-border/20">
                <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Response</h4>
                <CopyButton text={endpoint.exampleResponse} />
                <pre className="text-xs text-blue-400 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed" dir="ltr">
                  {endpoint.exampleResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SystemApiDocs() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesCategory = !activeCategory || ep.category === activeCategory;
      const matchesSearch =
        !search ||
        ep.action.toLowerCase().includes(search.toLowerCase()) ||
        ep.title.includes(search) ||
        ep.description.includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, Endpoint[]> = {};
    for (const ep of filtered) {
      if (!groups[ep.category]) groups[ep.category] = [];
      groups[ep.category].push(ep);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              חזרה
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-bold">🎁 GiftKal API</h1>
            <Badge variant="secondary" className="text-[10px]">v1</Badge>
          </div>
          <div className="relative w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש endpoint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 h-9 text-sm"
            />
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] border-l border-border hidden lg:block">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-sm transition-colors",
                  !activeCategory ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                )}
              >
                כל ה-Endpoints ({endpoints.length})
              </button>

              {categories.map((cat) => {
                const count = endpoints.filter((e) => e.category === cat.id).length;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    className={cn(
                      "w-full text-right px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                      activeCategory === cat.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{cat.label}</span>
                    <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5">{count}</span>
                  </button>
                );
              })}

              <div className="pt-4 border-t border-border mt-4">
                <p className="text-[10px] text-muted-foreground px-3 mb-2 font-medium">ENDPOINTS</p>
                {(activeCategory ? endpoints.filter((e) => e.category === activeCategory) : endpoints).map((ep) => (
                  <a
                    key={ep.id}
                    href={`#${ep.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded"
                  >
                    <MethodBadge method={ep.method} />
                    <span className="truncate">{ep.action}</span>
                  </a>
                ))}
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-w-0">
          {/* Intro */}
          <div className="mb-8 p-6 bg-muted/30 rounded-2xl border border-border">
            <h2 className="text-xl font-bold mb-2">GiftKal Public API</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              ה-API מאפשר גישה מלאה לכל פעולות המערכת: ניהול אירועים, מוזמנים, אישורי הגעה, מתנות ואולמות.
              כל הבקשות נשלחות לכתובת אחת עם פרמטר <code className="bg-muted px-1 rounded">action</code>:
            </p>
            <div className="bg-[#1e1e2e] rounded-lg px-4 py-3 font-mono text-sm text-emerald-400 relative" dir="ltr">
              <CopyButton text={BASE_URL} />
              {BASE_URL}
            </div>

            <div className="mt-5 p-4 bg-card rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold">אימות (Authentication)</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                כל בקשה חייבת לכלול מפתח API בהדר <code className="bg-muted px-1 rounded">X-API-Key</code>.
                מפתחות API נוצרים ומנוהלים בממשק הניהול של המערכת.
              </p>
              <div className="bg-[#1e1e2e] rounded-lg px-4 py-2.5 font-mono text-xs text-emerald-400" dir="ltr">
                <CopyButton text='curl -H "X-API-Key: YOUR_API_KEY"' />
                {`curl -H "X-API-Key: YOUR_API_KEY" \\
  "${BASE_URL}?action=GetEvent&event_id=UUID"`}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">📦 פורמט:</span>
                <span className="text-muted-foreground mr-1">JSON בלבד</span>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">📡 מתודות:</span>
                <span className="text-muted-foreground mr-1">GET (קריאה) | POST (כתיבה)</span>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">⚡ סטטוסים:</span>
                <span className="text-muted-foreground mr-1">OK | ERROR</span>
              </div>
            </div>
          </div>

          {/* Error Reference */}
          <div className="mb-8 p-5 bg-destructive/5 rounded-xl border border-destructive/20">
            <h3 className="text-sm font-bold text-destructive mb-3">מבנה שגיאות</h3>
            <div className="bg-[#1e1e2e] rounded-lg px-4 py-3 font-mono text-xs text-red-400" dir="ltr">
              {`{
  "responseStatus": "ERROR",
  "error": "Description of the error",
  "code": 400
}`}
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-card p-2 rounded border border-border text-center">
                <span className="font-mono font-bold text-destructive">400</span>
                <p className="text-muted-foreground">פרמטר חסר/שגוי</p>
              </div>
              <div className="bg-card p-2 rounded border border-border text-center">
                <span className="font-mono font-bold text-destructive">401</span>
                <p className="text-muted-foreground">מפתח API לא תקין</p>
              </div>
              <div className="bg-card p-2 rounded border border-border text-center">
                <span className="font-mono font-bold text-destructive">404</span>
                <p className="text-muted-foreground">לא נמצא</p>
              </div>
              <div className="bg-card p-2 rounded border border-border text-center">
                <span className="font-mono font-bold text-destructive">500</span>
                <p className="text-muted-foreground">שגיאת שרת</p>
              </div>
            </div>
          </div>

          {/* Endpoints by category */}
          {Object.entries(groupedEndpoints).map(([catId, eps]) => {
            const cat = categories.find((c) => c.id === catId);
            return (
              <div key={catId} className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  {cat && <cat.icon className="w-5 h-5 text-primary" />}
                  <h3 className="text-lg font-bold">{cat?.label || catId}</h3>
                  <Badge variant="secondary" className="text-[10px]">{eps.length}</Badge>
                </div>
                <div className="space-y-3">
                  {eps.map((ep) => (
                    <EndpointCard key={ep.id} endpoint={ep} />
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">לא נמצאו endpoints</p>
              <p className="text-sm">נסה לחפש משהו אחר</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
