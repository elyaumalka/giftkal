import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Eye, EyeOff, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [data, setData] = useState({
    fullName: "", email: "", phone: "", password: "",
    eventDate: "", eventType: "חתונה", city: "", venueName: "",
    groomName: "", brideName: "", agreeTerms: false,
  });

  useEffect(() => {
    supabase.from("venues").select("id, name, address").then(({ data }) => {
      if (data) setVenues(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.fullName.trim()) { toast({ title: "⚠️ שם חסר", description: "יש להזין שם מלא", variant: "destructive" }); return; }
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { toast({ title: "⚠️ מייל לא תקין", description: "יש להזין כתובת מייל תקינה", variant: "destructive" }); return; }
    if (!data.phone.trim()) { toast({ title: "⚠️ טלפון חסר", description: "יש להזין מספר טלפון", variant: "destructive" }); return; }
    if (!data.password || data.password.length < 6) { toast({ title: "⚠️ סיסמה קצרה", description: "הסיסמה חייבת להכיל לפחות 6 תווים", variant: "destructive" }); return; }
    if (!data.eventDate) { toast({ title: "⚠️ תאריך חסר", description: "יש לבחור תאריך אירוע", variant: "destructive" }); return; }
    if (!data.agreeTerms) { toast({ title: "⚠️ תנאי שירות", description: "יש לאשר את תנאי השירות כדי להמשיך", variant: "destructive" }); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        full_name: data.fullName,
        phone: data.phone,
        email: data.email,
        lead_type: "couple",
        venue_name: data.venueName || null,
        venue_address: data.city || null,
        status: "new",
      });
      if (error) throw error;
      toast({ title: "✅ הפרטים נשלחו בהצלחה!", description: "ניצור איתך קשר בהקדם להשלמת ההרשמה. תשלום ראשוני: ₪200" });
      setData({ fullName: "", email: "", phone: "", password: "", eventDate: "", eventType: "חתונה", city: "", venueName: "", groomName: "", brideName: "", agreeTerms: false });
    } catch { toast({ title: "❌ שגיאה", description: "אירעה שגיאה בשליחת הפרטים", variant: "destructive" }); }
    finally { setLoading(false); }
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

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 space-y-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">הצטרפו ל-Giftkal</h1>
            <p className="text-white/50 text-sm mt-1">פתחו אירוע חדש ב-2 דקות • תשלום ראשוני ₪200</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70 text-sm mb-2 block">שם מלא *</Label>
              <Input value={data.fullName} onChange={e => setData({...data, fullName: e.target.value})} placeholder="השם שלכם" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-2 block">טלפון *</Label>
              <Input value={data.phone} onChange={e => setData({...data, phone: e.target.value})} placeholder="050-0000000" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
            </div>
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">כתובת מייל *</Label>
            <Input value={data.email} onChange={e => setData({...data, email: e.target.value})} placeholder="your@email.com" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
          </div>

          <div className="relative">
            <Label className="text-white/70 text-sm mb-2 block">בחרו סיסמה *</Label>
            <Input type={showPassword ? "text" : "password"} value={data.password} onChange={e => setData({...data, password: e.target.value})} placeholder="לפחות 6 תווים" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 pl-12" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-[38px] text-white/40 hover:text-white/70">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70 text-sm mb-2 block">סוג אירוע</Label>
              <select value={data.eventType} onChange={e => setData({...data, eventType: e.target.value})} className="w-full h-12 rounded-xl bg-white/10 border border-white/20 text-white px-4 text-sm">
                <option value="חתונה" className="text-black">חתונה</option>
                <option value="בר מצווה" className="text-black">בר מצווה</option>
                <option value="בת מצווה" className="text-black">בת מצווה</option>
                <option value="ברית" className="text-black">ברית</option>
                <option value="אחר" className="text-black">אחר</option>
              </select>
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-2 block">תאריך אירוע *</Label>
              <Input type="date" value={data.eventDate} onChange={e => setData({...data, eventDate: e.target.value})} className="bg-white/10 border-white/20 text-white h-12" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70 text-sm mb-2 block">עיר</Label>
              <Input value={data.city} onChange={e => setData({...data, city: e.target.value})} placeholder="עיר האירוע" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-2 block">שם אולם (או השכרה)</Label>
              <Input value={data.venueName} onChange={e => setData({...data, venueName: e.target.value})} placeholder="שם האולם" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
            </div>
          </div>

          {data.eventType === "חתונה" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 text-sm mb-2 block">שם חתן</Label>
                <Input value={data.groomName} onChange={e => setData({...data, groomName: e.target.value})} placeholder="שם החתן" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
              </div>
              <div>
                <Label className="text-white/70 text-sm mb-2 block">שם כלה</Label>
                <Input value={data.brideName} onChange={e => setData({...data, brideName: e.target.value})} placeholder="שם הכלה" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <Checkbox id="terms" checked={data.agreeTerms} onCheckedChange={(checked) => setData({...data, agreeTerms: !!checked})} className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5" />
            <Label htmlFor="terms" className="text-white/60 text-sm leading-relaxed cursor-pointer">
              אני מאשר/ת את <span className="text-primary underline">תנאי השירות</span> ו<span className="text-primary underline">מדיניות הפרטיות</span> של Giftkal
            </Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-gold text-white shadow-gold hover:shadow-lg text-lg">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-5 h-5 ml-2" /> שלחו פרטים והצטרפו</>}
          </Button>
          <p className="text-center text-white/40 text-xs">לאחר אישור הפרטים ותשלום ₪200, נפתח לכם חשבון במערכת</p>
        </form>

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

export default Signup;
