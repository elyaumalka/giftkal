import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, User, Globe } from "lucide-react";

export default function VenueSettings() {
  const [activeTab, setActiveTab] = useState("user");
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
      <div>
        <h1 className="text-3xl font-bold">הגדרות</h1>
        <p className="text-muted-foreground mt-1">ניהול הגדרות האולם</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="user" className="gap-2">
            <User className="w-4 h-4" />
            הגדרות משתמש
          </TabsTrigger>
          <TabsTrigger value="landing" className="gap-2">
            <Globe className="w-4 h-4" />
            דף נחיתה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>פרטי האולם</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>שם האולם</Label>
                  <Input
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="שם האולם"
                  />
                </div>
                <div>
                  <Label>כתובת</Label>
                  <Input
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="כתובת האולם"
                  />
                </div>
                <div>
                  <Label>טלפון</Label>
                  <Input
                    value={venuePhone}
                    onChange={(e) => setVenuePhone(e.target.value)}
                    placeholder="טלפון"
                  />
                </div>
                <div>
                  <Label>מייל</Label>
                  <Input
                    type="email"
                    value={venueEmail}
                    onChange={(e) => setVenueEmail(e.target.value)}
                    placeholder="מייל"
                  />
                </div>
              </div>
              <div>
                <Label>לוגו האולם</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {venue?.logo_url ? (
                      <img src={venue.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 ml-2" />
                    העלאת לוגו
                  </Button>
                </div>
              </div>
              <Button onClick={() => updateVenue.mutate()}>
                <Save className="w-4 h-4 ml-2" />
                שמור
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות דף נחיתה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                דף הנחיתה מוצג לאורחים כשהם נכנסים לתת מתנה באולם שלך.
              </p>
              <div>
                <Label>כתובת לוגו</Label>
                <Input
                  value={landingLogo}
                  onChange={(e) => setLandingLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <Label>טלפון ליצירת קשר</Label>
                <Input
                  value={landingPhone}
                  onChange={(e) => setLandingPhone(e.target.value)}
                  placeholder="050-1234567"
                />
              </div>
              <Button onClick={() => updateLandingPage.mutate()}>
                <Save className="w-4 h-4 ml-2" />
                שמור הגדרות
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
