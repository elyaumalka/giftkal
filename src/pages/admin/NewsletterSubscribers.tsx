import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewsletterSubscribers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("להסיר את הנרשם מרשימת התפוצה?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) {
      toast({ title: "שגיאה במחיקה", variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
    toast({ title: "הוסר בהצלחה" });
  };

  const handleExport = () => {
    if (!subscribers?.length) return;
    const rows = [
      ["שם מלא", "מייל", "תאריך הרשמה"],
      ...subscribers.map((s) => [
        s.full_name,
        s.email,
        new Date(s.subscribed_at).toLocaleString("he-IL"),
      ]),
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between">
        <Button
          onClick={handleExport}
          disabled={!subscribers?.length}
          className="bg-[#c9a54e] hover:bg-[#b8943d] text-white rounded-full"
        >
          <Download className="w-4 h-4 ml-2" />
          ייצוא ל-CSV
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-secondary">נרשמים לרשימת תפוצה</h1>
          <p className="text-muted-foreground text-sm mt-1">
            סה"כ {subscribers?.length || 0} נרשמים
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.5fr_1fr_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
        <span>שם מלא</span>
        <span>כתובת מייל</span>
        <span>תאריך הרשמה</span>
        <span className="w-10"></span>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
            טוען...
          </div>
        )}
        {!isLoading &&
          subscribers?.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[1fr_1.5fr_1fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
            >
              <span className="text-center font-bold">{s.full_name}</span>
              <span className="text-center">{s.email}</span>
              <span className="text-center text-muted-foreground">
                {new Date(s.subscribed_at).toLocaleString("he-IL")}
              </span>
              <button
                onClick={() => handleDelete(s.id)}
                className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                aria-label="מחק"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        {!isLoading && !subscribers?.length && (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
            אין נרשמים עדיין
          </div>
        )}
      </div>
    </div>
  );
}
