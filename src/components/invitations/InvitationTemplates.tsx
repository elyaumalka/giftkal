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

// תבנית קלאסית ומסורתית - זהב עם מסגרת מעוטרת
export const ClassicTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ data }, ref) => (
    <div
      ref={ref}
      className="w-[400px] h-[550px] bg-gradient-to-b from-[#FDF8E8] to-[#F5EDD6] p-6 relative overflow-hidden"
      style={{ fontFamily: "David, serif" }}
    >
      {/* מסגרת זהב מעוטרת */}
      <div className="absolute inset-4 border-4 border-[#C4A35A] rounded-lg" />
      <div className="absolute inset-6 border-2 border-[#C4A35A]/50 rounded-lg" />
      
      {/* פינות מעוטרות */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[#C4A35A] rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[#C4A35A] rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[#C4A35A] rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[#C4A35A] rounded-br-lg" />
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
        <p className="text-[#C4A35A] text-lg mb-2">בס"ד</p>
        
        <p className="text-[#5A4A2A] text-sm mb-4">{data.introText || "בשמחה רבה אנו מזמינים אתכם לחתונתנו"}</p>
        
        <div className="text-[#C4A35A] text-4xl font-bold mb-2">
          {data.groomName || "החתן"} & {data.brideName || "הכלה"}
        </div>
        
        <div className="w-16 h-0.5 bg-[#C4A35A] my-4" />
        
        <div className="text-[#5A4A2A] text-sm space-y-1">
          {data.groomParents && <p>הורי החתן: {data.groomParents}</p>}
          {data.brideParents && <p>הורי הכלה: {data.brideParents}</p>}
        </div>
        
        {(data.groomGrandparents || data.brideGrandparents) && (
          <div className="text-[#5A4A2A] text-xs mt-2 space-y-1">
            {data.groomGrandparents && <p>סבי החתן: {data.groomGrandparents}</p>}
            {data.brideGrandparents && <p>סבי הכלה: {data.brideGrandparents}</p>}
          </div>
        )}
        
        <div className="mt-6 text-[#5A4A2A]">
          <p className="text-lg font-semibold">{data.eventDate || "תאריך האירוע"}</p>
          {data.venueName && <p className="text-sm mt-1">{data.venueName}</p>}
        </div>
      </div>
    </div>
  )
);

// תבנית מודרנית ועכשווית - גיאומטרית
export const ModernTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ data }, ref) => (
    <div
      ref={ref}
      className="w-[400px] h-[550px] bg-white p-6 relative overflow-hidden"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* צורות גיאומטריות */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-[#E8B4BC]" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-[#B4C7E8]" />
      
      {/* משולש גיאומטרי */}
      <svg className="absolute top-20 right-8 w-24 h-24 opacity-20" viewBox="0 0 100 100">
        <polygon points="50,10 90,90 10,90" fill="none" stroke="#C4A35A" strokeWidth="2" />
      </svg>
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
        <p className="text-gray-400 text-sm tracking-widest mb-6">WEDDING INVITATION</p>
        
        <div className="text-[#051839] text-5xl font-light tracking-wider mb-1">
          {data.groomName || "החתן"}
        </div>
        <div className="text-[#C4A35A] text-2xl my-2">&</div>
        <div className="text-[#051839] text-5xl font-light tracking-wider mb-4">
          {data.brideName || "הכלה"}
        </div>
        
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent my-6" />
        
        <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
          {data.introText || "בשמחה רבה אנו מזמינים אתכם לחגוג איתנו את יום חתונתנו"}
        </p>
        
        <div className="mt-6 space-y-1 text-gray-500 text-sm">
          {data.groomParents && <p>{data.groomParents}</p>}
          {data.brideParents && <p>{data.brideParents}</p>}
        </div>
        
        <div className="mt-8 bg-[#051839] text-white px-8 py-3 rounded-sm">
          <p className="text-lg">{data.eventDate || "תאריך האירוע"}</p>
        </div>
      </div>
    </div>
  )
);

