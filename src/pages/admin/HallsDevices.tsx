import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Monitor, Plus, Trash2, Loader2, Link2, Search, ExternalLink, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminHallsDevices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [hallDialogOpen, setHallDialogOpen] = useState(false);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewHall, setViewHall] = useState<any>(null);

  // Hall form
  const [hallForm, setHallForm] = useState({ name: "", venue_id: "", default_message: "ברוכים הבאים" });
  // Device form
  const [deviceForm, setDeviceForm] = useState({ name: "", serial_number: "", venue_id: "", hall_id: "" });

  // Fetch all venues
  const { data: venues } = useQuery({
    queryKey: ["admin-venues"],
    queryFn: async () => {
      const { data } = await supabase.from("venues").select("id, name").order("name");
      return data || [];
    },
  });

  // Fetch all halls with venue info
  const { data: halls, isLoading: hallsLoading } = useQuery({
    queryKey: ["admin-halls"],
    queryFn: async () => {
      const { data } = await supabase
        .from("halls")
        .select("*, venues(id, name, owner_id), devices(id, name, serial_number, is_active)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch all devices with hall/venue info
  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ["admin-devices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("devices")
        .select("*, venues(id, name, owner_id), halls(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch halls for selected venue (device form)
  const { data: venueHalls } = useQuery({
    queryKey: ["venue-halls-select", deviceForm.venue_id],
    queryFn: async () => {
      if (!deviceForm.venue_id) return [];
      const { data } = await supabase.from("halls").select("id, name").eq("venue_id", deviceForm.venue_id);
      return data || [];
    },
    enabled: !!deviceForm.venue_id,
  });

  // Create hall
  const createHall = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("halls").insert({
        name: hallForm.name,
        venue_id: hallForm.venue_id,
        default_message: hallForm.default_message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-halls"] });
      setHallDialogOpen(false);
      setHallForm({ name: "", venue_id: "", default_message: "ברוכים הבאים" });
      toast({ title: "האולם נוסף בהצלחה" });
    },
    onError: (e: any) => toast({ title: "שגיאה בהוספת אולם", description: e.message, variant: "destructive" }),
  });

  // Create device
  const createDevice = useMutation({
    mutationFn: async () => {
      const insertData: any = {
        name: deviceForm.name,
        serial_number: deviceForm.serial_number,
        venue_id: deviceForm.venue_id,
      };
      if (deviceForm.hall_id) {
        insertData.hall_id = deviceForm.hall_id;
      }
      const { error } = await supabase.from("devices").insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-devices"] });
      setDeviceDialogOpen(false);
      setDeviceForm({ name: "", serial_number: "", venue_id: "", hall_id: "" });
      toast({ title: "המכשיר נוסף בהצלחה" });
    },
    onError: (e: any) => toast({ title: "שגיאה בהוספת מכשיר", description: e.message, variant: "destructive" }),
  });

  // Delete device
  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-devices"] });
      toast({ title: "המכשיר נמחק" });
    },
  });

  // Delete hall
  const deleteHall = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("halls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-halls"] });
      toast({ title: "האולם נמחק" });
    },
  });

  const filteredHalls = halls?.filter((h: any) =>
    h.name.includes(searchTerm) || (h.venues as any)?.name?.includes(searchTerm)
  ) || [];

  const filteredDevices = devices?.filter((d: any) =>
    d.name.includes(searchTerm) || d.serial_number.includes(searchTerm) || (d.venues as any)?.name?.includes(searchTerm)
  ) || [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#051839]">אולמות ומכשירים</h1>
          <p className="text-gray-500 text-sm mt-1">נהל אולמות פיזיים וקשר מכשירי קיוסק</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 w-48 rounded-xl"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="halls" dir="rtl">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="halls" className="gap-2"><Building2 className="w-4 h-4" /> אולמות ({halls?.length || 0})</TabsTrigger>
          <TabsTrigger value="devices" className="gap-2"><Monitor className="w-4 h-4" /> מכשירים ({devices?.length || 0})</TabsTrigger>
        </TabsList>

        {/* HALLS TAB */}
        <TabsContent value="halls" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={hallDialogOpen} onOpenChange={setHallDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#C4A35A] hover:bg-[#B4943A] text-white rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> אולם חדש
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader><DialogTitle>הוסף אולם חדש</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4 px-2">
                  <div>
                    <Label>בעל אולם</Label>
                    <Select value={hallForm.venue_id} onValueChange={(v) => setHallForm(p => ({ ...p, venue_id: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="בחר בעל אולם" /></SelectTrigger>
                      <SelectContent>
                        {venues?.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>שם האולם</Label>
                    <Input value={hallForm.name} onChange={(e) => setHallForm(p => ({ ...p, name: e.target.value }))} placeholder="אולם יהלום" className="mt-1" />
                  </div>
                  <div>
                    <Label>הודעת ברירת מחדל</Label>
                    <Input value={hallForm.default_message} onChange={(e) => setHallForm(p => ({ ...p, default_message: e.target.value }))} className="mt-1" />
                  </div>
                  <Button onClick={() => createHall.mutate()} disabled={!hallForm.name || !hallForm.venue_id || createHall.isPending} className="w-full bg-[#C4A35A] hover:bg-[#B4943A] text-white rounded-xl">
                    {createHall.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "הוסף אולם"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {hallsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#C4A35A] animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {filteredHalls.map((hall: any) => (
                <Card key={hall.id} className="rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#051839]/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#051839]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#051839]">{hall.name}</h3>
                        <button
                          onClick={() => navigate(`/admin/customers`)}
                          className="text-xs text-[#C4A35A] hover:underline flex items-center gap-1"
                        >
                          {(hall.venues as any)?.name}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="gap-1">
                        <Monitor className="w-3 h-3" />
                        {hall.devices?.length || 0} מכשירים
                      </Badge>
                      <Badge variant={hall.is_active ? "default" : "secondary"}>
                        {hall.is_active ? "פעיל" : "לא פעיל"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => deleteHall.mutate(hall.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredHalls.length === 0 && (
                <p className="text-center text-gray-400 py-8">אין אולמות להצגה</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* DEVICES TAB */}
        <TabsContent value="devices" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#C4A35A] hover:bg-[#B4943A] text-white rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> מכשיר חדש
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader><DialogTitle>הוסף מכשיר חדש</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4 px-2">
                  <div>
                    <Label>בעל אולם</Label>
                    <Select value={deviceForm.venue_id} onValueChange={(v) => setDeviceForm(p => ({ ...p, venue_id: v, hall_id: "" }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="בחר בעל אולם" /></SelectTrigger>
                      <SelectContent>
                        {venues?.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {deviceForm.venue_id && venueHalls && venueHalls.length > 0 && (
                    <div>
                      <Label>אולם (אופציונלי)</Label>
                      <Select value={deviceForm.hall_id} onValueChange={(v) => setDeviceForm(p => ({ ...p, hall_id: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="בחר אולם" /></SelectTrigger>
                        <SelectContent>
                          {venueHalls?.map((h: any) => (
                            <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>שם המכשיר</Label>
                    <Input value={deviceForm.name} onChange={(e) => setDeviceForm(p => ({ ...p, name: e.target.value }))} placeholder="טאבלט ראשי" className="mt-1" />
                  </div>
                  <div>
                    <Label>מספר סריאלי</Label>
                    <Input value={deviceForm.serial_number} onChange={(e) => setDeviceForm(p => ({ ...p, serial_number: e.target.value }))} placeholder="SN-12345" className="mt-1" />
                  </div>
                  <Button onClick={() => createDevice.mutate()} disabled={!deviceForm.name || !deviceForm.serial_number || !deviceForm.venue_id || createDevice.isPending} className="w-full bg-[#C4A35A] hover:bg-[#B4943A] text-white rounded-xl">
                    {createDevice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "הוסף מכשיר"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {devicesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#C4A35A] animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {filteredDevices.map((device: any) => (
                <Card key={device.id} className="rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#051839]">{device.name}</h3>
                        <button
                          onClick={() => navigate(`/admin/customers`)}
                          className="text-xs text-[#C4A35A] hover:underline flex items-center gap-1"
                        >
                          {(device.venues as any)?.name}
                          {(device.halls as any)?.name && ` → ${(device.halls as any).name}`}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <p className="text-xs text-gray-300">S/N: {device.serial_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={device.is_active ? "default" : "secondary"}>
                        {device.is_active ? "פעיל" : "לא פעיל"}
                      </Badge>
                      {device.hall_id ? (
                        <Badge variant="outline" className="gap-1">
                          <Link2 className="w-3 h-3" />
                          מקושר
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 text-xs">לא מקושר</Badge>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteDevice.mutate(device.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredDevices.length === 0 && (
                <p className="text-center text-gray-400 py-8">אין מכשירים להצגה</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
