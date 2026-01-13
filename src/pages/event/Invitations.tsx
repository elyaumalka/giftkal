import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

type Step = 1 | 2 | 3;

interface Invitation {
  id: number;
  style: string;
  imageUrl: string;
}

export default function EventInvitations() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedInvitation, setSelectedInvitation] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for step 1
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [groomParents, setGroomParents] = useState("");
  const [brideParents, setBrideParents] = useState("");
  const [groomGrandparents, setGroomGrandparents] = useState("");
  const [brideGrandparents, setBrideGrandparents] = useState("");
  const [introText, setIntroText] = useState("");
  const [voiceText, setVoiceText] = useState("");
  
  // Generated invitations
  const [generatedInvitations, setGeneratedInvitations] = useState<Invitation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch event data
  const { data: event } = useQuery({
    queryKey: ["event-invitations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (data) {
        setGroomName(data.groom_name || "");
        setBrideName(data.bride_name || "");
        setGroomParents(data.groom_parents || "");
        setBrideParents(data.bride_parents || "");
        setGroomGrandparents(data.groom_grandparents || "");
        setBrideGrandparents(data.bride_grandparents || "");
        setIntroText(data.invitation_text || "");
      }

      return data;
    },
  });

  // Fetch guests
  const { data: guests } = useQuery({
    queryKey: ["event-guests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: eventData } = await supabase
        .from("events")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!eventData) return [];

      const { data } = await supabase
        .from("guests")
        .select("*")
        .eq("event_id", eventData.id);

      return data || [];
    },
  });

  // Generate invitations with AI
  const generateInvitations = async () => {
    if (!groomName || !brideName) {
      toast({ title: "נא למלא לפחות את שמות החתן והכלה", variant: "destructive" });
      return false;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invitations", {
        body: {
          groomName,
          brideName,
          groomParents,
          brideParents,
          groomGrandparents,
          brideGrandparents,
          introText,
        },
      });

      if (error) throw error;

      if (data?.invitations) {
        setGeneratedInvitations(data.invitations);
        toast({ title: "ההזמנות נוצרו בהצלחה!" });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error generating invitations:", error);
      toast({ title: "שגיאה ביצירת ההזמנות", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  // Save event data
  const saveEventData = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !event?.id) throw new Error("No user or event");

      const { error } = await supabase
        .from("events")
        .update({
          groom_name: groomName,
          bride_name: brideName,
          groom_parents: groomParents,
          bride_parents: brideParents,
          groom_grandparents: groomGrandparents,
          bride_grandparents: brideGrandparents,
          invitation_text: introText,
        })
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-invitations"] });
    },
  });

  const handleNextStep = async () => {
    if (currentStep === 1) {
      await saveEventData.mutateAsync();
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Generate invitations when moving to step 3
      const success = await generateInvitations();
      if (success) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSendInvitations = () => {
    if (!selectedInvitation) {
      toast({ title: "נא לבחור הזמנה", variant: "destructive" });
      return;
    }
    toast({ title: "ההזמנות נשלחו בהצלחה!", description: `נשלחו ${guests?.length || 0} הזמנות` });
  };

  const steps = [
    { id: 1, label: "שלב א:", title: "בחירת עיצוב הזמנה" },
    { id: 2, label: "שלב ב:", title: "בחירת מוזמנים" },
    { id: 3, label: "שלב ג:", title: "שליחת הזמנות" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Steps Header */}
      <div className="flex items-center justify-center gap-4" dir="rtl">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            <button
              onClick={() => step.id <= currentStep && setCurrentStep(step.id as Step)}
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                currentStep === step.id
                  ? "bg-white shadow-md text-[#051839]"
                  : currentStep > step.id
                  ? "bg-gray-200 text-[#051839]"
                  : "bg-transparent text-gray-400"
              }`}
            >
              <span className="font-bold">{step.label}</span> {step.title}
            </button>
          </div>
        ))}
      </div>

      {/* Step 1: Form - פרטי האירוע */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir="rtl">
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">שם החתן</Label>
              <Input
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                placeholder="שם החתן"
                className="rounded-xl border-gray-200 bg-gray-100 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">שם הכלה</Label>
              <Input
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                placeholder="שם הכלה"
                className="rounded-xl border-gray-200 bg-gray-100 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">שם אב ואם החתן</Label>
              <Input
                value={groomParents}
                onChange={(e) => setGroomParents(e.target.value)}
                placeholder="שם אב ואם החתן"
                className="rounded-xl border-gray-200 bg-gray-100 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">שם אב ואם הכלה</Label>
              <Input
                value={brideParents}
                onChange={(e) => setBrideParents(e.target.value)}
                placeholder="שם אב ואם הכלה"
                className="rounded-xl border-gray-200 bg-gray-100 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">שם הסבא והסבתא חתן</Label>
              <Input
                value={groomGrandparents}
                onChange={(e) => setGroomGrandparents(e.target.value)}
                placeholder="שם הסבא והסבתא חתן"
                className="rounded-xl border-gray-200 bg-gray-100 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">שם הסבא והסבתא כלה</Label>
              <Input
                value={brideGrandparents}
                onChange={(e) => setBrideGrandparents(e.target.value)}
                placeholder="שם הסבא והסבתא כלה"
                className="rounded-xl border-gray-200 bg-gray-100 text-right"
              />
            </div>
          </div>

          <div className="space-y-2" dir="rtl">
            <Label className="text-[#051839] font-medium">טקסט מקדים להזמנה</Label>
            <Textarea
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              placeholder="טקסט מקדים להזמנה..."
              className="rounded-xl border-gray-200 bg-gray-100 text-right min-h-[120px]"
            />
          </div>

          {/* Navigation Buttons - הבא בשמאל, הקודם בימין */}
          <div className="flex items-center justify-between pt-4" dir="rtl">
            <button
              disabled
              className="bg-[#C41E3A] text-white rounded-lg py-2 px-6 text-sm flex items-center gap-2 transition-colors font-medium opacity-50 cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
              לשלב הקודם
            </button>
            <button
              onClick={handleNextStep}
              className="bg-[#95742F] hover:bg-[#95742F]/90 text-white rounded-lg py-2 px-6 text-sm flex items-center gap-2 transition-colors font-medium"
            >
              לשלב הבא
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: בחירת מוזמנים - העלאת קבצים */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* Upload Cards Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            <div className="bg-[#051839] rounded-xl p-4 text-white cursor-pointer hover:bg-[#08275E] transition-colors">
              <h3 className="font-medium text-sm flex items-center justify-center gap-2">
                העלאת קובץ שמע
                <ArrowLeft className="w-3 h-3" />
              </h3>
              <p className="text-xs text-gray-300 text-center mt-1">לרוצים להזמין באמצעות הודעה קולית</p>
            </div>
            <div className="bg-[#051839] rounded-xl p-4 text-white cursor-pointer hover:bg-[#08275E] transition-colors">
              <h3 className="font-medium text-sm flex items-center justify-center gap-2">
                העלאת רשימת מוזמנים (אקסאל)
                <ArrowLeft className="w-3 h-3" />
              </h3>
            </div>
          </div>

          {/* Upload Cards Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-[#051839] text-center font-medium text-sm mb-2">הזנת טקסט הזמנה למערכת המענה הקולי</p>
              <Textarea
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="הזן את הטקסט להזמנה קולית..."
                className="rounded-lg border-gray-200 bg-white text-right min-h-[80px] text-sm"
              />
            </div>
            <div className="bg-[#C41E3A] rounded-xl p-4 text-white flex items-center justify-center cursor-pointer hover:bg-[#C41E3A]/90 transition-colors">
              <button className="font-medium text-sm flex items-center justify-center gap-2">
                הורדת קובץ דוגמא
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4" dir="rtl">
            <button
              onClick={handlePrevStep}
              className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-lg py-2 px-6 text-sm flex items-center gap-2 transition-colors font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              לשלב הקודם
            </button>
            <button
              onClick={handleNextStep}
              disabled={isGenerating}
              className="bg-[#95742F] hover:bg-[#95742F]/90 text-white rounded-lg py-2 px-6 text-sm flex items-center gap-2 transition-colors font-medium disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  יוצר הזמנות...
                </>
              ) : (
                <>
                  לשלב הבא
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: בחירת עיצוב הזמנה מ-AI או העלאה */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Generated Invitations Grid - תמונות */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
            {generatedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                onClick={() => setSelectedInvitation(invitation.id)}
                className={`relative bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  selectedInvitation === invitation.id ? "ring-2 ring-[#95742F]" : ""
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`absolute top-4 left-4 w-6 h-6 rounded border-2 flex items-center justify-center z-10 ${
                    selectedInvitation === invitation.id
                      ? "bg-[#95742F] border-[#95742F]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {selectedInvitation === invitation.id && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                {/* Invitation Image */}
                <div className="aspect-[3/4]">
                  <img 
                    src={invitation.imageUrl} 
                    alt={invitation.style}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Style label */}
                <div className="p-3 bg-white">
                  <h3 className="font-bold text-[#051839] text-center">{invitation.style}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Upload own design */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-center">
            <button className="text-[#051839] font-medium flex items-center gap-2 hover:underline">
              העלאת קובץ הזמנה מוכן
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4" dir="rtl">
            <button
              onClick={handlePrevStep}
              className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-lg py-2 px-6 text-sm flex items-center gap-2 transition-colors font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              לשלב הקודם
            </button>
            <button
              onClick={handleSendInvitations}
              className="bg-[#95742F] hover:bg-[#95742F]/90 text-white rounded-lg py-2 px-6 text-sm flex items-center gap-2 transition-colors font-medium"
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
