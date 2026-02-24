import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Download, Eye, FileText, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

export default function EventGifts() {
  const { toast } = useToast();
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"images" | "pdf" | null>(null);

  const { data: gifts } = useQuery({
    queryKey: ["event-gifts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!event) return [];

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("event_id", event.id)
        .order("transaction_date", { ascending: false });

      return data || [];
    },
  });

  const handleExportExcel = () => {
    if (!gifts || gifts.length === 0) {
      toast({ title: "אין נתונים לייצוא", variant: "destructive" });
      return;
    }

    const excelData = gifts.map((g: any) => ({
      "שם": g.payer_name,
      "סכום": g.amount,
      "תשלומים": g.installments || 1,
      "קירבה": g.relationship || "",
      "טלפון": g.payer_phone || "",
      "אימייל": g.payer_email || "",
      "ברכה": g.blessing_text || "",
      "תאריך": new Date(g.transaction_date).toLocaleDateString("he-IL"),
      "סטטוס": g.payment_status === "completed" ? "הושלם" : g.payment_status || "",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "מתנות");
    ws["!cols"] = [
      { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
    ];
    XLSX.writeFile(wb, "מתנות_אירוע.xlsx");
    toast({ title: "הקובץ הורד בהצלחה!" });
  };

  const downloadSingleBlessing = async (gift: any) => {
    if (gift.receipt_url) {
      const link = document.createElement("a");
      link.href = gift.receipt_url;
      link.download = `ברכה_${gift.payer_name}.png`;
      link.target = "_blank";
      link.click();
    }
  };

  const downloadAllBlessings = async () => {
    const blessingsWithImages = gifts?.filter((g: any) => g.receipt_url) || [];
    if (blessingsWithImages.length === 0) {
      toast({ title: "אין ברכות מעוצבות להורדה", variant: "destructive" });
      return;
    }

    setDownloadingAll(true);
    try {
      for (const gift of blessingsWithImages) {
        await downloadSingleBlessing(gift);
        // Small delay between downloads
        await new Promise(r => setTimeout(r, 500));
      }
      toast({ title: `${blessingsWithImages.length} ברכות הורדו בהצלחה!` });
    } catch (err) {
      toast({ title: "שגיאה בהורדת הברכות", variant: "destructive" });
    } finally {
      setDownloadingAll(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (status === "completed") return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">הושלם</span>;
    if (status === "pending") return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">ממתין</span>;
    if (status === "failed") return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">נכשל</span>;
    return <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">{status || "—"}</span>;
  };

  const totalAmount = gifts?.reduce((sum: number, g: any) => sum + Number(g.amount), 0) || 0;
  const completedGifts = gifts?.filter((g: any) => g.payment_status === "completed") || [];
  const totalCompleted = completedGifts.reduce((sum: number, g: any) => sum + Number(g.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">סה״כ מתנות</p>
          <p className="text-2xl font-bold text-[#051839]">{gifts?.length || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">סה״כ סכום</p>
          <p className="text-2xl font-bold text-[#051839]">₪{totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">תשלומים שהושלמו</p>
          <p className="text-2xl font-bold text-green-600">₪{totalCompleted.toLocaleString()}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <Button 
          onClick={handleExportExcel}
          variant="outline"
          className="bg-white border-gray-300 text-[#051839] rounded-lg px-5 py-2.5 text-sm font-medium"
        >
          <FileText className="w-4 h-4 ml-2" />
          ייצוא לאקסל
        </Button>
        <Button 
          onClick={downloadAllBlessings}
          disabled={downloadingAll}
          className="bg-[#051839] hover:bg-[#08275E] text-white rounded-lg px-5 py-2.5 text-sm font-medium"
        >
          {downloadingAll ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <Image className="w-4 h-4 ml-2" />
          )}
          {downloadingAll ? "מוריד..." : "הורדת כל הברכות"}
        </Button>
      </div>

      {/* Gifts Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#051839] mb-6 text-right">נותני מתנות</h2>
          
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_0.8fr_auto] gap-3 text-sm font-medium text-gray-500 mb-4 px-4">
            <span>שם</span>
            <span>סכום</span>
            <span>תשלומים</span>
            <span>קירבה</span>
            <span>סטטוס</span>
            <span className="w-24"></span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-2">
            {gifts?.map((gift: any) => (
              <div 
                key={gift.id} 
                className="grid grid-cols-[2fr_1fr_0.8fr_1fr_0.8fr_auto] gap-3 items-center bg-gray-50 rounded-xl p-4 text-sm hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="font-bold text-[#051839] block">{gift.payer_name}</span>
                  {gift.payer_phone && <span className="text-gray-400 text-xs">{gift.payer_phone}</span>}
                </div>
                <span className="font-bold text-[#051839]">
                  ₪{Number(gift.amount).toLocaleString()}
                </span>
                <span className="text-[#051839]">
                  {gift.installments || 1}
                </span>
                <span className="text-[#051839]">
                  {gift.relationship || "—"}
                </span>
                <div>
                  {getStatusBadge(gift.payment_status)}
                </div>
                <div className="w-24 flex gap-1.5">
                  {(gift.blessing_text || gift.receipt_url) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          className="bg-[#051839] hover:bg-[#08275E] text-white rounded-lg px-2.5 py-1.5 text-xs h-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl p-0 overflow-hidden" dir="rtl">
                        <DialogHeader className="bg-[#051839] text-white p-6">
                          <DialogTitle className="text-right text-xl font-bold">
                            ברכה מ{gift.payer_name}
                          </DialogTitle>
                          <p className="text-white/60 text-sm text-right">
                            ₪{Number(gift.amount).toLocaleString()} · {gift.relationship || "לא צוין"} · {new Date(gift.transaction_date).toLocaleDateString("he-IL")}
                          </p>
                        </DialogHeader>
                        <div className="p-6 space-y-4">
                          {gift.receipt_url ? (
                            <div className="flex flex-col items-center gap-4">
                              <img 
                                src={gift.receipt_url} 
                                alt="ברכה מעוצבת" 
                                className="max-w-full max-h-[55vh] rounded-xl shadow-lg object-contain"
                              />
                              <Button
                                onClick={() => downloadSingleBlessing(gift)}
                                variant="outline"
                                className="text-sm"
                              >
                                <Download className="w-4 h-4 ml-2" />
                                הורד ברכה
                              </Button>
                            </div>
                          ) : gift.blessing_text ? (
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                              <p className="text-lg leading-relaxed text-right text-[#051839] whitespace-pre-wrap">
                                {gift.blessing_text}
                              </p>
                            </div>
                          ) : null}

                          {/* Payment details */}
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h4 className="font-bold text-[#051839] text-sm mb-3">פרטי תשלום</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">סכום:</span>{" "}
                                <span className="font-medium text-[#051839]">₪{Number(gift.amount).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">תשלומים:</span>{" "}
                                <span className="font-medium text-[#051839]">{gift.installments || 1}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">סטטוס:</span>{" "}
                                {getStatusBadge(gift.payment_status)}
                              </div>
                              <div>
                                <span className="text-gray-500">תאריך:</span>{" "}
                                <span className="font-medium text-[#051839]">{new Date(gift.transaction_date).toLocaleDateString("he-IL")}</span>
                              </div>
                              {gift.payer_email && (
                                <div className="col-span-2">
                                  <span className="text-gray-500">אימייל:</span>{" "}
                                  <span className="font-medium text-[#051839]">{gift.payer_email}</span>
                                </div>
                              )}
                              {gift.payme_transaction_id && (
                                <div className="col-span-2">
                                  <span className="text-gray-500">מזהה עסקה:</span>{" "}
                                  <span className="font-mono text-xs text-gray-600">{gift.payme_transaction_id}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {gift.receipt_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadSingleBlessing(gift)}
                      className="rounded-lg px-2.5 py-1.5 text-xs h-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {(!gifts || gifts.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">אין מתנות להצגה</p>
                <p className="text-sm mt-1">מתנות שיתקבלו יופיעו כאן</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
