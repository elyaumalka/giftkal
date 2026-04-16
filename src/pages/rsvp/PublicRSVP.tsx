import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, X, HelpCircle, Baby, Loader2, PartyPopper, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

type RsvpChoice = "confirmed" | "declined" | "maybe" | null;

export default function PublicRSVP() {
  const { eventId, guestId } = useParams<{ eventId: string; guestId: string }>();
  const { toast } = useToast();
  const [selectedChoice, setSelectedChoice] = useState<RsvpChoice>(null);
  const [childrenCount, setChildrenCount] = useState(0);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["rsvp-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data } = await supabase
        .from("public_events")
        .select("*")
        .eq("id", eventId)
        .single();
      return data;
    },
    enabled: !!eventId,
  });

  const { data: guest } = useQuery({
    queryKey: ["rsvp-guest", guestId],
    queryFn: async () => {
      if (!guestId) return null;
      const { data } = await (supabase
        .from("guests")
        .select("*") as any)
        .eq("id", guestId)
        .single();

      if (data) {
        // Pre-fill existing RSVP
        if (data.rsvp_status && data.rsvp_status !== "pending") {
          setSelectedChoice(data.rsvp_status as RsvpChoice);
        }
        setNumberOfGuests(data.number_of_guests || 1);
        setChildrenCount(data.children_count || 0);
      }
      return data;
    },
    enabled: !!guestId,
  });

  const isWeddingType = event?.event_type === "חתונה" || event?.event_type === "אירוסין";

  const getEventTitle = () => {
    if (!event) return "";
    if (isWeddingType) {
      return `${event.event_type} של ${event.groom_name || ""} & ${event.bride_name || ""}`;
    }
    if (event.event_type === "ברית") {
      return `ברית — משפחת ${(event as any).family_name || ""}`;
    }
    return `${event.event_type} — ${(event as any).child_name || (event as any).family_name || ""}`;
  };

  const getInviteText = () => {
    if (!event) return "";
    if (isWeddingType) {
      return `הוזמנתם לאירוע של ${event.groom_name || ""} ו${event.bride_name || ""}`;
    }
    if (event.event_type === "ברית") {
      return `הוזמנתם לאירוע של משפחת ${(event as any).family_name || ""}`;
    }
    return `הוזמנתם לאירוע של ${(event as any).child_name || (event as any).family_name || ""}`;
  };

  const handleSubmit = async () => {
    if (!selectedChoice || !guestId) return;
    setIsSubmitting(true);
    try {
      const { error } = await (supabase
        .from("guests")
        .update({
          rsvp_status: selectedChoice,
          number_of_guests: numberOfGuests,
          children_count: childrenCount,
          rsvp_date: new Date().toISOString(),
        } as any) as any)
        .eq("id", guestId);

      if (error) throw error;
      setSubmitted(true);
      toast({ title: "תודה! התשובה נשמרה בהצלחה" });
    } catch (err: any) {
      toast({ title: "שגיאה בשמירה", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event || !guest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] gap-4" dir="rtl">
        <img src={logo} alt="Giftkal" className="h-10" />
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            {selectedChoice === "confirmed" ? (
              <PartyPopper className="w-10 h-10 text-green-600" />
            ) : selectedChoice === "declined" ? (
              <Heart className="w-10 h-10 text-red-400" />
            ) : (
              <HelpCircle className="w-10 h-10 text-yellow-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#051839]">
            {selectedChoice === "confirmed" ? "נתראה באירוע! 🎉" : selectedChoice === "declined" ? "חבל, נתגעגע!" : "נמתין לתשובה סופית"}
          </h1>
          <p className="text-gray-500">
            {selectedChoice === "confirmed"
              ? `אישרת הגעה של ${numberOfGuests} אורחים${childrenCount > 0 ? ` + ${childrenCount} ילדים` : ""}`
              : selectedChoice === "declined"
              ? "התשובה נשמרה. תמיד אפשר לשנות דעה!"
              : "עדכנו אותנו כשתדעו 💛"}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-[#C4A35A] hover:underline text-sm font-medium"
          >
            רוצה לשנות תשובה?
          </button>
          <div className="pt-4">
            <img src={logo} alt="Giftkal" className="h-6 mx-auto opacity-40" />
          </div>
        </div>
      </div>
    );
  }

  const rsvpOptions: { value: RsvpChoice; label: string; icon: any; color: string; bg: string }[] = [
    { value: "confirmed", label: "כן, מגיעים!", icon: Check, color: "text-green-600", bg: "bg-green-50 border-green-200 hover:bg-green-100" },
    { value: "declined", label: "לא מגיעים", icon: X, color: "text-red-500", bg: "bg-red-50 border-red-200 hover:bg-red-100" },
    { value: "maybe", label: "עוד לא יודע/ת", icon: HelpCircle, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4]" dir="rtl">
      {/* Header */}
      <header className="bg-[#051839] text-white py-8 px-4 text-center">
        <img src={logo} alt="Giftkal" className="h-8 mx-auto mb-5 brightness-0 invert" />
        <h1 className="text-2xl font-bold mb-2">{getEventTitle()}</h1>
        {event.event_date && (
          <p className="text-white/60 text-sm">
            📅 {new Date(event.event_date).toLocaleDateString("he-IL")}
            {(event as any).custom_venue_name && ` · 📍 ${(event as any).custom_venue_name}`}
          </p>
        )}
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Welcome text */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-3">
          <p className="text-[#051839] font-bold text-lg">שלום {guest.full_name} 👋</p>
          <p className="text-gray-600 leading-relaxed">
            {getInviteText()}.<br />
            כדי להתארגן בהתאם, נשמח לדעת האם אתם מגיעים לאירוע:
          </p>
        </div>

        {/* RSVP Choices */}
        <div className="space-y-3">
          {rsvpOptions.map(({ value, label, icon: Icon, color, bg }) => (
            <button
              key={value}
              onClick={() => setSelectedChoice(value)}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-right ${
                selectedChoice === value
                  ? `${bg} border-current ring-2 ring-offset-2 ${color} ring-current`
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                selectedChoice === value ? bg : "bg-gray-100"
              }`}>
                <Icon className={`w-6 h-6 ${selectedChoice === value ? color : "text-gray-400"}`} />
              </div>
              <span className={`text-lg font-bold ${selectedChoice === value ? color : "text-[#051839]"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Children option */}
        {selectedChoice === "confirmed" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5 animate-fade-in">
            {/* Number of guests */}
            <div className="space-y-3">
              <label className="font-bold text-[#051839] text-sm">כמה אורחים מגיעים?</label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumberOfGuests(n)}
                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                      numberOfGuests === n
                        ? "bg-[#051839] text-white shadow-md"
                        : "bg-gray-100 text-[#051839] hover:bg-gray-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Children */}
            <div className="space-y-3">
              <label className="font-bold text-[#051839] text-sm flex items-center gap-2">
                <Baby className="w-4 h-4 text-[#C4A35A]" />
                מגיעים עם ילדים?
              </label>
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setChildrenCount(n)}
                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                      childrenCount === n
                        ? "bg-[#C4A35A] text-white shadow-md"
                        : "bg-gray-100 text-[#051839] hover:bg-gray-200"
                    }`}
                  >
                    {n === 0 ? "לא" : n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        {selectedChoice && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#051839] hover:bg-[#08275E] text-white rounded-2xl py-4 font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                שומר...
              </>
            ) : (
              "שליחת תשובה"
            )}
          </button>
        )}

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs pt-4">
          <p>מופעל על ידי Giftkal</p>
        </div>
      </div>
    </div>
  );
}
