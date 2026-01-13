import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ImageIcon, Copy, ExternalLink } from "lucide-react";

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

      // Update profile
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq("user_id", user.id);

      // Update venue
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
      {/* Tabs */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setActiveTab("landing")}
          className={`px-8 py-3 rounded-full font-medium transition-colors ${
            activeTab === "landing"
              ? "bg-[#051839] text-white shadow-lg"
              : "bg-white text-[#051839] hover:bg-gray-100"
          }`}
        >
          הגדרות דף נחיתה
        </button>
        <button
          onClick={() => setActiveTab("user")}
          className={`px-8 py-3 rounded-full font-medium transition-colors ${
            activeTab === "user"
              ? "bg-[#051839] text-white shadow-lg"
              : "bg-white text-[#051839] hover:bg-gray-100"
          }`}
        >
          הגדרות משתמש
        </button>
      </div>

      {/* User Settings Tab */}
      {activeTab === "user" && (
        <div className="space-y-8">
          {/* Personal Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">כתובת מייל</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="כתובת מייל"
                  className="rounded-full border-0 bg-white text-right h-12"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">מספר טלפון</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="מספר טלפון"
                  className="rounded-full border-0 bg-white text-right h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">שם פרטי ומשפחה</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="שם פרטי ומשפחה"
                  className="rounded-full border-0 bg-white text-right h-12"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => updateUserSettings.mutate()}
                className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-full py-3 px-8 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <span>שמירה</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">כתובת האולם</Label>
                <Input
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="כתובת האולם"
                  className="rounded-full border-0 bg-white text-right h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">שם האולם</Label>
                <Input
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="שם האולם"
                  className="rounded-full border-0 bg-white text-right h-12"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="text-[#051839] font-bold text-right">פרטים לחשבונית</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">כתובת מייל</Label>
                <Input
                  type="email"
                  value={invoiceEmail}
                  onChange={(e) => setInvoiceEmail(e.target.value)}
                  placeholder="כתובת מייל"
                  className="rounded-full border-0 bg-white text-right h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">ח.פ/ע"מ</Label>
                <Input
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="ח.פ/ע״מ"
                  className="rounded-full border-0 bg-white text-right h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">שם העסק</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="שם העסק"
                  className="rounded-full border-0 bg-white text-right h-12"
                />
              </div>
            </div>
            <button 
              onClick={() => updateInvoiceSettings.mutate()}
              className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-full py-3 px-8 flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <span>שמירה</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Tablet Settings */}
          <div className="space-y-4">
            <h3 className="text-[#051839] font-bold text-right">הגדרות לטאבלטים</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">העלאת באנר פרסומי</Label>
                <div className="bg-white rounded-full h-12 flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">העלאת לוגו</Label>
                <div className="bg-white rounded-full h-12 flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#051839] font-medium text-right block">שם האולם</Label>
                <Input
                  value={tabletVenueName}
                  onChange={(e) => setTabletVenueName(e.target.value)}
                  placeholder="שם האולם"
                  className="rounded-full border-0 bg-white text-right h-12"
                />
              </div>
            </div>
            <button 
              onClick={() => updateTabletSettings.mutate()}
              className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-full py-3 px-8 flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <span>שמירה</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Landing Page Settings Tab */}
      {activeTab === "landing" && (
        <div className="space-y-6">
          {/* Landing Page Link */}
          {venue?.id && (
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(landingPageUrl, "_blank")}
                  className="px-4 py-2 bg-[#051839] text-white rounded-full text-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  צפייה בדף
                </button>
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-[#95742F] text-white rounded-full text-sm flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  העתק לינק
                </button>
              </div>
              <div className="text-right">
                <p className="text-[#051839] font-medium">קישור לדף הנחיתה שלך:</p>
                <p className="text-gray-500 text-sm truncate max-w-md" dir="ltr">{landingPageUrl}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-right block">שם האולם</Label>
              <Input
                value={landingVenueName}
                onChange={(e) => setLandingVenueName(e.target.value)}
                placeholder="שם האולם"
                className="rounded-full border-0 bg-white text-right h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-right block">מספר טלפון</Label>
              <Input
                value={landingPhone}
                onChange={(e) => setLandingPhone(e.target.value)}
                placeholder="מספר טלפון"
                className="rounded-full border-0 bg-white text-right h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-right block">מספר וואטצאפ</Label>
              <Input
                value={landingWhatsapp}
                onChange={(e) => setLandingWhatsapp(e.target.value)}
                placeholder="מספר וואטצאפ"
                className="rounded-full border-0 bg-white text-right h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-right block">כתובת מייל</Label>
              <Input
                type="email"
                value={landingEmail}
                onChange={(e) => setLandingEmail(e.target.value)}
                placeholder="כתובת מייל"
                className="rounded-full border-0 bg-white text-right h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-right block">אודות האולם</Label>
              <Textarea
                value={landingAbout}
                onChange={(e) => setLandingAbout(e.target.value)}
                placeholder="תיאור האולם..."
                className="rounded-2xl border-0 bg-white text-right min-h-[150px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-right block">העלאת לוגו</Label>
              <div className="bg-white rounded-2xl p-6 flex items-center justify-center gap-3 text-[#95742F] cursor-pointer hover:bg-gray-50 transition-colors">
                <span>העלאת לוגו אולם</span>
                <ImageIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#051839] font-medium text-right block">העלאת תמונות אוירה</Label>
              <div className="bg-white rounded-2xl p-6 flex items-center justify-center gap-3 text-[#95742F] cursor-pointer hover:bg-gray-50 transition-colors">
                <span>העלאת קבצי תמונות</span>
                <ImageIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => updateLandingPage.mutate()}
            className="bg-[#C41E3A] hover:bg-[#C41E3A]/90 text-white rounded-full py-3 px-8 flex items-center justify-center gap-2 transition-colors font-medium w-fit"
          >
            <span>שמירת והעלאה לאוויר</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}