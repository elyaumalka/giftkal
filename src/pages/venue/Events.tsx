import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Eye, Filter, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function VenueEvents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { toast } = useToast();

  const { data: venue } = useQuery({
    queryKey: ["venue-info"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("venues")
        .select("id, name")
        .eq("owner_id", user.id)
        .maybeSingle();

      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["venue-events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: venueData } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!venueData) return [];

      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("venue_id", venueData.id)
        .order("event_date", { ascending: false });

      if (!eventsData || eventsData.length === 0) return [];

      // Fetch profiles separately
      const ownerIds = [...new Set(eventsData.map(e => e.owner_id).filter(Boolean))];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", ownerIds);

      // Merge profiles into events
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      return eventsData.map(event => ({
        ...event,
        profiles: profilesMap.get(event.owner_id) || null
      }));
    },
  });

  const filteredEvents = events?.filter((e: any) =>
    e.groom_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.bride_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Row - Actions */}
      <div className="flex items-center gap-3">
        <button className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="w-5 h-5" />
        </button>
        <button 
          onClick={() => toast({ title: "בקרוב", description: "הוספת בעל אירוע חדש" })}
          className="px-6 py-3 rounded-full bg-[#051839] text-white font-medium hover:bg-[#051839]/90 transition-colors"
        >
          הוספת בעל אירוע
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500 mb-4 px-4">
            <span className="text-right">תאריך אירוע</span>
            <span className="text-right">בעל האירוע</span>
            <span className="text-right">טלפון</span>
            <span className="text-right">שם האולם</span>
            <span className="text-right">סוג האירוע</span>
            <span className="text-right">האם כל המסמכים הושלמו בהצלחה</span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-2">
            {filteredEvents?.map((event: any) => (
              <div 
                key={event.id} 
                className="grid grid-cols-6 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedEvent(event)}
              >
                <span className="font-bold text-[#051839]">
                  {new Date(event.event_date).toLocaleDateString("he-IL")}
                </span>
                <span className="font-bold text-[#051839]">
                  {event.profiles?.full_name || event.groom_name || "—"}
                </span>
                <span className="font-bold text-[#051839]">
                  {event.profiles?.phone || "—"}
                </span>
                <span className="font-bold text-[#95742F]">
                  {venue?.name || "—"}
                </span>
                <span className="text-[#051839]">
                  {event.event_type || "חתונה"}
                </span>
                <span>
                  {event.documents_complete ? (
                    <span className="inline-block px-4 py-2 rounded-full bg-[#22C55E] text-white font-medium text-center">
                      הושלמו בהצלחה
                    </span>
                  ) : (
                    <span className="inline-block px-4 py-2 rounded-full bg-[#C41E3A] text-white font-medium text-center">
                      חסרים מסמכים
                    </span>
                  )}
                </span>
              </div>
            ))}
            
            {!filteredEvents?.length && (
              <div className="text-center py-8 text-gray-500">
                אין אירועים להצגה
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="p-0 overflow-hidden rounded-2xl border-0 max-w-md">
          <DialogHeader className="bg-[#051839] text-white p-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              פרטי האירוע
            </DialogTitle>
            <button 
              onClick={() => setSelectedEvent(null)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-sm">בעל האירוע</Label>
                  <p className="font-medium text-[#051839]">
                    {selectedEvent.profiles?.full_name || selectedEvent.groom_name || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">טלפון</Label>
                  <p className="font-medium text-[#051839]">
                    {selectedEvent.profiles?.phone || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">חתן</Label>
                  <p className="font-medium text-[#051839]">{selectedEvent.groom_name || "—"}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">כלה</Label>
                  <p className="font-medium text-[#051839]">{selectedEvent.bride_name || "—"}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">תאריך</Label>
                  <p className="font-medium text-[#051839]">
                    {new Date(selectedEvent.event_date).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">סוג אירוע</Label>
                  <p className="font-medium text-[#051839]">{selectedEvent.event_type || "חתונה"}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">סטטוס מסמכים</Label>
                <div className="mt-1">
                  {selectedEvent.documents_complete ? (
                    <span className="inline-block px-4 py-2 rounded-full bg-[#22C55E] text-white font-medium">
                      הושלמו בהצלחה
                    </span>
                  ) : (
                    <span className="inline-block px-4 py-2 rounded-full bg-[#C41E3A] text-white font-medium">
                      חסרים מסמכים
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
