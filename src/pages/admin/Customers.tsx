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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Customers() {
  const [activeTab, setActiveTab] = useState("venues");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditVenueOpen, setIsEditVenueOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  
  // New venue form state
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueAddress, setNewVenueAddress] = useState("");
  const [newVenuePhone, setNewVenuePhone] = useState("");
  const [newVenueEmail, setNewVenueEmail] = useState("");
  const [newVenueSubscription, setNewVenueSubscription] = useState("");
  const [newVenueOwnerId, setNewVenueOwnerId] = useState("");
  
  // New event form state
  const [newEventGroomName, setNewEventGroomName] = useState("");
  const [newEventBrideName, setNewEventBrideName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState("חתונה");
  const [newEventVenueId, setNewEventVenueId] = useState("");
  const [newEventOwnerId, setNewEventOwnerId] = useState("");
  const [newEventRentalCost, setNewEventRentalCost] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch venue owners (users with venue_owner role)
  const { data: venueOwners } = useQuery({
    queryKey: ["venue-owners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          profiles!inner(user_id, full_name, email)
        `)
        .eq("role", "venue_owner");
      return data || [];
    },
  });

  // Fetch event owners (users with event_owner role)
  const { data: eventOwners } = useQuery({
    queryKey: ["event-owners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          profiles!inner(user_id, full_name, email)
        `)
        .eq("role", "event_owner");
      return data || [];
    },
  });

  // Fetch venues
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

  // Fetch events
  const { data: events } = useQuery({
    queryKey: ["events-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select(`
          *,
          venues (id, name, address),
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
    (e.groom_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.bride_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
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

  // Add venue mutation
  const addVenue = useMutation({
    mutationFn: async () => {
      if (!newVenueOwnerId) throw new Error("יש לבחור בעל אולם");
      const { error } = await supabase.from("venues").insert({
        name: newVenueName,
        address: newVenueAddress,
        phone: newVenuePhone || null,
        email: newVenueEmail || null,
        monthly_subscription: parseFloat(newVenueSubscription) || 0,
        owner_id: newVenueOwnerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      setIsAddVenueOpen(false);
      resetVenueForm();
      toast({ title: "האולם נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת אולם", description: error.message, variant: "destructive" });
    },
  });

  // Update venue mutation
  const updateVenue = useMutation({
    mutationFn: async () => {
      if (!selectedVenue) return;
      const { error } = await supabase.from("venues").update({
        name: newVenueName,
        address: newVenueAddress,
        phone: newVenuePhone || null,
        email: newVenueEmail || null,
        monthly_subscription: parseFloat(newVenueSubscription) || 0,
      }).eq("id", selectedVenue.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      setIsEditVenueOpen(false);
      resetVenueForm();
      toast({ title: "האולם עודכן בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בעדכון אולם", description: error.message, variant: "destructive" });
    },
  });

  // Add event mutation
  const addEvent = useMutation({
    mutationFn: async () => {
      if (!newEventOwnerId) throw new Error("יש לבחור בעל אירוע");
      const { error } = await supabase.from("events").insert({
        groom_name: newEventGroomName || null,
        bride_name: newEventBrideName || null,
        event_date: newEventDate,
        event_type: newEventType,
        venue_id: newEventVenueId || null,
        owner_id: newEventOwnerId,
        device_rental_cost: parseFloat(newEventRentalCost) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      setIsAddEventOpen(false);
      resetEventForm();
      toast({ title: "האירוע נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת אירוע", description: error.message, variant: "destructive" });
    },
  });

  // Update event mutation
  const updateEvent = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) return;
      const { error } = await supabase.from("events").update({
        groom_name: newEventGroomName || null,
        bride_name: newEventBrideName || null,
        event_date: newEventDate,
        event_type: newEventType,
        venue_id: newEventVenueId || null,
        device_rental_cost: parseFloat(newEventRentalCost) || 0,
      }).eq("id", selectedEvent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      setIsEditEventOpen(false);
      resetEventForm();
      toast({ title: "האירוע עודכן בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בעדכון אירוע", description: error.message, variant: "destructive" });
    },
  });

  const resetVenueForm = () => {
    setNewVenueName("");
    setNewVenueAddress("");
    setNewVenuePhone("");
    setNewVenueEmail("");
    setNewVenueSubscription("");
    setNewVenueOwnerId("");
    setSelectedVenue(null);
  };

  const resetEventForm = () => {
    setNewEventGroomName("");
    setNewEventBrideName("");
    setNewEventDate("");
    setNewEventType("חתונה");
    setNewEventVenueId("");
    setNewEventOwnerId("");
    setNewEventRentalCost("");
    setSelectedEvent(null);
  };

  const openEditVenue = (venue: any) => {
    setSelectedVenue(venue);
    setNewVenueName(venue.name);
    setNewVenueAddress(venue.address);
    setNewVenuePhone(venue.phone || "");
    setNewVenueEmail(venue.email || "");
    setNewVenueSubscription(venue.monthly_subscription?.toString() || "");
    setIsEditVenueOpen(true);
  };

  const openEditEvent = (event: any) => {
    setSelectedEvent(event);
    setNewEventGroomName(event.groom_name || "");
    setNewEventBrideName(event.bride_name || "");
    setNewEventDate(event.event_date);
    setNewEventType(event.event_type || "חתונה");
    setNewEventVenueId(event.venue_id || "");
    setNewEventRentalCost(event.device_rental_cost?.toString() || "");
    setIsEditEventOpen(true);
  };

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
          <Dialog open={activeTab === "venues" ? isAddVenueOpen : isAddEventOpen} onOpenChange={activeTab === "venues" ? setIsAddVenueOpen : setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 ml-2" />
                הוספת {activeTab === "venues" ? "אולם" : "אירוע"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{activeTab === "venues" ? "הוספת אולם חדש" : "הוספת אירוע חדש"}</DialogTitle>
              </DialogHeader>
              {activeTab === "venues" ? (
                <div className="space-y-4">
                  <div>
                    <Label>בעל אולם *</Label>
                    <Select value={newVenueOwnerId} onValueChange={setNewVenueOwnerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר בעל אולם" />
                      </SelectTrigger>
                      <SelectContent>
                        {venueOwners?.map((owner: any) => (
                          <SelectItem key={owner.user_id} value={owner.user_id}>
                            {owner.profiles?.full_name} ({owner.profiles?.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>שם האולם *</Label>
                    <Input value={newVenueName} onChange={(e) => setNewVenueName(e.target.value)} placeholder="שם האולם" />
                  </div>
                  <div>
                    <Label>כתובת *</Label>
                    <Input value={newVenueAddress} onChange={(e) => setNewVenueAddress(e.target.value)} placeholder="כתובת האולם" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>טלפון</Label>
                      <Input value={newVenuePhone} onChange={(e) => setNewVenuePhone(e.target.value)} placeholder="03-1234567" />
                    </div>
                    <div>
                      <Label>מייל</Label>
                      <Input type="email" value={newVenueEmail} onChange={(e) => setNewVenueEmail(e.target.value)} placeholder="email@example.com" />
                    </div>
                  </div>
                  <div>
                    <Label>עלות מנוי חודשי (₪)</Label>
                    <Input type="number" value={newVenueSubscription} onChange={(e) => setNewVenueSubscription(e.target.value)} placeholder="2500" />
                  </div>
                  <Button onClick={() => addVenue.mutate()} disabled={!newVenueName || !newVenueAddress || !newVenueOwnerId || addVenue.isPending} className="w-full">
                    {addVenue.isPending ? "מוסיף..." : "הוסף אולם"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>בעל אירוע *</Label>
                    <Select value={newEventOwnerId} onValueChange={setNewEventOwnerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר בעל אירוע" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventOwners?.map((owner: any) => (
                          <SelectItem key={owner.user_id} value={owner.user_id}>
                            {owner.profiles?.full_name} ({owner.profiles?.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>סוג אירוע</Label>
                    <Select value={newEventType} onValueChange={setNewEventType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="חתונה">חתונה</SelectItem>
                        <SelectItem value="בר מצווה">בר מצווה</SelectItem>
                        <SelectItem value="בת מצווה">בת מצווה</SelectItem>
                        <SelectItem value="ברית">ברית</SelectItem>
                        <SelectItem value="אירוע אחר">אירוע אחר</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>שם החתן / הילד</Label>
                      <Input value={newEventGroomName} onChange={(e) => setNewEventGroomName(e.target.value)} placeholder="שם" />
                    </div>
                    <div>
                      <Label>שם הכלה (אם רלוונטי)</Label>
                      <Input value={newEventBrideName} onChange={(e) => setNewEventBrideName(e.target.value)} placeholder="שם" />
                    </div>
                  </div>
                  <div>
                    <Label>תאריך אירוע *</Label>
                    <Input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>אולם</Label>
                    <Select value={newEventVenueId} onValueChange={setNewEventVenueId}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר אולם (אופציונלי)" />
                      </SelectTrigger>
                      <SelectContent>
                        {venues?.map((venue: any) => (
                          <SelectItem key={venue.id} value={venue.id}>
                            {venue.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>עלות השכרת מכשיר (₪)</Label>
                    <Input type="number" value={newEventRentalCost} onChange={(e) => setNewEventRentalCost(e.target.value)} placeholder="500" />
                  </div>
                  <Button onClick={() => addEvent.mutate()} disabled={!newEventDate || !newEventOwnerId || addEvent.isPending} className="w-full">
                    {addEvent.isPending ? "מוסיף..." : "הוסף אירוע"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Venue Dialog */}
      <Dialog open={isEditVenueOpen} onOpenChange={setIsEditVenueOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>עריכת אולם</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>שם האולם *</Label>
              <Input value={newVenueName} onChange={(e) => setNewVenueName(e.target.value)} placeholder="שם האולם" />
            </div>
            <div>
              <Label>כתובת *</Label>
              <Input value={newVenueAddress} onChange={(e) => setNewVenueAddress(e.target.value)} placeholder="כתובת האולם" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טלפון</Label>
                <Input value={newVenuePhone} onChange={(e) => setNewVenuePhone(e.target.value)} placeholder="03-1234567" />
              </div>
              <div>
                <Label>מייל</Label>
                <Input type="email" value={newVenueEmail} onChange={(e) => setNewVenueEmail(e.target.value)} placeholder="email@example.com" />
              </div>
            </div>
            <div>
              <Label>עלות מנוי חודשי (₪)</Label>
              <Input type="number" value={newVenueSubscription} onChange={(e) => setNewVenueSubscription(e.target.value)} placeholder="2500" />
            </div>
            <Button onClick={() => updateVenue.mutate()} disabled={!newVenueName || !newVenueAddress || updateVenue.isPending} className="w-full">
              {updateVenue.isPending ? "שומר..." : "שמור שינויים"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>עריכת אירוע</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>סוג אירוע</Label>
              <Select value={newEventType} onValueChange={setNewEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="חתונה">חתונה</SelectItem>
                  <SelectItem value="בר מצווה">בר מצווה</SelectItem>
                  <SelectItem value="בת מצווה">בת מצווה</SelectItem>
                  <SelectItem value="ברית">ברית</SelectItem>
                  <SelectItem value="אירוע אחר">אירוע אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם החתן / הילד</Label>
                <Input value={newEventGroomName} onChange={(e) => setNewEventGroomName(e.target.value)} placeholder="שם" />
              </div>
              <div>
                <Label>שם הכלה (אם רלוונטי)</Label>
                <Input value={newEventBrideName} onChange={(e) => setNewEventBrideName(e.target.value)} placeholder="שם" />
              </div>
            </div>
            <div>
              <Label>תאריך אירוע *</Label>
              <Input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
            </div>
            <div>
              <Label>אולם</Label>
              <Select value={newEventVenueId} onValueChange={setNewEventVenueId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר אולם (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  {venues?.map((venue: any) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>עלות השכרת מכשיר (₪)</Label>
              <Input type="number" value={newEventRentalCost} onChange={(e) => setNewEventRentalCost(e.target.value)} placeholder="500" />
            </div>
            <Button onClick={() => updateEvent.mutate()} disabled={!newEventDate || updateEvent.isPending} className="w-full">
              {updateEvent.isPending ? "שומר..." : "שמור שינויים"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <TableHead>שם האולם</TableHead>
                  <TableHead>כתובת</TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead>מכשירי סליקה</TableHead>
                  <TableHead>עלות מנוי</TableHead>
                  <TableHead>סך אירועים</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVenues?.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell className="font-medium">{venue.name}</TableCell>
                    <TableCell>{venue.address}</TableCell>
                    <TableCell>{venue.phone || "—"}</TableCell>
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
                              <DialogTitle>פרטי אולם</DialogTitle>
                            </DialogHeader>
                            <VenueDetails venue={venue} />
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => openEditVenue(venue)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredVenues?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      לא נמצאו אולמות
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
                      {event.groom_name && event.bride_name ? `${event.groom_name} & ${event.bride_name}` : event.groom_name || "—"}
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
                              <DialogTitle>פרטי אירוע</DialogTitle>
                            </DialogHeader>
                            <EventDetails event={event} />
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => openEditEvent(event)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredEvents?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      לא נמצאו אירועים
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
          <p className="font-medium">
            {event.groom_name && event.bride_name ? `${event.groom_name} & ${event.bride_name}` : event.groom_name || "—"}
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">סוג אירוע</Label>
          <p className="font-medium">{event.event_type || "חתונה"}</p>
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
