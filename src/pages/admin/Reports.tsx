import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3, TrendingUp, Users, Calendar, Download, Filter,
  CreditCard, UserPlus, Building2, Gift, Loader2
} from "lucide-react";
import * as XLSX from "xlsx";

export default function Reports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterVenueId, setFilterVenueId] = useState("all");

  // ── Data Queries ──
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["report-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, amount, payer_name, transaction_date, event_id, venue_id, payment_status, relationship")
        .order("transaction_date", { ascending: false });
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["report-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, event_date, event_type, groom_name, bride_name, owner_id, venue_id, gifts_enabled, invitations_enabled, rsvp_enabled")
        .order("event_date", { ascending: false });
      return data || [];
    },
  });

  const { data: venues } = useQuery({
    queryKey: ["report-venues"],
    queryFn: async () => {
      const { data } = await supabase.from("venues").select("id, name, created_at, monthly_subscription").order("name");
      return data || [];
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["report-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, lead_type, status, created_at").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: billingCharges } = useQuery({
    queryKey: ["report-billing"],
    queryFn: async () => {
      const { data } = await supabase.from("billing_charges").select("id, amount, plan_name, created_at, owner_name, venue_name").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["report-guests"],
    queryFn: async () => {
      const { data } = await supabase.from("guests").select("id, rsvp_status, event_id, number_of_guests").limit(5000);
      return data || [];
    },
  });

  // ── Filtered Data ──
  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((t) => {
      const tDate = t.transaction_date?.split("T")[0] || "";
      if (dateFrom && tDate < dateFrom) return false;
      if (dateTo && tDate > dateTo) return false;
      if (filterVenueId !== "all" && t.venue_id !== filterVenueId) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo, filterVenueId]);

  const filteredEvents = useMemo(() => {
    return (events || []).filter((e) => {
      if (dateFrom && e.event_date < dateFrom) return false;
      if (dateTo && e.event_date > dateTo) return false;
      if (filterVenueId !== "all" && e.venue_id !== filterVenueId) return false;
      return true;
    });
  }, [events, dateFrom, dateTo, filterVenueId]);

  // ── Stats ──
  const totalGiftAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const avgGift = filteredTransactions.length > 0 ? totalGiftAmount / filteredTransactions.length : 0;
  const completedTx = filteredTransactions.filter(t => t.payment_status === "completed");
  const totalCompleted = completedTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalBilling = (billingCharges || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

  // Monthly breakdown
  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, { gifts: number; billing: number; count: number }>();
    filteredTransactions.forEach((t) => {
      const month = (t.transaction_date || "").substring(0, 7);
      if (!month) return;
      const entry = map.get(month) || { gifts: 0, billing: 0, count: 0 };
      entry.gifts += Number(t.amount || 0);
      entry.count++;
      map.set(month, entry);
    });
    (billingCharges || []).forEach((b) => {
      const month = (b.created_at || "").substring(0, 7);
      if (!month) return;
      const entry = map.get(month) || { gifts: 0, billing: 0, count: 0 };
      entry.billing += Number(b.amount || 0);
      map.set(month, entry);
    });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);
  }, [filteredTransactions, billingCharges]);

  // Lead stats
  const leadsByStatus = useMemo(() => {
    const map = new Map<string, number>();
    (leads || []).forEach((l) => {
      map.set(l.status || "unknown", (map.get(l.status || "unknown") || 0) + 1);
    });
    return map;
  }, [leads]);

  const leadsByType = useMemo(() => {
    const map = new Map<string, number>();
    (leads || []).forEach((l) => {
      map.set(l.lead_type, (map.get(l.lead_type) || 0) + 1);
    });
    return map;
  }, [leads]);

  // Event type breakdown
  const eventsByType = useMemo(() => {
    const map = new Map<string, number>();
    filteredEvents.forEach((e) => {
      map.set(e.event_type, (map.get(e.event_type) || 0) + 1);
    });
    return map;
  }, [filteredEvents]);

  // Venue performance
  const venuePerformance = useMemo(() => {
    const map = new Map<string, { name: string; events: number; gifts: number; giftAmount: number }>();
    venues?.forEach((v) => map.set(v.id, { name: v.name, events: 0, gifts: 0, giftAmount: 0 }));
    filteredEvents.forEach((e) => {
      if (e.venue_id && map.has(e.venue_id)) {
        map.get(e.venue_id)!.events++;
      }
    });
    filteredTransactions.forEach((t) => {
      if (t.venue_id && map.has(t.venue_id)) {
        map.get(t.venue_id)!.gifts++;
        map.get(t.venue_id)!.giftAmount += Number(t.amount || 0);
      }
    });
    return [...map.values()].filter(v => v.events > 0 || v.gifts > 0).sort((a, b) => b.giftAmount - a.giftAmount);
  }, [venues, filteredEvents, filteredTransactions]);

  // RSVP stats
  const rsvpStats = useMemo(() => {
    const confirmed = guests?.filter(g => g.rsvp_status === "confirmed") || [];
    const declined = guests?.filter(g => g.rsvp_status === "declined") || [];
    const pending = guests?.filter(g => g.rsvp_status === "pending") || [];
    const totalGuests = confirmed.reduce((sum, g) => sum + (g.number_of_guests || 1), 0);
    return {
      confirmed: confirmed.length,
      declined: declined.length,
      pending: pending.length,
      totalGuests,
      total: (guests || []).length,
    };
  }, [guests]);

  // ── Export ──
  const exportToExcel = (tab: string) => {
    let data: any[] = [];
    let filename = "report";

    if (tab === "transactions") {
      data = filteredTransactions.map(t => ({
        "שם המשלם": t.payer_name,
        "סכום": t.amount,
        "סטטוס": t.payment_status === "completed" ? "הושלם" : "ממתין",
        "תאריך": new Date(t.transaction_date).toLocaleDateString("he-IL"),
        "קשר": t.relationship || "",
      }));
      filename = "דוח_עסקאות";
    } else if (tab === "revenue") {
      data = monthlyRevenue.map(([month, r]) => ({
        "חודש": month,
        "מתנות": r.gifts.toFixed(0),
        "חיובים": r.billing.toFixed(0),
        "סה״כ": (r.gifts + r.billing).toFixed(0),
        "מס׳ עסקאות": r.count,
      }));
      filename = "דוח_הכנסות";
    } else if (tab === "leads") {
      data = (leads || []).map(l => ({
        "סוג": l.lead_type,
        "סטטוס": l.status,
        "תאריך": new Date(l.created_at).toLocaleDateString("he-IL"),
      }));
      filename = "דוח_לידים";
    } else if (tab === "venues") {
      data = venuePerformance.map(v => ({
        "אולם": v.name,
        "אירועים": v.events,
        "מתנות": v.gifts,
        "סה״כ מתנות": v.giftAmount.toFixed(0),
      }));
      filename = "דוח_אולמות";
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "דוח");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const formatCurrency = (n: number) => `₪${n.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
  const statusLabel: Record<string, string> = {
    new: "חדש", contacted: "פנו אליו", interested: "מעוניין", converted: "הומר ללקוח", closed: "סגור", unknown: "לא ידוע",
  };

  if (txLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#C4A35A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#051839]">דוחות וסטטיסטיקות</h1>
          <p className="text-gray-500 text-sm mt-1">נתונים מפורטים על פעילות המערכת</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
          סינון
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs">מתאריך</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40 mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">עד תאריך</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40 mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">אולם</Label>
              <Select value={filterVenueId} onValueChange={setFilterVenueId}>
                <SelectTrigger className="w-44 mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל האולמות</SelectItem>
                  {venues?.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setFilterVenueId("all"); }}>נקה</Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={<Gift className="w-6 h-6 text-[#C4A35A]" />} label="סה״כ מתנות" value={formatCurrency(totalGiftAmount)} sub={`${filteredTransactions.length} עסקאות`} />
        <SummaryCard icon={<TrendingUp className="w-6 h-6 text-green-600" />} label="מתנות שהושלמו" value={formatCurrency(totalCompleted)} sub={`${completedTx.length} עסקאות`} />
        <SummaryCard icon={<CreditCard className="w-6 h-6 text-blue-600" />} label="הכנסות מחיובים" value={formatCurrency(totalBilling)} sub={`${(billingCharges || []).length} חיובים`} />
        <SummaryCard icon={<BarChart3 className="w-6 h-6 text-purple-600" />} label="ממוצע מתנה" value={formatCurrency(avgGift)} sub={`${filteredEvents.length} אירועים`} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="revenue" dir="rtl">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="revenue" className="gap-1"><TrendingUp className="w-4 h-4" /> הכנסות</TabsTrigger>
          <TabsTrigger value="events" className="gap-1"><Calendar className="w-4 h-4" /> אירועים</TabsTrigger>
          <TabsTrigger value="leads" className="gap-1"><UserPlus className="w-4 h-4" /> לידים</TabsTrigger>
          <TabsTrigger value="venues" className="gap-1"><Building2 className="w-4 h-4" /> אולמות</TabsTrigger>
        </TabsList>

        {/* ── Revenue Tab ── */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#051839]">הכנסות חודשיות</h3>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => exportToExcel("revenue")}>
              <Download className="w-4 h-4" /> ייצוא
            </Button>
          </div>

          {/* Bar chart visual */}
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              {monthlyRevenue.length === 0 ? (
                <p className="text-center text-gray-400 py-8">אין נתונים להצגה</p>
              ) : (
                <div className="space-y-3">
                  {monthlyRevenue.map(([month, r]) => {
                    const total = r.gifts + r.billing;
                    const maxTotal = Math.max(...monthlyRevenue.map(([, r]) => r.gifts + r.billing), 1);
                    const pct = (total / maxTotal) * 100;
                    return (
                      <div key={month} className="flex items-center gap-4">
                        <span className="text-sm font-medium w-20 text-left">{month}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-l from-[#C4A35A] to-[#e8d5a0] rounded-full flex items-center justify-end px-3 transition-all duration-500"
                            style={{ width: `${Math.max(pct, 8)}%` }}
                          >
                            <span className="text-xs font-bold text-[#051839] whitespace-nowrap">{formatCurrency(total)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-16 text-center">{r.count} עסק׳</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gifts vs Billing split */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-2xl">
              <CardContent className="p-5 text-center">
                <Gift className="w-8 h-8 text-[#C4A35A] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#051839]">{formatCurrency(totalGiftAmount)}</p>
                <p className="text-sm text-gray-400">הכנסות ממתנות</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-5 text-center">
                <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#051839]">{formatCurrency(totalBilling)}</p>
                <p className="text-sm text-gray-400">הכנסות מחיובים</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Events Tab ── */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#051839]">סטטיסטיקות אירועים</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat label="סה״כ אירועים" value={filteredEvents.length} />
            <MiniStat label="עם מתנות" value={filteredEvents.filter(e => e.gifts_enabled).length} />
            <MiniStat label="עם הזמנות" value={filteredEvents.filter(e => e.invitations_enabled).length} />
            <MiniStat label="עם אישורי הגעה" value={filteredEvents.filter(e => e.rsvp_enabled).length} />
          </div>

          {/* Event type breakdown */}
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <h4 className="font-bold text-[#051839] mb-4">חלוקה לפי סוג אירוע</h4>
              <div className="space-y-3">
                {[...eventsByType.entries()].map(([type, count]) => {
                  const pct = (count / Math.max(filteredEvents.length, 1)) * 100;
                  return (
                    <div key={type} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-24 text-left">{type}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-[#051839] rounded-full flex items-center justify-end px-3 transition-all"
                          style={{ width: `${Math.max(pct, 10)}%` }}
                        >
                          <span className="text-xs font-bold text-white">{count}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-12">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
                {eventsByType.size === 0 && <p className="text-center text-gray-400">אין נתונים</p>}
              </div>
            </CardContent>
          </Card>

          {/* RSVP summary */}
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <h4 className="font-bold text-[#051839] mb-4">סיכום אישורי הגעה</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStat label="אישרו הגעה" value={rsvpStats.confirmed} color="text-green-600" />
                <MiniStat label="סירבו" value={rsvpStats.declined} color="text-red-500" />
                <MiniStat label="ממתינים" value={rsvpStats.pending} color="text-yellow-600" />
                <MiniStat label="סה״כ אורחים" value={rsvpStats.totalGuests} color="text-[#C4A35A]" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Leads Tab ── */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#051839]">סטטיסטיקות לידים</h3>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => exportToExcel("leads")}>
              <Download className="w-4 h-4" /> ייצוא
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MiniStat label="סה״כ לידים" value={(leads || []).length} />
            <MiniStat label="בעלי אולמות" value={leadsByType.get("venue_owner") || 0} />
            <MiniStat label="בעלי אירועים" value={leadsByType.get("event_owner") || 0} />
          </div>

          {/* Status breakdown */}
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <h4 className="font-bold text-[#051839] mb-4">חלוקה לפי סטטוס</h4>
              <div className="space-y-3">
                {[...leadsByStatus.entries()].map(([status, count]) => {
                  const pct = (count / Math.max((leads || []).length, 1)) * 100;
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-28 text-left">{statusLabel[status] || status}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-[#C4A35A] rounded-full flex items-center justify-end px-3 transition-all"
                          style={{ width: `${Math.max(pct, 10)}%` }}
                        >
                          <span className="text-xs font-bold text-[#051839]">{count}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-12">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
                {leadsByStatus.size === 0 && <p className="text-center text-gray-400">אין נתונים</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Venues Tab ── */}
        <TabsContent value="venues" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#051839]">ביצועי אולמות</h3>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => exportToExcel("venues")}>
              <Download className="w-4 h-4" /> ייצוא
            </Button>
          </div>

          <Card className="rounded-2xl">
            <CardContent className="p-0">
              {/* Table header */}
              <div className="grid grid-cols-4 gap-4 px-6 py-3 text-sm font-medium text-gray-400 border-b text-center">
                <span>שם האולם</span>
                <span>אירועים</span>
                <span>מתנות</span>
                <span>סה״כ מתנות</span>
              </div>
              {venuePerformance.length === 0 ? (
                <p className="text-center text-gray-400 py-8">אין נתונים להצגה</p>
              ) : (
                venuePerformance.map((v, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 px-6 py-4 text-center items-center border-b last:border-0 hover:bg-gray-50">
                    <span className="font-bold text-[#051839]">{v.name}</span>
                    <span className="font-medium">{v.events}</span>
                    <span className="font-medium">{v.gifts}</span>
                    <span className="font-bold text-[#C4A35A]">{formatCurrency(v.giftAmount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Venue count summary */}
          <div className="grid grid-cols-2 gap-4">
            <MiniStat label="סה״כ אולמות" value={(venues || []).length} />
            <MiniStat label="אולמות עם אירועים" value={venuePerformance.filter(v => v.events > 0).length} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sub-components ──

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-2">
          {icon}
        </div>
        <p className="text-xl font-bold text-[#051839]">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xs text-gray-300 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 text-center">
        <p className={`text-2xl font-bold ${color || "text-[#051839]"}`}>{value.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
