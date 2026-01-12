import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Gift, Heart, CreditCard, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const GIFT_AMOUNTS = [100, 200, 300, 500, 1000];

type Step = "amount" | "payment" | "blessing" | "success";

export default function GiftScreen() {
  const { eventId } = useParams();
  const [step, setStep] = useState<Step>("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [blessing, setBlessing] = useState("");
  const { toast } = useToast();

  // Fetch event details
  const { data: event, isLoading } = useQuery({
    queryKey: ["event-public", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          venues (name, address, logo_url, banner_url)
        `)
        .eq("id", eventId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const createTransaction = useMutation({
    mutationFn: async () => {
      const amount = selectedAmount || Number(customAmount);
      const { error } = await supabase.from("transactions").insert({
        event_id: eventId,
        venue_id: event?.venue_id,
        payer_name: payerName,
        payer_email: payerEmail,
        payer_phone: payerPhone,
        amount,
        relationship,
        blessing_text: blessing,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setStep("success");
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const finalAmount = selectedAmount || Number(customAmount);

  const handlePayment = () => {
    // In production, integrate with PayPlus/Meshulam
    // For now, simulate payment success
    setStep("blessing");
  };

  const handleSubmit = () => {
    createTransaction.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
          <p>טוען...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">האירוע לא נמצא</h1>
          <p className="text-muted-foreground">נא לבדוק את הקישור ולנסות שוב</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header with venue branding */}
      <div 
        className="relative h-48 bg-gradient-navy flex items-end justify-center pb-6"
        style={{
          backgroundImage: event.venues?.banner_url ? `url(${event.venues.banner_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative text-center text-white">
          {event.venues?.logo_url && (
            <img 
              src={event.venues.logo_url} 
              alt={event.venues.name} 
              className="w-16 h-16 rounded-xl mx-auto mb-3 bg-white p-1"
            />
          )}
          <h1 className="text-2xl font-bold">
            {event.groom_name} ❤️ {event.bride_name}
          </h1>
          <p className="text-white/80 mt-1">
            {new Date(event.event_date).toLocaleDateString("he-IL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 pb-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            {/* Step: Amount Selection */}
            {step === "amount" && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-xl font-bold">בחרו סכום מתנה</h2>
                  <p className="text-muted-foreground mt-1">כמה תרצו להעניק?</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {GIFT_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "gift-amount-btn",
                        selectedAmount === amount && "selected"
                      )}
                    >
                      ₪{amount}
                    </button>
                  ))}
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="סכום אחר..."
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      className="text-center text-lg font-medium"
                    />
                  </div>
                </div>

                <Button
                  variant="gold"
                  size="xl"
                  className="w-full"
                  disabled={!finalAmount || finalAmount <= 0}
                  onClick={() => setStep("payment")}
                >
                  המשך לתשלום
                  <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                </Button>
              </div>
            )}

            {/* Step: Payment */}
            {step === "payment" && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">פרטי תשלום</h2>
                  <p className="text-muted-foreground mt-1">
                    סכום לתשלום: <span className="font-bold text-primary">₪{finalAmount}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>שם מלא</Label>
                    <Input
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="ישראל ישראלי"
                      required
                    />
                  </div>
                  <div>
                    <Label>טלפון</Label>
                    <Input
                      type="tel"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      placeholder="050-1234567"
                    />
                  </div>
                  <div>
                    <Label>מייל (לקבלה)</Label>
                    <Input
                      type="email"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div>
                    <Label>קרבה</Label>
                    <Input
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      placeholder="חבר, דוד, עמית..."
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("amount")}
                    className="flex-1"
                  >
                    חזרה
                  </Button>
                  <Button
                    variant="gold"
                    onClick={handlePayment}
                    disabled={!payerName}
                    className="flex-1"
                  >
                    שלם ₪{finalAmount}
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Blessing */}
            {step === "blessing" && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">ברכה לזוג</h2>
                  <p className="text-muted-foreground mt-1">
                    כתבו ברכה חמה מהלב
                  </p>
                </div>

                <Textarea
                  value={blessing}
                  onChange={(e) => setBlessing(e.target.value)}
                  placeholder="מזל טוב! מאחלים לכם..."
                  rows={5}
                  className="text-lg"
                />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("payment")}
                    className="flex-1"
                  >
                    חזרה
                  </Button>
                  <Button
                    variant="gold"
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={createTransaction.isPending}
                  >
                    {createTransaction.isPending ? "שולח..." : "שלח ברכה"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {step === "success" && (
              <div className="space-y-6 animate-fade-in text-center py-8">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-success">תודה רבה!</h2>
                  <p className="text-muted-foreground mt-2">
                    המתנה והברכה נשלחו ל{event.groom_name} ו{event.bride_name}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground">סכום המתנה</p>
                  <p className="text-3xl font-bold text-primary">₪{finalAmount}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
