/**
 * Partner-embedded gift flow.
 * ---------------------------------------------------------------------------
 * When a partner sends a guest to us, the partner has already collected the
 * payer's name, phone, relationship, and blessing on their own screen. All we
 * need to do is:
 *   1. Show the total (with our fees pre-added by the partner).
 *   2. Collect a receipt email (only if the partner didn't already pass one).
 *   3. Tokenize a credit card via PayMe Hosted Fields (or fallback iframe).
 *   4. Charge the token and confirm — PayMe emails the receipt.
 *
 * URL contract:
 *   /gift/:eventId/partner?amount=350&payerName=דוד+כהן
 *     &payerEmail=david@example.com&payerPhone=0501234567&blessing=מזל+טוב
 *
 * `amount` is the FINAL total to charge on the card (partner already added our
 * fee). We do not run our wizard's gross-up math here — we trust the partner's
 * total. The partner's own 3%/2% commission is still recorded server-side.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2, CheckCircle2, XCircle, ShieldCheck, Mail } from "lucide-react";
import PayMeHostedFields from "@/components/payment/PayMeHostedFields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatILS } from "@/lib/fees";

type Status = "loading" | "ready" | "processing" | "success" | "failed" | "blocked";

export default function PartnerGift() {
  const { eventId } = useParams();
  const [params] = useSearchParams();
  const { toast } = useToast();

  // Read partner-supplied fields once — these are the source of truth.
  const initial = useMemo(() => {
    const amountRaw = Number(params.get("amount"));
    return {
      amount: Number.isFinite(amountRaw) && amountRaw > 0 ? Math.round(amountRaw * 100) / 100 : 0,
      payerName: params.get("payerName")?.trim() ?? "",
      payerEmail: params.get("payerEmail")?.trim() ?? "",
      payerPhone: params.get("payerPhone")?.trim() ?? "",
      blessing: params.get("blessing")?.trim() ?? "",
    };
  }, [params]);

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [payerEmail, setPayerEmail] = useState(initial.payerEmail);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [saleFallbackUrl, setSaleFallbackUrl] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [eventLabel, setEventLabel] = useState<string>("");

  // Load PayMe key + verify seller is approved.
  useEffect(() => {
    if (!eventId) {
      setStatus("failed");
      setError("קישור לא תקין");
      return;
    }
    if (!initial.amount || !initial.payerName) {
      setStatus("failed");
      setError("חסרים נתונים בקישור מהשותף (סכום או שם משלם)");
      return;
    }
    (async () => {
      try {
        const [{ data: keyData }, { data: ev }] = await Promise.all([
          supabase.functions.invoke("get-payme-key", { body: { eventId } }),
          supabase
            .from("public_events")
            .select("groom_name, bride_name, child_name, family_name")
            .eq("id", eventId)
            .maybeSingle(),
        ]);

        if (ev) {
          setEventLabel(
            ev.groom_name && ev.bride_name
              ? `${ev.groom_name} & ${ev.bride_name}`
              : ev.child_name ?? (ev.family_name ? `משפחת ${ev.family_name}` : ""),
          );
        }

        if (!keyData || keyData.blocked) {
          setStatus("blocked");
          return;
        }
        if (keyData.clientKey) {
          setApiKey(keyData.clientKey);
          setTestMode(Boolean(keyData.testMode));
          setStatus("ready");
        } else if (keyData.fallbackToRedirect) {
          // Ask the server for a hosted sale URL.
          const { data: link } = await supabase.functions.invoke("payme-generate-link", {
            body: {
              eventId,
              amount: initial.amount,
              payerName: initial.payerName,
              payerEmail: initial.payerEmail || undefined,
              payerPhone: initial.payerPhone || undefined,
              blessing: initial.blessing || undefined,
            },
          });
          if (link?.success && link?.saleUrl) {
            setSaleFallbackUrl(link.saleUrl);
            setStatus("ready");
          } else {
            setStatus("failed");
            setError(link?.error || "מערכת התשלום אינה זמינה");
          }
        } else {
          setStatus("blocked");
        }
      } catch (err: any) {
        console.error("PartnerGift init failed:", err);
        setStatus("failed");
        setError(err?.message || "שגיאה בטעינת מסך התשלום");
      }
    })();
  }, [eventId, initial.amount, initial.payerName, initial.payerEmail, initial.payerPhone, initial.blessing]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleTokenize = async (token: string) => {
    if (!eventId) return;
    if (!payerEmail || !validateEmail(payerEmail)) {
      toast({ title: "יש להזין כתובת מייל תקינה", variant: "destructive" });
      return;
    }
    setStatus("processing");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("payme-charge-token", {
        body: {
          token,
          eventId,
          amount: initial.amount,
          // We don't split gift/fee here — partner supplied a single total.
          giftAmount: initial.amount,
          feeAmount: 0,
          payerName: initial.payerName,
          payerEmail,
          payerPhone: initial.payerPhone || undefined,
          blessing: initial.blessing || undefined,
          installments: 1,
        },
      });
      if (fnErr) throw new Error(fnErr.message || "שגיאה בביצוע התשלום");
      if (!data?.success) throw new Error(data?.error || data?.details || "שגיאה בביצוע התשלום");
      setStatus("success");
    } catch (err: any) {
      setError(err?.message || "שגיאה בביצוע התשלום");
      setStatus("failed");
    }
  };

  const handleFieldsError = (msg: string) => {
    setError(msg);
    toast({ title: "שגיאת תשלום", description: msg, variant: "destructive" });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#051839] via-[#0a2547] to-[#051839] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#C4A35A]/20">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#051839] to-[#0a2547] p-6 text-center border-b border-[#C4A35A]/20">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#C4A35A]/10 flex items-center justify-center border border-[#C4A35A]/30 mb-3">
            <CreditCard className="w-7 h-7 text-[#C4A35A]" />
          </div>
          <h1 className="text-xl font-bold text-white">תשלום מאובטח</h1>
          {eventLabel && <p className="text-white/60 text-sm mt-1">מתנה עבור {eventLabel}</p>}
          <div className="mt-4 inline-flex items-center gap-2 bg-[#C4A35A]/10 border border-[#C4A35A]/30 rounded-full px-4 py-2">
            <span className="text-white/60 text-sm">לחיוב:</span>
            <span className="text-[#C4A35A] font-bold text-lg">{formatILS(initial.amount)}</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {status === "loading" && (
            <div className="py-12 flex flex-col items-center gap-3 text-[#051839]">
              <Loader2 className="w-8 h-8 animate-spin text-[#C4A35A]" />
              <p className="text-sm text-muted-foreground">טוען מסך תשלום...</p>
            </div>
          )}

          {status === "blocked" && (
            <div className="py-12 text-center space-y-3">
              <XCircle className="w-12 h-12 mx-auto text-red-500" />
              <h2 className="text-lg font-bold text-[#051839]">התשלום אינו זמין</h2>
              <p className="text-sm text-muted-foreground">חשבון הסליקה של האירוע עדיין לא מאושר. פנו לשותף.</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-500" />
              <h2 className="text-xl font-bold text-[#051839]">התשלום התקבל בהצלחה!</h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Mail className="w-4 h-4" /> קבלה נשלחה אל {payerEmail}
              </p>
            </div>
          )}

          {status === "failed" && (
            <div className="py-8 text-center space-y-3">
              <XCircle className="w-12 h-12 mx-auto text-red-500" />
              <h2 className="text-lg font-bold text-[#051839]">התשלום נכשל</h2>
              <p className="text-sm text-red-600">{error ?? "נסו שוב בעוד רגע"}</p>
              <button
                onClick={() => { setError(null); setStatus("ready"); }}
                className="mt-2 h-10 px-5 rounded-xl bg-[#C4A35A] text-white font-medium hover:bg-[#a88a4a]"
              >
                נסה שוב
              </button>
            </div>
          )}

          {(status === "ready" || status === "processing") && (
            <>
              {/* Payer preview (from partner) */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-1 text-sm border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">שם משלם</span>
                  <span className="font-medium text-[#051839]">{initial.payerName}</span>
                </div>
                {initial.payerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">טלפון</span>
                    <span className="font-medium text-[#051839]">{initial.payerPhone}</span>
                  </div>
                )}
                {initial.blessing && (
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <div className="text-slate-500 text-xs mb-1">ברכה</div>
                    <p className="text-[#051839] text-sm leading-relaxed">{initial.blessing}</p>
                  </div>
                )}
              </div>

              {/* Email — always visible, prefilled from partner if provided */}
              <div>
                <Label htmlFor="receipt-email" className="text-sm font-medium text-[#051839] flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#C4A35A]" /> מייל לקבלה
                </Label>
                <Input
                  id="receipt-email"
                  type="email"
                  inputMode="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 h-11"
                  disabled={status === "processing"}
                />
                <p className="text-[11px] text-slate-500 mt-1">הקבלה תישלח לכתובת זו</p>
              </div>

              {apiKey && (
                <PayMeHostedFields
                  apiKey={apiKey}
                  testMode={testMode}
                  amount={initial.amount}
                  payerName={initial.payerName}
                  payerEmail={payerEmail}
                  payerPhone={initial.payerPhone}
                  productLabel={`מתנה${eventLabel ? ` ל${eventLabel}` : ""}`}
                  onTokenize={handleTokenize}
                  onError={handleFieldsError}
                  disabled={status === "processing" || !payerEmail || !validateEmail(payerEmail)}
                />
              )}

              {!apiKey && saleFallbackUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <iframe
                    src={saleFallbackUrl}
                    title="PayMe Checkout"
                    className="w-full"
                    style={{ height: 620, border: "none" }}
                    allow="payment"
                  />
                </div>
              )}

              {status === "processing" && (
                <div className="flex items-center justify-center gap-2 text-[#051839]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">מעבד תשלום...</span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>הסליקה מאובטחת ע"י PayMe · תקן PCI-DSS Level 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
