import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Search, ArrowRight, Calendar, MapPin, Heart, PartyPopper, Users } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";

const eventTypeIcon = (type: string) => {
  switch (type) {
    case "חתונה": return Heart;
    case "בר מצווה": case "בת מצווה": return PartyPopper;
    default: return Users;
  }
};

const GiftSearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const today = new Date();
      // Allow gifts up to 3 days after event
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      try {
        const { data, error } = await supabase
          .from("public_events")
          .select("id, groom_name, bride_name, child_name, family_name, event_date, event_type, seller_payme_id, custom_venue_name")
          .gte("event_date", threeDaysAgo.toISOString().split("T")[0])
          .not("seller_payme_id", "is", null)
          .order("event_date", { ascending: true })
          .limit(50);
        if (error) {
          console.error("Failed to fetch events:", error);
          toast({ title: "שגיאה בטעינת אירועים", description: "נסו שוב מאוחר יותר", variant: "destructive" });
        }
        setEvents(data || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getEventTitle = (event: any) => {
    if (event.groom_name && event.bride_name) return `${event.groom_name} & ${event.bride_name}`;
    if (event.child_name) return event.child_name;
    if (event.family_name) return event.family_name;
    return "אירוע";
  };

  const filtered = events.filter((e) => {
    const title = getEventTitle(e).toLowerCase();
    const nameMatch = !filterName || title.includes(filterName.toLowerCase());
    const dateMatch = !filterDate || e.event_date === filterDate;
    const typeMatch = !filterType || e.event_type === filterType;
    return nameMatch && dateMatch && typeMatch;
  });

  const eventTypes = [...new Set(events.map(e => e.event_type))];

  return (
    <div className="min-h-screen bg-sidebar relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,_hsl(38_92%_50%_/_0.12),_transparent_70%)]" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/">
            <img src={logoAsset.url} alt="Giftkal" className="h-12 mx-auto mb-6" />
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">שלחו מתנה לאירוע</h1>
          <p className="text-white/50 text-lg">בחרו את האירוע מהרשימה ושלחו מתנה בקלות</p>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                placeholder="חיפוש לפי שם..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 pr-10"
              />
            </div>
            <div className="w-full sm:w-44">
              <Input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white h-11"
              />
            </div>
            <div className="w-full sm:w-40">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full h-11 rounded-xl bg-white/10 border border-white/20 text-white px-4 text-sm"
              >
                <option value="" className="text-black">כל הסוגים</option>
                {eventTypes.map(t => (
                  <option key={t} value={t} className="text-black">{t}</option>
                ))}
              </select>
            </div>
            {(filterName || filterDate || filterType) && (
              <Button
                variant="ghost"
                onClick={() => { setFilterName(""); setFilterDate(""); setFilterType(""); }}
                className="text-white/50 hover:text-white hover:bg-white/10 h-11 px-4"
              >
                נקה
              </Button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-white/10 mb-4" />
                  <div className="h-5 bg-white/10 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Gift className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 text-xl mb-2">לא נמצאו אירועים</p>
              <p className="text-white/30 text-sm">נסו לשנות את הסינון או לחפש שם אחר</p>
            </div>
          ) : (
            <>
              <p className="text-white/40 text-sm mb-4">{filtered.length} אירועים נמצאו</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((event, i) => {
                  const Icon = eventTypeIcon(event.event_type);
                  return (
                    <div
                      key={event.id}
                      className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col animate-fade-in"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-lg truncate">{getEventTitle(event)}</h3>
                          <span className="text-primary/70 text-xs font-medium">{event.event_type}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-5 flex-1">
                        <div className="flex items-center gap-2 text-white/50 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{new Date(event.event_date).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                        {event.custom_venue_name && (
                          <div className="flex items-center gap-2 text-white/50 text-sm">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{event.custom_venue_name}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => navigate(`/gift/${event.id}`)}
                        className="w-full bg-gradient-gold text-white shadow-gold hover:shadow-lg rounded-xl h-10 text-sm group-hover:scale-[1.02] transition-transform"
                      >
                        <Gift className="w-4 h-4 ml-2" />
                        שלחו מתנה
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-12">
          <Link to="/access" className="text-white/40 hover:text-white/70 text-sm inline-flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GiftSearch;
