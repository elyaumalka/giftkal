// End-of-day gift summary: each event owner gets the gifts received today for
// their event(s); the admin gets one summary of all gifts. Nothing is sent when
// there were no gifts. Runs once per Israel date (gift_summary_runs guards repeats).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { hostNames, type EventRow } from '../_shared/event-text.ts'
import { ADMIN_EMAIL, escapeHtml, ils, isValidEmail, layout, sendEmail } from '../_shared/gift-emails.ts'

function israelDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(d) // YYYY-MM-DD
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const today = israelDate()

    // Once per Israel day — claim the run.
    const { error: claimErr } = await supabase.from('gift_summary_runs').insert({ run_date: today })
    if (claimErr) return json({ skipped: true, reason: 'already ran today' })

    // Gifts completed during the last 24h whose Israel date is today.
    const since = new Date(Date.now() - 26 * 3600 * 1000).toISOString()
    const { data: txs } = await supabase
      .from('transactions')
      .select('id, event_id, payer_name, amount, gift_amount, fee_amount, installments, blessing_text, created_at')
      .eq('payment_status', 'completed')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
    const todays = (txs ?? []).filter((t) => israelDate(new Date(t.created_at)) === today)
    if (todays.length === 0) return json({ sent: 0, reason: 'no gifts today' })

    const eventIds = [...new Set(todays.map((t) => t.event_id))]
    const { data: events } = await supabase
      .from('events')
      .select('id, owner_id, event_type, event_date, groom_name, bride_name, child_name, family_name')
      .in('id', eventIds)
    const ownerIds = [...new Set((events ?? []).map((e) => e.owner_id))]
    const { data: profiles } = await supabase.from('profiles').select('user_id, email, full_name').in('user_id', ownerIds)

    const eventById = new Map((events ?? []).map((e) => [e.id, e]))
    const profileByUser = new Map((profiles ?? []).map((p) => [p.user_id, p]))
    const dateHe = new Date().toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' })

    const giftRows = (list: typeof todays, withEvent: boolean) =>
      list
        .map((t) => {
          const time = new Date(t.created_at).toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' })
          const ev = eventById.get(t.event_id)
          return `<tr>
<td style="padding:8px 6px;border-bottom:1px solid #eee;">${escapeHtml(t.payer_name ?? '')}${t.blessing_text ? `<div style="color:#6b7280;font-size:12px;">${escapeHtml(String(t.blessing_text).slice(0, 120))}</div>` : ''}</td>
${withEvent ? `<td style="padding:8px 6px;border-bottom:1px solid #eee;">${escapeHtml(ev ? hostNames(ev as EventRow) : '')}</td>` : ''}
<td style="padding:8px 6px;border-bottom:1px solid #eee;white-space:nowrap;">${time}</td>
<td style="padding:8px 6px;border-bottom:1px solid #eee;font-weight:700;white-space:nowrap;">${ils(Number(t.gift_amount) || Number(t.amount))}</td>
</tr>`
        })
        .join('')
    const th = (s: string) => `<th style="text-align:right;padding:8px 6px;color:#6b7280;font-weight:600;border-bottom:2px solid #95742F;">${s}</th>`

    // Per-owner emails.
    let ownersSent = 0
    const byOwner = new Map<string, typeof todays>()
    for (const t of todays) {
      const ev = eventById.get(t.event_id)
      if (!ev) continue
      byOwner.set(ev.owner_id, [...(byOwner.get(ev.owner_id) ?? []), t])
    }
    for (const [ownerId, list] of byOwner) {
      const p = profileByUser.get(ownerId)
      if (!isValidEmail(p?.email)) continue
      const total = list.reduce((s, t) => s + (Number(t.gift_amount) || Number(t.amount) || 0), 0)
      const multi = new Set(list.map((t) => t.event_id)).size > 1
      const names = hostNames(eventById.get(list[0].event_id) as EventRow)
      const inner = `
<p style="margin:0 0 12px;font-size:17px;">שלום ${escapeHtml(p!.full_name ?? '')},</p>
<p style="margin:0 0 16px;">היום (${dateHe}) התקבלו <b>${list.length}</b> מתנות בסך <b style="color:#95742F;">${ils(total)}</b>.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
<tr>${th('נותן המתנה')}${multi ? th('אירוע') : ''}${th('שעה')}${th('סכום')}</tr>
${giftRows(list, multi)}
</table>`
      const r = await sendEmail(p!.email, `סיכום המתנות של היום — ${list.length} מתנות (${ils(total)})`, layout(`סיכום מתנות · ${names}`, inner))
      if (r.ok) ownersSent++
    }

    // Admin summary.
    const total = todays.reduce((s, t) => s + (Number(t.gift_amount) || Number(t.amount) || 0), 0)
    const fees = todays.reduce((s, t) => s + (Number(t.fee_amount) || 0), 0)
    const adminInner = `
<p style="margin:0 0 16px;">היום (${dateHe}) התקבלו <b>${todays.length}</b> מתנות ב-<b>${eventIds.length}</b> אירועים.<br/>
סה״כ מתנות: <b style="color:#95742F;">${ils(total)}</b> · עמלות: <b>${ils(fees)}</b></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
<tr>${th('נותן המתנה')}${th('אירוע')}${th('שעה')}${th('סכום')}</tr>
${giftRows(todays, true)}
</table>`
    const adminRes = await sendEmail(ADMIN_EMAIL, `סיכום מתנות יומי — ${todays.length} מתנות (${ils(total)})`, layout('סיכום מתנות יומי · ניהול', adminInner))

    await supabase.from('gift_summary_runs').update({ owners_sent: ownersSent, admin_sent: adminRes.ok }).eq('run_date', today)
    return json({ gifts: todays.length, ownersSent, adminSent: adminRes.ok })
  } catch (e) {
    console.error('send-daily-gift-summary error:', e)
    return json({ error: (e as Error).message }, 500)
  }
})
