import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PartyPopper, LogIn, Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";

const GOLD = "#AE842D";
const NAVY = "#051839";

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
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center relative overflow-hidden py-16" dir="rtl">
      <div className="pointer-events-none absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-30" style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }} />
      <div className="pointer-events-none absolute -bottom-40 -left-32 w-[560px] h-[560px] rounded-full blur-3xl opacity-25" style={{ background: `radial-gradient(circle, ${NAVY} 0%, transparent 70%)` }} />

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoAsset.url} alt="Giftkal" className="h-12 mx-auto mb-6" />
          </Link>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-[30px] p-8 space-y-5"
          style={{ boxShadow: "0 20px 60px -20px rgba(5,24,57,0.25)", border: `1px solid ${GOLD}22` }}
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4" style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD}CC 100%)` }}>
              <PartyPopper className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: NAVY }}>כניסה לבעלי אירועים</h1>
            <p className="text-sm mt-1" style={{ color: `${NAVY}99` }}>הזינו את פרטי ההתחברות שלכם</p>
          </div>

          <div>
            <Label className="text-sm mb-2 block text-right" style={{ color: NAVY }}>כתובת מייל</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: GOLD }} />
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-[#f2f0eb] border-transparent h-12 pr-10 focus:border-[#AE842D]"
                style={{ color: NAVY }}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm mb-2 block text-right" style={{ color: NAVY }}>סיסמה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: GOLD }} />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="bg-[#f2f0eb] border-transparent h-12 pr-10 pl-10 focus:border-[#AE842D]"
                style={{ color: NAVY }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: GOLD }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-row-reverse gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-full text-white text-base font-medium hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #8b6a25 100%)` }}
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ArrowLeft className="w-4 h-4 ml-2" /> כניסה</>}
            </Button>
            <button
              type="button"
              onClick={() => navigate("/reset-password")}
              className="text-sm hover:underline"
              style={{ color: GOLD }}
            >
              שכחתי סיסמה
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition-colors" style={{ color: NAVY, border: `1px solid ${GOLD}33` }}>
            <ArrowLeft className="w-4 h-4" />
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventLogin;
