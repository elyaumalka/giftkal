import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Building2, Monitor, Copy, Check, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";

export default function VenueHalls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", default_message: "ברוכים הבאים" });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get venue for current user
  useEffect(() => {
    const getVenue = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();
      if (data) setVenueId(data.id);
    };
    getVenue();
  }, []);

  // Fetch halls
  const { data: halls, isLoading } = useQuery({
    queryKey: ["venue-halls", venueId],
    queryFn: async () => {
      if (!venueId) return [];
      const { data, error } = await supabase
        .from("halls")
        .select("*, devices(id, name, serial_number, is_active)")
        .eq("venue_id", venueId)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!venueId,
  });

  // Fetch today's events for halls
  const today = new Date().toISOString().split("T")[0];
  const { data: todayEvents } = useQuery({
    queryKey: ["venue-hall-events", venueId, today],
    queryFn: async () => {
      if (!venueId) return [];
      const { data } = await supabase
        .from("events")
        .select("id, hall_id, groom_name, bride_name, event_type, event_date")
        .eq("venue_id", venueId)
        .eq("event_date", today);
      return data || [];
    },
    enabled: !!venueId,
  });

  // Create/update hall
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingHall) {
        const { error } = await supabase
          .from("halls")
          .update({ name: formData.name, default_message: formData.default_message })
          .eq("id", editingHall.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("halls")
          .insert({ venue_id: venueId!, name: formData.name, default_message: formData.default_message });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-halls"] });
      setDialogOpen(false);
      setEditingHall(null);
      setFormData({ name: "", default_message: "ברוכים הבאים" });
      toast({ title: editingHall ? "האולם עודכן" : "האולם נוסף בהצלחה" });
    },
    onError: () => toast({ title: "שגיאה", variant: "destructive" }),
  });

  // Toggle hall active
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("halls").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["venue-halls"] }),
  });

  // Delete hall
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("halls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-halls"] });
      toast({ title: "האולם נמחק" });
    },
  });

  const copyKioskLink = (hallId: string) => {
    const url = `${window.location.origin}/kiosk/${hallId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(hallId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "הקישור הועתק" });
  };

  const openEdit = (hall: any) => {
    setEditingHall(hall);
    setFormData({ name: hall.name, default_message: hall.default_message || "ברוכים הבאים" });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingHall(null);
    setFormData({ name: "", default_message: "ברוכים הבאים" });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#051839]">אולמות ומכשירים</h1>
          <p className="text-gray-500 text-sm mt-1">נהל אולמות פיזיים וקשר מכשירי קיוסק</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-[#C4A35A] hover:bg-[#B4943A] text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              אולם חדש
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingHall ? "ערוך אולם" : "הוסף אולם חדש"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>שם האולם</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="למשל: אולם יהלום"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>הודעת ברירת מחדל (מסך המתנה)</Label>
                <Textarea
                  value={formData.default_message}
                  onChange={(e) => setFormData(p => ({ ...p, default_message: e.target.value }))}
                  placeholder="ברוכים הבאים"
                  className="mt-1"
                  rows={2}
                />
              </div>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!formData.name || saveMutation.isPending}
                className="w-full bg-[#C4A35A] hover:bg-[#B4943A] text-white rounded-xl"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingHall ? "שמור שינויים" : "הוסף אולם"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Halls Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#C4A35A] animate-spin" />
        </div>
      ) : !halls || halls.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center space-y-4">
            <Building2 className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-500">עדיין אין אולמות</h3>
            <p className="text-gray-400 text-sm">הוסף אולם פיזי כדי להתחיל לקשר מכשירי קיוסק</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {halls.map((hall: any) => {
            const hallEvent = todayEvents?.find((e: any) => e.hall_id === hall.id);
            const devices = hall.devices || [];

            return (
              <Card key={hall.id} className="rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#051839]/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-[#051839]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#051839]">{hall.name}</h3>
                        <p className="text-xs text-gray-400">{hall.default_message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={hall.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: hall.id, is_active: checked })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(hall)}>
                        <Pencil className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(hall.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>

                  {/* Today's event */}
                  {hallEvent ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm text-green-700 font-medium">
                        אירוע פעיל: {hallEvent.groom_name} & {hallEvent.bride_name}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-400 text-center">
                      אין אירוע היום
                    </div>
                  )}

                  {/* Devices */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      מכשירים מקושרים ({devices.length})
                    </p>
                    {devices.length > 0 ? (
                      <div className="space-y-1">
                        {devices.map((device: any) => (
                          <div key={device.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <span>{device.name}</span>
                            <Badge variant={device.is_active ? "default" : "secondary"} className="text-xs">
                              {device.is_active ? "פעיל" : "לא פעיל"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 text-center">אין מכשירים</p>
                    )}
                  </div>

                  {/* Kiosk link */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl gap-2 text-xs"
                      onClick={() => copyKioskLink(hall.id)}
                    >
                      {copiedId === hall.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      העתק קישור קיוסק
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2 text-xs"
                      onClick={() => window.open(`/kiosk/${hall.id}`, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3" />
                      פתח
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
