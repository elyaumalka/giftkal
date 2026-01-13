import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  const formatMonthShort = (date: string) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${year}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#051839] text-white p-6 rounded-t-2xl">
          {/* Empty header like in design */}
        </div>
        
        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 mb-4 px-4">
            <span className="text-right">חשבונית</span>
            <span className="text-right">עבור</span>
            <span className="text-right">סכום התשלום</span>
            <span className="text-right">תאריך</span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-3">
            {invoices?.map((invoice: any) => (
              <div 
                key={invoice.id} 
                className="grid grid-cols-4 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm border-r-4 border-[#051839]"
              >
                <span>
                  {invoice.file_url ? (
                    <a 
                      href={invoice.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-2 rounded-full bg-[#C41E3A] text-white font-medium hover:bg-[#C41E3A]/90 transition-colors text-center"
                    >
                      הורדת חשבונית
                    </a>
                  ) : (
                    <button 
                      disabled 
                      className="inline-block px-6 py-2 rounded-full bg-[#C41E3A] text-white font-medium opacity-50 cursor-not-allowed text-center"
                    >
                      הורדת חשבונית
                    </button>
                  )}
                </span>
                <span className="text-[#051839] font-bold text-right">
                  {formatMonthShort(invoice.for_month)}
                </span>
                <span className="font-bold text-[#051839] text-right">
                  ₪{Number(invoice.amount).toLocaleString()}
                </span>
                <span className="font-bold text-[#051839] text-right">
                  {formatDate(invoice.created_at)}
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