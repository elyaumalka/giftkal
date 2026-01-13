import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";

export default function VenueInvoices() {
  const { data: invoices } = useQuery({
    queryKey: ["venue-invoices"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!venue) return [];

      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("venue_id", venue.id)
        .order("for_month", { ascending: false });

      return data || [];
    },
  });

  const formatMonth = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#051839]">חשבוניות</h1>
        <p className="text-gray-500 mt-1">צפייה והורדת חשבוניות</p>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#051839] text-white p-4">
          <h2 className="text-lg font-semibold">היסטוריית חשבוניות</h2>
        </div>
        
        <div className="p-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 mb-4 px-4">
            <span>תאריך</span>
            <span>סכום</span>
            <span>עבור חודש</span>
            <span>הורדה</span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-2">
            {invoices?.map((invoice: any) => (
              <div 
                key={invoice.id} 
                className="grid grid-cols-4 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm"
              >
                <span className="text-[#051839]">
                  {new Date(invoice.created_at).toLocaleDateString("he-IL")}
                </span>
                <span className="font-medium text-[#95742F]">
                  ₪{Number(invoice.amount).toLocaleString()}
                </span>
                <span className="text-gray-600">{formatMonth(invoice.for_month)}</span>
                <span>
                  {invoice.file_url ? (
                    <a 
                      href={invoice.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-[#051839] flex items-center justify-center text-white hover:bg-[#051839]/80 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  ) : (
                    <button 
                      disabled 
                      className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </span>
              </div>
            ))}
            
            {!invoices?.length && (
              <div className="text-center py-8 text-gray-500">
                אין חשבוניות להצגה
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
