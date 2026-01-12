import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VenueInvoices() {
  const { data: invoices } = useQuery({
    queryKey: ["venue-invoices"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!venue) return [];

      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("venue_id", venue.id)
        .order("for_month", { ascending: false });

      return data || [];
    },
  });

  const formatMonth = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">חשבוניות</h1>
        <p className="text-muted-foreground mt-1">צפייה והורדת חשבוניות</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>היסטוריית חשבוניות</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>עבור חודש</TableHead>
                <TableHead>הורדה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {new Date(invoice.created_at).toLocaleDateString("he-IL")}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₪{Number(invoice.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>{formatMonth(invoice.for_month)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!invoice.file_url}
                      asChild={!!invoice.file_url}
                    >
                      {invoice.file_url ? (
                        <a href={invoice.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!invoices?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    אין חשבוניות להצגה
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
