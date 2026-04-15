import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, CreditCard, CheckCircle2, History, Eye, Calendar, User, Building2 } from "lucide-react";
import NedarimBillingDialog from "@/components/billing/NedarimBillingDialog";

export default function Billing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [billingOpen, setBillingOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyEvent, setHistoryEvent] = useState<any>(null);

  // Fetch event owners with their events
  const { data: eventOwners, refetch } = useQuery({
    queryKey: ["billing-event-owners"],
    queryFn: async () => {
      const { data: events } = await supabase
        .from("events")
        .select("id, event_date, groom_name, bride_name, owner_id, payment_completed, gifts_enabled, invitations_enabled, rsvp_enabled, venues (name)")
        .order("event_date", { ascending: false });

      const ownerIds = [...new Set(events?.map((e) => e.owner_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", ownerIds);

      const eventIds = events?.map(e => e.id) || [];
      const [chargesByEvent, chargesByOwner] = await Promise.all([
        supabase.from("billing_charges" as any)
          .select("event_id, owner_id, amount, plan_name, created_at, nedarim_transaction_id")
          .in("event_id", eventIds),
        supabase.from("billing_charges" as any)
          .select("event_id, owner_id, amount, plan_name, created_at, nedarim_transaction_id")
          .in("owner_id", ownerIds)
          .is("event_id", null),
      ]);

      const chargeByEventMap = new Map<string, any>();
      ((chargesByEvent.data || []) as any[]).forEach((c: any) => {
        if (!chargeByEventMap.has(c.event_id) || new Date(c.created_at) > new Date(chargeByEventMap.get(c.event_id).created_at)) {
          chargeByEventMap.set(c.event_id, c);
        }
      });

      const chargeByOwnerMap = new Map<string, any>();
      ((chargesByOwner.data || []) as any[]).forEach((c: any) => {
        if (!chargeByOwnerMap.has(c.owner_id) || new Date(c.created_at) > new Date(chargeByOwnerMap.get(c.owner_id).created_at)) {
          chargeByOwnerMap.set(c.owner_id, c);
        }
      });

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

      return events?.map((event) => {
        const profile = profileMap.get(event.owner_id);
        const charge = chargeByEventMap.get(event.id) || chargeByOwnerMap.get(event.owner_id) || null;
        return {
          ...event,
          ownerName: profile?.full_name || `${event.groom_name || ""} & ${event.bride_name || ""}`,
          ownerEmail: profile?.email || "",
          ownerPhone: profile?.phone || "",
          charge,
        };
      }) || [];
    },
  });

  // Fetch ALL billing history
  const { data: allCharges } = useQuery({
    queryKey: ["billing-all-charges"],
    queryFn: async () => {
      const { data } = await supabase
        .from("billing_charges")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = eventOwners?.filter((e) =>
    e.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // History filtered by search
  const filteredHistory = (allCharges || []).filter((c: any) =>
    c.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.venue_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.plan_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCharge = (owner: any) => {
    setSelectedOwner(owner);
    setBillingOpen(true);
  };

  const openHistory = (event: any) => {
    setHistoryEvent(event);
    setHistoryDialogOpen(true);
  };

  // Get all charges for a specific event/owner
  const getEventCharges = (event: any) => {
    return (allCharges || []).filter((c: any) =>
      c.event_id === event.id || (!c.event_id && c.owner_id === event.owner_id)
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#051839]">חיוב לקוחות</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול חיובים והיסטוריית תשלומים</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
          <Input
            placeholder="חיפוש חופשי"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right w-32 p-0 h-6 text-sm"
          />
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <Tabs defaultValue="customers" dir="rtl">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="customers" className="gap-2"><CreditCard className="w-4 h-4" /> חיוב לקוחות</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" /> היסטוריית חיובים</TabsTrigger>
        </TabsList>

        {/* ── Customers Tab ── */}
        <TabsContent value="customers" className="space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
            <span>תאריך אירוע</span>
            <span>בעל האירוע</span>
            <span>שם האולם</span>
            <span>אירוע</span>
            <span>סטטוס חיוב</span>
            <span className="w-10"></span>
            <span className="w-32"></span>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {filtered?.map((event) => {
              const eventCharges = getEventCharges(event);
              return (
                <div
                  key={event.id}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
                >
                  <span className="text-center font-medium">
                    {new Date(event.event_date).toLocaleDateString("he-IL")}
                  </span>
                  <span className="text-center font-medium">{event.ownerName}</span>
                  <span className="text-center font-medium">{event.venues?.name || "—"}</span>
                  <span className="text-center font-medium">
                    {event.groom_name && event.bride_name
                      ? `${event.groom_name} & ${event.bride_name}`
                      : "—"}
                  </span>
                  <span className="text-center">
                    {event.charge ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        שולם ₪{Number(event.charge.amount).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">לא שולם</span>
                    )}
                  </span>
                  <div className="w-10">
                    {eventCharges.length > 0 && (
                      <button
                        onClick={() => openHistory(event)}
                        className="w-10 h-10 rounded-full bg-[#051839] text-white flex items-center justify-center hover:bg-[#1a2942] transition-colors"
                        title="היסטוריית חיובים"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="w-32 flex justify-end">
                    <Button
                      onClick={() => handleCharge(event)}
                      className="rounded-lg gap-2 px-4"
                      variant="gold"
                      size="sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      {event.charge ? "חייב שוב" : "חייב לקוח"}
                    </Button>
                  </div>
                </div>
              );
            })}

            {!filtered?.length && (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
                לא נמצאו בעלי אירועים
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#051839]">{(allCharges || []).length}</p>
                <p className="text-xs text-gray-400">סה״כ חיובים</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#C4A35A]">
                  ₪{(allCharges || []).reduce((s, c: any) => s + Number(c.amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">סה״כ הכנסות</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {(allCharges || []).filter((c: any) => c.nedarim_transaction_id).length}
                </p>
                <p className="text-xs text-gray-400">עסקאות מאושרות</p>
              </CardContent>
            </Card>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
            <span>תאריך</span>
            <span>שם הלקוח</span>
            <span>אירוע / שירות</span>
            <span>חבילה</span>
            <span>סכום</span>
            <span className="w-24">מזהה עסקה</span>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {filteredHistory.map((charge: any) => (
              <div
                key={charge.id}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-4 shadow-sm"
              >
                <span className="text-center text-sm">
                  {new Date(charge.created_at).toLocaleDateString("he-IL")}
                </span>
                <span className="text-center font-medium">{charge.owner_name}</span>
                <span className="text-center text-sm text-muted-foreground">
                  {charge.event_name || charge.venue_name || "—"}
                </span>
                <span className="text-center">
                  <Badge variant="outline" className="text-xs">{charge.plan_name || "—"}</Badge>
                </span>
                <span className="text-center font-bold text-[#C4A35A]">
                  ₪{Number(charge.amount).toLocaleString()}
                </span>
                <span className="w-24 text-center">
                  {charge.nedarim_transaction_id ? (
                    <Badge variant="default" className="text-xs gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      מאושר
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">ידני</Badge>
                  )}
                </span>
              </div>
            ))}

            {filteredHistory.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
                אין היסטוריית חיובים
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Charges History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              היסטוריית חיובים
            </DialogTitle>
          </DialogHeader>
          {historyEvent && (
            <div className="space-y-4 pt-2">
              {/* Event info */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">בעל האירוע</p>
                    <p className="text-sm font-bold">{historyEvent.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">תאריך אירוע</p>
                    <p className="text-sm font-bold">{new Date(historyEvent.event_date).toLocaleDateString("he-IL")}</p>
                  </div>
                </div>
                {historyEvent.venues?.name && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">אולם</p>
                      <p className="text-sm font-bold">{historyEvent.venues.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">אירוע</p>
                    <p className="text-sm font-bold">
                      {historyEvent.groom_name && historyEvent.bride_name
                        ? `${historyEvent.groom_name} & ${historyEvent.bride_name}`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Charges list */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-[#051839]">חיובים ({getEventCharges(historyEvent).length})</p>
                {getEventCharges(historyEvent).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-white border rounded-xl p-3">
                    <div>
                      <p className="text-sm font-medium">{c.plan_name || "חיוב"}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleDateString("he-IL")} • {new Date(c.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#C4A35A]">₪{Number(c.amount).toLocaleString()}</span>
                      {c.nedarim_transaction_id ? (
                        <Badge variant="default" className="text-xs gap-1">
                          <CheckCircle2 className="w-3 h-3" /> מאושר
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">ידני</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {getEventCharges(historyEvent).length === 0 && (
                  <p className="text-center text-gray-400 py-4">אין חיובים לאירוע זה</p>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-[#051839] text-white rounded-xl p-4">
                <span className="font-bold">סה״כ חיובים</span>
                <span className="text-xl font-bold">
                  ₪{getEventCharges(historyEvent).reduce((s: number, c: any) => s + Number(c.amount || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Billing Dialog */}
      <NedarimBillingDialog
        open={billingOpen}
        onOpenChange={setBillingOpen}
        customerName={selectedOwner?.ownerName || ""}
        customerPhone={selectedOwner?.ownerPhone || ""}
        customerEmail={selectedOwner?.ownerEmail || ""}
        description={`חיוב שירות GiftKal - ${selectedOwner?.groom_name || ""} & ${selectedOwner?.bride_name || ""}`}
        eventId={selectedOwner?.id}
        ownerId={selectedOwner?.owner_id}
        venueName={selectedOwner?.venues?.name}
        eventName={selectedOwner?.groom_name && selectedOwner?.bride_name ? `${selectedOwner.groom_name} & ${selectedOwner.bride_name}` : undefined}
        onSuccess={(txId) => {
          console.log("Payment successful:", txId);
          setBillingOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
