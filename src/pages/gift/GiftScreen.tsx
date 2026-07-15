import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Gift, Heart, CreditCard, Check, ArrowLeft, ArrowRight, Sparkles, Loader2, X, Home, Video, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import logoAsset from "@/assets/logo.png.asset.json";
import PayMeIframe from "@/components/payment/PayMeIframe";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeBreakdown, formatILS, type FeeMode } from "@/lib/fees";

const RELATIONSHIP_OPTIONS = [
  "אח/אחות",
  "הורה",
  "דוד/דודה",
  "סבא/סבתא",
  "בן/בת דוד",
  "חבר/ה",
  "שכן/ה",
  "עמית/ה לעבודה",
  "משפחה רחוקה",
  "אחר",
];

const GIFT_AMOUNTS = [100, 200, 300, 500, 1000];

type Step = "amount" | "details" | "blessing" | "card-payment" | "processing" | "success" | "failed";

const BLESSING_DESIGNS = [
  { id: 1, name: "קלאסי זהב", bg: "from-[#FDF8E8] to-[#F5EDD6]", border: "border-[#C4A35A]", text: "text-[#5A4A2A]" },
  { id: 2, name: "רומנטי ורוד", bg: "from-[#FFF5F5] to-[#FDE8E8]", border: "border-[#E8B4BC]", text: "text-[#8B4B5B]" },
  { id: 3, name: "מודרני כחול", bg: "from-[#F0F4F8] to-[#E0E8F0]", border: "border-[#051839]", text: "text-[#051839]" },
  { id: 4, name: "אלגנטי ירוק", bg: "from-[#F0F5F0] to-[#E8F0E8]", border: "border-[#4A7C59]", text: "text-[#2D4A32]" },
];

/* ── floating sparkle particles ── */
function SparkleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            background: `hsl(${38 + Math.random() * 10}, 92%, ${55 + Math.random() * 20}%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `sparkleFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.4 + Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
}

