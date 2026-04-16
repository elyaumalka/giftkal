import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Gift, Send, Monitor, Sparkles, CheckCircle, Clock, AlertTriangle, RefreshCw, Upload, FileCheck } from "lucide-react";
import StatIcon from "@/assets/icons/event/StatIcon.svg";
import { Badge } from "@/components/ui/badge";

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

  // Seller status query - only when seller exists
  const { data: sellerStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["seller-status-dashboard", data?.event?.id],
    queryFn: async () => {
      const response = await supabase.functions.invoke('payme-seller-status', {
        body: { eventId: data!.event!.id },
      });
      if (response.error) return null;
      if (response.data?.error) return null;
      return response.data;
    },
    enabled: !!data?.event?.id && !!data?.event?.seller_payme_id && data?.event?.gifts_enabled === true,
    refetchInterval: 120000,
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
      {/* PayMe Setup Alert - no seller at all */}
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

      {/* Seller Status Banner - seller exists */}
      {giftsEnabled && data?.event?.seller_payme_id && sellerStatus && (
        <>
          {/* Approved */}
          {sellerStatus.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-green-800">חשבון סליקה מאושר ✅</h3>
                    <Badge className="bg-green-500 text-white text-xs">פעיל</Badge>
                  </div>
                  <p className="text-green-700 text-sm">החשבון שלך מוכן לקבל תשלומים מהאורחים</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/event/${data.event.id}/payme-setup`)}>
                  פרטים
                </Button>
              </div>
            </div>
          )}

          {/* Pending */}
          {sellerStatus.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-amber-800">חשבון סליקה בבדיקה ⏳</h3>
                    <Badge className="bg-amber-500 text-white text-xs">ממתין לאישור</Badge>
                  </div>
                  <p className="text-amber-700 text-sm">החשבון נמצא בתהליך אישור (עד 24 שעות)</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetchStatus()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Missing Info */}
          {sellerStatus.status === 'missing_info' && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-orange-800">נדרשת השלמת פרטים ⚠️</h3>
                    <Badge variant="destructive" className="text-xs">פעולה נדרשת</Badge>
                  </div>
                  <p className="text-orange-700 text-sm mb-2">
                    חסרים פרטים כדי שחשבון הסליקה יאושר:
                  </p>
                  <ul className="text-orange-700 text-sm list-disc list-inside mb-3">
                    {sellerStatus.missingFields?.filter((f: any) => f.required).map((f: any) => (
                      <li key={f.field}>{f.label}</li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => navigate(`/event/${data.event.id}/payme-setup`)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    size="sm"
                  >
                    השלם פרטים
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* KYC Documents Banner - always show when docs not approved */}
      {data?.event && (data.event as any).kyc_docs_status !== 'approved' && (
        (() => {
          const kycStatus = (data.event as any).kyc_docs_status;
          const setupData = data.event.payment_setup_data as any;
          const isRejected = kycStatus === 'rejected';
          const rejectionReason = setupData?.kyc_rejection_reason;
          return (
            <div className={`${isRejected ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} border rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full ${isRejected ? 'bg-red-100' : 'bg-blue-100'} flex items-center justify-center flex-shrink-0`}>
                  <Upload className={`w-5 h-5 ${isRejected ? 'text-red-600' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-base font-bold ${isRejected ? 'text-red-800' : 'text-blue-800'}`}>
                      {isRejected ? 'המסמכים נדחו — יש להעלות מחדש ❌'
                        : kycStatus === 'pending' ? 'מסמכים ממתינים לאישור ⏳'
                        : 'נדרשים מסמכים להעברת כספים 📄'}
                    </h3>
                    {kycStatus === 'pending' && (
                      <Badge className="bg-amber-500 text-white text-xs">ממתין</Badge>
                    )}
                    {isRejected && (
                      <Badge variant="destructive" className="text-xs">נדחה</Badge>
                    )}
                  </div>
                  {isRejected && rejectionReason && (
                    <p className="text-red-700 text-sm mb-2 font-medium">סיבה: {rejectionReason}</p>
                  )}
                  <p className={`${isRejected ? 'text-red-700' : 'text-blue-700'} text-sm mb-2`}>
                    {kycStatus === 'pending'
                      ? 'המסמכים נשלחו ונמצאים בבדיקה'
                      : 'בשביל העברת הכספים יש לצרף צילום תעודת זהות ואישור ניהול חשבון בנק'
                    }
                  </p>
                  {kycStatus !== 'pending' && (
                    <Button 
                      onClick={() => navigate(`/event/${data.event.id}/payme-setup`)}
                      size="sm"
                      className={isRejected ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      העלאת מסמכים
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })()
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
              onClick={() => navigate("/event/upgrade")}
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