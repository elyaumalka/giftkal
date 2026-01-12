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
import { Plus, Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function VenueEvents() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: events } = useQuery({
    queryKey: ["venue-events"],
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
        .from("events")
        .select("*")
        .eq("venue_id", venue.id)
        .order("event_date", { ascending: false });

      return data || [];
    },
  });

  const filteredEvents = events?.filter((e: any) =>
    e.groom_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.bride_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">בעלי אירועים</h1>
          <p className="text-muted-foreground mt-1">ניהול האירועים באולם</p>
        </div>
        <Button variant="gold" onClick={() => toast({ title: "בקרוב", description: "הוספת אירוע חדש" })}>
          <Plus className="w-4 h-4 ml-2" />
          הוספת בעל אירוע
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>תאריך אירוע</TableHead>
              <TableHead>שם בעל האירוע</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>סוג האירוע</TableHead>
              <TableHead>מסמכים</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents?.map((event: any) => (
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
                <TableCell>{event.event_type || "חתונה"}</TableCell>
                <TableCell>
                  {event.documents_complete ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>פרטי האירוע</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">חתן</Label>
                            <p className="font-medium">{event.groom_name || "—"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">כלה</Label>
                            <p className="font-medium">{event.bride_name || "—"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">תאריך</Label>
                            <p className="font-medium">
                              {new Date(event.event_date).toLocaleDateString("he-IL")}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">סוג אירוע</Label>
                            <p className="font-medium">{event.event_type || "חתונה"}</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {!filteredEvents?.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  אין אירועים להצגה
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
