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
import { Plus, User, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { DialogClose } from "@radix-ui/react-dialog";

interface VenueDetailsDialogProps {
  venue: any;
  onClose: () => void;
}

export function VenueDetailsDialog({ venue, onClose }: VenueDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceSerial, setNewDeviceSerial] = useState("");
  
  // Fetch owner profile
  const { data: ownerProfile } = useQuery({
    queryKey: ["venue-owner-profile", venue.owner_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", venue.owner_id)
        .single();
      return data;
    },
    enabled: !!venue.owner_id,
  });

  // Fetch devices for this venue
  const { data: devices, refetch: refetchDevices } = useQuery({
    queryKey: ["venue-devices-dialog", venue.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("devices")
        .select("*")
        .eq("venue_id", venue.id);
      return data || [];
    },
  });

  // Fetch required documents for venue owners
  const { data: requiredDocs } = useQuery({
    queryKey: ["required-documents-venue"],
    queryFn: async () => {
      const { data } = await supabase
        .from("required_documents")
        .select("*")
        .eq("for_type", "venue_owner")
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Fetch uploaded documents for this venue owner
  const { data: uploadedDocs } = useQuery({
    queryKey: ["venue-owner-documents", venue.owner_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", venue.owner_id);
      return data || [];
    },
    enabled: !!venue.owner_id,
  });

  // Count events for this venue
  const { data: eventsCount } = useQuery({
    queryKey: ["venue-events-count", venue.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("venue_id", venue.id);
      return count || 0;
    },
  });

  // Count transactions for this venue
  const { data: transactionsCount } = useQuery({
    queryKey: ["venue-transactions-count", venue.id],
    queryFn: async () => {
      // Get all events for this venue
      const { data: events } = await supabase
        .from("events")
        .select("id")
        .eq("venue_id", venue.id);
      
      if (!events?.length) return 0;
      
      const eventIds = events.map(e => e.id);
      const { count } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .in("event_id", eventIds);
      
      return count || 0;
    },
  });

  // Add device
  const addDevice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("devices").insert({
        name: newDeviceName,
        serial_number: newDeviceSerial,
        venue_id: venue.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDevices();
      queryClient.invalidateQueries({ queryKey: ["venues-with-stats"] });
      setNewDeviceName("");
      setNewDeviceSerial("");
      setIsAddDeviceOpen(false);
      toast({ title: "מכשיר נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת מכשיר", description: error.message, variant: "destructive" });
    },
  });

  // Delete device
  const deleteDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase.from("devices").delete().eq("id", deviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDevices();
      queryClient.invalidateQueries({ queryKey: ["venues-with-stats"] });
      toast({ title: "מכשיר נמחק בהצלחה" });
    },
  });

  const uploadedDocTypes = uploadedDocs?.map((d: any) => d.document_type) || [];

  return (
    <div className="flex flex-col max-h-[85vh]" dir="rtl">
      {/* Header - Title on RIGHT, buttons on LEFT */}
      <div className="bg-secondary text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">פרטי לקוח</h2>
        <div className="flex items-center gap-3">
          {/* Add Device Button */}
          <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-secondary border border-white text-white hover:bg-white/10 rounded-full px-6"
              >
                הוספת מכשיר
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>הוספת מכשיר חדש</DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block">שם המכשיר</Label>
                  <Input 
                    variant="form" 
                    value={newDeviceName} 
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="טאבלט גלאקסי S10"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block">מספר סריאלי</Label>
                  <Input 
                    variant="form" 
                    value={newDeviceSerial} 
                    onChange={(e) => setNewDeviceSerial(e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <Button 
                  onClick={() => addDevice.mutate()} 
                  disabled={!newDeviceName || !newDeviceSerial || addDevice.isPending}
                  className="w-full rounded-full bg-secondary hover:bg-secondary/90"
                >
                  {addDevice.isPending ? "מוסיף..." : "הוסף מכשיר"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto bg-background">
        {/* Customer Info Row - gray background */}
        <div className="bg-muted rounded-2xl p-4 flex items-center gap-6 mb-6">
          {/* Avatar */}
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 border">
            <User className="w-6 h-6 text-secondary" />
          </div>
          
          {/* Info fields from right to left */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">שם הלקוח</p>
            <p className="font-semibold text-secondary text-sm">{ownerProfile?.full_name || venue.ownerName || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">טלפון</p>
            <p className="font-medium text-secondary text-sm">{ownerProfile?.phone || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">כתובת מייל</p>
            <p className="font-medium text-secondary text-sm">{ownerProfile?.email || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">שם האולם</p>
            <p className="font-medium text-secondary text-sm">{venue.name || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">כתובת האולם</p>
            <p className="font-medium text-secondary text-sm">{venue.address || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">כמות אולמות</p>
            <p className="font-medium text-secondary text-sm">{venue.venueCount || 1}</p>
          </div>
        </div>

        {/* Main Content Grid - RIGHT: devices & docs, LEFT: stats */}
        <div className="grid grid-cols-2 gap-6">
          {/* RIGHT Column - Devices & Documents */}
          <div className="space-y-4">
            {/* Devices Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary">מכשירים מקושרים</h3>
              <span className="text-2xl font-bold text-secondary">{devices?.length || 0}</span>
            </div>

            {/* Device Cards */}
            <div className="grid grid-cols-2 gap-3">
              {devices?.map((device: any) => (
                <div
                  key={device.id}
                  className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 border shadow-sm"
                >
                  <p className="text-sm font-semibold text-secondary">{device.name}</p>
                  <p className="text-xs text-muted-foreground">סריאלי: {device.serial_number}</p>
                  <Button
                    size="sm"
                    className="w-full rounded-lg text-xs bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => deleteDevice.mutate(device.id)}
                  >
                    מחיקה
                  </Button>
                </div>
              ))}
              {!devices?.length && (
                <div className="col-span-2 text-center text-muted-foreground py-4">
                  אין מכשירים מקושרים
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {requiredDocs?.map((doc: any) => {
                const isUploaded = uploadedDocTypes.includes(doc.document_type);
                const uploadedDoc = uploadedDocs?.find((d: any) => d.document_type === doc.document_type);
                
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 border shadow-sm min-h-[100px]"
                  >
                    <p className="text-sm font-medium text-secondary text-center">{doc.document_type}</p>
                    {isUploaded ? (
                      <>
                        <Button
                          size="sm"
                          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs"
                          onClick={() => uploadedDoc?.file_url && window.open(uploadedDoc.file_url, '_blank')}
                        >
                          צפייה במסמך
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full rounded-lg text-xs bg-red-500 hover:bg-red-600"
                        >
                          מחיקה
                        </Button>
                      </>
                    ) : (
                      <div className="w-full flex-1 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center min-h-[50px]">
                        <Plus className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Add document placeholder */}
              <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 border shadow-sm min-h-[100px]">
                <p className="text-sm font-medium text-muted-foreground text-center">העלאת מסמך</p>
                <div className="w-full flex-1 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground/50" />
                </div>
              </div>
            </div>
          </div>

          {/* LEFT Column - Stats Cards */}
          <div className="space-y-4">
            {/* Monthly Subscription Card - dark blue */}
            <div className="bg-secondary rounded-2xl p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">עלות מנוי לחודש</h3>
              <p className="text-2xl font-bold text-white">₪ {venue.monthly_subscription?.toLocaleString() || 0}</p>
            </div>

            {/* Total Events Card - tan/beige */}
            <div className="bg-amber-100 rounded-2xl p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary">סך כל האירועים</h3>
              <p className="text-2xl font-bold text-secondary">{eventsCount || 0}</p>
            </div>

            {/* Total Transactions Card - light blue */}
            <div className="bg-blue-100 rounded-2xl p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary">כמות עסקאות במערכת</h3>
              <p className="text-2xl font-bold text-secondary">{transactionsCount?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
