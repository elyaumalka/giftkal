import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail, MessageSquare, Loader2, SkipForward, Play, AlertTriangle } from "lucide-react";
import type { SendChannel } from "./useInvitationSends";

type Guest = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

type Props = {
  eventId?: string;
  guests: Guest[];
  buildMessage: (guest: Guest) => string;
  lastSendByGuest: (guestId: string) => { channel: string; status: string; created_at: string } | null;
  logSend: (args: {
    guestId: string;
    channel: SendChannel;
    status?: "sent" | "failed" | "queued";
    recipient?: string | null;
    errorMessage?: string | null;
  }) => Promise<void>;
  refetchSends: () => void;
  emailEnabled?: boolean;
};

const waLink = (phone: string, message: string) =>
  `https://wa.me/972${phone.replace(/^0/, "").replace(/[-\s]/g, "")}?text=${encodeURIComponent(message)}`;

export default function InvitationSendPanel({
  eventId,
  guests,
  buildMessage,
  lastSendByGuest,
  logSend,
  refetchSends,
  emailEnabled = false,
}: Props) {
  const { toast } = useToast();
  const [channel, setChannel] = useState<SendChannel | "sms">("whatsapp");
  const [onlyUnsent, setOnlyUnsent] = useState(true);
  const [sending, setSending] = useState(false);

  // WhatsApp queue state
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueActive, setQueueActive] = useState(false);

  const targets = useMemo(() => {
    return guests.filter((g) => {
      if (onlyUnsent && lastSendByGuest(g.id)?.status === "sent") return false;
      if (channel === "email") return !!g.email;
      return !!g.phone;
    });
  }, [guests, onlyUnsent, channel, lastSendByGuest]);

  const missing = guests.length - targets.length;

  const startQueue = () => {
    if (targets.length === 0) {
      toast({ title: "אין מוזמנים לשליחה", variant: "destructive" });
      return;
    }
    setQueueIndex(0);
    setQueueActive(true);
  };

  const currentQueueGuest = queueActive ? targets[queueIndex] : undefined;

  const sendCurrentWhatsapp = async () => {
    const g = currentQueueGuest;
    if (!g || !g.phone) return;
    window.open(waLink(g.phone, buildMessage(g)), "_blank", "noopener,noreferrer");
    await logSend({ guestId: g.id, channel: "whatsapp", recipient: g.phone });
    advanceQueue();
  };

  const advanceQueue = () => {
    setQueueIndex((i) => {
      const next = i + 1;
      if (next >= targets.length) {
        setQueueActive(false);
        toast({ title: "התור הושלם 🎉" });
        return 0;
      }
      return next;
    });
  };

  const sendSmsBulk = async () => {
    if (!eventId || targets.length === 0) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invitation-sms", {
        body: { eventId, guestIds: targets.map((g) => g.id) },
      });
      if (error) {
        const details = (error as any)?.context ? await (error as any).context.text() : error.message;
        throw new Error(details);
      }
      toast({
        title: `נשלחו ${data?.sent ?? 0} הודעות SMS`,
        description: data?.failed ? `${data.failed} נכשלו` : undefined,
        variant: data?.failed ? "destructive" : undefined,
      });
      refetchSends();
    } catch (err: any) {
      toast({ title: "שליחת SMS נכשלה", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const sendWhatsappBulk = async () => {
    if (!eventId || targets.length === 0) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invitation-whatsapp", {
        body: { eventId, guestIds: targets.map((g) => g.id) },
      });
      if (error) {
        const details = (error as any)?.context ? await (error as any).context.text() : error.message;
        throw new Error(details);
      }
      toast({
        title: `נשלחו ${data?.sent ?? 0} הודעות וואטסאפ`,
        description: data?.failed ? `${data.failed} נכשלו` : undefined,
        variant: data?.failed ? "destructive" : undefined,
      });
      refetchSends();
    } catch (err: any) {
      toast({ title: "שליחת וואטסאפ נכשלה", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const sendEmailBulk = async () => {
    if (!eventId || targets.length === 0) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invitation-email", {
        body: { eventId, guestIds: targets.map((g) => g.id) },
      });
      if (error) {
        const details = (error as any)?.context ? await (error as any).context.text() : error.message;
        throw new Error(details);
      }
      toast({
        title: `נשלחו ${data?.sent ?? 0} מיילים`,
        description: data?.failed ? `${data.failed} נכשלו` : undefined,
        variant: data?.failed ? "destructive" : undefined,
      });
      refetchSends();
    } catch (err: any) {
      toast({ title: "שליחת מייל נכשלה", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };


  const channels: { value: SendChannel | "sms"; label: string; icon: typeof Send }[] = [
    { value: "whatsapp", label: "וואטסאפ", icon: Send },
    { value: "email", label: "מייל", icon: Mail },
    { value: "sms", label: "SMS", icon: MessageSquare },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-secondary text-base">שליחת הזמנות</h3>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={onlyUnsent} onChange={(e) => setOnlyUnsent(e.target.checked)} />
          רק מי שטרם קיבל
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {channels.map((c) => (
          <button
            key={c.value}
            onClick={() => {
              setChannel(c.value);
              setQueueActive(false);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 transition-colors ${
              channel === c.value
                ? "bg-secondary text-white border-secondary"
                : "bg-muted text-secondary border-border hover:bg-muted/80"
            }`}
          >
            <c.icon className="w-4 h-4" />
            {c.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {targets.length} מוזמנים לשליחה
        {missing > 0 && (
          <span className="text-xs">
            {" "}
            • {missing} ללא {channel === "email" ? "כתובת מייל" : "מספר טלפון"} או שכבר נשלחו
          </span>
        )}
      </p>

      {/* WhatsApp semi-automatic queue */}
      {channel === "whatsapp" && (
        <div className="space-y-3">
          {!queueActive ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={startQueue} className="gap-2">
                <Play className="w-4 h-4" />
                תור שליחה ידני (חינם)
              </Button>
              <Button onClick={sendWhatsappBulk} disabled={sending || targets.length === 0} className="gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                שליחה אוטומטית ({targets.length})
              </Button>
            </div>
          ) : (

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-secondary">
                  {currentQueueGuest?.full_name} • {currentQueueGuest?.phone}
                </span>
                <span className="text-muted-foreground text-xs">
                  {queueIndex + 1} מתוך {targets.length}
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${((queueIndex) / targets.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setQueueActive(false)} className="text-sm">
                  עצור
                </Button>
                <Button variant="outline" onClick={advanceQueue} className="gap-2 text-sm">
                  <SkipForward className="w-4 h-4" />
                  דלג
                </Button>
                <Button onClick={sendCurrentWhatsapp} className="gap-2 text-sm">
                  <Send className="w-4 h-4" />
                  שלח והמשך
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            ההודעה נשלחת ממספר הוואטסאפ שלכם — ללא עלות. כל שליחה נרשמת במעקב.
          </p>
        </div>
      )}

      {/* Email bulk */}
      {channel === "email" && (
        <div className="space-y-3">
          {!emailEnabled && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              שליחת מייל תופעל לאחר אימות דומיין השולח של המערכת.
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={sendEmailBulk} disabled={sending || targets.length === 0 || !emailEnabled} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              שלח לכל מי שיש לו מייל ({targets.length})
            </Button>
          </div>
        </div>
      )}

      {/* SMS bulk */}
      {channel === "sms" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            שליחת SMS כרוכה בעלות לכל הודעה. ייצאו {targets.length} הודעות.
          </div>
          <div className="flex justify-end">
            <Button onClick={sendSmsBulk} disabled={sending || targets.length === 0} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              שלח SMS ({targets.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
