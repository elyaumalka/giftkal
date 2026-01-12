import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, Gift, TrendingUp, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      const upcomingPayments = transactions?.filter((t) => (t.installments || 1) > 1) || [];

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
      <div>
        <h1 className="text-3xl font-bold">דשבורד</h1>
        <p className="text-muted-foreground mt-1">
          {data?.event?.groom_name && data?.event?.bride_name
            ? `${data.event.groom_name} & ${data.event.bride_name}`
            : "האירוע שלי"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="כמות מוזמנים"
          value={data?.guestCount || 0}
          icon={Users}
        />
        <StatCard
          title="סך המתנות"
          value={`₪${(data?.totalGifts || 0).toLocaleString()}`}
          icon={Gift}
          variant="gold"
        />
        <StatCard
          title="נותני מתנות"
          value={data?.giftCount || 0}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="ממוצע מתנה"
          value={`₪${(data?.avgGift || 0).toLocaleString()}`}
          icon={Calculator}
        />
      </div>

      {/* Upcoming Payments */}
      {data?.upcomingPayments && data.upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>תשלומים עתידיים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingPayments.map((payment: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">₪{Number(payment.amount).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.installments} תשלומים
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(payment.transaction_date).toLocaleDateString("he-IL")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