// תבנית רומנטית ופרחונית
export const RomanticTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ data }, ref) => (
    <div
      ref={ref}
      className="w-[400px] h-[550px] bg-gradient-to-b from-[#FFF5F5] to-[#FDE8E8] p-6 relative overflow-hidden"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* פרחים דקורטיביים */}
      <div className="absolute top-0 left-0 w-full h-24 opacity-30">
        <div className="absolute top-4 left-8 w-8 h-8 bg-[#E8B4BC] rounded-full" />
        <div className="absolute top-8 left-20 w-6 h-6 bg-[#D4A5AD] rounded-full" />
        <div className="absolute top-2 left-32 w-10 h-10 bg-[#E8C4CC] rounded-full" />
        <div className="absolute top-6 right-8 w-8 h-8 bg-[#E8B4BC] rounded-full" />
        <div className="absolute top-10 right-20 w-6 h-6 bg-[#D4A5AD] rounded-full" />
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-24 opacity-30">
        <div className="absolute bottom-4 left-8 w-8 h-8 bg-[#E8B4BC] rounded-full" />
        <div className="absolute bottom-8 left-24 w-6 h-6 bg-[#D4A5AD] rounded-full" />
        <div className="absolute bottom-6 right-8 w-8 h-8 bg-[#E8B4BC] rounded-full" />
        <div className="absolute bottom-2 right-24 w-10 h-10 bg-[#E8C4CC] rounded-full" />
      </div>
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
        <p className="text-[#8B6B6B] text-sm italic mb-4">בס"ד</p>
        
        <p className="text-[#8B6B6B] text-sm mb-6 italic max-w-xs">
          {data.introText || "בשמחה ובהתרגשות אנו מזמינים אתכם לחגוג איתנו"}
        </p>
        
        <div className="text-[#8B4B5B] text-4xl italic mb-1">
          {data.groomName || "החתן"}
        </div>
        <div className="text-[#C4A35A] text-3xl my-1">♥</div>
        <div className="text-[#8B4B5B] text-4xl italic mb-4">
          {data.brideName || "הכלה"}
        </div>
        
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#E8B4BC] to-transparent my-4" />
        
        <div className="text-[#8B6B6B] text-sm space-y-1">
          {data.groomParents && <p>הורי החתן: {data.groomParents}</p>}
          {data.brideParents && <p>הורי הכלה: {data.brideParents}</p>}
        </div>
        
        <div className="mt-6 border border-[#E8B4BC] px-6 py-3 rounded-lg">
          <p className="text-[#8B4B5B] text-lg">{data.eventDate || "תאריך האירוע"}</p>
          {data.venueName && <p className="text-[#8B6B6B] text-sm mt-1">{data.venueName}</p>}
        </div>
      </div>
    </div>
  )
);

// תבנית אלגנטית ופשוטה
export const ElegantTemplate = forwardRef<HTMLDivElement, TemplateProps>(
  ({ data }, ref) => (
    <div
      ref={ref}
      className="w-[400px] h-[550px] bg-[#FAFAF8] p-8 relative overflow-hidden"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      {/* מסגרת דקה */}
      <div className="absolute inset-6 border border-[#D4D0C8]" />
      
      {/* קווים דקורטיביים */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-20 h-px bg-[#C4A35A]" />
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-20 h-px bg-[#C4A35A]" />
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" dir="rtl">
        <p className="text-[#8B8B7A] text-xs tracking-[0.3em] mb-8">הזמנה לחתונה</p>
        
        <div className="text-[#3A3A32] text-3xl tracking-wide mb-2">
          {data.groomName || "החתן"}
        </div>
        <div className="text-[#C4A35A] text-xl my-2">✦</div>
        <div className="text-[#3A3A32] text-3xl tracking-wide mb-6">
          {data.brideName || "הכלה"}
        </div>
        
        <p className="text-[#6B6B5A] text-sm max-w-[280px] leading-relaxed mb-6">
          {data.introText || "בשמחה רבה אנו מזמינים אתכם לחגוג איתנו את יום חתונתנו"}
        </p>
        
        <div className="text-[#6B6B5A] text-sm space-y-1 mb-6">
          {data.groomParents && <p>{data.groomParents}</p>}
          {data.brideParents && <p>{data.brideParents}</p>}
        </div>
        
        <div className="border-t border-b border-[#D4D0C8] py-4 px-8">
          <p className="text-[#3A3A32] text-lg">{data.eventDate || "תאריך האירוע"}</p>
          {data.venueName && <p className="text-[#6B6B5A] text-sm mt-1">{data.venueName}</p>}
        </div>
      </div>
    </div>
  )
);

ClassicTemplate.displayName = "ClassicTemplate";
ModernTemplate.displayName = "ModernTemplate";
RomanticTemplate.displayName = "RomanticTemplate";
ElegantTemplate.displayName = "ElegantTemplate";

export const templates = [
  { id: 1, name: "קלאסי ומסורתי", Component: ClassicTemplate },
  { id: 2, name: "מודרני ועכשווי", Component: ModernTemplate },
  { id: 3, name: "רומנטי ופרחוני", Component: RomanticTemplate },
  { id: 4, name: "אלגנטי ופשוט", Component: ElegantTemplate },
];
