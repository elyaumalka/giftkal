/** Extracts the real error message from a failed backend function call. */
export async function getFunctionErrorMessage(error: any, fallback = "שגיאה"): Promise<string> {
  try {
    const ctx = error?.context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.clone().json();
      const msg = [body?.error, body?.details].filter(Boolean).join(" — ");
      if (msg) return translate(msg);
    }
  } catch { /* ignore */ }
  return translate(error?.message || fallback);
}

function translate(msg: string): string {
  if (msg.includes("PAYME_MASTER_SELLER_ID")) {
    return "לא הוגדר מזהה הסולק של חשבון בשמחות פלוס ב-PayMe (חשבון היעד להעברת העמלות).";
  }
  if (msg.includes("Admin only")) return "רק מנהל מערכת יכול לבצע העברה.";
  if (msg.includes("no PayMe seller")) return "לאירוע אין חשבון סולק ב-PayMe.";
  return msg;
}
