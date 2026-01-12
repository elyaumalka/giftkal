import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Users, Building, Calendar, CreditCard } from "lucide-react";

interface SeedResult {
  success: boolean;
  message?: string;
  error?: string;
  users?: { email: string; password: string; role: string }[];
  data?: { venues: number; events: number; leads: number };
}

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);

  const handleSeedData = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-data');

      if (error) {
        throw error;
      }

      setResult(data);
      if (data.success) {
        toast.success('נתוני הדמה נוצרו בהצלחה!');
      } else {
        toast.error(data.error || 'שגיאה ביצירת נתונים');
      }
    } catch (error: any) {
      console.error('Error seeding data:', error);
      toast.error('שגיאה ביצירת נתוני דמה');
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">יצירת נתוני דמה</CardTitle>
          <CardDescription className="text-lg">
            צור משתמשי בדיקה ונתונים לבדיקת המערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!result ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                לחץ על הכפתור ליצירת משתמשי בדיקה ונתוני דמה למערכת.
                <br />
                הפעולה תיצור משתמשים, אולמות, אירועים, עסקאות ועוד.
              </p>
              <Button 
                onClick={handleSeedData} 
                disabled={loading}
                size="lg"
                className="w-full max-w-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    יוצר נתונים...
                  </>
                ) : (
                  'צור נתוני דמה'
                )}
              </Button>
            </div>
          ) : result.success ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-8 w-8" />
                <span className="text-xl font-semibold">{result.message}</span>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  משתמשי בדיקה:
                </h3>
                <div className="space-y-3">
                  {result.users?.map((user, index) => (
                    <div key={index} className="bg-background rounded-md p-3 border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-primary">{user.role}</span>
                      </div>
                      <div className="mt-2 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">אימייל:</span>
                          <code className="bg-muted px-2 py-0.5 rounded">{user.email}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">סיסמה:</span>
                          <code className="bg-muted px-2 py-0.5 rounded">{user.password}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Building className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{result.data?.venues}</div>
                  <div className="text-sm text-muted-foreground">אולמות</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{result.data?.events}</div>
                  <div className="text-sm text-muted-foreground">אירועים</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{result.data?.leads}</div>
                  <div className="text-sm text-muted-foreground">לידים</div>
                </div>
              </div>

              <div className="text-center">
                <Button variant="outline" onClick={() => window.location.href = '/login'}>
                  עבור לדף ההתחברות
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-red-500">שגיאה: {result.error}</p>
              <Button onClick={handleSeedData} disabled={loading}>
                נסה שוב
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;
