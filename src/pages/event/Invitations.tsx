import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Upload, Download, Music, FileSpreadsheet, X, Check, Loader2, Trash2, Link2, Copy, UserPlus, Send } from "lucide-react";
import { useExcelHandler } from "@/components/invitations/useExcelHandler";
import { useAudioHandler } from "@/components/invitations/useAudioHandler";

type Step = 1 | 2 | 3;
type EventType = "חתונה" | "אירוסין" | "בר מצווה" | "בת מצווה" | "ברית" | "אחר";

export default function EventInvitations() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [detailsLocked, setDetailsLocked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const [invitationImageUrl, setInvitationImageUrl] = useState<string | null>(null);
  const [uploadingInvitation, setUploadingInvitation] = useState(false);
  const invitationInputRef = useRef<HTMLInputElement>(null);

  // Add guest form
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestRelationship, setNewGuestRelationship] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);

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
        const customVenue = (data as any).custom_venue_name;
        const customLocation = (data as any).custom_venue_location;
        const v = data.venues as any;
        setVenueName(customVenue || (v?.name) || "");
        setVenueLocation(customLocation || (v?.address) || "");
        setInvitationImageUrl((data as any).invitation_design_url || null);

        // If invitation details were already saved, lock them and start at step 2
        const hasDetails = data.groom_name || data.bride_name || (data as any).child_name || (data as any).family_name;
        if (hasDetails && data.invitation_text) {
          setDetailsLocked(true);
          // Load saved step from localStorage
          const savedStep = localStorage.getItem(`inv-step-${data.id}`);
          if (savedStep) {
            const s = Number(savedStep);
            if (s >= 1 && s <= 3) setCurrentStep(s as Step);
          } else {
            setCurrentStep(2);
          }
        }
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
      const { data } = await supabase.from("guests").select("*").eq("event_id", eventData.id).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { downloadSampleExcel, handleExcelUpload } = useExcelHandler(event?.id, () => refetchGuests());
  const { audioFile, audioUrl, isUploading, handleAudioUpload, removeAudio } = useAudioHandler(event?.id);

  // Persist step
  useEffect(() => {
    if (event?.id) {
      localStorage.setItem(`inv-step-${event.id}`, String(currentStep));
    }
  }, [currentStep, event?.id]);

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
    if (currentStep === 1) {
      if (isWeddingType && !groomName.trim()) {
        toast({ title: "⚠️ שם חתן חסר", variant: "destructive" }); return;
      }
      if (isWeddingType && !brideName.trim()) {
        toast({ title: "⚠️ שם כלה חסר", variant: "destructive" }); return;
      }
      if (isBarBatMitzvah && !childName.trim()) {
        toast({ title: "⚠️ שם חסר", variant: "destructive" }); return;
      }
      if ((eventType === "ברית" || eventType === "אחר") && !childName.trim() && !familyName.trim()) {
        toast({ title: "⚠️ שם חסר", variant: "destructive" }); return;
      }
      await saveEventData();
      setDetailsLocked(true);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      await saveEventData();
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleExcelUpload(file);
    e.target.value = "";
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAudioUpload(file);
  };

  const handleAddGuest = async () => {
    if (!newGuestName.trim()) {
      toast({ title: "⚠️ יש להזין שם מוזמן", variant: "destructive" }); return;
    }
    if (!event?.id) return;
    setAddingGuest(true);
    try {
      const { error } = await supabase.from("guests").insert({
        event_id: event.id,
        full_name: newGuestName.trim(),
        phone: newGuestPhone.trim() || null,
        email: newGuestEmail.trim() || null,
        relationship: newGuestRelationship.trim() || null,
        side: "general",
        invitation_sent: false,
      });
      if (error) throw error;
      toast({ title: "מוזמן נוסף בהצלחה! ✅" });
      setNewGuestName(""); setNewGuestPhone(""); setNewGuestEmail(""); setNewGuestRelationship("");
      refetchGuests();
    } catch (err: any) {
      toast({ title: "שגיאה בהוספת מוזמן", description: err.message, variant: "destructive" });
    } finally {
      setAddingGuest(false);
    }
  };

  const sanitizeFilename = (name: string) =>
    name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const handleInvitationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !event?.id) return;
    setUploadingInvitation(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `invitations/${event.id}/${Date.now()}-${sanitizeFilename(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase
        .from("events")
        .update({ invitation_design_url: url } as any)
        .eq("id", event.id);
      if (updErr) throw updErr;
      setInvitationImageUrl(url);
      queryClient.invalidateQueries({ queryKey: ["event-invitations"] });
      toast({ title: "ההזמנה הועלתה בהצלחה!" });
    } catch (err: any) {
      toast({ title: "שגיאה בהעלאת ההזמנה", description: err.message, variant: "destructive" });
    } finally {
      setUploadingInvitation(false);
    }
  };

  const handleRemoveInvitation = async () => {
    if (!event?.id) return;
    try {
      await supabase.from("events").update({ invitation_design_url: null } as any).eq("id", event.id);
      setInvitationImageUrl(null);
      queryClient.invalidateQueries({ queryKey: ["event-invitations"] });
      toast({ title: "ההזמנה הוסרה" });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  };

  const handleSendInvitations = () => {
    if (!invitationImageUrl) { toast({ title: "נא להעלות קובץ הזמנה", variant: "destructive" }); return; }
    toast({ title: "ההזמנות נשלחו בהצלחה!", description: `נשלחו ${guests?.length || 0} הזמנות` });
  };

  const isWeddingType = eventType === "חתונה" || eventType === "אירוסין";
  const isBarBatMitzvah = eventType === "בר מצווה" || eventType === "בת מצווה";

  const steps = [
    { id: 1, label: "שלב א:", title: "פרטי האירוע" },
    { id: 2, label: "שלב ב:", title: "ניהול מוזמנים" },
    { id: 3, label: "שלב ג:", title: "העלאת הזמנה ושליחה" },
  ];

  const eventTypes: { value: EventType; label: string }[] = [
    { value: "חתונה", label: "חתונה" },
    { value: "אירוסין", label: "אירוסין" },
    { value: "בר מצווה", label: "בר מצווה" },
    { value: "בת מצווה", label: "בת מצווה" },
    { value: "ברית", label: "ברית" },
    { value: "אחר", label: "אחר" },
  ];

  // Generate RSVP message for a guest
  const getRsvpMessage = (guest: any) => {
    const rsvpUrl = `${window.location.origin}/rsvp/${event?.id}/${guest.id}`;
    const eventName = isWeddingType
      ? `${groomName} ו${brideName}`
      : eventType === "ברית"
      ? `משפחת ${familyName}`
      : childName || familyName;

    return `הוזמנתם לאירוע של ${eventName} 🎉\n\nנשמח לדעת האם אתם מגיעים.\nלחצו לאישור הגעה:\n${rsvpUrl}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Steps Header */}
      <div className="flex items-center justify-center gap-2 flex-wrap" dir="rtl">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => {
              // Allow going to step 1 only if not locked, otherwise allow navigation
              if (step.id === 1 && detailsLocked) return;
              if (step.id <= currentStep || (detailsLocked && step.id <= 3)) setCurrentStep(step.id as Step);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentStep === step.id
                ? "bg-white shadow-md text-secondary"
                : currentStep > step.id || (detailsLocked && step.id < currentStep)
                ? "bg-muted text-secondary"
                : "bg-transparent text-muted-foreground"
            } ${step.id === 1 && detailsLocked ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="font-bold">{step.label}</span> {step.title}
            {step.id === 1 && detailsLocked && " ✅"}
          </button>
        ))}
      </div>

      {/* Step 1: פרטי האירוע */}
      {currentStep === 1 && (
        <div className="bg-card rounded-xl shadow-sm p-6 space-y-5" dir="rtl">
          {detailsLocked && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
              <Check className="w-4 h-4" />
              פרטי ההזמנה נשמרו — ניתן לעבור לשלב הבא
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-secondary font-medium text-sm">סוג אירוע</Label>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => !detailsLocked && setEventType(t.value)}
                  disabled={detailsLocked}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    eventType === t.value
                      ? "bg-secondary text-white border-secondary"
                      : "bg-muted text-secondary border-border hover:bg-muted/80"
                  } ${detailsLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isWeddingType && (
              <>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שם החתן</Label>
                  <Input value={groomName} onChange={(e) => setGroomName(e.target.value)} placeholder="שם החתן" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שם הכלה</Label>
                  <Input value={brideName} onChange={(e) => setBrideName(e.target.value)} placeholder="שם הכלה" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">הורי החתן</Label>
                  <Input value={groomParents} onChange={(e) => setGroomParents(e.target.value)} placeholder="שם אב ואם החתן" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">הורי הכלה</Label>
                  <Input value={brideParents} onChange={(e) => setBrideParents(e.target.value)} placeholder="שם אב ואם הכלה" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שעת קבלת פנים</Label>
                  <Input type="time" value={receptionTime} onChange={(e) => setReceptionTime(e.target.value)} disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שעת חופה</Label>
                  <Input type="time" value={ceremonyTime} onChange={(e) => setCeremonyTime(e.target.value)} disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
              </>
            )}

            {isBarBatMitzvah && (
              <>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">{eventType === "בר מצווה" ? "שם חתן הבר מצווה" : "שם הילדה"}</Label>
                  <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder={eventType === "בר מצווה" ? "שם חתן הבר מצווה" : "שם בת המצווה"} disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שם המשפחה המזמינה</Label>
                  <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="שם המשפחה" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שעת קבלת פנים</Label>
                  <Input type="time" value={receptionTime} onChange={(e) => setReceptionTime(e.target.value)} disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
              </>
            )}

            {eventType === "ברית" && (
              <>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שם המשפחה המזמינה</Label>
                  <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="שם המשפחה" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שעת האירוע</Label>
                  <Input type="time" value={receptionTime} onChange={(e) => setReceptionTime(e.target.value)} disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
              </>
            )}

            {eventType === "אחר" && (
              <>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שם הילד/ה</Label>
                  <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="שם הילד/ה" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שם המשפחה המזמינה</Label>
                  <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="שם המשפחה" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary font-medium text-sm">שעת האירוע</Label>
                  <Input type="time" value={receptionTime} onChange={(e) => setReceptionTime(e.target.value)} disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-secondary font-medium text-sm">שם האולם</Label>
              <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="שם האולם / מקום האירוע" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-secondary font-medium text-sm">מיקום האולם</Label>
              <Input value={venueLocation} onChange={(e) => setVenueLocation(e.target.value)} placeholder="כתובת האולם" disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-secondary font-medium text-sm">טקסט מקדים להזמנה</Label>
            <Textarea value={introText} onChange={(e) => setIntroText(e.target.value)} placeholder="בשמחה רבה אנו מזמינים אתכם..." disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right min-h-[80px] text-sm" />
          </div>

          <div className="space-y-2">
            <Label className="text-secondary font-medium text-sm">הערות</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות נוספות להזמנה..." disabled={detailsLocked} className="rounded-lg border-border bg-muted text-right min-h-[60px] text-sm" />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div />
            {!detailsLocked ? (
              <button onClick={handleNextStep} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors">
                שמור והמשך
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setDetailsLocked(false)} className="text-muted-foreground hover:text-foreground text-sm underline">
                  עריכת פרטים
                </button>
                <button onClick={() => setCurrentStep(2)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors">
                  לניהול מוזמנים
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: ניהול מוזמנים */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* Share links */}
          <div className="bg-card rounded-xl shadow-sm p-5 space-y-4" dir="rtl">
            <h3 className="font-bold text-secondary flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              קישורים לשיתוף — שליחת הזמנות ללא התחברות
            </h3>
            <p className="text-sm text-muted-foreground">שלחו את הקישורים למשפחה כדי שיוכלו להעלות רשימת מוזמנים בעצמם</p>
            <div className="grid grid-cols-1 gap-3">
              {(isWeddingType ? [
                { key: "groom", label: `צד החתן${groomName ? ` — ${groomName}` : ""}`, token: (event as any)?.share_token_groom },
                { key: "bride", label: `צד הכלה${brideName ? ` — ${brideName}` : ""}`, token: (event as any)?.share_token_bride },
              ] : [
                { key: "general", label: eventType === "ברית" ? `משפחת ${familyName || ""}` : "רשימת מוזמנים", token: (event as any)?.share_token_general },
              ]).map(({ key, label, token }) => (
                <div key={key} className="flex items-center gap-3 bg-muted rounded-lg p-3 border border-border">
                  <span className="font-medium text-sm text-secondary min-w-[120px]">{label}</span>
                  <code className="flex-1 text-xs bg-card rounded px-3 py-2 border border-border text-muted-foreground truncate" dir="ltr">
                    {token ? `${window.location.origin}/invite/${token}` : "טוען..."}
                  </code>
                  <button
                    onClick={() => {
                      if (token) {
                        navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
                        toast({ title: "הקישור הועתק!" });
                      }
                    }}
                    className="bg-secondary text-white p-2 rounded-lg hover:bg-secondary/90 transition-colors shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add guest form */}
          <div className="bg-card rounded-xl shadow-sm p-5 space-y-4" dir="rtl">
            <h3 className="font-bold text-secondary flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              הוספת מוזמן ידנית
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Input value={newGuestName} onChange={e => setNewGuestName(e.target.value)} placeholder="שם מלא *" className="text-sm" />
              <Input value={newGuestPhone} onChange={e => setNewGuestPhone(e.target.value)} placeholder="טלפון" className="text-sm" />
              <Input value={newGuestEmail} onChange={e => setNewGuestEmail(e.target.value)} placeholder="אימייל" type="email" className="text-sm" />
              <Input value={newGuestRelationship} onChange={e => setNewGuestRelationship(e.target.value)} placeholder="קרבה" className="text-sm" />
              <Button onClick={handleAddGuest} disabled={addingGuest} variant="gold" className="h-10">
                {addingGuest ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 ml-1" /> הוסף</>}
              </Button>
            </div>
          </div>

          {/* Excel + Audio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            <div onClick={() => excelInputRef.current?.click()} className="bg-secondary rounded-xl p-4 text-white cursor-pointer hover:bg-secondary/90 transition-colors">
              <input ref={excelInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelFileChange} className="hidden" />
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-medium text-sm">העלאת רשימת מוזמנים מאקסל</h3>
              </div>
              <p className="text-xs text-white/60 text-center mt-1">קובץ אקסל עם עמודות: שם_מלא, טלפון, אימייל, קרבה</p>
            </div>
            <div onClick={downloadSampleExcel} className="bg-destructive rounded-xl p-4 text-white flex items-center justify-center cursor-pointer hover:bg-destructive/90 transition-colors">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="font-medium text-sm">הורדת קובץ דוגמה</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            <div onClick={() => audioInputRef.current?.click()} className="bg-secondary rounded-xl p-4 text-white cursor-pointer hover:bg-secondary/90 transition-colors">
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioFileChange} className="hidden" />
              <div className="flex items-center justify-center gap-2">
                <Music className="w-5 h-5" />
                <h3 className="font-medium text-sm">העלאת קובץ שמע</h3>
              </div>
              <p className="text-xs text-white/60 text-center mt-1">להזמנה קולית</p>
              {audioFile && (
                <div className="mt-2 flex items-center justify-center gap-2 text-green-400 text-xs">
                  <Check className="w-4 h-4" />
                  <span>{audioFile.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeAudio(); }} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <div className="bg-muted rounded-xl p-4">
              <p className="text-secondary font-medium text-sm mb-2">טקסט להזמנה קולית</p>
              <Textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)} placeholder="הזן את הטקסט להזמנה קולית..." className="rounded-lg border-border bg-card text-right min-h-[70px] text-sm" />
            </div>
          </div>

          {/* Guests list */}
          {guests && guests.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3" dir="rtl">
              <div className="flex items-center justify-between">
                <p className="text-foreground font-medium text-sm">רשימת מוזמנים ({guests.length})</p>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-right p-2 font-medium text-muted-foreground">שם</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">טלפון</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">אימייל</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">קרבה</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">קישור RSVP</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">שלח</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((g: any) => {
                      const rsvpUrl = `${window.location.origin}/rsvp/${event?.id}/${g.id}`;
                      const waMessage = encodeURIComponent(getRsvpMessage(g));
                      const waLink = g.phone ? `https://wa.me/972${g.phone.replace(/^0/, "").replace(/[-\s]/g, "")}?text=${waMessage}` : null;
                      return (
                        <tr key={g.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-2 font-medium">{g.full_name}</td>
                          <td className="p-2 text-muted-foreground">{g.phone || "—"}</td>
                          <td className="p-2 text-muted-foreground">{g.email || "—"}</td>
                          <td className="p-2 text-muted-foreground">{g.relationship || "—"}</td>
                          <td className="p-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(rsvpUrl);
                                toast({ title: "קישור RSVP הועתק!" });
                              }}
                              className="text-primary hover:text-primary/80 text-xs flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              העתק
                            </button>
                          </td>
                          <td className="p-2">
                            {waLink ? (
                              <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1">
                                <Send className="w-3 h-3" />
                                וואטסאפ
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
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

          <div className="flex items-center justify-between pt-4" dir="rtl">
            <button onClick={handlePrevStep} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              <ArrowRight className="w-4 h-4" />
              חזרה לפרטי אירוע
            </button>
            <button onClick={handleNextStep} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors">
              לבחירת עיצוב
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: בחירת עיצוב */}
      {currentStep === 3 && (
        <div className="space-y-4" dir="rtl">
          <div className="bg-card rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-secondary text-base">העלאת קובץ הזמנה</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              העלו את קובץ ההזמנה המעוצב שלכם (תמונה או PDF). הקובץ יישמר וישמש לשליחת ההזמנות למוזמנים.
            </p>

            <input
              ref={invitationInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleInvitationUpload}
              className="hidden"
            />

            {invitationImageUrl ? (
              <div className="space-y-3">
                <div className="border border-border rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center p-4">
                  {invitationImageUrl.toLowerCase().endsWith(".pdf") ? (
                    <a href={invitationImageUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      פתיחת קובץ ההזמנה (PDF)
                    </a>
                  ) : (
                    <img src={invitationImageUrl} alt="הזמנה שהועלתה" className="max-h-[500px] object-contain rounded-lg" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => invitationInputRef.current?.click()}
                    disabled={uploadingInvitation}
                    className="bg-card border border-border text-secondary rounded-lg py-2 px-4 text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                  >
                    {uploadingInvitation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    החלפת קובץ
                  </button>
                  <a
                    href={invitationImageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border border-border text-secondary rounded-lg py-2 px-4 text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    הורדה
                  </a>
                  <button
                    onClick={handleRemoveInvitation}
                    className="text-destructive hover:text-destructive/80 rounded-lg py-2 px-4 text-sm flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    הסרה
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => invitationInputRef.current?.click()}
                disabled={uploadingInvitation}
                className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                {uploadingInvitation ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">מעלה...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium text-secondary">לחצו להעלאת קובץ הזמנה</span>
                    <span className="text-xs text-muted-foreground">תמונה (PNG, JPG) או PDF</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button onClick={handlePrevStep} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              <ArrowRight className="w-4 h-4" />
              חזרה למוזמנים
            </button>
            <button
              onClick={handleSendInvitations}
              disabled={!invitationImageUrl}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors"
            >
              שליחת ההזמנות
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
