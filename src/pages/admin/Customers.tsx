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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Filter,
  LogIn,
  Loader2,
  Trash2,
  Bell,
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
import { VenueDetailsDialog } from "@/components/admin/VenueDetailsDialog";

export default function Customers() {
  const [activeTab, setActiveTab] = useState<"venues" | "events">("venues");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditVenueOpen, setIsEditVenueOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVenueId, setFilterVenueId] = useState<string>("all");
  
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
  const [newEventChildName, setNewEventChildName] = useState("");
  const [newEventFamilyName, setNewEventFamilyName] = useState("");
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
        .select("user_id, full_name, phone")
        .in("user_id", ownerIds);
      
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
        
        const profile = profiles?.find(p => p.user_id === venue.owner_id);
        return {
          ...venue,
          ownerName: profile?.full_name || "לא ידוע",
          ownerPhone: profile?.phone || "",
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
        .select("user_id, full_name, phone, email")
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
        
        // Compute KYC docs status
        const setupData = event.payment_setup_data as any;
        const hasKycFiles = !!(setupData?.socialIdFile || setupData?.bankApprovalFile);
        let kycStatus: string | null = event.kyc_docs_status;
        if (!kycStatus && hasKycFiles && event.seller_payme_id) {
          kycStatus = 'pending';
        }
        
        const profile = profiles?.find(p => p.user_id === event.owner_id);
        return {
          ...event,
          ownerName: profile?.full_name || "לא ידוע",
          ownerPhone: profile?.phone || "",
          ownerEmail: profile?.email || "",
          missingDocsCount: missingDocs.length,
          allDocsComplete: missingDocs.length === 0,
          kycStatus,
          hasKycFiles,
        };
      });
    },
  });

  // Filter data based on search
  const filteredVenues = venues?.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || v.name.toLowerCase().includes(q) ||
      v.address.toLowerCase().includes(q) ||
      v.ownerName.toLowerCase().includes(q);
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "paid" && v.totalTransactions > 0) ||
      (filterStatus === "unpaid" && v.totalTransactions === 0);
    
    return matchesSearch && matchesStatus;
  });

  const filteredEvents = events?.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      e.ownerName?.toLowerCase().includes(q) ||
      e.groom_name?.toLowerCase().includes(q) ||
      e.bride_name?.toLowerCase().includes(q) ||
      e.venues?.name?.toLowerCase().includes(q)
    );

    const matchesDate = (!filterDateFrom || e.event_date >= filterDateFrom) &&
      (!filterDateTo || e.event_date <= filterDateTo);

    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "docs_complete" && e.allDocsComplete) ||
      (filterStatus === "docs_missing" && !e.allDocsComplete) ||
      (filterStatus === "paid" && e.payment_completed) ||
      (filterStatus === "unpaid" && !e.payment_completed) ||
      (filterStatus === "kyc_pending" && e.kycStatus === 'pending') ||
      (filterStatus === "kyc_approved" && e.kycStatus === 'approved') ||
      (filterStatus === "kyc_missing" && !e.kycStatus && e.seller_payme_id);

    const matchesVenue = filterVenueId === "all" || e.venue_id === filterVenueId;

    return matchesSearch && matchesDate && matchesStatus && matchesVenue;
  });

  const pendingKycCount = events?.filter(e => e.kycStatus === 'pending').length || 0;

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
            groomName: newEventGroomName || null,
            brideName: newEventBrideName || null,
            childName: newEventChildName || null,
            familyName: newEventFamilyName || null,
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

      // Update owner phone in profiles
      if (newOwnerPhone !== undefined) {
        await supabase.from("profiles").update({
          phone: newOwnerPhone || null,
        }).eq("user_id", selectedVenue.owner_id);
      }
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
        child_name: newEventChildName || null,
        family_name: newEventFamilyName || null,
        event_date: newEventDate,
        event_type: newEventType,
        venue_id: newEventVenueId || null,
        device_rental_cost: parseFloat(newEventRentalCost) || 0,
      }).eq("id", selectedEvent.id);
      if (error) throw error;

      // Update owner phone/email in profiles
      await supabase.from("profiles").update({
        phone: newEventOwnerPhone || null,
      }).eq("user_id", selectedEvent.owner_id);
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
    setNewEventChildName("");
    setNewEventFamilyName("");
    setNewEventDate("");
    setNewEventType("חתונה");
    setNewEventVenueId("");
    setNewEventRentalCost("");
    setSelectedEvent(null);
  };

  const openEditVenue = (venue: any) => {
    setSelectedVenue(venue);
    setNewOwnerFullName(venue.ownerName || "");
    setNewOwnerPhone(venue.ownerPhone || "");
    setNewVenueName(venue.name);
    setNewVenueAddress(venue.address);
    setNewVenuePhone(venue.phone || "");
    setNewVenueEmail(venue.email || "");
    setNewVenueSubscription(venue.monthly_subscription?.toString() || "");
    setIsEditVenueOpen(true);
  };

  const openEditEvent = (event: any) => {
    setSelectedEvent(event);
    setNewEventOwnerFullName(event.ownerName || "");
    setNewEventOwnerPhone(event.ownerPhone || "");
    setNewEventOwnerEmail(event.ownerEmail || "");
    setNewEventGroomName(event.groom_name || "");
    setNewEventBrideName(event.bride_name || "");
    setNewEventChildName(event.child_name || "");
    setNewEventFamilyName(event.family_name || "");
    setNewEventDate(event.event_date);
    setNewEventType(event.event_type || "חתונה");
    setNewEventVenueId(event.venue_id || "");
    setNewEventRentalCost(event.device_rental_cost?.toString() || "");
    setIsEditEventOpen(true);
  };

  const handleImpersonate = async (userId: string) => {
    setImpersonating(userId);
    try {
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { userId }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      window.open(data.url, '_blank');
      toast({ title: "קישור כניסה נפתח בטאב חדש", description: `נכנס כ-${data.email}` });
    } catch (error: any) {
      toast({ title: "שגיאה בהתחזות", description: error.message, variant: "destructive" });
    } finally {
      setImpersonating(null);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Delete venue owner (user + venue)
  const deleteVenueOwner = useMutation({
    mutationFn: async (venue: any) => {
      // Delete venue first (cascades devices, events etc.)
      const { error: venueError } = await supabase.from("venues").delete().eq("id", venue.id);
      if (venueError) throw venueError;
      
      // Delete the user via edge function
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'delete', userId: venue.owner_id }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues-with-stats"] });
      toast({ title: "בעל האולם נמחק בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה במחיקה", description: error.message, variant: "destructive" });
    },
  });

  // Delete event owner (user + event)
  const deleteEventOwner = useMutation({
    mutationFn: async (event: any) => {
      // Delete event
      const { error: eventError } = await supabase.from("events").delete().eq("id", event.id);
      if (eventError) throw eventError;
      
      // Delete the user via edge function
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'delete', userId: event.owner_id }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: "בעל האירוע נמחק בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה במחיקה", description: error.message, variant: "destructive" });
    },
  });

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
          <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
            <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
              <button onClick={() => { activeTab === "venues" ? setIsAddVenueOpen(false) : setIsAddEventOpen(false); }} className="hover:opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              <h2 className="text-lg font-semibold">{activeTab === "venues" ? "הוספת לקוח חדש" : "הוספת בעל אירוע חדש"}</h2>
              <Plus className="w-5 h-5" />
            </div>
            {activeTab === "venues" ? (
              <div className="bg-white p-6 space-y-6">
                {/* Row 1: Name, Phone, Email */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הלקוח</Label>
                    <Input variant="form" value={newOwnerFullName} onChange={(e) => setNewOwnerFullName(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">טלפון</Label>
                    <Input variant="form" value={newOwnerPhone} onChange={(e) => setNewOwnerPhone(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת מייל</Label>
                    <Input variant="form" type="email" value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} className="text-center" />
                  </div>
                </div>

                {/* Row 2: Venue Name, Address, Venue Count */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">שם האולם</Label>
                    <Input variant="form" value={newVenueName} onChange={(e) => setNewVenueName(e.target.value)} className="text-center text-[#c9a54e] font-bold" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת האולם</Label>
                    <Input variant="form" value={newVenueAddress} onChange={(e) => setNewVenueAddress(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">כמות אולמות</Label>
                    <Input variant="form" type="number" defaultValue="1" disabled className="text-center" />
                  </div>
                </div>

                {/* Row 3: Password and Subscription */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">סיסמה</Label>
                    <Input variant="form" type="password" value={newOwnerPassword} onChange={(e) => setNewOwnerPassword(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">עלות מנוי (₪)</Label>
                    <Input variant="form" type="number" value={newVenueSubscription} onChange={(e) => setNewVenueSubscription(e.target.value)} className="text-center" />
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button 
                    onClick={() => createVenueWithOwner.mutate()} 
                    disabled={!isVenueFormValid || createVenueWithOwner.isPending} 
                    className="rounded-full bg-[#1a2942] hover:bg-[#243a56] px-8"
                  >
                    {createVenueWithOwner.isPending ? "יוצר..." : "הוספת לקוח חדש ←"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 space-y-6">
                {/* Row 1: Name, Phone, Email */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">שם מלא</Label>
                    <Input variant="form" value={newEventOwnerFullName} onChange={(e) => setNewEventOwnerFullName(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">טלפון</Label>
                    <Input variant="form" value={newEventOwnerPhone} onChange={(e) => setNewEventOwnerPhone(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת מייל</Label>
                    <Input variant="form" type="email" value={newEventOwnerEmail} onChange={(e) => setNewEventOwnerEmail(e.target.value)} className="text-center" />
                  </div>
                </div>

                {/* Row 2: Event Type + Dynamic Fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">סוג אירוע</Label>
                    <Select value={newEventType} onValueChange={setNewEventType}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted border-0 text-center">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="חתונה">חתונה</SelectItem>
                        <SelectItem value="אירוסין">אירוסין</SelectItem>
                        <SelectItem value="בר מצווה">בר מצווה</SelectItem>
                        <SelectItem value="בת מצווה">בת מצווה</SelectItem>
                        <SelectItem value="ברית">ברית</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(newEventType === "חתונה" || newEventType === "אירוסין") ? (
                    <>
                      <div>
                        <Label className="text-muted-foreground text-sm mb-2 block text-center">שם החתן</Label>
                        <Input variant="form" value={newEventGroomName} onChange={(e) => setNewEventGroomName(e.target.value)} className="text-center" />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הכלה</Label>
                        <Input variant="form" value={newEventBrideName} onChange={(e) => setNewEventBrideName(e.target.value)} className="text-center" />
                      </div>
                    </>
                  ) : newEventType === "ברית" ? (
                    <>
                      <div>
                        <Label className="text-muted-foreground text-sm mb-2 block text-center">שם משפחה</Label>
                        <Input variant="form" value={newEventFamilyName} onChange={(e) => setNewEventFamilyName(e.target.value)} className="text-center" />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm mb-2 block text-center">תאריך אירוע</Label>
                        <Input variant="form" type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="text-center" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הילד/ה</Label>
                        <Input variant="form" value={newEventChildName} onChange={(e) => setNewEventChildName(e.target.value)} className="text-center" />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm mb-2 block text-center">שם משפחה</Label>
                        <Input variant="form" value={newEventFamilyName} onChange={(e) => setNewEventFamilyName(e.target.value)} className="text-center" />
                      </div>
                    </>
                  )}
                </div>

                {/* Row 3: Date (if not already shown) + Venue + Cost */}
                <div className="grid grid-cols-3 gap-4">
                  {newEventType !== "ברית" && (
                    <div>
                      <Label className="text-muted-foreground text-sm mb-2 block text-center">תאריך אירוע</Label>
                      <Input variant="form" type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="text-center" />
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">אולם</Label>
                    <Select value={newEventVenueId} onValueChange={setNewEventVenueId}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted border-0 text-center">
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
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">סיסמה</Label>
                    <Input variant="form" type="password" value={newEventOwnerPassword} onChange={(e) => setNewEventOwnerPassword(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">עלות השכרה (₪)</Label>
                    <Input variant="form" type="number" value={newEventRentalCost} onChange={(e) => setNewEventRentalCost(e.target.value)} className="text-center" />
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button 
                    onClick={() => createEventWithOwner.mutate()} 
                    disabled={!isEventFormValid || createEventWithOwner.isPending} 
                    className="rounded-full bg-[#1a2942] hover:bg-[#243a56] px-8"
                  >
                    {createEventWithOwner.isPending ? "יוצר..." : "הוספת בעל אירוע חדש ←"}
                  </Button>
                </div>
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
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("text-muted-foreground", showFilters && "bg-secondary/10 text-secondary")}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-4 animate-fade-in">
          {activeTab === "events" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">מתאריך</label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-40 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">עד תאריך</label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-40 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">אולם</label>
                <Select value={filterVenueId} onValueChange={setFilterVenueId}>
                  <SelectTrigger className="w-40 text-sm">
                    <SelectValue placeholder="כל האולמות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל האולמות</SelectItem>
                    {venues?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">סטטוס</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 text-sm">
                <SelectValue placeholder="הכל" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {activeTab === "events" ? (
                  <>
                    <SelectItem value="paid">שולם</SelectItem>
                    <SelectItem value="unpaid">לא שולם</SelectItem>
                    <SelectItem value="docs_complete">מסמכים הושלמו</SelectItem>
                    <SelectItem value="docs_missing">מסמכים חסרים</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="paid">יש עסקאות</SelectItem>
                    <SelectItem value="unpaid">אין עסקאות</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterStatus("all"); setFilterVenueId("all"); }}
            className="rounded-full text-xs"
          >
            נקה סינון
          </Button>
        </div>
      )}

      {/* Edit Venue Dialog */}
      <Dialog open={isEditVenueOpen} onOpenChange={setIsEditVenueOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsEditVenueOpen(false)} className="hover:opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h2 className="text-lg font-semibold">עריכת אולם</h2>
            <Pencil className="w-5 h-5" />
          </div>
          <div className="bg-white p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">שם האולם</Label>
                <Input 
                  variant="form" 
                  value={newVenueName} 
                  onChange={(e) => setNewVenueName(e.target.value)} 
                  className="text-center text-[#c9a54e] font-bold focus:ring-2 focus:ring-[#c9a54e] focus:border-[#c9a54e]"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת</Label>
                <Input variant="form" value={newVenueAddress} onChange={(e) => setNewVenueAddress(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">טלפון אולם</Label>
                <Input variant="form" value={newVenuePhone} onChange={(e) => setNewVenuePhone(e.target.value)} className="text-center" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">טלפון בעלים</Label>
                <Input variant="form" value={newOwnerPhone} onChange={(e) => setNewOwnerPhone(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">מייל</Label>
                <Input variant="form" type="email" value={newVenueEmail} onChange={(e) => setNewVenueEmail(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">עלות מנוי (₪)</Label>
                <Input variant="form" type="number" value={newVenueSubscription} onChange={(e) => setNewVenueSubscription(e.target.value)} className="text-center" />
              </div>
            </div>
            <div className="flex justify-start">
              <Button 
                onClick={() => updateVenue.mutate()} 
                disabled={!newVenueName || !newVenueAddress || updateVenue.isPending} 
                className="rounded-full bg-[#1a2942] hover:bg-[#243a56] px-8"
              >
                {updateVenue.isPending ? "שומר..." : "שמור שינויים ←"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsEditEventOpen(false)} className="hover:opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h2 className="text-lg font-semibold">עריכת אירוע</h2>
            <Pencil className="w-5 h-5" />
          </div>
          <div className="bg-white p-6 space-y-6">
            {/* Owner Info Row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">שם בעל האירוע</Label>
                <Input variant="form" value={newEventOwnerFullName} onChange={(e) => setNewEventOwnerFullName(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">טלפון</Label>
                <Input variant="form" value={newEventOwnerPhone} onChange={(e) => setNewEventOwnerPhone(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">מייל</Label>
                <Input variant="form" type="email" value={newEventOwnerEmail} disabled className="text-center bg-muted/50" />
              </div>
            </div>

            {/* Event Details Row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">שם החתן</Label>
                <Input variant="form" value={newEventGroomName} onChange={(e) => setNewEventGroomName(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הכלה</Label>
                <Input variant="form" value={newEventBrideName} onChange={(e) => setNewEventBrideName(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">תאריך אירוע</Label>
                <Input variant="form" type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="text-center" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">סוג אירוע</Label>
                <Select value={newEventType} onValueChange={setNewEventType}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted border-0 text-center">
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
                <Label className="text-muted-foreground text-sm mb-2 block text-center">אולם</Label>
                <Select value={newEventVenueId} onValueChange={setNewEventVenueId}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted border-0 text-center">
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
                <Label className="text-muted-foreground text-sm mb-2 block text-center">עלות השכרה (₪)</Label>
                <Input variant="form" type="number" value={newEventRentalCost} onChange={(e) => setNewEventRentalCost(e.target.value)} className="text-center" />
              </div>
            </div>
            <div className="flex justify-start">
              <Button 
                onClick={() => updateEvent.mutate()} 
                disabled={!newEventDate || updateEvent.isPending} 
                className="rounded-full bg-[#1a2942] hover:bg-[#243a56] px-8"
              >
                {updateEvent.isPending ? "שומר..." : "שמור שינויים ←"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Header */}
      {activeTab === "venues" && (
        <div className="flex items-center gap-4 px-4 py-3 text-sm text-muted-foreground font-medium">
          <div className="w-10"></div>
          <div className="flex-1 text-right">שם הלקוח</div>
          <div className="w-28 text-center">טלפון</div>
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
          <div className="w-28 text-center">טלפון</div>
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
              {/* Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>מחיקת בעל אולם</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם אתה בטוח שברצונך למחוק את {venue.ownerName}? פעולה זו תמחק את האולם, המכשירים והמשתמש לצמיתות.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteVenueOwner.mutate(venue)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      מחק
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Edit Button */}
              <Button variant="ghost" size="icon" onClick={() => openEditVenue(venue)} className="shrink-0">
                <Pencil className="w-5 h-5 text-sidebar-accent" />
              </Button>
              {/* Impersonate Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleImpersonate(venue.owner_id)} 
                disabled={impersonating === venue.owner_id}
                className="shrink-0"
                title="כניסה כמשתמש"
              >
                {impersonating === venue.owner_id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                ) : (
                  <LogIn className="w-5 h-5 text-blue-500" />
                )}
              </Button>

              {/* Customer Name */}
              <div className="flex-1 font-semibold text-secondary text-right">
                {venue.ownerName}
              </div>

              {/* Customer Phone */}
              <div className="w-28 text-center text-muted-foreground">
                {venue.ownerPhone || "—"}
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
                <DialogContent className="max-w-4xl p-0 overflow-hidden" hideCloseButton>
                  <VenueDetailsDialog venue={venue} onClose={() => setSelectedVenue(null)} />
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
              {/* Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>מחיקת בעל אירוע</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם אתה בטוח שברצונך למחוק את {event.ownerName}? פעולה זו תמחק את האירוע והמשתמש לצמיתות.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteEventOwner.mutate(event)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      מחק
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Edit Button */}
              <Button variant="ghost" size="icon" onClick={() => openEditEvent(event)} className="shrink-0">
                <Pencil className="w-5 h-5 text-sidebar-accent" />
              </Button>
              {/* Impersonate Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleImpersonate(event.owner_id)} 
                disabled={impersonating === event.owner_id}
                className="shrink-0"
                title="כניסה כמשתמש"
              >
                {impersonating === event.owner_id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                ) : (
                  <LogIn className="w-5 h-5 text-blue-500" />
                )}
              </Button>

              {/* Customer Name */}
              <div className="flex-1 font-semibold text-secondary text-right">
                {event.ownerName || "—"}
              </div>

              {/* Customer Phone */}
              <div className="w-28 text-center text-muted-foreground">
                {event.ownerPhone || "—"}
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
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await supabase.from("events").update({ payment_completed: true }).eq("id", event.id);
                      queryClient.invalidateQueries({ queryKey: ["events-list"] });
                      toast({ title: "סומן כשולם בהצלחה" });
                    }}
                    className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-colors"
                  >
                    סמן כשולם
                  </button>
                )}
              </div>

              {/* Device Returned Badge */}
              <div className="w-28 text-center">
                {event.device_returned ? (
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-green-500 text-white">
                    הוחזר
                  </span>
                ) : (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await supabase.from("events").update({ device_returned: true }).eq("id", event.id);
                      queryClient.invalidateQueries({ queryKey: ["events-list"] });
                      toast({ title: "סומן כהוחזר בהצלחה" });
                    }}
                    className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer transition-colors"
                  >
                    סמן כהוחזר
                  </button>
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
