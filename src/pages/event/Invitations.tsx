import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Upload, Download, Music, FileSpreadsheet, X, Check, Sparkles, Loader2, Trash2, Link2, Copy } from "lucide-react";
import { templates } from "@/components/invitations/InvitationTemplates";
import { useExcelHandler } from "@/components/invitations/useExcelHandler";
import { useAudioHandler } from "@/components/invitations/useAudioHandler";
import html2canvas from "html2canvas";

type Step = 1 | 2 | 3;
type EventType = "חתונה" | "אירוסין" | "בר מצווה" | "בת מצווה" | "ברית" | "אחר";

export default function EventInvitations() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const templateRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Form state
  const [eventType, setEventType] = useState<EventType>("חתונה");
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [childName, setChildName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [groomParents, setGroomParents] = useState("");
  const [brideParents, setBrideParents] = useState("");
  const [receptionTime, setReceptionTime] = useState("");
  const [ceremonyTime, setCeremonyTime] = useState("");
  const [introText, setIntroText] = useState("");
  const [notes, setNotes] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueLocation, setVenueLocation] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiInvitations, setAiInvitations] = useState<{ id: number; style: string; imageUrl: string }[]>([]);
  const [selectedAiIndex, setSelectedAiIndex] = useState<number | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const { data: event } = useQuery({
    queryKey: ["event-invitations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("events")
        .select("*, venues(name, address)")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (data) {
        setGroomName(data.groom_name || "");
        setBrideName(data.bride_name || "");
        setGroomParents(data.groom_parents || "");
        setBrideParents(data.bride_parents || "");
        setIntroText(data.invitation_text || "");
        if (data.event_type) setEventType(data.event_type as EventType);
        setReceptionTime((data as any).reception_time || "");
        setCeremonyTime((data as any).ceremony_time || "");
        setChildName((data as any).child_name || "");
        setFamilyName((data as any).family_name || "");
        setNotes((data as any).invitation_notes || "");
        setVoiceText((data as any).voice_text || "");
        // Load venue info - prefer custom, fallback to venue relation
        const customVenue = (data as any).custom_venue_name;
        const customLocation = (data as any).custom_venue_location;
        const v = data.venues as any;
        setVenueName(customVenue || (v?.name) || "");
        setVenueLocation(customLocation || (v?.address) || "");
      }

      return data;
    },
  });

  const { data: guests, refetch: refetchGuests } = useQuery({
    queryKey: ["event-guests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: eventData } = await supabase.from("events").select("id").eq("owner_id", user.id).maybeSingle();
      if (!eventData) return [];
      const { data } = await supabase.from("guests").select("*").eq("event_id", eventData.id);
      return data || [];
    },
  });

  const { downloadSampleExcel, handleExcelUpload } = useExcelHandler(event?.id, () => refetchGuests());
  const { audioFile, audioUrl, isUploading, handleAudioUpload, removeAudio } = useAudioHandler(event?.id);

  const saveEventData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !event?.id) return;

    await supabase
      .from("events")
      .update({
        event_type: eventType,
        groom_name: groomName,
        bride_name: brideName,
        groom_parents: groomParents,
        bride_parents: brideParents,
        invitation_text: introText,
        reception_time: receptionTime,
        ceremony_time: ceremonyTime,
        child_name: childName,
        family_name: familyName,
        invitation_notes: notes,
        voice_text: voiceText,
        custom_venue_name: venueName,
        custom_venue_location: venueLocation,
      } as any)
      .eq("id", event.id);
  };

  const handleNextStep = async () => {
    if (currentStep === 1) { await saveEventData(); setCurrentStep(2); }
    else if (currentStep === 2) { await saveEventData(); setCurrentStep(3); }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleExcelUpload(file);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAudioUpload(file);
  };

  const downloadInvitation = async () => {
    if (selectedTemplate === null) { toast({ title: "נא לבחור תבנית הזמנה", variant: "destructive" }); return; }
    const templateRef = templateRefs.current[selectedTemplate];
    if (!templateRef) return;
    try {
      const canvas = await html2canvas(templateRef, { scale: 2, backgroundColor: null, useCORS: true });
      const link = document.createElement("a");
      link.download = `הזמנה.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "ההזמנה הורדה בהצלחה!" });
    } catch (error) {
      console.error("Error downloading invitation:", error);
      toast({ title: "שגיאה בהורדת ההזמנה", variant: "destructive" });
    }
  };

  const handleSendInvitations = () => {
    if (selectedTemplate === null && selectedAiIndex === null) { toast({ title: "נא לבחור תבנית הזמנה", variant: "destructive" }); return; }
    toast({ title: "ההזמנות נשלחו בהצלחה!", description: `נשלחו ${guests?.length || 0} הזמנות` });
  };

  const toHebrewDateClient = (rawDate?: string): string => {
    if (!rawDate) return "";
    try {
      const date = new Date(rawDate);
      if (isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric" }).format(date);
    } catch { return ""; }
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setAiInvitations([]);
    setSelectedAiIndex(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invitations", {
        body: {
          eventType,
          groomName,
          brideName,
          childName,
          familyName,
          groomParents,
          brideParents,
          introText,
          eventDate: event?.event_date ? new Date(event.event_date).toLocaleDateString("he-IL") : "",
          hebrewDate: toHebrewDateClient(event?.event_date),
          receptionTime,
          ceremonyTime,
          venueName,
          venueLocation,
          notes,
        },
      });
      if (error) throw error;
      if (data?.error) { toast({ title: data.error, variant: "destructive" }); return; }
      setAiInvitations(data.invitations || []);
      if (data.invitations?.length > 0) {
        toast({ title: `נוצרו ${data.invitations.length} הזמנות מעוצבות!` });
      }
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast({ title: "שגיאה ביצירת הזמנות", description: err.message || "נסה שוב", variant: "destructive" });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const isWeddingType = eventType === "חתונה" || eventType === "אירוסין";
  const isBarBatMitzvah = eventType === "בר מצווה" || eventType === "בת מצווה";

  const templateData = {
    eventType,
    groomName,
    brideName,
    childName,
    familyName,
    groomParents,
    brideParents,
    groomGrandparents: "",
    brideGrandparents: "",
    receptionTime,
    ceremonyTime,
    eventDate: event?.event_date ? new Date(event.event_date).toLocaleDateString("he-IL") : "",
    eventDateRaw: event?.event_date || "",
    introText,
    notes,
    venueName,
    venueLocation,
  };

  const steps = [
    { id: 1, label: "שלב א:", title: "פרטי האירוע" },
    { id: 2, label: "שלב ב:", title: "בחירת מוזמנים" },
    { id: 3, label: "שלב ג:", title: "בחירת עיצוב" },
  ];

  const eventTypes: { value: EventType; label: string }[] = [
    { value: "חתונה", label: "חתונה" },
    { value: "אירוסין", label: "אירוסין" },
    { value: "בר מצווה", label: "בר מצווה" },
    { value: "בת מצווה", label: "בת מצווה" },
    { value: "ברית", label: "ברית" },
    { value: "אחר", label: "אחר" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Steps Header */}
      <div className="flex items-center justify-center gap-2 flex-wrap" dir="rtl">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => step.id <= currentStep && setCurrentStep(step.id as Step)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentStep === step.id
                ? "bg-white shadow-md text-[#051839]"
                : currentStep > step.id
                ? "bg-gray-200 text-[#051839]"
                : "bg-transparent text-gray-400"
            }`}
          >
            <span className="font-bold">{step.label}</span> {step.title}
          </button>
        ))}
      </div>

      {/* Step 1: פרטי האירוע */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5" dir="rtl">
          {/* Event Type Selector */}
          <div className="space-y-2">
            <Label className="text-[#051839] font-medium text-sm">סוג אירוע</Label>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setEventType(t.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    eventType === t.value
                      ? "bg-[#051839] text-white border-[#051839]"
                      : "bg-gray-50 text-[#051839] border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isWeddingType && (
              <>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">שם החתן</Label>
                  <Input value={groomName} onChange={(e) => setGroomName(e.target.value)} placeholder="שם החתן" className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">שם הכלה</Label>
                  <Input value={brideName} onChange={(e) => setBrideName(e.target.value)} placeholder="שם הכלה" className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">הורי החתן</Label>
                  <Input value={groomParents} onChange={(e) => setGroomParents(e.target.value)} placeholder="שם אב ואם החתן" className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">הורי הכלה</Label>
                  <Input value={brideParents} onChange={(e) => setBrideParents(e.target.value)} placeholder="שם אב ואם הכלה" className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">שעת קבלת פנים</Label>
                  <Input type="time" value={receptionTime} onChange={(e) => setReceptionTime(e.target.value)} className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">שעת חופה</Label>
                  <Input type="time" value={ceremonyTime} onChange={(e) => setCeremonyTime(e.target.value)} className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
              </>
            )}

            {isBarBatMitzvah && (
              <>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">
                    {eventType === "בר מצווה" ? "שם חתן הבר מצווה" : "שם הילדה"}
                  </Label>
                  <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder={eventType === "בר מצווה" ? "שם חתן הבר מצווה" : "שם בת המצווה"} className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">שם המשפחה המזמינה</Label>
                  <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="שם המשפחה" className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">שעת קבלת פנים</Label>
                  <Input type="time" value={receptionTime} onChange={(e) => setReceptionTime(e.target.value)} className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
              </>
            )}

            {(eventType === "ברית" || eventType === "אחר") && (
              <>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">שם הילד/ה</Label>
                  <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="שם הילד/ה" className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">שם המשפחה המזמינה</Label>
                  <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="שם המשפחה" className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium text-sm">שעת האירוע</Label>
                  <Input type="time" value={receptionTime} onChange={(e) => setReceptionTime(e.target.value)} className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
                </div>
              </>
            )}

            {/* Venue fields - always shown */}
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-sm">שם האולם</Label>
              <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="שם האולם / מקום האירוע" className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-sm">מיקום האולם</Label>
              <Input value={venueLocation} onChange={(e) => setVenueLocation(e.target.value)} placeholder="כתובת האולם" className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm" />
            </div>
          </div>

          {/* Intro text */}
          <div className="space-y-2">
            <Label className="text-[#051839] font-medium text-sm">טקסט מקדים להזמנה</Label>
            <Textarea
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              placeholder="בשמחה רבה אנו מזמינים אתכם..."
              className="rounded-lg border-gray-200 bg-gray-50 text-right min-h-[80px] text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-[#051839] font-medium text-sm">הערות</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות נוספות להזמנה..."
              className="rounded-lg border-gray-200 bg-gray-50 text-right min-h-[60px] text-sm"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button disabled className="bg-[#C41E3A] text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 opacity-50 cursor-not-allowed">
              <ArrowRight className="w-4 h-4" />
              לשלב הקודם
            </button>
            <button onClick={handleNextStep} className="bg-[#95742F] hover:bg-[#95742F]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors">
              לשלב הבא
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: בחירת מוזמנים */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* Share links section */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4" dir="rtl">
            <h3 className="font-bold text-[#051839] flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#C4A35A]" />
              קישורים לשיתוף — שליחת הזמנות ללא התחברות
            </h3>
            <p className="text-sm text-gray-500">שלחו את הקישורים למשפחה כדי שיוכלו להעלות רשימת מוזמנים בעצמם</p>
            <div className="grid grid-cols-1 gap-3">
              {(isWeddingType ? [
                { key: "groom", label: `צד החתן${groomName ? ` — ${groomName}` : ""}`, token: (event as any)?.share_token_groom },
                { key: "bride", label: `צד הכלה${brideName ? ` — ${brideName}` : ""}`, token: (event as any)?.share_token_bride },
              ] : [
                { key: "general", label: eventType === "ברית" ? `משפחת ${familyName || ""}` : "רשימת מוזמנים", token: (event as any)?.share_token_general },
              ]).map(({ key, label, token }) => (
                <div key={key} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <span className="font-medium text-sm text-[#051839] min-w-[120px]">{label}</span>
                  <code className="flex-1 text-xs bg-white rounded px-3 py-2 border border-gray-200 text-gray-600 truncate" dir="ltr">
                    {token ? `${window.location.origin}/invite/${token}` : "טוען..."}
                  </code>
                  <button
                    onClick={() => {
                      if (token) {
                        navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
                        toast({ title: "הקישור הועתק!" });
                      }
                    }}
                    className="bg-[#051839] text-white p-2 rounded-lg hover:bg-[#08275E] transition-colors shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            <div onClick={() => audioInputRef.current?.click()} className="bg-[#051839] rounded-xl p-4 text-white cursor-pointer hover:bg-[#08275E] transition-colors">
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioFileChange} className="hidden" />
              <div className="flex items-center justify-center gap-2">
                <Music className="w-5 h-5" />
                <h3 className="font-medium text-sm">העלאת קובץ שמע</h3>
              </div>
              <p className="text-xs text-gray-300 text-center mt-1">להזמנה קולית</p>
              {audioFile && (
                <div className="mt-2 flex items-center justify-center gap-2 text-green-400 text-xs">
                  <Check className="w-4 h-4" />
                  <span>{audioFile.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeAudio(); }} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <div onClick={() => excelInputRef.current?.click()} className="bg-[#051839] rounded-xl p-4 text-white cursor-pointer hover:bg-[#08275E] transition-colors">
              <input ref={excelInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelFileChange} className="hidden" />
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-medium text-sm">העלאת רשימת מוזמנים</h3>
              </div>
              <p className="text-xs text-gray-300 text-center mt-1">קובץ אקסל</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-[#051839] font-medium text-sm mb-2">טקסט להזמנה קולית</p>
              <Textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)} placeholder="הזן את הטקסט להזמנה קולית..." className="rounded-lg border-gray-200 bg-white text-right min-h-[70px] text-sm" />
            </div>
            <div onClick={downloadSampleExcel} className="bg-[#C41E3A] rounded-xl p-4 text-white flex items-center justify-center cursor-pointer hover:bg-[#C41E3A]/90 transition-colors">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="font-medium text-sm">הורדת קובץ דוגמה</span>
              </div>
            </div>
          </div>

          {guests && guests.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3" dir="rtl">
              <div className="flex items-center justify-between">
                <p className="text-foreground font-medium text-sm">רשימת מוזמנים ({guests.length})</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-right p-2 font-medium text-muted-foreground">שם</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">טלפון</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">קרבה</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">קישור RSVP</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((g: any) => {
                      const rsvpUrl = `${window.location.origin}/rsvp/${event?.id}/${g.id}`;
                      return (
                        <tr key={g.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-2">{g.full_name}</td>
                          <td className="p-2 text-muted-foreground">{g.phone || "—"}</td>
                          <td className="p-2 text-muted-foreground">{g.relationship || "—"}</td>
                          <td className="p-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(rsvpUrl);
                                toast({ title: "קישור RSVP הועתק!" });
                              }}
                              className="text-[#C4A35A] hover:text-[#95742F] text-xs flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              העתק
                            </button>
                          </td>
                          <td className="p-2">
                            <button
                              onClick={async () => {
                                await supabase.from("guests").delete().eq("id", g.id);
                                refetchGuests();
                              }}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RSVP Message Template */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3" dir="rtl">
            <h3 className="font-bold text-[#051839] flex items-center gap-2 text-sm">
              📩 נוסח הודעת RSVP לשליחה
            </h3>
            <p className="text-xs text-gray-500">העתיקו את הנוסח ושלחו לכל מוזמן עם הקישור האישי שלו</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-[#051839] leading-relaxed whitespace-pre-wrap">
              {isWeddingType
                ? `הוזמנתם לאירוע של ${groomName} ו${brideName} 🎉\n\nכדי להתארגן בהתאם, נשמח לדעת האם אתם מגיעים לאירוע.\n\nלחצו על הקישור כדי לאשר הגעה:\n[קישור אישי]`
                : eventType === "ברית"
                ? `הוזמנתם לאירוע של משפחת ${familyName} 🎉\n\nכדי להתארגן בהתאם, נשמח לדעת האם אתם מגיעים לאירוע.\n\nלחצו על הקישור כדי לאשר הגעה:\n[קישור אישי]`
                : `הוזמנתם לאירוע של ${childName || familyName} 🎉\n\nכדי להתארגן בהתאם, נשמח לדעת האם אתם מגיעים לאירוע.\n\nלחצו על הקישור כדי לאשר הגעה:\n[קישור אישי]`
              }
            </div>
            <p className="text-xs text-gray-400">💡 הקישור האישי של כל מוזמן מופיע בטבלה למעלה — לחצו "העתק" ליד שמו</p>
          </div>

          <div className="flex items-center justify-between pt-4" dir="rtl">
            <button onClick={handlePrevStep} className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors">
              <ArrowRight className="w-4 h-4" />
              לשלב הקודם
            </button>
            <button onClick={handleNextStep} className="bg-[#95742F] hover:bg-[#95742F]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors">
              לשלב הבא
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: בחירת עיצוב */}
      {currentStep === 3 && (
        <div className="space-y-4">
          {/* AI Generation Section */}
          <div className="bg-gradient-to-l from-[#051839] to-[#0A2D6E] rounded-xl p-5 text-white" dir="rtl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#C4A35A]" />
                <div>
                  <h3 className="font-bold text-base">יצירת הזמנה עם AI</h3>
                  <p className="text-xs text-gray-300 mt-0.5">צור 4 עיצובים מרהיבים ומותאמים אישית על בסיס הפרטים שהזנת</p>
                </div>
              </div>
              <button
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="bg-[#C4A35A] hover:bg-[#B8942A] disabled:opacity-50 text-[#051839] font-bold rounded-lg py-2.5 px-6 text-sm flex items-center gap-2 transition-colors"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    יוצר הזמנות...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    צור הזמנות עם AI
                  </>
                )}
              </button>
            </div>
            {isGeneratingAI && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                  <Loader2 className="w-5 h-5 animate-spin text-[#C4A35A]" />
                  <span>מייצר 4 עיצובים מותאמים אישית, זה עלול לקחת כחצי דקה...</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Generated Results */}
          {aiInvitations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[#051839] font-bold text-base text-right" dir="rtl">🎨 הזמנות שנוצרו עם AI</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" dir="rtl">
                {aiInvitations.map((inv, idx) => (
                  <div
                    key={inv.id}
                    onClick={() => { setSelectedAiIndex(idx); setSelectedTemplate(null); }}
                    className={`relative bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${selectedAiIndex === idx ? "ring-2 ring-[#C4A35A]" : ""}`}
                  >
                    <div className={`absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center z-10 ${selectedAiIndex === idx ? "bg-[#C4A35A] border-[#C4A35A]" : "border-gray-300 bg-white"}`}>
                      {selectedAiIndex === idx && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <img src={inv.imageUrl} alt={inv.style} className="w-full aspect-[5/7] object-cover" />
                    <div className="p-2 bg-white border-t">
                      <h3 className="font-medium text-[#051839] text-center text-xs">{inv.style}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Templates */}
          <h3 className="text-[#051839] font-bold text-base text-right pt-2" dir="rtl">📋 תבניות מוכנות</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto p-1" dir="rtl">
            {templates.map((template, index) => {
              const TemplateComponent = template.Component;
              return (
                <div
                  key={template.id}
                  onClick={() => { setSelectedTemplate(index); setSelectedAiIndex(null); }}
                  className={`relative bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${selectedTemplate === index ? "ring-2 ring-[#95742F]" : ""}`}
                >
                  <div className={`absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center z-10 ${selectedTemplate === index ? "bg-[#95742F] border-[#95742F]" : "border-gray-300 bg-white"}`}>
                    {selectedTemplate === index && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="relative overflow-hidden" style={{ height: "280px" }}>
                    <div ref={(el) => { templateRefs.current[index] = el; }} className="absolute top-0 left-1/2 -translate-x-1/2 scale-[0.5] origin-top">
                      <TemplateComponent data={templateData} />
                    </div>
                  </div>
                  <div className="p-3 bg-white border-t">
                    <h3 className="font-medium text-[#051839] text-center text-sm">{template.name}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            <button onClick={downloadInvitation} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <Download className="w-5 h-5 text-[#051839]" />
              <span className="text-[#051839] font-medium text-sm">הורדת ההזמנה כתמונה</span>
            </button>
            {selectedAiIndex !== null && aiInvitations[selectedAiIndex] && (
              <a href={aiInvitations[selectedAiIndex].imageUrl} download={`הזמנה-ai-${selectedAiIndex + 1}.png`} target="_blank" rel="noopener noreferrer" className="bg-[#C4A35A] hover:bg-[#B8942A] rounded-xl p-4 flex items-center justify-center gap-2 transition-colors">
                <Download className="w-5 h-5 text-white" />
                <span className="text-white font-medium text-sm">הורדת הזמנת AI</span>
              </a>
            )}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-5 h-5 text-[#051839]" />
              <span className="text-[#051839] font-medium text-sm">העלאת קובץ הזמנה מוכן</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4" dir="rtl">
            <button onClick={handlePrevStep} className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors">
              <ArrowRight className="w-4 h-4" />
              לשלב הקודם
            </button>
            <button onClick={handleSendInvitations} className="bg-[#95742F] hover:bg-[#95742F]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors">
              שליחת ההזמנות
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
