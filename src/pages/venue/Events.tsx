import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, CheckCircle, XCircle, Eye, Filter, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function VenueEvents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { toast } = useToast();

  const { data: events } = useQuery({
    queryKey: ["venue-events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!venue) return [];

      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("venue_id", venue.id)
        .order("event_date", { ascending: false });

      return data || [];
    },
  });

  const filteredEvents = events?.filter((e: any) =>
    e.groom_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.bride_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#051839]">בעלי אירועים</h1>
          <p className="text-gray-500 mt-1">ניהול האירועים באולם</p>
        </div>
        <button 
          onClick={() => toast({ title: "בקרוב", description: "הוספת אירוע חדש" })}
          className="w-10 h-10 rounded-full bg-[#051839] flex items-center justify-center text-white hover:bg-[#051839]/80 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="w-5 h-5" />
        </button>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש חופשי"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 rounded-full border-gray-200 bg-white"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500 mb-4 px-4">
            <span>תאריך אירוע</span>
            <span>שם בעל האירוע</span>
            <span>טלפון</span>
            <span>סוג האירוע</span>
            <span>מסמכים</span>
            <span>פעולות</span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-2">
            {filteredEvents?.map((event: any) => (
              <div 
                key={event.id} 
                className="grid grid-cols-6 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm"
              >
                <span className="text-[#051839]">
                  {new Date(event.event_date).toLocaleDateString("he-IL")}
                </span>
                <span className="font-medium text-[#051839]">
                  {event.groom_name && event.bride_name
                    ? `${event.groom_name} & ${event.bride_name}`
                    : "—"}
                </span>
                <span className="text-gray-600">—</span>
                <span className="text-gray-600">{event.event_type || "חתונה"}</span>
                <span>
                  {event.documents_complete ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </span>
                <span>
                  <button 
                    onClick={() => setSelectedEvent(event)}
                    className="w-8 h-8 rounded-full bg-[#051839] flex items-center justify-center text-white hover:bg-[#051839]/80 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
