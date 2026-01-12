import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, AlertCircle, CheckCircle } from "lucide-react";

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
      <div>
        <h1 className="text-3xl font-bold">הגדרות</h1>
        <p className="text-muted-foreground mt-1">ניהול פרטים אישיים ומסמכים</p>
      </div>

      {/* Personal details */}
      <Card>
        <CardHeader>
          <CardTitle>פרטים אישיים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>שם מלא</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="שם מלא"
              />
            </div>
            <div>
              <Label>טלפון</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="טלפון"
              />
            </div>
            <div>
              <Label>מייל</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="מייל"
              />
            </div>
          </div>
          <Button onClick={() => updateProfile.mutate()}>
            <Save className="w-4 h-4 ml-2" />
            שמור
          </Button>
        </CardContent>
      </Card>

      {/* Bank details */}
      <Card>
        <CardHeader>
          <CardTitle>פרטי חשבון להעברה</CardTitle>
          <CardDescription>פרטי החשבון אליו יועברו הכספים</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>שם הבנק</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="לדוגמא: לאומי"
              />
            </div>
            <div>
              <Label>מספר סניף</Label>
              <Input
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                placeholder="מספר סניף"
              />
            </div>
            <div>
              <Label>מספר חשבון</Label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="מספר חשבון"
              />
            </div>
          </div>
          <Button onClick={() => toast({ title: "פרטי הבנק נשמרו" })}>
            <Save className="w-4 h-4 ml-2" />
            שמור
          </Button>
        </CardContent>
      </Card>

      {/* Required documents */}
      <Card>
        <CardHeader>
          <CardTitle>מסמכים נדרשים</CardTitle>
          <CardDescription>העלה את המסמכים הנדרשים להשלמת הרישום</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requiredDocs?.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {isDocUploaded(doc.document_type) ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-warning" />
                  )}
                  <span>{doc.document_type}</span>
                </div>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 ml-2" />
                  העלאה
                </Button>
              </div>
            ))}
            {!requiredDocs?.length && (
              <p className="text-muted-foreground text-center py-4">
                אין מסמכים נדרשים
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
