import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle, CreditCard, Building2, User, MapPin, Tag, Clock, XCircle, AlertTriangle, RefreshCw, Send } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

// Israeli banks
const BANKS = [
  { code: 4, name: 'בנק יהב' },
  { code: 9, name: 'בנק הדואר' },
  { code: 10, name: 'בנק לאומי' },
  { code: 11, name: 'בנק דיסקונט' },
  { code: 12, name: 'בנק הפועלים' },
  { code: 13, name: 'בנק אגוד' },
  { code: 14, name: 'בנק אוצר החייל' },
  { code: 17, name: 'מרכנתיל דיסקונט' },
  { code: 20, name: 'בנק מזרחי טפחות' },
  { code: 31, name: 'בנק הבינלאומי' },
  { code: 46, name: 'בנק מסד' },
  { code: 52, name: 'פועלי אגודת ישראל' },
  { code: 54, name: 'בנק ירושלים' },
];

// Hebrew to English transliteration map
const hebrewToEnglish: Record<string, string> = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
  'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
  'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'f',
  'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
};

function transliterateHebrew(text: string): string {
  return text.split('').map(char => {
    if (hebrewToEnglish[char]) return hebrewToEnglish[char];
    if (/[a-zA-Z0-9\s\-_]/.test(char)) return char;
    if (char === ' ') return ' ';
    return '';
  }).join('').replace(/\s+/g, ' ').trim();
}

// Validation schema
const formSchema = z.object({
  firstName: z.string().trim().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים').max(50),
  lastName: z.string().trim().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים').max(50),
  socialId: z.string().regex(/^\d{9}$/, 'תעודת זהות חייבת להכיל 9 ספרות'),
  birthdate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'תאריך בפורמט DD/MM/YYYY'),
  email: z.string().email('כתובת מייל לא תקינה').max(100),
  phone: z.string().regex(/^0\d{9}$/, 'מספר טלפון לא תקין (10 ספרות)'),
  bankCode: z.number().min(1, 'יש לבחור בנק'),
  bankBranch: z.string().regex(/^\d{1,4}$/, 'מספר סניף לא תקין'),
  bankAccountNumber: z.string().regex(/^\d{4,12}$/, 'מספר חשבון לא תקין'),
  incType: z.number().min(0).max(3),
  incCode: z.string().optional(),
  merchantName: z.string().trim().min(2, 'שם העסק חייב להכיל לפחות 2 תווים').max(100),
  merchantNameEn: z.string().trim().min(2, 'שם העסק באנגלית חייב להכיל לפחות 2 תווים').max(100).regex(/^[a-zA-Z0-9\s\-_]+$/, 'יש להזין רק תווים באנגלית'),
  city: z.string().trim().min(2, 'יש להזין עיר').max(50),
  street: z.string().trim().min(2, 'יש להזין רחוב').max(100),
  streetNumber: z.string().trim().min(1, 'יש להזין מספר בית').max(10),
});

type FormData = z.infer<typeof formSchema>;

