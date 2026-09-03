import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, X, HelpCircle, Loader2, PartyPopper, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import logoAsset from "@/assets/logo.png.asset.json";

type RsvpChoice = "confirmed" | "declined" | "maybe" | null;

export default function SelfRSVP() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [side, setSide] = useState("");
  const [relationship, setRelationship] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<RsvpChoice>("confirmed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["self-rsvp-event", token],
    enabled: !!token,
    queryFn: async () => {
      const { data } = await supabase.rpc("lookup_event_by_share_token", { _token: token! });
      return (data?.[0] as any) || null;
    },
  });

  const isWeddingType = event?.event_type === "חתונה" || event?.event_type === "אירוסין";

  const getEventTitle = () => {
    if (!event) return "";
    if (isWeddingType) return `${event.event_type} של ${event.groom_name || ""} & ${event.bride_name || ""}`;
    if (event.event_type === "ברית") return `ברית — משפחת ${event.family_name || ""}`;
    return `${event.event_type} — ${event.child_name || event.family_name || ""}`;
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (fullName.trim().length < 2) {
      toast({ title: "נא למלא שם מלא", variant: "destructive" });
      return;
    }
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (cleanPhone.length < 9) {
      toast({ title: "נא למלא מספר טלפון תקין", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("self_rsvp_join", {
        _token: token,
        _full_name: fullName.trim(),
        _phone: cleanPhone,
        _number_of_guests: numberOfGuests,
        _children_count: childrenCount,
        _side: side || null,
        _relationship: relationship || null,
        _rsvp_status: selectedChoice || "pending",
      });
      if (error) throw error;

      const guestId = (data as any)?.[0]?.guest_id;
      if (guestId && selectedChoice === "confirmed") {
        supabase.functions
          .invoke("send-rsvp-confirmation-sms", { body: { token, guestId } })
          .catch(() => undefined);
      }
      setSubmitted(true);
      toast({ title: "תודה! התשובה נשמרה בהצלחה" });
    } catch (err: any) {
      toast({ title: "שגיאה בשמירה", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] gap-4" dir="rtl">
        <img src={logoAsset.url} alt="בשמחות פלוס" className="h-10" />
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] gap-4 px-4 text-center" dir="rtl">
        <img src={logoAsset.url} alt="בשמחות פלוס" className="h-10" />
        <p className="text-[#051839] font-bold">הקישור אינו תקין</p>
        <p className="text-muted-foreground text-sm">נא לבקש קישור מעודכן מבעלי האירוע</p>
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
            ) : (
              <Heart className="w-10 h-10 text-[#C4A35A]" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#051839]">תודה רבה, {fullName}!</h1>
          <p className="text-gray-600">
            {selectedChoice === "confirmed"
              ? "התשובה נשמרה. פרטי האירוע נשלחים אליכם ב-SMS."
              : "התשובה נשמרה. תודה על העדכון."}
          </p>
          <img src={logoAsset.url} alt="בשמחות פלוס" className="h-8 mx-auto opacity-70" />
        </div>
      </div>
    );
  }

  const choices: { value: Exclude<RsvpChoice, null>; label: string; icon: typeof Check; active: string }[] = [
    { value: "confirmed", label: "מגיע/ה", icon: Check, active: "bg-[#22C55E] text-white border-[#22C55E]" },
    { value: "maybe", label: "עוד לא יודע/ת", icon: HelpCircle, active: "bg-[#F59E0B] text-white border-[#F59E0B]" },
    { value: "declined", label: "לא מגיע/ה", icon: X, active: "bg-[#C41E3A] text-white border-[#C41E3A]" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4] py-10 px-4" dir="rtl">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-3">
          <img src={logoAsset.url} alt="בשמחות פלוס" className="h-10 mx-auto" />
          <h1 className="text-2xl font-bold text-[#051839]">{getEventTitle()}</h1>
          <p className="text-gray-600 text-sm">
            {event.event_date ? new Date(event.event_date).toLocaleDateString("he-IL") : ""}
            {event.custom_venue_name ? ` • ${event.custom_venue_name}` : ""}
            {event.custom_venue_location ? `, ${event.custom_venue_location}` : ""}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-5">
          <h2 className="font-bold text-[#051839]">אישור הגעה</h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">שם מלא</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} placeholder="ישראל כהן" />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">טלפון נייד</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                maxLength={15}
                placeholder="050-0000000"
              />
              <p className="text-xs text-gray-400 mt-1">נשלח אליכם SMS עם פרטי האירוע</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">מספר מוזמנים</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">מספר ילדים</label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Math.max(0, Math.min(50, Number(e.target.value) || 0)))}
                />
              </div>
            </div>
            {isWeddingType ? (
              <div>
                <label className="text-sm text-gray-600 mb-1 block">צד</label>
                <div className="flex gap-2">
                  {[
                    { value: "groom", label: "צד החתן" },
                    { value: "bride", label: "צד הכלה" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSide(s.value)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        side === s.value
                          ? "bg-[#051839] text-white border-[#051839]"
                          : "bg-white text-[#051839] border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm text-gray-600 mb-1 block">קרבה (לא חובה)</label>
                <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} maxLength={50} placeholder="משפחה / חבר" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 block">האם תגיעו?</label>
            <div className="grid grid-cols-3 gap-2">
              {choices.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedChoice(c.value)}
                  className={`py-3 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-colors ${
                    selectedChoice === c.value ? c.active : "bg-white text-[#051839] border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <c.icon className="w-4 h-4" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#C4A35A] hover:bg-[#95742F] text-white font-bold px-8 py-3 rounded-full transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              שליחת אישור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