export default function GiftScreen() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [selectedSide, setSelectedSide] = useState("");
  const [blessing, setBlessing] = useState("");
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  /**
   * Gross-up mode:
   *   - "gift"  → the input amount is what the couple receives. We add fees on top.
   *   - "total" → the input amount is what's charged on the card. Couple receives less.
   * UX: default "gift" (most guests think in terms of "how much should they get").
   */
  const [feeMode, setFeeMode] = useState<FeeMode>("gift");
  const [selectedDesign, setSelectedDesign] = useState(BLESSING_DESIGNS[0]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [blessingImageUrl, setBlessingImageUrl] = useState<string | null>(null);
  const [blessingVideoFile, setBlessingVideoFile] = useState<File | null>(null);
  const [blessingVideoUrl, setBlessingVideoUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [paymeApiKey, setPaymeApiKey] = useState<string | null>(null);
  const [paymeTestMode, setPaymeTestMode] = useState(true);
  const [paymeSaleUrl, setPaymeSaleUrl] = useState<string | null>(null);
  const [sellerApproved, setSellerApproved] = useState<boolean | null>(null);
  const [paymeLoading, setPaymeLoading] = useState(true);
  const [partnerConfig, setPartnerConfig] = useState<{ partnerId: string | null; partnerPct: number; platformPct: number }>({ partnerId: null, partnerPct: 0, platformPct: 0 });
  const { toast } = useToast();
  const blessingCardRef = useRef<HTMLDivElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Check if returning from PayMe payment
  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status');
    const transactionId = searchParams.get('transaction_id');
    if (paymentStatus === 'success' && transactionId) setStep('success');
    else if (paymentStatus === 'failed') { setPaymentError('התשלום נכשל. אנא נסו שוב.'); setStep('failed'); }
  }, [searchParams]);

  // Fetch PayMe API key for this specific event
  useEffect(() => {
    if (!eventId) return;
    const fetchPaymeKey = async () => {
      setPaymeLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-payme-key', {
          body: { eventId },
        });
        if (!error && data) {
          setSellerApproved(data.sellerApproved ?? false);
          setPartnerConfig({
            partnerId: data.partnerId ?? null,
            partnerPct: Number(data.partnerCommissionPct) || 0,
            platformPct: Number(data.platformPartnerPct) || 0,
          });
          if (data.clientKey) {
            setPaymeApiKey(data.clientKey);
            setPaymeTestMode(data.testMode ?? true);
          }
        } else {
          setSellerApproved(false);
        }
      } catch (e) {
        console.error('Failed to fetch PayMe key:', e);
        setSellerApproved(false);
      } finally {
        setPaymeLoading(false);
      }
    };
    fetchPaymeKey();
  }, [eventId]);

  const { data: event, isLoading } = useQuery<any>({
    queryKey: ["event-public", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      if (data?.venue_id) {
        const { data: venue } = await supabase
          .from("venues")
          .select("name, address, logo_url, banner_url, phone, email")
          .eq("id", data.venue_id)
          .maybeSingle();
        return { ...data, venues: venue };
      }
      return { ...data, venues: null };
    },
    enabled: !!eventId,
  });

  // Save blessing card as image
  const saveBlessingAsImage = async (): Promise<string | null> => {
    if (!blessingCardRef.current) return null;
    try {
      const canvas = await html2canvas(blessingCardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      const blob = await new Promise<Blob | null>((resolve) => { canvas.toBlob((b) => resolve(b), "image/png", 0.95); });
      if (!blob) return null;
      const safePayerName = payerName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 50) || 'guest';
      const fileName = `blessings/${eventId}/${Date.now()}-${safePayerName}.png`;
      const { data, error } = await supabase.storage.from("documents").upload(fileName, blob, { contentType: "image/png", upsert: false });
      if (error) { console.error("Error uploading blessing image:", error); return null; }
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error) { console.error("Error saving blessing card:", error); return null; }
  };

  // Upload video blessing
  const handleVideoUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "⚠️ קובץ גדול מדי", description: "גודל מקסימלי 50MB", variant: "destructive" });
      return;
    }
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "⚠️ פורמט לא נתמך", description: "נא להעלות קובץ וידאו (MP4, MOV, WebM)", variant: "destructive" });
      return;
    }
    setUploadingVideo(true);
    setBlessingVideoFile(file);
    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const safePayerName = payerName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 50) || 'guest';
      const fileName = `blessing-videos/${eventId}/${Date.now()}-${safePayerName}.${ext}`;
      const { error } = await supabase.storage.from("documents").upload(fileName, file, { contentType: file.type, upsert: false });
      if (error) { console.error("Error uploading video:", error); toast({ title: "שגיאה בהעלאה", variant: "destructive" }); setUploadingVideo(false); return; }
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
      setBlessingVideoUrl(urlData.publicUrl);
      toast({ title: "✅ הסרטון הועלה בהצלחה" });
    } catch (err) { console.error("Video upload error:", err); toast({ title: "שגיאה בהעלאת הסרטון", variant: "destructive" }); }
    setUploadingVideo(false);
  };

  /**
   * Whatever the guest typed. Interpreted as either the gift-to-couple amount or the
   * total-to-charge depending on `feeMode`.
   */
  const rawInputAmount = selectedAmount ?? Number(customAmount);

  /**
   * Authoritative fee math used by both the displayed breakdown and the actual
   * PayMe charge. The card is debited `breakdown.totalCharge`; the couple
   * eventually receives `breakdown.giftAmount`.
   */
  const breakdown = computeBreakdown(rawInputAmount || 0, feeMode, selectedInstallments, {
    paymePct: 0.9,
    platformPct: 1.1,
    primeRate: 6.0,
    installmentSurchargeBase: 4.4,
    partnerCommissionPct: partnerConfig.partnerPct,
    platformPartnerPct: partnerConfig.platformPct,
  });

  const chargeToken = useMutation({
    mutationFn: async (token: string) => {
      const response = await supabase.functions.invoke('payme-charge-token', {
        body: {
          token,
          eventId,
          // What the card is actually charged. PayMe must see the gross-up total.
          amount: breakdown.totalCharge,
          // For our own records: what the couple receives, and the fee math.
          giftAmount: breakdown.giftAmount,
          feeAmount: breakdown.feeAmount,
          payerName,
          payerEmail: payerEmail || undefined,
          payerPhone: payerPhone || undefined,
          relationship: relationship || undefined,
          blessing: blessing || undefined,
          blessingImageUrl: blessingImageUrl || undefined,
          blessingVideoUrl: blessingVideoUrl || undefined,
          installments: selectedInstallments,
        },
      });
      if (response.error) throw new Error(response.error.message || 'שגיאה בביצוע התשלום');
      if (!response.data?.success) throw new Error(response.data?.error || 'שגיאה בביצוע התשלום');
      return response.data;
    },
    onSuccess: () => setStep("success"),
    onError: (error: Error) => { setPaymentError(error.message); setStep("failed"); toast({ title: "שגיאה", description: error.message, variant: "destructive" }); },
  });

  // Remove createTransaction without PayMe - all gifts MUST go through PayMe
  // No more fake/test transactions without real payment

  // Legacy alias retained for places that still read `finalAmount` directly.
  const finalAmount = rawInputAmount;

  const validateEmail = (email: string): boolean => { if (!email) return true; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); };
  const validatePhone = (phone: string): boolean => { if (!phone) return true; return /^[\d\-\+\(\)\s]{7,15}$/.test(phone); };

  const handleProceedToDetails = () => {
    if (!finalAmount || finalAmount <= 0) { toast({ title: "⚠️ סכום לא תקין", description: "יש לבחור סכום מתנה או להזין סכום גדול מ-0", variant: "destructive" }); return; }
    if (finalAmount < 10) { toast({ title: "⚠️ סכום מינימלי", description: "סכום המתנה המינימלי הוא ₪10", variant: "destructive" }); return; }
    if (finalAmount > 100000) { toast({ title: "⚠️ סכום חריג", description: "סכום המתנה המקסימלי הוא ₪100,000", variant: "destructive" }); return; }
    setStep("details");
  };

  const handleProceedToBlessing = () => {
    if (!payerName.trim()) { toast({ title: "⚠️ שם חסר", description: "יש להזין שם מלא כדי להמשיך", variant: "destructive" }); return; }
    if (payerName.trim().length < 2) { toast({ title: "⚠️ שם קצר מדי", description: "יש להזין שם מלא (לפחות 2 תווים)", variant: "destructive" }); return; }
    if (payerEmail && !validateEmail(payerEmail)) { toast({ title: "⚠️ כתובת מייל לא תקינה", description: "יש להזין כתובת מייל תקינה", variant: "destructive" }); return; }
    if (payerPhone && !validatePhone(payerPhone)) { toast({ title: "⚠️ מספר טלפון לא תקין", description: "יש להזין מספר טלפון תקין", variant: "destructive" }); return; }
    setStep("blessing");
  };

  const handleProceedToPayment = async () => {
    setStep("processing");
    const imageUrl = await saveBlessingAsImage();
    setBlessingImageUrl(imageUrl);

    if (!event?.seller_payme_id) {
      toast({ title: "שגיאה", description: "מערכת התשלום לא זמינה כרגע", variant: "destructive" });
      setStep("blessing");
      return;
    }

    if (paymeApiKey) {
      setStep("card-payment");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('payme-generate-link', {
        body: {
          eventId,
          // Charge the gross-up total. Couple gets `giftAmount` after wallet sweep.
          amount: breakdown.totalCharge,
          giftAmount: breakdown.giftAmount,
          feeAmount: breakdown.feeAmount,
          payerName,
          payerEmail: payerEmail || undefined,
          payerPhone: payerPhone || undefined,
          relationship: relationship || undefined,
          blessing: blessing || undefined,
          blessingImageUrl: imageUrl || undefined,
          blessingVideoUrl: blessingVideoUrl || undefined,
          installments: selectedInstallments,
        },
      });

      if (error) throw new Error(error.message || 'שגיאה ביצירת קישור תשלום');
      if (!data?.success || !data?.saleUrl) throw new Error(data?.error || 'שגיאה ביצירת קישור תשלום');

      // Embed PayMe checkout in an iframe instead of redirecting
      setPaymeSaleUrl(data.saleUrl);
      setStep("card-payment");
    } catch (err: any) {
      const message = err?.message || "מערכת התשלום לא זמינה כרגע";
      setPaymentError(message);
      toast({ title: "שגיאה", description: message, variant: "destructive" });
      setStep("blessing");
    }
  };

  const handleTokenize = (token: string) => { setStep("processing"); chargeToken.mutate(token); };
  const handlePaymentError = (error: string) => { setPaymentError(error); };

  const bannerUrl = (event?.venues as any)?.banner_url || "/landing/hero-banquet.png";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#051839]">
        <Loader2 className="w-10 h-10 animate-spin text-[#C4A35A]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#051839]" dir="rtl">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center"><span className="text-4xl">😕</span></div>
        <h1 className="text-2xl font-bold text-white">האירוע לא נמצא</h1>
        <p className="text-white/50">נא לבדוק את הקישור ולנסות שוב</p>
      </div>
    );
  }

  // Block gifts if no active payment account
  if (!event.seller_payme_id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#051839]" dir="rtl">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center"><span className="text-4xl">🔒</span></div>
        <h1 className="text-2xl font-bold text-white">שירות המתנות אינו פעיל</h1>
        <p className="text-white/50 text-center max-w-sm">שירות המתנות באשראי לא הופעל עדיין לאירוע זה</p>
      </div>
    );
  }

  // Wait for PayMe seller approval check
  if (paymeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#051839]">
        <Loader2 className="w-10 h-10 animate-spin text-[#C4A35A]" />
      </div>
    );
  }

  // Block gifts if seller is not yet approved by PayMe
  if (sellerApproved === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#051839] px-6" dir="rtl">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center"><span className="text-4xl">⏳</span></div>
        <h1 className="text-2xl font-bold text-white text-center">שירות המתנות יופעל בקרוב</h1>
        <p className="text-white/60 text-center max-w-sm leading-relaxed">
          חשבון הסליקה של בעל האירוע נמצא בתהליך אישור סופי מול חברת הסליקה.
          <br />
          ברגע שהאישור יושלם, ניתן יהיה להעניק מתנה באשראי.
        </p>
        <p className="text-white/40 text-xs text-center mt-2">נסו שוב בעוד מספר שעות</p>
      </div>
    );
  }

  // Web: no date restriction — gifts are always allowed via the website.
  // (Kiosk keeps its own same-day restriction in KioskPage.)

  const eventDate = new Date(event.event_date + 'T00:00:00');
  const formattedDate = eventDate.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const stepTitles: Record<string, string> = {
    amount: "בחרו סכום מתנה",
    details: "פרטי השולח",
    blessing: "כתבו ברכה",
    "card-payment": "תשלום מאובטח",
    processing: "מעבד...",
    success: "תודה רבה!",
    failed: "התשלום נכשל",
  };

  const stepNumber = step === "amount" ? 1 : step === "details" ? 2 : step === "blessing" ? 3 : step === "card-payment" ? 4 : 0;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" dir="rtl">
      {/* ── Immersive Background ── */}
      <div className="absolute inset-0 z-0">
        <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, rgba(5,24,57,0.4) 0%, rgba(5,24,57,0.85) 25%, rgba(5,24,57,0.97) 50%, rgba(5,24,57,1) 70%)"
        }} />
      </div>

      <SparkleField />

      {/* ── Top Bar ── */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-5 pb-2">
        <button
          onClick={() => navigate(`/gift/${eventId}`)}
          className="bg-white/10 backdrop-blur-sm rounded-full p-2.5 hover:bg-white/20 transition-colors border border-white/10"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-3">
          {(event.venues as any)?.logo_url && (
            <img src={(event.venues as any).logo_url} alt="" className="w-9 h-9 rounded-full border border-[#C4A35A]/40 object-cover" />
          )}
          <img src={logoAsset.url} alt="Giftkal" className="h-6 w-auto brightness-0 invert opacity-60" />
        </div>
      </div>

      {/* ── Event Header (compact) ── */}
      <div className="relative z-20 text-center px-4 pb-4">
        <p className="text-[#C4A35A]/70 text-xs font-medium tracking-widest uppercase">{event.event_type}</p>
        <h1 className="text-2xl font-extrabold mt-1" style={{
          background: "linear-gradient(135deg, #C4A35A 0%, #E8D5A3 50%, #C4A35A 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {event.groom_name} {event.bride_name ? `& ${event.bride_name}` : event.child_name || event.family_name || ""}
        </h1>
        <p className="text-white/40 text-xs mt-1">{formattedDate}</p>
      </div>

      {/* ── Step Progress ── */}
      {stepNumber > 0 && (
        <div className="relative z-20 px-6 pb-4">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: s < stepNumber ? "100%" : s === stepNumber ? "50%" : "0%",
                    background: s <= stepNumber ? "linear-gradient(90deg, #C4A35A, #E8D5A3)" : "transparent",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Card ── */}
      <div className="relative z-20 flex-1 flex flex-col px-4 pb-6">
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex-1 flex flex-col">

          {/* Step: Amount */}
          {step === "amount" && (
            <div className="p-6 space-y-5 animate-fade-in flex-1 flex flex-col">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C4A35A] to-[#E8D5A3] flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">בחרו סכום מתנה</h2>
                <p className="text-white/40 mt-1 text-sm">כמה תרצו להעניק?</p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {GIFT_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                    className={cn(
                      "relative py-4 px-3 rounded-xl font-bold text-lg transition-all duration-300 border",
                      selectedAmount === amount
                        ? "bg-gradient-to-br from-[#C4A35A] to-[#E8D5A3] text-white border-[#C4A35A] shadow-lg shadow-[#C4A35A]/20 scale-105"
                        : "bg-white/5 border-white/15 text-white/80 hover:border-[#C4A35A]/50 hover:bg-white/10"
                    )}
                  >
                    ₪{amount}
                    {selectedAmount === amount && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#C41E3A] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">או סכום אחר</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="relative">
                <Input
                  type="number"
                  placeholder="הזינו סכום..."
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  className="text-center text-xl font-bold h-14 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C4A35A] pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C4A35A] font-bold text-xl">₪</span>
              </div>

              {/* Fee mode toggle: gift-to-couple vs total-on-card */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFeeMode("gift")}
                  className={cn(
                    "px-3 py-1.5 rounded-full border transition-all",
                    feeMode === "gift"
                      ? "bg-[#C4A35A]/15 border-[#C4A35A]/60 text-[#E8D5A3]"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white/70",
                  )}
                >
                  הסכום שייכנס לזוג
                </button>
                <button
                  type="button"
                  onClick={() => setFeeMode("total")}
                  className={cn(
                    "px-3 py-1.5 rounded-full border transition-all",
                    feeMode === "total"
                      ? "bg-[#C4A35A]/15 border-[#C4A35A]/60 text-[#E8D5A3]"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white/70",
                  )}
                >
                  הסכום שיחויב מהכרטיס
                </button>
              </div>

              {/* Gross-up breakdown — only when we have a real input */}
              {rawInputAmount > 0 && (
                <div className="bg-white/5 border border-[#C4A35A]/20 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-white/70">
                    <span>הזוג מקבל</span>
                    <span className="font-bold text-white">{formatILS(breakdown.giftAmount)}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>עמלת סליקה{selectedInstallments > 1 ? " (כולל תשלומים)" : ""}</span>
                    <span>{formatILS(breakdown.feeAmount)}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between text-base">
                    <span className="text-white/80 font-medium">סה"כ לחיוב בכרטיס</span>
                    <span className="font-bold text-[#C4A35A]">{formatILS(breakdown.totalCharge)}</span>
                  </div>
                </div>
              )}

              <div className="flex-1" />

              <button
                onClick={handleProceedToDetails}
                className="w-full relative overflow-hidden group py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 shadow-2xl active:scale-[0.97] transition-transform"
                style={{ background: "linear-gradient(135deg, #C41E3A 0%, #E8344E 50%, #C41E3A 100%)", boxShadow: "0 8px 32px rgba(196,30,58,0.35)" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10">המשך</span>
                <ArrowLeft className="w-5 h-5 relative z-10" />
              </button>
            </div>
          )}

          {/* Step: Details */}
          {step === "details" && (
            <div className="p-6 space-y-5 animate-fade-in flex-1 flex flex-col">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#051839] to-[#1a3a6c] flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/10">
                  <Heart className="w-7 h-7 text-[#C4A35A]" />
                </div>
                <h2 className="text-2xl font-bold text-white">פרטי השולח</h2>
                <div className="inline-block bg-[#C4A35A]/10 px-4 py-1.5 rounded-full mt-2 border border-[#C4A35A]/20">
                  <span className="text-white/50 text-sm">מתנה לזוג: </span>
                  <span className="font-bold text-[#C4A35A] text-lg">{formatILS(breakdown.giftAmount)}</span>
                  <span className="text-white/40 text-xs"> · לחיוב {formatILS(breakdown.totalCharge)}</span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <Label className="text-white/70 font-medium text-sm">שם מלא *</Label>
                  <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="ישראל ישראלי"
                    className="mt-1 h-12 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C4A35A]" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 font-medium text-sm">טלפון</Label>
                    <Input type="tel" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder="050-1234567"
                      className="mt-1 h-12 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C4A35A]" />
                  </div>
                  <div>
                    <Label className="text-white/70 font-medium text-sm">מייל (לקבלה)</Label>
                    <Input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="example@email.com"
                      className="mt-1 h-12 rounded-xl bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-[#C4A35A]" />
                  </div>
                </div>

                {/* Side Selection - large buttons */}
                {(event.event_type === "חתונה" || event.event_type === "אירוסין") && (
                  <div>
                    <Label className="text-white/70 font-medium text-sm mb-2 block">מצד מי אתם?</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "groom", label: `צד ${event.groom_name || "החתן"}` },
                        { value: "bride", label: `צד ${event.bride_name || "הכלה"}` },
                        { value: "both", label: "שניהם" },
                      ].map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setSelectedSide(opt.value)}
                          className={cn(
                            "py-3.5 px-2 rounded-xl font-bold text-sm transition-all duration-200 border text-center",
                            selectedSide === opt.value
                              ? "bg-gradient-to-br from-[#C4A35A] to-[#E8D5A3] text-white border-[#C4A35A] shadow-md"
                              : "bg-white/5 border-white/15 text-white/60 hover:border-[#C4A35A]/50"
                          )}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relationship - optional */}
                <div>
                  <Label className="text-white/70 font-medium text-sm">קרבה (אופציונלי)</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger className="mt-1 h-12 rounded-xl bg-white/5 border-white/15 text-white focus:border-[#C4A35A] [&>span]:text-white/25 data-[state=open]:border-[#C4A35A]">
                      <SelectValue placeholder="בחרו קרבה..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a2040] border-white/15 text-white max-h-[300px]">
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="focus:bg-white/10 focus:text-white text-base py-3">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white/70 font-medium text-sm">מספר תשלומים</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button key={num} type="button" onClick={() => setSelectedInstallments(num)}
                        className={cn(
                          "py-3 rounded-xl font-bold text-lg transition-all duration-200 border",
                          selectedInstallments === num
                            ? "bg-gradient-to-br from-[#C4A35A] to-[#E8D5A3] text-white border-[#C4A35A] shadow-md"
                            : "bg-white/5 border-white/15 text-white/60 hover:border-[#C4A35A]/50"
                        )}>
                        {num}
                      </button>
                    ))}
                  </div>
                  {selectedInstallments > 1 && (
                    <p className="text-sm text-white/40 mt-2 text-center">
                      {selectedInstallments} תשלומים של {formatILS(breakdown.totalCharge / selectedInstallments)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1" />

              <div className="flex gap-3">
                <button onClick={() => setStep("amount")}
                  className="flex-1 h-12 rounded-xl border border-white/15 text-white/60 font-medium hover:bg-white/5 transition-colors">
                  חזרה
                </button>
                <button onClick={handleProceedToBlessing}
                  className="flex-1 h-12 rounded-xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #C41E3A 0%, #E8344E 50%, #C41E3A 100%)" }}>
                  המשך לברכה
                </button>
              </div>
            </div>
          )}

          {/* Step: Blessing Card */}
          {step === "blessing" && (
            <div className="p-6 space-y-5 animate-fade-in flex-1 flex flex-col">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8B4BC] to-[#D4A5AD] flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">כתבו ברכה</h2>
                <p className="text-white/40 mt-1 text-sm">כתבו ברכה או העלו סרטון ברכה</p>
              </div>

              {/* Design Selection */}
              <div className="flex justify-center gap-2">
                {BLESSING_DESIGNS.map((design) => (
                  <button key={design.id} onClick={() => setSelectedDesign(design)}
                    className={cn(
                      "w-10 h-10 rounded-xl border-2 bg-gradient-to-br transition-all", design.bg,
                      selectedDesign.id === design.id ? "border-[#C4A35A] ring-2 ring-[#C4A35A]/30 scale-110" : "border-white/20"
                    )} title={design.name} />
                ))}
              </div>

              {/* Blessing Card Preview */}
              <div ref={blessingCardRef}
                className={cn("relative p-6 rounded-2xl border-2 bg-gradient-to-br min-h-[280px] flex flex-col", selectedDesign.bg, selectedDesign.border)}>
                <div className="text-center mb-3">
                  <p className={cn("text-sm font-medium", selectedDesign.text)}>ברכה ל</p>
                  <h3 className={cn("text-xl font-bold", selectedDesign.text)}>{event.groom_name} & {event.bride_name}</h3>
                </div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className={cn("h-px w-12", selectedDesign.border.replace("border-", "bg-"))} />
                  <Heart className={cn("w-4 h-4", selectedDesign.text)} />
                  <div className={cn("h-px w-12", selectedDesign.border.replace("border-", "bg-"))} />
                </div>
                <Textarea value={blessing} onChange={(e) => setBlessing(e.target.value)}
                  placeholder="מזל טוב! מאחלים לכם חיים מאושרים מלאים באהבה, שמחה והצלחה..."
                  className={cn("flex-1 bg-transparent border-0 text-center text-lg resize-none focus:ring-0 placeholder:opacity-50", selectedDesign.text)}
                  rows={5} />
                <div className={cn("text-center mt-3 pt-3 border-t", selectedDesign.border)}>
                  <p className={cn("font-bold", selectedDesign.text)}>{payerName}</p>
                  {relationship && <p className={cn("text-sm opacity-70", selectedDesign.text)}>{relationship}</p>}
                </div>
                <div className={cn("absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg", selectedDesign.border)} />
                <div className={cn("absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg", selectedDesign.border)} />
                <div className={cn("absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 rounded-br-lg", selectedDesign.border)} />
                <div className={cn("absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg", selectedDesign.border)} />
              </div>

              {/* Video Blessing Upload */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#C4A35A]" />
                  <span className="text-white font-medium text-sm">ברכה בוידאו (אופציונלי)</span>
                </div>
                
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]); }}
                />

                {blessingVideoUrl ? (
                  <div className="space-y-2">
                    <video src={blessingVideoUrl} controls className="w-full rounded-xl max-h-40" />
                    <button onClick={() => { setBlessingVideoUrl(null); setBlessingVideoFile(null); }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <X className="w-3 h-3" /> הסר סרטון
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:border-[#C4A35A]/50 hover:text-white/70 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {uploadingVideo ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> מעלה סרטון...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> העלו סרטון ברכה (עד 50MB)</>
                    )}
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("details")}
                  className="flex-1 h-12 rounded-xl border border-white/15 text-white/60 font-medium hover:bg-white/5 transition-colors">
                  חזרה
                </button>
                <button onClick={handleProceedToPayment}
                  className="flex-1 h-12 rounded-xl font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #C41E3A 0%, #E8344E 50%, #C41E3A 100%)" }}>
                  {`שלם ${formatILS(breakdown.totalCharge)}`}
                </button>
              </div>
            </div>
          )}

          {/* Step: Card Payment */}
          {step === "card-payment" && (paymeApiKey || paymeSaleUrl) && (
            <div className="p-6 space-y-5 animate-fade-in">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#051839] to-[#1a3a6c] flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/10">
                  <CreditCard className="w-7 h-7 text-[#C4A35A]" />
                </div>
                <h2 className="text-2xl font-bold text-white">תשלום מאובטח</h2>
                <div className="inline-block bg-[#C4A35A]/10 px-4 py-1.5 rounded-full mt-2 border border-[#C4A35A]/20">
                  <span className="text-white/50 text-sm">לחיוב בכרטיס: </span>
                  <span className="font-bold text-[#C4A35A] text-lg">{formatILS(breakdown.totalCharge)}</span>
                  <span className="text-white/40 text-xs"> · {formatILS(breakdown.giftAmount)} לזוג</span>
                </div>
              </div>

              {paymeApiKey ? (
                <PayMeIframe apiKey={paymeApiKey} testMode={paymeTestMode} amount={breakdown.totalCharge} payerName={payerName}
                  payerEmail={payerEmail} payerPhone={payerPhone} productLabel={`מתנה ל${event.groom_name} & ${event.bride_name}`}
                  onTokenize={handleTokenize} onError={handlePaymentError} disabled={chargeToken.isPending} />
              ) : paymeSaleUrl ? (
                <div className="rounded-xl overflow-hidden border border-white/10 bg-white">
                  <iframe
                    src={paymeSaleUrl}
                    title="PayMe Checkout"
                    className="w-full"
                    style={{ height: '650px', border: 'none' }}
                    allow="payment"
                  />
                </div>
              ) : null}

              <button onClick={() => { setStep("blessing"); setPaymeSaleUrl(null); }} disabled={chargeToken.isPending}
                className="w-full h-12 rounded-xl border border-white/15 text-white/60 font-medium hover:bg-white/5 transition-colors disabled:opacity-50">
                חזרה
              </button>
            </div>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <div className="p-8 space-y-6 animate-fade-in text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C4A35A] to-[#E8D5A3] flex items-center justify-center shadow-xl shadow-[#C4A35A]/20">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">מעבד...</h2>
                <p className="text-white/40 mt-2">שומר את הברכה שלכם</p>
              </div>
            </div>
          )}

          {/* Step: Failed */}
          {step === "failed" && (
            <div className="p-8 space-y-6 animate-fade-in text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl shadow-red-500/20">
                <span className="text-3xl text-white">✕</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">התשלום נכשל</h2>
                <p className="text-white/40 mt-2">{paymentError || 'אירעה שגיאה בעיבוד התשלום'}</p>
              </div>
              <button onClick={() => setStep("card-payment")}
                className="w-full h-12 rounded-xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #C41E3A 0%, #E8344E 50%, #C41E3A 100%)" }}>
                נסה שוב
              </button>
            </div>
          )}

          {/* Step: Success - show blessing card */}
          {step === "success" && (
            <div className="p-6 space-y-5 animate-fade-in text-center flex-1 flex flex-col items-center justify-center overflow-y-auto">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-500/20">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <Sparkles className="absolute top-0 right-0 w-5 h-5 text-[#C4A35A] animate-pulse" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">תודה רבה!</h2>
                <p className="text-white/60 mt-1">המתנה והברכה נשלחו בהצלחה</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-[#C4A35A]/20 w-full">
                <p className="text-sm text-white/40">סכום המתנה</p>
                <p className="text-3xl font-bold text-[#C4A35A] mt-1">{breakdown.giftAmount > 0 ? formatILS(breakdown.giftAmount) : `₪${searchParams.get('amount') || ''}`}</p>
                <p className="text-white/30 text-xs mt-1">כולל עמלת סליקה ₪2.30</p>
              </div>

              {/* Show the blessing card */}
              {blessing && (
                <div className="w-full">
                  <p className="text-white/40 text-sm mb-2">הברכה שלכם:</p>
                  <div className={cn("relative p-5 rounded-2xl border-2 bg-gradient-to-br", selectedDesign.bg, selectedDesign.border)}>
                    <div className="text-center mb-2">
                      <h3 className={cn("text-lg font-bold", selectedDesign.text)}>
                        {event.groom_name} {event.bride_name ? `& ${event.bride_name}` : event.child_name || event.family_name || ""}
                      </h3>
                    </div>
                    <p className={cn("text-center text-base", selectedDesign.text)}>{blessing}</p>
                    <div className={cn("text-center mt-3 pt-2 border-t", selectedDesign.border)}>
                      <p className={cn("font-bold text-sm", selectedDesign.text)}>{payerName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show video blessing */}
              {blessingVideoUrl && (
                <div className="w-full">
                  <p className="text-white/40 text-sm mb-2">ברכת הוידאו שלכם:</p>
                  <video src={blessingVideoUrl} controls className="w-full rounded-xl max-h-48" />
                </div>
              )}

              <p className="text-white/30 text-sm">מזל טוב! 🎉</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-5 space-y-2">
          <button onClick={() => navigate(`/gift/${eventId}`)}
            className="inline-flex items-center gap-2 text-white/30 hover:text-white/50 font-medium text-xs transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
            חזרה למסך הראשי
          </button>
          <div className="flex items-center justify-center gap-2">
            <span className="text-white/20 text-[10px]">Powered by</span>
            <img src={logoAsset.url} alt="Giftkal" className="h-3 w-auto opacity-15" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sparkleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
