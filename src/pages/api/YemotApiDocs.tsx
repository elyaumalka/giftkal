import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Phone, Settings, FolderOpen, Shield, MessageSquare, Copy, Check, ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://www.call2all.co.il/ym/api";

type HttpMethod = "GET" | "POST";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

interface ResponseField {
  name: string;
  type: string;
  description: string;
}

interface ErrorCode {
  code: number | string;
  message: string;
  description: string;
}

interface Endpoint {
  id: string;
  command: string;
  title: string;
  description: string;
  method: HttpMethod;
  category: string;
  params: Param[];
  responseFields?: ResponseField[];
  errors?: ErrorCode[];
  exampleRequest?: string;
  exampleResponse?: string;
  notes?: string[];
}

const categories = [
  { id: "auth", label: "התחברות והגדרות", icon: Settings },
  { id: "campaigns", label: "ניהול קמפיינים", icon: Phone },
  { id: "content", label: "מערכת תוכן", icon: FolderOpen },
  { id: "security", label: "אבטחה", icon: Shield },
  { id: "messaging", label: "הודעות ותקשורת", icon: MessageSquare },
];

const endpoints: Endpoint[] = [
  // === AUTH & SETTINGS ===
  {
    id: "login",
    command: "Login",
    title: "התחברות למערכת",
    description: "התחברות למערכת ימות המשיח וקבלת טוקן לביצוע פעולות.",
    method: "GET",
    category: "auth",
    params: [
      { name: "token", type: "string", required: true, description: "מספר מערכת:סיסמה (לדוגמה 0773137770:123456)" },
    ],
    responseFields: [
      { name: "token", type: "string", description: "טוקן לשימוש בפעולות הבאות" },
    ],
    exampleRequest: `${BASE_URL}/Login?token=0773137770:123456`,
    exampleResponse: `{
  "responseStatus": "OK",
  "token": "0773137770:abc123xyz",
  "yemotAPIVersion": 6
}`,
  },
  {
    id: "logout",
    command: "Logout",
    title: "התנתקות מהמערכת",
    description: "התנתקות וביטול הטוקן הפעיל.",
    method: "GET",
    category: "auth",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `${BASE_URL}/Logout?token=\${token}`,
  },
  {
    id: "get-session",
    command: "GetSession",
    title: "פרטי המערכת",
    description: "קבלת מידע כללי על המערכת (יתרת יחידות, מספר המערכת וכו').",
    method: "GET",
    category: "auth",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `${BASE_URL}/GetSession?token=\${token}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "did": "0773137770",
  "units": 10000.5,
  "yemotAPIVersion": 6
}`,
  },
  {
    id: "set-password",
    command: "SetPassword",
    title: "שינוי סיסמת ניהול",
    description: "שינוי הסיסמה של המערכת.",
    method: "POST",
    category: "auth",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "password", type: "string", required: true, description: "הסיסמה החדשה" },
    ],
    exampleRequest: `POST ${BASE_URL}/SetPassword
Content-Type: application/json

{
  "token": "\${token}",
  "password": "newPassword123"
}`,
  },
  {
    id: "set-customer-details",
    command: "SetCustomerDetails",
    title: "עדכון פרטי משתמש",
    description: "עדכון פרטי המשתמש במערכת.",
    method: "POST",
    category: "auth",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `POST ${BASE_URL}/SetCustomerDetails
Content-Type: application/json

{
  "token": "\${token}"
}`,
  },
  {
    id: "get-transactions",
    command: "GetTransactions",
    title: "קבלת רשימת חיובי יחידות",
    description: "קבלת היסטוריית חיובים ותנועות יחידות במערכת.",
    method: "GET",
    category: "auth",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `${BASE_URL}/GetTransactions?token=\${token}`,
  },
  {
    id: "transfer-units",
    command: "TransferUnits",
    title: "העברת יחידות",
    description: "העברת יחידות למערכת אחרת.",
    method: "POST",
    category: "auth",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "destination", type: "string", required: true, description: "מספר מערכת להעברה" },
      { name: "amount", type: "number", required: true, description: "כמות יחידות להעברה" },
    ],
    responseFields: [
      { name: "destination", type: "string", description: "מערכת היעד אליה בוצעה ההעברה" },
      { name: "amount", type: "double", description: "הסכום שהועבר" },
      { name: "newBalance", type: "double", description: "יתרת היחידות לאחר ההעברה" },
    ],
    errors: [
      { code: 111, message: "Bad destination", description: "יעד להעברה לא חוקי" },
      { code: 112, message: "Bad amount", description: "סכום לא חוקי" },
      { code: 113, message: "Not enough balance", description: "יתרה לא מספיקה" },
    ],
    exampleRequest: `POST ${BASE_URL}/TransferUnits
Content-Type: application/json

{
  "token": "\${token}",
  "destination": "0772222770",
  "amount": 100
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "destination": "0772222770",
  "amount": 100.0,
  "newBalance": 9900.5,
  "yemotAPIVersion": 6
}`,
  },
  {
    id: "get-incoming-calls",
    command: "GetIncomingCalls",
    title: "קבלת רשימת שיחות פעילות",
    description: "קבלת רשימת השיחות הפעילות כרגע במערכת.",
    method: "GET",
    category: "auth",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    responseFields: [
      { name: "calls", type: "array", description: "מערך אובייקטי שיחה" },
      { name: "callsCount", type: "int", description: "מספר שיחות פעילות" },
    ],
    exampleRequest: `${BASE_URL}/GetIncomingCalls?token=\${token}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "calls": [
    {
      "did": "0773137770",
      "callerIdNum": "0501234567",
      "duration": 120,
      "path": "1/3",
      "id": "abc123"
    }
  ],
  "callsCount": 1,
  "yemotAPIVersion": 6
}`,
  },

  // === CAMPAIGNS ===
  {
    id: "get-templates",
    command: "GetTemplates",
    title: "קבלת תבניות קמפיינים",
    description: "קבלת מצב כל תבניות הקמפיינים במערכת.",
    method: "GET",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    responseFields: [
      { name: "templates", type: "array", description: "מערך אובייקטי תבנית" },
    ],
    exampleRequest: `${BASE_URL}/GetTemplates?token=\${token}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "templates": [
    {
      "templateId": 1117319,
      "description": "קמפיין ראשי",
      "callerId": "0773137770",
      "entriesCount": 500,
      "yemotContext": "SIMPLE",
      "maxActiveChannels": 100
    }
  ],
  "yemotAPIVersion": 6
}`,
  },
  {
    id: "create-template",
    command: "CreateTemplate",
    title: "יצירת תבנית קמפיין",
    description: "יצירת תבנית קמפיין חדשה. ההגדרות יועתקו מתבנית ברירת המחדל.",
    method: "POST",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "description", type: "string", required: true, description: "שם הקמפיין" },
    ],
    responseFields: [
      { name: "templateId", type: "int", description: "מזהה התבנית החדשה" },
    ],
    exampleRequest: `POST ${BASE_URL}/CreateTemplate
Content-Type: application/json

{
  "token": "\${token}",
  "description": "קמפיין חדש"
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "templateId": 1117320,
  "yemotAPIVersion": 6
}`,
  },
  {
    id: "update-template",
    command: "UpdateTemplate",
    title: "עדכון תבנית קמפיין",
    description: "עדכון הגדרות תבנית קמפיין קיימת.",
    method: "POST",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "templateId", type: "int", required: true, description: "מזהה תבנית" },
      { name: "description", type: "string", required: false, description: "תיאור התבנית" },
      { name: "callerId", type: "string", required: false, description: "זיהוי שיחה יוצאת" },
      { name: "maxActiveChannels", type: "int", required: false, description: "הגבלת קווים מחייגים" },
      { name: "maxDialAttempts", type: "int", required: false, description: "ניסיונות חיוג" },
      { name: "redialWait", type: "double", required: false, description: "המתנה בין ניסיונות (שניות)" },
      { name: "redialPolicy", type: "enum", required: false, description: "מדיניות חיוג חוזר: NONE / CONGESTIONS / FAILED" },
      { name: "yemotContext", type: "enum", required: false, description: "סוג קמפיין: SIMPLE / REPEAT / MESSAGE / VOICEMAIL / BRIDGE" },
      { name: "vmDetect", type: "boolean", required: false, description: "זיהוי תא קולי (1/0)" },
    ],
    exampleRequest: `POST ${BASE_URL}/UpdateTemplate
Content-Type: application/json

{
  "token": "\${token}",
  "templateId": 1117319,
  "description": "קמפיין מעודכן",
  "maxActiveChannels": 50
}`,
  },
  {
    id: "delete-template",
    command: "DeleteTemplate",
    title: "מחיקת תבנית קמפיין",
    description: "מחיקת תבנית קמפיין מהמערכת.",
    method: "POST",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "templateId", type: "int", required: true, description: "מזהה תבנית" },
    ],
    exampleRequest: `POST ${BASE_URL}/DeleteTemplate
Content-Type: application/json

{
  "token": "\${token}",
  "templateId": 1117319
}`,
  },
  {
    id: "run-campaign",
    command: "RunCampaign",
    title: "הפעלת קמפיין",
    description: "הפעלת קמפיין על בסיס תבנית קיימת.",
    method: "POST",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "templateId", type: "int", required: false, description: "מזהה תבנית (ברירת מחדל אם לא צוין)" },
      { name: "callerId", type: "string", required: false, description: "זיהוי יוצא" },
      { name: "phones", type: "string|json", required: false, description: "רשימת טלפונים (מפריד ':' או JSON)" },
      { name: "ttsMode", type: "int", required: false, description: "הודעות TTS אישיות (1=כן)" },
      { name: "withSMS", type: "int", required: false, description: "קמפיין משולב SMS (1=כן)" },
    ],
    responseFields: [
      { name: "campaignId", type: "string", description: "מזהה הקמפיין" },
      { name: "templateId", type: "int", description: "מזהה התבנית" },
      { name: "entriesCount", type: "int", description: "סה\"כ מספרים" },
      { name: "pending", type: "int", description: "ממתינים לחיוג" },
      { name: "blocked", type: "int", description: "חסומים" },
      { name: "estimatedPrice", type: "double", description: "עלות משוערת ביחידות" },
    ],
    errors: [
      { code: 100, message: "Invalid template", description: "תבנית לא חוקית" },
      { code: 101, message: "Campaign not configured", description: "רשימת טלפונים ריקה / אין הודעה" },
      { code: 102, message: "No valid phones", description: "כל המספרים לא תקינים" },
      { code: 103, message: "Not enough units", description: "יתרה לא מספיקה" },
      { code: 104, message: "isKodesh is true", description: "ניסיון בשבת/חג" },
      { code: 120, message: "CallerId unauthorized", description: "מספר זיהוי לא מורשה" },
    ],
    exampleRequest: `POST ${BASE_URL}/RunCampaign
Content-Type: application/json

{
  "token": "\${token}",
  "templateId": 1117319,
  "phones": "0501234567:0521234567"
}`,
    exampleResponse: `{
  "responseStatus": "OK",
  "campaignId": "0773137770-1117319-2025-01-21-15-11-18-347-API",
  "templateId": 1117319,
  "entriesCount": 2,
  "pending": 2,
  "blocked": 0,
  "estimatedPrice": 2.0,
  "yemotAPIVersion": 6
}`,
  },
  {
    id: "get-campaign-status",
    command: "GetCampaignStatus",
    title: "מצב קמפיין",
    description: "בדיקת הסטטוס הנוכחי של קמפיין פעיל.",
    method: "GET",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "campaignId", type: "string", required: true, description: "מזהה הקמפיין" },
      { name: "entries", type: "enum", required: false, description: "סוג רשומות: all / pending / done / failed / ringing / up / bridged", defaultValue: "ללא רשומות" },
      { name: "range", type: "string", required: false, description: "טווח הצגה (min:max), לדוגמה 1:100" },
    ],
    responseFields: [
      { name: "campaignStatus", type: "enum", description: "RUNNING / DONE / PAUSED" },
      { name: "totalEntries", type: "int", description: "סה\"כ מספרים" },
      { name: "totalDialed", type: "int", description: "סה\"כ חויגו" },
      { name: "totalSuccessful", type: "int", description: "הצלחות" },
      { name: "totalFailed", type: "int", description: "כשלונות" },
      { name: "paused", type: "boolean", description: "האם מושהה" },
    ],
    exampleRequest: `${BASE_URL}/GetCampaignStatus?token=\${token}&campaignId=\${campaignId}&entries=all`,
    exampleResponse: `{
  "responseStatus": "OK",
  "campaign": {
    "campaignId": "0773137770-1117319-2025-01-22-10-07-54-414-API",
    "campaignStatus": "RUNNING",
    "totalEntries": 1,
    "totalDialed": 3,
    "totalSuccessful": 1,
    "totalFailed": 2,
    "paused": false,
    "entries": [
      {
        "phone": "0773137770",
        "entryStatus": "up",
        "duration": 3680
      }
    ]
  },
  "yemotAPIVersion": 6
}`,
  },
  {
    id: "get-active-campaigns",
    command: "GetActiveCampaigns",
    title: "קמפיינים פעילים",
    description: "קבלת רשימת כל הקמפיינים הפעילים במערכת.",
    method: "GET",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `${BASE_URL}/GetActiveCampaigns?token=\${token}`,
  },
  {
    id: "campaign-action",
    command: "CampaignAction",
    title: "פעולות בקמפיין פעיל",
    description: "ביצוע פעולות על קמפיין פעיל (השהייה, המשך, ביטול).",
    method: "POST",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "campaignId", type: "string", required: true, description: "מזהה הקמפיין" },
      { name: "action", type: "enum", required: true, description: "pause / resume / stop" },
    ],
    exampleRequest: `POST ${BASE_URL}/CampaignAction
Content-Type: application/json

{
  "token": "\${token}",
  "campaignId": "\${campaignId}",
  "action": "pause"
}`,
  },
  {
    id: "get-template-entries",
    command: "GetTemplateEntries",
    title: "רשימת תפוצה",
    description: "הצגת המספרים שברשימת התפוצה של תבנית.",
    method: "GET",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "templateId", type: "int", required: true, description: "מזהה תבנית" },
    ],
    responseFields: [
      { name: "templateId", type: "int", description: "מזהה תבנית" },
      { name: "entries", type: "array", description: "מערך אובייקטים עם phone, name, moreinfo, blocked" },
    ],
    exampleRequest: `${BASE_URL}/GetTemplateEntries?token=\${token}&templateId=1117319`,
  },
  {
    id: "update-template-entry",
    command: "UpdateTemplateEntry",
    title: "עדכון מספר בתפוצה",
    description: "עדכון מספר בודד ברשימת התפוצה.",
    method: "POST",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "templateId", type: "int", required: true, description: "מזהה תבנית" },
      { name: "phone", type: "string", required: true, description: "מספר טלפון" },
      { name: "name", type: "string", required: false, description: "שם" },
      { name: "moreinfo", type: "string", required: false, description: "מידע נוסף" },
      { name: "blocked", type: "int", required: false, description: "חסום (1) / פעיל (0)" },
    ],
    exampleRequest: `POST ${BASE_URL}/UpdateTemplateEntry
Content-Type: application/json

{
  "token": "\${token}",
  "templateId": 1117319,
  "phone": "0501234567",
  "name": "ישראל ישראלי"
}`,
  },
  {
    id: "upload-phone-list",
    command: "UploadPhoneList",
    title: "העלאת רשימת טלפונים",
    description: "העלאת קובץ טקסט והפיכתו לרשימת טלפונים לתבנית קמפיין.",
    method: "POST",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "templateId", type: "int", required: true, description: "מזהה תבנית" },
      { name: "data", type: "string", required: true, description: "תוכן קובץ רשימת הטלפונים" },
      { name: "delimiter", type: "string", required: false, description: "מפריד בין עמודות (ברירת מחדל: פסיק)", defaultValue: "," },
      { name: "updateType", type: "enum", required: false, description: "UPDATE / NEW / REMOVE", defaultValue: "UPDATE" },
    ],
    responseFields: [
      { name: "totalParsed", type: "int", description: "סה\"כ מספרים שנותחו" },
      { name: "totalInserted", type: "int", description: "מספרים שנוספו" },
      { name: "totalUpdated", type: "int", description: "מספרים שעודכנו" },
      { name: "totalRemoved", type: "int", description: "מספרים שהוסרו" },
    ],
    exampleRequest: `POST ${BASE_URL}/UploadPhoneList
Content-Type: application/json

{
  "token": "\${token}",
  "templateId": 1117319,
  "data": "0501234567,ישראל,מידע\\n0521234567,משה,מידע2"
}`,
  },
  {
    id: "schedule-campaign",
    command: "ScheduleCampaign",
    title: "קמפיין מתוזמן",
    description: "יצירת קמפיין מתוזמן להפעלה בזמן מוגדר.",
    method: "POST",
    category: "campaigns",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "templateId", type: "int", required: true, description: "מזהה תבנית" },
    ],
    exampleRequest: `POST ${BASE_URL}/ScheduleCampaign
Content-Type: application/json

{
  "token": "\${token}",
  "templateId": 1117319
}`,
  },

  // === CONTENT ===
  {
    id: "upload-file",
    command: "UploadFile",
    title: "העלאת קובץ",
    description: "העלאת קובץ למערכת (שמע, טקסט וכו'). יש לפנות ב-POST בפורמט multipart/form-data.",
    method: "POST",
    category: "content",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "path", type: "string", required: true, description: "נתיב להעלאה (לדוגמה: ivr2:5/000.wav)" },
      { name: "convertAudio", type: "int", required: false, description: "המרה ל-WAV טלפוני (1/0)", defaultValue: "0" },
      { name: "autoNumbering", type: "boolean", required: false, description: "מספור אוטומטי לקבצי שמע" },
    ],
    responseFields: [
      { name: "path", type: "string", description: "נתיב הקובץ שהועלה" },
      { name: "size", type: "long", description: "גודל בבייטים" },
      { name: "convertedSize", type: "long", description: "גודל WAV לאחר המרה" },
      { name: "duration", type: "double", description: "משך אודיו בשניות" },
    ],
    errors: [
      { code: 107, message: "File upload expected", description: "לא נמצא קובץ" },
      { code: 108, message: "Single upload only", description: "הועלה יותר מקובץ אחד" },
      { code: 109, message: "Path required", description: "דרוש נתיב" },
      { code: 110, message: "Invalid path", description: "נתיב לא חוקי" },
    ],
    notes: ["מגבלת גודל: 50MB. קבצים גדולים יותר יש לפצל לחלקים."],
    exampleRequest: `POST ${BASE_URL}/UploadFile
Content-Type: multipart/form-data

token=\${token}
path=ivr2:1/000.wav
convertAudio=1
file=@recording.mp3`,
  },
  {
    id: "download-file",
    command: "DownloadFile",
    title: "הורדת קובץ",
    description: "הורדת קובץ מהמערכת. התגובה היא binary (לא JSON).",
    method: "GET",
    category: "content",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "path", type: "string", required: true, description: "נתיב הקובץ" },
    ],
    notes: ["התגובה מחזירה את הקובץ עצמו. אם לא קיים → HTTP 404."],
    exampleRequest: `${BASE_URL}/DownloadFile?token=\${token}&path=ivr2:/1/1/000.wav`,
  },
  {
    id: "get-ivr2-dir",
    command: "GetIVR2Dir",
    title: "מידע על שלוחה",
    description: "קבלת מידע מלא על שלוחה במערכת.",
    method: "GET",
    category: "content",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "path", type: "string", required: true, description: "נתיב השלוחה" },
    ],
    exampleRequest: `${BASE_URL}/GetIVR2Dir?token=\${token}&path=1`,
  },
  {
    id: "file-action",
    command: "FileAction",
    title: "ניהול קבצים",
    description: "ביצוע פעולות על קבצים: שינוי שם, העתקה, העברה ומחיקה.",
    method: "POST",
    category: "content",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "action", type: "enum", required: true, description: "rename / copy / move / delete" },
      { name: "what", type: "string", required: true, description: "נתיב קובץ מקור" },
      { name: "target", type: "string", required: false, description: "נתיב יעד (לא נדרש ב-delete)" },
    ],
    exampleRequest: `POST ${BASE_URL}/FileAction
Content-Type: application/json

{
  "token": "\${token}",
  "action": "copy",
  "what": "ivr2:1/000.wav",
  "target": "ivr2:2/000.wav"
}`,
  },
  {
    id: "get-text-file",
    command: "GetTextFile",
    title: "קבלת תוכן קובץ טקסט",
    description: "קבלת תוכן של קובץ טקסט מהמערכת.",
    method: "GET",
    category: "content",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "path", type: "string", required: true, description: "נתיב הקובץ" },
    ],
    exampleRequest: `${BASE_URL}/GetTextFile?token=\${token}&path=ivr2:1/000.tts`,
  },
  {
    id: "upload-text-file",
    command: "UploadTextFile",
    title: "העלאת טקסט לקובץ",
    description: "העלאת תוכן טקסט לקובץ במערכת.",
    method: "POST",
    category: "content",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "path", type: "string", required: true, description: "נתיב הקובץ" },
      { name: "data", type: "string", required: true, description: "תוכן הטקסט" },
    ],
    exampleRequest: `POST ${BASE_URL}/UploadTextFile
Content-Type: application/json

{
  "token": "\${token}",
  "path": "ivr2:1/000.tts",
  "data": "שלום וברוכים הבאים"
}`,
  },
  {
    id: "update-extension",
    command: "UpdateExtension",
    title: "עדכון סוג שלוחה",
    description: "עדכון סוג השלוחה במערכת התוכן.",
    method: "POST",
    category: "content",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "path", type: "string", required: true, description: "נתיב השלוחה" },
    ],
    exampleRequest: `POST ${BASE_URL}/UpdateExtension
Content-Type: application/json

{
  "token": "\${token}",
  "path": "1"
}`,
  },
  {
    id: "call-action",
    command: "CallAction",
    title: "הכוונת שיחה",
    description: "העברת מאזין, ניתוק שיחה, וניהול חדרי ועידה.",
    method: "POST",
    category: "content",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "callId", type: "string", required: true, description: "מזהה השיחה" },
      { name: "action", type: "string", required: true, description: "סוג הפעולה" },
    ],
    exampleRequest: `POST ${BASE_URL}/CallAction
Content-Type: application/json

{
  "token": "\${token}",
  "callId": "abc123",
  "action": "hangup"
}`,
  },
  {
    id: "check-file-exists",
    command: "CheckIfFileExists",
    title: "בדיקת קיום קובץ",
    description: "בדיקה האם קובץ קיים במערכת.",
    method: "GET",
    category: "content",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "path", type: "string", required: true, description: "נתיב הקובץ" },
    ],
    exampleRequest: `${BASE_URL}/CheckIfFileExists?token=\${token}&path=ivr2:1/000.wav`,
  },

  // === SECURITY ===
  {
    id: "validation-token",
    command: "ValidationToken",
    title: "אימות טוקן",
    description: "אימות טוקן לוודא שהוא תקף.",
    method: "GET",
    category: "security",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `${BASE_URL}/ValidationToken?token=\${token}`,
  },
  {
    id: "double-auth",
    command: "DoubleAuth",
    title: "אימות דו-שלבי",
    description: "ביצוע אימות דו-שלבי למערכת.",
    method: "POST",
    category: "security",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `POST ${BASE_URL}/DoubleAuth
Content-Type: application/json

{
  "token": "\${token}"
}`,
  },
  {
    id: "get-login-log",
    command: "GetLoginLog",
    title: "לוג התחברויות",
    description: "צפייה בלוג ההתחברויות למערכת.",
    method: "GET",
    category: "security",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `${BASE_URL}/GetLoginLog?token=\${token}`,
  },
  {
    id: "get-all-sessions",
    command: "GetAllSessions",
    title: "קבלת כל הסשנים",
    description: "קבלת רשימת כל הסשנים הפעילים.",
    method: "GET",
    category: "security",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `${BASE_URL}/GetAllSessions?token=\${token}`,
  },
  {
    id: "kill-session",
    command: "KillSession",
    title: "ניתוק סשן",
    description: "ניתוק סשן ספציפי.",
    method: "POST",
    category: "security",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "sessionId", type: "string", required: true, description: "מזהה הסשן" },
    ],
    exampleRequest: `POST ${BASE_URL}/KillSession
Content-Type: application/json

{
  "token": "\${token}",
  "sessionId": "session123"
}`,
  },
  {
    id: "kill-all-sessions",
    command: "KillAllSessions",
    title: "ניתוק כל הסשנים",
    description: "ניתוק כל הסשנים הפעילים במערכת.",
    method: "POST",
    category: "security",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `POST ${BASE_URL}/KillAllSessions
Content-Type: application/json

{
  "token": "\${token}"
}`,
  },

  // === MESSAGING ===
  {
    id: "send-sms",
    command: "SendSms",
    title: "שליחת SMS",
    description: "שליחת הודעת SMS מהמערכת.",
    method: "POST",
    category: "messaging",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "phones", type: "string", required: true, description: "מספרי טלפון (מפריד ':')" },
      { name: "message", type: "string", required: true, description: "תוכן ההודעה" },
    ],
    exampleRequest: `POST ${BASE_URL}/SendSms
Content-Type: application/json

{
  "token": "\${token}",
  "phones": "0501234567:0521234567",
  "message": "שלום, זוהי הודעת בדיקה"
}`,
  },
  {
    id: "send-fax",
    command: "SendFax",
    title: "שליחת פקס",
    description: "שליחת פקס מהמערכת.",
    method: "POST",
    category: "messaging",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "phone", type: "string", required: true, description: "מספר פקס" },
    ],
    exampleRequest: `POST ${BASE_URL}/SendFax
Content-Type: application/json

{
  "token": "\${token}",
  "phone": "031234567"
}`,
  },
  {
    id: "create-bridge-call",
    command: "CreateBridgeCall",
    title: "שיחת גישור",
    description: "הקמת שיחת גישור בין שני מספרים.",
    method: "POST",
    category: "messaging",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "from", type: "string", required: true, description: "מספר מקור" },
      { name: "to", type: "string", required: true, description: "מספר יעד" },
    ],
    exampleRequest: `POST ${BASE_URL}/CreateBridgeCall
Content-Type: application/json

{
  "token": "\${token}",
  "from": "0501234567",
  "to": "0521234567"
}`,
  },
  {
    id: "run-tzintuk",
    command: "RunTzintuk",
    title: "הפעלת צינתוק",
    description: "הפעלת צינתוק (שיחה קצרה לצלצול בלבד).",
    method: "POST",
    category: "messaging",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
      { name: "phones", type: "string", required: true, description: "מספרי טלפון" },
    ],
    exampleRequest: `POST ${BASE_URL}/RunTzintuk
Content-Type: application/json

{
  "token": "\${token}",
  "phones": "0501234567"
}`,
  },
  {
    id: "get-queue-realtime",
    command: "GetQueueRealTime",
    title: "מידע תור בזמן אמת",
    description: "קבלת מידע בזמן אמת על שלוחת תור.",
    method: "GET",
    category: "messaging",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `${BASE_URL}/GetQueueRealTime?token=\${token}`,
  },
  {
    id: "get-sms-out-log",
    command: "GetSmsOutLog",
    title: "לוג SMS יוצאים",
    description: "קבלת לוג הודעות SMS יוצאות.",
    method: "GET",
    category: "messaging",
    params: [
      { name: "token", type: "string", required: true, description: "טוקן" },
    ],
    exampleRequest: `${BASE_URL}/GetSmsOutLog?token=\${token}`,
  },
];

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <Badge
      className={cn(
        "font-mono text-[10px] font-bold px-2 py-0.5 rounded",
        method === "GET"
          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
          : "bg-blue-500/15 text-blue-600 border-blue-500/30"
      )}
    >
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
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 hover:bg-muted/30 transition-colors text-right"
      >
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono font-semibold text-foreground">{endpoint.command}</code>
        <span className="text-sm text-muted-foreground mr-auto">{endpoint.title}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Description */}
          <div className="p-5 pb-3">
            <p className="text-sm text-muted-foreground leading-relaxed">{endpoint.description}</p>
          </div>

          {/* URL */}
          <div className="px-5 pb-4">
            <div className="bg-muted/50 rounded-lg px-4 py-2.5 font-mono text-xs flex items-center gap-2 overflow-x-auto">
              <MethodBadge method={endpoint.method} />
              <span className="text-muted-foreground">{BASE_URL}/{endpoint.command}</span>
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
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Response Fields */}
          {endpoint.responseFields && (
            <div className="px-5 pb-4">
              <h4 className="text-sm font-semibold mb-3 text-foreground">שדות תגובה</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">שם</th>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">סוג</th>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">תיאור</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {endpoint.responseFields.map((f) => (
                      <tr key={f.name} className="hover:bg-muted/20">
                        <td className="py-2.5 px-4 font-mono text-xs">{f.name}</td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">{f.type}</td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">{f.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors */}
          {endpoint.errors && endpoint.errors.length > 0 && (
            <div className="px-5 pb-4">
              <h4 className="text-sm font-semibold mb-3 text-destructive">שגיאות אפשריות</h4>
              <div className="border border-destructive/20 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-destructive/5">
                    <tr>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">קוד</th>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">הודעה</th>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">הסבר</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-destructive/10">
                    {endpoint.errors.map((e) => (
                      <tr key={e.code}>
                        <td className="py-2.5 px-4 font-mono text-xs text-destructive">{e.code}</td>
                        <td className="py-2.5 px-4 text-xs">{e.message}</td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">{e.description}</td>
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

export default function YemotApiDocs() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesCategory = !activeCategory || ep.category === activeCategory;
      const matchesSearch =
        !search ||
        ep.command.toLowerCase().includes(search.toLowerCase()) ||
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
            <h1 className="text-lg font-bold">📞 Yemot HaMashiach API</h1>
            <Badge variant="secondary" className="text-[10px]">v6</Badge>
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
              {/* All */}
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
                    <span className="truncate">{ep.command}</span>
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
            <h2 className="text-xl font-bold mb-2">מדריך API – ימות המשיח</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              ה-API מאפשר לתקשר עם מערכות הטלפוניה של ימות המשיח ולנהל אותן באופן אוטומטי. כל הבקשות נשלחות לכתובת:
            </p>
            <div className="bg-[#1e1e2e] rounded-lg px-4 py-3 font-mono text-sm text-emerald-400 relative" dir="ltr">
              <CopyButton text={BASE_URL} />
              {BASE_URL}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">🔐 אימות:</span>
                <span className="text-muted-foreground mr-1">כל בקשה דורשת <code className="bg-muted px-1 rounded">token</code> (מספר_מערכת:סיסמה)</span>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">📦 פורמט:</span>
                <span className="text-muted-foreground mr-1">תגובות ב-JSON (פרט להורדת קבצים)</span>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">📡 מתודות:</span>
                <span className="text-muted-foreground mr-1">GET ו-POST (POST עם Content-Type: application/json)</span>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <span className="font-semibold text-foreground">⚡ סטטוסים:</span>
                <span className="text-muted-foreground mr-1">OK, ERROR, FORBIDDEN, EXCEPTION</span>
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
