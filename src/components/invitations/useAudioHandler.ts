import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useAudioHandler(eventId: string | undefined) {
  const { toast } = useToast();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAudioUpload = async (file: File) => {
    if (!eventId) {
      toast({ title: "לא נמצא אירוע", variant: "destructive" });
      return;
    }

    // בדיקת סוג קובץ
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/ogg"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
      toast({ title: "סוג קובץ לא נתמך", description: "יש להעלות קובץ שמע (MP3, WAV, M4A)", variant: "destructive" });
      return;
    }

    // בדיקת גודל קובץ (מקסימום 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "הקובץ גדול מדי", description: "גודל מקסימלי: 10MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${eventId}/audio_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
      
      setAudioFile(file);
      setAudioUrl(urlData.publicUrl);
      toast({ title: "קובץ השמע הועלה בהצלחה!" });
    } catch (error: any) {
      console.error("Error uploading audio:", error);
      toast({ title: "שגיאה בהעלאת קובץ השמע", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeAudio = () => {
    setAudioFile(null);
    setAudioUrl(null);
  };

  return { audioFile, audioUrl, isUploading, handleAudioUpload, removeAudio };
}
