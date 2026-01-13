import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, User, Globe, Copy, ExternalLink } from "lucide-react";

export default function VenueSettings() {
  const [activeTab, setActiveTab] = useState<"user" | "landing">("user");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // User settings state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  
  // Invoice settings
  const [businessName, setBusinessName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");

  // Tablet settings
  const [tabletVenueName, setTabletVenueName] = useState("");

  // Landing page settings state
  const [landingVenueName, setLandingVenueName] = useState("");
  const [landingPhone, setLandingPhone] = useState("");
  const [landingWhatsapp, setLandingWhatsapp] = useState("");
  const [landingEmail, setLandingEmail] = useState("");
  const [landingAbout, setLandingAbout] = useState("");

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

  const { data: profile } = useQuery({
    queryKey: ["profile-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return data;
    },
  });

  useEffect(() => {
    if (venue) {
      setVenueName(venue.name || "");
      setVenueAddress(venue.address || "");
      setTabletVenueName(venue.name || "");
      
      // Landing page config
      const config = venue.landing_page_config as any || {};
      setLandingVenueName(config.venue_name || venue.name || "");
      setLandingPhone(config.phone || venue.phone || "");
      setLandingWhatsapp(config.whatsapp || venue.phone || "");
      setLandingEmail(config.email || venue.email || "");
      setLandingAbout(config.about || "");
      setBusinessName(config.business_name || "");
      setBusinessId(config.business_id || "");
      setInvoiceEmail(config.invoice_email || venue.email || "");
    }
  }, [venue]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const updateUserSettings = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !venue?.id) throw new Error("No user or venue found");

      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq("user_id", user.id);

      await supabase
        .from("venues")
        .update({
          name: venueName,
          address: venueAddress,
        })
        .eq("id", venue.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
      toast({ title: "ההגדרות נשמרו בהצלחה" });
    },
  });

  const updateInvoiceSettings = useMutation({
    mutationFn: async () => {
      if (!venue?.id) throw new Error("No venue found");

      const config = venue.landing_page_config as any || {};
      
      await supabase
        .from("venues")
        .update({
          landing_page_config: {
            ...config,
            business_name: businessName,
            business_id: businessId,
            invoice_email: invoiceEmail,
          },
        })
        .eq("id", venue.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      toast({ title: "פרטי החשבונית נשמרו בהצלחה" });
    },
  });

  const updateTabletSettings = useMutation({
    mutationFn: async () => {
      if (!venue?.id) throw new Error("No venue found");

      const config = venue.landing_page_config as any || {};
      
      await supabase
        .from("venues")
        .update({
          landing_page_config: {
            ...config,
            tablet_venue_name: tabletVenueName,
          },
        })
        .eq("id", venue.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      toast({ title: "הגדרות הטאבלט נשמרו בהצלחה" });
    },
  });

  const updateLandingPage = useMutation({
    mutationFn: async () => {
      if (!venue?.id) throw new Error("No venue found");

      const config = venue.landing_page_config as any || {};

      const { error } = await supabase
        .from("venues")
        .update({
          landing_page_config: {
            ...config,
            venue_name: landingVenueName,
            phone: landingPhone,
            whatsapp: landingWhatsapp,
            email: landingEmail,
            about: landingAbout,
          },
        })
        .eq("id", venue.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      toast({ title: "דף הנחיתה נשמר והועלה לאוויר!" });
    },
  });

  const landingPageUrl = venue?.id ? `${window.location.origin}/landing/${venue.id}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(landingPageUrl);
    toast({ title: "הקישור הועתק ללוח" });
  };

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
          הגדרות דף נחיתה
        </button>
      </div>

      {/* User Settings Tab */}
      {activeTab === "user" && (
        <div className="space-y-6">
          {/* Personal Details Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#051839] text-white p-4">
              <h2 className="text-lg font-semibold">פרטים אישיים ופרטי האולם</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">שם פרטי ומשפחה</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="שם פרטי ומשפחה"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">מספר טלפון</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="מספר טלפון"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">כתובת מייל</Label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="rounded-xl border-gray-200 text-right bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">שם האולם</Label>
                  <Input
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="שם האולם"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[#051839] font-medium">כתובת האולם</Label>
                  <Input
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="כתובת האולם"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
              </div>
              
              <button 
                onClick={() => updateUserSettings.mutate()}
                className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-xl py-3 px-6 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <span>שמירה</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invoice Details Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#051839] text-white p-4">
              <h2 className="text-lg font-semibold">פרטים לחשבונית</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">שם העסק</Label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="שם העסק"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">ח.פ/ע"מ</Label>
                  <Input
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    placeholder="ח.פ/ע״מ"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">כתובת מייל לחשבונית</Label>
                  <Input
                    type="email"
                    value={invoiceEmail}
                    onChange={(e) => setInvoiceEmail(e.target.value)}
                    placeholder="כתובת מייל"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
              </div>
              
              <button 
                onClick={() => updateInvoiceSettings.mutate()}
                className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-xl py-3 px-6 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <span>שמירה</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tablet Settings Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#051839] text-white p-4">
              <h2 className="text-lg font-semibold">הגדרות לטאבלטים</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">שם האולם</Label>
                  <Input
                    value={tabletVenueName}
                    onChange={(e) => setTabletVenueName(e.target.value)}
                    placeholder="שם האולם"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">העלאת לוגו</Label>
                  <button className="w-full h-10 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    העלאת לוגו
                  </button>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">העלאת באנר פרסומי</Label>
                  <button className="w-full h-10 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    העלאת באנר
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => updateTabletSettings.mutate()}
                className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-xl py-3 px-6 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <span>שמירה</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landing Page Settings Tab */}
      {activeTab === "landing" && (
        <div className="space-y-6">
          {/* Landing Page Link Card */}
          {venue?.id && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-[#95742F] text-white p-4">
                <h2 className="text-lg font-semibold">קישור לדף הנחיתה שלך</h2>
              </div>
              <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-gray-500 text-sm truncate max-w-md" dir="ltr">{landingPageUrl}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyLink}
                    className="px-4 py-2 bg-[#051839] text-white rounded-xl text-sm flex items-center gap-2 hover:bg-[#051839]/90 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    העתק לינק
                  </button>
                  <button
                    onClick={() => window.open(landingPageUrl, "_blank")}
                    className="px-4 py-2 bg-[#95742F] text-white rounded-xl text-sm flex items-center gap-2 hover:bg-[#95742F]/90 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    צפייה בדף
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Landing Page Settings Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#051839] text-white p-4">
              <h2 className="text-lg font-semibold">הגדרות דף נחיתה</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">שם האולם</Label>
                  <Input
                    value={landingVenueName}
                    onChange={(e) => setLandingVenueName(e.target.value)}
                    placeholder="שם האולם"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">מספר טלפון</Label>
                  <Input
                    value={landingPhone}
                    onChange={(e) => setLandingPhone(e.target.value)}
                    placeholder="מספר טלפון"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">מספר וואטצאפ</Label>
                  <Input
                    value={landingWhatsapp}
                    onChange={(e) => setLandingWhatsapp(e.target.value)}
                    placeholder="מספר וואטצאפ"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">כתובת מייל</Label>
                  <Input
                    type="email"
                    value={landingEmail}
                    onChange={(e) => setLandingEmail(e.target.value)}
                    placeholder="כתובת מייל"
                    className="rounded-xl border-gray-200 text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#051839] font-medium">אודות האולם</Label>
                <Textarea
                  value={landingAbout}
                  onChange={(e) => setLandingAbout(e.target.value)}
                  placeholder="תיאור האולם..."
                  className="rounded-xl border-gray-200 text-right min-h-[120px] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">העלאת לוגו</Label>
                  <button className="w-full h-20 rounded-xl border border-dashed border-gray-300 text-[#95742F] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" />
                    העלאת לוגו אולם
                  </button>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">העלאת תמונות אוירה</Label>
                  <button className="w-full h-20 rounded-xl border border-dashed border-gray-300 text-[#95742F] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" />
                    העלאת קבצי תמונות
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => updateLandingPage.mutate()}
                className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-xl py-3 px-6 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <span>שמירת והעלאה לאוויר</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}