import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react";

interface NedarimBillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill customer info */
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  /** Fixed amount or let user choose */
  fixedAmount?: number;
  /** Allow typing a custom amount */
  allowCustomAmount?: boolean;
  /** Description shown in the dialog */
  description?: string;
  /** Callback on success */
  onSuccess?: (transactionId: string) => void;
}

const PLAN_OPTIONS = [
  { label: "₪1 - טסט", value: "1" },
  { label: "מסלול רגיל - ₪200", value: "200" },
  { label: "מסלול + אישורי הגעה - ₪400", value: "400" },
  { label: "סכום מותאם אישית", value: "custom" },
];

export default function NedarimBillingDialog({
  open,
  onOpenChange,
  customerName = "",
  customerPhone = "",
  customerEmail = "",
  fixedAmount,
  description,
  onSuccess,
}: NedarimBillingDialogProps) {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [email, setEmail] = useState(customerEmail);
  const [selectedPlan, setSelectedPlan] = useState(fixedAmount ? String(fixedAmount) : "1");
  const [customAmount, setCustomAmount] = useState("");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mosadId, setMosadId] = useState("");
  const [apiValid, setApiValid] = useState("");

  // Fetch credentials
  useEffect(() => {
    if (!open) return;
    const fetchConfig = async () => {
      const { data, error } = await supabase.functions.invoke("get-nedarim-config");
      if (error || !data?.mosadId) {
        toast({ title: "שגיאה בטעינת מערכת התשלום", variant: "destructive" });
        return;
      }
      setMosadId(data.mosadId);
      setApiValid(data.apiValid);
    };
    fetchConfig();
  }, [open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName(customerName);
      setPhone(customerPhone);
      setEmail(customerEmail);
      setIframeLoaded(false);
      setIframeHeight(0);
      setProcessing(false);
      setSuccess(false);
      setError("");
    }
  }, [open, customerName, customerPhone, customerEmail]);

  // Listen for PostMessage from iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== "object" || !data.Name) return;

    console.log("[Nedarim] PostMessage received:", data);

    switch (data.Name) {
      case "Height":
        setIframeHeight(parseInt(data.Value) + 15);
        setIframeLoaded(true);
        break;

      case "TransactionResponse":
        setProcessing(false);
        console.log("[Nedarim] Transaction result:", data.Value);
        if (data.Value?.Status === "Error") {
          setError(data.Value.Message || "שגיאה בביצוע התשלום");
        } else {
          setSuccess(true);
          toast({ title: "התשלום בוצע בהצלחה! ✅" });
          onSuccess?.(data.Value?.TransactionId || "");
        }
        break;
    }
  }, [onSuccess, toast]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Request iframe height after load
  const handleIframeLoad = () => {
    // Fallback: mark loaded after 3s even without height response
    setTimeout(() => setIframeLoaded(true), 3000);
  };

  // Submit payment
  const handlePay = () => {
    if (!name.trim()) {
      setError("נא למלא שם"); return;
    }
    const amount = fixedAmount || (selectedPlan === "custom" ? Number(customAmount) : Number(selectedPlan));
    if (!amount || amount <= 0) {
      setError("נא לבחור מסלול"); return;
    }

    setError("");
    setProcessing(true);

    const paymentData = {
      Name: "FinishTransaction2",
      Value: {
        Mosad: mosadId,
        ApiValid: apiValid,
        Zeout: "",
        FirstName: name.split(" ")[0] || "",
        LastName: name.split(" ").slice(1).join(" ") || "",
        Street: "",
        City: "",
        Phone: phone,
        Mail: email,
        PaymentType: "Ragil",
        Amount: String(amount),
        Tashlumim: "1",
        Currency: "1",
        Groupe: "GiftKal",
        Comment: description || `חיוב שירות GiftKal - ₪${amount}`,
        CallBack: "",
        Tokef: "",
      },
    };

    console.log("[Nedarim] Sending payment data:", paymentData);
    iframeRef.current?.contentWindow?.postMessage(paymentData, "*");
  };

  const amount = fixedAmount || (selectedPlan === "custom" ? Number(customAmount) : Number(selectedPlan));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl">
        {success ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 gap-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h3 className="text-2xl font-bold">התשלום בוצע בהצלחה!</h3>
            <p className="text-muted-foreground">סכום: ₪{amount}</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">סגירה</Button>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="w-5 h-5" />
                תשלום עבור שירות
              </DialogTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </DialogHeader>

            <div className="px-6 pb-6 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>שם מלא *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם מלא" />
                </div>
                <div>
                  <Label>טלפון</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" />
                </div>
              </div>
              <div>
                <Label>אימייל</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>

              {/* Plan Selection */}
              {!fixedAmount && (
                <div className="space-y-2">
                  <Label>בחר מסלול</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPlan === "custom" && (
                    <Input
                      type="number"
                      min="1"
                      placeholder="הזן סכום ב-₪"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                  )}
                </div>
              )}

              {/* Nedarim Plus iframe */}
              <div className="relative">
                {!iframeLoaded && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-sm text-muted-foreground">מתחבר לשרת תשלומים מאובטח...</span>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src="https://www.matara.pro/nedarimplus/iframe/?Language=he&HideHeader=1"
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

              {error && (
                <p className="text-destructive text-sm font-medium text-center">{error}</p>
              )}

              <Button
                onClick={handlePay}
                disabled={processing || !iframeLoaded || !mosadId}
                className="w-full h-12 text-base font-bold"
                variant="gold"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מעבד תשלום...
                  </>
                ) : (
                  `שלם ₪${amount}`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
