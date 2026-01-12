import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Download,
  Building2,
  Users,
  Filter,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function Customers() {
  const [activeTab, setActiveTab] = useState("venues");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch venue owners
  const { data: venues } = useQuery({
    queryKey: ["venues"],
    queryFn: async () => {
      const { data } = await supabase
        .from("venues")
        .select(`
          *,
          devices (id, serial_number, name),
          events (id)
        `)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch event owners
  const { data: events } = useQuery({
    queryKey: ["events-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select(`
          *,
          venues (name, address),
          documents (id)
        `)
        .order("event_date", { ascending: false });
      return data || [];
    },
  });

  // Filter data based on search
  const filteredVenues = venues?.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events?.filter((e) =>
    e.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportExcel = () => {
    toast({
      title: "מייצא לאקסל...",
      description: "הקובץ יורד בקרוב",
    });
  };

  const markDeviceReturned = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .update({ device_returned: true })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: "המכשיר סומן כהוחזר" });
    },
  });

  const markPaymentComplete = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .update({ payment_completed: true })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: "התשלום סומן כהושלם" });
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">לקוחות</h1>
          <p className="text-muted-foreground mt-1">ניהול בעלי אולמות ובעלי אירועים</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="w-4 h-4 ml-2" />
            ייצוא לאקסל
          </Button>
          <Button variant="gold">
            <Plus className="w-4 h-4 ml-2" />
            הוספת לקוח
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לקוח..."
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="venues" className="gap-2">
            <Building2 className="w-4 h-4" />
            בעלי אולמות
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Users className="w-4 h-4" />
            בעלי אירועים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="mt-6">
          <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם הלקוח</TableHead>
                  <TableHead>כתובת האולם</TableHead>
                  <TableHead>מס' אולמות</TableHead>
                  <TableHead>מכשירי סליקה</TableHead>
                  <TableHead>עלות מנוי</TableHead>
                  <TableHead>סך עסקאות</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVenues?.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell className="font-medium">{venue.name}</TableCell>
                    <TableCell>{venue.address}</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>{venue.devices?.length || 0}</TableCell>
                    <TableCell>₪{venue.monthly_subscription?.toLocaleString()}</TableCell>
                    <TableCell>{venue.events?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedVenue(venue)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>פרטי בעל אולם</DialogTitle>
                            </DialogHeader>
                            <VenueDetails venue={venue} />
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredVenues?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      לא נמצאו בעלי אולמות
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם הלקוח</TableHead>
                  <TableHead>שם האולם</TableHead>
                  <TableHead>תאריך אירוע</TableHead>
                  <TableHead>עלות השכרה</TableHead>
                  <TableHead>מכשיר</TableHead>
                  <TableHead>תשלום</TableHead>
                  <TableHead>מסמכים</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.profiles?.full_name || "—"}
                    </TableCell>
                    <TableCell>{event.venues?.name || "—"}</TableCell>
                    <TableCell>
                      {new Date(event.event_date).toLocaleDateString("he-IL")}
                    </TableCell>
                    <TableCell>₪{event.device_rental_cost?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      {event.device_returned ? (
                        <span className="badge-success px-2 py-1 rounded text-xs">הוחזר</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markDeviceReturned.mutate(event.id)}
                        >
                          סמן כהוחזר
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.payment_completed ? (
                        <span className="badge-success px-2 py-1 rounded text-xs">שולם</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markPaymentComplete.mutate(event.id)}
                        >
                          סמן כשולם
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.documents_complete ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
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
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>פרטי בעל אירוע</DialogTitle>
                            </DialogHeader>
                            <EventDetails event={event} />
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon">
                          <Pencil className="w-4 h-4" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VenueDetails({ venue }: { venue: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">שם האולם</Label>
          <p className="font-medium">{venue.name}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">כתובת</Label>
          <p className="font-medium">{venue.address}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">טלפון</Label>
          <p className="font-medium">{venue.phone || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">מייל</Label>
          <p className="font-medium">{venue.email || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">עלות מנוי</Label>
          <p className="font-medium">₪{venue.monthly_subscription?.toLocaleString()}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">סך אירועים</Label>
          <p className="font-medium">{venue.events?.length || 0}</p>
        </div>
      </div>

      <div>
        <Label className="text-muted-foreground">מכשירים מקושרים</Label>
        <div className="mt-2 space-y-2">
          {venue.devices?.length ? (
            venue.devices.map((device: any) => (
              <div key={device.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span>{device.name}</span>
                <span className="text-muted-foreground text-sm">{device.serial_number}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">אין מכשירים מקושרים</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EventDetails({ event }: { event: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">שם הלקוח</Label>
          <p className="font-medium">{event.profiles?.full_name || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">טלפון</Label>
          <p className="font-medium">{event.profiles?.phone || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">מייל</Label>
          <p className="font-medium">{event.profiles?.email || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">תאריך אירוע</Label>
          <p className="font-medium">
            {new Date(event.event_date).toLocaleDateString("he-IL")}
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">שם האולם</Label>
          <p className="font-medium">{event.venues?.name || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">כתובת האולם</Label>
          <p className="font-medium">{event.venues?.address || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">עלות השכרה</Label>
          <p className="font-medium">₪{event.device_rental_cost?.toLocaleString() || 0}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">סטטוס תשלום</Label>
          <p className={event.payment_completed ? "text-success" : "text-warning"}>
            {event.payment_completed ? "שולם" : "ממתין לתשלום"}
          </p>
        </div>
      </div>
    </div>
  );
}
