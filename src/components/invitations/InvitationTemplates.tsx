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

// ========== HELPER: Shared section renderers ==========

const ParentsBlock = ({ data, color, size = "xs" }: { data: InvitationData; color: string; size?: string }) => (
  <div className={`text-${size} space-y-0.5`} style={{ color }}>
    {data.groomParents && <p>הורי החתן: {data.groomParents}</p>}
    {data.brideParents && <p>הורי הכלה: {data.brideParents}</p>}
  </div>
);

const GrandparentsBlock = ({ data, color }: { data: InvitationData; color: string }) =>
  (data.groomGrandparents || data.brideGrandparents) ? (
    <div className="text-[10px] space-y-0.5 mt-1" style={{ color }}>
      {data.groomGrandparents && <p>סבי החתן: {data.groomGrandparents}</p>}
      {data.brideGrandparents && <p>סבי הכלה: {data.brideGrandparents}</p>}
    </div>
  ) : null;

// ========== SVG Decorations ==========

const GoldOrnament = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 30" fill="none">
    <path d="M0 15 Q50 0 100 15 Q150 30 200 15" stroke="#C4A35A" strokeWidth="1.5" fill="none" />
    <circle cx="100" cy="15" r="3" fill="#C4A35A" />
    <circle cx="60" cy="10" r="2" fill="#C4A35A" />
    <circle cx="140" cy="20" r="2" fill="#C4A35A" />
  </svg>
);

const FloralCorner = ({ position, color = "#E8B4BC" }: { position: string; color?: string }) => {
  const transforms: Record<string, string> = {
    "top-left": "",
    "top-right": "scaleX(-1)",
    "bottom-left": "scaleY(-1)",
    "bottom-right": "scale(-1)",
  };
  return (
    <svg
      className={`absolute w-16 h-16 ${position.includes("top") ? "top-2" : "bottom-2"} ${position.includes("left") ? "left-2" : "right-2"}`}
      viewBox="0 0 80 80"
      style={{ transform: transforms[position] }}
    >
      <path d="M5 5 Q20 5 25 20 Q30 35 20 40 Q10 35 5 25 Z" fill={color} opacity="0.4" />
      <path d="M10 2 Q25 8 22 25 Q15 20 10 10 Z" fill={color} opacity="0.3" />
      <circle cx="18" cy="18" r="3" fill={color} opacity="0.6" />
      <path d="M2 10 Q5 25 18 30" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
  );
};

const LeafDecoration = ({ color = "#7B9E6B" }: { color?: string }) => (
  <svg className="w-24 h-8" viewBox="0 0 120 40">
    <path d="M10 20 Q30 5 60 20 Q90 35 110 20" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M40 20 Q50 10 60 15" stroke={color} strokeWidth="1" fill="none" />
    <path d="M80 20 Q70 10 60 15" stroke={color} strokeWidth="1" fill="none" />
    <circle cx="60" cy="15" r="2" fill={color} />
  </svg>
);

// ========== 40 TEMPLATES ==========

