import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import contactIllustration from "@/assets/contact-illustration.jpg";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || form.full_name.trim().length > 100) {
      toast({ title: "שם מלא נדרש (עד 100 תווים)", variant: "destructive" });
      return;
    }
    if (!form.phone.trim() || !/^[\d\-+() ]{7,15}$/.test(form.phone.trim())) {
      toast({ title: "מספר טלפון לא תקין", variant: "destructive" });
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast({ title: "כתובת אימייל לא תקינה", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        lead_type: "contact_form",
        venue_name: form.message.trim() || null,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "הפנייה נשלחה בהצלחה! ✨", description: "נחזור אליכם בהקדם" });
    } catch {
      toast({ title: "שגיאה בשליחה, נסו שוב", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-12 rounded-full bg-[#F2F0EB] px-5 text-right placeholder:text-[#9CA3AF] text-sm outline-none focus:ring-2 focus:ring-[#AE842D]/40 border-0";

  return (
    <div>
      {/* Title + description */}
      <section className="pt-10 md:pt-16 pb-8 md:pb-12">
        <div className="container mx-auto px-4 text-center">
          <h1
            className="font-extrabold text-[#051839] leading-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            יצירת קשר
          </h1>
          <p className="text-lg md:text-xl text-[#1E1E1E]/80 font-light max-w-3xl mx-auto leading-relaxed">
            בין אם אתם לפני חתונה, בר מצווה, בת מצווה, ברית או כל אירוע משמח אחר
            <br className="hidden md:block" />
            נשמח להסביר איך המערכת עובדת,
            <br className="hidden md:block" />
            {" "}לעזור לכם בתהליך ההקמה ולוודא שהכול יהיה פשוט,
            <br className="hidden md:block" />
            {" "}מסודר ונוח עבורכם ועבור האורחים שלכם.
          </p>
        </div>
      </section>

      {/* Card with form + illustration */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-[30px] shadow-[0_20px_60px_-20px_rgba(11,31,74,0.15)] p-6 md:p-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Illustration */}
              <div className="order-2 lg:order-1">
                <img
                  src={contactIllustration}
                  alt="יצירת קשר"
                  className="w-full h-auto object-contain rounded-3xl"
                  loading="lazy"
                  width={1400}
                  height={1050}
                />
              </div>

              {/* Form */}
              <div className="order-1 lg:order-2">
                {sent ? (
                  <div className="bg-[#AE842D]/10 border border-[#AE842D]/30 rounded-2xl p-10 text-center">
                    <CheckCircle2 className="w-14 h-14 text-[#AE842D] mx-auto mb-5" />
                    <h3 className="text-2xl font-bold text-[#051839] mb-2">תודה רבה! 🎉</h3>
                    <p className="text-[#1E1E1E]/70">קיבלנו את הפנייה ונחזור אליכם בהקדם.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-lg font-semibold text-[#374151] mb-2">שם מלא</label>
                      <input
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        placeholder="הכנס את שמך"
                        maxLength={100}
                        required
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-[#374151] mb-2">אימייל</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="הכנס אימייל"
                        maxLength={255}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-[#374151] mb-2">טלפון</label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="הכנס מספר טלפון"
                        maxLength={15}
                        required
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-[#374151] mb-2">הודעה</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="כתוב לנו מה אתה צריך...."
                        maxLength={1000}
                        className="w-full min-h-[140px] rounded-3xl bg-[#F2F0EB] p-4 text-right placeholder:text-[#9CA3AF] text-sm outline-none focus:ring-2 focus:ring-[#AE842D]/40 border-0 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[52px] rounded-xl bg-[#AE842D] hover:bg-[#c69838] transition-colors text-white text-xl font-bold disabled:opacity-60"
                    >
                      {loading ? "שולח..." : "שליחה ←"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
