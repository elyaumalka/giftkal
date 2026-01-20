import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Gift, Heart, CreditCard, Check, ArrowLeft, Sparkles, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import logo from "@/assets/logo.png";

const GIFT_AMOUNTS = [100, 200, 300, 500, 1000];

type Step = "amount" | "payment" | "blessing" | "processing" | "success" | "failed";

// Blessing card designs
const BLESSING_DESIGNS = [
  { id: 1, name: "קלאסי זהב", bg: "from-[#FDF8E8] to-[#F5EDD6]", border: "border-[#C4A35A]", text: "text-[#5A4A2A]" },
  { id: 2, name: "רומנטי ורוד", bg: "from-[#FFF5F5] to-[#FDE8E8]", border: "border-[#E8B4BC]", text: "text-[#8B4B5B]" },
  { id: 3, name: "מודרני כחול", bg: "from-[#F0F4F8] to-[#E0E8F0]", border: "border-[#051839]", text: "text-[#051839]" },
  { id: 4, name: "אלגנטי ירוק", bg: "from-[#F0F5F0] to-[#E8F0E8]", border: "border-[#4A7C59]", text: "text-[#2D4A32]" },
];

export default function GiftScreen() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [blessing, setBlessing] = useState("");
  const [selectedDesign, setSelectedDesign] = useState(BLESSING_DESIGNS[0]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentIframeUrl, setPaymentIframeUrl] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const { toast } = useToast();
  const blessingCardRef = useRef<HTMLDivElement>(null);

  // Check if returning from PayMe payment (fallback for popup blockers)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status');
    const transactionId = searchParams.get('transaction_id');
    
    if (paymentStatus === 'success' && transactionId) {
      setStep('success');
    } else if (paymentStatus === 'failed') {
      setPaymentError('התשלום נכשל. אנא נסו שוב.');
      setStep('failed');
    }
  }, [searchParams]);

  // Listen for messages from PayMe iframe
  const handlePaymentMessage = useCallback((event: MessageEvent) => {
    // PayMe sends messages when payment is complete
    console.log('Received message from iframe:', event.data);
    
    // Check for PayMe specific messages
    if (event.data?.type === 'payme_success' || event.data?.status === 'success') {
      setShowPaymentDialog(false);
      setPaymentIframeUrl(null);
      setStep('success');
    } else if (event.data?.type === 'payme_failed' || event.data?.status === 'failed') {
      setShowPaymentDialog(false);
      setPaymentIframeUrl(null);
      setPaymentError('התשלום נכשל. אנא נסו שוב.');
      setStep('failed');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handlePaymentMessage);
    return () => window.removeEventListener('message', handlePaymentMessage);
  }, [handlePaymentMessage]);

  // Poll for transaction status when payment dialog is open
  useEffect(() => {
    if (!showPaymentDialog || !currentTransactionId) return;

    const checkTransactionStatus = async () => {
      try {
        const { data: transaction } = await supabase
          .from('transactions')
          .select('payment_status')
          .eq('id', currentTransactionId)
          .maybeSingle();

        console.log('Polling transaction status:', transaction?.payment_status);

        if (transaction?.payment_status === 'completed') {
          setShowPaymentDialog(false);
          setPaymentIframeUrl(null);
          setStep('success');
        } else if (transaction?.payment_status === 'failed') {
          setShowPaymentDialog(false);
          setPaymentIframeUrl(null);
          setPaymentError('התשלום נכשל. אנא נסו שוב.');
          setStep('failed');
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    };

    // Check immediately
    checkTransactionStatus();

    // Then poll every 3 seconds
    const interval = setInterval(checkTransactionStatus, 3000);

    return () => clearInterval(interval);
  }, [showPaymentDialog, currentTransactionId]);

  // Fetch event details - get the nearest upcoming event for venue
  const { data: event, isLoading } = useQuery({
    queryKey: ["event-public", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          venues (name, address, logo_url, banner_url, phone, email)
        `)
        .eq("id", eventId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Save blessing card as image and upload to storage
  const saveBlessingAsImage = async (): Promise<string | null> => {
    if (!blessingCardRef.current) return null;
    
    try {
      const canvas = await html2canvas(blessingCardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 0.95);
      });
      
      if (!blob) return null;
      
      // Generate unique filename
      const fileName = `blessings/${eventId}/${Date.now()}-${payerName.replace(/\s+/g, '_')}.png`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(fileName, blob, {
          contentType: "image/png",
          upsert: false,
        });
      
      if (error) {
        console.error("Error uploading blessing image:", error);
        return null;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error saving blessing card:", error);
      return null;
    }
  };

  // PayMe payment mutation
  const initiatePayment = useMutation({
    mutationFn: async () => {
      const amount = selectedAmount || Number(customAmount);
      
      // Save blessing card as image first and get the URL
      const blessingImageUrl = await saveBlessingAsImage();
      
      // Build return URL with success/failure params
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/gift/${eventId}?payment_status=success&transaction_id={transaction_id}`;
      
      const response = await supabase.functions.invoke('payme-generate-sale', {
        body: {
          eventId,
          amount,
          payerName,
          payerEmail: payerEmail || undefined,
          payerPhone: payerPhone || undefined,
          relationship: relationship || undefined,
          blessing: blessing || undefined,
          blessingImageUrl: blessingImageUrl || undefined, // Send the image URL
          returnUrl,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'שגיאה ביצירת התשלום');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'שגיאה ביצירת התשלום');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Open PayMe payment page in iframe dialog
      if (data.saleUrl) {
        setPaymentIframeUrl(data.saleUrl);
        setCurrentTransactionId(data.transactionId);
        setShowPaymentDialog(true);
        setStep("payment"); // Reset step so user can see the dialog
      }
    },
    onError: (error: Error) => {
      setPaymentError(error.message);
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
      setStep("payment");
    },
  });

  // Legacy transaction creation (for when PayMe is not configured)
  const createTransaction = useMutation({
    mutationFn: async () => {
      // Save blessing card as image first
      const blessingImageUrl = await saveBlessingAsImage();
      
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
        receipt_url: blessingImageUrl, // Store blessing image URL here
        payment_status: 'completed', // Legacy: no payment processing
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setStep("success");
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const finalAmount = selectedAmount || Number(customAmount);

  const handlePayment = () => {
    // Navigate to blessing step first
    setStep("blessing");
  };

  const handleSubmit = () => {
    // Check if event has PayMe configured
    if (event?.seller_payme_id) {
      setStep("processing");
      initiatePayment.mutate();
    } else {
      // Fallback to legacy mode without payment processing
      createTransaction.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF8E8] to-[#F5EDD6] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Sparkles className="w-12 h-12 text-[#C4A35A] mx-auto mb-4 animate-spin" />
          <p className="text-[#5A4A2A] font-medium">טוען...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF8E8] to-[#F5EDD6] flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <Gift className="w-16 h-16 text-[#C4A35A] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#051839] mb-2">האירוע לא נמצא</h1>
          <p className="text-[#5A4A2A]">נא לבדוק את הקישור ולנסות שוב</p>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8E8] via-white to-[#F5EDD6]" dir="rtl">
      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-64 h-64 bg-[#C4A35A]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#E8B4BC]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      {/* Header with Logos */}
      <div className="relative">
        {/* Banner Background */}
        <div 
          className="h-56 relative overflow-hidden"
          style={{
            background: event.venues?.banner_url 
              ? `url(${event.venues.banner_url}) center/cover` 
              : "linear-gradient(135deg, #051839 0%, #0A2F5C 50%, #051839 100%)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Logos Row */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-6">
            {/* Giftkal Logo */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg">
              <img src={logo} alt="Giftkal" className="h-10 w-auto" />
            </div>
            
            {/* Venue Logo */}
            {event.venues?.logo_url && (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                <img src={event.venues.logo_url} alt={event.venues.name} className="h-10 w-auto" />
              </div>
            )}
          </div>
          
          {/* Event Info - Centered */}
          <div className="absolute bottom-0 left-0 right-0 text-center text-white pb-6">
            <div className="inline-block bg-[#C4A35A] px-4 py-1 rounded-full text-sm font-medium mb-3">
              {event.event_type}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
              {event.groom_name} <span className="text-[#C4A35A]">♥</span> {event.bride_name}
            </h1>
            <p className="text-white/90 text-lg">{formattedDate}</p>
            {event.venues?.name && (
              <p className="text-white/70 text-sm mt-1">{event.venues.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 -mt-6 pb-12 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          
          {/* Step: Amount Selection */}
          {step === "amount" && (
            <div className="p-6 md:p-8 space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C4A35A] to-[#D4B36A] flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#051839]">בחרו סכום מתנה</h2>
                <p className="text-[#5A4A2A] mt-1">כמה תרצו להעניק לזוג המאושר?</p>
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
                      "relative py-4 px-3 rounded-xl font-bold text-lg transition-all duration-300 border-2",
                      selectedAmount === amount
                        ? "bg-gradient-to-br from-[#C4A35A] to-[#D4B36A] text-white border-[#C4A35A] shadow-lg scale-105"
                        : "bg-white border-gray-200 text-[#051839] hover:border-[#C4A35A] hover:shadow-md"
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
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-[#5A4A2A]">או סכום אחר</span>
                </div>
              </div>
              
              <div className="relative">
                <Input
                  type="number"
                  placeholder="הזינו סכום..."
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="text-center text-xl font-bold h-14 rounded-xl border-2 border-gray-200 focus:border-[#C4A35A] pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C4A35A] font-bold text-xl">₪</span>
              </div>

              <Button
                className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] hover:from-[#B4943A] hover:to-[#C4A35A] text-white shadow-lg"
                disabled={!finalAmount || finalAmount <= 0}
                onClick={() => setStep("payment")}
              >
                המשך לתשלום
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </div>
          )}

          {/* Step: Payment */}
          {step === "payment" && (
            <div className="p-6 md:p-8 space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#051839] to-[#0A2F5C] flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#051839]">פרטי תשלום</h2>
                <div className="inline-block bg-[#C4A35A]/10 px-4 py-2 rounded-full mt-2">
                  <span className="text-[#5A4A2A]">סכום לתשלום: </span>
                  <span className="font-bold text-[#C4A35A] text-xl">₪{finalAmount}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[#051839] font-medium">שם מלא *</Label>
                  <Input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="ישראל ישראלי"
                    className="mt-1 h-12 rounded-xl border-2 border-gray-200 focus:border-[#C4A35A]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[#051839] font-medium">טלפון</Label>
                    <Input
                      type="tel"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      placeholder="050-1234567"
                      className="mt-1 h-12 rounded-xl border-2 border-gray-200 focus:border-[#C4A35A]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#051839] font-medium">קרבה</Label>
                    <Input
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      placeholder="חבר, דוד..."
                      className="mt-1 h-12 rounded-xl border-2 border-gray-200 focus:border-[#C4A35A]"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[#051839] font-medium">מייל (לקבלה)</Label>
                  <Input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="mt-1 h-12 rounded-xl border-2 border-gray-200 focus:border-[#C4A35A]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("amount")}
                  className="flex-1 h-12 rounded-xl border-2"
                >
                  חזרה
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={!payerName}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] hover:from-[#B4943A] hover:to-[#C4A35A] text-white font-bold"
                >
                  שלם ₪{finalAmount}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Blessing Card */}
          {step === "blessing" && (
            <div className="p-6 md:p-8 space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E8B4BC] to-[#D4A5AD] flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#051839]">כתבו ברכה לזוג</h2>
                <p className="text-[#5A4A2A] mt-1">הברכה תישמר כתמונה יפה</p>
              </div>

              {/* Design Selection */}
              <div className="flex justify-center gap-2">
                {BLESSING_DESIGNS.map((design) => (
                  <button
                    key={design.id}
                    onClick={() => setSelectedDesign(design)}
                    className={cn(
                      "w-12 h-12 rounded-xl border-2 bg-gradient-to-br transition-all",
                      design.bg,
                      selectedDesign.id === design.id 
                        ? "border-[#C4A35A] ring-2 ring-[#C4A35A]/30 scale-110" 
                        : "border-gray-200"
                    )}
                    title={design.name}
                  />
                ))}
              </div>

              {/* Blessing Card Preview */}
              <div 
                ref={blessingCardRef}
                className={cn(
                  "relative p-6 rounded-2xl border-2 bg-gradient-to-br min-h-[300px] flex flex-col",
                  selectedDesign.bg,
                  selectedDesign.border
                )}
              >
                {/* Card Header */}
                <div className="text-center mb-4">
                  <p className={cn("text-sm font-medium", selectedDesign.text)}>ברכה ל</p>
                  <h3 className={cn("text-xl font-bold", selectedDesign.text)}>
                    {event.groom_name} & {event.bride_name}
                  </h3>
                </div>

                {/* Decorative Divider */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={cn("h-px w-12", selectedDesign.border.replace("border-", "bg-"))} />
                  <Heart className={cn("w-4 h-4", selectedDesign.text)} />
                  <div className={cn("h-px w-12", selectedDesign.border.replace("border-", "bg-"))} />
                </div>

                {/* Blessing Text Area */}
                <Textarea
                  value={blessing}
                  onChange={(e) => setBlessing(e.target.value)}
                  placeholder="מזל טוב! מאחלים לכם חיים מאושרים מלאים באהבה, שמחה והצלחה..."
                  className={cn(
                    "flex-1 bg-transparent border-0 text-center text-lg resize-none focus:ring-0 placeholder:opacity-50",
                    selectedDesign.text
                  )}
                  rows={6}
                />

                {/* Card Footer */}
                <div className={cn("text-center mt-4 pt-4 border-t", selectedDesign.border)}>
                  <p className={cn("font-bold", selectedDesign.text)}>{payerName}</p>
                  {relationship && (
                    <p className={cn("text-sm opacity-70", selectedDesign.text)}>{relationship}</p>
                  )}
                </div>

                {/* Corner Decorations */}
                <div className={cn("absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg", selectedDesign.border)} />
                <div className={cn("absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg", selectedDesign.border)} />
                <div className={cn("absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 rounded-br-lg", selectedDesign.border)} />
                <div className={cn("absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg", selectedDesign.border)} />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("payment")}
                  className="flex-1 h-12 rounded-xl border-2"
                >
                  חזרה
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] hover:from-[#B4943A] hover:to-[#C4A35A] text-white font-bold"
                  disabled={createTransaction.isPending || initiatePayment.isPending}
                >
                  {(createTransaction.isPending || initiatePayment.isPending) ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      מעבד...
                    </>
                  ) : event?.seller_payme_id ? (
                    `שלם ₪${finalAmount} ושלח ברכה`
                  ) : (
                    "שלח ברכה"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Processing Payment */}
          {step === "processing" && (
            <div className="p-6 md:p-8 space-y-6 animate-fade-in text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C4A35A] to-[#D4B36A] flex items-center justify-center mx-auto shadow-xl">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-[#051839]">מעבד את התשלום...</h2>
                <p className="text-[#5A4A2A] mt-2">
                  מעבירים אתכם לדף התשלום המאובטח
                </p>
              </div>
            </div>
          )}

          {/* Step: Payment Failed */}
          {step === "failed" && (
            <div className="p-6 md:p-8 space-y-6 animate-fade-in text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mx-auto shadow-xl">
                <span className="text-4xl text-white">✕</span>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-[#051839]">התשלום נכשל</h2>
                <p className="text-[#5A4A2A] mt-2">
                  {paymentError || 'אירעה שגיאה בעיבוד התשלום'}
                </p>
              </div>

              <Button
                onClick={() => setStep("payment")}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] hover:from-[#B4943A] hover:to-[#C4A35A] text-white font-bold"
              >
                נסה שוב
              </Button>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="p-6 md:p-8 space-y-6 animate-fade-in text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto shadow-xl">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-[#C4A35A] animate-pulse" />
                <Sparkles className="absolute bottom-0 left-1/4 w-4 h-4 text-[#E8B4BC] animate-pulse delay-150" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-[#051839]">תודה רבה!</h2>
                <p className="text-[#5A4A2A] mt-2 text-lg">
                  המתנה והברכה נשלחו בהצלחה
                </p>
                <p className="text-[#5A4A2A]/70">
                  ל{event?.groom_name} ו{event?.bride_name}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-[#C4A35A]/10 to-[#D4B36A]/10 p-6 rounded-2xl border border-[#C4A35A]/20">
                <p className="text-sm text-[#5A4A2A]">סכום המתנה</p>
                <p className="text-4xl font-bold text-[#C4A35A] mt-1">₪{finalAmount || searchParams.get('amount') || ''}</p>
              </div>

              <div className="pt-4">
                <p className="text-sm text-[#5A4A2A]/60">
                  מזל טוב! 🎉
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-[#5A4A2A]/60">
          <p>מופעל על ידי Giftkal</p>
        </div>
      </div>

      {/* PayMe Payment Iframe Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        if (!open) {
          // User closed dialog - check if payment was completed
          setShowPaymentDialog(false);
          setPaymentIframeUrl(null);
          // Optional: Could check transaction status here
        }
      }}>
        <DialogContent className="max-w-lg w-full h-[90vh] max-h-[700px] p-0 overflow-hidden" dir="rtl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#051839] to-[#0A2F5C]">
              <h3 className="text-white font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                תשלום מאובטח
              </h3>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPaymentIframeUrl(null);
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Iframe */}
            <div className="flex-1 relative bg-white">
              {paymentIframeUrl ? (
                <iframe
                  src={paymentIframeUrl}
                  className="w-full h-full border-0"
                  title="PayMe Payment"
                  allow="payment *"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C4A35A]" />
                </div>
              )}
            </div>

            {/* Footer with check status button */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  אחרי השלמת התשלום, לחצו על הכפתור
                </p>
                <Button
                  onClick={async () => {
                    // Check transaction status
                    if (currentTransactionId) {
                      const { data: transaction } = await supabase
                        .from('transactions')
                        .select('payment_status')
                        .eq('id', currentTransactionId)
                        .maybeSingle();
                      
                      if (transaction?.payment_status === 'completed') {
                        setShowPaymentDialog(false);
                        setPaymentIframeUrl(null);
                        setStep('success');
                      } else if (transaction?.payment_status === 'failed') {
                        setShowPaymentDialog(false);
                        setPaymentIframeUrl(null);
                        setStep('failed');
                      } else {
                        toast({
                          title: "ממתין לאישור",
                          description: "התשלום עדיין בתהליך, נסו שוב בעוד רגע",
                        });
                      }
                    }
                  }}
                  className="bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] hover:from-[#B4943A] hover:to-[#C4A35A] text-white"
                >
                  <Check className="w-4 h-4 ml-2" />
                  סיימתי לשלם
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