// 1. קלאסי זהב מסורתי
export const Template1 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#FDF8E8] to-[#F5EDD6] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-4 border-4 border-[#C4A35A] rounded-lg" />
    <div className="absolute inset-6 border-2 border-[#C4A35A]/50 rounded-lg" />
    <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[#C4A35A] rounded-tl-lg" />
    <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[#C4A35A] rounded-tr-lg" />
    <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[#C4A35A] rounded-bl-lg" />
    <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[#C4A35A] rounded-br-lg" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-lg mb-2">בס"ד</p>
      <p className="text-[#5A4A2A] text-sm mb-4">{data.introText || "בשמחה רבה אנו מזמינים אתכם לחתונתנו"}</p>
      <div className="text-[#C4A35A] text-4xl font-bold mb-2">{data.groomName || "החתן"} & {data.brideName || "הכלה"}</div>
      <div className="w-16 h-0.5 bg-[#C4A35A] my-4" />
      <ParentsBlock data={data} color="#5A4A2A" size="sm" />
      <GrandparentsBlock data={data} color="#5A4A2A" />
      <div className="mt-6 text-[#5A4A2A]">
        <p className="text-lg font-semibold">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-sm mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 2. מודרני גיאומטרי
export const Template2 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-white p-6 relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
    <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-[#E8B4BC]" />
    <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-[#B4C7E8]" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-gray-400 text-sm tracking-widest mb-6">WEDDING INVITATION</p>
      <div className="text-[#051839] text-5xl font-light tracking-wider mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-2xl my-2">&</div>
      <div className="text-[#051839] text-5xl font-light tracking-wider mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent my-6" />
      <p className="text-gray-600 text-sm max-w-xs leading-relaxed">{data.introText || "בשמחה רבה אנו מזמינים אתכם לחגוג איתנו"}</p>
      <ParentsBlock data={data} color="#888" size="sm" />
      <div className="mt-8 bg-[#051839] text-white px-8 py-3 rounded-sm">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 3. רומנטי ורוד
export const Template3 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#FFF5F5] to-[#FDE8E8] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <FloralCorner position="top-left" />
    <FloralCorner position="top-right" />
    <FloralCorner position="bottom-left" />
    <FloralCorner position="bottom-right" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#8B6B6B] text-sm italic mb-4">בס"ד</p>
      <p className="text-[#8B6B6B] text-sm mb-6 italic max-w-xs">{data.introText || "בשמחה ובהתרגשות אנו מזמינים אתכם"}</p>
      <div className="text-[#8B4B5B] text-4xl italic mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-3xl my-1">♥</div>
      <div className="text-[#8B4B5B] text-4xl italic mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#E8B4BC] to-transparent my-4" />
      <ParentsBlock data={data} color="#8B6B6B" size="sm" />
      <div className="mt-6 border border-[#E8B4BC] px-6 py-3 rounded-lg">
        <p className="text-[#8B4B5B] text-lg">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-[#8B6B6B] text-sm mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 4. אלגנטי מינימלי
export const Template4 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#FAFAF8] p-8 relative overflow-hidden" style={{ fontFamily: "Times New Roman, serif" }}>
    <div className="absolute inset-6 border border-[#D4D0C8]" />
    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-20 h-px bg-[#C4A35A]" />
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-20 h-px bg-[#C4A35A]" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#8B8B7A] text-xs tracking-[0.3em] mb-8">הזמנה לחתונה</p>
      <div className="text-[#3A3A32] text-3xl tracking-wide mb-2">{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-xl my-2">✦</div>
      <div className="text-[#3A3A32] text-3xl tracking-wide mb-6">{data.brideName || "הכלה"}</div>
      <p className="text-[#6B6B5A] text-sm max-w-[280px] leading-relaxed mb-6">{data.introText || "בשמחה רבה אנו מזמינים אתכם"}</p>
      <ParentsBlock data={data} color="#6B6B5A" size="sm" />
      <div className="border-t border-b border-[#D4D0C8] py-4 px-8 mt-6">
        <p className="text-[#3A3A32] text-lg">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-[#6B6B5A] text-sm mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 5. שיש לבן יוקרתי
export const Template5 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] relative overflow-hidden" style={{ fontFamily: "Georgia, serif", background: "linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 25%, #f0f0f0 50%, #e0e0e0 75%, #f5f5f5 100%)" }}>
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(180,180,180,0.3) 35px, rgba(180,180,180,0.3) 36px)" }} />
    <div className="absolute inset-5 border-2 border-[#C4A35A]" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8" dir="rtl">
      <p className="text-[#C4A35A] text-sm mb-2">בס"ד</p>
      <GoldOrnament className="w-40 mb-4" />
      <p className="text-[#4A4A4A] text-sm mb-4">{data.introText || "בשמחה רבה אנו מתכבדים להזמינכם"}</p>
      <div className="text-[#2A2A2A] text-4xl font-bold mb-1" style={{ fontFamily: "David, serif" }}>{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-2xl my-1">❖</div>
      <div className="text-[#2A2A2A] text-4xl font-bold mb-4" style={{ fontFamily: "David, serif" }}>{data.brideName || "הכלה"}</div>
      <GoldOrnament className="w-40 my-3" />
      <ParentsBlock data={data} color="#4A4A4A" size="sm" />
      <GrandparentsBlock data={data} color="#6A6A6A" />
      <div className="mt-5 bg-[#C4A35A] text-white px-8 py-3">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 6. כחול כהה מלכותי
export const Template6 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#051839] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-5 border border-[#C4A35A]/60" />
    <div className="absolute inset-7 border border-[#C4A35A]/30" />
    <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #C4A35A 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-lg mb-3">בס"ד</p>
      <p className="text-[#8A9BBF] text-sm mb-5">{data.introText || "בשמחה רבה מתכבדים להזמינכם"}</p>
      <div className="text-[#C4A35A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-white text-xl my-2">&</div>
      <div className="text-[#C4A35A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-24 h-px bg-[#C4A35A] my-4" />
      <ParentsBlock data={data} color="#8A9BBF" size="sm" />
      <GrandparentsBlock data={data} color="#6A7B9F" />
      <div className="mt-6 border border-[#C4A35A] px-8 py-3">
        <p className="text-[#C4A35A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-[#8A9BBF] text-sm mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 7. ירוק טבעי / רוסטיק
export const Template7 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#F5F0E6] to-[#EDE5D5] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute top-3 left-1/2 -translate-x-1/2"><LeafDecoration /></div>
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rotate-180"><LeafDecoration /></div>
    <div className="absolute inset-6 border border-[#7B9E6B]/40 rounded-xl" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#7B9E6B] text-sm mb-4">בס"ד</p>
      <p className="text-[#5A5A4A] text-sm mb-5">{data.introText || "בשמחה ובברכה אנו מזמינים אתכם"}</p>
      <div className="text-[#3A5A2B] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#7B9E6B] text-2xl my-2">🌿</div>
      <div className="text-[#3A5A2B] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#5A5A4A" size="sm" />
      <GrandparentsBlock data={data} color="#7A7A6A" />
      <div className="mt-6 bg-[#7B9E6B]/10 border border-[#7B9E6B]/30 px-8 py-3 rounded-lg">
        <p className="text-[#3A5A2B] text-lg">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-[#5A5A4A] text-sm mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 8. ארט דקו זהב
export const Template8 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#1A1A2E] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 550">
      <line x1="50" y1="0" x2="50" y2="550" stroke="#C4A35A" strokeWidth="0.5" />
      <line x1="350" y1="0" x2="350" y2="550" stroke="#C4A35A" strokeWidth="0.5" />
      <path d="M50 50 L200 30 L350 50" stroke="#C4A35A" strokeWidth="1" fill="none" />
      <path d="M50 500 L200 520 L350 500" stroke="#C4A35A" strokeWidth="1" fill="none" />
      <polygon points="200,60 220,100 180,100" fill="#C4A35A" opacity="0.3" />
      <polygon points="200,490 220,450 180,450" fill="#C4A35A" opacity="0.3" />
    </svg>
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] tracking-[0.5em] text-xs mb-6">❖ בס"ד ❖</p>
      <p className="text-[#A0A0C0] text-sm mb-4">{data.introText || "מתכבדים להזמינכם"}</p>
      <div className="text-[#C4A35A] text-4xl font-bold mb-2" style={{ letterSpacing: "0.1em" }}>{data.groomName || "החתן"}</div>
      <div className="flex items-center gap-4 my-2">
        <div className="w-12 h-px bg-[#C4A35A]" />
        <span className="text-[#C4A35A] text-xl">♦</span>
        <div className="w-12 h-px bg-[#C4A35A]" />
      </div>
      <div className="text-[#C4A35A] text-4xl font-bold mb-4" style={{ letterSpacing: "0.1em" }}>{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#A0A0C0" size="sm" />
      <div className="mt-6 border-2 border-[#C4A35A] px-8 py-3">
        <p className="text-[#C4A35A] text-lg tracking-wide">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 9. אקוורל / צבעי מים
export const Template9 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-white p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute top-0 left-0 w-48 h-48 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #B4D4E8, transparent 70%)", filter: "blur(20px)" }} />
    <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #E8D4B4, transparent 70%)", filter: "blur(20px)" }} />
    <div className="absolute bottom-0 left-0 w-44 h-44 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #E8B4D4, transparent 70%)", filter: "blur(20px)" }} />
    <div className="absolute bottom-0 right-0 w-36 h-36 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #B4E8D4, transparent 70%)", filter: "blur(20px)" }} />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#8B7B6B] text-sm mb-4">בס"ד</p>
      <p className="text-[#6B7B8B] text-sm italic mb-5">{data.introText || "בשמחה אנו מזמינים אתכם"}</p>
      <div className="text-[#4A5A6A] text-4xl mb-1" style={{ fontFamily: "Georgia, serif" }}>{data.groomName || "החתן"}</div>
      <div className="text-[#B4A494] text-2xl my-2">∞</div>
      <div className="text-[#4A5A6A] text-4xl mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#6B7B8B" size="sm" />
      <GrandparentsBlock data={data} color="#8B9BAB" />
      <div className="mt-6 bg-white/80 backdrop-blur-sm border border-[#B4C7E8]/50 px-8 py-3 rounded-full">
        <p className="text-[#4A5A6A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 10. שחור-זהב פרימיום
export const Template10 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#0A0A0A] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-4 border border-[#C4A35A]/50" />
    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#C4A35A]" />
    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#C4A35A]" />
    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#C4A35A]" />
    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#C4A35A]" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-sm mb-6 tracking-[0.3em]">בס"ד</p>
      <p className="text-[#888] text-sm mb-4">{data.introText || "מתכבדים להזמינכם"}</p>
      <div className="text-[#C4A35A] text-5xl font-bold mb-2">{data.groomName || "החתן"}</div>
      <div className="text-[#666] text-xl my-1">&</div>
      <div className="text-[#C4A35A] text-5xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent my-4" />
      <ParentsBlock data={data} color="#999" size="sm" />
      <div className="mt-8">
        <p className="text-[#C4A35A] text-xl">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-[#888] text-sm mt-2">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 11. ורוד מאובק (Dusty Rose)
export const Template11 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#F2E0E0] to-[#E8D0D0] p-8 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-6 border border-[#B88A8A]/40 rounded-2xl" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#B88A8A] text-xs tracking-widest mb-6">♡ בס"ד ♡</p>
      <p className="text-[#8A6A6A] text-sm mb-4 italic">{data.introText || "בשמחה ואהבה מזמינים אתכם"}</p>
      <div className="text-[#6A4A4A] text-3xl mb-2">{data.groomName || "החתן"}</div>
      <p className="text-[#B88A8A] text-lg">ו</p>
      <div className="text-[#6A4A4A] text-3xl mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-20 h-px bg-[#B88A8A]/50 my-4" />
      <ParentsBlock data={data} color="#8A6A6A" size="sm" />
      <GrandparentsBlock data={data} color="#A08080" />
      <div className="mt-6 bg-white/50 px-8 py-3 rounded-full">
        <p className="text-[#6A4A4A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 12. לבן טהור מינימלי
export const Template12 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-white p-10 relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-gray-300 text-xs tracking-[0.5em] mb-10">WEDDING</p>
      <div className="text-[#2A2A2A] text-5xl font-extralight mb-3">{data.groomName || "החתן"}</div>
      <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center my-2">
        <span className="text-gray-300 text-sm">&</span>
      </div>
      <div className="text-[#2A2A2A] text-5xl font-extralight mb-6">{data.brideName || "הכלה"}</div>
      <p className="text-gray-400 text-sm max-w-[260px] leading-relaxed mb-6">{data.introText || "אנו שמחים להזמינכם"}</p>
      <ParentsBlock data={data} color="#999" />
      <div className="mt-8 text-gray-400">
        <p className="text-lg font-light">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 13. בורדו אלגנטי
export const Template13 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#4A0E1B] to-[#2E0A12] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-5 border border-[#C4A35A]/40" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-sm mb-4">בס"ד</p>
      <GoldOrnament className="w-32 mb-4" />
      <p className="text-[#E8C4CC] text-sm mb-4">{data.introText || "בשמחה אנו מזמינים אתכם"}</p>
      <div className="text-[#C4A35A] text-4xl font-bold mb-2">{data.groomName || "החתן"}</div>
      <div className="text-[#E8C4CC] text-xl my-1">&</div>
      <div className="text-[#C4A35A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <GoldOrnament className="w-32 my-3" />
      <ParentsBlock data={data} color="#E8C4CC" size="sm" />
      <div className="mt-6 border border-[#C4A35A]/50 px-8 py-3">
        <p className="text-[#C4A35A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 14. תכלת ולבן ים-תיכוני
export const Template14 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#E8F0F8] to-[#D0E0F0] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-5 border-2 border-[#5B8DB8]/30 rounded-lg" />
    <div className="absolute top-3 left-1/2 -translate-x-1/2">
      <svg width="60" height="20" viewBox="0 0 60 20"><path d="M0 10 Q15 0 30 10 Q45 20 60 10" stroke="#5B8DB8" strokeWidth="1.5" fill="none" opacity="0.5" /></svg>
    </div>
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#5B8DB8] text-sm mb-4">בס"ד</p>
      <p className="text-[#4A6A8A] text-sm mb-5">{data.introText || "בשמחה אנו מזמינים אתכם"}</p>
      <div className="text-[#2A4A6A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#5B8DB8] text-2xl my-2">⚓</div>
      <div className="text-[#2A4A6A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#4A6A8A" size="sm" />
      <GrandparentsBlock data={data} color="#6A8AAA" />
      <div className="mt-6 bg-[#5B8DB8] text-white px-8 py-3 rounded-lg">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 15. סגול מלכותי
export const Template15 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#2A1A3A] to-[#1A0E2A] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-5 border border-[#B89ACA]/30" />
    <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ backgroundImage: "repeating-linear-gradient(120deg, transparent, transparent 40px, rgba(184,154,202,0.3) 40px, rgba(184,154,202,0.3) 41px)" }} />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#D4B4E4] text-sm mb-4">בס"ד</p>
      <p className="text-[#B89ACA] text-sm mb-5">{data.introText || "מתכבדים להזמינכם לשמוח איתנו"}</p>
      <div className="text-[#E4D4F4] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-xl my-2">✧</div>
      <div className="text-[#E4D4F4] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-20 h-px bg-[#B89ACA]/50 my-3" />
      <ParentsBlock data={data} color="#B89ACA" size="sm" />
      <div className="mt-6 border border-[#B89ACA]/50 px-8 py-3 rounded-lg">
        <p className="text-[#E4D4F4] text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 16. כפרי / Rustic חום
export const Template16 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif", background: "linear-gradient(180deg, #E8D8C4 0%, #D8C4A8 100%)" }}>
    <div className="absolute inset-5 border-2 border-dashed border-[#8B6B4A]/40 rounded-lg" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#8B6B4A] text-sm mb-3">בס"ד</p>
      <p className="text-[#6B5A4A] text-sm mb-4">{data.introText || "בשמחה ובאהבה מזמינים אתכם"}</p>
      <div className="text-[#4A3A2A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#8B6B4A] text-lg my-2">✿</div>
      <div className="text-[#4A3A2A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-16 h-px bg-[#8B6B4A] my-3" />
      <ParentsBlock data={data} color="#6B5A4A" size="sm" />
      <GrandparentsBlock data={data} color="#8B7A6A" />
      <div className="mt-6 bg-[#4A3A2A] text-[#E8D8C4] px-8 py-3 rounded-sm">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 17. ורד זהב (Rose Gold)
export const Template17 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#FFF8F4] to-[#F8EDE8] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-4 border-2 border-[#D4A08A]" />
    <div className="absolute inset-6 border border-[#D4A08A]/30" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#D4A08A] text-sm mb-4">בס"ד</p>
      <p className="text-[#8A6A5A] text-sm mb-5">{data.introText || "בשמחה מזמינים אתכם לחתונתנו"}</p>
      <div className="text-[#D4A08A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="flex items-center gap-3 my-3">
        <div className="w-10 h-px bg-[#D4A08A]" />
        <span className="text-[#D4A08A]">♥</span>
        <div className="w-10 h-px bg-[#D4A08A]" />
      </div>
      <div className="text-[#D4A08A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#8A6A5A" size="sm" />
      <GrandparentsBlock data={data} color="#A08A7A" />
      <div className="mt-6 bg-[#D4A08A] text-white px-8 py-3 rounded-full">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 18. טיפוגרפי מודגש
export const Template18 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#F8F8F0] p-6 relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-xs tracking-[0.5em] mb-8">בס"ד</p>
      <p className="text-gray-500 text-sm mb-6">{data.introText || "מזמינים אתכם בשמחה"}</p>
      <div className="text-[#1A1A1A] text-6xl font-black mb-0 leading-tight">{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-3xl font-light my-0">&</div>
      <div className="text-[#1A1A1A] text-6xl font-black leading-tight mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-full h-1 bg-[#1A1A1A] my-4" />
      <ParentsBlock data={data} color="#666" size="sm" />
      <div className="mt-6 text-[#1A1A1A]">
        <p className="text-2xl font-bold">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-sm text-gray-500 mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 19. עדין פסטלי
export const Template19 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-br from-[#F0E8F8] via-[#E8F0F8] to-[#F8F0E8] p-8 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-6 border border-[#C4B4D4]/40 rounded-3xl" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#A494B4] text-sm mb-4">בס"ד</p>
      <p className="text-[#7A6A8A] text-sm mb-5 italic">{data.introText || "בשמחה רבה מזמינים אתכם"}</p>
      <div className="text-[#5A4A6A] text-3xl mb-2">{data.groomName || "החתן"}</div>
      <div className="text-[#C4B4D4] text-lg">♡</div>
      <div className="text-[#5A4A6A] text-3xl mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-16 h-px bg-[#C4B4D4] my-3" />
      <ParentsBlock data={data} color="#7A6A8A" />
      <GrandparentsBlock data={data} color="#A494B4" />
      <div className="mt-6 bg-white/60 backdrop-blur-sm px-8 py-3 rounded-2xl border border-[#C4B4D4]/30">
        <p className="text-[#5A4A6A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 20. מוזהב עתיק
export const Template20 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif", background: "linear-gradient(180deg, #F0E8D0 0%, #E0D0B0 50%, #F0E8D0 100%)" }}>
    <div className="absolute inset-3 border-4 border-double border-[#A08040]" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#A08040] text-lg mb-2">בס"ד</p>
      <GoldOrnament className="w-36 mb-3" />
      <p className="text-[#5A4A2A] text-sm mb-3">{data.introText || "הננו מתכבדים להזמינכם"}</p>
      <div className="text-[#4A3A1A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <p className="text-[#A08040] text-xl my-1">עב"ג</p>
      <div className="text-[#4A3A1A] text-4xl font-bold mb-3">{data.brideName || "הכלה"}</div>
      <GoldOrnament className="w-36 my-2" />
      <ParentsBlock data={data} color="#5A4A2A" size="sm" />
      <GrandparentsBlock data={data} color="#7A6A4A" />
      <div className="mt-4 text-[#4A3A1A]">
        <p className="text-lg font-bold">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-sm mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 21. ירושלמי מסורתי
export const Template21 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#F8F4E8] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-4 border-2 border-[#8B7B5A]" />
    <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[#8B7B5A] text-sm tracking-widest">❧</div>
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#8B7B5A] text-lg mb-1">בס"ד</p>
      <p className="text-[#5A4A2A] text-sm mb-1">"נעלה את ירושלים על ראש שמחתנו"</p>
      <div className="w-12 h-px bg-[#8B7B5A] my-3" />
      <p className="text-[#5A4A2A] text-sm mb-4">{data.introText || "הננו שמחים להזמינכם לחתונתנו"}</p>
      <div className="text-[#3A2A0A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <p className="text-[#8B7B5A] text-lg">עב"ג</p>
      <div className="text-[#3A2A0A] text-4xl font-bold mb-3">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#5A4A2A" size="sm" />
      <GrandparentsBlock data={data} color="#7A6A4A" />
      <div className="mt-4 text-[#3A2A0A]">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-sm text-[#5A4A2A] mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 22. ורוד-זהב גלאם
export const Template22 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#FFF0F5] to-[#FFE0EB] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-4 border-2 border-[#C4A35A]" />
    <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ backgroundImage: "radial-gradient(circle, #C4A35A 1px, transparent 1px)", backgroundSize: "15px 15px" }} />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-sm mb-4">בס"ד</p>
      <p className="text-[#8A5A6A] text-sm mb-5">{data.introText || "בשמחה רבה מזמינים אתכם"}</p>
      <div className="text-[#C4A35A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#E8A0B0] text-2xl my-2">♥</div>
      <div className="text-[#C4A35A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-20 h-px bg-[#C4A35A] my-3" />
      <ParentsBlock data={data} color="#8A5A6A" size="sm" />
      <div className="mt-6 bg-[#C4A35A] text-white px-8 py-3 rounded-sm">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 23. טורקיז מודרני
export const Template23 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-white p-6 relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
    <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#40B4B0] via-[#60D4D0] to-[#40B4B0]" />
    <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-[#40B4B0] via-[#60D4D0] to-[#40B4B0]" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#40B4B0] text-xs tracking-widest mb-8">SAVE THE DATE</p>
      <p className="text-gray-500 text-sm mb-4">{data.introText || "אנו שמחים להזמינכם"}</p>
      <div className="text-[#2A2A2A] text-4xl font-light mb-1">{data.groomName || "החתן"}</div>
      <div className="w-12 h-12 rounded-full border-2 border-[#40B4B0] flex items-center justify-center my-2">
        <span className="text-[#40B4B0] text-lg">&</span>
      </div>
      <div className="text-[#2A2A2A] text-4xl font-light mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#888" size="sm" />
      <div className="mt-8 bg-[#40B4B0] text-white px-8 py-3 rounded-full">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 24. שמנת קלאסי עם כתר
export const Template24 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#FFF8F0] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-5 border-2 border-[#C4A35A]/60 rounded-lg" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-2xl mb-1">👑</p>
      <p className="text-[#C4A35A] text-sm mb-2">בס"ד</p>
      <p className="text-[#6A5A3A] text-sm mb-4">{data.introText || "בסימן טוב ובמזל טוב"}</p>
      <div className="text-[#4A3A1A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-xl my-1">&</div>
      <div className="text-[#4A3A1A] text-4xl font-bold mb-3">{data.brideName || "הכלה"}</div>
      <div className="w-24 h-px bg-[#C4A35A] my-3" />
      <ParentsBlock data={data} color="#6A5A3A" size="sm" />
      <GrandparentsBlock data={data} color="#8A7A5A" />
      <div className="mt-5 border-2 border-[#C4A35A]/60 px-8 py-3 rounded-lg">
        <p className="text-[#4A3A1A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-[#6A5A3A] text-sm mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 25. כסוף מודרני
export const Template25 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#F0F0F0] to-[#E0E0E4] p-6 relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
    <div className="absolute inset-4 border-2 border-[#A0A0A8]" />
    <div className="absolute inset-6 border border-[#A0A0A8]/30" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#808088] text-xs tracking-widest mb-6">✦ בס"ד ✦</p>
      <p className="text-[#606068] text-sm mb-5">{data.introText || "מתכבדים להזמינכם"}</p>
      <div className="text-[#3A3A42] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#A0A0A8] text-xl my-2">&</div>
      <div className="text-[#3A3A42] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-20 h-px bg-[#A0A0A8] my-3" />
      <ParentsBlock data={data} color="#606068" size="sm" />
      <div className="mt-6 bg-[#3A3A42] text-white px-8 py-3">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 26. ורדרד עם פרחים
export const Template26 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-white p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <FloralCorner position="top-left" color="#D4A0B0" />
    <FloralCorner position="top-right" color="#D4A0B0" />
    <FloralCorner position="bottom-left" color="#D4A0B0" />
    <FloralCorner position="bottom-right" color="#D4A0B0" />
    <div className="absolute inset-8 border border-[#D4A0B0]/30 rounded-xl" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#D4A0B0] text-sm mb-4">בס"ד</p>
      <p className="text-[#8A6A7A] text-sm mb-4">{data.introText || "בשמחה ובברכה מזמינים אתכם"}</p>
      <div className="text-[#6A4A5A] text-3xl mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#D4A0B0] text-xl my-1">❀</div>
      <div className="text-[#6A4A5A] text-3xl mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#8A6A7A" />
      <GrandparentsBlock data={data} color="#A08090" />
      <div className="mt-5 bg-[#D4A0B0]/10 border border-[#D4A0B0]/30 px-8 py-3 rounded-xl">
        <p className="text-[#6A4A5A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 27. ירוק זית אלגנטי
export const Template27 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#F8F4E8] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-5 border border-[#6B7B4A]/30" />
    <div className="absolute top-6 left-1/2 -translate-x-1/2"><LeafDecoration color="#6B7B4A" /></div>
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rotate-180"><LeafDecoration color="#6B7B4A" /></div>
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#6B7B4A] text-sm mb-4">בס"ד</p>
      <p className="text-[#5A5A3A] text-sm mb-5">{data.introText || "בשמחה ובברכה"}</p>
      <div className="text-[#3A4A2A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#6B7B4A] text-xl my-2">&</div>
      <div className="text-[#3A4A2A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#5A5A3A" size="sm" />
      <GrandparentsBlock data={data} color="#7A7A5A" />
      <div className="mt-6 bg-[#6B7B4A] text-white px-8 py-3 rounded-sm">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 28. כחול רויאל
export const Template28 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#0A1A3A] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-4 border-2 border-[#4A7AB4]/40" />
    <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ backgroundImage: "radial-gradient(circle, #C4A35A 1px, transparent 1px)", backgroundSize: "25px 25px" }} />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-sm mb-4">בס"ד</p>
      <p className="text-[#8AABDA] text-sm mb-5">{data.introText || "בשמחה רבה מזמינים אתכם"}</p>
      <div className="text-white text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-2xl my-2">❖</div>
      <div className="text-white text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-20 h-px bg-[#C4A35A] my-3" />
      <ParentsBlock data={data} color="#8AABDA" size="sm" />
      <div className="mt-6 border-2 border-[#C4A35A] px-8 py-3">
        <p className="text-[#C4A35A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 29. לבנדר רך
export const Template29 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#F0E8F8] to-[#E8E0F0] p-8 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-6 border border-[#B0A0C8]/40 rounded-2xl" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#9080A8] text-sm mb-4">בס"ד</p>
      <p className="text-[#7060A0] text-sm italic mb-5">{data.introText || "בשמחה ובאהבה מזמינים אתכם"}</p>
      <div className="text-[#4A3A6A] text-3xl mb-2">{data.groomName || "החתן"}</div>
      <div className="text-[#B0A0C8] text-2xl my-1">✿</div>
      <div className="text-[#4A3A6A] text-3xl mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#7060A0" />
      <GrandparentsBlock data={data} color="#9080A8" />
      <div className="mt-6 bg-[#4A3A6A] text-white px-8 py-3 rounded-full">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 30. זהב על שנהב
export const Template30 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-[#FFFFF0] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-3 border-4 border-[#C4A35A]" />
    <div className="absolute inset-5 border-2 border-[#C4A35A]/40" />
    <div className="absolute inset-7 border border-[#C4A35A]/20" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-lg font-bold mb-2">בס"ד</p>
      <GoldOrnament className="w-40 mb-3" />
      <p className="text-[#6A5A3A] text-sm mb-3">{data.introText || "בסימן טוב ובמזל טוב הננו מזמינים"}</p>
      <div className="text-[#C4A35A] text-5xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#8A7A5A] text-lg my-1">עב"ג</div>
      <div className="text-[#C4A35A] text-5xl font-bold mb-3">{data.brideName || "הכלה"}</div>
      <GoldOrnament className="w-40 my-2" />
      <ParentsBlock data={data} color="#6A5A3A" size="sm" />
      <GrandparentsBlock data={data} color="#8A7A5A" />
      <div className="mt-4 bg-[#C4A35A] text-white px-10 py-3">
        <p className="text-xl font-bold">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 31. אפור-לבן מודרני
export const Template31 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-white to-[#F0F0F0] p-8 relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-gray-300 text-xs tracking-[0.5em] mb-8">THE WEDDING OF</p>
      <div className="text-gray-800 text-4xl font-light tracking-wider mb-2">{data.groomName || "החתן"}</div>
      <div className="flex items-center gap-4 my-3">
        <div className="w-16 h-px bg-gray-300" />
        <span className="text-gray-400 text-sm">AND</span>
        <div className="w-16 h-px bg-gray-300" />
      </div>
      <div className="text-gray-800 text-4xl font-light tracking-wider mb-6">{data.brideName || "הכלה"}</div>
      <p className="text-gray-500 text-sm max-w-xs mb-4">{data.introText || "אנו שמחים להזמינכם"}</p>
      <ParentsBlock data={data} color="#888" />
      <div className="mt-8 bg-gray-800 text-white px-10 py-4 rounded-sm">
        <p className="text-lg font-light tracking-wide">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 32. תכשיט זהב מרהיב
export const Template32 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#F8F0D8] to-[#E8D8B8] p-5 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-3 border-[3px] border-[#B8942A] rounded-sm" />
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 550">
      <circle cx="200" cy="60" r="25" fill="none" stroke="#B8942A" strokeWidth="1.5" opacity="0.3" />
      <circle cx="200" cy="490" r="25" fill="none" stroke="#B8942A" strokeWidth="1.5" opacity="0.3" />
      <path d="M175 60 L140 35 M225 60 L260 35" stroke="#B8942A" strokeWidth="1" opacity="0.3" />
      <path d="M175 490 L140 515 M225 490 L260 515" stroke="#B8942A" strokeWidth="1" opacity="0.3" />
    </svg>
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#B8942A] text-lg mb-2">בס"ד</p>
      <p className="text-[#6A5A3A] text-sm mb-4">{data.introText || "בשמחה ובברכה אנו מזמינים"}</p>
      <div className="text-[#4A3A1A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="flex items-center gap-3 my-2">
        <div className="w-8 h-px bg-[#B8942A]" />
        <span className="text-[#B8942A] text-lg">❖</span>
        <div className="w-8 h-px bg-[#B8942A]" />
      </div>
      <div className="text-[#4A3A1A] text-4xl font-bold mb-3">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#6A5A3A" size="sm" />
      <GrandparentsBlock data={data} color="#8A7A5A" />
      <div className="mt-5 border-2 border-[#B8942A] px-8 py-3">
        <p className="text-[#4A3A1A] text-lg font-bold">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-[#6A5A3A] text-sm mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 33. ניוד אלגנטי
export const Template33 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#F0E8E0] to-[#E8DDD4] p-8 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-7 border border-[#C4A08A]/30 rounded-xl" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#A0886A] text-sm mb-5">בס"ד</p>
      <p className="text-[#7A6A5A] text-sm mb-5">{data.introText || "בשמחה מזמינים אתכם"}</p>
      <div className="text-[#4A3A2A] text-3xl mb-2">{data.groomName || "החתן"}</div>
      <div className="text-[#C4A08A] text-lg my-1">♡</div>
      <div className="text-[#4A3A2A] text-3xl mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-16 h-px bg-[#C4A08A] my-3" />
      <ParentsBlock data={data} color="#7A6A5A" />
      <GrandparentsBlock data={data} color="#A09080" />
      <div className="mt-6 bg-[#4A3A2A] text-[#F0E8E0] px-8 py-3 rounded-lg">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 34. אדום דרמטי
export const Template34 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#8B0000] to-[#5A0000] p-6 relative overflow-hidden" style={{ fontFamily: "David, serif" }}>
    <div className="absolute inset-5 border border-[#C4A35A]/40" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-sm mb-4">בס"ד</p>
      <GoldOrnament className="w-32 mb-3" />
      <p className="text-[#E8C4C4] text-sm mb-4">{data.introText || "בשמחה אנו מזמינים אתכם"}</p>
      <div className="text-[#C4A35A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#E8C4C4] text-xl my-1">&</div>
      <div className="text-[#C4A35A] text-4xl font-bold mb-3">{data.brideName || "הכלה"}</div>
      <GoldOrnament className="w-32 my-2" />
      <ParentsBlock data={data} color="#E8C4C4" size="sm" />
      <div className="mt-5 border border-[#C4A35A] px-8 py-3">
        <p className="text-[#C4A35A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 35. פסים זהב
export const Template35 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-white p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ backgroundImage: "repeating-linear-gradient(90deg, #C4A35A 0px, #C4A35A 1px, transparent 1px, transparent 20px)" }} />
    <div className="absolute top-6 left-6 right-6 h-px bg-[#C4A35A]" />
    <div className="absolute bottom-6 left-6 right-6 h-px bg-[#C4A35A]" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-sm mb-4">בס"ד</p>
      <p className="text-[#6A6A5A] text-sm mb-5">{data.introText || "מתכבדים להזמינכם"}</p>
      <div className="text-[#2A2A1A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-xl my-2">✦</div>
      <div className="text-[#2A2A1A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#6A6A5A" size="sm" />
      <GrandparentsBlock data={data} color="#8A8A7A" />
      <div className="mt-6 bg-[#C4A35A] text-white px-10 py-3">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 36. ירוק אמרלד
export const Template36 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#0A3A2A] to-[#052A1A] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-5 border border-[#C4A35A]/40" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-sm mb-4">בס"ד</p>
      <p className="text-[#8ABAA0] text-sm mb-5">{data.introText || "בשמחה מזמינים אתכם"}</p>
      <div className="text-[#C4A35A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#8ABAA0] text-xl my-2">&</div>
      <div className="text-[#C4A35A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-20 h-px bg-[#C4A35A] my-3" />
      <ParentsBlock data={data} color="#8ABAA0" size="sm" />
      <div className="mt-6 border-2 border-[#C4A35A] px-8 py-3">
        <p className="text-[#C4A35A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 37. חלום ורוד
export const Template37 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-br from-[#FFE8F0] via-[#FFF0F5] to-[#F0E0F8] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #E8A0C0, transparent)" }} />
    <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #C0A0E8, transparent)" }} />
    <div className="absolute inset-6 border border-[#E8B0C8]/30 rounded-2xl" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C090A8] text-sm mb-4">בס"ד</p>
      <p className="text-[#8A6A7A] text-sm italic mb-5">{data.introText || "בשמחה ובאהבה"}</p>
      <div className="text-[#6A4A5A] text-4xl mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#E8B0C8] text-2xl my-2">♥</div>
      <div className="text-[#6A4A5A] text-4xl mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#8A6A7A" />
      <GrandparentsBlock data={data} color="#A08090" />
      <div className="mt-6 bg-[#6A4A5A] text-white px-8 py-3 rounded-full">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 38. שחור-לבן קלאסי
export const Template38 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-white p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-4 border-2 border-black" />
    <div className="absolute inset-6 border border-black/20" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-gray-600 text-sm mb-5">בס"ד</p>
      <p className="text-gray-600 text-sm mb-4">{data.introText || "מתכבדים להזמינכם"}</p>
      <div className="text-black text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-gray-400 text-xl my-2">&</div>
      <div className="text-black text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <div className="w-20 h-px bg-black my-3" />
      <ParentsBlock data={data} color="#444" size="sm" />
      <GrandparentsBlock data={data} color="#666" />
      <div className="mt-6 bg-black text-white px-8 py-3">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-sm text-gray-300 mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// 39. כתום שקיעה
export const Template39 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-gradient-to-b from-[#FFF0E0] via-[#FFE0C0] to-[#F8D0A0] p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-5 border border-[#C48A3A]/30 rounded-lg" />
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C48A3A] text-sm mb-4">בס"ד</p>
      <p className="text-[#8A6A3A] text-sm mb-5">{data.introText || "בשמחה אנו מזמינים אתכם"}</p>
      <div className="text-[#4A2A0A] text-4xl font-bold mb-1">{data.groomName || "החתן"}</div>
      <div className="text-[#C48A3A] text-2xl my-2">☀</div>
      <div className="text-[#4A2A0A] text-4xl font-bold mb-4">{data.brideName || "הכלה"}</div>
      <ParentsBlock data={data} color="#8A6A3A" size="sm" />
      <GrandparentsBlock data={data} color="#A08050" />
      <div className="mt-6 bg-[#C48A3A] text-white px-8 py-3 rounded-lg">
        <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
      </div>
    </div>
  </div>
));

// 40. יהלום לבן פרימיום
export const Template40 = forwardRef<HTMLDivElement, TemplateProps>(({ data }, ref) => (
  <div ref={ref} className="w-[400px] h-[550px] bg-white p-6 relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, #000 10px, #000 11px)" }} />
    <div className="absolute inset-5 border border-[#E0E0E0]" />
    <svg className="absolute top-4 left-1/2 -translate-x-1/2" width="40" height="30" viewBox="0 0 40 30">
      <polygon points="20,2 38,12 30,28 10,28 2,12" fill="none" stroke="#C4A35A" strokeWidth="1.5" />
      <polygon points="20,6 32,14 26,25 14,25 8,14" fill="none" stroke="#C4A35A" strokeWidth="0.5" opacity="0.4" />
    </svg>
    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
      <p className="text-[#C4A35A] text-xs tracking-widest mb-6">בס"ד</p>
      <p className="text-gray-500 text-sm mb-5">{data.introText || "מתכבדים להזמינכם"}</p>
      <div className="text-[#2A2A2A] text-4xl mb-2" style={{ letterSpacing: "0.05em" }}>{data.groomName || "החתן"}</div>
      <div className="text-[#C4A35A] text-xl my-1">💎</div>
      <div className="text-[#2A2A2A] text-4xl mb-4" style={{ letterSpacing: "0.05em" }}>{data.brideName || "הכלה"}</div>
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent my-3" />
      <ParentsBlock data={data} color="#666" size="sm" />
      <GrandparentsBlock data={data} color="#888" />
      <div className="mt-6 border border-[#C4A35A] px-8 py-3">
        <p className="text-[#2A2A2A] text-lg">{data.eventDate || "תאריך האירוע"}</p>
        {data.venueName && <p className="text-gray-500 text-sm mt-1">{data.venueName}</p>}
      </div>
    </div>
  </div>
));

// Set display names
const allTemplateComponents = [
  Template1, Template2, Template3, Template4, Template5, Template6, Template7, Template8,
  Template9, Template10, Template11, Template12, Template13, Template14, Template15, Template16,
  Template17, Template18, Template19, Template20, Template21, Template22, Template23, Template24,
  Template25, Template26, Template27, Template28, Template29, Template30, Template31, Template32,
  Template33, Template34, Template35, Template36, Template37, Template38, Template39, Template40,
];

allTemplateComponents.forEach((c, i) => { c.displayName = `Template${i + 1}`; });

// Backwards compatibility
export const ClassicTemplate = Template1;
export const ModernTemplate = Template2;
export const RomanticTemplate = Template3;
export const ElegantTemplate = Template4;

export const templates = [
  { id: 1, name: "קלאסי זהב", Component: Template1 },
  { id: 2, name: "מודרני גיאומטרי", Component: Template2 },
  { id: 3, name: "רומנטי ורוד", Component: Template3 },
  { id: 4, name: "אלגנטי מינימלי", Component: Template4 },
  { id: 5, name: "שיש יוקרתי", Component: Template5 },
  { id: 6, name: "כחול מלכותי", Component: Template6 },
  { id: 7, name: "טבעי ירוק", Component: Template7 },
  { id: 8, name: "ארט דקו", Component: Template8 },
  { id: 9, name: "צבעי מים", Component: Template9 },
  { id: 10, name: "שחור-זהב", Component: Template10 },
  { id: 11, name: "ורוד מאובק", Component: Template11 },
  { id: 12, name: "לבן טהור", Component: Template12 },
  { id: 13, name: "בורדו אלגנטי", Component: Template13 },
  { id: 14, name: "תכלת ים-תיכוני", Component: Template14 },
  { id: 15, name: "סגול מלכותי", Component: Template15 },
  { id: 16, name: "כפרי חום", Component: Template16 },
  { id: 17, name: "ורד זהב", Component: Template17 },
  { id: 18, name: "טיפוגרפי מודגש", Component: Template18 },
  { id: 19, name: "פסטלי עדין", Component: Template19 },
  { id: 20, name: "מוזהב עתיק", Component: Template20 },
  { id: 21, name: "ירושלמי מסורתי", Component: Template21 },
  { id: 22, name: "ורוד-זהב גלאם", Component: Template22 },
  { id: 23, name: "טורקיז מודרני", Component: Template23 },
  { id: 24, name: "שמנת עם כתר", Component: Template24 },
  { id: 25, name: "כסוף מודרני", Component: Template25 },
  { id: 26, name: "פרחוני ורדרד", Component: Template26 },
  { id: 27, name: "זית אלגנטי", Component: Template27 },
  { id: 28, name: "כחול רויאל", Component: Template28 },
  { id: 29, name: "לבנדר רך", Component: Template29 },
  { id: 30, name: "זהב על שנהב", Component: Template30 },
  { id: 31, name: "אפור מודרני", Component: Template31 },
  { id: 32, name: "תכשיט זהב", Component: Template32 },
  { id: 33, name: "ניוד אלגנטי", Component: Template33 },
  { id: 34, name: "אדום דרמטי", Component: Template34 },
  { id: 35, name: "פסים זהב", Component: Template35 },
  { id: 36, name: "אמרלד ירוק", Component: Template36 },
  { id: 37, name: "חלום ורוד", Component: Template37 },
  { id: 38, name: "שחור-לבן קלאסי", Component: Template38 },
  { id: 39, name: "שקיעה כתום", Component: Template39 },
  { id: 40, name: "יהלום פרימיום", Component: Template40 },
];
