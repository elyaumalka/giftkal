import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Filter,
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
import { cn } from "@/lib/utils";
import { EventDetailsDialog } from "@/components/admin/EventDetailsDialog";

export default function Customers() {
  const [activeTab, setActiveTab] = useState<"venues" | "events">("venues");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditVenueOpen, setIsEditVenueOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  
  // Combined form state - User + Venue
  const [newOwnerFullName, setNewOwnerFullName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerPassword, setNewOwnerPassword] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueAddress, setNewVenueAddress] = useState("");
  const [newVenuePhone, setNewVenuePhone] = useState("");
  const [newVenueEmail, setNewVenueEmail] = useState("");
  const [newVenueSubscription, setNewVenueSubscription] = useState("");
  
  // Combined form state - User + Event
  const [newEventOwnerFullName, setNewEventOwnerFullName] = useState("");
  const [newEventOwnerEmail, setNewEventOwnerEmail] = useState("");
  const [newEventOwnerPassword, setNewEventOwnerPassword] = useState("");
  const [newEventOwnerPhone, setNewEventOwnerPhone] = useState("");
  const [newEventGroomName, setNewEventGroomName] = useState("");
  const [newEventBrideName, setNewEventBrideName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState("חתונה");
  const [newEventVenueId, setNewEventVenueId] = useState("");
  const [newEventRentalCost, setNewEventRentalCost] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch venues with owner profiles
  const { data: venues } = useQuery({
    queryKey: ["venues-with-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("venues")
        .select(`
          *,
          devices (id),
          events (id)
        `)
        .order("created_at", { ascending: false });
      
      if (!data) return [];
      
      // Get owner profiles
      const ownerIds = data.map(v => v.owner_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds);
      
      // Get transaction totals per venue
      const venueIds = data.map(v => v.id);
      const { data: transactions } = await supabase
        .from("transactions")
        .select("event_id, amount");
      
      const { data: venueEvents } = await supabase
        .from("events")
        .select("id, venue_id")
        .in("venue_id", venueIds);
      
      return data.map(venue => {
        const venueEventIds = venueEvents?.filter(e => e.venue_id === venue.id).map(e => e.id) || [];
        const venueTransactions = transactions?.filter(t => venueEventIds.includes(t.event_id)) || [];
        const totalTransactions = venueTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        return {
          ...venue,
          ownerName: profiles?.find(p => p.id === venue.owner_id)?.full_name || "לא ידוע",
          deviceCount: venue.devices?.length || 0,
          venueCount: 1,
          totalTransactions,
        };
      });
    },
  });

  // Fetch events with owner profiles
  const { data: events } = useQuery({
    queryKey: ["events-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select(`
          *,
          venues (id, name, address)
        `)
        .order("event_date", { ascending: false });
      
      if (!data) return [];
      
      // Get owner profiles
      const ownerIds = data.map(e => e.owner_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ownerIds);
      
      // Get documents for each event to check missing docs
      const eventIds = data.map(e => e.id);
      const { data: documents } = await supabase
        .from("documents")
        .select("event_id, document_type")
        .in("event_id", eventIds);
      
      // Get required documents
      const { data: requiredDocs } = await supabase
        .from("required_documents")
        .select("document_type")
        .eq("for_type", "event_owner");
      
      const requiredDocTypes = requiredDocs?.map(d => d.document_type) || [];
      
      return data.map(event => {
        const eventDocs = documents?.filter(d => d.event_id === event.id) || [];
        const uploadedDocTypes = eventDocs.map(d => d.document_type);
        const missingDocs = requiredDocTypes.filter(type => !uploadedDocTypes.includes(type));
        
        return {
          ...event,
          ownerName: profiles?.find(p => p.user_id === event.owner_id)?.full_name || "לא ידוע",
          missingDocsCount: missingDocs.length,
          allDocsComplete: missingDocs.length === 0,
        };
      });
    },
  });

  // Filter data based on search
  const filteredVenues = venues?.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events?.filter((e) =>
    (e.groom_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.bride_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Create venue owner + venue
  const createVenueWithOwner = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-customer', {
        body: {
          type: 'venue',
          user: {
            email: newOwnerEmail,
            password: newOwnerPassword,
            fullName: newOwnerFullName,
            phone: newOwnerPhone,
          },
          venue: {
            name: newVenueName,
            address: newVenueAddress,
            phone: newVenuePhone,
            email: newVenueEmail,
            monthlySubscription: parseFloat(newVenueSubscription) || 0,
          }
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues-with-stats"] });
      setIsAddVenueOpen(false);
      resetVenueForm();
      toast({ title: "בעל האולם והאולם נוצרו בהצלחה!" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה ביצירה", description: error.message, variant: "destructive" });
    },
  });

  // Create event owner + event
  const createEventWithOwner = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-customer', {
        body: {
          type: 'event',
          user: {
            email: newEventOwnerEmail,
            password: newEventOwnerPassword,
            fullName: newEventOwnerFullName,
            phone: newEventOwnerPhone,
          },
          event: {
            groomName: newEventGroomName,
            brideName: newEventBrideName,
            eventDate: newEventDate,
            eventType: newEventType,
            venueId: newEventVenueId || null,
            deviceRentalCost: parseFloat(newEventRentalCost) || 0,
          }
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      setIsAddEventOpen(false);
      resetEventForm();
      toast({ title: "בעל האירוע והאירוע נוצרו בהצלחה!" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה ביצירה", description: error.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["venues-with-stats"] });
      setIsEditVenueOpen(false);
      resetVenueForm();
      toast({ title: "האולם עודכן בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בעדכון אולם", description: error.message, variant: "destructive" });
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
    setNewOwnerFullName("");
    setNewOwnerEmail("");
    setNewOwnerPassword("");
    setNewOwnerPhone("");
    setNewVenueName("");
    setNewVenueAddress("");
    setNewVenuePhone("");
    setNewVenueEmail("");
    setNewVenueSubscription("");
    setSelectedVenue(null);
  };

  const resetEventForm = () => {
    setNewEventOwnerFullName("");
    setNewEventOwnerEmail("");
    setNewEventOwnerPassword("");
    setNewEventOwnerPhone("");
    setNewEventGroomName("");
    setNewEventBrideName("");
    setNewEventDate("");
    setNewEventType("חתונה");
    setNewEventVenueId("");
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

  const isVenueFormValid = newOwnerFullName && newOwnerEmail && newOwnerPassword && newOwnerPassword.length >= 6 && newVenueName && newVenueAddress;
  const isEventFormValid = newEventOwnerFullName && newEventOwnerEmail && newEventOwnerPassword && newEventOwnerPassword.length >= 6 && newEventDate;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex bg-muted rounded-full p-1">
          <button
            onClick={() => setActiveTab("venues")}
            className={cn(
              "px-8 py-3 rounded-full text-sm font-medium transition-all",
              activeTab === "venues"
                ? "bg-secondary text-white"
                : "text-muted-foreground hover:text-secondary"
            )}
          >
            בעלי אולמות
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={cn(
              "px-8 py-3 rounded-full text-sm font-medium transition-all",
              activeTab === "events"
                ? "bg-secondary text-white"
                : "text-muted-foreground hover:text-secondary"
            )}
          >
            בעלי אירועים
          </button>
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex items-center gap-4">
        {/* Add Button */}
        <Dialog open={activeTab === "venues" ? isAddVenueOpen : isAddEventOpen} onOpenChange={(open) => { 
          if (activeTab === "venues") {
            setIsAddVenueOpen(open);
            if (!open) resetVenueForm();
          } else {
            setIsAddEventOpen(open);
            if (!open) resetEventForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 h-10 w-10">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{activeTab === "venues" ? "הוספת לקוח חדש" : "הוספת בעל אירוע חדש"}</DialogTitle>
            </DialogHeader>
            {activeTab === "venues" ? (
              <div className="p-6 space-y-6">
                {/* Row 1: Name, Phone, Email */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">שם הלקוח</Label>
                    <Input variant="form" value={newOwnerFullName} onChange={(e) => setNewOwnerFullName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">טלפון</Label>
                    <Input variant="form" value={newOwnerPhone} onChange={(e) => setNewOwnerPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">כתובת מייל</Label>
                    <Input variant="form" type="email" value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} />
                  </div>
                </div>

                {/* Row 2: Venue Name, Address, Venue Count */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">שם האולם</Label>
                    <Input variant="form" value={newVenueName} onChange={(e) => setNewVenueName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">כתובת האולם</Label>
                    <Input variant="form" value={newVenueAddress} onChange={(e) => setNewVenueAddress(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">כמות אולמות</Label>
                    <Input variant="form" type="number" defaultValue="1" disabled />
                  </div>
                </div>

                {/* Row 3: Password and Subscription */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">סיסמה</Label>
                    <Input variant="form" type="password" value={newOwnerPassword} onChange={(e) => setNewOwnerPassword(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">עלות מנוי (₪)</Label>
                    <Input variant="form" type="number" value={newVenueSubscription} onChange={(e) => setNewVenueSubscription(e.target.value)} />
                  </div>
                </div>

                <Button 
                  onClick={() => createVenueWithOwner.mutate()} 
                  disabled={!isVenueFormValid || createVenueWithOwner.isPending} 
                  className="rounded-full bg-secondary hover:bg-secondary/90 px-8"
                >
                  {createVenueWithOwner.isPending ? "יוצר..." : "הוספת לקוח חדש ←"}
                </Button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Row 1: Name, Phone, Email */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">שם מלא</Label>
                    <Input variant="form" value={newEventOwnerFullName} onChange={(e) => setNewEventOwnerFullName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">טלפון</Label>
                    <Input variant="form" value={newEventOwnerPhone} onChange={(e) => setNewEventOwnerPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">כתובת מייל</Label>
                    <Input variant="form" type="email" value={newEventOwnerEmail} onChange={(e) => setNewEventOwnerEmail(e.target.value)} />
                  </div>
                </div>

                {/* Row 2: Event Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">שם החתן</Label>
                    <Input variant="form" value={newEventGroomName} onChange={(e) => setNewEventGroomName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">שם הכלה</Label>
                    <Input variant="form" value={newEventBrideName} onChange={(e) => setNewEventBrideName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">תאריך אירוע</Label>
                    <Input variant="form" type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
                  </div>
                </div>

                {/* Row 3: Venue and Cost */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">אולם</Label>
                    <Select value={newEventVenueId} onValueChange={setNewEventVenueId}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted border-0">
                        <SelectValue placeholder="בחר אולם" />
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
                    <Label className="text-muted-foreground text-sm mb-2 block">סיסמה</Label>
                    <Input variant="form" type="password" value={newEventOwnerPassword} onChange={(e) => setNewEventOwnerPassword(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block">עלות השכרה (₪)</Label>
                    <Input variant="form" type="number" value={newEventRentalCost} onChange={(e) => setNewEventRentalCost(e.target.value)} />
                  </div>
                </div>

                <Button 
                  onClick={() => createEventWithOwner.mutate()} 
                  disabled={!isEventFormValid || createEventWithOwner.isPending} 
                  className="rounded-full bg-secondary hover:bg-secondary/90 px-8"
                >
                  {createEventWithOwner.isPending ? "יוצר..." : "הוספת בעל אירוע חדש ←"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="חיפוש חופשי"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 rounded-full bg-white border-0 shadow-sm"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Filter */}
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {/* Edit Venue Dialog */}
      <Dialog open={isEditVenueOpen} onOpenChange={setIsEditVenueOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>עריכת אולם</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">שם האולם</Label>
                <Input variant="form" value={newVenueName} onChange={(e) => setNewVenueName(e.target.value)} />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">כתובת</Label>
                <Input variant="form" value={newVenueAddress} onChange={(e) => setNewVenueAddress(e.target.value)} />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">טלפון</Label>
                <Input variant="form" value={newVenuePhone} onChange={(e) => setNewVenuePhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">מייל</Label>
                <Input variant="form" type="email" value={newVenueEmail} onChange={(e) => setNewVenueEmail(e.target.value)} />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">עלות מנוי (₪)</Label>
                <Input variant="form" type="number" value={newVenueSubscription} onChange={(e) => setNewVenueSubscription(e.target.value)} />
              </div>
            </div>
            <Button 
              onClick={() => updateVenue.mutate()} 
              disabled={!newVenueName || !newVenueAddress || updateVenue.isPending} 
              className="rounded-full bg-secondary hover:bg-secondary/90 px-8"
            >
              {updateVenue.isPending ? "שומר..." : "שמור שינויים ←"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>עריכת אירוע</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">שם החתן</Label>
                <Input variant="form" value={newEventGroomName} onChange={(e) => setNewEventGroomName(e.target.value)} />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">שם הכלה</Label>
                <Input variant="form" value={newEventBrideName} onChange={(e) => setNewEventBrideName(e.target.value)} />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">תאריך אירוע</Label>
                <Input variant="form" type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">סוג אירוע</Label>
                <Select value={newEventType} onValueChange={setNewEventType}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted border-0">
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
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">אולם</Label>
                <Select value={newEventVenueId} onValueChange={setNewEventVenueId}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted border-0">
                    <SelectValue placeholder="בחר אולם" />
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
                <Label className="text-muted-foreground text-sm mb-2 block">עלות השכרה (₪)</Label>
                <Input variant="form" type="number" value={newEventRentalCost} onChange={(e) => setNewEventRentalCost(e.target.value)} />
              </div>
            </div>
            <Button 
              onClick={() => updateEvent.mutate()} 
              disabled={!newEventDate || updateEvent.isPending} 
              className="rounded-full bg-secondary hover:bg-secondary/90 px-8"
            >
              {updateEvent.isPending ? "שומר..." : "שמור שינויים ←"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Header */}
      {activeTab === "venues" && (
        <div className="flex items-center gap-4 px-4 py-3 text-sm text-muted-foreground font-medium">
          <div className="w-10"></div>
          <div className="flex-1 text-right">שם הלקוח</div>
          <div className="flex-1 text-right">כתובת האולם</div>
          <div className="w-24 text-center">כמות אולמות</div>
          <div className="w-24 text-center">כמות מכשירים</div>
          <div className="w-24 text-center">עלות מנוי</div>
          <div className="w-32 text-center">סך עסקאות כולל</div>
          <div className="w-10"></div>
        </div>
      )}

      {activeTab === "events" && (
        <div className="flex items-center gap-4 px-4 py-3 text-sm text-muted-foreground font-medium">
          <div className="w-10"></div>
          <div className="flex-1 text-right">שם הלקוח</div>
          <div className="flex-1 text-right">שם האולם</div>
          <div className="w-28 text-center">תאריך האירוע</div>
          <div className="w-28 text-center">עלות השכרה</div>
          <div className="w-28 text-center">הוחזר/לא הוחזר</div>
          <div className="w-32 text-center">מסמכים חסרים</div>
          <div className="w-10"></div>
        </div>
      )}

      {/* Venues List */}
      {activeTab === "venues" && (
        <div className="space-y-2">
          {filteredVenues?.map((venue) => (
            <div
              key={venue.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Edit Button */}
              <Button variant="ghost" size="icon" onClick={() => openEditVenue(venue)} className="shrink-0">
                <Pencil className="w-5 h-5 text-sidebar-accent" />
              </Button>

              {/* Customer Name */}
              <div className="flex-1 font-semibold text-secondary text-right">
                {venue.ownerName}
              </div>

              {/* Venue Address */}
              <div className="flex-1 text-muted-foreground text-right">
                {venue.address}
              </div>

              {/* Venue Count */}
              <div className="w-24 text-center text-secondary">
                {venue.venueCount}
              </div>

              {/* Device Count */}
              <div className="w-24 text-center text-secondary">
                {venue.deviceCount}
              </div>

              {/* Subscription Cost */}
              <div className="w-24 text-center text-secondary">
                ₪ {venue.monthly_subscription?.toLocaleString() || 0}
              </div>

              {/* Total Transactions */}
              <div className="w-32 text-center font-semibold text-secondary">
                ₪ {venue.totalTransactions?.toLocaleString() || 0}
              </div>

              {/* View Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSelectedVenue(venue)}>
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>פרטי אולם</DialogTitle>
                  </DialogHeader>
                  <VenueDetails venue={venue} />
                </DialogContent>
              </Dialog>
            </div>
          ))}
          {!filteredVenues?.length && (
            <div className="text-center py-12 text-muted-foreground">
              לא נמצאו אולמות
            </div>
          )}
        </div>
      )}

      {/* Events List */}
      {activeTab === "events" && (
        <div className="space-y-2">
          {filteredEvents?.map((event: any) => (
            <div
              key={event.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Edit Button */}
              <Button variant="ghost" size="icon" onClick={() => openEditEvent(event)} className="shrink-0">
                <Pencil className="w-5 h-5 text-sidebar-accent" />
              </Button>

              {/* Customer Name */}
              <div className="flex-1 font-semibold text-secondary text-right">
                {event.ownerName || "—"}
              </div>

              {/* Venue Name */}
              <div className="flex-1 text-muted-foreground text-right">
                {event.venues?.name || "—"}
              </div>

              {/* Event Date */}
              <div className="w-28 text-center text-secondary">
                {new Date(event.event_date).toLocaleDateString("he-IL")}
              </div>

              {/* Payment Status Badge */}
              <div className="w-28 text-center">
                {event.payment_completed ? (
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                    שולם
                  </span>
                ) : (
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                    סמן כשולם
                  </span>
                )}
              </div>

              {/* Device Returned Badge */}
              <div className="w-28 text-center">
                {event.device_returned ? (
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-green-500 text-white">
                    הוחזר
                  </span>
                ) : (
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-yellow-500 text-white">
                    סמן כהוחזר
                  </span>
                )}
              </div>

              {/* Missing Documents Badge */}
              <div className="w-32 text-center">
                {event.allDocsComplete ? (
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-green-500 text-white">
                    הושלמו בהצלחה
                  </span>
                ) : (
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-red-500 text-white">
                    חסר {event.missingDocsCount} מסמכים
                  </span>
                )}
              </div>

              {/* View Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSelectedEvent(event)}>
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 overflow-hidden" hideCloseButton>
                  <EventDetailsDialog event={event} onClose={() => setSelectedEvent(null)} />
                </DialogContent>
              </Dialog>
            </div>
          ))}
          {!filteredEvents?.length && (
            <div className="text-center py-12 text-muted-foreground">
              לא נמצאו אירועים
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VenueDetails({ venue }: { venue: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">שם הלקוח</Label>
          <p className="font-medium">{venue.ownerName}</p>
        </div>
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
          <Label className="text-muted-foreground">עלות מנוי</Label>
          <p className="font-medium">₪{venue.monthly_subscription?.toLocaleString()}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">כמות מכשירים</Label>
          <p className="font-medium">{venue.deviceCount}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">סך עסקאות</Label>
          <p className="font-medium">₪{venue.totalTransactions?.toLocaleString()}</p>
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
      </div>
    </div>
  );
}
