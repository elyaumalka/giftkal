import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Search, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

const GiftSearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchName, setSearchName] = useState("");
  const [searchVenue, setSearchVenue] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    try {
      let query = supabase.from("events").select("id, groom_name, bride_name, child_name, family_name, event_date, event_type, venues(name)");
      if (searchDate) query = query.eq("event_date", searchDate);
      if (searchName) query = query.or(`groom_name.ilike.%${searchName}%,bride_name.ilike.%${searchName}%,child_name.ilike.%${searchName}%,family_name.ilike.%${searchName}%`);
      const { data } = await query.order("event_date", { ascending: true }).limit(10);
      setResults(data || []);
      if (!data?.length) toast({ title: "לא נמצאו אירועים", description: "נסה לחפש עם פרטים אחרים" });
    } catch { toast({ title: "שגיאה בחיפוש", variant: "destructive" }); }
    finally { setSearching(false); }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,_hsl(38_92%_50%_/_0.12),_transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="Giftkal" className="h-12 mx-auto mb-6" />
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 space-y-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">שלחו מתנה לאירוע</h1>
            <p className="text-white/50 text-sm mt-1">חפשו את האירוע לפי שם או תאריך ואולם</p>
          </div>
          <div>
            <Label className="text-white/70 text-sm mb-2 block">שם חתן / כלה / בעל האירוע</Label>
            <Input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="הזינו שם..." className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70 text-sm mb-2 block">תאריך אירוע</Label>
              <Input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="bg-white/10 border-white/20 text-white h-12" />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-2 block">אולם (אופציונלי)</Label>
              <Input value={searchVenue} onChange={e => setSearchVenue(e.target.value)} placeholder="שם האולם" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={searching || (!searchName && !searchDate)} className="w-full h-12 bg-gradient-gold text-white shadow-gold hover:shadow-lg text-lg">
            {searching ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search className="w-5 h-5 ml-2" /> חפשו אירוע</>}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-white/60 text-sm">נמצאו {results.length} אירועים:</p>
              {results.map((event: any) => (
                <div key={event.id} className="bg-white/10 rounded-2xl p-4 flex items-center justify-between border border-white/10">
                  <div className="text-right">
                    <p className="text-white font-bold">
                      {event.groom_name && event.bride_name ? `${event.groom_name} & ${event.bride_name}` : event.child_name || event.family_name || "אירוע"}
                    </p>
                    <p className="text-white/50 text-sm">
                      {new Date(event.event_date).toLocaleDateString("he-IL")} • {(event.venues as any)?.name || ""}
                    </p>
                  </div>
                  <Button onClick={() => navigate(`/gift/${event.id}`)} size="sm" className="bg-gradient-gold text-white rounded-full">
                    <Gift className="w-4 h-4 ml-1" />
                    שלחו מתנה
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-white/40 hover:text-white/70 text-sm inline-flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GiftSearch;
