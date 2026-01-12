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
      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm max-w-md">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="חיפוש חופשי"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right"
        />
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between px-6 py-3 text-sm font-medium text-muted-foreground">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-32"></div>
          <div className="w-32"></div>
        </div>
        <div className="flex items-center gap-8 flex-1 justify-end">
          <span className="w-28 text-center">סך כל העסקאות</span>
          <span className="w-24 text-center">כמות עסקאות</span>
          <span className="w-28 text-center">שם האולם</span>
          <span className="w-24 text-center">בעל האירוע</span>
          <span className="w-24 text-center">תאריך</span>
        </div>
      </div>

      {/* Event Rows */}
      <div className="space-y-3">
        {filteredEvents?.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 shadow-sm"
          >
            {/* Left - Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="rounded-lg border-[#1a2942] text-[#1a2942] hover:bg-[#1a2942] hover:text-white gap-2"
              >
                <FileText className="w-4 h-4" />
                ייצוא לאקסל
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEvent(event)}
                    className="rounded-lg border-[#1a2942] text-[#1a2942] hover:bg-[#1a2942] hover:text-white gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    צפייה בעסקאות
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl p-0 overflow-hidden" hideCloseButton>
                  <TransactionsPopup 
                    event={event} 
                    transactions={eventDetails || []} 
                    onClose={() => setSelectedEvent(null)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Right - Event Data */}
            <div className="flex items-center gap-8">
              <span className="w-28 text-center font-bold text-[#c9a54e]">
                ₪ {event.totalAmount.toLocaleString()}
              </span>
              <span className="w-24 text-center font-medium">
                {event.transactionCount}
              </span>
              <span className="w-28 text-center font-medium">
                {event.venues?.name || "—"}
              </span>
              <span className="w-24 text-center font-medium">
                {event.ownerName}
              </span>
              <span className="w-24 text-center font-medium">
                {new Date(event.event_date).toLocaleDateString("he-IL")}
              </span>
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
    <div className="bg-[#e8e8e8] min-h-[500px] max-h-[80vh] overflow-y-auto">
      {/* Header with event info */}
      <div className="flex items-center justify-between px-8 py-6">
        {/* Search */}
        <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm w-72">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="חיפוש חופשי"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right"
          />
        </div>

        {/* Event Info */}
        <div className="flex items-center gap-12 text-right">
          <div>
            <p className="text-sm text-muted-foreground">שם האולם</p>
            <p className="font-bold text-[#c9a54e] text-lg">{event.venues?.name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">בעל האירוע</p>
            <p className="font-bold text-lg">{event.ownerName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">תאריך</p>
            <p className="font-bold text-lg">{new Date(event.event_date).toLocaleDateString("he-IL")}</p>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between px-8 py-3 text-sm font-medium text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="w-28"></span>
          <span className="w-28"></span>
        </div>
        <div className="flex items-center gap-6 flex-1 justify-end">
          <span className="w-20 text-center">סכום</span>
          <span className="w-24 text-center">בעל האירוע</span>
          <span className="w-28 text-center">שם האולם</span>
          <span className="w-44 text-center">כתובת מייל</span>
          <span className="w-28 text-center">שם הלקוח</span>
          <span className="w-24 text-center">תאריך</span>
        </div>
      </div>

      {/* Transaction Rows */}
      <div className="space-y-3 px-8 pb-8">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 shadow-sm"
          >
            {/* Left - Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setBlessingText(transaction.blessing_text);
                  setBlessingFrom(transaction.payer_name);
                }}
                disabled={!transaction.blessing_text}
                className="rounded-full bg-[#d64550] hover:bg-[#c13a44] text-white gap-2 px-4"
              >
                <MessageCircle className="w-4 h-4" />
                צפייה בברכה
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                disabled={!transaction.receipt_url}
                onClick={() => transaction.receipt_url && window.open(transaction.receipt_url, '_blank')}
                className="rounded-lg border-[#1a2942] text-[#1a2942] hover:bg-[#1a2942] hover:text-white gap-2"
              >
                <FileText className="w-4 h-4" />
                צפייה בקבלה
              </Button>
            </div>

            {/* Right - Transaction Data */}
            <div className="flex items-center gap-6">
              <span className="w-20 text-center font-bold">
                ₪{Number(transaction.amount).toLocaleString()}
              </span>
              <span className="w-24 text-center font-medium">
                {event.ownerName?.split(' ')[0] || "—"}
              </span>
              <span className="w-28 text-center font-medium">
                {event.venues?.name || "—"}
              </span>
              <span className="w-44 text-center text-sm text-muted-foreground">
                {transaction.payer_email || "—"}
              </span>
              <span className="w-28 text-center font-bold">
                {transaction.payer_name}
              </span>
              <span className="w-24 text-center font-medium">
                {new Date(transaction.transaction_date).toLocaleDateString("he-IL")}
              </span>
            </div>
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
