import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CheersIcon from "@/assets/icons/venue/Cheers.svg";

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
        .select(`
          *,
          profiles:owner_id (full_name, phone)
        `)
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

      const upcomingEvents = events?.filter((e) => new Date(e.event_date) >= new Date()).slice(0, 3) || [];

      return {
        venue,
        monthEvents: monthEvents.length,
        yearEvents: yearEvents.length,
        upcomingEvents,
      };
    },
  });

  const monthName = new Date().toLocaleDateString("he-IL", { month: "numeric", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Events Card */}
        <div className="bg-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center">
          <img src={CheersIcon} alt="Events" className="w-16 h-16 mb-4" />
          <p className="text-5xl font-bold text-[#95742F] mb-2">{venueData?.monthEvents || 0}</p>
          <p className="text-[#051839] font-medium">סך האירועים לחודש {monthName}</p>
        </div>
        
        {/* Yearly Events Card */}
        <div className="bg-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center">
          <img src={CheersIcon} alt="Events" className="w-16 h-16 mb-4" />
          <p className="text-5xl font-bold text-[#051839] mb-2">{venueData?.yearEvents || 0}</p>
          <p className="text-[#051839] font-medium">סך האירועים לשנת {currentYear}</p>
        </div>
      </div>

      {/* Upcoming Events Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Title */}
          <h2 className="text-xl font-bold text-[#051839] mb-6 text-right">אירועים קרובים</h2>
          
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
            {venueData?.upcomingEvents?.map((event: any) => (
              <div 
                key={event.id} 
                className="grid grid-cols-6 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm"
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
                  {venueData?.venue?.name || "—"}
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
