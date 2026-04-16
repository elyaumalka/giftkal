import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Calendar, CreditCard, Building2, BarChart3, Copy, Check, ChevronDown, ChevronLeft, Key, FileText, UserPlus, Megaphone, LifeBuoy, Receipt, Smartphone, StickyNote, ListTodo, Globe, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BASE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/public-api`;

type HttpMethod = "GET" | "POST" | "DELETE";

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
  { id: "invoices", label: "חשבוניות", icon: Receipt },
  { id: "devices", label: "מכשירים", icon: Smartphone },
  { id: "leads", label: "ניהול לידים", icon: Megaphone },
  { id: "landing-leads", label: "לידים מדף נחיתה", icon: Globe },
  { id: "users", label: "ניהול משתמשים", icon: UserPlus },
  { id: "documents", label: "מסמכים", icon: FileText },
  { id: "notes", label: "הערות", icon: StickyNote },
  { id: "tasks", label: "משימות", icon: ListTodo },
  { id: "support", label: "תמיכה", icon: LifeBuoy },
  { id: "settings", label: "הגדרות מערכת", icon: Settings },
  { id: "stats", label: "סטטיסטיקות", icon: BarChart3 },
];

const endpoints: Endpoint[] = [
  // ===== EVENTS =====
  {
    id: "get-event", action: "GetEvent", title: "קבלת פרטי אירוע",
    description: "קבלת כל הפרטים של אירוע ספציפי לפי מזהה.",
    method: "GET", category: "events",
    params: [{ name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" }],
    exampleRequest: `GET ${BASE_URL}?action=GetEvent&event_id=EVENT_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "event": {\n    "id": "uuid",\n    "event_type": "חתונה",\n    "groom_name": "ישראל",\n    "bride_name": "שרה",\n    "event_date": "2025-06-15",\n    "venue_id": "uuid",\n    "owner_id": "uuid"\n  }\n}`,
  },
  {
    id: "list-events", action: "ListEvents", title: "רשימת אירועים",
    description: "קבלת רשימת אירועים עם אפשרות סינון לפי אולם או בעלים.",
    method: "GET", category: "events",
    params: [
      { name: "venue_id", type: "uuid", required: false, description: "סינון לפי אולם" },
      { name: "owner_id", type: "uuid", required: false, description: "סינון לפי בעל אירוע" },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListEvents&venue_id=VENUE_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "events": [...],\n  "count": 15\n}`,
  },
  {
    id: "update-event", action: "UpdateEvent", title: "עדכון אירוע",
    description: "עדכון פרטי אירוע קיים – שם חתן/כלה, תאריך, סוג אירוע, שמות הורים וסבים.",
    method: "POST", category: "events",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
      { name: "groom_name", type: "string", required: false, description: "שם החתן" },
      { name: "bride_name", type: "string", required: false, description: "שם הכלה" },
      { name: "event_date", type: "date", required: false, description: "תאריך האירוע (YYYY-MM-DD)" },
      { name: "event_type", type: "string", required: false, description: "סוג האירוע" },
      { name: "groom_parents", type: "string", required: false, description: "שמות הורי החתן" },
      { name: "bride_parents", type: "string", required: false, description: "שמות הורי הכלה" },
      { name: "groom_grandparents", type: "string", required: false, description: "שמות סבי החתן" },
      { name: "bride_grandparents", type: "string", required: false, description: "שמות סבי הכלה" },
      { name: "invitation_text", type: "string", required: false, description: "טקסט הזמנה" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateEvent\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "event_id": "EVENT_ID",\n  "groom_name": "ישראל המעודכן",\n  "event_date": "2025-07-20"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "event": {\n    "id": "uuid",\n    "groom_name": "ישראל המעודכן",\n    "event_date": "2025-07-20",\n    ...\n  }\n}`,
    notes: ["ניתן גם ליצור אירוע חדש עבור בעלים קיימים דרך CreateEvent."],
  },
  {
    id: "create-event", action: "CreateEvent", title: "יצירת אירוע (לקוח חוזר)",
    description: "יצירת אירוע חדש עבור בעל אירוע קיים במערכת – ללא צורך ביצירת משתמש חדש.",
    method: "POST", category: "events",
    params: [
      { name: "owner_id", type: "uuid", required: true, description: "מזהה בעל האירוע (user_id)" },
      { name: "event_date", type: "date", required: true, description: "תאריך האירוע (YYYY-MM-DD)" },
      { name: "event_type", type: "string", required: false, description: "סוג אירוע: חתונה / אירוסין / בר מצווה / בת מצווה / ברית", options: ["חתונה", "אירוסין", "בר מצווה", "בת מצווה", "ברית"] },
      { name: "groom_name", type: "string", required: false, description: "שם חתן" },
      { name: "bride_name", type: "string", required: false, description: "שם כלה" },
      { name: "child_name", type: "string", required: false, description: "שם הילד/ה (בר/בת מצווה, ברית)" },
      { name: "family_name", type: "string", required: false, description: "שם משפחה" },
      { name: "venue_id", type: "uuid", required: false, description: "מזהה אולם" },
      { name: "hall_id", type: "uuid", required: false, description: "מזהה אולם פנימי" },
      { name: "custom_venue_name", type: "string", required: false, description: "שם מיקום מותאם" },
      { name: "custom_venue_location", type: "string", required: false, description: "כתובת מיקום מותאם" },
      { name: "reception_time", type: "string", required: false, description: "שעת קבלת פנים" },
      { name: "ceremony_time", type: "string", required: false, description: "שעת טקס" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateEvent\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "owner_id": "EXISTING_USER_ID",\n  "event_date": "2025-09-15",\n  "event_type": "חתונה",\n  "groom_name": "ישראל",\n  "bride_name": "שרה"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "event": {\n    "id": "uuid",\n    "owner_id": "EXISTING_USER_ID",\n    "event_date": "2025-09-15",\n    "event_type": "חתונה",\n    ...\n  }\n}`,
    notes: ["מתאים ללקוחות חוזרים שכבר קיימים במערכת.", "ה-owner_id חייב להיות של משתמש קיים עם פרופיל.", "ליצירת לקוח חדש + אירוע יחד, השתמשו ב-CreateEventOwner."],
  },

  // ===== GUESTS =====
  {
    id: "list-guests", action: "ListGuests", title: "רשימת מוזמנים",
    description: "קבלת כל המוזמנים לאירוע, כולל סטטיסטיקות RSVP. ניתן לסנן לפי סטטוס.",
    method: "GET", category: "guests",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
      { name: "status", type: "string", required: false, description: "סינון לפי סטטוס", options: ["approved", "declined", "pending"] },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListGuests&event_id=EVENT_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "guests": [\n    {\n      "id": "uuid",\n      "full_name": "משה כהן",\n      "phone": "0501234567",\n      "rsvp_status": "approved",\n      "number_of_guests": 3\n    }\n  ],\n  "count": 150,\n  "stats": {\n    "total": 150,\n    "approved": 95,\n    "approved_guests_total": 280,\n    "declined": 10,\n    "pending": 45\n  }\n}`,
  },
  {
    id: "add-guest", action: "AddGuest", title: "הוספת מוזמן",
    description: "הוספת מוזמן חדש לאירוע.",
    method: "POST", category: "guests",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
      { name: "full_name", type: "string", required: true, description: "שם מלא" },
      { name: "phone", type: "string", required: false, description: "מספר טלפון" },
      { name: "email", type: "string", required: false, description: "אימייל" },
      { name: "relationship", type: "string", required: false, description: "קרבה (משפחה, חברים, עבודה...)" },
      { name: "number_of_guests", type: "integer", required: false, description: "מספר אורחים (ברירת מחדל: 1)" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=AddGuest\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "event_id": "EVENT_ID",\n  "full_name": "דוד לוי",\n  "phone": "0521234567",\n  "relationship": "משפחה",\n  "number_of_guests": 4\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "guest": {\n    "id": "new-uuid",\n    "full_name": "דוד לוי",\n    "rsvp_status": "pending",\n    "number_of_guests": 4\n  }\n}`,
  },
  {
    id: "update-guest", action: "UpdateGuest", title: "עדכון מוזמן",
    description: "עדכון פרטי מוזמן קיים (שם, טלפון, אימייל וכו').",
    method: "POST", category: "guests",
    params: [
      { name: "guest_id", type: "uuid", required: true, description: "מזהה המוזמן" },
      { name: "full_name", type: "string", required: false, description: "שם מלא" },
      { name: "phone", type: "string", required: false, description: "מספר טלפון" },
      { name: "email", type: "string", required: false, description: "אימייל" },
      { name: "relationship", type: "string", required: false, description: "קרבה" },
      { name: "number_of_guests", type: "integer", required: false, description: "מספר אורחים" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateGuest\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "guest_id": "GUEST_ID",\n  "phone": "0529876543",\n  "number_of_guests": 5\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "guest": { ... }\n}`,
  },
  {
    id: "update-rsvp", action: "UpdateRSVP", title: "עדכון אישור הגעה",
    description: "עדכון סטטוס RSVP של מוזמן. זו הפעולה המרכזית לאישורי הגעה מהטלפוניה.",
    method: "POST", category: "guests",
    params: [
      { name: "guest_id", type: "uuid", required: true, description: "מזהה המוזמן" },
      { name: "rsvp_status", type: "string", required: true, description: "סטטוס חדש", options: ["approved", "declined", "pending"] },
      { name: "number_of_guests", type: "integer", required: false, description: "עדכון מספר אורחים" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateRSVP\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "guest_id": "GUEST_ID",\n  "rsvp_status": "approved",\n  "number_of_guests": 3\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "guest": {\n    "id": "uuid",\n    "rsvp_status": "approved",\n    "rsvp_date": "2025-06-10T14:30:00Z",\n    "number_of_guests": 3\n  }\n}`,
    notes: ["זוהי הפעולה שתשתמשו בה מתוך מערכת הטלפוניה (ימות המשיח) לעדכון אישורי הגעה."],
  },
  {
    id: "delete-guest", action: "DeleteGuest", title: "מחיקת מוזמן",
    description: "מחיקת מוזמן מרשימת האירוע.",
    method: "POST", category: "guests",
    params: [{ name: "guest_id", type: "uuid", required: true, description: "מזהה המוזמן" }],
    exampleRequest: `POST ${BASE_URL}?action=DeleteGuest\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "guest_id": "GUEST_ID"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "success": true\n}`,
  },
  {
    id: "bulk-add-guests", action: "BulkAddGuests", title: "הוספת מוזמנים מרובים",
    description: "הוספת רשימת מוזמנים בבת אחת לאירוע.",
    method: "POST", category: "guests",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
      { name: "guests", type: "array", required: true, description: "מערך אובייקטי מוזמנים (full_name חובה)" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=BulkAddGuests\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "event_id": "EVENT_ID",\n  "guests": [\n    { "full_name": "אברהם כהן", "phone": "0501111111" },\n    { "full_name": "יצחק לוי", "phone": "0502222222", "relationship": "חברים" },\n    { "full_name": "יעקב ישראלי", "number_of_guests": 5 }\n  ]\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "guests": [...],\n  "count": 3\n}`,
  },
  {
    id: "bulk-update-rsvp", action: "BulkUpdateRSVP", title: "עדכון אישורים מרובים",
    description: "עדכון סטטוס RSVP של מספר מוזמנים בבת אחת.",
    method: "POST", category: "guests",
    params: [{ name: "updates", type: "array", required: true, description: "מערך אובייקטים עם guest_id, rsvp_status, ואופציונלי number_of_guests" }],
    exampleRequest: `POST ${BASE_URL}?action=BulkUpdateRSVP\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "updates": [\n    { "guest_id": "UUID1", "rsvp_status": "approved", "number_of_guests": 3 },\n    { "guest_id": "UUID2", "rsvp_status": "declined" }\n  ]\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "results": [\n    { "guest_id": "UUID1", "success": true, "data": {...} },\n    { "guest_id": "UUID2", "success": true, "data": {...} }\n  ]\n}`,
    notes: ["שימושי לעדכון מרוכז של אישורי הגעה שהתקבלו מהטלפוניה."],
  },

  // ===== TRANSACTIONS =====
  {
    id: "get-transactions", action: "GetTransactions", title: "רשימת מתנות/עסקאות",
    description: "קבלת כל המתנות והעסקאות של אירוע, כולל סיכום סכום כולל.",
    method: "GET", category: "transactions",
    params: [{ name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" }],
    exampleRequest: `GET ${BASE_URL}?action=GetTransactions&event_id=EVENT_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "transactions": [\n    {\n      "id": "uuid",\n      "payer_name": "משה כהן",\n      "amount": 500,\n      "blessing_text": "מזל טוב!",\n      "payment_status": "completed"\n    }\n  ],\n  "count": 42,\n  "stats": { "total_amount": 75000 }\n}`,
  },
  {
    id: "get-transaction", action: "GetTransaction", title: "פרטי עסקה בודדת",
    description: "קבלת כל הפרטים של עסקה ספציפית.",
    method: "GET", category: "transactions",
    params: [{ name: "transaction_id", type: "uuid", required: true, description: "מזהה העסקה" }],
    exampleRequest: `GET ${BASE_URL}?action=GetTransaction&transaction_id=TX_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "transaction": {\n    "id": "uuid",\n    "payer_name": "משה כהן",\n    "amount": 500,\n    "blessing_text": "מזל טוב!",\n    "payment_status": "completed",\n    "relationship": "משפחה",\n    "transaction_date": "2025-06-10T14:30:00Z"\n  }\n}`,
  },
  {
    id: "create-transaction", action: "CreateTransaction", title: "יצירת עסקה/מתנה",
    description: "הוספת עסקה חדשה לאירוע – למשל מתנה שהתקבלה מחוץ למערכת התשלומים.",
    method: "POST", category: "transactions",
    params: [
      { name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" },
      { name: "payer_name", type: "string", required: true, description: "שם הנותן" },
      { name: "amount", type: "number", required: true, description: "סכום" },
      { name: "payer_phone", type: "string", required: false, description: "טלפון" },
      { name: "payer_email", type: "string", required: false, description: "אימייל" },
      { name: "relationship", type: "string", required: false, description: "קרבה (משפחה, חברים, עבודה...)" },
      { name: "side", type: "string", required: false, description: "צד (חתן / כלה / כללי)", options: ["groom", "bride", "general"] },
      { name: "blessing_text", type: "string", required: false, description: "ברכה" },
      { name: "venue_id", type: "uuid", required: false, description: "שיוך לאולם" },
      { name: "installments", type: "integer", required: false, description: "מספר תשלומים (ברירת מחדל: 1)" },
      { name: "payment_status", type: "string", required: false, description: "סטטוס (ברירת מחדל: completed)", options: ["pending", "completed", "failed"] },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateTransaction\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "event_id": "EVENT_ID",\n  "payer_name": "אברהם כהן",\n  "amount": 500,\n  "relationship": "דוד",\n  "blessing_text": "מזל טוב לזוג הנפלא!"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "transaction": {\n    "id": "new-uuid",\n    "payer_name": "אברהם כהן",\n    "amount": 500,\n    "payment_status": "completed"\n  }\n}`,
    notes: ["שימושי לרישום מתנות שהתקבלו במזומן, צ'ק, או העברה בנקאית ישירה."],
  },

  // ===== VENUES =====
  {
    id: "get-venue", action: "GetVenue", title: "פרטי אולם",
    description: "קבלת כל הפרטים של אולם ספציפי.",
    method: "GET", category: "venues",
    params: [{ name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" }],
    exampleRequest: `GET ${BASE_URL}?action=GetVenue&venue_id=VENUE_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "venue": {\n    "id": "uuid",\n    "name": "אולם השמחות",\n    "address": "רחוב הדוגמה 1",\n    "phone": "031234567"\n  }\n}`,
  },
  {
    id: "list-venues", action: "ListVenues", title: "רשימת אולמות",
    description: "קבלת רשימת כל האולמות, עם אפשרות סינון לפי בעלים.",
    method: "GET", category: "venues",
    params: [{ name: "owner_id", type: "uuid", required: false, description: "סינון לפי בעל אולם" }],
    exampleRequest: `GET ${BASE_URL}?action=ListVenues\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "venues": [...],\n  "count": 5\n}`,
  },
  {
    id: "create-venue", action: "CreateVenue", title: "יצירת אולם חדש",
    description: "יצירת אולם חדש ושיוכו לבעלים קיים.",
    method: "POST", category: "venues",
    params: [
      { name: "owner_id", type: "uuid", required: true, description: "מזהה בעל האולם (user_id)" },
      { name: "name", type: "string", required: true, description: "שם האולם" },
      { name: "address", type: "string", required: true, description: "כתובת" },
      { name: "phone", type: "string", required: false, description: "טלפון" },
      { name: "email", type: "string", required: false, description: "אימייל" },
      { name: "monthly_subscription", type: "number", required: false, description: "מנוי חודשי (ברירת מחדל: 0)" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateVenue\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "owner_id": "USER_ID",\n  "name": "אולם הזהב",\n  "address": "רחוב הראשי 50, ירושלים",\n  "phone": "021234567",\n  "monthly_subscription": 500\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "venue": {\n    "id": "new-uuid",\n    "name": "אולם הזהב",\n    "address": "רחוב הראשי 50, ירושלים",\n    ...\n  }\n}`,
  },
  {
    id: "update-venue", action: "UpdateVenue", title: "עדכון אולם",
    description: "עדכון פרטי אולם קיים.",
    method: "POST", category: "venues",
    params: [
      { name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" },
      { name: "name", type: "string", required: false, description: "שם האולם" },
      { name: "address", type: "string", required: false, description: "כתובת" },
      { name: "phone", type: "string", required: false, description: "טלפון" },
      { name: "email", type: "string", required: false, description: "אימייל" },
      { name: "monthly_subscription", type: "number", required: false, description: "מנוי חודשי" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateVenue\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "venue_id": "VENUE_ID",\n  "name": "אולם הזהב המחודש",\n  "monthly_subscription": 750\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "venue": { ... }\n}`,
  },
  {
    id: "delete-venue", action: "DeleteVenue", title: "מחיקת אולם",
    description: "מחיקת אולם מהמערכת.",
    method: "POST", category: "venues",
    params: [{ name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" }],
    exampleRequest: `POST ${BASE_URL}?action=DeleteVenue\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "venue_id": "VENUE_ID"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "success": true\n}`,
    notes: ["⚠️ מחיקת אולם עלולה להשפיע על אירועים משויכים. יש לוודא שאין אירועים פעילים לפני מחיקה."],
  },

  // ===== LEADS =====
  {
    id: "list-leads", action: "ListLeads", title: "רשימת לידים",
    description: "קבלת כל הלידים במערכת עם אפשרות סינון לפי סטטוס וסוג.",
    method: "GET", category: "leads",
    params: [
      { name: "status", type: "string", required: false, description: "סינון לפי סטטוס", options: ["new", "contacted", "qualified", "converted", "lost"] },
      { name: "lead_type", type: "string", required: false, description: "סינון לפי סוג ליד", options: ["venue", "event"] },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListLeads&status=new\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "leads": [\n    {\n      "id": "uuid",\n      "full_name": "יוסי כהן",\n      "phone": "0501234567",\n      "lead_type": "venue",\n      "status": "new"\n    }\n  ],\n  "count": 25\n}`,
  },
  {
    id: "get-lead", action: "GetLead", title: "פרטי ליד",
    description: "קבלת כל הפרטים של ליד ספציפי.",
    method: "GET", category: "leads",
    params: [{ name: "lead_id", type: "uuid", required: true, description: "מזהה הליד" }],
    exampleRequest: `GET ${BASE_URL}?action=GetLead&lead_id=LEAD_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "lead": {\n    "id": "uuid",\n    "full_name": "יוסי כהן",\n    "lead_type": "venue",\n    "venue_name": "אולם הזהב",\n    "status": "new"\n  }\n}`,
  },
  {
    id: "create-lead", action: "CreateLead", title: "יצירת ליד חדש",
    description: "הוספת ליד חדש למערכת – לקוח פוטנציאלי (אולם או אירוע).",
    method: "POST", category: "leads",
    params: [
      { name: "lead_type", type: "string", required: true, description: "סוג הליד", options: ["venue", "event"] },
      { name: "full_name", type: "string", required: true, description: "שם מלא" },
      { name: "phone", type: "string", required: false, description: "טלפון" },
      { name: "email", type: "string", required: false, description: "אימייל" },
      { name: "venue_name", type: "string", required: false, description: "שם אולם (לליד סוג venue)" },
      { name: "venue_address", type: "string", required: false, description: "כתובת אולם" },
      { name: "venue_count", type: "integer", required: false, description: "מספר אולמות" },
      { name: "status", type: "string", required: false, description: "סטטוס (ברירת מחדל: new)" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateLead\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "lead_type": "venue",\n  "full_name": "אברהם ישראלי",\n  "phone": "0541234567",\n  "venue_name": "אולם החלומות",\n  "venue_address": "תל אביב"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "lead": {\n    "id": "new-uuid",\n    "full_name": "אברהם ישראלי",\n    "lead_type": "venue",\n    "status": "new"\n  }\n}`,
  },
  {
    id: "update-lead", action: "UpdateLead", title: "עדכון ליד",
    description: "עדכון פרטי ליד – סטטוס, פרטי קשר, שם אולם וכו'.",
    method: "POST", category: "leads",
    params: [
      { name: "lead_id", type: "uuid", required: true, description: "מזהה הליד" },
      { name: "status", type: "string", required: false, description: "סטטוס חדש", options: ["new", "contacted", "qualified", "converted", "lost"] },
      { name: "full_name", type: "string", required: false, description: "שם" },
      { name: "phone", type: "string", required: false, description: "טלפון" },
      { name: "email", type: "string", required: false, description: "אימייל" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateLead\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "lead_id": "LEAD_ID",\n  "status": "contacted"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "lead": { ... }\n}`,
  },
  {
    id: "delete-lead", action: "DeleteLead", title: "מחיקת ליד",
    description: "מחיקת ליד מהמערכת.",
    method: "POST", category: "leads",
    params: [{ name: "lead_id", type: "uuid", required: true, description: "מזהה הליד" }],
    exampleRequest: `POST ${BASE_URL}?action=DeleteLead\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "lead_id": "LEAD_ID"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "success": true\n}`,
  },

  // ===== USERS =====
  {
    id: "list-users", action: "ListUsers", title: "רשימת כל המשתמשים",
    description: "קבלת כל המשתמשים במערכת כולל התפקידים שלהם (admin, venue_owner, event_owner).",
    method: "GET", category: "users",
    params: [],
    exampleRequest: `GET ${BASE_URL}?action=ListUsers\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "users": [\n    {\n      "user_id": "uuid",\n      "full_name": "ישראל כהן",\n      "email": "israel@example.com",\n      "phone": "0501234567",\n      "roles": ["venue_owner"]\n    }\n  ],\n  "count": 30\n}`,
  },
  {
    id: "list-profiles", action: "ListProfiles", title: "רשימת פרופילים",
    description: "קבלת כל הפרופילים (ללא תפקידים). גרסה קלה יותר של ListUsers.",
    method: "GET", category: "users",
    params: [],
    exampleRequest: `GET ${BASE_URL}?action=ListProfiles\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "profiles": [...],\n  "count": 30\n}`,
  },
  {
    id: "get-profile", action: "GetProfile", title: "פרופיל משתמש",
    description: "קבלת פרופיל משתמש לפי user_id.",
    method: "GET", category: "users",
    params: [{ name: "user_id", type: "uuid", required: true, description: "מזהה המשתמש" }],
    exampleRequest: `GET ${BASE_URL}?action=GetProfile&user_id=USER_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "profile": {\n    "user_id": "uuid",\n    "full_name": "ישראל כהן",\n    "email": "israel@example.com",\n    "phone": "0501234567"\n  }\n}`,
  },
  {
    id: "update-profile", action: "UpdateProfile", title: "עדכון פרופיל",
    description: "עדכון פרטי פרופיל משתמש – שם, טלפון, תמונה.",
    method: "POST", category: "users",
    params: [
      { name: "user_id", type: "uuid", required: true, description: "מזהה המשתמש" },
      { name: "full_name", type: "string", required: false, description: "שם מלא" },
      { name: "phone", type: "string", required: false, description: "טלפון" },
      { name: "avatar_url", type: "string", required: false, description: "URL תמונת פרופיל" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateProfile\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "user_id": "USER_ID",\n  "full_name": "ישראל כהן המעודכן",\n  "phone": "0509876543"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "profile": { ... }\n}`,
  },
  {
    id: "create-event-owner", action: "CreateEventOwner", title: "יצירת בעל אירוע חדש",
    description: "יצירת משתמש חדש עם תפקיד בעל אירוע. ניתן גם ליצור את האירוע הראשון שלו במקביל.",
    method: "POST", category: "users",
    params: [
      { name: "email", type: "string", required: true, description: "אימייל המשתמש" },
      { name: "password", type: "string", required: true, description: "סיסמה" },
      { name: "full_name", type: "string", required: true, description: "שם מלא" },
      { name: "phone", type: "string", required: false, description: "טלפון" },
      { name: "event", type: "object", required: false, description: "אובייקט אירוע (event_date חובה)" },
      { name: "event.event_date", type: "date", required: false, description: "תאריך האירוע" },
      { name: "event.event_type", type: "string", required: false, description: "סוג אירוע (ברירת מחדל: חתונה)" },
      { name: "event.venue_id", type: "uuid", required: false, description: "שיוך לאולם" },
      { name: "event.groom_name", type: "string", required: false, description: "שם החתן" },
      { name: "event.bride_name", type: "string", required: false, description: "שם הכלה" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateEventOwner\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "email": "newuser@example.com",\n  "password": "SecurePass123!",\n  "full_name": "דוד כהן",\n  "phone": "0521234567",\n  "event": {\n    "event_date": "2025-08-15",\n    "event_type": "חתונה",\n    "groom_name": "דוד",\n    "bride_name": "רחל",\n    "venue_id": "VENUE_ID"\n  }\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "user": {\n    "id": "new-user-uuid",\n    "email": "newuser@example.com",\n    "full_name": "דוד כהן"\n  },\n  "event": {\n    "id": "new-event-uuid",\n    "event_date": "2025-08-15",\n    ...\n  }\n}`,
    notes: [
      "המשתמש נוצר עם סיסמה ואימייל מאומת אוטומטית.",
      "אם שולחים אובייקט event – האירוע נוצר ומשויך למשתמש החדש.",
    ],
  },
  {
    id: "create-venue-owner", action: "CreateVenueOwner", title: "יצירת בעל אולם חדש",
    description: "יצירת משתמש חדש עם תפקיד בעל אולם. ניתן גם ליצור את האולם שלו במקביל.",
    method: "POST", category: "users",
    params: [
      { name: "email", type: "string", required: true, description: "אימייל המשתמש" },
      { name: "password", type: "string", required: true, description: "סיסמה" },
      { name: "full_name", type: "string", required: true, description: "שם מלא" },
      { name: "phone", type: "string", required: false, description: "טלפון" },
      { name: "venue", type: "object", required: false, description: "אובייקט אולם (name ו-address חובה)" },
      { name: "venue.name", type: "string", required: false, description: "שם האולם" },
      { name: "venue.address", type: "string", required: false, description: "כתובת" },
      { name: "venue.phone", type: "string", required: false, description: "טלפון אולם" },
      { name: "venue.email", type: "string", required: false, description: "אימייל אולם" },
      { name: "venue.monthly_subscription", type: "number", required: false, description: "מנוי חודשי" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateVenueOwner\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "email": "venueowner@example.com",\n  "password": "SecurePass123!",\n  "full_name": "יעקב לוי",\n  "venue": {\n    "name": "אולם הכוכבים",\n    "address": "רחוב הכוכבים 10, באר שבע",\n    "monthly_subscription": 600\n  }\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "user": {\n    "id": "new-user-uuid",\n    "email": "venueowner@example.com",\n    "full_name": "יעקב לוי"\n  },\n  "venue": {\n    "id": "new-venue-uuid",\n    "name": "אולם הכוכבים",\n    ...\n  }\n}`,
    notes: [
      "המשתמש נוצר עם סיסמה ואימייל מאומת אוטומטית.",
      "אם שולחים אובייקט venue – האולם נוצר ומשויך לבעלים החדש.",
    ],
  },

  // ===== DOCUMENTS =====
  {
    id: "list-documents", action: "ListDocuments", title: "רשימת מסמכים",
    description: "קבלת רשימת מסמכים עם סינון לפי משתמש, אירוע או אולם.",
    method: "GET", category: "documents",
    params: [
      { name: "user_id", type: "uuid", required: false, description: "סינון לפי משתמש" },
      { name: "event_id", type: "uuid", required: false, description: "סינון לפי אירוע" },
      { name: "venue_id", type: "uuid", required: false, description: "סינון לפי אולם" },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListDocuments&user_id=USER_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "documents": [\n    {\n      "id": "uuid",\n      "document_type": "bank_approval",\n      "file_name": "אישור_בנק.pdf",\n      "file_url": "https://...",\n      "uploaded_at": "2025-06-10T14:30:00Z"\n    }\n  ],\n  "count": 3\n}`,
  },
  {
    id: "add-document", action: "AddDocument", title: "הוספת מסמך",
    description: "רישום מסמך חדש במערכת. ה-file_url צריך להיות קישור לקובץ שכבר הועלה לאחסון.",
    method: "POST", category: "documents",
    params: [
      { name: "user_id", type: "uuid", required: true, description: "מזהה המשתמש ששלח" },
      { name: "document_type", type: "string", required: true, description: "סוג מסמך (bank_approval, id_copy, contract...)" },
      { name: "file_url", type: "string", required: true, description: "קישור לקובץ" },
      { name: "file_name", type: "string", required: true, description: "שם הקובץ" },
      { name: "event_id", type: "uuid", required: false, description: "שיוך לאירוע" },
      { name: "venue_id", type: "uuid", required: false, description: "שיוך לאולם" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=AddDocument\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "user_id": "USER_ID",\n  "document_type": "bank_approval",\n  "file_url": "https://storage.example.com/docs/approval.pdf",\n  "file_name": "אישור_בנק.pdf",\n  "event_id": "EVENT_ID"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "document": {\n    "id": "new-uuid",\n    "document_type": "bank_approval",\n    "file_name": "אישור_בנק.pdf",\n    ...\n  }\n}`,
    notes: ["הקובץ עצמו צריך להיות מועלה בנפרד לאחסון. פעולה זו רק מתעדת את המסמך."],
  },
  {
    id: "delete-document", action: "DeleteDocument", title: "מחיקת מסמך",
    description: "מחיקת רשומת מסמך מהמערכת.",
    method: "POST", category: "documents",
    params: [{ name: "document_id", type: "uuid", required: true, description: "מזהה המסמך" }],
    exampleRequest: `POST ${BASE_URL}?action=DeleteDocument\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "document_id": "DOCUMENT_ID"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "success": true\n}`,
  },

  // ===== SUPPORT =====
  {
    id: "list-tickets", action: "ListTickets", title: "רשימת פניות תמיכה",
    description: "קבלת כל פניות התמיכה עם סינון לפי משתמש וסטטוס.",
    method: "GET", category: "support",
    params: [
      { name: "user_id", type: "uuid", required: false, description: "סינון לפי משתמש" },
      { name: "status", type: "string", required: false, description: "סינון לפי סטטוס", options: ["open", "in_progress", "closed"] },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListTickets&status=open\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "tickets": [\n    {\n      "id": "uuid",\n      "subject": "בעיה בתשלום",\n      "status": "open",\n      "ticket_type": "technical"\n    }\n  ],\n  "count": 5\n}`,
  },
  {
    id: "create-ticket", action: "CreateTicket", title: "פתיחת פנייה",
    description: "פתיחת פניית תמיכה חדשה.",
    method: "POST", category: "support",
    params: [
      { name: "user_id", type: "uuid", required: true, description: "מזהה המשתמש הפונה" },
      { name: "ticket_type", type: "string", required: true, description: "סוג פנייה (technical, billing, general...)" },
      { name: "subject", type: "string", required: true, description: "נושא" },
      { name: "description", type: "string", required: true, description: "תיאור הבעיה" },
      { name: "venue_id", type: "uuid", required: false, description: "שיוך לאולם" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateTicket\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "user_id": "USER_ID",\n  "ticket_type": "technical",\n  "subject": "בעיה בעמוד המתנות",\n  "description": "העמוד לא נטען כשלוחצים על הקישור"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "ticket": {\n    "id": "new-uuid",\n    "subject": "בעיה בעמוד המתנות",\n    "status": "open"\n  }\n}`,
  },
  {
    id: "update-ticket", action: "UpdateTicket", title: "עדכון פנייה",
    description: "עדכון סטטוס פנייה או הוספת תגובה.",
    method: "POST", category: "support",
    params: [
      { name: "ticket_id", type: "uuid", required: true, description: "מזהה הפנייה" },
      { name: "status", type: "string", required: false, description: "סטטוס חדש", options: ["open", "in_progress", "closed"] },
      { name: "response", type: "string", required: false, description: "תגובה לפנייה" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateTicket\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "ticket_id": "TICKET_ID",\n  "status": "closed",\n  "response": "הבעיה תוקנה, תודה על הפנייה"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "ticket": { ... }\n}`,
  },

  // ===== INVOICES =====
  {
    id: "list-invoices", action: "ListInvoices", title: "רשימת חשבוניות",
    description: "קבלת כל החשבוניות של אולם ספציפי.",
    method: "GET", category: "invoices",
    params: [{ name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" }],
    exampleRequest: `GET ${BASE_URL}?action=ListInvoices&venue_id=VENUE_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "invoices": [\n    {\n      "id": "uuid",\n      "venue_id": "uuid",\n      "amount": 500,\n      "for_month": "2025-06-01",\n      "file_url": "https://..."\n    }\n  ],\n  "count": 12\n}`,
  },
  {
    id: "get-invoice", action: "GetInvoice", title: "פרטי חשבונית",
    description: "קבלת פרטי חשבונית בודדת.",
    method: "GET", category: "invoices",
    params: [{ name: "invoice_id", type: "uuid", required: true, description: "מזהה החשבונית" }],
    exampleRequest: `GET ${BASE_URL}?action=GetInvoice&invoice_id=INVOICE_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "invoice": { ... }\n}`,
  },
  {
    id: "create-invoice", action: "CreateInvoice", title: "יצירת חשבונית",
    description: "יצירת חשבונית חדשה לאולם.",
    method: "POST", category: "invoices",
    params: [
      { name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" },
      { name: "amount", type: "number", required: true, description: "סכום" },
      { name: "for_month", type: "date", required: true, description: "עבור חודש (YYYY-MM-DD)" },
      { name: "file_url", type: "string", required: false, description: "קישור לקובץ חשבונית" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateInvoice\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "venue_id": "VENUE_ID",\n  "amount": 500,\n  "for_month": "2025-06-01"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "invoice": {\n    "id": "new-uuid",\n    "amount": 500,\n    "for_month": "2025-06-01"\n  }\n}`,
  },
  {
    id: "update-invoice", action: "UpdateInvoice", title: "עדכון חשבונית",
    description: "עדכון פרטי חשבונית – סכום, קישור לקובץ.",
    method: "POST", category: "invoices",
    params: [
      { name: "invoice_id", type: "uuid", required: true, description: "מזהה החשבונית" },
      { name: "amount", type: "number", required: false, description: "סכום" },
      { name: "file_url", type: "string", required: false, description: "קישור לקובץ" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateInvoice\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "invoice_id": "INVOICE_ID",\n  "amount": 600\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "invoice": { ... }\n}`,
  },

  // ===== DEVICES =====
  {
    id: "list-devices", action: "ListDevices", title: "רשימת מכשירים",
    description: "קבלת כל המכשירים של אולם.",
    method: "GET", category: "devices",
    params: [{ name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" }],
    exampleRequest: `GET ${BASE_URL}?action=ListDevices&venue_id=VENUE_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "devices": [\n    {\n      "id": "uuid",\n      "name": "מכשיר מתנות 1",\n      "serial_number": "SN12345",\n      "is_active": true\n    }\n  ],\n  "count": 3\n}`,
  },
  {
    id: "create-device", action: "CreateDevice", title: "הוספת מכשיר",
    description: "הוספת מכשיר חדש לאולם.",
    method: "POST", category: "devices",
    params: [
      { name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" },
      { name: "name", type: "string", required: true, description: "שם המכשיר" },
      { name: "serial_number", type: "string", required: true, description: "מספר סריאלי" },
      { name: "is_active", type: "boolean", required: false, description: "פעיל (ברירת מחדל: true)" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateDevice\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "venue_id": "VENUE_ID",\n  "name": "מכשיר מתנות 2",\n  "serial_number": "SN67890"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "device": {\n    "id": "new-uuid",\n    "name": "מכשיר מתנות 2",\n    "serial_number": "SN67890",\n    "is_active": true\n  }\n}`,
  },
  {
    id: "update-device", action: "UpdateDevice", title: "עדכון מכשיר",
    description: "עדכון פרטי מכשיר – שם, סטטוס פעילות.",
    method: "POST", category: "devices",
    params: [
      { name: "device_id", type: "uuid", required: true, description: "מזהה המכשיר" },
      { name: "name", type: "string", required: false, description: "שם" },
      { name: "is_active", type: "boolean", required: false, description: "פעיל/לא פעיל" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateDevice\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "device_id": "DEVICE_ID",\n  "is_active": false\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "device": { ... }\n}`,
  },
  {
    id: "delete-device", action: "DeleteDevice", title: "מחיקת מכשיר",
    description: "מחיקת מכשיר מהאולם.",
    method: "POST", category: "devices",
    params: [{ name: "device_id", type: "uuid", required: true, description: "מזהה המכשיר" }],
    exampleRequest: `POST ${BASE_URL}?action=DeleteDevice\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "device_id": "DEVICE_ID"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "success": true\n}`,
  },

  // ===== NOTES =====
  {
    id: "list-notes", action: "ListNotes", title: "רשימת הערות",
    description: "קבלת כל ההערות של ליד.",
    method: "GET", category: "notes",
    params: [{ name: "lead_id", type: "uuid", required: true, description: "מזהה הליד" }],
    exampleRequest: `GET ${BASE_URL}?action=ListNotes&lead_id=LEAD_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "notes": [\n    {\n      "id": "uuid",\n      "content": "דיברתי עם הלקוח, מעוניין",\n      "is_completed": false\n    }\n  ],\n  "count": 5\n}`,
  },
  {
    id: "create-note", action: "CreateNote", title: "הוספת הערה",
    description: "הוספת הערה חדשה לליד.",
    method: "POST", category: "notes",
    params: [
      { name: "lead_id", type: "uuid", required: true, description: "מזהה הליד" },
      { name: "content", type: "string", required: true, description: "תוכן ההערה" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateNote\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "lead_id": "LEAD_ID",\n  "content": "התקשרתי שוב, ביקש שנחזור מחר"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "note": {\n    "id": "new-uuid",\n    "content": "התקשרתי שוב, ביקש שנחזור מחר",\n    "is_completed": false\n  }\n}`,
  },
  {
    id: "update-note", action: "UpdateNote", title: "עדכון הערה",
    description: "עדכון תוכן הערה או סימון כבוצע.",
    method: "POST", category: "notes",
    params: [
      { name: "note_id", type: "uuid", required: true, description: "מזהה ההערה" },
      { name: "content", type: "string", required: false, description: "תוכן חדש" },
      { name: "is_completed", type: "boolean", required: false, description: "סמן כבוצע" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateNote\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "note_id": "NOTE_ID",\n  "is_completed": true\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "note": { ... }\n}`,
  },
  {
    id: "delete-note", action: "DeleteNote", title: "מחיקת הערה",
    description: "מחיקת הערה.",
    method: "POST", category: "notes",
    params: [{ name: "note_id", type: "uuid", required: true, description: "מזהה ההערה" }],
    exampleRequest: `POST ${BASE_URL}?action=DeleteNote\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "note_id": "NOTE_ID"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "success": true\n}`,
  },

  // ===== TASKS =====
  {
    id: "list-tasks", action: "ListTasks", title: "רשימת משימות",
    description: "קבלת משימות עם סינון לפי ליד או משתמש.",
    method: "GET", category: "tasks",
    params: [
      { name: "lead_id", type: "uuid", required: false, description: "סינון לפי ליד" },
      { name: "user_id", type: "uuid", required: false, description: "סינון לפי משתמש" },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListTasks&lead_id=LEAD_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "tasks": [\n    {\n      "id": "uuid",\n      "description": "להתקשר ללקוח",\n      "due_date": "2025-06-20",\n      "is_completed": false\n    }\n  ],\n  "count": 3\n}`,
  },
  {
    id: "create-task", action: "CreateTask", title: "יצירת משימה",
    description: "יצירת משימה חדשה – ניתן לשייך לליד או למשתמש.",
    method: "POST", category: "tasks",
    params: [
      { name: "description", type: "string", required: true, description: "תיאור המשימה" },
      { name: "lead_id", type: "uuid", required: false, description: "שיוך לליד" },
      { name: "user_id", type: "uuid", required: false, description: "שיוך למשתמש" },
      { name: "due_date", type: "date", required: false, description: "תאריך יעד (YYYY-MM-DD)" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateTask\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "description": "לשלוח הצעת מחיר",\n  "lead_id": "LEAD_ID",\n  "due_date": "2025-06-25"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "task": {\n    "id": "new-uuid",\n    "description": "לשלוח הצעת מחיר",\n    "is_completed": false\n  }\n}`,
  },
  {
    id: "update-task", action: "UpdateTask", title: "עדכון משימה",
    description: "עדכון משימה – תיאור, תאריך יעד, או סימון כבוצע.",
    method: "POST", category: "tasks",
    params: [
      { name: "task_id", type: "uuid", required: true, description: "מזהה המשימה" },
      { name: "description", type: "string", required: false, description: "תיאור" },
      { name: "due_date", type: "date", required: false, description: "תאריך יעד" },
      { name: "is_completed", type: "boolean", required: false, description: "סמן כבוצע" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateTask\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "task_id": "TASK_ID",\n  "is_completed": true\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "task": { ... }\n}`,
  },
  {
    id: "delete-task", action: "DeleteTask", title: "מחיקת משימה",
    description: "מחיקת משימה.",
    method: "POST", category: "tasks",
    params: [{ name: "task_id", type: "uuid", required: true, description: "מזהה המשימה" }],
    exampleRequest: `POST ${BASE_URL}?action=DeleteTask\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "task_id": "TASK_ID"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "success": true\n}`,
  },

  // ===== LANDING PAGE LEADS =====
  {
    id: "list-landing-leads", action: "ListLandingLeads", title: "לידים מדף נחיתה",
    description: "קבלת לידים שהגיעו מדף הנחיתה של אולם.",
    method: "GET", category: "landing-leads",
    params: [
      { name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" },
      { name: "status", type: "string", required: false, description: "סינון לפי סטטוס", options: ["new", "contacted", "converted"] },
    ],
    exampleRequest: `GET ${BASE_URL}?action=ListLandingLeads&venue_id=VENUE_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "leads": [\n    {\n      "id": "uuid",\n      "full_name": "שרה כהן",\n      "phone": "0541234567",\n      "event_date": "2025-08-15",\n      "status": "new"\n    }\n  ],\n  "count": 8\n}`,
  },
  {
    id: "create-landing-lead", action: "CreateLandingLead", title: "הוספת ליד מדף נחיתה",
    description: "הוספת ליד חדש לדף הנחיתה של אולם.",
    method: "POST", category: "landing-leads",
    params: [
      { name: "venue_id", type: "uuid", required: true, description: "מזהה האולם" },
      { name: "full_name", type: "string", required: true, description: "שם מלא" },
      { name: "phone", type: "string", required: false, description: "טלפון" },
      { name: "email", type: "string", required: false, description: "אימייל" },
      { name: "event_date", type: "date", required: false, description: "תאריך אירוע" },
      { name: "notes", type: "string", required: false, description: "הערות" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=CreateLandingLead\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "venue_id": "VENUE_ID",\n  "full_name": "דוד ישראלי",\n  "phone": "0521234567",\n  "event_date": "2025-09-10"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "lead": {\n    "id": "new-uuid",\n    "full_name": "דוד ישראלי",\n    "status": "new"\n  }\n}`,
  },
  {
    id: "update-landing-lead", action: "UpdateLandingLead", title: "עדכון ליד דף נחיתה",
    description: "עדכון סטטוס או פרטי ליד מדף הנחיתה.",
    method: "POST", category: "landing-leads",
    params: [
      { name: "lead_id", type: "uuid", required: true, description: "מזהה הליד" },
      { name: "status", type: "string", required: false, description: "סטטוס חדש" },
      { name: "notes", type: "string", required: false, description: "הערות" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateLandingLead\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "lead_id": "LEAD_ID",\n  "status": "contacted"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "lead": { ... }\n}`,
  },
  {
    id: "delete-landing-lead", action: "DeleteLandingLead", title: "מחיקת ליד דף נחיתה",
    description: "מחיקת ליד מדף הנחיתה.",
    method: "POST", category: "landing-leads",
    params: [{ name: "lead_id", type: "uuid", required: true, description: "מזהה הליד" }],
    exampleRequest: `POST ${BASE_URL}?action=DeleteLandingLead\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "lead_id": "LEAD_ID"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "success": true\n}`,
  },

  // ===== SETTINGS =====
  {
    id: "get-system-settings", action: "GetSystemSettings", title: "הגדרות מערכת",
    description: "קבלת הגדרות המערכת הכלליות.",
    method: "GET", category: "settings",
    params: [],
    exampleRequest: `GET ${BASE_URL}?action=GetSystemSettings\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "settings": {\n    "id": "uuid",\n    "admin_email": "admin@example.com",\n    "logo_url": "https://..."\n  }\n}`,
  },
  {
    id: "update-system-settings", action: "UpdateSystemSettings", title: "עדכון הגדרות מערכת",
    description: "עדכון הגדרות כלליות – אימייל אדמין, לוגו.",
    method: "POST", category: "settings",
    params: [
      { name: "admin_email", type: "string", required: false, description: "אימייל אדמין" },
      { name: "logo_url", type: "string", required: false, description: "URL לוגו" },
    ],
    exampleRequest: `POST ${BASE_URL}?action=UpdateSystemSettings\nX-API-Key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "admin_email": "new-admin@example.com"\n}`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "settings": { ... }\n}`,
  },
  {
    id: "get-required-documents", action: "GetRequiredDocuments", title: "מסמכים נדרשים",
    description: "קבלת רשימת סוגי המסמכים הנדרשים לפי סוג (venue/event).",
    method: "GET", category: "settings",
    params: [{ name: "for_type", type: "string", required: false, description: "סינון לפי סוג", options: ["venue", "event"] }],
    exampleRequest: `GET ${BASE_URL}?action=GetRequiredDocuments&for_type=event\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "documents": [\n    {\n      "id": "uuid",\n      "document_type": "bank_approval",\n      "for_type": "event",\n      "is_required": true\n    }\n  ],\n  "count": 3\n}`,
  },

  // ===== STATS =====
  {
    id: "get-event-stats", action: "GetEventStats", title: "סטטיסטיקות אירוע מלאות",
    description: "קבלת סטטיסטיקות מקיפות על אירוע: אורחים, RSVP, מתנות, סכומים.",
    method: "GET", category: "stats",
    params: [{ name: "event_id", type: "uuid", required: true, description: "מזהה האירוע" }],
    exampleRequest: `GET ${BASE_URL}?action=GetEventStats&event_id=EVENT_ID\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "event": { ... },\n  "stats": {\n    "guests_total": 150,\n    "guests_approved": 95,\n    "guests_approved_total": 280,\n    "guests_declined": 10,\n    "guests_pending": 45,\n    "transactions_count": 42,\n    "transactions_total_amount": 75000\n  }\n}`,
    notes: ["מחזיר תמונה מלאה של האירוע בקריאה אחת – שימושי לדשבורדים."],
  },
  {
    id: "get-system-stats", action: "GetSystemStats", title: "סטטיסטיקות מערכת",
    description: "סיכום כללי של כל המערכת – מספר אירועים, אולמות, משתמשים, לידים וסכום עסקאות.",
    method: "GET", category: "stats",
    params: [],
    exampleRequest: `GET ${BASE_URL}?action=GetSystemStats\nX-API-Key: YOUR_API_KEY`,
    exampleResponse: `{\n  "responseStatus": "OK",\n  "stats": {\n    "events_count": 120,\n    "venues_count": 15,\n    "users_count": 200,\n    "leads_count": 50,\n    "transactions_total_amount": 2500000\n  }\n}`,
    notes: ["שימושי לדשבורד ניהולי כללי."],
  },
];

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <Badge className={cn(
      "font-mono text-[10px] font-bold px-2 py-0.5 rounded",
      method === "GET"
        ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
        : method === "DELETE"
        ? "bg-red-500/15 text-red-600 border-red-500/30"
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
            <div className="px-5 pb-4 space-y-2">
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
            <Badge variant="secondary" className="text-[10px]">v2</Badge>
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
            <h2 className="text-xl font-bold mb-2">GiftKal Public API v2</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              ה-API מאפשר שליטה מלאה על כל המערכת: ניהול אירועים, מוזמנים, אישורי הגעה, מתנות, אולמות, לידים, משתמשים, מסמכים ותמיכה.
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

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">📦 פורמט:</span>
                <span className="text-muted-foreground mr-1">JSON בלבד</span>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">📡 מתודות:</span>
                <span className="text-muted-foreground mr-1">GET | POST</span>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">⚡ סטטוסים:</span>
                <span className="text-muted-foreground mr-1">OK | ERROR</span>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">🔢 סה"כ:</span>
                <span className="text-muted-foreground mr-1">{endpoints.length} endpoints</span>
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
