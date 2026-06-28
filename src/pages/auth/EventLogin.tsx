import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PartyPopper, LogIn, Eye, EyeOff, ArrowRight } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";

const EventLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast({ title: "⚠️ מייל חסר", description: "יש להזין כתובת מייל", variant: "destructive" }); return; }
    if (!password) { toast({ title: "⚠️ סיסמה חסרה", description: "יש להזין סיסמה", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast({ title: "❌ פרטים שגויים", description: "המייל או הסיסמה אינם נכונים", variant: "destructive" }); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        const role = roles?.[0]?.role;
        if (role === "event_owner") navigate("/event");
        else if (role === "venue_owner") navigate("/venue");
        else if (role === "admin") navigate("/admin");
        else navigate("/event");
      }
    } catch { toast({ title: "❌ שגיאה", description: "אירעה שגיאה בהתחברות", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,_hsl(38_92%_50%_/_0.12),_transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoAsset.url} alt="Giftkal" className="h-12 mx-auto mb-6" />
          </Link>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 space-y-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">כניסה לבעלי אירועים</h1>
            <p className="text-white/50 text-sm mt-1">הזינו את פרטי ההתחברות שלכם</p>
          </div>
          <div>
            <Label className="text-white/70 text-sm mb-2 block">כתובת מייל</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12" />
          </div>
          <div className="relative">
            <Label className="text-white/70 text-sm mb-2 block">סיסמה</Label>
            <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 pl-12" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-[38px] text-white/40 hover:text-white/70">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-gold text-white shadow-gold hover:shadow-lg text-lg">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-5 h-5 ml-2" /> כניסה</>}
          </Button>
          <button type="button" onClick={() => navigate("/reset-password")} className="w-full text-center text-primary/80 hover:text-primary text-sm">שכחתי סיסמה</button>
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

export default EventLogin;
