import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_amount: number;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
  expires_at: string | null;
}

const Coupons = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newAmount, setNewAmount] = useState("50");
  const [newDesc, setNewDesc] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchCoupons = async () => {
    const { data, error } = await supabase.from("coupons" as any).select("*").order("created_at", { ascending: false });
    if (!error && data) setCoupons(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const addCoupon = async () => {
    if (!newCode.trim()) { toast({ title: "יש להזין קוד קופון", variant: "destructive" }); return; }
    setAdding(true);
    const { error } = await supabase.from("coupons" as any).insert({
      code: newCode.toUpperCase().trim(),
      discount_amount: Number(newAmount) || 50,
      description: newDesc || null,
      max_uses: newMaxUses ? Number(newMaxUses) : null,
    });
    if (error) {
      toast({ title: "שגיאה ביצירת קופון", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "קופון נוצר בהצלחה ✅" });
      setNewCode(""); setNewDesc(""); setNewAmount("50"); setNewMaxUses("");
      fetchCoupons();
    }
    setAdding(false);
  };

  const toggleCoupon = async (id: string, isActive: boolean) => {
    await supabase.from("coupons" as any).update({ is_active: !isActive }).eq("id", id);
    fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    await supabase.from("coupons" as any).delete().eq("id", id);
    fetchCoupons();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ניהול קופונים</h1>
          <p className="text-muted-foreground text-sm">יצירה וניהול קודי הנחה לתתי"ם, ישיבות ומוסדות</p>
        </div>
        <Tag className="w-8 h-8 text-primary" />
      </div>

      {/* Add coupon */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <h2 className="font-bold text-foreground">הוספת קופון חדש</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-sm mb-1 block">קוד קופון *</Label>
            <Input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="YESHIVA50" />
          </div>
          <div>
            <Label className="text-sm mb-1 block">סכום הנחה (₪)</Label>
            <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="50" />
          </div>
          <div>
            <Label className="text-sm mb-1 block">תיאור</Label>
            <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="הנחה לישיבות" />
          </div>
          <div>
            <Label className="text-sm mb-1 block">מקסימום שימושים</Label>
            <Input type="number" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} placeholder="ללא הגבלה" />
          </div>
        </div>
        <Button onClick={addCoupon} disabled={adding} variant="gold">
          {adding ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
          צור קופון
        </Button>
      </div>

      {/* Coupons list */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">אין קופונים</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right p-3 font-medium">קוד</th>
                <th className="text-right p-3 font-medium">הנחה</th>
                <th className="text-right p-3 font-medium">תיאור</th>
                <th className="text-right p-3 font-medium">שימושים</th>
                <th className="text-right p-3 font-medium">סטטוס</th>
                <th className="text-right p-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-3 font-mono font-bold">{c.code}</td>
                  <td className="p-3">₪{c.discount_amount}</td>
                  <td className="p-3 text-muted-foreground">{c.description || "-"}</td>
                  <td className="p-3">{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                  <td className="p-3">
                    <button onClick={() => toggleCoupon(c.id, c.is_active)} className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.is_active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                      {c.is_active ? "פעיל" : "מושבת"}
                    </button>
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="ghost" onClick={() => deleteCoupon(c.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Coupons;
