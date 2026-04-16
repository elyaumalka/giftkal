import React, { forwardRef } from "react";

export interface InvitationData {
  eventType?: string;
  groomName: string;
  brideName: string;
  childName?: string;
  familyName?: string;
  groomParents: string;
  brideParents: string;
  groomGrandparents: string;
  brideGrandparents: string;
  receptionTime?: string;
  ceremonyTime?: string;
  eventDate?: string;
  eventDateRaw?: string;
  venueName?: string;
  venueLocation?: string;
  introText: string;
  notes?: string;
}

interface TemplateProps {
  data: InvitationData;
}

// ====== Background image paths ======
const BG = {
  floralWreath: "/invitations/bg-floral-wreath.jpg",
  wildflower: "/invitations/bg-wildflower.jpg",
  classicBlue: "/invitations/bg-classic-blue.jpg",
  goldMinimal: "/invitations/bg-gold-minimal.jpg",
  goldMarble: "/invitations/bg-gold-marble.jpg",
  navyGold: "/invitations/bg-navy-gold.jpg",
  whiteGoldLines: "/invitations/bg-white-gold-lines.jpg",
  dustyRose: "/invitations/bg-dusty-rose.jpg",
};

// ====== Reusable base wrapper ======
const InvBg = forwardRef<HTMLDivElement, { bg: string; children: React.ReactNode; className?: string }>(
  ({ bg, children, className = "" }, ref) => (
    <div
      ref={ref}
      className={`w-[400px] h-[560px] relative overflow-hidden ${className}`}
      style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {children}
    </div>
  )
);
InvBg.displayName = "InvBg";

// ====== Hebrew date helper ======
const toHebrewDate = (rawDate?: string): string => {
  if (!rawDate) return "";
  try {
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric" }).format(date);
  } catch {
    return "";
  }
};

// ====== Helpers ======
const Names = ({ g, b, color, size = "3xl", sep = "&", sepColor }: { g: string; b: string; color: string; size?: string; sep?: string; sepColor?: string }) => (
  <>
    <div className={`text-${size} font-bold`} style={{ color }}>{g || "החתן"}</div>
    <div className="text-xl my-1" style={{ color: sepColor || color }}>{sep}</div>
    <div className={`text-${size} font-bold`} style={{ color }}>{b || "הכלה"}</div>
  </>
);

// Parents positioned at bottom: groom-right, bride-left
const Parents = ({ data, color }: { data: InvitationData; color: string }) => (
  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end" dir="rtl">
    {data.groomParents ? (
      <div className="text-center" style={{ color }}>
        <p className="text-[10px] font-bold mb-0.5">הורי החתן</p>
        <p className="text-[10px]">{data.groomParents}</p>
      </div>
    ) : <div />}
    {data.brideParents ? (
      <div className="text-center" style={{ color }}>
        <p className="text-[10px] font-bold mb-0.5">הורי הכלה</p>
        <p className="text-[10px]">{data.brideParents}</p>
      </div>
    ) : <div />}
  </div>
);

const Grandparents = ({ data, color }: { data: InvitationData; color: string }) =>
  (data.groomGrandparents || data.brideGrandparents) ? (
    <div className="text-[10px] space-y-0.5 mt-1" style={{ color }}>
      {data.groomGrandparents && <p>סבי החתן: {data.groomGrandparents}</p>}
      {data.brideGrandparents && <p>סבי הכלה: {data.brideGrandparents}</p>}
    </div>
  ) : null;

// Info block: venue, location, times, dates
const InfoBlock = ({ data, color, bg, rounded = false }: { data: InvitationData; color: string; bg?: string; rounded?: boolean }) => {
  const hebrewDate = toHebrewDate(data.eventDateRaw);
  return (
    <div className={`mt-3 px-5 py-2 ${rounded ? "rounded-xl" : ""}`} style={{ backgroundColor: bg, color }}>
      <p className="text-sm font-semibold">{data.eventDate || "תאריך האירוע"}</p>
      {hebrewDate && <p className="text-[10px] mt-0.5 opacity-80">{hebrewDate}</p>}
      {data.receptionTime && <p className="text-xs mt-0.5 opacity-90">קבלת פנים: {data.receptionTime}</p>}
      {data.ceremonyTime && <p className="text-xs mt-0.5 opacity-90">חופה: {data.ceremonyTime}</p>}
      {data.venueName && <p className="text-xs mt-1 font-medium opacity-90">{data.venueName}</p>}
      {data.venueLocation && <p className="text-[10px] mt-0.5 opacity-70">{data.venueLocation}</p>}
    </div>
  );
};

const DB = ({ data, bg, color, rounded }: { data: InvitationData; bg?: string; color: string; rounded?: boolean }) => (
  <InfoBlock data={data} bg={bg} color={color} rounded={rounded} />
);

