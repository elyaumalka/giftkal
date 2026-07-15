/**
 * Admin Wallets dashboard — cross-event treasury view.
 *
 * Aggregates every event's wallet state into one place so the admin can
 * answer at a glance:
 *   - How much commission was collected platform-wide?
 *   - How much of it have we already swept to giftkal's master wallet?
 *   - How much is still sitting in event-owner wallets waiting to be swept?
 *   - How much have we paid out to event-owner bank accounts?
 *
 * Three tabs surface the underlying rows:
 *   - Events       — per-event balances with the same auto-fill / "needs sweep"
 *                    visual cues used in the per-event dialog.
 *   - Sweeps       — every platform_commission_transfers row, status pill,
 *                    most recent first.
 *   - Bank payouts — every payouts row.
 */

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  Search,
  Loader2,
  Building2,
  ArrowRightLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatILS } from "@/lib/fees";

type TabKey = "events" | "sweeps" | "payouts" | "partners";

interface EventRow {
  event_id: string;
  event_label: string;
  event_date: string | null;
  seller_payme_id: string | null;
  payment_setup_status: string | null;
  collected: number;
  swept: number;
  pending: number;
  gifts: number;
  /** Number of completed transactions on this event that used installments > 1. */
  installmentCount: number;
  /** Total transactions count (regular + installments). */
  txCount: number;
}

