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
import { Search, Filter, FileText, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
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
          venues (name),
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

  const filteredEvents = eventTransactions?.filter((event) =>
    event.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportExcel = () => {
    toast({
      title: "מייצא לאקסל...",
      description: "הקובץ יורד בקרוב",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filters - Right aligned */}
      <div className="flex justify-start">
        <div className="flex items-center gap-2 bg-white rounded-full px-5 py-3 shadow-sm">
          <Input
            placeholder="חיפוש חופשי"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right w-40 p-0"
          />
          <Search className="w-5 h-5 text-muted-foreground" />
          <div className="w-px h-5 bg-gray-300" />
          <Filter className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

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
        {filteredEvents?.map((event) => (
          <div
            key={event.id}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
          >
            {/* תאריך */}
            <span className="text-center font-medium">
              {new Date(event.event_date).toLocaleDateString("he-IL")}
            </span>
            
            {/* בעל האירוע */}
            <span className="text-center font-medium">
              {event.ownerName}
            </span>
            
            {/* שם האולם */}
            <span className="text-center font-medium">
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

            {/* Action Buttons */}
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
                onClick={handleExportExcel}
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
  const [blessingText, setBlessingText] = useState<string | null>(null);
  const [blessingFrom, setBlessingFrom] = useState<string>("");

  const filteredTransactions = transactions.filter((t) =>
    t.payer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.payer_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Right - Search field and Filter separately */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-full px-5 py-3 shadow-sm">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="חיפוש חופשי"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right w-40 p-0"
            />
          </div>
          <button className="bg-white rounded-full p-3 shadow-sm">
            <Filter className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

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
