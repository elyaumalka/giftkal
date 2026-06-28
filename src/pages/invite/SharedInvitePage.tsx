import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet, Trash2, Users, Heart, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import logoAsset from "@/assets/logo.png.asset.json";

type SideType = "groom" | "bride" | "general";

interface EventData {
  id: string;
  event_type: string;
  groom_name: string | null;
  bride_name: string | null;
  child_name: string | null;
  family_name: string | null;
  event_date: string;
  custom_venue_name: string | null;
  custom_venue_location: string | null;
}

export default function SharedInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualRelationship, setManualRelationship] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Resolve token → event + side
  const { data: resolved, isLoading } = useQuery({
    queryKey: ["shared-invite", token],
    queryFn: async () => {
      if (!token) return null;

      // Use secure RPC function to look up event by share token
      const { data: results } = await supabase
        .rpc("lookup_event_by_share_token", { _token: token });

      if (results && results.length > 0) {
        const result = results[0];
        return {
          event: {
            id: result.id,
            event_type: result.event_type,
            groom_name: result.groom_name,
            bride_name: result.bride_name,
            child_name: result.child_name,
            family_name: result.family_name,
            event_date: result.event_date,
            custom_venue_name: result.custom_venue_name,
            custom_venue_location: result.custom_venue_location,
          } as EventData,
          side: result.side as SideType,
        };
      }
      return null;
    },
    enabled: !!token,
  });

  const event = resolved?.event;
  const side = resolved?.side || "general";

  // Fetch guests for this side
  const { data: guests, refetch: refetchGuests } = useQuery({
    queryKey: ["shared-guests", event?.id, side],
    queryFn: async () => {
      if (!event?.id) return [];
      const { data } = await (supabase
        .from("guests")
        .select("*")
        .eq("event_id", event.id) as any)
        .eq("side", side);
      return data || [];
    },
    enabled: !!event?.id,
  });

  const isWeddingType = event?.event_type === "חתונה" || event?.event_type === "אירוסין";

  const getSideLabel = () => {
    if (!isWeddingType) {
      return event?.family_name ? `משפחת ${event.family_name}` : "רשימת מוזמנים";
    }
    if (side === "groom") return `צד החתן${event?.groom_name ? ` — ${event.groom_name}` : ""}`;
    if (side === "bride") return `צד הכלה${event?.bride_name ? ` — ${event.bride_name}` : ""}`;
    return "רשימת מוזמנים כללית";
  };

  const getPageTitle = () => {
    if (!event) return "";
    if (isWeddingType) {
      return `${event.event_type} ${event.groom_name || ""} & ${event.bride_name || ""}`;
    }
    if (event.event_type === "ברית") {
      return `ברית — משפחת ${event.family_name || ""}`;
    }
    return `${event.event_type} — ${event.child_name || event.family_name || ""}`;
  };

  const addGuest = async () => {
    if (!manualName.trim()) {
      toast({ title: "⚠️ שם חסר", description: "יש להזין שם מלא של המוזמן", variant: "destructive" });
      return;
    }
    if (manualName.trim().length < 2) {
      toast({ title: "⚠️ שם קצר מדי", description: "יש להזין שם מלא (לפחות 2 תווים)", variant: "destructive" });
      return;
    }
    if (manualPhone && !/^[\d\-\+\(\)\s]{7,15}$/.test(manualPhone.trim())) {
      toast({ title: "⚠️ טלפון לא תקין", description: "יש להזין מספר טלפון תקין (7-15 ספרות)", variant: "destructive" });
      return;
    }
    if (!event?.id) return;
    const { error } = await supabase.from("guests").insert({
      event_id: event.id,
      full_name: manualName.trim(),
      phone: manualPhone.trim() || null,
      email: manualEmail.trim() || null,
      relationship: manualRelationship.trim() || null,
      side,
      invitation_sent: false,
    } as any);
    if (error) {
      toast({ title: "שגיאה בהוספת מוזמן", variant: "destructive" });
      return;
    }
    setManualName("");
    setManualPhone("");
    setManualEmail("");
    setManualRelationship("");
    refetchGuests();
    toast({ title: "מוזמן נוסף בהצלחה!" });
  };

  const deleteGuest = async (guestId: string) => {
    await supabase.from("guests").delete().eq("id", guestId);
    refetchGuests();
  };

  const handleExcelUpload = async (file: File) => {
    if (!event?.id) return;
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const guestsToInsert = rows
        .map((row: any) => ({
          event_id: event.id,
          full_name: row["שם_מלא"] || row["שם מלא"] || row["name"] || "",
          phone: row["טלפון"] || row["phone"] || null,
          email: row["אימייל"] || row["email"] || null,
          relationship: row["קרבה"] || row["relationship"] || null,
          side,
          invitation_sent: false,
        }))
        .filter((g: any) => g.full_name);

      if (guestsToInsert.length === 0) {
        toast({ title: "לא נמצאו מוזמנים בקובץ", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("guests").insert(guestsToInsert as any);
      if (error) throw error;

      toast({ title: `${guestsToInsert.length} מוזמנים נוספו בהצלחה!` });
      refetchGuests();
    } catch (err: any) {
      toast({ title: "שגיאה בהעלאת הקובץ", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleExcel = () => {
    const sampleData = [
      { שם_מלא: "ישראל ישראלי", טלפון: "0501234567", אימייל: "israel@example.com", קרבה: "משפחה" },
      { שם_מלא: "שרה כהן", טלפון: "0529876543", אימייל: "", קרבה: "חברים" },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "מוזמנים");
    ws["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];
    XLSX.writeFile(wb, "רשימת_מוזמנים_דוגמה.xlsx");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#051839]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] gap-4" dir="rtl">
        <img src={logoAsset.url} alt="Giftkal" className="h-12" />
        <h1 className="text-2xl font-bold text-[#051839]">הקישור אינו תקף</h1>
        <p className="text-muted-foreground">ייתכן שהקישור פג תוקף או שאינו נכון.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]" dir="rtl">
      {/* Header */}
      <header className="bg-[#051839] text-white py-6 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <img src={logoAsset.url} alt="Giftkal" className="h-8 mx-auto mb-4 brightness-0 invert" />
          <h1 className="text-2xl font-bold mb-1">{getPageTitle()}</h1>
          <p className="text-[#C4A35A] font-medium text-lg">{getSideLabel()}</p>
          {event.event_date && (
            <p className="text-white/60 text-sm mt-2">
              📅 {new Date(event.event_date).toLocaleDateString("he-IL")}
              {event.custom_venue_name && ` · 📍 ${event.custom_venue_name}`}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Add guest manually */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-bold text-[#051839] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C4A35A]" />
            הוספת מוזמן
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="שם מלא *"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="bg-gray-50 border-gray-200 text-right"
            />
            <Input
              placeholder="טלפון"
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value)}
              className="bg-gray-50 border-gray-200 text-right"
            />
            <Input
              placeholder="אימייל"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className="bg-gray-50 border-gray-200 text-right"
              type="email"
            />
            <Input
              placeholder="קרבה (משפחה, חברים...)"
              value={manualRelationship}
              onChange={(e) => setManualRelationship(e.target.value)}
              className="bg-gray-50 border-gray-200 text-right"
            />
          </div>
          <button
            onClick={addGuest}
            disabled={!manualName.trim()}
            className="w-full bg-[#051839] text-white rounded-xl py-3 font-medium hover:bg-[#08275E] transition-colors disabled:opacity-50"
          >
            הוסף מוזמן
          </button>
        </div>

        {/* Excel upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => excelInputRef.current?.click()}
            className="bg-[#051839] rounded-xl p-4 text-white cursor-pointer hover:bg-[#08275E] transition-colors text-center"
          >
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleExcelUpload(file);
              }}
            />
            <FileSpreadsheet className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium text-sm">{isUploading ? "מעלה..." : "העלאת רשימה מאקסל"}</p>
          </div>
          <div
            onClick={downloadSampleExcel}
            className="bg-[#C4A35A] rounded-xl p-4 text-white cursor-pointer hover:bg-[#B8942A] transition-colors text-center"
          >
            <Download className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium text-sm">הורדת קובץ דוגמה</p>
          </div>
        </div>

        {/* Guests table */}
        {guests && guests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#051839]">מוזמנים ({guests.length})</h2>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-right p-3 font-medium text-gray-500">שם</th>
                    <th className="text-right p-3 font-medium text-gray-500">טלפון</th>
                    <th className="text-right p-3 font-medium text-gray-500">אימייל</th>
                    <th className="text-right p-3 font-medium text-gray-500">קרבה</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g: any) => (
                    <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3 font-medium">{g.full_name}</td>
                      <td className="p-3 text-gray-500">{g.phone || "—"}</td>
                      <td className="p-3 text-gray-500">{g.email || "—"}</td>
                      <td className="p-3 text-gray-500">{g.relationship || "—"}</td>
                      <td className="p-3">
                        <button
                          onClick={() => deleteGuest(g.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info footer */}
        <div className="text-center text-gray-400 text-xs pt-4">
          <p>מופעל על ידי Giftkal — מערכת מתנות דיגיטלית</p>
        </div>
      </div>
    </div>
  );
}
