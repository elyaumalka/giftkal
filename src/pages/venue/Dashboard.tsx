import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { Calendar, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VenueDashboard() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Fetch venue data
  const { data: venueData } = useQuery({
    queryKey: ["venue-dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: venue } = await supabase
        .from("venues")
        .select("id, name")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!venue) return null;

      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("venue_id", venue.id)
        .order("event_date", { ascending: true });

      const monthEvents = events?.filter((e) => {
        const eventDate = new Date(e.event_date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }) || [];

      const yearEvents = events?.filter((e) => {
        const eventDate = new Date(e.event_date);
        return eventDate.getFullYear() === currentYear;
      }) || [];

      const upcomingEvents = events?.filter((e) => new Date(e.event_date) >= new Date()).slice(0, 3) || [];

      return {
        venue,
        monthEvents: monthEvents.length,
        yearEvents: yearEvents.length,
        upcomingEvents,
      };
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">דשבורד</h1>
        <p className="text-muted-foreground mt-1">ברוך הבא, {venueData?.venue?.name || "בעל אולם"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="אירועים החודש"
          value={venueData?.monthEvents || 0}
          icon={Calendar}
          variant="gold"
        />
        <StatCard
          title="אירועים השנה"
          value={venueData?.yearEvents || 0}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>אירועים קרובים</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך אירוע</TableHead>
                <TableHead>שם בעל האירוע</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>סוג האירוע</TableHead>
                <TableHead>מסמכים</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venueData?.upcomingEvents?.map((event: any) => (
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
                </TableRow>
              ))}
              {!venueData?.upcomingEvents?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    אין אירועים קרובים
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
