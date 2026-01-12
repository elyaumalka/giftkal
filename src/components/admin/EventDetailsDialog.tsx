import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, User, Eye, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventDetailsDialogProps {
  event: any;
  onClose: () => void;
}

export function EventDetailsDialog({ event, onClose }: EventDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newDocName, setNewDocName] = useState("");
  const [newDocRequired, setNewDocRequired] = useState("true");
  
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
  const { data: requiredDocs } = useQuery({
    queryKey: ["required-documents-event"],
    queryFn: async () => {
      const { data } = await supabase
        .from("required_documents")
        .select("*")
        .eq("for_type", "event")
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
  const { data: devices } = useQuery({
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
        for_type: "event",
        is_required: newDocRequired === "true",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["required-documents-event"] });
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
      queryClient.invalidateQueries({ queryKey: ["required-documents-event"] });
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: "מסמך נדרש נמחק" });
    },
  });

  // Mark as paid
  const markAsPaid = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .update({ payment_completed: true })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: "סומן כשולם" });
    },
  });

  // Toggle device returned
  const toggleDeviceReturned = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .update({ device_returned: !event.device_returned })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: event.device_returned ? "סומן כלא הוחזר" : "סומן כהוחזר" });
    },
  });

  const uploadedDocTypes = uploadedDocs?.map((d: any) => d.document_type) || [];

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Custom Header with buttons */}
      <div className="bg-secondary text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => {}}
            className="bg-secondary border border-white text-white hover:bg-white/10 rounded-full px-6"
          >
            הוספת מכשיר
          </Button>
          {!event.payment_completed && (
            <Button
              onClick={() => markAsPaid.mutate()}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6"
              disabled={markAsPaid.isPending}
            >
              סמן כשולם
            </Button>
          )}
        </div>
        <h2 className="text-lg font-semibold">פרטי לקוח</h2>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto">
        {/* Customer Info Row */}
        <div className="bg-muted rounded-2xl p-4 flex items-center gap-4 mb-6 flex-row-reverse flex-wrap">
          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-secondary" />
          </div>
          <div className="text-right min-w-[100px]">
            <p className="text-xs text-muted-foreground">שם הלקוח</p>
            <p className="font-semibold text-secondary text-sm">{ownerProfile?.full_name || event.ownerName || "—"}</p>
          </div>
          <div className="text-right min-w-[100px]">
            <p className="text-xs text-muted-foreground">טלפון</p>
            <p className="font-medium text-secondary text-sm">{ownerProfile?.phone || "—"}</p>
          </div>
          <div className="text-right min-w-[140px]">
            <p className="text-xs text-muted-foreground">כתובת מייל</p>
            <p className="font-medium text-secondary text-sm">{ownerProfile?.email || "—"}</p>
          </div>
          <div className="text-right min-w-[100px]">
            <p className="text-xs text-muted-foreground">שם האולם</p>
            <p className="font-medium text-secondary text-sm">{event.venues?.name || "—"}</p>
          </div>
          <div className="text-right min-w-[120px]">
            <p className="text-xs text-muted-foreground">כתובת האולם</p>
            <p className="font-medium text-secondary text-sm">{event.venues?.address || "—"}</p>
          </div>
          <div className="text-right min-w-[80px]">
            <p className="text-xs text-muted-foreground">תאריך אירוע</p>
            <p className="font-medium text-secondary text-sm">{new Date(event.event_date).toLocaleDateString("he-IL")}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6">
        {/* Left side - Documents */}
        <div className="space-y-4">
          {/* Add Document Row */}
          <div className="flex items-center gap-3 flex-row-reverse">
            <Button
              size="icon"
              className="rounded-full bg-muted hover:bg-muted/80 text-secondary shrink-0"
              onClick={() => newDocName && addRequiredDoc.mutate()}
              disabled={!newDocName || addRequiredDoc.isPending}
            >
              <Plus className="w-5 h-5" />
            </Button>
            <Select value={newDocRequired} onValueChange={setNewDocRequired}>
              <SelectTrigger className="w-32 h-10 rounded-xl bg-white border text-right">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">חובה</SelectItem>
                <SelectItem value="false">לא חובה</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="שם המסמך"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              className="h-10 rounded-xl bg-white border text-right flex-1"
            />
          </div>

          {/* Required Documents Grid */}
          <div className="grid grid-cols-3 gap-3">
            {requiredDocs?.map((doc: any) => {
              const isUploaded = uploadedDocTypes.includes(doc.document_type);
              const uploadedDoc = uploadedDocs?.find((d: any) => d.document_type === doc.document_type);
              
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 border shadow-sm"
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
                        className="w-full rounded-lg text-xs"
                        onClick={() => deleteRequiredDoc.mutate(doc.id)}
                      >
                        מחיקה
                      </Button>
                    </>
                  ) : (
                    <div className="w-full h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                      <Plus className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side - Devices & Cost */}
        <div className="space-y-4">
          {/* Devices Section */}
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-lg font-semibold text-secondary">מכשירים מקושרים</h3>
            <span className="text-2xl font-bold text-secondary">{devices?.length || 0}</span>
          </div>

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
                    event.device_returned
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-green-500 hover:bg-green-600"
                  } text-white`}
                  onClick={() => toggleDeviceReturned.mutate()}
                >
                  {event.device_returned ? "הוחזר" : "סמן כהוחזר"}
                </Button>
              </div>
            ))}
            {!devices?.length && (
              <div className="col-span-2 text-center text-muted-foreground py-4">
                אין מכשירים מקושרים
              </div>
            )}
          </div>

          {/* Rental Cost Card */}
          <div className="bg-secondary rounded-2xl p-6 flex items-center justify-between flex-row-reverse mt-4">
            <h3 className="text-lg font-semibold text-white">עלות השכרה</h3>
            <p className="text-2xl font-bold text-white">₪ {event.device_rental_cost?.toLocaleString() || 0}</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
