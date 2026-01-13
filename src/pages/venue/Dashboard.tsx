import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, CheckCircle, XCircle, Eye } from "lucide-react";

export default function VenueDashboard() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Fetch venue data
  const { data: venueData } = useQuery({
    queryKey: ["venue-dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: venue } = await supabase
        .from("venues")
        .select("id, name")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!venue) return null;

      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("venue_id", venue.id)
        .order("event_date", { ascending: true });

      const monthEvents = events?.filter((e) => {
        const eventDate = new Date(e.event_date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }) || [];

      const yearEvents = events?.filter((e) => {
        const eventDate = new Date(e.event_date);
        return eventDate.getFullYear() === currentYear;
      }) || [];

      const upcomingEvents = events?.filter((e) => new Date(e.event_date) >= new Date()).slice(0, 5) || [];

      return {
        venue,
        monthEvents: monthEvents.length,
        yearEvents: yearEvents.length,
        upcomingEvents,
      };
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#051839]">דשבורד</h1>
        <p className="text-gray-500 mt-1">ברוך הבא, {venueData?.venue?.name || "בעל אולם"}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#95742F]/10 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-[#95742F]" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">אירועים החודש</p>
            <p className="text-3xl font-bold text-[#051839]">{venueData?.monthEvents || 0}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">אירועים השנה</p>
            <p className="text-3xl font-bold text-[#051839]">{venueData?.yearEvents || 0}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#051839] text-white p-4">
          <h2 className="text-lg font-semibold">אירועים קרובים</h2>
        </div>
        
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
            {venueData?.upcomingEvents?.map((event: any) => (
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
                  <button className="w-8 h-8 rounded-full bg-[#051839] flex items-center justify-center text-white hover:bg-[#051839]/80 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </span>
              </div>
            ))}
            
            {!venueData?.upcomingEvents?.length && (
              <div className="text-center py-8 text-gray-500">
                אין אירועים קרובים
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