const Overlay = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute inset-0 flex flex-col items-center justify-center text-center p-10 ${className}`} dir="rtl">
    {children}
  </div>
);

// ============================================================
// 8 TEMPLATES — professional invitation styles
// ============================================================

// --- 1: Floral Wreath — romantic roses ---
export const Template1 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.floralWreath}>
    <Overlay>
      <p className="text-sm mb-1" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-2 max-w-[220px]" style={{ color: "#6A5A4A" }}>{data.introText || "בשמחה רבה אנו מזמינים אתכם לחגוג עמנו"}</p>
      <Names g={data.groomName} b={data.brideName} color="#4A3A3A" size="3xl" sep="&" sepColor="#C4A35A" />
      <DB data={data} bg="rgba(196,163,90,0.85)" color="#fff" rounded />
      <Parents data={data} color="#5A4A3A" />
    </Overlay>
  </InvBg>
));

// --- 2: Wildflower — botanical pressed flowers ---
export const Template2 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.wildflower}>
    <Overlay className="justify-start pt-10">
      <p className="text-xs mb-1" style={{ color: "#8A7A6A" }}>בס"ד</p>
      <p className="text-xs mb-3 max-w-[260px]" style={{ color: "#5A5A5A" }}>{data.introText || "בשבח והודיה לה׳ יתברך\nשמחים להזמינכם לחגוג עמנו"}</p>
      <Names g={data.groomName} b={data.brideName} color="#2A2A2A" size="4xl" sep="&" sepColor="#8A7A6A" />
      <div className="w-12 h-px my-2" style={{ backgroundColor: "#C4A35A" }} />
      <DB data={data} bg="transparent" color="#3A3A3A" />
      <Parents data={data} color="#5A5A5A" />
    </Overlay>
  </InvBg>
));

// --- 3: Classic Blue — traditional ornamental ---
export const Template3 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.classicBlue}>
    <Overlay>
      <p className="text-sm mb-1" style={{ color: "#4A5A8A" }}>בס"ד</p>
      <p className="text-xs mb-3 max-w-[220px]" style={{ color: "#4A5A8A" }}>{data.introText || "בסימן טוב ובמזל טוב הננו מתכבדים להזמינכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#2A3A6A" size="4xl" sep="&" sepColor="#7A8ABA" />
      <DB data={data} bg="#4A5A8A" color="#fff" rounded />
      <Parents data={data} color="#4A5A8A" />
    </Overlay>
  </InvBg>
));

// --- 4: Gold Geometric — modern luxury ---
export const Template4 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.goldMinimal}>
    <Overlay>
      <p className="text-xs tracking-[0.5em] mb-2" style={{ color: "#B8942A" }}>בס"ד</p>
      <p className="text-xs mb-3 max-w-[220px]" style={{ color: "#5A5A5A" }}>{data.introText || "הננו שמחים להזמינכם לחגוג עמנו"}</p>
      <Names g={data.groomName} b={data.brideName} color="#2A2A1A" size="4xl" sep="✦" sepColor="#C4A35A" />
      <Grandparents data={data} color="#7A7A7A" />
      <DB data={data} bg="#C4A35A" color="#fff" rounded />
      <Parents data={data} color="#5A5A5A" />
    </Overlay>
  </InvBg>
));

// --- 5: Gold Marble — classic elegance ---
export const Template5 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.goldMarble}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-4" style={{ color: "#4A4A4A" }}>{data.introText || "בסימן טוב ובמזל טוב הננו מתכבדים להזמינכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#2A2A1A" size="4xl" sep="❖" sepColor="#C4A35A" />
      <Parents data={data} color="#4A4A4A" />
      <Grandparents data={data} color="#6A6A6A" />
      <DB data={data} bg="#C4A35A" color="#fff" />
    </Overlay>
  </InvBg>
));

// --- 6: Navy Gold — royal premium ---
export const Template6 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.navyGold}>
    <Overlay>
      <p className="text-sm mb-3" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-4" style={{ color: "#8AABDA" }}>{data.introText || "בשמחה רבה אנו מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="4xl" sep="❖" sepColor="#8AABDA" />
      <Parents data={data} color="#8AABDA" />
      <Grandparents data={data} color="#6A8BAA" />
      <DB data={data} bg="transparent" color="#C4A35A" />
    </Overlay>
  </InvBg>
));

// --- 7: White Gold Lines — elegant minimal ---
export const Template7 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.whiteGoldLines}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-4" style={{ color: "#5A5A5A" }}>{data.introText || "בשמחה רבה אנו מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#2A2A2A" size="4xl" sep="✦" sepColor="#C4A35A" />
      <Parents data={data} color="#5A5A5A" />
      <Grandparents data={data} color="#8A8A8A" />
      <DB data={data} bg="#C4A35A" color="#fff" />
    </Overlay>
  </InvBg>
));

// --- 8: Dusty Rose — soft romantic ---
export const Template8 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.dustyRose}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#5A4A3A" }}>{data.introText || "בשמחה ובברכה מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#4A2A3A" size="4xl" sep="♥" sepColor="#C08090" />
      <Parents data={data} color="#5A4A3A" />
      <Grandparents data={data} color="#7A6A5A" />
      <DB data={data} bg="#6A4A5A" color="#F8E8F0" rounded />
    </Overlay>
  </InvBg>
));

// Backwards compatibility
export const ClassicTemplate = Template5;
export const ModernTemplate = Template2;
export const RomanticTemplate = Template1;
export const ElegantTemplate = Template4;

export const templates = [
  { id: 1, name: "זר ורדים רומנטי", Component: Template1 },
  { id: 2, name: "פרחי בר מודרני", Component: Template2 },
  { id: 3, name: "כחול קלאסי מסורתי", Component: Template3 },
  { id: 4, name: "זהב גיאומטרי", Component: Template4 },
  { id: 5, name: "שיש וזהב אלגנטי", Component: Template5 },
  { id: 6, name: "כחול-זהב מלכותי", Component: Template6 },
  { id: 7, name: "לבן קווי זהב", Component: Template7 },
  { id: 8, name: "ורוד מאובק רומנטי", Component: Template8 },
];
