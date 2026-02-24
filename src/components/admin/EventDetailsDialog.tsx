import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface EventDetailsDialogProps {
  event: any;
  onClose: () => void;
}

export function EventDetailsDialog({ event, onClose }: EventDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newDocName, setNewDocName] = useState("");
  const [newDocRequired, setNewDocRequired] = useState("true");
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceSerial, setNewDeviceSerial] = useState("");
  const [localPaymentCompleted, setLocalPaymentCompleted] = useState(event.payment_completed);
  const [localDeviceReturned, setLocalDeviceReturned] = useState(event.device_returned);
  const [localBudgetEnabled, setLocalBudgetEnabled] = useState(event.budget_enabled ?? false);
  
  // Fetch owner profile
  const { data: ownerProfile } = useQuery({
    queryKey: ["event-owner-profile", event.owner_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", event.owner_id)
        .single();
      return data;
    },
    enabled: !!event.owner_id,
  });

  // Fetch required documents for this event
  const { data: requiredDocs, refetch: refetchDocs } = useQuery({
    queryKey: ["required-documents-event"],
    queryFn: async () => {
      const { data } = await supabase
        .from("required_documents")
        .select("*")
        .eq("for_type", "event_owner")
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Fetch uploaded documents for this event
  const { data: uploadedDocs } = useQuery({
    queryKey: ["event-documents", event.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("event_id", event.id);
      return data || [];
    },
  });

  // Fetch devices linked to the venue
  const { data: devices, refetch: refetchDevices } = useQuery({
    queryKey: ["venue-devices", event.venue_id],
    queryFn: async () => {
      if (!event.venue_id) return [];
      const { data } = await supabase
        .from("devices")
        .select("*")
        .eq("venue_id", event.venue_id);
      return data || [];
    },
    enabled: !!event.venue_id,
  });

  // Add required document
  const addRequiredDoc = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("required_documents").insert({
        document_type: newDocName,
        for_type: "event_owner",
        is_required: newDocRequired === "true",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDocs();
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      setNewDocName("");
      toast({ title: "מסמך נדרש נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת מסמך", description: error.message, variant: "destructive" });
    },
  });

  // Delete required document
  const deleteRequiredDoc = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("required_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDocs();
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: "מסמך נדרש נמחק" });
    },
  });

  // Add device
  const addDevice = useMutation({
    mutationFn: async () => {
      if (!event.venue_id) throw new Error("אין אולם מקושר לאירוע");
      const { error } = await supabase.from("devices").insert({
        name: newDeviceName,
        serial_number: newDeviceSerial,
        venue_id: event.venue_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDevices();
      setNewDeviceName("");
      setNewDeviceSerial("");
      setIsAddDeviceOpen(false);
      toast({ title: "מכשיר נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת מכשיר", description: error.message, variant: "destructive" });
    },
  });

  // Toggle payment status
  const togglePayment = useMutation({
    mutationFn: async () => {
      const newStatus = !localPaymentCompleted;
      const { error } = await supabase
        .from("events")
        .update({ payment_completed: newStatus })
        .eq("id", event.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      setLocalPaymentCompleted(newStatus);
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: newStatus ? "סומן כשולם" : "סומן כלא שולם" });
    },
  });

  // Toggle device returned
  const toggleDeviceReturned = useMutation({
    mutationFn: async () => {
      const newStatus = !localDeviceReturned;
      const { error } = await supabase
        .from("events")
        .update({ device_returned: newStatus })
        .eq("id", event.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      setLocalDeviceReturned(newStatus);
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: newStatus ? "סומן כהוחזר" : "סומן כלא הוחזר" });
    },
  });

  // Toggle budget enabled
  const toggleBudget = useMutation({
    mutationFn: async () => {
      const newStatus = !localBudgetEnabled;
      const { error } = await supabase
        .from("events")
        .update({ budget_enabled: newStatus })
        .eq("id", event.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      setLocalBudgetEnabled(newStatus);
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: newStatus ? "ניהול תקציב הופעל" : "ניהול תקציב כובה" });
    },
  });

  const uploadedDocTypes = uploadedDocs?.map((d: any) => d.document_type) || [];

  return (
    <div className="flex flex-col max-h-[85vh]" dir="rtl">
      {/* Header - Title on RIGHT, buttons on LEFT */}
      <div className="bg-secondary text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">פרטי לקוח</h2>
        <div className="flex items-center gap-3">
          {/* Budget Toggle Button */}
          <Button
            onClick={() => toggleBudget.mutate()}
            className={`${
              localBudgetEnabled 
                ? "bg-purple-500 hover:bg-purple-600" 
                : "bg-gray-500 hover:bg-gray-600"
            } text-white rounded-full px-6`}
            disabled={toggleBudget.isPending}
          >
            {localBudgetEnabled ? "תקציב פעיל" : "הפעל תקציב"}
          </Button>

          {/* Payment Toggle Button */}
          <Button
            onClick={() => togglePayment.mutate()}
            className={`${
              localPaymentCompleted 
                ? "bg-blue-500 hover:bg-blue-600" 
                : "bg-green-500 hover:bg-green-600"
            } text-white rounded-full px-6`}
            disabled={togglePayment.isPending}
          >
            {localPaymentCompleted ? "שולם" : "סמן כשולם"}
          </Button>
          
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
            <p className="font-semibold text-secondary text-sm">{ownerProfile?.full_name || event.ownerName || "—"}</p>
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
            <p className="font-medium text-secondary text-sm">{event.venues?.name || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">כתובת האולם</p>
            <p className="font-medium text-secondary text-sm">{event.venues?.address || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">תאריך אירוע</p>
            <p className="font-medium text-secondary text-sm">{new Date(event.event_date).toLocaleDateString("he-IL")}</p>
          </div>
        </div>

        {/* Main Content Grid - RIGHT: devices, LEFT: documents */}
        <div className="grid grid-cols-2 gap-6">
          {/* RIGHT Column - Devices */}
          <div className="space-y-4">
            {/* Devices Header - title RIGHT, count LEFT */}
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
                    className={`w-full rounded-lg text-xs ${
                      localDeviceReturned
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white`}
                    onClick={() => toggleDeviceReturned.mutate()}
                  >
                    {localDeviceReturned ? "הוחזר" : "סמן כהוחזר"}
                  </Button>
                </div>
              ))}
              {!devices?.length && (
                <div className="col-span-2 text-center text-muted-foreground py-4">
                  אין מכשירים מקושרים
                </div>
              )}
            </div>

            {/* Rental Cost Card - dark blue */}
            <div className="bg-secondary rounded-2xl p-6 flex items-center justify-between mt-4">
              <p className="text-2xl font-bold text-white">₪ {event.device_rental_cost?.toLocaleString() || 0}</p>
              <h3 className="text-lg font-semibold text-white">עלות השכרה</h3>
            </div>
          </div>

          {/* LEFT Column - Documents */}
          <div className="space-y-4">
            {/* Add Document Row - name first, then required/not, then + button */}
            <div className="flex items-center gap-3">
              <Input
                placeholder="שם המסמך"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                className="h-10 rounded-xl bg-white border text-right flex-1"
              />
              <Select value={newDocRequired} onValueChange={setNewDocRequired}>
                <SelectTrigger className="w-32 h-10 rounded-xl bg-white border text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">חובה</SelectItem>
                  <SelectItem value="false">לא חובה</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon"
                className="rounded-full bg-white hover:bg-muted text-secondary shrink-0 border shadow-sm"
                onClick={() => newDocName && addRequiredDoc.mutate()}
                disabled={!newDocName || addRequiredDoc.isPending}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Required Documents Grid - 3 columns */}
            <div className="grid grid-cols-3 gap-3">
              {requiredDocs?.map((doc: any) => {
                const isUploaded = uploadedDocTypes.includes(doc.document_type);
                const uploadedDoc = uploadedDocs?.find((d: any) => d.document_type === doc.document_type);
                
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 border shadow-sm min-h-[120px]"
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
                          onClick={() => deleteRequiredDoc.mutate(doc.id)}
                        >
                          מחיקה
                        </Button>
                      </>
                    ) : (
                      <div className="w-full flex-1 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center min-h-[60px]">
                        <Plus className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Empty placeholder cards if less than 6 docs */}
              {Array.from({ length: Math.max(0, 6 - (requiredDocs?.length || 0)) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 border shadow-sm min-h-[120px]"
                >
                  <div className="w-full flex-1 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
