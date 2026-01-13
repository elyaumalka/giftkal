import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, User, Globe, Copy, ExternalLink, Loader2 } from "lucide-react";

export default function VenueSettings() {
  const [activeTab, setActiveTab] = useState<"user" | "landing">("user");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // File input refs
  const tabletLogoRef = useRef<HTMLInputElement>(null);
  const tabletBannerRef = useRef<HTMLInputElement>(null);
  const landingLogoRef = useRef<HTMLInputElement>(null);
  const landingGalleryRef = useRef<HTMLInputElement>(null);

  // Upload states
  const [uploadingTabletLogo, setUploadingTabletLogo] = useState(false);
  const [uploadingTabletBanner, setUploadingTabletBanner] = useState(false);
  const [uploadingLandingLogo, setUploadingLandingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

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

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!venue?.id) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${venue.id}/${folder}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('venue-assets')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      toast({ title: "שגיאה בהעלאת הקובץ", variant: "destructive" });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('venue-assets')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleTabletLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !venue?.id) return;

    setUploadingTabletLogo(true);
    const url = await uploadFile(file, 'tablet-logo');
    
    if (url) {
      await supabase
        .from("venues")
        .update({ logo_url: url })
        .eq("id", venue.id);
      
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      toast({ title: "הלוגו הועלה בהצלחה" });
    }
    setUploadingTabletLogo(false);
  };

  const handleTabletBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !venue?.id) return;

    setUploadingTabletBanner(true);
    const url = await uploadFile(file, 'tablet-banner');
    
    if (url) {
      await supabase
        .from("venues")
        .update({ banner_url: url })
        .eq("id", venue.id);
      
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      toast({ title: "הבאנר הועלה בהצלחה" });
    }
    setUploadingTabletBanner(false);
  };

  const handleLandingLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !venue?.id) return;

    setUploadingLandingLogo(true);
    const url = await uploadFile(file, 'landing-logo');
    
    if (url) {
      const config = venue.landing_page_config as any || {};
      await supabase
        .from("venues")
        .update({ 
          logo_url: url,
          landing_page_config: { ...config, logo: url }
        })
        .eq("id", venue.id);
      
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      toast({ title: "הלוגו הועלה בהצלחה" });
    }
    setUploadingLandingLogo(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !venue?.id) return;

    setUploadingGallery(true);
    const config = venue.landing_page_config as any || {};
    const existingGallery = config.gallery || [];
    const newGalleryUrls: string[] = [];

    for (const file of Array.from(files)) {
      const url = await uploadFile(file, 'gallery');
      if (url) newGalleryUrls.push(url);
    }

    if (newGalleryUrls.length > 0) {
      await supabase
        .from("venues")
        .update({ 
          landing_page_config: { 
            ...config, 
            gallery: [...existingGallery, ...newGalleryUrls] 
          }
        })
        .eq("id", venue.id);
      
      queryClient.invalidateQueries({ queryKey: ["venue-settings"] });
      toast({ title: `${newGalleryUrls.length} תמונות הועלו בהצלחה` });
    }
    setUploadingGallery(false);
  };

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

  const config = venue?.landing_page_config as any || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hidden file inputs */}
      <input type="file" ref={tabletLogoRef} className="hidden" accept="image/*" onChange={handleTabletLogoUpload} />
      <input type="file" ref={tabletBannerRef} className="hidden" accept="image/*" onChange={handleTabletBannerUpload} />
      <input type="file" ref={landingLogoRef} className="hidden" accept="image/*" onChange={handleLandingLogoUpload} />
      <input type="file" ref={landingGalleryRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />

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
                  <button 
                    onClick={() => tabletLogoRef.current?.click()}
                    disabled={uploadingTabletLogo}
                    className="w-full h-10 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploadingTabletLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {venue?.logo_url ? "החלף לוגו" : "העלאת לוגו"}
                  </button>
                  {venue?.logo_url && (
                    <img src={venue.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded-lg mt-2" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">העלאת באנר פרסומי</Label>
                  <button 
                    onClick={() => tabletBannerRef.current?.click()}
                    disabled={uploadingTabletBanner}
                    className="w-full h-10 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploadingTabletBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {venue?.banner_url ? "החלף באנר" : "העלאת באנר"}
                  </button>
                  {venue?.banner_url && (
                    <img src={venue.banner_url} alt="Banner" className="w-full h-12 object-cover rounded-lg mt-2" />
                  )}
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
                  <button 
                    onClick={() => landingLogoRef.current?.click()}
                    disabled={uploadingLandingLogo}
                    className="w-full h-20 rounded-xl border border-dashed border-gray-300 text-[#95742F] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploadingLandingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {venue?.logo_url ? "החלף לוגו אולם" : "העלאת לוגו אולם"}
                  </button>
                  {venue?.logo_url && (
                    <img src={venue.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg mx-auto mt-2" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[#051839] font-medium">העלאת תמונות אוירה</Label>
                  <button 
                    onClick={() => landingGalleryRef.current?.click()}
                    disabled={uploadingGallery}
                    className="w-full h-20 rounded-xl border border-dashed border-gray-300 text-[#95742F] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploadingGallery ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    העלאת קבצי תמונות
                  </button>
                  {config.gallery?.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {config.gallery.slice(0, 4).map((url: string, i: number) => (
                        <img key={i} src={url} alt={`Gallery ${i}`} className="w-12 h-12 object-cover rounded-lg" />
                      ))}
                      {config.gallery.length > 4 && (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                          +{config.gallery.length - 4}
                        </div>
                      )}
                    </div>
                  )}
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