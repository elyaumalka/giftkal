import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, X, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logoAsset from "@/assets/logo.png.asset.json";

const GOLD = "#AE842D";
const NAVY = "#051839";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirectBasedOnRole(session.user.id);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          redirectBasedOnRole(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const redirectBasedOnRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles?.some((r) => r.role === "admin")) {
      navigate("/admin");
    } else if (roles?.some((r) => r.role === "venue_owner")) {
      navigate("/venue");
    } else if (roles?.some((r) => r.role === "event_owner")) {
      navigate("/event");
    } else {
      navigate("/");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({ title: "⚠️ מייל חסר", description: "יש להזין כתובת מייל כדי להתחבר", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "⚠️ מייל לא תקין", description: "יש להזין כתובת מייל תקינה, לדוגמה: name@email.com", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "⚠️ סיסמה חסרה", description: "יש להזין סיסמה כדי להתחבר", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "⚠️ סיסמה קצרה", description: "הסיסמה חייבת להכיל לפחות 6 תווים", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes("Invalid login")) {
          toast({ title: "❌ פרטים שגויים", description: "המייל או הסיסמה שהזנת אינם נכונים. נסה שוב.", variant: "destructive" });
        } else {
          toast({ title: "❌ שגיאה בהתחברות", description: error.message, variant: "destructive" });
        }
        return;
      }

      toast({ title: "התחברת בהצלחה!", description: "ברוך הבא למערכת" });
    } catch (error: any) {
      toast({ title: "שגיאה בהתחברות", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast({ title: "⚠️ מייל חסר", description: "יש להזין כתובת מייל לאיפוס סיסמה", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast({ title: "⚠️ מייל לא תקין", description: "יש להזין כתובת מייל תקינה, לדוגמה: name@email.com", variant: "destructive" });
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({ title: "נשלח בהצלחה!", description: "קישור לאיפוס סיסמה נשלח למייל שלך" });
      setShowResetDialog(false);
      setResetEmail("");
    } catch (error: any) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f5f5] relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl"
          style={{ background: GOLD }}
        />
        <div
          className="absolute -bottom-32 -left-24 w-[520px] h-[520px] rounded-full opacity-10 blur-3xl"
          style={{ background: NAVY }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          {/* Logo & headline */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src={logoAsset.url} alt="Giftkal Logo" className="h-20 mx-auto" />
            </Link>
            <span
              className="mt-6 inline-block rounded-[20px] px-4 py-1.5 text-[13px] font-semibold text-white uppercase"
              style={{ background: GOLD }}
            >
              בשמחות פלוס
            </span>
            <h1
              className="mt-4 font-extrabold text-[36px] lg:text-[44px] leading-[1.15]"
              style={{ color: NAVY }}
            >
              ברוכים הבאים
            </h1>
            <p className="mt-2 text-[16px] lg:text-[18px] font-light" style={{ color: GOLD }}>
              מערכת לגביית מתנות באירועים
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-[30px] shadow-[0_20px_60px_-20px_rgba(5,24,57,0.25)] border border-black/5 overflow-hidden">
            <div className="px-8 pt-8 pb-2 text-center">
              <h2 className="text-xl font-bold flex items-center justify-center gap-2" style={{ color: NAVY }}>
                <Sparkles className="w-5 h-5" style={{ color: GOLD }} />
                התחברות למערכת
              </h2>
            </div>

            <div className="p-8 pt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium text-sm" style={{ color: NAVY }}>
                    כתובת מייל
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: GOLD }} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-12 h-14 bg-[#f2f0eb] border-transparent rounded-2xl text-[#051839] placeholder:text-[#051839]/40 focus:border-[#AE842D] focus:ring-[#AE842D]/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium text-sm" style={{ color: NAVY }}>
                    סיסמה
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: GOLD }} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-12 pl-12 h-14 bg-[#f2f0eb] border-transparent rounded-2xl text-[#051839] placeholder:text-[#051839]/40 focus:border-[#AE842D] focus:ring-[#AE842D]/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#051839]/50 hover:text-[#AE842D] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-white rounded-2xl font-bold text-lg shadow-lg transition-all hover:opacity-95 hover:scale-[1.01]"
                  style={{ background: GOLD }}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      מתחבר...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      התחבר למערכת
                      <ArrowLeft className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  className="text-sm font-medium transition-colors hover:underline underline-offset-4"
                  style={{ color: GOLD }}
                >
                  שכחת סיסמה? לחץ כאן
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: `${NAVY}80` }}>
              © 2024 Giftkal. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="p-0 overflow-hidden rounded-[30px] border-0 max-w-md bg-white">
          <DialogHeader
            className="text-white p-5 flex flex-row items-center justify-between"
            style={{ background: GOLD }}
          >
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-5 h-5" />
              איפוס סיסמה
            </DialogTitle>
            <button
              onClick={() => setShowResetDialog(false)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="p-6 space-y-5" dir="rtl">
            <p className="text-center text-sm" style={{ color: `${NAVY}B3` }}>
              הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה
            </p>

            <div className="space-y-2">
              <Label htmlFor="resetEmail" className="font-medium text-sm" style={{ color: NAVY }}>
                כתובת מייל
              </Label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: GOLD }} />
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="example@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pr-12 h-14 bg-[#f2f0eb] border-transparent rounded-2xl text-[#051839] placeholder:text-[#051839]/40 focus:border-[#AE842D]"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-white rounded-2xl font-bold shadow-lg hover:opacity-95"
              style={{ background: GOLD }}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  שולח...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  שלח קישור לאיפוס
                  <ArrowLeft className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
