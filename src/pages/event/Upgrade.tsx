import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard, Send, Monitor, Loader2, CheckCircle2, Sparkles, ArrowRight, Lock
} from "lucide-react";

const PLANS = [
  {
    id: "gifts",
    icon: CreditCard,
    title: "מתנות באשראי",
    desc: "קבלת מתנות באשראי, קישור אישי, צפייה בעסקאות וברכות",
    price: 199,
    enableField: "gifts_enabled",
  },
  {
    id: "invitations",
    icon: Send,
    title: "הזמנות + אישורי הגעה",
    desc: "שליחה מרוכזת בוואטסאפ ובמייל, מעקב אישורים",
    price: 199,
    enableField: "invitations_enabled",
  },
  {
    id: "device",
    icon: Monitor,
    title: "השכרת עמדת מתנות לאירוע",
    desc: "עמדת טאץ' באולם להגדלת כמות המתנות",
    price: 99,
    enableField: null, // handled separately
    badge: "מומלץ",
  },
];

const Upgrade = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<"select" | "payment" | "success">("select");
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const VALID_COUPONS: Record<string, number> = { "GIFTKAL-TEST": 100, "GIFTKAL100": 100 };

  // Nedarim state
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mosadId, setMosadId] = useState("");
  const [apiValid, setApiValid] = useState("");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Get current event data
  const { data: eventData } = useQuery({
    queryKey: ["upgrade-event"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("events")
        .select("id, gifts_enabled, invitations_enabled, rsvp_enabled, owner_id, event_type, event_date, groom_name, bride_name")
        .eq("owner_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["upgrade-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  // Only show plans not already enabled
  const availablePlans = PLANS.filter(p => {
    if (p.id === "gifts" && eventData?.gifts_enabled) return false;
    if (p.id === "invitations" && eventData?.invitations_enabled) return false;
    return true;
  });

  const discountPercent = couponApplied ? (VALID_COUPONS[couponCode.toUpperCase()] || 0) : 0;
  const totalPrice = Math.max(0, Math.round(availablePlans.filter(p => selected[p.id]).reduce((sum, p) => sum + p.price, 0) * (1 - discountPercent / 100)));

  const togglePlan = (id: string) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch Nedarim config when entering payment step
  useEffect(() => {
    if (step !== "payment") return;
    setIframeLoaded(false);
    setIframeHeight(0);
    setProcessing(false);
    setPaymentError("");
    const fetchConfig = async () => {
      const { data: cfg, error } = await supabase.functions.invoke("get-nedarim-config");
      if (error || !cfg?.mosadId) {
        toast({ title: "שגיאה בטעינת מערכת התשלום", variant: "destructive" });
        return;
      }
      setMosadId(String(cfg.mosadId).trim());
      setApiValid(String(cfg.apiValid).trim());
    };
    fetchConfig();
  }, [step, toast]);

  // Listen for Nedarim PostMessage
  const handleMessage = useCallback(async (event: MessageEvent) => {
    const payload = event.data as { Name?: string; Value?: any };
    if (!payload || typeof payload !== "object" || !payload.Name) return;

    if (payload.Name === "Height") {
      const h = Number(payload.Value);
      if (Number.isFinite(h)) setIframeHeight(h + 15);
      setIframeLoaded(true);
    }

    if (payload.Name === "TransactionResponse") {
      setProcessing(false);
      if (payload.Value?.Status === "Error") {
        setPaymentError(payload.Value.Message || "שגיאה בביצוע התשלום");
      } else {
        const txId = payload.Value?.TransactionId || "";
        await handleUpgradeSuccess(txId);
        setStep("success");
      }
    }
  }, [eventData, selected, profile]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const handleIframeLoad = () => {
    setTimeout(() => setIframeLoaded(true), 3000);
  };

  // Submit payment
  const handlePay = () => {
    if (totalPrice <= 0) { setPaymentError("נא לבחור מסלול"); return; }
    setPaymentError("");
    setProcessing(true);

    const planNames = availablePlans.filter(p => selected[p.id]).map(p => p.title).join(" + ");

    const paymentData = {
      Name: "FinishTransaction2",
      Value: {
        Mosad: mosadId,
        ApiValid: apiValid,
        Zeout: "",
        FirstName: (profile?.full_name || "").split(" ")[0] || "",
        LastName: (profile?.full_name || "").split(" ").slice(1).join(" ") || "",
        Street: "",
        City: "",
        Phone: profile?.phone || "",
        Mail: profile?.email || "",
        PaymentType: "Ragil",
        Amount: String(totalPrice),
        Tashlumim: "1",
        Day: "",
        Currency: "1",
        Groupe: "GiftKal",
        Comment: `שדרוג GiftKal - ${planNames} - ₪${totalPrice}`,
        Param1: "",
        Param2: "",
        CallBack: "",
        Tokef: "",
        ForceUpdateMatching: "0",
        ThirdPartyReceipt: "0",
      },
    };

    iframeRef.current?.contentWindow?.postMessage(paymentData, "*");
  };

  // After successful payment, update event features
  const handleUpgradeSuccess = async (txId: string) => {
    if (!eventData?.id) return;

    try {
      const updates: Record<string, boolean> = {};
      if (selected["gifts"]) {
        updates.gifts_enabled = true;
      }
      if (selected["invitations"]) {
        updates.invitations_enabled = true;
        updates.rsvp_enabled = true;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("events")
          .update(updates)
          .eq("id", eventData.id);

        if (error) {
          console.error("Error upgrading event:", error);
          toast({ title: "שגיאה בעדכון השירותים", variant: "destructive" });
          return;
        }
      }

      // Save billing record
      const { data: { user } } = await supabase.auth.getUser();
      const planNames = availablePlans.filter(p => selected[p.id]).map(p => p.title).join(" + ");
      
      await supabase.from("billing_charges").insert({
        owner_id: user?.id || eventData.owner_id,
        owner_name: profile?.full_name || "",
        amount: totalPrice,
        plan_name: `שדרוג: ${planNames}`,
        event_id: eventData.id,
        event_name: `${eventData.event_type} - ${eventData.event_date}`,
        nedarim_transaction_id: txId,
      });

      // Invalidate queries so sidebar updates
      queryClient.invalidateQueries({ queryKey: ["event-features"] });
      queryClient.invalidateQueries({ queryKey: ["upgrade-event"] });
    } catch (e) {
      console.error("Upgrade error:", e);
    }
  };

  if (availablePlans.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16" dir="rtl">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">כל השירותים פעילים!</h1>
        <p className="text-muted-foreground mb-6">כל השירותים כבר מופעלים באירוע שלכם</p>
        <Button onClick={() => navigate("/event")} variant="outline">
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה לדשבורד
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8" dir="rtl">
      {step === "select" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C4A35A] to-[#E8D5A3] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">שדרגו את האירוע</h1>
            <p className="text-muted-foreground text-sm mt-1">בחרו את השירותים שתרצו להוסיף</p>
          </div>

          <div className="space-y-3">
            {availablePlans.map((plan) => {
              const isSelected = !!selected[plan.id];
              return (
                <button
                  key={plan.id}
                  onClick={() => togglePlan(plan.id)}
                  className={`w-full text-right rounded-2xl p-4 border-2 transition-all ${
                    isSelected
                      ? "border-[#C4A35A] bg-[#C4A35A]/10 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-[#C4A35A] text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      <plan.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">{plan.title}</h3>
                        {plan.badge && (
                          <span className="text-[10px] bg-[#C4A35A] text-white px-2 py-0.5 rounded-full">{plan.badge}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                    </div>
                    <span className="text-lg font-black text-[#C4A35A]">₪{plan.price}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Coupon */}
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              placeholder="קוד קופון"
              className="flex-1"
              disabled={couponApplied}
            />
            <Button
              variant="outline"
              disabled={couponApplied || !couponCode.trim()}
              onClick={() => {
                if (VALID_COUPONS[couponCode.toUpperCase()]) {
                  setCouponApplied(true);
                  toast({ title: "✅ קופון הופעל בהצלחה!" });
                } else {
                  toast({ title: "קופון לא תקין", variant: "destructive" });
                }
              }}
            >
              {couponApplied ? "✓ הופעל" : "הפעל"}
            </Button>
          </div>

          {couponApplied && (
            <div className="bg-green-50 text-green-700 rounded-xl p-3 border border-green-200 text-center text-sm font-medium">
              🎉 קופון {couponCode.toUpperCase()} — הנחה {discountPercent}%
            </div>
          )}

          {availablePlans.some(p => selected[p.id]) && (
            <div className="bg-gray-50 rounded-xl p-4 border text-center">
              <span className="text-muted-foreground text-sm">סה"כ לתשלום: </span>
              <span className="text-2xl font-black text-[#C4A35A]">₪{totalPrice}</span>
            </div>
          )}

          <Button
            onClick={async () => {
              if (!availablePlans.some(p => selected[p.id])) {
                toast({ title: "נא לבחור לפחות שירות אחד", variant: "destructive" });
                return;
              }
              if (totalPrice === 0) {
                // Free upgrade (coupon covers everything)
                setLoading(true);
                try {
                  await handleUpgradeSuccess("COUPON-" + couponCode.toUpperCase());
                  setStep("success");
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoading(false);
                }
              } else {
                setStep("payment");
              }
            }}
            className="w-full h-12 text-lg bg-[#C4A35A] hover:bg-[#B3923F] text-white"
            disabled={!availablePlans.some(p => selected[p.id]) || loading}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin ml-2" />משדרג...</>
            ) : totalPrice === 0 && availablePlans.some(p => selected[p.id]) ? (
              <><Sparkles className="w-5 h-5 ml-2" />שדרג חינם!</>
            ) : (
              <><CreditCard className="w-5 h-5 ml-2" />המשך לתשלום ₪{totalPrice}</>
            )}
          </Button>

          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            חזרה
          </Button>
        </div>
      )}

      {step === "payment" && (
        <div className="space-y-5">
          <div className="text-center">
            <h1 className="text-xl font-bold">תשלום מאובטח</h1>
            <p className="text-muted-foreground text-sm mt-1">הזינו פרטי כרטיס אשראי</p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 border space-y-2">
            {availablePlans.filter(p => selected[p.id]).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{p.title}</span>
                <span className="font-medium">₪{p.price}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex items-center justify-between">
              <span className="font-bold">סה"כ</span>
              <span className="text-xl font-black text-[#C4A35A]">₪{totalPrice}</span>
            </div>
          </div>

          {/* Nedarim iframe */}
          <div className="relative">
            {!iframeLoaded && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="mr-2 text-sm text-muted-foreground">מתחבר לשרת תשלומים מאובטח...</span>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src="https://matara.pro/nedarimplus/iframe?Language=he"
              style={{
                width: "100%",
                height: iframeHeight ? `${iframeHeight}px` : "320px",
                border: "none",
                borderRadius: "12px",
                transition: "height 0.3s",
                display: iframeLoaded ? "block" : "none",
              }}
              scrolling="no"
              onLoad={handleIframeLoad}
            />
          </div>

          {paymentError && (
            <p className="text-red-500 text-sm font-medium text-center">{paymentError}</p>
          )}

          <div className="flex gap-3">
            <Button onClick={() => setStep("select")} variant="ghost" className="text-muted-foreground">
              <ArrowRight className="w-4 h-4 ml-1" />
              חזרה
            </Button>
            <Button
              onClick={handlePay}
              disabled={processing || !iframeLoaded || !mosadId}
              className="flex-1 h-12 text-lg bg-[#C4A35A] hover:bg-[#B3923F] text-white"
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin ml-2" /> מעבד תשלום...</>
              ) : (
                <>שלם ₪{totalPrice}</>
              )}
            </Button>
          </div>

          <p className="text-center text-muted-foreground text-xs">🔒 התשלום מאובטח ומוצפן</p>
        </div>
      )}

      {step === "success" && (
        <div className="text-center py-8 space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">השדרוג בוצע בהצלחה! 🎉</h1>
            <p className="text-muted-foreground">
              {availablePlans.filter(p => selected[p.id]).map(p => p.title).join(" + ")} הופעלו באירוע שלכם
            </p>
          </div>
          <Button
            onClick={() => navigate("/event")}
            className="bg-[#C4A35A] hover:bg-[#B3923F] text-white"
          >
            לאיזור האישי
          </Button>
        </div>
      )}
    </div>
  );
};

export default Upgrade;
