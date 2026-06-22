import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Eye, FileText, Copy, Filter, MessageCircle, CheckCircle2, CreditCard, Loader2, ShieldCheck, XCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EventDetailsDialog } from "@/components/admin/EventDetailsDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EventOwners() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [detailsEvent, setDetailsEvent] = useState<any>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterVenueId, setFilterVenueId] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: eventOwners } = useQuery({
    queryKey: ["event-owners"],
    queryFn: async () => {
      const { data: events } = await supabase
        .from("events")
        .select(`
          *,
          venues (name),
          transactions (id, amount)
        `)
        .order("event_date", { ascending: false });

      // Fetch profiles for owner info
      const ownerIds = [...new Set(events?.map(e => e.owner_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .in("user_id", ownerIds);

      // Fetch billing charges
      const eventIds = events?.map(e => e.id) || [];
      const { data: charges } = await supabase
        .from("billing_charges" as any)
        .select("event_id, amount, created_at")
        .in("event_id", eventIds);

      const chargeMap = new Map<string, any>();
      (charges || []).forEach((c: any) => {
        if (!chargeMap.has(c.event_id) || new Date(c.created_at) > new Date(chargeMap.get(c.event_id).created_at)) {
          chargeMap.set(c.event_id, c);
        }
      });

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return events?.map((event) => {
        const profile = profileMap.get(event.owner_id);
        const charge = chargeMap.get(event.id);
        return {
          ...event,
          ownerName: profile?.full_name || (event.groom_name && event.bride_name ? `${event.groom_name} & ${event.bride_name}` : "—"),
          ownerPhone: profile?.phone || "—",
          ownerEmail: profile?.email || "",
          transactionCount: event.transactions?.length || 0,
          totalAmount: event.transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0,
          charge,
        };
      }) || [];
    },
  });

  // Fetch transactions for selected event
  const { data: eventDetails } = useQuery({
    queryKey: ["event-details", selectedEvent?.id],
    queryFn: async () => {
      if (!selectedEvent?.id) return null;
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("event_id", selectedEvent.id)
        .order("transaction_date", { ascending: false });
      return data;
    },
    enabled: !!selectedEvent?.id,
  });

  const filteredEvents = eventOwners?.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.ownerName?.toLowerCase().includes(q) ||
      e.groom_name?.toLowerCase().includes(q) ||
      e.bride_name?.toLowerCase().includes(q) ||
      e.ownerPhone?.includes(searchQuery) ||
      e.ownerEmail?.toLowerCase().includes(q) ||
      e.venues?.name?.toLowerCase().includes(q);
    const matchesDateFrom = !filterDateFrom || e.event_date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || e.event_date <= filterDateTo;
    const matchesPayment =
      filterPaymentStatus === "all" ||
      (filterPaymentStatus === "paid" && e.charge) ||
      (filterPaymentStatus === "unpaid" && !e.charge);
    const matchesVenue = filterVenueId === "all" || e.venue_id === filterVenueId;
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesPayment && matchesVenue;
  });

  const venueOptions = eventOwners
    ? [...new Map(eventOwners.filter(e => e.venues?.name).map(e => [e.venue_id, e.venues?.name])).entries()].map(([id, name]) => ({ id, name }))
    : [];

  const hasActiveFilters = filterDateFrom || filterDateTo || filterPaymentStatus !== "all" || filterVenueId !== "all";

  const clearFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterPaymentStatus("all");
    setFilterVenueId("all");
  };

  const copyEmail = (email: string) => {
    if (email) {
      navigator.clipboard.writeText(email);
      toast({ title: "הכתובת הועתקה" });
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filters */}
      <div className="flex items-center gap-2 justify-start">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
          <Input
            placeholder="חיפוש חופשי"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right w-32 p-0 h-6 text-sm"
          />
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`rounded-full p-2 shadow-sm transition-colors ${hasActiveFilters ? 'bg-[#1a2942] text-white' : 'bg-white text-muted-foreground hover:bg-gray-100'}`}
        >
          <Filter className="w-4 h-4" />
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> נקה פילטרים
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 shadow-sm flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">מתאריך:</label>
            <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-40 h-8 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">עד תאריך:</label>
            <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-40 h-8 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">סטטוס חיוב:</label>
            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="paid">שולם</SelectItem>
                <SelectItem value="unpaid">לא שולם</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">אולם:</label>
            <Select value={filterVenueId} onValueChange={setFilterVenueId}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="כל האולמות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל האולמות</SelectItem>
                {venueOptions.map((v) => (
                  <SelectItem key={v.id} value={v.id!}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Table Header - Right to Left */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_0.8fr_1fr_0.8fr_0.8fr_auto_auto_auto] gap-3 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
        <span>תאריך אירוע</span>
        <span>בעל האירוע</span>
        <span>טלפון</span>
        <span>שם האולם</span>
        <span>כמות עסקאות</span>
        <span>סך כל העסקאות</span>
        <span>סטטוס חיוב</span>
        <span>סליקה</span>
        <span className="w-28"></span>
        <span className="w-10"></span>
        <span className="w-10"></span>
      </div>

      {/* Event Rows */}
      <div className="space-y-3">
        {filteredEvents?.map((event) => (
          <div
            key={event.id}
            onClick={() => setDetailsEvent(event)}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_0.8fr_1fr_0.8fr_0.8fr_auto_auto_auto] gap-3 items-center bg-white rounded-2xl px-6 py-5 shadow-sm cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all"
          >
            {/* תאריך אירוע */}
            <span className="text-center font-bold">
              {new Date(event.event_date).toLocaleDateString("he-IL")}
            </span>
            
            {/* בעל האירוע */}
            <span className="text-center font-bold">
              {event.ownerName}
            </span>
            
            {/* טלפון */}
            <span className="text-center font-medium">
              {event.ownerPhone}
            </span>
            
            {/* שם האולם */}
            <span className="text-center font-bold text-[#c9a54e]">
              {event.venues?.name || "—"}
            </span>
            
            {/* כמות עסקאות */}
            <span className="text-center font-bold">
              {event.transactionCount}
            </span>
            
            {/* סך כל העסקאות */}
            <span className="text-center font-bold text-[#c9a54e]">
              ₪ {event.totalAmount.toLocaleString()}
            </span>

            {/* סטטוס חיוב */}
            <span className="text-center">
              {event.charge ? (
                <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ₪{Number(event.charge.amount).toLocaleString()}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">לא שולם</span>
              )}
            </span>

            {/* סטטוס סליקה */}
            <span className="text-center">
              {event.seller_payme_id ? (
                <Badge className="bg-green-500 text-white text-xs">פעיל</Badge>
              ) : event.payment_setup_status === 'pending_approval' ? (
                <div className="flex flex-col items-center gap-1">
                  <Badge className="bg-amber-500 text-white text-xs">ממתין</Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                      disabled={approvingId === event.id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setApprovingId(event.id);
                        try {
                          const setupData = event.payment_setup_data as any;
                          if (!setupData) throw new Error('אין נתוני הקמה');
                          // Infer gender from event side when the form didn't capture it:
                          // bride-only events → female (1), groom or generic → male (0).
                          const inferredGender = (!event.groom_name && event.bride_name) ? 1 : 0;
                          const response = await supabase.functions.invoke('payme-create-seller', {
                            body: { eventId: event.id, ...setupData, gender: setupData.gender ?? inferredGender },
                          });
                          if (response.error) throw new Error(response.error.message);
                          if (!response.data?.success) throw new Error(response.data?.error || 'שגיאה');
                          // Do NOT mark 'approved' here — the create-seller function sets status to
                          // 'created'. Real 'approved' only happens when PayMe sends the
                          // `seller-approve` webhook after their KYC team reviews (~2 business days).
                          queryClient.invalidateQueries({ queryKey: ['event-owners'] });
                          queryClient.invalidateQueries({ queryKey: ['pending-approval-count'] });
                          toast({
                            title: "חשבון סליקה נוצר ב-PayMe ✅",
                            description: "ממתין לאישור KYC של PayMe (עד 2 ימי עסקים). תקבל עדכון אוטומטי.",
                          });
                        } catch (err: any) {
                          toast({ title: "שגיאה", description: err.message, variant: "destructive" });
                        } finally {
                          setApprovingId(null);
                        }
                      }}
                    >
                      {approvingId === event.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await supabase.from('events').update({ payment_setup_status: 'rejected' } as any).eq('id', event.id);
                        queryClient.invalidateQueries({ queryKey: ['event-owners'] });
                        queryClient.invalidateQueries({ queryKey: ['pending-approval-count'] });
                        toast({ title: "הבקשה נדחתה" });
                      }}
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </span>

            {/* העתקת כתובת מייל */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); copyEmail(event.ownerEmail); }}
              className="text-muted-foreground hover:text-foreground w-28"
            >
              העתקת כתובת מייל
            </Button>

            {/* צפייה - Eye icon */}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                  className="w-10 h-10 rounded-full border-2 border-[#1a2942] flex items-center justify-center hover:bg-[#1a2942] hover:text-white transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl p-0 overflow-hidden" hideCloseButton>
                <EventTransactionsPopup
                  event={event}
                  transactions={eventDetails || []}
                />
              </DialogContent>
            </Dialog>

            {/* פרטים - Document icon */}
            <button
              onClick={(e) => { e.stopPropagation(); setDetailsEvent(event); }}
              className="w-10 h-10 rounded-full border-2 border-[#1a2942] flex items-center justify-center hover:bg-[#1a2942] hover:text-white transition-colors"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        ))}

        {!filteredEvents?.length && (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
            לא נמצאו בעלי אירועים
          </div>
        )}
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={!!detailsEvent} onOpenChange={(open) => !open && setDetailsEvent(null)}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden" hideCloseButton>
          {detailsEvent && (
            <EventDetailsDialog
              event={detailsEvent}
              onClose={() => setDetailsEvent(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EventTransactionsPopupProps {
  event: any;
  transactions: any[];
}

function EventTransactionsPopup({ event, transactions }: EventTransactionsPopupProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [blessingText, setBlessingText] = useState<string | null>(null);
  const [blessingFrom, setBlessingFrom] = useState<string>("");

  const hasActiveFilters = filterDateFrom || filterDateTo || filterMinAmount || filterMaxAmount;

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.payer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.payer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const tDate = t.transaction_date?.split("T")[0] || "";
    const matchesDateFrom = !filterDateFrom || tDate >= filterDateFrom;
    const matchesDateTo = !filterDateTo || tDate <= filterDateTo;
    const amount = Number(t.amount);
    const matchesMin = !filterMinAmount || amount >= Number(filterMinAmount);
    const matchesMax = !filterMaxAmount || amount <= Number(filterMaxAmount);
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesMin && matchesMax;
  });

  return (
    <div className="bg-[#e5e5e5] min-h-[500px] max-h-[80vh] overflow-y-auto">
      {/* Header Row */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-16">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">שם האולם</p>
            <p className="font-bold text-[#c9a54e] text-xl">{event.venues?.name || "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">בעל האירוע</p>
            <p className="font-bold text-xl">{event.ownerName}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">תאריך</p>
            <p className="font-bold text-xl">{new Date(event.event_date).toLocaleDateString("he-IL")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש חופשי"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right w-32 p-0 h-6 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-full p-2 shadow-sm transition-colors ${hasActiveFilters ? 'bg-[#1a2942] text-white' : 'bg-white text-muted-foreground hover:bg-gray-100'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          {hasActiveFilters && (
            <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterMinAmount(""); setFilterMaxAmount(""); }} className="text-xs text-red-500 hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> נקה
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 mx-8 mb-4 shadow-sm flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">מתאריך:</label>
            <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-40 h-8 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">עד תאריך:</label>
            <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-40 h-8 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">סכום מינימלי:</label>
            <Input type="number" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} className="w-28 h-8 text-sm" placeholder="₪" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">סכום מקסימלי:</label>
            <Input type="number" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)} className="w-28 h-8 text-sm" placeholder="₪" />
          </div>
        </div>
      )}

      {/* Table Header - Right to Left */}
      <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr_0.8fr_auto_auto] gap-4 px-8 py-3 text-sm font-medium text-muted-foreground text-center">
        <span>תאריך</span>
        <span>שם הלקוח</span>
        <span>כתובת מייל</span>
        <span>שם האולם</span>
        <span>בעל האירוע</span>
        <span>סכום</span>
        <span className="w-28"></span>
        <span className="w-28"></span>
      </div>

      {/* Transaction Rows */}
      <div className="space-y-3 px-8 pb-8">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr_0.8fr_auto_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
          >
            {/* תאריך */}
            <span className="text-center font-bold">
              {new Date(transaction.transaction_date).toLocaleDateString("he-IL")}
            </span>
            
            {/* שם הלקוח */}
            <span className="text-center font-bold">
              {transaction.payer_name}
            </span>
            
            {/* כתובת מייל */}
            <span className="text-center text-muted-foreground">
              {transaction.payer_email || "—"}
            </span>
            
            {/* שם האולם */}
            <span className="text-center font-medium">
              {event.venues?.name || "—"}
            </span>
            
            {/* בעל האירוע */}
            <span className="text-center font-medium">
              {event.ownerName?.split(' ')[0] || "—"}
            </span>
            
            {/* סכום */}
            <span className="text-center font-bold">
              ₪{Number(transaction.amount).toLocaleString()}
            </span>

            {/* צפייה בקבלה */}
            <Button
              variant="outline"
              size="sm"
              disabled={!transaction.receipt_url}
              onClick={() => transaction.receipt_url && window.open(transaction.receipt_url, '_blank')}
              className="rounded-lg border-[#1a2942] text-[#1a2942] hover:bg-[#1a2942] hover:text-white gap-2 w-28"
            >
              <FileText className="w-4 h-4" />
              צפייה בקבלה
            </Button>

            {/* צפייה בברכה */}
            <Button
              size="sm"
              onClick={() => {
                if (transaction.blessing_text) {
                  setBlessingText(transaction.blessing_text);
                  setBlessingFrom(transaction.payer_name);
                }
              }}
              disabled={!transaction.blessing_text}
              className="rounded-full bg-[#d64550] hover:bg-[#c13a44] text-white gap-2 w-28 disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" />
              צפייה בברכה
            </Button>
          </div>
        ))}

        {!filteredTransactions.length && (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
            אין עסקאות לאירוע זה
          </div>
        )}
      </div>

      {/* Blessing Dialog */}
      {blessingText && (
        <Dialog open={!!blessingText} onOpenChange={() => setBlessingText(null)}>
          <DialogContent>
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">ברכה מ{blessingFrom}</h3>
              <p className="text-lg leading-relaxed">{blessingText}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
