import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Gift, Send, Monitor, Sparkles } from "lucide-react";
import StatIcon from "@/assets/icons/event/StatIcon.svg";

export default function EventDashboard() {
  const navigate = useNavigate();

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

  const giftsEnabled = data?.event?.gifts_enabled;
  const invitationsEnabled = data?.event?.invitations_enabled;

  // Check which upgrades are available
  const availableUpgrades = [
    ...(!giftsEnabled ? [{ icon: Gift, title: "מתנות באשראי", desc: "קבלו מתנות מהאורחים בכרטיס אשראי", price: 199 }] : []),
    ...(!invitationsEnabled ? [{ icon: Send, title: "הזמנות + אישורי הגעה", desc: "שליחת הזמנות ומעקב אישורים", price: 199 }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* PayMe Setup Alert - only for users with gifts enabled */}
      {giftsEnabled && data?.event && !data.event.seller_payme_id && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-800 mb-1">
                הקימו חשבון סליקה כדי לקבל מתנות
              </h3>
              <p className="text-amber-700 text-sm mb-4">
                כדי שהאורחים יוכלו לשלם במתנות באשראי, יש להקים חשבון סליקה.
                זה לוקח כ-2 דקות.
              </p>
              <Button 
                onClick={() => navigate(`/event/${data.event.id}/payme-setup`)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <CreditCard className="w-4 h-4 ml-2" />
                הקמת חשבון סליקה
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Gift */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
          <img src={StatIcon} alt="Stats" className="w-12 h-12 mb-3" />
          <p className="text-4xl font-bold text-[#051839] mb-1">{data?.avgGift || 0}</p>
          <p className="text-[#051839] font-medium text-sm">ממוצע מתנה</p>
        </div>
        
        {/* Gift Givers */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
          <img src={StatIcon} alt="Stats" className="w-12 h-12 mb-3" />
          <p className="text-4xl font-bold text-[#051839] mb-1">{data?.giftCount || 0}</p>
          <p className="text-[#051839] font-medium text-sm">נותני מתנות</p>
        </div>
        
        {/* Total Gifts */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
          <img src={StatIcon} alt="Stats" className="w-12 h-12 mb-3" />
          <p className="text-4xl font-bold text-[#95742F] mb-1">₪{(data?.totalGifts || 0).toLocaleString()}</p>
          <p className="text-[#051839] font-medium text-sm">סך המתנות</p>
        </div>
        
        {/* Guest Count */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
          <img src={StatIcon} alt="Stats" className="w-12 h-12 mb-3" />
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

      {/* Upsell Banner - show when user doesn't have all services */}
      {availableUpgrades.length > 0 && (
        <div className="bg-gradient-to-br from-[#051839] to-[#0a2d5e] rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#C4A35A]" />
              </div>
              <div>
                <h2 className="text-xl font-bold">שדרגו את האירוע שלכם!</h2>
                <p className="text-white/70 text-sm">הוסיפו שירותים נוספים והפכו את האירוע לבלתי נשכח</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {availableUpgrades.map((upgrade, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#C4A35A]/20 rounded-lg flex items-center justify-center shrink-0">
                    <upgrade.icon className="w-5 h-5 text-[#C4A35A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{upgrade.title}</p>
                    <p className="text-white/60 text-xs">{upgrade.desc}</p>
                  </div>
                  <span className="text-[#C4A35A] font-bold text-sm">₪{upgrade.price}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/signup")}
              className="bg-[#C4A35A] hover:bg-[#b3943f] text-white rounded-xl px-8 py-3 font-bold"
            >
              שדרגו עכשיו
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}