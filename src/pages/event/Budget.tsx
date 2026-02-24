import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Download, Edit2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import * as XLSX from "xlsx";

export default function EventBudget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [totalBudget, setTotalBudget] = useState<string>("");
  const [editingBudget, setEditingBudget] = useState(false);

  // Form state
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [notes, setNotes] = useState("");

  const { data } = useQuery({
    queryKey: ["event-budget"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: event } = await supabase
        .from("events")
        .select("id, total_budget")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!event) return null;

      const { data: categories } = await supabase
        .from("budget_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      const { data: items } = await supabase
        .from("budget_items")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at");

      return { event, categories: categories || [], items: items || [] };
    },
  });

  const saveBudgetMutation = useMutation({
    mutationFn: async (budget: number) => {
      const { error } = await supabase
        .from("events")
        .update({ total_budget: budget })
        .eq("id", data!.event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-budget"] });
      setEditingBudget(false);
      toast({ title: "✅ תקציב עודכן" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: any) => {
      if (editingItem) {
        const { error } = await supabase
          .from("budget_items")
          .update(item)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budget_items").insert(item);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-budget"] });
      resetForm();
      toast({ title: editingItem ? "✅ פריט עודכן" : "✅ פריט נוסף" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-budget"] });
      toast({ title: "🗑️ פריט נמחק" });
    },
  });

  const resetForm = () => {
    setCategoryId("");
    setCategoryName("");
    setPlannedAmount("");
    setActualAmount("");
    setNotes("");
    setEditingItem(null);
    setShowAddDialog(false);
  };

  const handleSubmit = () => {
    if (!categoryName.trim()) {
      toast({ title: "⚠️ קטגוריה חסרה", description: "יש לבחור קטגוריה", variant: "destructive" });
      return;
    }
    const planned = Number(plannedAmount) || 0;
    const actual = Number(actualAmount) || 0;
    if (planned < 0 || actual < 0) {
      toast({ title: "⚠️ סכום לא תקין", description: "סכום לא יכול להיות שלילי", variant: "destructive" });
      return;
    }

    addItemMutation.mutate({
      event_id: data!.event.id,
      category_id: categoryId || null,
      category_name: categoryName,
      planned_amount: planned,
      actual_amount: actual,
      notes: notes || null,
    });
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setCategoryId(item.category_id || "");
    setCategoryName(item.category_name);
    setPlannedAmount(String(item.planned_amount));
    setActualAmount(String(item.actual_amount));
    setNotes(item.notes || "");
    setShowAddDialog(true);
  };

  const handleExportExcel = () => {
    if (!data?.items.length) return;
    const rows = data.items.map((item: any) => ({
      "קטגוריה": item.category_name,
      "תקציב מתוכנן": Number(item.planned_amount),
      "הוצאה בפועל": Number(item.actual_amount),
      "הפרש": Number(item.planned_amount) - Number(item.actual_amount),
      "הערות": item.notes || "",
    }));
    const totalPlanned = data.items.reduce((s: number, i: any) => s + Number(i.planned_amount), 0);
    const totalActual = data.items.reduce((s: number, i: any) => s + Number(i.actual_amount), 0);
    rows.push({
      "קטגוריה": "סה״כ",
      "תקציב מתוכנן": totalPlanned,
      "הוצאה בפועל": totalActual,
      "הפרש": totalPlanned - totalActual,
      "הערות": "",
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "תקציב");
    XLSX.writeFile(wb, "budget.xlsx");
  };

  // Calculations
  const items = data?.items || [];
  const totalPlanned = items.reduce((s: number, i: any) => s + Number(i.planned_amount), 0);
  const totalActual = items.reduce((s: number, i: any) => s + Number(i.actual_amount), 0);
  const budgetLimit = Number(data?.event?.total_budget) || 0;
  const remaining = budgetLimit > 0 ? budgetLimit - totalActual : totalPlanned - totalActual;
  const isOver = remaining < 0;

  const getCategoryIcon = (name: string) => {
    const cat = data?.categories?.find((c: any) => c.name === name);
    return cat?.icon || "📋";
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <Wallet className="w-10 h-10 text-[#95742F] mb-2" />
          {editingBudget ? (
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-32 text-center"
                placeholder="סכום"
              />
              <Button size="sm" onClick={() => saveBudgetMutation.mutate(Number(totalBudget))}>שמור</Button>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-[#051839]">
                ₪{budgetLimit.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mb-1">תקציב כולל</p>
              <button
                onClick={() => { setTotalBudget(String(budgetLimit)); setEditingBudget(true); }}
                className="text-xs text-[#95742F] underline"
              >
                עריכה
              </button>
            </>
          )}
        </div>

        {/* Planned */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <TrendingUp className="w-10 h-10 text-blue-500 mb-2" />
          <p className="text-3xl font-bold text-[#051839]">₪{totalPlanned.toLocaleString()}</p>
          <p className="text-sm text-gray-500">מתוכנן</p>
        </div>

        {/* Actual */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <TrendingDown className="w-10 h-10 text-orange-500 mb-2" />
          <p className="text-3xl font-bold text-[#051839]">₪{totalActual.toLocaleString()}</p>
          <p className="text-sm text-gray-500">בפועל</p>
        </div>

        {/* Remaining */}
        <div className={`rounded-2xl p-6 shadow-sm flex flex-col items-center ${isOver ? "bg-red-50" : "bg-green-50"}`}>
          <Wallet className={`w-10 h-10 mb-2 ${isOver ? "text-red-500" : "text-green-500"}`} />
          <p className={`text-3xl font-bold ${isOver ? "text-red-600" : "text-green-600"}`}>
            ₪{Math.abs(remaining).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">{isOver ? "חריגה מהתקציב" : "יתרה"}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleExportExcel} disabled={!items.length}>
          <Download className="w-4 h-4 ml-2" />
          ייצוא לאקסל
        </Button>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-[#95742F] hover:bg-[#7d6228] text-white">
          <Plus className="w-4 h-4 ml-2" />
          הוספת פריט
        </Button>
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#051839] mb-6">פירוט הוצאות</h2>

          {/* Header */}
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500 mb-4 px-4">
            <span>קטגוריה</span>
            <span>תקציב מתוכנן</span>
            <span>הוצאה בפועל</span>
            <span>הפרש</span>
            <span>הערות</span>
            <span>פעולות</span>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {items.map((item: any) => {
              const diff = Number(item.planned_amount) - Number(item.actual_amount);
              return (
                <div key={item.id} className="grid grid-cols-6 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm">
                  <span className="font-bold text-[#051839] flex items-center gap-2">
                    <span>{getCategoryIcon(item.category_name)}</span>
                    {item.category_name}
                  </span>
                  <span className="font-bold text-[#051839]">₪{Number(item.planned_amount).toLocaleString()}</span>
                  <span className="font-bold text-[#051839]">₪{Number(item.actual_amount).toLocaleString()}</span>
                  <span className={`font-bold ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {diff >= 0 ? "+" : ""}₪{diff.toLocaleString()}
                  </span>
                  <span className="text-gray-500 truncate">{item.notes || "—"}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="p-2 hover:bg-gray-200 rounded-lg">
                      <Edit2 className="w-4 h-4 text-[#95742F]" />
                    </button>
                    <button onClick={() => deleteItemMutation.mutate(item.id)} className="p-2 hover:bg-red-100 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                אין פריטים בתקציב. לחץ על "הוספת פריט" כדי להתחיל
              </div>
            )}

            {/* Totals Row */}
            {items.length > 0 && (
              <div className="grid grid-cols-6 gap-4 items-center bg-[#051839] text-white rounded-xl p-4 text-sm font-bold mt-4">
                <span>סה״כ</span>
                <span>₪{totalPlanned.toLocaleString()}</span>
                <span>₪{totalActual.toLocaleString()}</span>
                <span className={totalPlanned - totalActual >= 0 ? "text-green-300" : "text-red-300"}>
                  {totalPlanned - totalActual >= 0 ? "+" : ""}₪{(totalPlanned - totalActual).toLocaleString()}
                </span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { if (!o) resetForm(); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingItem ? "עריכת פריט" : "הוספת פריט חדש"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">קטגוריה</label>
              <Select
                value={categoryId}
                onValueChange={(val) => {
                  setCategoryId(val);
                  const cat = data?.categories?.find((c: any) => c.id === val);
                  if (cat) setCategoryName(cat.name);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {data?.categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">תקציב מתוכנן (₪)</label>
              <Input
                type="number"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">הוצאה בפועל (₪)</label>
              <Input
                type="number"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">הערות</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הערות נוספות..."
                rows={2}
              />
            </div>

            <Button onClick={handleSubmit} className="w-full bg-[#95742F] hover:bg-[#7d6228] text-white">
              {editingItem ? "עדכון" : "הוספה"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
