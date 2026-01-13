import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Guest {
  full_name: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

export function useExcelHandler(eventId: string | undefined, onGuestsUploaded?: () => void) {
  const { toast } = useToast();

  const downloadSampleExcel = () => {
    // יצירת קובץ אקסל לדוגמה
    const sampleData = [
      { שם_מלא: "ישראל ישראלי", טלפון: "0501234567", אימייל: "israel@example.com", קרבה: "משפחה" },
      { שם_מלא: "שרה כהן", טלפון: "0529876543", אימייל: "sarah@example.com", קרבה: "חברים" },
      { שם_מלא: "משה לוי", טלפון: "0541112233", אימייל: "moshe@example.com", קרבה: "עבודה" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "מוזמנים");

    // הגדרת רוחב עמודות
    worksheet["!cols"] = [
      { wch: 20 }, // שם מלא
      { wch: 15 }, // טלפון
      { wch: 25 }, // אימייל
      { wch: 15 }, // קרבה
    ];

    XLSX.writeFile(workbook, "רשימת_מוזמנים_דוגמה.xlsx");
    toast({ title: "קובץ הדוגמה הורד בהצלחה!" });
  };

  const handleExcelUpload = async (file: File) => {
    if (!eventId) {
      toast({ title: "לא נמצא אירוע", variant: "destructive" });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const guests: Guest[] = jsonData.map((row: any) => ({
        full_name: row["שם_מלא"] || row["שם מלא"] || row["name"] || "",
        phone: row["טלפון"] || row["phone"] || null,
        email: row["אימייל"] || row["email"] || null,
        relationship: row["קרבה"] || row["relationship"] || null,
      })).filter(g => g.full_name);

      if (guests.length === 0) {
        toast({ title: "לא נמצאו מוזמנים בקובץ", variant: "destructive" });
        return;
      }

      // הוספת המוזמנים לדאטאבייס
      const guestsToInsert = guests.map(g => ({
        ...g,
        event_id: eventId,
        invitation_sent: false,
      }));

      const { error } = await supabase.from("guests").insert(guestsToInsert);

      if (error) throw error;

      toast({ title: `${guests.length} מוזמנים נוספו בהצלחה!` });
      onGuestsUploaded?.();
    } catch (error: any) {
      console.error("Error uploading Excel:", error);
      toast({ title: "שגיאה בהעלאת הקובץ", description: error.message, variant: "destructive" });
    }
  };

  return { downloadSampleExcel, handleExcelUpload };
}
