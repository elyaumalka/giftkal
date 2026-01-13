import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, User, Globe, ArrowLeft } from "lucide-react";

export default function VenueSettings() {
  const [activeTab, setActiveTab] = useState<"user" | "landing">("user");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // User settings state
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venuePhone, setVenuePhone] = useState("");
  const [venueEmail, setVenueEmail] = useState("");

  // Landing page settings
  const [landingLogo, setLandingLogo] = useState("");
  const [landingPhone, setLandingPhone] = useState("");

  const { data: venue } = useQuery({
    queryKey: ["venue-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("venues")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      return data;
    },
  });

  useEffect(() => {
    if (venue) {
      setVenueName(venue.name || "");
      setVenueAddress(venue.address || "");
      setVenuePhone(venue.phone || "");
      setVenueEmail(venue.email || "");
      setLandingLogo(venue.logo_url || "");
      setLandingPhone(venue.phone || "");
    }
  }, [venue]);

  const updateVenue = useMutation({
    mutationFn: async () => {
      if (!venue?.id) throw new Error("No venue found");

      const { error } = await supabase
        .from("venues")
        .update({
          name: venueName,
          address: venueAddress,
          phone: venuePhone,
          email: venueEmail,
        })
        .eq("id", venue.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      toast({ title: "ההגדרות נשמרו בהצלחה" });
    },
  });

  const updateLandingPage = useMutation({
    mutationFn: async () => {
      if (!venue?.id) throw new Error("No venue found");

      const config = {
        logo: landingLogo,
        phone: landingPhone,
      };

      const { error } = await supabase
        .from("venues")
        .update({
          landing_page_config: config,
          logo_url: landingLogo,
        })
        .eq("id", venue.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      toast({ title: "הגדרות דף הנחיתה נשמרו" });
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#051839]">הגדרות</h1>
        <p className="text-gray-500 mt-1">ניהול הגדרות האולם</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("user")}
          className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
            activeTab === "user"
              ? "bg-[#051839] text-white"
              : "bg-white text-[#051839] hover:bg-gray-100"
          }`}
        >
          <User className="w-4 h-4" />
          הגדרות משתמש
        </button>
        <button
          onClick={() => setActiveTab("landing")}
          className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
            activeTab === "landing"
              ? "bg-[#051839] text-white"
              : "bg-white text-[#051839] hover:bg-gray-100"
          }`}
        >
          <Globe className="w-4 h-4" />
          דף נחיתה
        </button>
      </div>

      {/* User Settings */}
      {activeTab === "user" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-[#051839] text-white p-4">
            <h2 className="text-lg font-semibold">פרטי האולם</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium">שם האולם</Label>
                <Input
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="שם האולם"
                  className="rounded-xl border-gray-200 text-center"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium">כתובת</Label>
                <Input
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="כתובת האולם"
                  className="rounded-xl border-gray-200 text-center"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium">טלפון</Label>
                <Input
                  value={venuePhone}
                  onChange={(e) => setVenuePhone(e.target.value)}
                  placeholder="טלפון"
                  className="rounded-xl border-gray-200 text-center"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium">מייל</Label>
                <Input
                  type="email"
                  value={venueEmail}
                  onChange={(e) => setVenueEmail(e.target.value)}
                  placeholder="מייל"
                  className="rounded-xl border-gray-200 text-center"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">לוגו האולם</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {venue?.logo_url ? (
                    <img src={venue.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <button className="px-4 py-2 rounded-xl border border-gray-200 text-[#051839] hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  העלאת לוגו
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => updateVenue.mutate()}
              className="w-full bg-[#051839] hover:bg-[#051839]/90 text-white rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
            >
              <span>שמור</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Landing Page Settings */}
      {activeTab === "landing" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-[#051839] text-white p-4">
            <h2 className="text-lg font-semibold">הגדרות דף נחיתה</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <p className="text-gray-500 text-sm">
              דף הנחיתה מוצג לאורחים כשהם נכנסים לתת מתנה באולם שלך.
            </p>
            
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">כתובת לוגו</Label>
              <Input
                value={landingLogo}
                onChange={(e) => setLandingLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="rounded-xl border-gray-200 text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">טלפון ליצירת קשר</Label>
              <Input
                value={landingPhone}
                onChange={(e) => setLandingPhone(e.target.value)}
                placeholder="050-1234567"
                className="rounded-xl border-gray-200 text-center"
              />
            </div>
            
            <button 
              onClick={() => updateLandingPage.mutate()}
              className="w-full bg-[#051839] hover:bg-[#051839]/90 text-white rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
            >
              <span>שמור הגדרות</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
