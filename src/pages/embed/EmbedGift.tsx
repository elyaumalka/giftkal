import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PayMeHostedFields from "@/components/payment/PayMeHostedFields";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Embeddable gift payment page for external partners (e.g. Nedarim).
 *
 * URL: /embed/gift/:eventId?amount=100&name=...&phone=...&email=...&blessing=...&relationship=...
 *
 * Posts messages to parent window:
 *  - { source: 'giftkal-embed', type: 'ready' }
 *  - { source: 'giftkal-embed', type: 'success', transactionId, paymeSaleId }
 *  - { source: 'giftkal-embed', type: 'error', message }
 *
 * Uses PayMe Hosted Fields wrapped in Giftkal branding (gold/navy, RTL).
 */
export default function EmbedGift() {
  const { eventId } = useParams<{ eventId: string }>();
  const [params] = useSearchParams();

  const amount = Number(params.get("amount") || 0);
  const payerName = params.get("name") || params.get("payer_name") || "";
  const payerPhone = params.get("phone") || params.get("payer_phone") || "";
  const payerEmail = params.get("email") || params.get("payer_email") || "";
  const blessing = params.get("blessing") || "";
  const relationship = params.get("relationship") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientKey, setClientKey] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [success, setSuccess] = useState<{ transactionId: string; paymeSaleId?: string } | null>(null);
  const [eventInfo, setEventInfo] = useState<{ groom?: string; bride?: string; child?: string; family?: string } | null>(null);

  // Post message helper
  const postToParent = (type: string, data: Record<string, unknown> = {}) => {
    try {
      window.parent.postMessage({ source: "giftkal-embed", type, ...data }, "*");
    } catch (_e) {
      // ignore
    }
  };

  useEffect(() => {
    if (!eventId) {
      setError("חסר מזהה אירוע");
      setLoading(false);
      return;
    }
    if (!amount || amount < 1) {
      setError("סכום לא תקין");
      setLoading(false);
      return;
    }
    if (!payerName) {
      setError("חסר שם משלם");
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        // Fetch event for product label
        const { data: ev } = await supabase
          .from("events")
          .select("groom_name, bride_name, child_name, family_name")
          .eq("id", eventId)
          .maybeSingle();

        if (ev) {
          setEventInfo({
            groom: ev.groom_name || undefined,
            bride: ev.bride_name || undefined,
            child: ev.child_name || undefined,
            family: ev.family_name || undefined,
          });
        }

        // Fetch PayMe client key for this event
        const { data, error: fnErr } = await supabase.functions.invoke("get-payme-key", {
          body: { eventId },
        });

        if (fnErr || !data) {
          throw new Error(fnErr?.message || "שגיאה בטעינת מערכת התשלום");
        }

        if (data.blocked) {
          throw new Error("האירוע אינו מאושר לסליקה");
        }

        if (!data.clientKey) {
          throw new Error("האירוע אינו מוגדר לסליקה משולבת");
        }

        setClientKey(data.clientKey);
        setTestMode(!!data.testMode);
        setLoading(false);
        postToParent("ready");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "שגיאה בלתי צפויה";
        setError(msg);
        setLoading(false);
        postToParent("error", { message: msg });
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const productLabel = (() => {
    if (!eventInfo) return "מתנה";
    if (eventInfo.groom && eventInfo.bride) return `מתנה ל${eventInfo.groom} & ${eventInfo.bride}`;
    if (eventInfo.child) return `מתנה ל${eventInfo.child}`;
    if (eventInfo.family) return `מתנה למשפחת ${eventInfo.family}`;
    return "מתנה";
  })();

  const handleTokenize = async (token: string) => {
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("payme-charge-token", {
        body: {
          token,
          eventId,
          amount,
          payerName,
          payerEmail: payerEmail || undefined,
          payerPhone: payerPhone || undefined,
          relationship: relationship || undefined,
          blessing: blessing || undefined,
          installments: 1,
        },
      });

      if (fnErr || !data?.success) {
        const msg = (data?.error || fnErr?.message || "שגיאה בעיבוד התשלום") as string;
        setError(msg);
        postToParent("error", { message: msg });
        return;
      }

      setSuccess({ transactionId: data.transactionId, paymeSaleId: data.paymeSaleId });
      postToParent("success", {
        transactionId: data.transactionId,
        paymeSaleId: data.paymeSaleId,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "שגיאה בעיבוד התשלום";
      setError(msg);
      postToParent("error", { message: msg });
    }
  };

  const handleError = (msg: string) => {
    postToParent("error", { message: msg });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-[#FAF7F0] to-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] text-white rounded-full px-4 py-1 text-sm font-bold mb-2">
            giftkal
          </div>
          <h1 className="text-xl font-bold text-[#051839]">{productLabel}</h1>
          <p className="text-3xl font-bold text-[#C4A35A] mt-2">₪{amount.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">משלם: {payerName}</p>
        </div>

        {/* Body */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E8DDC4]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-10 h-10 text-[#C4A35A] animate-spin" />
              <p className="text-[#5A4A2A]">טוען מערכת תשלום מאובטחת...</p>
            </div>
          )}

          {!loading && error && !success && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          {!loading && success && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <h2 className="text-xl font-bold text-[#051839]">התשלום בוצע בהצלחה!</h2>
              <p className="text-sm text-gray-600">תודה רבה על המתנה</p>
              <p className="text-xs text-gray-400 mt-2">מזהה עסקה: {success.transactionId.slice(0, 8)}</p>
            </div>
          )}

          {!loading && !error && !success && clientKey && (
            <PayMeHostedFields
              apiKey={clientKey}
              testMode={testMode}
              amount={amount}
              payerName={payerName}
              payerEmail={payerEmail}
              payerPhone={payerPhone}
              productLabel={productLabel}
              onTokenize={handleTokenize}
              onError={handleError}
            />
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 תשלום מאובטח · giftkal.com
        </p>
      </div>
    </div>
  );
}
