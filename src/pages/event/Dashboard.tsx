import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CheersIcon from "@/assets/icons/venue/Cheers.svg";

export default function EventDashboard() {
  const { data } = useQuery({
    queryKey: ["event-dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user's event
      const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!event) return null;

      // Get guests count
      const { count: guestCount } = await supabase
        .from("guests")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id);

      // Get transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, installments, transaction_date")
        .eq("event_id", event.id);

      const totalGifts = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const giftCount = transactions?.length || 0;
      const avgGift = giftCount > 0 ? Math.round(totalGifts / giftCount) : 0;

      // Calculate upcoming payments (installments)
      const upcomingPayments = transactions?.filter((t) => (t.installments || 1) > 1).slice(0, 3) || [];

      return {
        event,
        guestCount: guestCount || 0,
        totalGifts,
        giftCount,
        avgGift,
        upcomingPayments,
      };
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Gift */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
          <img src={CheersIcon} alt="Stats" className="w-12 h-12 mb-3" />
          <p className="text-4xl font-bold text-[#051839] mb-1">{data?.avgGift || 0}</p>
          <p className="text-[#051839] font-medium text-sm">ממוצע מתנה</p>
        </div>
        
        {/* Gift Givers */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
          <img src={CheersIcon} alt="Stats" className="w-12 h-12 mb-3" />
          <p className="text-4xl font-bold text-[#051839] mb-1">{data?.giftCount || 0}</p>
          <p className="text-[#051839] font-medium text-sm">נותני מתנות</p>
        </div>
        
        {/* Total Gifts */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
          <img src={CheersIcon} alt="Stats" className="w-12 h-12 mb-3" />
          <p className="text-4xl font-bold text-[#95742F] mb-1">₪{(data?.totalGifts || 0).toLocaleString()}</p>
          <p className="text-[#051839] font-medium text-sm">סך המתנות</p>
        </div>
        
        {/* Guest Count */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
          <img src={CheersIcon} alt="Stats" className="w-12 h-12 mb-3" />
          <p className="text-4xl font-bold text-[#051839] mb-1">{data?.guestCount || 0}</p>
          <p className="text-[#051839] font-medium text-sm">כמות מוזמנים</p>
        </div>
      </div>

      {/* Upcoming Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Title */}
          <h2 className="text-xl font-bold text-[#051839] mb-6 text-right">תאריכי תשלום קרובים</h2>
          
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500 mb-4 px-4">
            <span className="text-right">כמה נותר לתשלום</span>
            <span className="text-right">תאריך</span>
            <span className="text-right">סכום</span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-3">
            {data?.upcomingPayments?.map((payment: any, index: number) => {
              const remainingAmount = Number(payment.amount) * ((payment.installments || 1) - 1);
              return (
                <div 
                  key={index} 
                  className="grid grid-cols-3 gap-4 items-center bg-gray-100 rounded-xl p-4 text-sm"
                >
                  <span className="font-bold text-[#051839] text-right">
                    ₪{remainingAmount.toLocaleString()}
                  </span>
                  <span className="font-bold text-[#051839] text-right">
                    {new Date(payment.transaction_date).toLocaleDateString("he-IL")}
                  </span>
                  <span className="font-bold text-[#051839] text-right">
                    ₪{Number(payment.amount).toLocaleString()}
                  </span>
                </div>
              );
            })}
            
            {(!data?.upcomingPayments || data.upcomingPayments.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                אין תשלומים קרובים
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}