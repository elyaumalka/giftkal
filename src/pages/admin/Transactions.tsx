import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Filter, FileText, MessageCircle, X, Download, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterVenueId, setFilterVenueId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const { toast } = useToast();

  // Fetch events with transaction summaries
  const { data: eventTransactions } = useQuery({
    queryKey: ["event-transactions"],
    queryFn: async () => {
      const { data: events } = await supabase
        .from("events")
        .select(`
          id,
          event_date,
          groom_name,
          bride_name,
          owner_id,
          venue_id,
          venues (id, name),
          transactions (id, amount)
        `)
        .order("event_date", { ascending: false });

      // Fetch profiles for owner names
      const ownerIds = [...new Set(events?.map(e => e.owner_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ownerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));

      return events?.map((event) => ({
        ...event,
        ownerName: profileMap.get(event.owner_id) || (event.groom_name && event.bride_name ? `${event.groom_name} & ${event.bride_name}` : "—"),
        transactionCount: event.transactions?.length || 0,
        totalAmount: event.transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0,
      })) || [];
    },
  });

  // Get unique venues for filter
  const venueOptions = eventTransactions
    ? [...new Map(eventTransactions.filter(e => e.venues?.name).map(e => [e.venues?.id || e.venue_id, e.venues?.name])).entries()].map(([id, name]) => ({ id, name }))
    : [];

  const filteredEvents = eventTransactions?.filter((event) => {
    const matchesSearch = event.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDateFrom = !filterDateFrom || event.event_date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || event.event_date <= filterDateTo;
    const matchesVenue = filterVenueId === "all" || event.venue_id === filterVenueId;

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesVenue;
  });

  const hasActiveFilters = filterDateFrom || filterDateTo || filterVenueId !== "all";

  const clearFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterVenueId("all");
    setCurrentPage(1);
  };

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

  const totalPages = Math.ceil((filteredEvents?.length || 0) / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExportExcel = async (eventId: string, eventName: string) => {
    try {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("event_id", eventId)
        .order("transaction_date", { ascending: false });

      if (!transactions?.length) {
        toast({ title: "אין עסקאות לייצוא", variant: "destructive" });
        return;
      }

      const rows = transactions.map((t) => ({
        "תאריך": new Date(t.transaction_date).toLocaleDateString("he-IL"),
        "שם הלקוח": t.payer_name,
        "טלפון": t.payer_phone || "",
        "אימייל": t.payer_email || "",
        "סכום": Number(t.amount),
        "תשלומים": t.installments || 1,
        "סטטוס": t.payment_status === "completed" ? "שולם" : "ממתין",
        "קשר": t.relationship || "",
        "ברכה": t.blessing_text || "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "עסקאות");
      XLSX.writeFile(wb, `עסקאות_${eventName}.xlsx`);

      toast({ title: "הקובץ יורד בהצלחה" });
    } catch (error: any) {
      toast({ title: "שגיאה בייצוא", description: error.message, variant: "destructive" });
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
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
            <label className="text-sm font-medium text-muted-foreground">אולם:</label>
            <Select value={filterVenueId} onValueChange={setFilterVenueId}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="כל האולמות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל האולמות</SelectItem>
                {venueOptions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Table Header - Right to Left */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
        <span>תאריך</span>
        <span>בעל האירוע</span>
        <span>שם האולם</span>
        <span>כמות עסקאות</span>
        <span>סך כל העסקאות</span>
        <span className="w-64"></span>
      </div>

      {/* Event Rows */}
      <div className="space-y-3">
        {paginatedEvents?.map((event) => (
          <div
            key={event.id}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
          >
            <span className="text-center font-medium">
              {new Date(event.event_date).toLocaleDateString("he-IL")}
            </span>
            <span className="text-center font-medium">
              {event.ownerName}
            </span>
            <span className="text-center font-medium">
              {event.venues?.name || "—"}
            </span>
            <span className="text-center font-bold">
              {event.transactionCount}
            </span>
            <span className="text-center font-bold text-[#c9a54e]">
              ₪ {event.totalAmount.toLocaleString()}
            </span>
            <div className="flex items-center gap-3 justify-end w-64">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEvent(event)}
                    className="rounded-lg border-[#1a2942] text-[#1a2942] hover:bg-[#1a2942] hover:text-white gap-2 px-4"
                  >
                    <FileText className="w-4 h-4" />
                    צפייה בעסקאות
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl p-0 overflow-hidden" hideCloseButton>
                  <TransactionsPopup 
                    event={event} 
                    transactions={eventDetails || []} 
                    onClose={() => setSelectedEvent(null)}
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportExcel(event.id, event.ownerName || "אירוע")}
                className="rounded-lg border-[#1a2942] text-[#1a2942] hover:bg-[#1a2942] hover:text-white gap-2 px-4"
              >
                <FileText className="w-4 h-4" />
                ייצוא לאקסל
              </Button>
            </div>
          </div>
        ))}

        {!filteredEvents?.length && (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
            לא נמצאו עסקאות
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            עמוד {currentPage} מתוך {totalPages} ({filteredEvents?.length} אירועים)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface TransactionsPopupProps {
  event: any;
  transactions: any[];
  onClose: () => void;
}

function TransactionsPopup({ event, transactions, onClose }: TransactionsPopupProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [blessingText, setBlessingText] = useState<string | null>(null);
  const [blessingFrom, setBlessingFrom] = useState<string>("");
  const [blessingImageUrl, setBlessingImageUrl] = useState<string | null>(null);

  const hasActiveFilters = filterDateFrom || filterDateTo || filterMinAmount || filterMaxAmount;

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.payer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.payer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const tDate = t.transaction_date?.split("T")[0] || "";
    const matchesDateFrom = !filterDateFrom || tDate >= filterDateFrom;
    const matchesDateTo = !filterDateTo || tDate <= filterDateTo;
    const amount = Number(t.amount);
    const matchesMinAmount = !filterMinAmount || amount >= Number(filterMinAmount);
    const matchesMaxAmount = !filterMaxAmount || amount <= Number(filterMaxAmount);
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
  });

  return (
    <div className="bg-[#e5e5e5] min-h-[500px] max-h-[80vh] overflow-y-auto">
      {/* Header Row */}
      <div className="flex items-center justify-between px-8 py-6">
        {/* Left - Event Info */}
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

        {/* Right - Search field and Filter */}
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

      {/* Filter Panel */}
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
                  setBlessingImageUrl(transaction.receipt_url || null);
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
        <Dialog open={!!blessingText} onOpenChange={() => { setBlessingText(null); setBlessingImageUrl(null); }}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            {blessingImageUrl ? (
              <div className="flex flex-col items-center">
                <img 
                  src={blessingImageUrl} 
                  alt={`ברכה מ${blessingFrom}`}
                  className="w-full rounded-lg"
                />
              </div>
            ) : (
              <div className="text-center space-y-4 p-6">
                <h3 className="text-xl font-bold">ברכה מ{blessingFrom}</h3>
                <p className="text-lg leading-relaxed">{blessingText}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
