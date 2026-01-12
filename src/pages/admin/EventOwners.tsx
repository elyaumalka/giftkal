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
import { Search, Eye, Download, Copy, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EventOwners() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

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

      return events?.map((event) => ({
        ...event,
        transactionCount: event.transactions?.length || 0,
        totalAmount: event.transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0,
      })) || [];
    },
  });

  const filteredEvents = eventOwners?.filter((e) =>
    e.groom_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.bride_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportExcel = () => {
    toast({
      title: "מייצא לאקסל...",
      description: "הקובץ יורד בקרוב",
    });
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({ title: "הכתובת הועתקה" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">בעלי אירועים</h1>
          <p className="text-muted-foreground mt-1">צפייה בכל בעלי האירועים והעסקאות שלהם</p>
        </div>
        <Button variant="outline" onClick={handleExportExcel}>
          <Download className="w-4 h-4 ml-2" />
          ייצוא לאקסל
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש..."
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
              <TableHead>טלפון</TableHead>
              <TableHead>שם האולם</TableHead>
              <TableHead>כמות עסקאות</TableHead>
              <TableHead>סך העסקאות</TableHead>
              <TableHead>מייל</TableHead>
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
                  {event.groom_name && event.bride_name
                    ? `${event.groom_name} & ${event.bride_name}`
                    : "—"}
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>{event.venues?.name || "—"}</TableCell>
                <TableCell>{event.transactionCount}</TableCell>
                <TableCell className="font-semibold text-success">
                  ₪{event.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyEmail("example@email.com")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>
                            עסקאות - {event.groom_name} & {event.bride_name}
                          </DialogTitle>
                        </DialogHeader>
                        <TransactionsList eventId={event.id} />
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  לא נמצאו בעלי אירועים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TransactionsList({ eventId }: { eventId: string }) {
  const { data: transactions } = useQuery({
    queryKey: ["event-transactions-detail", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("event_id", eventId)
        .order("transaction_date", { ascending: false });
      return data || [];
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>תאריך</TableHead>
          <TableHead>שם המשלם</TableHead>
          <TableHead>מייל</TableHead>
          <TableHead>קירבה</TableHead>
          <TableHead>סכום</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions?.map((t: any) => (
          <TableRow key={t.id}>
            <TableCell>
              {new Date(t.transaction_date).toLocaleDateString("he-IL")}
            </TableCell>
            <TableCell className="font-medium">{t.payer_name}</TableCell>
            <TableCell>{t.payer_email || "—"}</TableCell>
            <TableCell>{t.relationship || "—"}</TableCell>
            <TableCell className="font-semibold text-success">
              ₪{Number(t.amount).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
        {!transactions?.length && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              אין עסקאות
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
