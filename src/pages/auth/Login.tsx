import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, X, Sparkles, Gift, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logoAsset from "@/assets/logo.png.asset.json";

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          toast({ title: "❌ פרטים שגויים", description: "המייל או הסיסמה שהזנת אינם נכונים. נסה שוב.", variant: "destructive" });
        } else {
          toast({ title: "❌ שגיאה בהתחברות", description: error.message, variant: "destructive" });
        }
        return;
      }

      toast({
        title: "התחברת בהצלחה!",
        description: "ברוך הבא למערכת",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message,
        variant: "destructive",
      });
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

      toast({
        title: "נשלח בהצלחה!",
        description: "קישור לאיפוס סיסמה נשלח למייל שלך",
      });
      setShowResetDialog(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#051839] via-[#0A2F5C] to-[#051839]">
        {/* Floating Shapes */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#C4A35A]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#C4A35A]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C4A35A]/5 rounded-full blur-3xl" />
        
        {/* Decorative Icons */}
        <div className="absolute top-32 left-[15%] text-[#C4A35A]/20 animate-bounce" style={{ animationDuration: '3s' }}>
          <Gift className="w-12 h-12" />
        </div>
        <div className="absolute top-48 right-[20%] text-[#C4A35A]/15 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
          <Heart className="w-8 h-8" />
        </div>
        <div className="absolute bottom-32 right-[25%] text-[#C4A35A]/20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="absolute bottom-48 left-[30%] text-[#C4A35A]/15 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>
          <Gift className="w-6 h-6" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(196, 163, 90, 0.5) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-[#C4A35A]/30 blur-2xl rounded-full scale-150" />
              <img src={logoAsset.url} alt="Giftkal Logo" className="h-24 mx-auto relative z-10 drop-shadow-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-white mt-6 mb-2">ברוכים הבאים</h1>
            <p className="text-[#C4A35A] text-lg">מערכת לגביית מתנות באירועים</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] p-5 text-center">
              <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                התחברות למערכת
              </h2>
            </div>
            
            {/* Form */}
            <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90 font-medium text-sm">כתובת מייל</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[#C4A35A]/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C4A35A]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-12 h-14 bg-white/10 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-[#C4A35A] focus:ring-[#C4A35A]/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 font-medium text-sm">סיסמה</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[#C4A35A]/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C4A35A]" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-12 pl-12 h-14 bg-white/10 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-[#C4A35A] focus:ring-[#C4A35A]/20 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-[#C4A35A] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] hover:from-[#B4943A] hover:to-[#C4A35A] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#C4A35A]/25 transition-all hover:shadow-xl hover:shadow-[#C4A35A]/30 hover:scale-[1.02]" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

              {/* Forgot Password Link */}
              <div className="mt-6 text-center">
                <button 
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  className="text-[#C4A35A] hover:text-[#D4B36A] text-sm font-medium transition-colors hover:underline underline-offset-4"
                >
                  שכחת סיסמה? לחץ כאן
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm">
              © 2024 Giftkal. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="p-0 overflow-hidden rounded-3xl border-0 max-w-md bg-[#051839]">
          <DialogHeader className="bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] text-white p-5 flex flex-row items-center justify-between">
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
          
          <form onSubmit={handleResetPassword} className="p-6 space-y-5">
            <p className="text-white/70 text-center text-sm">
              הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="resetEmail" className="text-white/90 font-medium text-sm">כתובת מייל</Label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C4A35A]" />
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="example@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pr-12 h-14 bg-white/10 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-[#C4A35A]"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] hover:from-[#B4943A] hover:to-[#C4A35A] text-white rounded-xl font-bold shadow-lg" 
              disabled={resetLoading}
            >
              {resetLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
