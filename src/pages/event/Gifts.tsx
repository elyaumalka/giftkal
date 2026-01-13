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
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EventGifts() {
  const { toast } = useToast();

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
    toast({
      title: "מייצא לאקסל...",
      description: "הקובץ יורד בקרוב",
    });
  };

  const handleDownloadBlessings = () => {
    toast({
      title: "מוריד ברכות...",
      description: "קובץ PDF עם כל הברכות",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action Buttons - aligned to left */}
      <div className="flex items-center justify-end gap-4">
        <Button 
          onClick={handleExportExcel}
          variant="outline"
          className="bg-white border-gray-300 text-[#051839] rounded-lg px-6 py-3 text-sm font-medium"
        >
          ייצוא לאקסאל
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
        <Button 
          onClick={handleDownloadBlessings}
          className="bg-[#051839] hover:bg-[#08275E] text-white rounded-lg px-6 py-3 text-sm font-medium"
        >
          הורדת PDF של הברכות
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>

      {/* Gifts Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Title */}
          <h2 className="text-xl font-bold text-[#051839] mb-6 text-right">נותני מתנות</h2>
          
          {/* Table Header - RTL: שם פרטי ומשפחה, סכום, מס׳ תשלומים, קירבה, כפתור */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 text-sm font-medium text-gray-500 mb-4 px-4" dir="rtl">
            <span className="text-right">שם פרטי ומשפחה</span>
            <span className="text-right">סכום</span>
            <span className="text-right">מס׳ תשלומים</span>
            <span className="text-right">קירבה</span>
            <span className="w-28"></span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-3">
            {gifts?.map((gift: any) => (
              <div 
                key={gift.id} 
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center bg-gray-100 rounded-xl p-4 text-sm"
                dir="rtl"
              >
                <span className="font-bold text-[#051839] text-right">
                  {gift.payer_name}
                </span>
                <span className="font-bold text-[#051839] text-right">
                  ₪{Number(gift.amount).toLocaleString()}
                </span>
                <span className="font-bold text-[#051839] text-right">
                  {gift.installments || 1}
                </span>
                <span className="font-bold text-[#051839] text-right">
                  {gift.relationship || "—"}
                </span>
                <div className="w-28">
                  {gift.blessing_text ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-[#051839] hover:bg-[#08275E] text-white rounded-lg px-3 py-2 text-xs font-medium w-full"
                        >
                          צפייה בברכה
                          <ArrowLeft className="w-3 h-3 mr-1" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-right">ברכה מ{gift.payer_name}</DialogTitle>
                        </DialogHeader>
                        {gift.receipt_url ? (
                          <div className="flex justify-center">
                            <img 
                              src={gift.receipt_url} 
                              alt="ברכה מעוצבת" 
                              className="max-w-full rounded-xl shadow-lg"
                            />
                          </div>
                        ) : (
                          <p className="text-lg leading-relaxed text-right">{gift.blessing_text}</p>
                        )}
                      </DialogContent>
                    </Dialog>
                  ) : null}
                </div>
              </div>
            ))}
            
            {(!gifts || gifts.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                אין מתנות להצגה
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
