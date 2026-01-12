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
import { Search, Download, Heart, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EventGifts() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: gifts } = useQuery({
    queryKey: ["event-gifts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!event) return [];

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("event_id", event.id)
        .order("transaction_date", { ascending: false });

      return data || [];
    },
  });

  const filteredGifts = gifts?.filter((g: any) =>
    g.payer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGifts = gifts?.reduce((sum: number, g: any) => sum + Number(g.amount), 0) || 0;

  const handleExportExcel = () => {
    toast({
      title: "מייצא לאקסל...",
      description: "הקובץ יורד בקרוב",
    });
  };

  const handleDownloadBlessings = () => {
    toast({
      title: "מוריד ברכות...",
      description: "קובץ PDF עם כל הברכות",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">מתנות</h1>
          <p className="text-muted-foreground mt-1">
            סה"כ: ₪{totalGifts.toLocaleString()} מ-{gifts?.length || 0} נותני מתנות
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadBlessings}>
            <Heart className="w-4 h-4 ml-2" />
            הורד ברכות
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="w-4 h-4 ml-2" />
            ייצוא לאקסל
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>סכום</TableHead>
              <TableHead>תשלומים</TableHead>
              <TableHead>קירבה</TableHead>
              <TableHead>ברכה</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGifts?.map((gift: any) => (
              <TableRow key={gift.id}>
                <TableCell className="font-medium">{gift.payer_name}</TableCell>
                <TableCell className="font-semibold text-success">
                  ₪{Number(gift.amount).toLocaleString()}
                </TableCell>
                <TableCell>{gift.installments || 1}</TableCell>
                <TableCell>{gift.relationship || "—"}</TableCell>
                <TableCell>
                  {gift.blessing_text ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Heart className="w-4 h-4 text-primary" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>ברכה מ{gift.payer_name}</DialogTitle>
                        </DialogHeader>
                        <p className="text-lg leading-relaxed">{gift.blessing_text}</p>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!filteredGifts?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  אין מתנות להצגה
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