// ─── Main Component ───
export default function PaymeSetup() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    socialId: '',
    birthdate: '',
    email: '',
    phone: '',
    bankCode: 0,
    bankBranch: '',
    bankAccountNumber: '',
    incType: 0,
    incCode: '',
    merchantName: '',
    merchantNameEn: '',
    city: '',
    street: '',
    streetNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'form' | 'submitted'>('form');

  // Check if event already has seller or pending setup
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event-payme', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, groom_name, bride_name, seller_payme_id, owner_id, payment_setup_status, payment_setup_data')
        .eq('id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && eventId.length === 36,
  });

  const submitForApproval = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('לא מחובר');

      const { error } = await supabase
        .from('events')
        .update({
          payment_setup_status: 'pending_approval',
          payment_setup_data: data as any,
        })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      setStep('submitted');
      queryClient.invalidateQueries({ queryKey: ['event-payme', eventId] });
      toast({ title: "הפרטים נשלחו בהצלחה!", description: "הבקשה תיבדק על ידי צוות GiftKal" });
    },
    onError: (error: Error) => {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    },
  });

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'firstName' || field === 'lastName') {
        const first = field === 'firstName' ? (value as string) : prev.firstName;
        const last = field === 'lastName' ? (value as string) : prev.lastName;
        const fullName = `${first} ${last}`.trim();
        updated.merchantName = fullName;
        updated.merchantNameEn = transliterateHebrew(fullName);
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      return;
    }
    submitForApproval.mutate(result.data);
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show approved status
  if (event?.seller_payme_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle>חשבון הסליקה פעיל ✅</CardTitle>
            <CardDescription>
              החשבון שלך מאושר ופעיל. האורחים יכולים לשלוח מתנות באשראי.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/event')}>חזרה לדאשבורד</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show pending approval status
  if (event?.payment_setup_status === 'pending_approval' || step === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <CardTitle>הבקשה נשלחה לאישור ⏳</CardTitle>
            <CardDescription>
              הפרטים שלך נבדקים על ידי צוות GiftKal. לאחר אישור ובדיקה, חשבון הסליקה יופעל ותקבלו הודעה.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">מה קורה עכשיו?</p>
                  <p>הצוות שלנו בודק את הפרטים ומקים עבורך חשבון סליקה. התהליך אורך עד 24 שעות.</p>
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate('/event')}>חזרה לדאשבורד</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show rejected status
  if (event?.payment_setup_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle>הבקשה נדחתה</CardTitle>
            <CardDescription>
              יש לתקן את הפרטים ולשלוח שוב. צרו קשר עם התמיכה לפרטים נוספים.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => {
              // Reset to form with existing data
              const savedData = event?.payment_setup_data as any;
              if (savedData) {
                setFormData(savedData);
              }
              // We need to reset the status to allow re-submission
            }}>
              תקן פרטים ושלח שוב
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => navigate('/event')}>חזרה לדאשבורד</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">הקמת חשבון סליקה</CardTitle>
            <CardDescription>
              {event?.groom_name && event?.bride_name 
                ? `לאירוע של ${event.groom_name} & ${event.bride_name}`
                : 'מלאו את הפרטים כדי לקבל תשלומים מהאורחים'
              }
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-2">
              הפרטים יישלחו לבדיקה ואישור. לאחר אישור, חשבון הסליקה יופעל.
            </p>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <User className="w-5 h-5" />
                  <h3>פרטים אישיים</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">שם פרטי *</Label>
                    <Input id="firstName" value={formData.firstName || ''} onChange={(e) => handleChange('firstName', e.target.value)} className={errors.firstName ? 'border-red-500' : ''} />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">שם משפחה *</Label>
                    <Input id="lastName" value={formData.lastName || ''} onChange={(e) => handleChange('lastName', e.target.value)} className={errors.lastName ? 'border-red-500' : ''} />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="socialId">תעודת זהות *</Label>
                    <Input id="socialId" value={formData.socialId || ''} onChange={(e) => handleChange('socialId', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="123456789" className={errors.socialId ? 'border-red-500' : ''} />
                    {errors.socialId && <p className="text-red-500 text-sm mt-1">{errors.socialId}</p>}
                  </div>
                  <div>
                    <Label htmlFor="birthdate">תאריך לידה *</Label>
                    <Input id="birthdate" value={formData.birthdate || ''} onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                      if (val.length >= 5) val = val.slice(0, 5) + '/' + val.slice(5, 9);
                      handleChange('birthdate', val);
                    }} placeholder="DD/MM/YYYY" maxLength={10} className={errors.birthdate ? 'border-red-500' : ''} />
                    {errors.birthdate && <p className="text-red-500 text-sm mt-1">{errors.birthdate}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">מייל *</Label>
                    <Input id="email" type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} placeholder="email@example.com" className={errors.email ? 'border-red-500' : ''} />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">טלפון נייד *</Label>
                    <Input id="phone" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="0501234567" className={errors.phone ? 'border-red-500' : ''} />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Building2 className="w-5 h-5" />
                  <h3>פרטי בנק</h3>
                </div>
                <p className="text-sm text-muted-foreground">לאיזה חשבון יגיע הכסף מהמתנות</p>
                
                <div>
                  <Label htmlFor="bankCode">בנק *</Label>
                  <Select value={formData.bankCode > 0 ? formData.bankCode.toString() : ''} onValueChange={(v) => handleChange('bankCode', parseInt(v))}>
                    <SelectTrigger className={errors.bankCode ? 'border-red-500' : ''}>
                      <SelectValue placeholder="בחרו בנק" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map(bank => (
                        <SelectItem key={bank.code} value={bank.code.toString()}>
                          {bank.name} ({bank.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bankCode && <p className="text-red-500 text-sm mt-1">{errors.bankCode}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankBranch">מספר סניף *</Label>
                    <Input id="bankBranch" value={formData.bankBranch || ''} onChange={(e) => handleChange('bankBranch', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" className={errors.bankBranch ? 'border-red-500' : ''} />
                    {errors.bankBranch && <p className="text-red-500 text-sm mt-1">{errors.bankBranch}</p>}
                  </div>
                  <div>
                    <Label htmlFor="bankAccountNumber">מספר חשבון *</Label>
                    <Input id="bankAccountNumber" value={formData.bankAccountNumber || ''} onChange={(e) => handleChange('bankAccountNumber', e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="1234567" className={errors.bankAccountNumber ? 'border-red-500' : ''} />
                    {errors.bankAccountNumber && <p className="text-red-500 text-sm mt-1">{errors.bankAccountNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="w-5 h-5" />
                  <h3>כתובת</h3>
                </div>
                
                <div>
                  <Label htmlFor="city">עיר *</Label>
                  <Input id="city" value={formData.city || ''} onChange={(e) => handleChange('city', e.target.value)} className={errors.city ? 'border-red-500' : ''} />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="street">רחוב *</Label>
                    <Input id="street" value={formData.street || ''} onChange={(e) => handleChange('street', e.target.value)} className={errors.street ? 'border-red-500' : ''} />
                    {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                  </div>
                  <div>
                    <Label htmlFor="streetNumber">מספר *</Label>
                    <Input id="streetNumber" value={formData.streetNumber || ''} onChange={(e) => handleChange('streetNumber', e.target.value)} className={errors.streetNumber ? 'border-red-500' : ''} />
                    {errors.streetNumber && <p className="text-red-500 text-sm mt-1">{errors.streetNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <Button type="submit" className="w-full h-12 text-lg gap-2" disabled={submitForApproval.isPending}>
                  {submitForApproval.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />שולח פרטים...</>
                  ) : (
                    <><Send className="w-5 h-5" />שלח פרטים לאישור</>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  הפרטים יישלחו לצוות GiftKal לבדיקה ואישור
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
