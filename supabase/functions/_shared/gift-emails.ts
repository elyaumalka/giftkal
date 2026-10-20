// Gift emails sent via Twilio Comms Email API: per-gift receipt to the giver,
// and the end-of-day summaries (owner + admin).
import { hostNames, type EventRow } from './event-text.ts'

const TWILIO_EMAIL_API = 'https://comms.twilio.com/v1/Emails'

/** Admin inbox: gets the daily admin summary; also the fallback payer email (never gets a giver receipt). */
export const ADMIN_EMAIL = '0533116358a@gmail.com'

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

export const ils = (n: number) =>
  `₪${(Number(n) || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function isValidEmail(e: string | null | undefined): e is string {
  return !!e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim())
}

export function layout(title: string, inner: string) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F7F3EA;font-family:'Assistant',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;">
<tr><td style="background:#051839;padding:26px;text-align:center;">
<div style="color:#95742F;font-size:13px;letter-spacing:2px;">BESIMCHOT PLUS</div>
<div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:6px;">${escapeHtml(title)}</div>
</td></tr>
<tr><td style="padding:28px;direction:rtl;text-align:right;color:#051839;font-size:15px;line-height:1.7;">${inner}</td></tr>
<tr><td style="background:#F7F3EA;padding:16px;text-align:center;color:#6b7280;font-size:12px;">נשלח באמצעות בשמחות פלוס</td></tr>
</table></td></tr></table></body></html>`
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const token = Deno.env.get('TWILIO_AUTH_TOKEN')
  const from = Deno.env.get('TWILIO_EMAIL_FROM')
  const fromName = Deno.env.get('TWILIO_EMAIL_FROM_NAME') ?? 'בשמחות פלוס'
  if (!sid || !token || !from) return { ok: false, error: 'email not configured' }
  try {
    const res = await fetch(TWILIO_EMAIL_API, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { address: from, name: fromName },
        to: [{ address: to.trim() }],
        content: { subject, html },
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`Twilio email failed [${res.status}]: ${body}`)
      return { ok: false, error: `[${res.status}] ${body.slice(0, 300)}` }
    }
    await res.text()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/**
 * Send the giver a gift confirmation once (idempotent via receipt_email_sent_at).
 * Skipped when the giver left no email (payer_email fell back to the admin inbox).
 */
// deno-lint-ignore no-explicit-any
export async function sendGiftReceipt(supabase: any, transactionId: string) {
  try {
    const { data: tx } = await supabase
      .from('transactions')
      .select('id, event_id, payer_name, payer_email, amount, gift_amount, fee_amount, installments, blessing_text, transaction_date, payme_sale_id, payment_status, receipt_email_sent_at')
      .eq('id', transactionId)
      .maybeSingle()
    if (!tx || tx.payment_status !== 'completed' || tx.receipt_email_sent_at) return
    const to = (tx.payer_email ?? '').trim()
    if (!isValidEmail(to) || to.toLowerCase() === ADMIN_EMAIL) return

    // Claim first so concurrent callers (charge + webhook) don't both send.
    const { data: claimed } = await supabase
      .from('transactions')
      .update({ receipt_email_sent_at: new Date().toISOString() })
      .eq('id', tx.id)
      .is('receipt_email_sent_at', null)
      .select('id')
    if (!claimed || claimed.length === 0) return

    const { data: event } = await supabase
      .from('events')
      .select('id, event_type, event_date, groom_name, bride_name, child_name, family_name')
      .eq('id', tx.event_id)
      .maybeSingle()
    const names = event ? hostNames(event as EventRow) : 'בעלי האירוע'
    const gift = Number(tx.gift_amount) || Number(tx.amount) || 0
    const total = Number(tx.amount) || gift
    const inst = Number(tx.installments) || 1
    const date = new Date(tx.transaction_date ?? Date.now()).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' })

    const row = (k: string, v: string) =>
      `<tr><td style="padding:6px 0;color:#6b7280;">${k}</td><td style="padding:6px 0;font-weight:700;text-align:left;">${v}</td></tr>`
    const inner = `
<p style="margin:0 0 12px;font-size:17px;">שלום ${escapeHtml(tx.payer_name ?? '')},</p>
<p style="margin:0 0 18px;">תודה רבה! המתנה שלך ל<b style="color:#95742F;">${escapeHtml(names)}</b> התקבלה בהצלחה.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin-bottom:18px;">
${row('סכום המתנה', ils(gift))}
${total !== gift ? row('סה״כ חויב (כולל עמלת סליקה)', ils(total)) : ''}
${inst > 1 ? row('מספר תשלומים', String(inst)) : ''}
${row('תאריך', date)}
${tx.payme_sale_id ? row('אסמכתא', escapeHtml(String(tx.payme_sale_id))) : ''}
</table>
${tx.blessing_text ? `<p style="margin:0 0 6px;color:#6b7280;">הברכה שלך:</p><p style="margin:0;background:#F7F3EA;border-radius:14px;padding:14px;white-space:pre-line;">${escapeHtml(tx.blessing_text)}</p>` : ''}
<p style="margin:18px 0 0;font-size:13px;color:#6b7280;">קבלה רשמית על התשלום נשלחת בנפרד מחברת הסליקה.</p>`

    const r = await sendEmail(to, `אישור מתנה ל${names}`, layout('אישור מתנה', inner))
    if (!r.ok) {
      // Release the claim so a later retry can send.
      await supabase.from('transactions').update({ receipt_email_sent_at: null }).eq('id', tx.id)
    }
  } catch (e) {
    console.error('sendGiftReceipt error:', (e as Error).message)
  }
}
