import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Eye, Download, Filter, FileText, Heart } from "lucide-react";
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
          venues (name),
          transactions (id, amount)
        `)
        .order("event_date", { ascending: false });

      return events?.map((event) => ({
        ...event,
        ownerName: event.groom_name && event.bride_name ? `${event.groom_name} & ${event.bride_name}` : "—",
        ...event,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">עסקאות</h1>
          <p className="text-muted-foreground mt-1">צפייה בכל העסקאות במערכת</p>
        </div>
        <Button variant="outline" onClick={handleExportExcel}>
          <Download className="w-4 h-4 ml-2" />
          ייצוא לאקסל
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי בעל אירוע או אולם..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 ml-2" />
          פילטרים
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>תאריך אירוע</TableHead>
              <TableHead>בעל האירוע</TableHead>
              <TableHead>שם האולם</TableHead>
              <TableHead>כמות עסקאות</TableHead>
              <TableHead>סך העסקאות</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents?.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  {new Date(event.event_date).toLocaleDateString("he-IL")}
                </TableCell>
                <TableCell className="font-medium">
                  {event.ownerName}
                </TableCell>
                <TableCell>{event.venues?.name || "—"}</TableCell>
                <TableCell>{event.transactionCount}</TableCell>
                <TableCell className="font-semibold text-success">
                  ₪{event.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            עסקאות - {event.ownerName} | {event.venues?.name}
                          </DialogTitle>
                        </DialogHeader>
                        <TransactionsList transactions={eventDetails || []} />
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={handleExportExcel}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!filteredEvents?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  לא נמצאו עסקאות
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TransactionsList({ transactions }: { transactions: any[] }) {
  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>תאריך</TableHead>
            <TableHead>שם המשלם</TableHead>
            <TableHead>מייל</TableHead>
            <TableHead>קירבה</TableHead>
            <TableHead>סכום</TableHead>
            <TableHead>קבלה</TableHead>
            <TableHead>ברכה</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {new Date(transaction.transaction_date).toLocaleDateString("he-IL")}
              </TableCell>
              <TableCell className="font-medium">{transaction.payer_name}</TableCell>
              <TableCell>{transaction.payer_email || "—"}</TableCell>
              <TableCell>{transaction.relationship || "—"}</TableCell>
              <TableCell className="font-semibold text-success">
                ₪{Number(transaction.amount).toLocaleString()}
              </TableCell>
              <TableCell>
                {transaction.receipt_url ? (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={transaction.receipt_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4" />
                    </a>
                  </Button>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {transaction.blessing_text ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Heart className="w-4 h-4 text-primary" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ברכה מ{transaction.payer_name}</DialogTitle>
                      </DialogHeader>
                      <p className="text-lg leading-relaxed">{transaction.blessing_text}</p>
                    </DialogContent>
                  </Dialog>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
          {!transactions.length && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                אין עסקאות לאירוע זה
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
