import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, ArrowLeft, Sparkles, CheckCircle } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if there's a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "קישור לא תקין",
          description: "הקישור פג תוקף או לא תקין. נסה לבקש קישור חדש.",
          variant: "destructive",
        });
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "שגיאה",
        description: "הסיסמה חייבת להכיל לפחות 6 תווים",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "הסיסמה עודכנה בהצלחה!",
        description: "כעת תוכל להתחבר עם הסיסמה החדשה",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "שגיאה בעדכון הסיסמה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden" dir="rtl">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#051839] via-[#0A2F5C] to-[#051839]">
          <div className="absolute top-20 right-20 w-72 h-72 bg-[#C4A35A]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#C4A35A]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">הסיסמה עודכנה בהצלחה!</h2>
              <p className="text-white/70 mb-6">מעבירים אותך לעמוד ההתחברות...</p>
              <div className="w-8 h-8 border-2 border-white/30 border-t-[#C4A35A] rounded-full animate-spin mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#051839] via-[#0A2F5C] to-[#051839]">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#C4A35A]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#C4A35A]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C4A35A]/5 rounded-full blur-3xl" />
        
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
            <h1 className="text-3xl font-bold text-white mt-6 mb-2">איפוס סיסמה</h1>
            <p className="text-[#C4A35A] text-lg">הזן סיסמה חדשה</p>
          </div>

          {/* Reset Password Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] p-5 text-center">
              <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                סיסמה חדשה
              </h2>
            </div>
            
            {/* Form */}
            <div className="p-8">
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 font-medium text-sm">סיסמה חדשה</Label>
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
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/90 font-medium text-sm">אימות סיסמה</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[#C4A35A]/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C4A35A]" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-12 pl-12 h-14 bg-white/10 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-[#C4A35A] focus:ring-[#C4A35A]/20 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-[#C4A35A] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                      מעדכן...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      עדכן סיסמה
                      <ArrowLeft className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <a 
                  href="/login"
                  className="text-[#C4A35A] hover:text-[#D4B36A] text-sm font-medium transition-colors hover:underline underline-offset-4"
                >
                  חזרה להתחברות
                </a>
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
    </div>
  );
}
