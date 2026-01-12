import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Send, Check } from "lucide-react";

export default function EventInvitations() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Step 2 state
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [groomParents, setGroomParents] = useState("");
  const [brideParents, setBrideParents] = useState("");
  const [groomGrandparents, setGroomGrandparents] = useState("");
  const [brideGrandparents, setBrideGrandparents] = useState("");
  const [invitationText, setInvitationText] = useState("");

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
        setInvitationText(data.invitation_text || "");
      }

      return data;
    },
  });

  const saveDetails = useMutation({
    mutationFn: async () => {
      if (!event?.id) throw new Error("No event found");

      const { error } = await supabase
        .from("events")
        .update({
          groom_name: groomName,
          bride_name: brideName,
          groom_parents: groomParents,
          bride_parents: brideParents,
          groom_grandparents: groomGrandparents,
          bride_grandparents: brideGrandparents,
          invitation_text: invitationText,
        })
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-invitations"] });
      toast({ title: "הפרטים נשמרו בהצלחה" });
      setStep(3);
    },
  });

  const downloadSample = () => {
    toast({
      title: "מוריד קובץ דוגמא",
      description: "הקובץ יורד...",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">הזמנות</h1>
        <p className="text-muted-foreground mt-1">יצירה ושליחת הזמנות לאורחים</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-1 rounded ${
                  step > s ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload guests */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>שלב 1: העלאת רשימת מוזמנים</CardTitle>
            <CardDescription>העלה קובץ אקסל עם רשימת המוזמנים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">גרור קובץ אקסל לכאן או לחץ לבחירת קובץ</p>
              <Button variant="outline">
                <Upload className="w-4 h-4 ml-2" />
                בחר קובץ
              </Button>
            </div>
            <Button variant="ghost" onClick={downloadSample}>
              <Download className="w-4 h-4 ml-2" />
              הורד קובץ דוגמא
            </Button>
            <div className="flex justify-end">
              <Button variant="gold" onClick={() => setStep(2)}>
                המשך לשלב הבא
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Enter details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>שלב 2: פרטי האירוע</CardTitle>
            <CardDescription>הזן את פרטי החתן והכלה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם החתן</Label>
                <Input
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="שם החתן"
                />
              </div>
              <div>
                <Label>שם הכלה</Label>
                <Input
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="שם הכלה"
                />
              </div>
              <div>
                <Label>הורי החתן</Label>
                <Input
                  value={groomParents}
                  onChange={(e) => setGroomParents(e.target.value)}
                  placeholder="שמות הורי החתן"
                />
              </div>
              <div>
                <Label>הורי הכלה</Label>
                <Input
                  value={brideParents}
                  onChange={(e) => setBrideParents(e.target.value)}
                  placeholder="שמות הורי הכלה"
                />
              </div>
              <div>
                <Label>סבא וסבתא החתן</Label>
                <Input
                  value={groomGrandparents}
                  onChange={(e) => setGroomGrandparents(e.target.value)}
                  placeholder="שמות סבא וסבתא החתן"
                />
              </div>
              <div>
                <Label>סבא וסבתא הכלה</Label>
                <Input
                  value={brideGrandparents}
                  onChange={(e) => setBrideGrandparents(e.target.value)}
                  placeholder="שמות סבא וסבתא הכלה"
                />
              </div>
            </div>
            <div>
              <Label>טקסט מקדים להזמנה</Label>
              <Textarea
                value={invitationText}
                onChange={(e) => setInvitationText(e.target.value)}
                placeholder="טקסט שיופיע בהזמנה..."
                rows={4}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                חזרה
              </Button>
              <Button variant="gold" onClick={() => saveDetails.mutate()}>
                שמור והמשך
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Design and send */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>שלב 3: עיצוב ושליחה</CardTitle>
            <CardDescription>בחר עיצוב להזמנה ושלח לאורחים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((design) => (
                <div
                  key={design}
                  className="border-2 border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="aspect-[3/4] bg-muted rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-muted-foreground">עיצוב {design}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">או העלה עיצוב משלך</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                חזרה
              </Button>
              <Button
                variant="gold"
                onClick={() => toast({ title: "ההזמנות נשלחו!", description: "כל האורחים יקבלו את ההזמנה" })}
              >
                <Send className="w-4 h-4 ml-2" />
                שלח הזמנות
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
