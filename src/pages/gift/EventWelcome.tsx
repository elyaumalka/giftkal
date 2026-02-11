import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import cheersImg from "@/assets/cheers.png";

export default function EventWelcome() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-welcome", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          venues (name, address, logo_url, banner_url, phone, email)
        `)
        .eq("id", eventId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-[#C4A35A] animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-[#051839] mb-2">האירוע לא נמצא</h1>
          <p className="text-gray-500">נא לבדוק את הקישור ולנסות שוב</p>
        </div>
      </div>
    );
  }

  const eventTypeLabel = (() => {
    switch (event.event_type) {
      case "חתונה": return "לרגל החתונה";
      case "בר מצווה": return "לרגל הבר מצווה";
      case "בת מצווה": return "לרגל הבת מצווה";
      case "ברית": return "לרגל הברית";
      case "יום הולדת": return "לרגל יום ההולדת";
      default: return `לרגל ה${event.event_type}`;
    }
  })();

  const handleContinue = () => {
    navigate(`/gift/${eventId}/send`);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" dir="rtl">
      {/* Top Section - White with venue info */}
      <div className="bg-white flex-shrink-0 py-3 flex flex-col items-center px-4">
        {/* Venue Logo */}
        {event.venues?.logo_url ? (
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg mb-2 border-2 border-gray-100">
            <img
              src={event.venues.logo_url}
              alt={event.venues?.name || ""}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg mb-2 border-2 border-gray-100 bg-[#051839] flex items-center justify-center">
            <img src={logo} alt="Giftkal" className="h-8 w-auto" />
          </div>
        )}

        {/* Venue Name */}
        {event.venues?.name && (
          <h2 className="text-sm font-bold text-[#051839] mb-1">{event.venues.name}</h2>
        )}

        {/* Contact Link */}
        {event.venues?.phone && (
          <a
            href={`tel:${event.venues.phone}`}
            className="text-[#C4A35A] text-xs font-medium flex items-center gap-1 hover:underline"
          >
            דברו איתנו
            <ArrowLeft className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      {/* Main Section - Dark gradient with event info */}
      <div className="flex-1 bg-gradient-to-b from-gray-300 via-gray-500 to-gray-700 flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden">
        {/* Cheers Image */}
        <div className="mb-4 flex-shrink-0">
          <img
            src={cheersImg}
            alt="לחיים"
            className="w-40 h-auto mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Mazel Tov */}
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg text-center">
          מזל טוב
        </h1>

        {/* Couple Names */}
        <h2 className="text-2xl font-bold text-[#C4A35A] mb-2 drop-shadow-md text-center">
          {event.groom_name} & {event.bride_name}
        </h2>

        {/* Event Type */}
        <p className="text-base text-white/80 mb-6 text-center">
          {eventTypeLabel}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          className="bg-gradient-to-r from-[#C4A35A] to-[#A8893E] text-white font-bold text-base px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 animate-pulse hover:animate-none flex-shrink-0"
        >
          כאן נותנים מתנה בקליק
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Powered by Giftkal - subtle footer */}
      <div className="bg-gray-700 py-2 flex items-center justify-center gap-2 flex-shrink-0">
        <span className="text-gray-400 text-xs">Powered by</span>
        <img src={logo} alt="Giftkal" className="h-4 w-auto opacity-60" />
      </div>
    </div>
  );
}