export default function Wallets() {
  const [tab, setTab] = useState<TabKey>("events");
  const [search, setSearch] = useState("");
  // In-dashboard sweep: clicking 'העבר' on a row opens this dialog pre-filled
  // with the pending commission so the admin doesn't need to drill into the
  // event details just to move money.
  const [transferTarget, setTransferTarget] = useState<EventRow | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!transferTarget) throw new Error("no target");
      const amount = Number(transferAmount);
      if (!amount || amount <= 0) throw new Error("סכום לא תקין");
      const { data, error } = await supabase.functions.invoke("payme-generate-transfer", {
        body: {
          eventId: transferTarget.event_id,
          amount,
          productName: transferNote || undefined,
        },
      });
      if (error) throw new Error(error.message || "שגיאה");
      if (!data?.success) throw new Error(data?.error || data?.details || "שגיאה");
      return data;
    },
    onSuccess: () => {
      toast({
        title: `הועבר ${formatILS(Number(transferAmount))} ל-giftkal ✅`,
      });
      setTransferTarget(null);
      setTransferAmount("");
      setTransferNote("");
      queryClient.invalidateQueries({ queryKey: ["wallets-dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "שגיאה בהעברה", description: err.message, variant: "destructive" });
    },
  });

  const openTransfer = (row: EventRow) => {
    setTransferTarget(row);
    setTransferAmount(row.pending > 0 ? String(row.pending) : "");
    setTransferNote("");
  };

  // Pull everything we need in three parallel queries. None of these tables is
  // huge (one row per event/transaction/transfer/payout) so we don't bother
  // with pagination yet; if it grows past a few thousand rows we'll add a
  // server-side aggregation RPC.
  const { data: rows = { events: [], transfers: [], payouts: [], partners: [] as any[] }, isLoading } = useQuery({
    queryKey: ["wallets-dashboard"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const [evRes, txRes, trRes, poRes] = await Promise.all([
        supabase
          .from("events")
          .select("id, event_date, groom_name, bride_name, child_name, family_name, seller_payme_id, payment_setup_status")
          .order("event_date", { ascending: false }),
        supabase
          .from("transactions")
          .select("event_id, amount, gift_amount, fee_amount, payment_status, installments, partner_id, partner_share, platform_partner_share")
          .eq("payment_status", "completed"),
        (supabase.from as any)("platform_commission_transfers")
          .select("id, event_id, amount, status, submitted_at, completed_at")
          .order("submitted_at", { ascending: false }),
        (supabase.from as any)("payouts")
          .select("id, event_id, amount, status, submitted_at, completed_at, seller_payme_id")
          .order("submitted_at", { ascending: false }),
      ]);
      const { data: partnersRes } = await supabase
        .from("partners")
        .select("id, name, partner_commission_pct, platform_commission_pct");

      const events = (evRes.data ?? []) as any[];
      const completedTx = (txRes.data ?? []) as any[];
      const transfers = (trRes.data ?? []) as any[];
      const payouts = (poRes.data ?? []) as any[];

      // Roll up per-event aggregates.
      const aggByEvent = new Map<
        string,
        { collected: number; gifts: number; installmentCount: number; txCount: number }
      >();
      for (const t of completedTx) {
        const cur = aggByEvent.get(t.event_id) ?? {
          collected: 0,
          gifts: 0,
          installmentCount: 0,
          txCount: 0,
        };
        cur.collected += Number(t.fee_amount) || 0;
        cur.gifts += Number(t.gift_amount) || Number(t.amount) || 0;
        cur.txCount += 1;
        if ((Number(t.installments) || 1) > 1) cur.installmentCount += 1;
        aggByEvent.set(t.event_id, cur);
      }
      const sweptByEvent = new Map<string, number>();
      for (const t of transfers) {
        if (t.status === "failed" || t.status === "cancelled") continue;
        sweptByEvent.set(t.event_id, (sweptByEvent.get(t.event_id) ?? 0) + (Number(t.amount) || 0));
      }

      const eventRows: EventRow[] = events.map((e) => {
        const agg = aggByEvent.get(e.id) ?? { collected: 0, gifts: 0, installmentCount: 0, txCount: 0 };
        const swept = sweptByEvent.get(e.id) ?? 0;
        return {
          event_id: e.id,
          event_label:
            e.groom_name && e.bride_name
              ? `${e.groom_name} & ${e.bride_name}`
              : e.child_name
              ? e.child_name
              : e.family_name
              ? `משפחת ${e.family_name}`
              : e.id.slice(0, 8),
          event_date: e.event_date,
          seller_payme_id: e.seller_payme_id,
          payment_setup_status: e.payment_setup_status,
          collected: agg.collected,
          swept,
          pending: Math.max(0, +(agg.collected - swept).toFixed(2)),
          gifts: agg.gifts,
          installmentCount: agg.installmentCount,
          txCount: agg.txCount,
        };
      });

      // Roll up per-partner aggregates so the admin can see how much is owed to each partner.
      const partnersList = (partnersRes ?? []) as any[];
      const partnerAgg = new Map<string, { partnerShare: number; platformShare: number; txCount: number; gifts: number }>();
      for (const t of completedTx) {
        if (!t.partner_id) continue;
        const cur = partnerAgg.get(t.partner_id) ?? { partnerShare: 0, platformShare: 0, txCount: 0, gifts: 0 };
        cur.partnerShare += Number(t.partner_share) || 0;
        cur.platformShare += Number(t.platform_partner_share) || 0;
        cur.gifts += Number(t.gift_amount) || Number(t.amount) || 0;
        cur.txCount += 1;
        partnerAgg.set(t.partner_id, cur);
      }
      const partnerRows = partnersList.map((p) => {
        const agg = partnerAgg.get(p.id) ?? { partnerShare: 0, platformShare: 0, txCount: 0, gifts: 0 };
        return {
          id: p.id,
          name: p.name as string,
          partner_pct: Number(p.partner_commission_pct) || 0,
          platform_pct: Number(p.platform_commission_pct) || 0,
          ...agg,
        };
      });

      return { events: eventRows, transfers, payouts, partners: partnerRows };
    },
  });

  // Platform-wide totals for the hero tiles.
  const totals = useMemo(() => {
    let collected = 0;
    let swept = 0;
    let pending = 0;
    let gifts = 0;
    for (const e of rows.events) {
      collected += e.collected;
      swept += e.swept;
      pending += e.pending;
      gifts += e.gifts;
    }
    const paidOut = rows.payouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { collected, swept, pending, gifts, paidOut };
  }, [rows]);

  // Per-tab filtering on the search box.
  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows.events;
    return rows.events.filter(
      (e) =>
        e.event_label.toLowerCase().includes(q) ||
        (e.seller_payme_id ?? "").toLowerCase().includes(q),
    );
  }, [rows.events, search]);

  const eventLabelById = useMemo(() => {
    const m = new Map<string, string>();
    rows.events.forEach((e) => m.set(e.event_id, e.event_label));
    return m;
  }, [rows.events]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="w-7 h-7 text-[#1a2942]" />
        <h1 className="text-2xl font-bold text-[#1a2942]">דשבורד ארנקים</h1>
      </div>

      {/* Top stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatTile
          label="עמלות שנגבו"
          value={formatILS(totals.collected)}
          subtitle="סה״כ פלטפורמה"
          accent="bg-emerald-50 border-emerald-200"
        />
        <StatTile
          label="הועברו ל-giftkal"
          value={formatILS(totals.swept)}
          subtitle="ארנק מאסטר"
          accent="bg-blue-50 border-blue-200"
        />
        <StatTile
          label="זמין לסחיטה"
          value={formatILS(totals.pending)}
          subtitle="ממתין להעברה"
          accent="bg-amber-50 border-amber-400 border-2"
          alert={totals.pending > 0}
        />
        <StatTile
          label="מתנות שניתנו"
          value={formatILS(totals.gifts)}
          subtitle="לזוגות"
          accent="bg-purple-50 border-purple-200"
        />
        <StatTile
          label="שולם לזוגות"
          value={formatILS(totals.paidOut)}
          subtitle="לחשבונות בנק"
          accent="bg-slate-50 border-slate-200"
        />
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 mb-4">
        <TabButton active={tab === "events"} onClick={() => setTab("events")} icon={<Building2 className="w-4 h-4" />}>
          לפי אירוע ({rows.events.length})
        </TabButton>
        <TabButton active={tab === "sweeps"} onClick={() => setTab("sweeps")} icon={<TrendingUp className="w-4 h-4" />}>
          העברות לעמלה ({rows.transfers.length})
        </TabButton>
        <TabButton active={tab === "payouts"} onClick={() => setTab("payouts")} icon={<ArrowDownToLine className="w-4 h-4" />}>
          משיכות לבנק ({rows.payouts.length})
        </TabButton>
        <TabButton active={tab === "partners"} onClick={() => setTab("partners")} icon={<Wallet className="w-4 h-4" />}>
          שותפים ({rows.partners.length})
        </TabButton>

        <div className="relative ml-auto w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש..."
            className="pr-9"
          />
        </div>
      </div>

      {/* Tab body */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> טוען נתונים...
          </div>
        ) : tab === "events" ? (
          <EventsTable rows={filteredEvents} onTransfer={openTransfer} />
        ) : tab === "sweeps" ? (
          <SweepsTable rows={rows.transfers} eventLabel={eventLabelById} />
        ) : tab === "payouts" ? (
          <PayoutsTable rows={rows.payouts} eventLabel={eventLabelById} />
        ) : (
          <PartnersTable rows={rows.partners} />
        )}
      </div>

      {/* In-dashboard transfer dialog */}
      <Dialog open={!!transferTarget} onOpenChange={(open) => !open && setTransferTarget(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-700" />
              העברת עמלה ל-giftkal
            </DialogTitle>
          </DialogHeader>
          {transferTarget && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-amber-900">{transferTarget.event_label}</div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div>
                    <div className="text-amber-800/60">עמלות נגבו</div>
                    <div className="font-bold">{formatILS(transferTarget.collected)}</div>
                  </div>
                  <div>
                    <div className="text-amber-800/60">הועברו</div>
                    <div className="font-bold">{formatILS(transferTarget.swept)}</div>
                  </div>
                  <div>
                    <div className="text-amber-800/60">זמין</div>
                    <div className="font-bold text-amber-700">{formatILS(transferTarget.pending)}</div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm">סכום להעברה</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  הסכום מולא אוטומטית לפי היתרה הזמינה.
                </p>
              </div>

              <div>
                <Label className="text-sm">הערה (אופציונלי)</Label>
                <Input
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="למשל: סגירת חודש יוני"
                  className="mt-1"
                />
              </div>

              {transferTarget.payment_setup_status !== "approved" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ⚠ הסולק לא במצב 'מאושר'. PayMe ידחה את הבקשה.
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setTransferTarget(null)}>
                  ביטול
                </Button>
                <Button
                  onClick={() => transferMutation.mutate()}
                  disabled={transferMutation.isPending || !transferAmount || Number(transferAmount) <= 0}
                  className="bg-amber-700 hover:bg-amber-800 text-white"
                >
                  {transferMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "בצע העברה"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  subtitle,
  accent,
  alert,
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent: string;
  alert?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border p-4", accent)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-bold mt-1", alert && "text-amber-700")}>{value}</div>
      {subtitle && <div className="text-[10px] text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full font-medium flex items-center gap-2 transition-colors text-sm",
        active ? "bg-[#1a2942] text-white" : "bg-white text-foreground border hover:bg-gray-50",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function EventsTable({
  rows,
  onTransfer,
}: {
  rows: EventRow[];
  onTransfer: (row: EventRow) => void;
}) {
  if (rows.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">אין אירועים לתצוגה.</div>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/40">
        <tr>
          <Th>אירוע</Th>
          <Th>תאריך</Th>
          <Th>סטטוס סולק</Th>
          <Th align="right">עסקאות</Th>
          <Th align="right">תשלומים</Th>
          <Th align="right">סה״כ מתנות</Th>
          <Th align="right">עמלות נגבו</Th>
          <Th align="right">הועברו</Th>
          <Th align="right">זמין להעברה</Th>
          <Th>פעולות</Th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r) => (
          <tr key={r.event_id} className={cn("hover:bg-muted/30", r.pending > 0 && "bg-amber-50/40")}>
            <Td>{r.event_label}</Td>
            <Td muted>{r.event_date ?? "—"}</Td>
            <Td><SellerStatusBadge status={r.payment_setup_status} /></Td>
            <Td align="right">{r.txCount}</Td>
            <Td align="right">
              {r.installmentCount > 0 ? (
                <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700">
                  {r.installmentCount}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Td>
            <Td align="right">{formatILS(r.gifts)}</Td>
            <Td align="right">{formatILS(r.collected)}</Td>
            <Td align="right" muted>{formatILS(r.swept)}</Td>
            <Td align="right" className={cn(r.pending > 0 && "font-bold text-amber-700")}>{formatILS(r.pending)}</Td>
            <Td>
              <Button
                size="sm"
                variant={r.pending > 0 ? "default" : "outline"}
                disabled={r.payment_setup_status !== "approved" || !r.seller_payme_id}
                onClick={() => onTransfer(r)}
                className={cn(
                  "h-8 gap-1.5",
                  r.pending > 0 && "bg-amber-700 hover:bg-amber-800 text-white",
                )}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                העבר
              </Button>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SweepsTable({ rows, eventLabel }: { rows: any[]; eventLabel: Map<string, string> }) {
  if (rows.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">עדיין לא בוצעו העברות עמלה.</div>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/40">
        <tr>
          <Th>נשלח</Th>
          <Th>אירוע</Th>
          <Th align="right">סכום</Th>
          <Th>סטטוס</Th>
          <Th>הושלם</Th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-muted/30">
            <Td muted>{formatRowDate(r.submitted_at)}</Td>
            <Td>{eventLabel.get(r.event_id) ?? r.event_id.slice(0, 8)}</Td>
            <Td align="right">{formatILS(Number(r.amount) || 0)}</Td>
            <Td><StatusPill value={r.status} /></Td>
            <Td muted>{r.completed_at ? formatRowDate(r.completed_at) : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PartnersTable({ rows }: { rows: Array<{ id: string; name: string; partner_pct: number; platform_pct: number; partnerShare: number; platformShare: number; txCount: number; gifts: number }> }) {
  if (rows.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">אין שותפים במערכת.</div>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/40">
        <tr>
          <Th>שותף</Th>
          <Th align="right">% שותף</Th>
          <Th align="right">% פלטפורמה</Th>
          <Th align="right">עסקאות</Th>
          <Th align="right">סה״כ מתנות דרכו</Th>
          <Th align="right">מגיע לשותף</Th>
          <Th align="right">מגיע לפלטפורמה</Th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-muted/30">
            <Td>{r.name}</Td>
            <Td align="right" muted>{r.partner_pct}%</Td>
            <Td align="right" muted>{r.platform_pct}%</Td>
            <Td align="right">{r.txCount}</Td>
            <Td align="right">{formatILS(r.gifts)}</Td>
            <Td align="right" className="font-bold text-purple-700">{formatILS(r.partnerShare)}</Td>
            <Td align="right" className="font-bold text-emerald-700">{formatILS(r.platformShare)}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PayoutsTable({ rows, eventLabel }: { rows: any[]; eventLabel: Map<string, string> }) {
  if (rows.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">עדיין לא בוצעו משיכות לבנק.</div>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/40">
        <tr>
          <Th>נשלח</Th>
          <Th>אירוע</Th>
          <Th>seller_payme_id</Th>
          <Th align="right">סכום</Th>
          <Th>סטטוס</Th>
          <Th>הושלם</Th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-muted/30">
            <Td muted>{formatRowDate(r.submitted_at)}</Td>
            <Td>{eventLabel.get(r.event_id) ?? r.event_id.slice(0, 8)}</Td>
            <Td muted className="font-mono text-xs">{r.seller_payme_id}</Td>
            <Td align="right">{r.amount ? formatILS(Number(r.amount)) : "יתרה מלאה"}</Td>
            <Td><StatusPill value={r.status} /></Td>
            <Td muted>{r.completed_at ? formatRowDate(r.completed_at) : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children, align = "right" }: { children: React.ReactNode; align?: "right" | "left" }) {
  return <th className={cn("py-3 px-4 font-medium text-muted-foreground text-xs", align === "right" ? "text-right" : "text-left")}>{children}</th>;
}

function Td({
  children,
  align = "right",
  muted,
  className,
}: {
  children: React.ReactNode;
  align?: "right" | "left";
  muted?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "py-3 px-4",
        align === "right" ? "text-right" : "text-left",
        muted && "text-muted-foreground",
        className,
      )}
    >
      {children}
    </td>
  );
}

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    submitted: "bg-amber-100 text-amber-800 border-amber-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px]", map[value] ?? "bg-gray-100 text-gray-700")}>
      {value}
    </Badge>
  );
}

function SellerStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  const map: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700",
    created: "bg-blue-100 text-blue-700",
    pending_approval: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
  };
  const label: Record<string, string> = {
    approved: "מאושר",
    created: "נוצר ב-PayMe",
    pending_approval: "ממתין",
    rejected: "נדחה",
  };
  return (
    <Badge variant="secondary" className={cn("text-[10px]", map[status])}>
      {label[status] ?? status}
    </Badge>
  );
}

function formatRowDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
