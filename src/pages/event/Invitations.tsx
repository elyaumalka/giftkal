import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Upload, Download, Music, FileSpreadsheet, X, Check } from "lucide-react";
import { templates } from "@/components/invitations/InvitationTemplates";
import { useExcelHandler } from "@/components/invitations/useExcelHandler";
import { useAudioHandler } from "@/components/invitations/useAudioHandler";
import html2canvas from "html2canvas";

type Step = 1 | 2 | 3;

export default function EventInvitations() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const templateRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Form state for step 1
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [groomParents, setGroomParents] = useState("");
  const [brideParents, setBrideParents] = useState("");
  const [groomGrandparents, setGroomGrandparents] = useState("");
  const [brideGrandparents, setBrideGrandparents] = useState("");
  const [introText, setIntroText] = useState("");
  const [voiceText, setVoiceText] = useState("");
  
  // File input refs
  const excelInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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
  const { data: guests, refetch: refetchGuests } = useQuery({
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

  // Excel handler
  const { downloadSampleExcel, handleExcelUpload } = useExcelHandler(event?.id, () => {
    refetchGuests();
  });

  // Audio handler
  const { audioFile, audioUrl, isUploading, handleAudioUpload, removeAudio } = useAudioHandler(event?.id);

  // Save event data
  const saveEventData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !event?.id) return;

    await supabase
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
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      await saveEventData();
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleExcelUpload(file);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAudioUpload(file);
    }
  };

  const downloadInvitation = async () => {
    if (selectedTemplate === null) {
      toast({ title: "נא לבחור תבנית הזמנה", variant: "destructive" });
      return;
    }

    const templateRef = templateRefs.current[selectedTemplate];
    if (!templateRef) return;

    try {
      const canvas = await html2canvas(templateRef, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `הזמנה_${groomName}_${brideName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({ title: "ההזמנה הורדה בהצלחה!" });
    } catch (error) {
      console.error("Error downloading invitation:", error);
      toast({ title: "שגיאה בהורדת ההזמנה", variant: "destructive" });
    }
  };

  const handleSendInvitations = () => {
    if (selectedTemplate === null) {
      toast({ title: "נא לבחור תבנית הזמנה", variant: "destructive" });
      return;
    }
    toast({ title: "ההזמנות נשלחו בהצלחה!", description: `נשלחו ${guests?.length || 0} הזמנות` });
  };

  const templateData = {
    groomName,
    brideName,
    groomParents,
    brideParents,
    groomGrandparents,
    brideGrandparents,
    eventDate: event?.event_date ? new Date(event.event_date).toLocaleDateString("he-IL") : "",
    introText,
  };

  const steps = [
    { id: 1, label: "שלב א:", title: "פרטי האירוע" },
    { id: 2, label: "שלב ב:", title: "בחירת מוזמנים" },
    { id: 3, label: "שלב ג:", title: "בחירת עיצוב" },
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

      {/* Step 1: Form - פרטי האירוע */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir="rtl">
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-sm">שם החתן</Label>
              <Input
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                placeholder="שם החתן"
                className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-sm">שם הכלה</Label>
              <Input
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                placeholder="שם הכלה"
                className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-sm">הורי החתן</Label>
              <Input
                value={groomParents}
                onChange={(e) => setGroomParents(e.target.value)}
                placeholder="שם אב ואם החתן"
                className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-sm">הורי הכלה</Label>
              <Input
                value={brideParents}
                onChange={(e) => setBrideParents(e.target.value)}
                placeholder="שם אב ואם הכלה"
                className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-sm">סבי החתן</Label>
              <Input
                value={groomGrandparents}
                onChange={(e) => setGroomGrandparents(e.target.value)}
                placeholder="שם הסבא והסבתא חתן"
                className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-sm">סבי הכלה</Label>
              <Input
                value={brideGrandparents}
                onChange={(e) => setBrideGrandparents(e.target.value)}
                placeholder="שם הסבא והסבתא כלה"
                className="rounded-lg border-gray-200 bg-gray-50 text-right text-sm"
              />
            </div>
          </div>

          <div className="space-y-2" dir="rtl">
            <Label className="text-[#051839] font-medium text-sm">טקסט מקדים להזמנה</Label>
            <Textarea
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              placeholder="בשמחה רבה אנו מזמינים אתכם..."
              className="rounded-lg border-gray-200 bg-gray-50 text-right min-h-[80px] text-sm"
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4" dir="rtl">
            <button
              disabled
              className="bg-[#C41E3A] text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
              לשלב הקודם
            </button>
            <button
              onClick={handleNextStep}
              className="bg-[#95742F] hover:bg-[#95742F]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors"
            >
              לשלב הבא
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: בחירת מוזמנים */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            {/* העלאת קובץ שמע */}
            <div 
              onClick={() => audioInputRef.current?.click()}
              className="bg-[#051839] rounded-xl p-4 text-white cursor-pointer hover:bg-[#08275E] transition-colors"
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2">
                <Music className="w-5 h-5" />
                <h3 className="font-medium text-sm">העלאת קובץ שמע</h3>
              </div>
              <p className="text-xs text-gray-300 text-center mt-1">להזמנה קולית</p>
              {audioFile && (
                <div className="mt-2 flex items-center justify-center gap-2 text-green-400 text-xs">
                  <Check className="w-4 h-4" />
                  <span>{audioFile.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeAudio(); }} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* העלאת אקסל */}
            <div 
              onClick={() => excelInputRef.current?.click()}
              className="bg-[#051839] rounded-xl p-4 text-white cursor-pointer hover:bg-[#08275E] transition-colors"
            >
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileChange}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-medium text-sm">העלאת רשימת מוזמנים</h3>
              </div>
              <p className="text-xs text-gray-300 text-center mt-1">קובץ אקסל</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            {/* טקסט למערכת קולית */}
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-[#051839] font-medium text-sm mb-2">טקסט להזמנה קולית</p>
              <Textarea
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="הזן את הטקסט להזמנה קולית..."
                className="rounded-lg border-gray-200 bg-white text-right min-h-[70px] text-sm"
              />
            </div>

            {/* הורדת קובץ דוגמה */}
            <div 
              onClick={downloadSampleExcel}
              className="bg-[#C41E3A] rounded-xl p-4 text-white flex items-center justify-center cursor-pointer hover:bg-[#C41E3A]/90 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="font-medium text-sm">הורדת קובץ דוגמה</span>
              </div>
            </div>
          </div>

          {/* מידע על מוזמנים */}
          {guests && guests.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center" dir="rtl">
              <p className="text-green-700 font-medium">
                נמצאו {guests.length} מוזמנים ברשימה
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4" dir="rtl">
            <button
              onClick={handlePrevStep}
              className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              לשלב הקודם
            </button>
            <button
              onClick={handleNextStep}
              className="bg-[#95742F] hover:bg-[#95742F]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors"
            >
              לשלב הבא
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: בחירת עיצוב */}
      {currentStep === 3 && (
        <div className="space-y-4">
          {/* Templates Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto p-1" dir="rtl">
            {templates.map((template, index) => {
              const TemplateComponent = template.Component;
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(index)}
                  className={`relative bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === index ? "ring-2 ring-[#95742F]" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center z-10 ${
                      selectedTemplate === index
                        ? "bg-[#95742F] border-[#95742F]"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {selectedTemplate === index && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  
                  {/* Template Preview - scaled down */}
                  <div className="relative overflow-hidden" style={{ height: "280px" }}>
                    <div 
                      ref={(el) => { templateRefs.current[index] = el; }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 scale-[0.5] origin-top"
                    >
                      <TemplateComponent data={templateData} />
                    </div>
                  </div>
                  
                  {/* Template Name */}
                  <div className="p-3 bg-white border-t">
                    <h3 className="font-medium text-[#051839] text-center text-sm">{template.name}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download & Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
            <button
              onClick={downloadInvitation}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5 text-[#051839]" />
              <span className="text-[#051839] font-medium text-sm">הורדת ההזמנה כתמונה</span>
            </button>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-5 h-5 text-[#051839]" />
              <span className="text-[#051839] font-medium text-sm">העלאת קובץ הזמנה מוכן</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4" dir="rtl">
            <button
              onClick={handlePrevStep}
              className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              לשלב הקודם
            </button>
            <button
              onClick={handleSendInvitations}
              className="bg-[#95742F] hover:bg-[#95742F]/90 text-white rounded-lg py-2 px-5 text-sm flex items-center gap-2 transition-colors"
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
