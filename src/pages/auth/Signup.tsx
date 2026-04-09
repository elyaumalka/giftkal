import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  UserPlus, Eye, EyeOff, ArrowRight, ArrowLeft, CreditCard, Send,
  Monitor, BarChart3, CheckCircle2, Loader2, Gift, Sparkles
} from "lucide-react";
import logo from "@/assets/logo.png";

/* ─── Plan items ─── */
const PLANS = [
  {
    id: "gifts",
    icon: CreditCard,
    title: "מתנות באשראי",
    desc: "קבלת מתנות באשראי, קישור אישי, צפייה בעסקאות וברכות",
    price: 199,
    required: true,
  },
  {
    id: "invitations",
    icon: Send,
    title: "הזמנות + אישורי הגעה",
    desc: "שליחה מרוכזת בוואטסאפ ובמייל, מעקב אישורים",
    price: 199,
    required: false,
  },
  {
    id: "device",
    icon: Monitor,
    title: "השכרת עמדת מתנות לאירוע",
    desc: "עמדת טאץ' באולם להגדלת כמות המתנות",
    price: 99,
    required: false,
    badge: "מומלץ",
  },
];

const FREE_PLAN = {
  id: "budget",
  icon: BarChart3,
  title: "ניהול תקציב",
  desc: "ניהול הוצאות, מעקב תקציב — ללא עלות",
  price: 0,
};

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  /* ─── Step management ─── */
  const [step, setStep] = useState(1); // 1=plans, 2=details, 3=payment, 4=success
  const [selected, setSelected] = useState<Record<string, boolean>>({ gifts: true });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const VALID_COUPONS: Record<string, number> = { "GIFTKAL-TEST": 100, "GIFTKAL100": 100 };

  const [data, setData] = useState({
    fullName: "", email: "", phone: "", password: "", idNumber: "",
    eventDate: "", eventType: "חתונה", city: "", venueName: "",
    groomName: "", brideName: "", agreeTerms: false,
  });

  /* ─── Nedarim state ─── */
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mosadId, setMosadId] = useState("");
  const [apiValid, setApiValid] = useState("");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const discountPercent = couponApplied ? (VALID_COUPONS[couponCode.toUpperCase()] || 0) : 0;
  const totalPrice = Math.max(0, Math.round(PLANS.filter(p => selected[p.id]).reduce((sum, p) => sum + p.price, 0) * (1 - discountPercent / 100)));

  /* ─── Toggle plan ─── */
  const togglePlan = (id: string) => {
    const plan = PLANS.find(p => p.id === id);
    if (plan?.required) return; // can't deselect required
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  /* ─── Step 2 validation ─── */
  const validateDetails = (): boolean => {
    if (!data.fullName.trim()) { toast({ title: "⚠️ שם חסר", variant: "destructive" }); return false; }
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { toast({ title: "⚠️ מייל לא תקין", variant: "destructive" }); return false; }
    if (!data.phone.trim() || !/^[\d\-+() ]{7,15}$/.test(data.phone.trim())) { toast({ title: "⚠️ טלפון לא תקין", variant: "destructive" }); return false; }
    if (!data.password || data.password.length < 6) { toast({ title: "⚠️ סיסמה חייבת להכיל לפחות 6 תווים", variant: "destructive" }); return false; }
    if (!data.eventDate) { toast({ title: "⚠️ תאריך אירוע חסר", variant: "destructive" }); return false; }
    if (!data.agreeTerms) { toast({ title: "⚠️ יש לאשר את תנאי השירות", variant: "destructive" }); return false; }
    return true;
  };

  /* ─── Fetch Nedarim config when entering step 3 ─── */
  useEffect(() => {
    if (step !== 3) return;
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

  /* ─── Listen for Nedarim PostMessage ─── */
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
        setTransactionId(txId);
        // Save lead + billing
        await saveLead(txId);
        setStep(4);
      }
    }
  }, [data, selected, totalPrice]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const handleIframeLoad = () => {
    setTimeout(() => setIframeLoaded(true), 3000);
  };

  /* ─── Submit payment ─── */
  const handlePay = () => {
    if (!data.fullName.trim()) { setPaymentError("נא למלא שם"); return; }
    if (totalPrice <= 0) { setPaymentError("נא לבחור מסלול"); return; }

    setPaymentError("");
    setProcessing(true);

    const sanitizedId = data.idNumber.replace(/\D/g, "").slice(0, 9);
    const planNames = PLANS.filter(p => selected[p.id]).map(p => p.title).join(" + ");

    const paymentData = {
      Name: "FinishTransaction2",
      Value: {
        Mosad: mosadId,
        ApiValid: apiValid,
        Zeout: sanitizedId,
        FirstName: data.fullName.split(" ")[0] || "",
        LastName: data.fullName.split(" ").slice(1).join(" ") || "",
        Street: "",
        City: data.city,
        Phone: data.phone,
        Mail: data.email,
        PaymentType: "Ragil",
        Amount: String(totalPrice),
        Tashlumim: "1",
        Day: "",
        Currency: "1",
        Groupe: "GiftKal",
        Comment: `הרשמה GiftKal - ${planNames} - ₪${totalPrice}`,
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

  /* ─── Create user + event after successful payment ─── */
  const saveLead = async (txId: string) => {
    try {
      const planNames = PLANS.filter(p => selected[p.id]).map(p => p.title).join(" + ");

      // 1. Create user + event via edge function
      const { data: result, error: fnError } = await supabase.functions.invoke("create-customer", {
        body: {
          type: "event",
          user: {
            email: data.email.trim(),
            password: data.password,
            fullName: data.fullName.trim(),
            phone: data.phone.trim(),
          },
          event: {
            eventType: data.eventType,
            eventDate: data.eventDate,
            groomName: data.groomName || null,
            brideName: data.brideName || null,
          },
        },
      });

      if (fnError || !result?.success) {
        console.error("Error creating user:", fnError || result?.error);
        toast({ title: "התשלום בוצע אך הייתה שגיאה ביצירת החשבון. ניצור קשר בהקדם.", variant: "destructive" });
      }

      const ownerId = result?.user?.id || "00000000-0000-0000-0000-000000000000";

      // 2. Save lead
      await supabase.from("leads").insert({
        full_name: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        lead_type: "couple",
        venue_name: data.venueName || null,
        venue_address: data.city || null,
        status: "paid",
      });

      // 3. Save billing record
      await supabase.from("billing_charges" as any).insert({
        owner_id: ownerId,
        owner_name: data.fullName.trim(),
        amount: totalPrice,
        plan_name: planNames,
        event_name: `${data.eventType} - ${data.eventDate}`,
        nedarim_transaction_id: txId,
      });
    } catch (e) {
      console.error("Error saving lead:", e);
    }
  };

  /* ─── Progress bar ─── */
  const steps = ["בחירת מסלול", "פרטים אישיים", "תשלום"];

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,_hsl(38_92%_50%_/_0.12),_transparent_70%)]" />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/">
            <img src={logo} alt="Giftkal" className="h-12 mx-auto mb-4" />
          </Link>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i + 1 < step ? "bg-primary text-primary-foreground" :
                  i + 1 === step ? "bg-gradient-gold text-white shadow-lg" :
                  "bg-white/10 text-white/40"
                }`}>
                  {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i + 1 === step ? "text-white font-medium" : "text-white/40"}`}>{s}</span>
                {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i + 1 < step ? "bg-primary" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">

          {/* ═══════ STEP 1: Plan Selection ═══════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">בחרו את המסלול שלכם</h1>
                <p className="text-white/50 text-sm mt-1">בחרו את השירותים שמתאימים לאירוע שלכם</p>
              </div>

              <div className="space-y-3">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => togglePlan(plan.id)}
                    className={`w-full text-right rounded-2xl p-4 border-2 transition-all duration-300 ${
                      selected[plan.id]
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    } ${plan.required ? "opacity-90" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selected[plan.id] ? "bg-primary/20" : "bg-white/10"
                      }`}>
                        <plan.icon className={`w-5 h-5 ${selected[plan.id] ? "text-primary" : "text-white/50"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">{plan.title}</h3>
                          {plan.badge && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{plan.badge}</span>}
                          {plan.required && <span className="text-xs text-primary/70">(חובה)</span>}
                        </div>
                        <p className="text-white/40 text-xs mt-0.5">{plan.desc}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="text-lg font-black text-white">₪{plan.price}</span>
                      </div>
                    </div>
                  </button>
                ))}

                {/* Free budget */}
                <div className="w-full text-right rounded-2xl p-4 border-2 border-green-500/20 bg-green-500/5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-green-500/10">
                      <FREE_PLAN.icon className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm">{FREE_PLAN.title}</h3>
                      <p className="text-white/40 text-xs mt-0.5">{FREE_PLAN.desc}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="text-lg font-black text-green-400">חינם</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="קוד קופון (אופציונלי)"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 flex-1"
                  disabled={couponApplied}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 h-11"
                  disabled={!couponCode.trim() || couponApplied}
                  onClick={() => {
                    if (VALID_COUPONS[couponCode.toUpperCase()]) {
                      setCouponApplied(true);
                      toast({ title: "קופון הופעל בהצלחה! ✅" });
                    } else {
                      toast({ title: "קופון לא תקין", variant: "destructive" });
                    }
                  }}
                >
                  {couponApplied ? "✅" : "הפעל"}
                </Button>
              </div>

              {/* Total */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">סה"כ לתשלום:</span>
                  <div className="flex items-center gap-2">
                    {couponApplied && (
                      <span className="text-white/40 line-through text-sm">₪{PLANS.filter(p => selected[p.id]).reduce((s, p) => s + p.price, 0)}</span>
                    )}
                    <span className="text-2xl font-black text-primary">{totalPrice === 0 ? "חינם! 🎉" : `₪${totalPrice}`}</span>
                  </div>
                </div>
                <p className="text-white/30 text-xs mt-1">תשלום חד פעמי • ללא התחייבות</p>
              </div>

              <Button onClick={() => setStep(2)} variant="gold" className="w-full h-12 text-lg">
                <ArrowLeft className="w-5 h-5 ml-2" />
                המשך לפרטים אישיים
              </Button>
            </div>
          )}

          {/* ═══════ STEP 2: Personal Details ═══════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold text-white">פרטים אישיים</h1>
                <p className="text-white/50 text-sm mt-1">מלאו את הפרטים לפתיחת האירוע</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">שם מלא *</Label>
                  <Input value={data.fullName} onChange={e => setData({...data, fullName: e.target.value})} placeholder="השם שלכם" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11" maxLength={100} />
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">טלפון *</Label>
                  <Input value={data.phone} onChange={e => setData({...data, phone: e.target.value})} placeholder="050-0000000" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11" maxLength={15} />
                </div>
              </div>

              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">כתובת מייל *</Label>
                <Input value={data.email} onChange={e => setData({...data, email: e.target.value})} placeholder="your@email.com" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11" maxLength={255} />
              </div>

              <div className="relative">
                <Label className="text-white/70 text-sm mb-1.5 block">בחרו סיסמה *</Label>
                <Input type={showPassword ? "text" : "password"} value={data.password} onChange={e => setData({...data, password: e.target.value})} placeholder="לפחות 6 תווים" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 pl-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-[34px] text-white/40 hover:text-white/70">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">סוג אירוע</Label>
                  <select value={data.eventType} onChange={e => setData({...data, eventType: e.target.value})} className="w-full h-11 rounded-xl bg-white/10 border border-white/20 text-white px-4 text-sm">
                    <option value="חתונה" className="text-black">חתונה</option>
                    <option value="בר מצווה" className="text-black">בר מצווה</option>
                    <option value="בת מצווה" className="text-black">בת מצווה</option>
                    <option value="ברית" className="text-black">ברית</option>
                    <option value="אחר" className="text-black">אחר</option>
                  </select>
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">תאריך אירוע *</Label>
                  <Input type="date" value={data.eventDate} onChange={e => setData({...data, eventDate: e.target.value})} className="bg-white/10 border-white/20 text-white h-11" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">עיר</Label>
                  <Input value={data.city} onChange={e => setData({...data, city: e.target.value})} placeholder="עיר האירוע" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11" />
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">שם אולם</Label>
                  <Input value={data.venueName} onChange={e => setData({...data, venueName: e.target.value})} placeholder="שם האולם" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11" />
                </div>
              </div>

              {data.eventType === "חתונה" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 text-sm mb-1.5 block">שם חתן</Label>
                    <Input value={data.groomName} onChange={e => setData({...data, groomName: e.target.value})} placeholder="שם החתן" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11" />
                  </div>
                  <div>
                    <Label className="text-white/70 text-sm mb-1.5 block">שם כלה</Label>
                    <Input value={data.brideName} onChange={e => setData({...data, brideName: e.target.value})} placeholder="שם הכלה" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11" />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">תעודת זהות (לצורך חשבונית)</Label>
                <Input value={data.idNumber} onChange={e => setData({...data, idNumber: e.target.value.replace(/\D/g, "").slice(0, 9)})} placeholder="123456789" inputMode="numeric" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11" />
              </div>

              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <Checkbox id="terms" checked={data.agreeTerms} onCheckedChange={(checked) => setData({...data, agreeTerms: !!checked})} className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5" />
                <Label htmlFor="terms" className="text-white/60 text-sm leading-relaxed cursor-pointer">
                  אני מאשר/ת את <span className="text-primary underline">תנאי השירות</span> ו<span className="text-primary underline">מדיניות הפרטיות</span> של Giftkal
                </Label>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
                  <ArrowRight className="w-4 h-4 ml-1" />
                  חזרה
                </Button>
                <Button onClick={async () => {
                  if (!validateDetails()) return;
                  if (totalPrice === 0) {
                    // Coupon covers everything - skip payment
                    await saveLead("COUPON-" + couponCode);
                    setStep(4);
                  } else {
                    setStep(3);
                  }
                }} variant="gold" className="flex-1 h-12 text-lg">
                  {totalPrice === 0 ? (
                    <><Sparkles className="w-5 h-5 ml-2" />סיום הרשמה</>
                  ) : (
                    <><CreditCard className="w-5 h-5 ml-2" />המשך לתשלום ₪{totalPrice}</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ STEP 3: Payment ═══════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold text-white">תשלום מאובטח</h1>
                <p className="text-white/50 text-sm mt-1">הזינו פרטי כרטיס אשראי</p>
              </div>

              {/* Summary */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                {PLANS.filter(p => selected[p.id]).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{p.title}</span>
                    <span className="text-white font-medium">₪{p.price}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 mt-2 flex items-center justify-between">
                  <span className="text-white font-bold">סה"כ</span>
                  <span className="text-xl font-black text-primary">₪{totalPrice}</span>
                </div>
              </div>

              {/* Nedarim iframe */}
              <div className="relative">
                {!iframeLoaded && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                    <span className="mr-2 text-sm text-white/40">מתחבר לשרת תשלומים מאובטח...</span>
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
                <p className="text-red-400 text-sm font-medium text-center">{paymentError}</p>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
                  <ArrowRight className="w-4 h-4 ml-1" />
                  חזרה
                </Button>
                <Button
                  onClick={handlePay}
                  disabled={processing || !iframeLoaded || !mosadId}
                  variant="gold"
                  className="flex-1 h-12 text-lg"
                >
                  {processing ? (
                    <><Loader2 className="w-5 h-5 animate-spin ml-2" /> מעבד תשלום...</>
                  ) : (
                    <>שלם ₪{totalPrice}</>
                  )}
                </Button>
              </div>

              <p className="text-center text-white/30 text-xs">🔒 התשלום מאובטח ומוצפן</p>
            </div>
          )}

          {/* ═══════ STEP 4: Success ═══════ */}
          {step === 4 && (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">התשלום בוצע בהצלחה! 🎉</h1>
                <p className="text-white/60">
                  שולם ₪{totalPrice} • {PLANS.filter(p => selected[p.id]).map(p => p.title).join(" + ")}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-right space-y-1">
                <p className="text-white/70 text-sm"><strong className="text-white">שם:</strong> {data.fullName}</p>
                <p className="text-white/70 text-sm"><strong className="text-white">מייל:</strong> {data.email}</p>
                <p className="text-white/70 text-sm"><strong className="text-white">אירוע:</strong> {data.eventType} — {data.eventDate}</p>
                {transactionId && <p className="text-white/40 text-xs">מזהה עסקה: {transactionId}</p>}
              </div>
              <p className="text-white/50 text-sm">החשבון שלכם נפתח בהצלחה! כעת תוכלו להתחבר עם המייל והסיסמה שהזנתם</p>
              <Link to="/login/event">
                <Button variant="gold" className="mt-2">
                  התחבר לחשבון שלי
                </Button>
              </Link>
            </div>
          )}
        </div>

        {step < 4 && (
          <div className="text-center mt-6">
            <Link to="/" className="text-white/40 hover:text-white/70 text-sm inline-flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              חזרה לדף הבית
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
