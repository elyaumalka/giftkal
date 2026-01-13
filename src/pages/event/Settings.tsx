import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, AlertCircle, CheckCircle } from "lucide-react";

export default function EventSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["event-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["event-documents"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id);

      return data || [];
    },
  });

  const { data: requiredDocs } = useQuery({
    queryKey: ["required-docs-event"],
    queryFn: async () => {
      const { data } = await supabase
        .from("required_documents")
        .select("*")
        .eq("for_type", "event_owner");

      return data || [];
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          email,
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-profile"] });
      toast({ title: "הפרטים נשמרו בהצלחה" });
    },
  });

  const isDocUploaded = (docType: string) => {
    return documents?.some((d: any) => d.document_type === docType);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#051839]">הגדרות</h1>
        <p className="text-gray-500 mt-1">ניהול פרטים אישיים ומסמכים</p>
      </div>

      {/* Personal Details Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#051839] text-white p-4">
          <h2 className="text-lg font-semibold">פרטים אישיים</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">שם מלא</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="שם מלא"
                className="rounded-xl border-gray-200 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">טלפון</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="טלפון"
                className="rounded-xl border-gray-200 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">מייל</Label>
              <Input
                type="email"
                value={email}
                disabled
                className="rounded-xl border-gray-200 text-right bg-gray-50"
              />
            </div>
          </div>
          
          <button 
            onClick={() => updateProfile.mutate()}
            className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-xl py-3 px-6 flex items-center justify-center gap-2 transition-colors font-medium"
          >
            <span>שמירה</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bank Details Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#051839] text-white p-4">
          <h2 className="text-lg font-semibold">פרטי חשבון להעברה</h2>
          <p className="text-sm text-gray-300 mt-1">פרטי החשבון אליו יועברו הכספים</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">שם הבנק</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="לדוגמא: לאומי"
                className="rounded-xl border-gray-200 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">מספר סניף</Label>
              <Input
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                placeholder="מספר סניף"
                className="rounded-xl border-gray-200 text-right"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">מספר חשבון</Label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="מספר חשבון"
                className="rounded-xl border-gray-200 text-right"
              />
            </div>
          </div>
          
          <button 
            onClick={() => toast({ title: "פרטי הבנק נשמרו" })}
            className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-xl py-3 px-6 flex items-center justify-center gap-2 transition-colors font-medium"
          >
            <span>שמירה</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Required Documents Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#051839] text-white p-4">
          <h2 className="text-lg font-semibold">מסמכים נדרשים</h2>
          <p className="text-sm text-gray-300 mt-1">העלה את המסמכים הנדרשים להשלמת הרישום</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-3">
            {requiredDocs?.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-100 rounded-xl"
              >
                <button className="bg-[#051839] hover:bg-[#08275E] text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                  <Upload className="w-4 h-4" />
                  העלאה
                </button>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[#051839]">{doc.document_type}</span>
                  {isDocUploaded(doc.document_type) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
            {!requiredDocs?.length && (
              <p className="text-gray-500 text-center py-8">
                אין מסמכים נדרשים
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
