import React, { forwardRef } from "react";

interface InvitationData {
  groomName: string;
  brideName: string;
  groomParents: string;
  brideParents: string;
  groomGrandparents: string;
  brideGrandparents: string;
  eventDate?: string;
  venueName?: string;
  introText: string;
}

interface TemplateProps {
  data: InvitationData;
}

// ====== Background image paths ======
const BG = {
  floralPink: "/invitations/bg-floral-pink.jpg",
  goldMarble: "/invitations/bg-gold-marble.jpg",
  burgundy: "/invitations/bg-burgundy-floral.jpg",
  navyGold: "/invitations/bg-navy-gold.jpg",
  boho: "/invitations/bg-boho-rustic.jpg",
  artDeco: "/invitations/bg-artdeco-black.jpg",
  pastelWater: "/invitations/bg-pastel-watercolor.jpg",
  whiteGoldLines: "/invitations/bg-white-gold-lines.jpg",
  dustyRose: "/invitations/bg-dusty-rose.jpg",
  tropical: "/invitations/bg-tropical.jpg",
  greenery: "/invitations/bg-greenery.jpg",
  terracotta: "/invitations/bg-terracotta.jpg",
  vintage: "/invitations/bg-vintage.jpg",
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

// ====== Helpers ======
const Names = ({ g, b, color, size = "3xl", sep = "&", sepColor }: { g: string; b: string; color: string; size?: string; sep?: string; sepColor?: string }) => (
  <>
    <div className={`text-${size} font-bold`} style={{ color }}>{g || "החתן"}</div>
    <div className="text-xl my-1" style={{ color: sepColor || color }}>{sep}</div>
    <div className={`text-${size} font-bold`} style={{ color }}>{b || "הכלה"}</div>
  </>
);

const Parents = ({ data, color }: { data: InvitationData; color: string }) => (
  <div className="text-xs space-y-0.5 mt-2" style={{ color }}>
    {data.groomParents && <p>הורי החתן: {data.groomParents}</p>}
    {data.brideParents && <p>הורי הכלה: {data.brideParents}</p>}
  </div>
);

const Grandparents = ({ data, color }: { data: InvitationData; color: string }) =>
  (data.groomGrandparents || data.brideGrandparents) ? (
    <div className="text-[10px] space-y-0.5 mt-1" style={{ color }}>
      {data.groomGrandparents && <p>סבי החתן: {data.groomGrandparents}</p>}
      {data.brideGrandparents && <p>סבי הכלה: {data.brideGrandparents}</p>}
    </div>
  ) : null;

const DateBlock = ({ date, venue, bg, color, rounded = false }: { date?: string; venue?: string; bg?: string; color: string; rounded?: boolean }) => (
  <div className={`mt-4 px-6 py-2 ${rounded ? "rounded-full" : ""}`} style={{ backgroundColor: bg, color }}>
    <p className="text-base font-semibold">{date || "תאריך האירוע"}</p>
    {venue && <p className="text-xs mt-0.5 opacity-80">{venue}</p>}
  </div>
);

// ====== TEXT OVERLAY - central positioning ======
const Overlay = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute inset-0 flex flex-col items-center justify-center text-center p-10 ${className}`} dir="rtl">
    {children}
  </div>
);

// ============================================================
// 40 TEMPLATES — using visual backgrounds
// ============================================================

// --- GROUP 1: Floral Pink ---
export const Template1 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.floralPink}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#5A4A3A" }}>{data.introText || "בשמחה רבה אנו מזמינים אתכם לחתונתנו"}</p>
      <Names g={data.groomName} b={data.brideName} color="#8B4B5B" sepColor="#C4A35A" />
      <div className="w-16 h-px my-3" style={{ backgroundColor: "#C4A35A" }} />
      <Parents data={data} color="#5A4A3A" />
      <Grandparents data={data} color="#7A6A5A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#8B4B5B" color="#fff" rounded />
    </Overlay>
  </InvBg>
));

export const Template2 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.floralPink}>
    <Overlay>
      <p className="text-xs mb-4 tracking-widest" style={{ color: "#B08080" }}>♡ הזמנה לחתונה ♡</p>
      <p className="text-xs mb-3 italic" style={{ color: "#6A4A4A" }}>{data.introText || "בשמחה ובהתרגשות"}</p>
      <Names g={data.groomName} b={data.brideName} color="#4A2A3A" size="4xl" sep="♥" sepColor="#D4A0B0" />
      <Parents data={data} color="#6A4A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="rgba(196,163,90,0.9)" color="#fff" />
    </Overlay>
  </InvBg>
));

// --- GROUP 2: Gold Marble ---
export const Template3 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.goldMarble}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-4" style={{ color: "#4A4A4A" }}>{data.introText || "בסימן טוב ובמזל טוב הננו מתכבדים להזמינכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#2A2A1A" size="4xl" sep="❖" sepColor="#C4A35A" />
      <Parents data={data} color="#4A4A4A" />
      <Grandparents data={data} color="#6A6A6A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#fff" />
    </Overlay>
  </InvBg>
));

export const Template4 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.goldMarble}>
    <Overlay>
      <p className="text-xs tracking-[0.5em] mb-4" style={{ color: "#B8942A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#5A5A5A" }}>{data.introText || "הננו שמחים להזמינכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="4xl" sep="עב״ג" sepColor="#8A7A5A" />
      <Parents data={data} color="#5A5A5A" />
      <Grandparents data={data} color="#7A7A7A" />
      <div className="mt-4 border-2 px-8 py-2" style={{ borderColor: "#C4A35A" }}>
        <p className="text-base font-bold" style={{ color: "#2A2A1A" }}>{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-xs mt-0.5" style={{ color: "#5A5A5A" }}>{data.venueName}</p>}
      </div>
    </Overlay>
  </InvBg>
));

// --- GROUP 3: Burgundy Floral ---
export const Template5 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.burgundy}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#5A3A3A" }}>{data.introText || "בשמחה רבה אנו מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#4A1A2A" size="4xl" sepColor="#C4A35A" />
      <Parents data={data} color="#5A3A3A" />
      <Grandparents data={data} color="#7A5A5A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#4A1A2A" color="#E8D4D4" rounded />
    </Overlay>
  </InvBg>
));

export const Template6 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.burgundy}>
    <Overlay>
      <p className="text-xs italic mb-3" style={{ color: "#8B5A5A" }}>הזמנה לחתונה</p>
      <Names g={data.groomName} b={data.brideName} color="#3A0A1A" size="3xl" sep="✦" sepColor="#C4A35A" />
      <p className="text-xs mt-3 max-w-[240px]" style={{ color: "#6A4A4A" }}>{data.introText || "מתכבדים להזמינכם"}</p>
      <Parents data={data} color="#6A4A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#fff" />
    </Overlay>
  </InvBg>
));

// --- GROUP 4: Navy Gold ---
export const Template7 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.navyGold}>
    <Overlay>
      <p className="text-sm mb-3" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-4" style={{ color: "#8AABDA" }}>{data.introText || "בשמחה רבה מתכבדים להזמינכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="4xl" sep="❖" sepColor="#8AABDA" />
      <Parents data={data} color="#8AABDA" />
      <Grandparents data={data} color="#6A8BAA" />
      <div className="mt-4 border px-8 py-2" style={{ borderColor: "#C4A35A" }}>
        <p className="text-base" style={{ color: "#C4A35A" }}>{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-xs mt-0.5" style={{ color: "#8AABDA" }}>{data.venueName}</p>}
      </div>
    </Overlay>
  </InvBg>
));

export const Template8 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.navyGold}>
    <Overlay>
      <p className="text-xs tracking-[0.3em] mb-4" style={{ color: "#C4A35A" }}>❖ בס"ד ❖</p>
      <Names g={data.groomName} b={data.brideName} color="#E8D4A8" size="4xl" sep="&" sepColor="#C4A35A" />
      <p className="text-xs mt-3 max-w-[240px]" style={{ color: "#A0B8D8" }}>{data.introText || "מזמינים אתכם לחגוג"}</p>
      <Parents data={data} color="#A0B8D8" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#051839" />
    </Overlay>
  </InvBg>
));

// --- GROUP 5: Boho Rustic ---
export const Template9 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.boho}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#8A6A4A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#5A4A3A" }}>{data.introText || "בשמחה ובאהבה מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#3A2A1A" size="3xl" sep="🌿" sepColor="#7A8A5A" />
      <Parents data={data} color="#5A4A3A" />
      <Grandparents data={data} color="#7A6A5A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#5A4A3A" color="#F0E8D8" rounded />
    </Overlay>
  </InvBg>
));

export const Template10 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.boho}>
    <Overlay>
      <p className="text-xs tracking-widest mb-4" style={{ color: "#9A7ABA" }}>הזמנה לחתונה</p>
      <Names g={data.groomName} b={data.brideName} color="#4A3A2A" size="4xl" sep="♡" sepColor="#9A7ABA" />
      <p className="text-xs mt-2" style={{ color: "#6A5A4A" }}>{data.introText || "בשמחה מזמינים"}</p>
      <Parents data={data} color="#6A5A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#9A7ABA" color="#fff" rounded />
    </Overlay>
  </InvBg>
));

// --- GROUP 6: Art Deco Black ---
export const Template11 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.artDeco}>
    <Overlay>
      <p className="text-xs tracking-[0.5em] mb-4" style={{ color: "#C4A35A" }}>❖ בס"ד ❖</p>
      <p className="text-xs mb-3" style={{ color: "#A0A0B0" }}>{data.introText || "מתכבדים להזמינכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="4xl" sep="♦" sepColor="#C4A35A" />
      <Parents data={data} color="#A0A0B0" />
      <div className="mt-5 border-2 px-8 py-2" style={{ borderColor: "#C4A35A" }}>
        <p className="text-base tracking-wide" style={{ color: "#C4A35A" }}>{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </Overlay>
  </InvBg>
));

export const Template12 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.artDeco}>
    <Overlay>
      <p className="text-sm mb-3" style={{ color: "#C4A35A" }}>בס"ד</p>
      <Names g={data.groomName} b={data.brideName} color="#E8D4A8" size="5xl" sep="&" sepColor="#C4A35A" />
      <div className="w-20 h-px my-3" style={{ backgroundColor: "#C4A35A" }} />
      <p className="text-xs max-w-[240px]" style={{ color: "#C8C8D0" }}>{data.introText || "בשמחה רבה"}</p>
      <Parents data={data} color="#A8A8B8" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#0A0A0A" />
    </Overlay>
  </InvBg>
));

// --- GROUP 7: Pastel Watercolor ---
export const Template13 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.pastelWater}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#7A60A0" }}>בס"ד</p>
      <p className="text-xs mb-3 italic" style={{ color: "#6A5A8A" }}>{data.introText || "בשמחה אנו מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#4A3A6A" size="4xl" sep="♡" sepColor="#B090D0" />
      <Parents data={data} color="#6A5A8A" />
      <Grandparents data={data} color="#8A7AAA" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#6A5A8A" color="#fff" rounded />
    </Overlay>
  </InvBg>
));

export const Template14 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.pastelWater}>
    <Overlay>
      <p className="text-xs tracking-widest mb-5" style={{ color: "#9080B0" }}>WEDDING INVITATION</p>
      <Names g={data.groomName} b={data.brideName} color="#3A2A5A" size="3xl" sep="∞" sepColor="#B0A0D0" />
      <p className="text-xs mt-3" style={{ color: "#5A4A7A" }}>{data.introText || "מזמינים אתכם בשמחה"}</p>
      <Parents data={data} color="#5A4A7A" />
      <div className="mt-4 bg-white/60 backdrop-blur-sm px-8 py-2 rounded-2xl border" style={{ borderColor: "rgba(176,160,208,0.5)" }}>
        <p className="text-base" style={{ color: "#4A3A6A" }}>{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </Overlay>
  </InvBg>
));

// --- GROUP 8: White Gold Lines ---
export const Template15 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.whiteGoldLines}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-4" style={{ color: "#5A5A5A" }}>{data.introText || "בשמחה רבה אנו מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#2A2A2A" size="4xl" sep="✦" sepColor="#C4A35A" />
      <Parents data={data} color="#5A5A5A" />
      <Grandparents data={data} color="#8A8A8A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#fff" />
    </Overlay>
  </InvBg>
));

export const Template16 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.whiteGoldLines}>
    <Overlay>
      <p className="text-xs tracking-[0.3em] mb-5" style={{ color: "#B8A040" }}>הזמנה לחתונה</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="4xl" sep="&" sepColor="#2A2A2A" />
      <div className="w-16 h-px my-3" style={{ backgroundColor: "#C4A35A" }} />
      <p className="text-xs max-w-[240px]" style={{ color: "#5A5A5A" }}>{data.introText || "מתכבדים להזמינכם"}</p>
      <Parents data={data} color="#6A6A6A" />
      <div className="mt-4 border-2 px-8 py-2" style={{ borderColor: "#C4A35A" }}>
        <p className="text-base font-bold" style={{ color: "#2A2A2A" }}>{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </Overlay>
  </InvBg>
));

// --- GROUP 9: Dusty Rose ---
export const Template17 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.dustyRose}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#5A4A3A" }}>{data.introText || "בשמחה ובברכה מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#4A2A3A" size="4xl" sep="♥" sepColor="#C08090" />
      <Parents data={data} color="#5A4A3A" />
      <Grandparents data={data} color="#7A6A5A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#6A4A5A" color="#F8E8F0" rounded />
    </Overlay>
  </InvBg>
));

export const Template18 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.dustyRose}>
    <Overlay>
      <p className="text-xs italic mb-4" style={{ color: "#8A6A7A" }}>♡ הזמנה לחתונה ♡</p>
      <Names g={data.groomName} b={data.brideName} color="#3A1A2A" size="3xl" sep="❀" sepColor="#C08090" />
      <p className="text-xs mt-3" style={{ color: "#6A5A4A" }}>{data.introText || "בשמחה"}</p>
      <Parents data={data} color="#6A5A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#fff" />
    </Overlay>
  </InvBg>
));

// --- GROUP 10: Tropical ---
export const Template19 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.tropical}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#3A5A3A" }}>{data.introText || "בשמחה אנו מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#1A3A2A" size="4xl" sep="🌺" sepColor="#C4A35A" />
      <Parents data={data} color="#3A5A3A" />
      <Grandparents data={data} color="#5A7A5A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#1A5A3A" color="#F0F8F0" rounded />
    </Overlay>
  </InvBg>
));

export const Template20 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.tropical}>
    <Overlay>
      <p className="text-xs tracking-widest mb-5" style={{ color: "#C4A35A" }}>WEDDING</p>
      <Names g={data.groomName} b={data.brideName} color="#2A4A2A" size="3xl" sep="&" sepColor="#C4A35A" />
      <p className="text-xs mt-3" style={{ color: "#4A6A4A" }}>{data.introText || "מזמינים בשמחה"}</p>
      <Parents data={data} color="#4A6A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#fff" />
    </Overlay>
  </InvBg>
));

// --- GROUP 11: Greenery ---
export const Template21 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.greenery}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#5A7A4A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#4A5A3A" }}>{data.introText || "בשמחה מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#2A3A1A" size="4xl" sep="🌿" sepColor="#5A7A4A" />
      <Parents data={data} color="#4A5A3A" />
      <Grandparents data={data} color="#6A7A5A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#3A5A2A" color="#F0F8E8" rounded />
    </Overlay>
  </InvBg>
));

export const Template22 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.greenery}>
    <Overlay>
      <p className="text-xs tracking-widest mb-5" style={{ color: "#B8A040" }}>✦ SAVE THE DATE ✦</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="3xl" sep="&" sepColor="#3A5A2A" />
      <p className="text-xs mt-3" style={{ color: "#4A5A3A" }}>{data.introText || "אנו שמחים להזמינכם"}</p>
      <Parents data={data} color="#5A6A4A" />
      <div className="mt-4 border-2 px-8 py-2" style={{ borderColor: "#C4A35A" }}>
        <p className="text-base font-bold" style={{ color: "#2A3A1A" }}>{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </Overlay>
  </InvBg>
));

// --- GROUP 12: Terracotta ---
export const Template23 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.terracotta}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#8A4A2A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#6A3A1A" }}>{data.introText || "בשמחה מזמינים אתכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#4A2A0A" size="4xl" sep="☀" sepColor="#C48A3A" />
      <Parents data={data} color="#6A3A1A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#6A3A1A" color="#F8E8D0" rounded />
    </Overlay>
  </InvBg>
));

export const Template24 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.terracotta}>
    <Overlay>
      <p className="text-xs italic mb-4" style={{ color: "#A06040" }}>הזמנה לחתונה</p>
      <Names g={data.groomName} b={data.brideName} color="#5A2A0A" size="3xl" sep="✿" sepColor="#C48A3A" />
      <p className="text-xs mt-3" style={{ color: "#7A4A2A" }}>{data.introText || "מזמינים בחום"}</p>
      <Parents data={data} color="#7A4A2A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C48A3A" color="#fff" />
    </Overlay>
  </InvBg>
));

// --- GROUP 13: Vintage ---
export const Template25 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.vintage}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#6A4A2A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#5A4A3A" }}>{data.introText || "הננו מתכבדים להזמינכם לחתונתנו"}</p>
      <Names g={data.groomName} b={data.brideName} color="#3A2A1A" size="4xl" sep="עב״ג" sepColor="#6A4A2A" />
      <Parents data={data} color="#5A4A3A" />
      <Grandparents data={data} color="#7A6A5A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#5A3A1A" color="#F0E8D0" />
    </Overlay>
  </InvBg>
));

export const Template26 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.vintage}>
    <Overlay>
      <p className="text-xs mb-1" style={{ color: "#8A6A4A" }}>"נעלה את ירושלים על ראש שמחתנו"</p>
      <p className="text-sm mb-2" style={{ color: "#6A4A2A" }}>בס"ד</p>
      <Names g={data.groomName} b={data.brideName} color="#4A2A0A" size="3xl" sep="❖" sepColor="#8A6A3A" />
      <p className="text-xs mt-2" style={{ color: "#6A5A4A" }}>{data.introText || "בשמחה ובברכה"}</p>
      <Parents data={data} color="#6A5A4A" />
      <Grandparents data={data} color="#8A7A6A" />
      <div className="mt-3 border px-8 py-2" style={{ borderColor: "#8A6A3A" }}>
        <p className="text-base" style={{ color: "#3A2A1A" }}>{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </Overlay>
  </InvBg>
));

// --- GROUP 14: Mixed variations with different text styles ---
export const Template27 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.floralPink}>
    <Overlay>
      <p className="text-xs tracking-[0.5em] mb-5" style={{ color: "#C4A35A" }}>SAVE THE DATE</p>
      <div className="text-5xl font-black mb-0 leading-tight" style={{ color: "#3A2A2A" }}>{data.groomName || "החתן"}</div>
      <div className="text-2xl font-light my-0" style={{ color: "#C4A35A" }}>&</div>
      <div className="text-5xl font-black leading-tight mb-3" style={{ color: "#3A2A2A" }}>{data.brideName || "הכלה"}</div>
      <div className="w-full max-w-[200px] h-0.5 my-2" style={{ backgroundColor: "#C4A35A" }} />
      <Parents data={data} color="#6A4A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#3A2A2A" color="#F8E8E8" />
    </Overlay>
  </InvBg>
));

export const Template28 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.goldMarble}>
    <Overlay>
      <p className="text-lg mb-2 font-bold" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-2" style={{ color: "#5A4A2A" }}>{data.introText || "בסימן טוב ובמזל טוב"}</p>
      <p className="text-xs mb-3" style={{ color: "#5A4A2A" }}>הננו מתכבדים להזמינכם להשתתף בשמחת כלולות בנינו היקרים</p>
      <Names g={data.groomName} b={data.brideName} color="#2A1A0A" size="5xl" sep="עב״ג" sepColor="#C4A35A" />
      <Parents data={data} color="#5A4A2A" />
      <Grandparents data={data} color="#7A6A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#fff" />
    </Overlay>
  </InvBg>
));

export const Template29 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.navyGold}>
    <Overlay>
      <p className="text-xs tracking-[0.5em] mb-6" style={{ color: "#C4A35A" }}>✧ WEDDING ✧</p>
      <div className="text-5xl font-extralight tracking-wider mb-1" style={{ color: "#E8D4B4" }}>{data.groomName || "החתן"}</div>
      <div className="w-10 h-10 rounded-full border flex items-center justify-center my-2" style={{ borderColor: "#C4A35A" }}>
        <span style={{ color: "#C4A35A" }}>&</span>
      </div>
      <div className="text-5xl font-extralight tracking-wider mb-3" style={{ color: "#E8D4B4" }}>{data.brideName || "הכלה"}</div>
      <Parents data={data} color="#8AABDA" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#051839" rounded />
    </Overlay>
  </InvBg>
));

export const Template30 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.artDeco}>
    <Overlay>
      <p className="text-sm mb-3" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#B0B0C0" }}>{data.introText || "בסימן טוב ובמזל טוב"}</p>
      <div className="text-5xl font-bold mb-1" style={{ color: "#C4A35A", letterSpacing: "0.1em" }}>{data.groomName || "החתן"}</div>
      <div className="flex items-center gap-4 my-1">
        <div className="w-12 h-px" style={{ backgroundColor: "#C4A35A" }} />
        <span className="text-lg" style={{ color: "#C4A35A" }}>♦</span>
        <div className="w-12 h-px" style={{ backgroundColor: "#C4A35A" }} />
      </div>
      <div className="text-5xl font-bold mb-3" style={{ color: "#C4A35A", letterSpacing: "0.1em" }}>{data.brideName || "הכלה"}</div>
      <Parents data={data} color="#A0A0B0" />
      <Grandparents data={data} color="#808090" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#000" />
    </Overlay>
  </InvBg>
));

// More mixed variations
export const Template31 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.whiteGoldLines}>
    <Overlay>
      <p className="text-xs mb-4 italic" style={{ color: "#B8A040" }}>♡ בס"ד ♡</p>
      <p className="text-xs mb-3" style={{ color: "#6A6A5A" }}>{data.introText || "בשמחה ובברכה"}</p>
      <Names g={data.groomName} b={data.brideName} color="#3A3A2A" size="3xl" sep="♥" sepColor="#C4A35A" />
      <Parents data={data} color="#5A5A4A" />
      <Grandparents data={data} color="#7A7A6A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#2A2A1A" color="#F8F0E0" rounded />
    </Overlay>
  </InvBg>
));

export const Template32 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.dustyRose}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#B8942A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#4A3A2A" }}>{data.introText || "הננו מתכבדים להזמינכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="4xl" sep="❖" sepColor="#8A6A5A" />
      <Parents data={data} color="#5A4A3A" />
      <Grandparents data={data} color="#7A6A5A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#fff" />
    </Overlay>
  </InvBg>
));

export const Template33 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.burgundy}>
    <Overlay>
      <p className="text-xs tracking-[0.3em] mb-5" style={{ color: "#C4A35A" }}>❖ WEDDING ❖</p>
      <div className="text-5xl font-extralight mb-1" style={{ color: "#3A1A1A" }}>{data.groomName || "החתן"}</div>
      <div className="text-xl my-1" style={{ color: "#C4A35A" }}>&</div>
      <div className="text-5xl font-extralight mb-3" style={{ color: "#3A1A1A" }}>{data.brideName || "הכלה"}</div>
      <p className="text-xs mt-2" style={{ color: "#5A3A3A" }}>{data.introText || "מזמינים בשמחה"}</p>
      <Parents data={data} color="#5A3A3A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="rgba(196,163,90,0.9)" color="#fff" rounded />
    </Overlay>
  </InvBg>
));

export const Template34 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.pastelWater}>
    <Overlay>
      <p className="text-sm mb-3" style={{ color: "#8A70B0" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#6A5A7A" }}>{data.introText || "בשמחה רבה"}</p>
      <Names g={data.groomName} b={data.brideName} color="#3A2A5A" size="3xl" sep="✿" sepColor="#B090D0" />
      <Parents data={data} color="#6A5A7A" />
      <Grandparents data={data} color="#8A7A9A" />
      <div className="mt-4 bg-white/70 backdrop-blur-sm px-8 py-2 rounded-xl border" style={{ borderColor: "rgba(140,112,176,0.4)" }}>
        <p className="text-base" style={{ color: "#4A3A6A" }}>{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-xs mt-0.5" style={{ color: "#6A5A8A" }}>{data.venueName}</p>}
      </div>
    </Overlay>
  </InvBg>
));

export const Template35 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.tropical}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#2A4A2A" }}>{data.introText || "מתכבדים להזמינכם"}</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="4xl" sep="❖" sepColor="#1A4A2A" />
      <Parents data={data} color="#2A5A3A" />
      <Grandparents data={data} color="#4A6A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#0A3A1A" />
    </Overlay>
  </InvBg>
));

export const Template36 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.greenery}>
    <Overlay>
      <p className="text-sm mb-3" style={{ color: "#3A5A2A" }}>בס"ד</p>
      <p className="text-xs mb-2" style={{ color: "#4A4A3A" }}>{data.introText || "בשמחה ובברכה"}</p>
      <p className="text-xs mb-3" style={{ color: "#4A4A3A" }}>הננו מתכבדים להזמינכם להשתתף בשמחת כלולות</p>
      <Names g={data.groomName} b={data.brideName} color="#1A2A0A" size="4xl" sep="עב״ג" sepColor="#5A7A3A" />
      <Parents data={data} color="#3A4A2A" />
      <Grandparents data={data} color="#5A6A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#3A5A2A" color="#F0F8E8" />
    </Overlay>
  </InvBg>
));

export const Template37 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.vintage}>
    <Overlay>
      <p className="text-lg font-bold mb-1" style={{ color: "#6A4A2A" }}>בס"ד</p>
      <p className="text-xs mb-2" style={{ color: "#5A3A1A" }}>בסימן טוב ובמזל טוב</p>
      <p className="text-xs mb-3" style={{ color: "#5A3A1A" }}>{data.introText || "הננו מתכבדים להזמינכם להשתתף בשמחת כלולות"}</p>
      <Names g={data.groomName} b={data.brideName} color="#3A1A0A" size="5xl" sep="עב״ג" sepColor="#8A6A3A" />
      <Parents data={data} color="#5A3A1A" />
      <Grandparents data={data} color="#7A5A3A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#6A4A2A" color="#F0E8D0" />
    </Overlay>
  </InvBg>
));

export const Template38 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.boho}>
    <Overlay>
      <p className="text-xs tracking-widest mb-5" style={{ color: "#7A5A9A" }}>♡ WEDDING ♡</p>
      <Names g={data.groomName} b={data.brideName} color="#3A2A1A" size="3xl" sep="&" sepColor="#8A6ABA" />
      <div className="w-20 h-px my-3" style={{ backgroundColor: "#8A6ABA" }} />
      <p className="text-xs max-w-[240px]" style={{ color: "#5A4A3A" }}>{data.introText || "בשמחה"}</p>
      <Parents data={data} color="#6A5A4A" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#5A4A3A" color="#F0E8D8" rounded />
    </Overlay>
  </InvBg>
));

export const Template39 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.terracotta}>
    <Overlay>
      <p className="text-sm mb-2" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-3" style={{ color: "#5A3A1A" }}>{data.introText || "בשמחה רבה"}</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="4xl" sep="✦" sepColor="#8A4A2A" />
      <Parents data={data} color="#5A3A1A" />
      <Grandparents data={data} color="#7A5A3A" />
      <div className="mt-4 border-2 px-8 py-2" style={{ borderColor: "#C4A35A" }}>
        <p className="text-base font-bold" style={{ color: "#4A2A0A" }}>{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </Overlay>
  </InvBg>
));

export const Template40 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <InvBg ref={ref} bg={BG.navyGold}>
    <Overlay>
      <p className="text-sm mb-3" style={{ color: "#C4A35A" }}>בס"ד</p>
      <p className="text-xs mb-2" style={{ color: "#A0B8D8" }}>בסימן טוב ובמזל טוב</p>
      <p className="text-xs mb-3" style={{ color: "#A0B8D8" }}>{data.introText || "הננו מתכבדים להזמינכם להשתתף בשמחת כלולות"}</p>
      <Names g={data.groomName} b={data.brideName} color="#C4A35A" size="5xl" sep="עב״ג" sepColor="#8AABDA" />
      <Parents data={data} color="#8AABDA" />
      <Grandparents data={data} color="#6A8BAA" />
      <DateBlock date={data.eventDate} venue={data.venueName} bg="#C4A35A" color="#051839" />
    </Overlay>
  </InvBg>
));

// Set display names
[Template1,Template2,Template3,Template4,Template5,Template6,Template7,Template8,Template9,Template10,
Template11,Template12,Template13,Template14,Template15,Template16,Template17,Template18,Template19,Template20,
Template21,Template22,Template23,Template24,Template25,Template26,Template27,Template28,Template29,Template30,
Template31,Template32,Template33,Template34,Template35,Template36,Template37,Template38,Template39,Template40
].forEach((c, i) => { c.displayName = `Template${i + 1}`; });

// Backwards compatibility
export const ClassicTemplate = Template3;
export const ModernTemplate = Template2;
export const RomanticTemplate = Template1;
export const ElegantTemplate = Template4;

export const templates = [
  { id: 1, name: "ורדים רומנטי", Component: Template1 },
  { id: 2, name: "ורדים אלגנטי", Component: Template2 },
  { id: 3, name: "שיש וזהב קלאסי", Component: Template3 },
  { id: 4, name: "שיש מסורתי", Component: Template4 },
  { id: 5, name: "ורדים בורדו", Component: Template5 },
  { id: 6, name: "בורדו אלגנטי", Component: Template6 },
  { id: 7, name: "כחול-זהב מלכותי", Component: Template7 },
  { id: 8, name: "כחול כהה פרימיום", Component: Template8 },
  { id: 9, name: "בוהו לבנדר", Component: Template9 },
  { id: 10, name: "בוהו רומנטי", Component: Template10 },
  { id: 11, name: "ארט דקו שחור", Component: Template11 },
  { id: 12, name: "ארט דקו זהב", Component: Template12 },
  { id: 13, name: "צבעי מים סגול", Component: Template13 },
  { id: 14, name: "פסטל לבנדר", Component: Template14 },
  { id: 15, name: "לבן קווי זהב", Component: Template15 },
  { id: 16, name: "לבן-זהב אלגנטי", Component: Template16 },
  { id: 17, name: "ורוד מאובק", Component: Template17 },
  { id: 18, name: "ורוד פרחוני", Component: Template18 },
  { id: 19, name: "טרופי ירוק", Component: Template19 },
  { id: 20, name: "טרופי מודרני", Component: Template20 },
  { id: 21, name: "ירוק-זהב בוטני", Component: Template21 },
  { id: 22, name: "ירוק גיאומטרי", Component: Template22 },
  { id: 23, name: "טרהקוטה חם", Component: Template23 },
  { id: 24, name: "טרהקוטה בוהו", Component: Template24 },
  { id: 25, name: "וינטג' מסורתי", Component: Template25 },
  { id: 26, name: "וינטג' ירושלמי", Component: Template26 },
  { id: 27, name: "ורדים טיפוגרפי", Component: Template27 },
  { id: 28, name: "שיש מפואר", Component: Template28 },
  { id: 29, name: "כחול מינימלי", Component: Template29 },
  { id: 30, name: "ארט דקו מפואר", Component: Template30 },
  { id: 31, name: "זהב רומנטי", Component: Template31 },
  { id: 32, name: "ורוד-זהב גלאם", Component: Template32 },
  { id: 33, name: "בורדו מודרני", Component: Template33 },
  { id: 34, name: "סגול חלומי", Component: Template34 },
  { id: 35, name: "טרופי זהב", Component: Template35 },
  { id: 36, name: "ירוק מסורתי", Component: Template36 },
  { id: 37, name: "וינטג' מפואר", Component: Template37 },
  { id: 38, name: "בוהו מודרני", Component: Template38 },
  { id: 39, name: "טרהקוטה זהב", Component: Template39 },
  { id: 40, name: "כחול-זהב מפואר", Component: Template40 },
];
