import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { SITE_URL } from '../_shared/site.ts'

const TWILIO_EMAIL_API = 'https://comms.twilio.com/v1/Emails'

type SendResult = {
  guestId: string
  status: 'sent' | 'failed'
  recipient: string | null
  error?: string
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

function buildHtml(opts: {
  guestName: string
  eventName: string
  eventDate: string
  venue: string
  rsvpUrl: string
}) {
  const { guestName, eventName, eventDate, venue, rsvpUrl } = opts
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F7F3EA;font-family:'Assistant',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(5,24,57,0.08);">
        <tr><td style="background:#051839;padding:28px;text-align:center;">
          <div style="color:#95742F;font-size:13px;letter-spacing:2px;">BESIMCHOT PLUS</div>
          <div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:6px;">בשמחות פלוס</div>
        </td></tr>
        <tr><td style="padding:32px;direction:rtl;text-align:right;color:#051839;">
          <p style="margin:0 0 16px;font-size:17px;">שלום ${escapeHtml(guestName)},</p>
          <p style="margin:0 0 8px;font-size:16px;line-height:1.7;">הוזמנתם לשמוח איתנו באירוע של</p>
          <p style="margin:0 0 16px;font-size:24px;font-weight:700;color:#95742F;">${escapeHtml(eventName)}</p>
          ${eventDate ? `<p style="margin:0 0 6px;font-size:16px;">🗓️ תאריך: ${escapeHtml(eventDate)}</p>` : ''}
          ${venue ? `<p style="margin:0 0 6px;font-size:16px;">📍 מקום: ${escapeHtml(venue)}</p>` : ''}
          <div style="text-align:center;margin:28px 0 8px;">
            <a href="${rsvpUrl}" style="display:inline-block;background:#95742F;color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:999px;font-size:17px;font-weight:700;">לאישור הגעה</a>
          </div>
          <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">אם הכפתור אינו עובד, זהו הקישור: <br /><a href="${rsvpUrl}" style="color:#95742F;">${rsvpUrl}</a></p>
        </td></tr>
        <tr><td style="background:#F7F3EA;padding:18px;text-align:center;color:#6b7280;font-size:12px;">
          נשלח באמצעות בשמחות פלוס
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const FROM_EMAIL = Deno.env.get('TWILIO_EMAIL_FROM')
    const FROM_NAME = Deno.env.get('TWILIO_EMAIL_FROM_NAME') ?? 'בשמחות פלוס'
    if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_EMAIL) {
      return json({ error: 'שליחת מייל אינה מוגדרת במערכת' }, 500)
    }
    const basic = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`)

    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'לא מחובר' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return json({ error: 'לא מחובר' }, 401)
    const userId = userData.user.id

    const body = await req.json().catch(() => null)
    const eventId: unknown = body?.eventId
    const guestIds: unknown = body?.guestIds
    if (typeof eventId !== 'string' || !Array.isArray(guestIds) || guestIds.length === 0) {
      return json({ error: 'נתונים חסרים' }, 400)
    }
    if (guestIds.length > 300 || guestIds.some((g) => typeof g !== 'string')) {
      return json({ error: 'רשימת מוזמנים לא תקינה' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: event } = await admin
      .from('events')
      .select('id, owner_id, event_type, event_date, groom_name, bride_name, child_name, family_name, custom_venue_name')
      .eq('id', eventId)
      .maybeSingle()
    if (!event) return json({ error: 'אירוע לא נמצא' }, 404)

    if (event.owner_id !== userId) {
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' })
      if (!isAdmin) return json({ error: 'אין הרשאה' }, 403)
    }

    const eventName = ['חתונה', 'אירוסין'].includes(event.event_type ?? '')
      ? `${event.groom_name ?? ''} ו${event.bride_name ?? ''}`
      : event.child_name || event.family_name || 'האירוע'

    const eventDate = event.event_date ? new Date(event.event_date).toLocaleDateString('he-IL') : ''
    const venue = event.custom_venue_name ?? ''

    const { data: guests } = await admin
      .from('guests')
      .select('id, full_name, email')
      .eq('event_id', eventId)
      .in('id', guestIds as string[])

    const results: SendResult[] = []

    for (const guest of guests ?? []) {
      const to = (guest.email ?? '').trim()
      if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
        results.push({ guestId: guest.id, status: 'failed', recipient: guest.email, error: 'כתובת מייל לא תקינה' })
        continue
      }

      const rsvpUrl = `${SITE_URL}/rsvp/${eventId}/${guest.id}`
      const html = buildHtml({
        guestName: guest.full_name ?? '',
        eventName,
        eventDate,
        venue,
        rsvpUrl,
      })

      try {
        const res = await fetch(TWILIO_EMAIL_API, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: { address: FROM_EMAIL, name: FROM_NAME },
            to: [{ address: to }],
            content: {
              subject: `הוזמנתם לאירוע של ${eventName}`,
              html,
            },
          }),
        })

        if (!res.ok) {
          const errorBody = await res.text()
          console.error(`Twilio email failed [${res.status}]: ${errorBody}`)
          results.push({
            guestId: guest.id,
            status: 'failed',
            recipient: to,
            error: `[${res.status}] ${errorBody.slice(0, 300)}`,
          })
        } else {
          results.push({ guestId: guest.id, status: 'sent', recipient: to })
        }
      } catch (e) {
        results.push({ guestId: guest.id, status: 'failed', recipient: to, error: (e as Error).message })
      }
    }

    if (results.length > 0) {
      await admin.from('guest_invitation_sends').insert(
        results.map((r) => ({
          event_id: eventId,
          guest_id: r.guestId,
          channel: 'email',
          status: r.status,
          recipient: r.recipient,
          error_message: r.error ?? null,
        })),
      )

      const sentIds = results.filter((r) => r.status === 'sent').map((r) => r.guestId)
      if (sentIds.length > 0) {
        await admin
          .from('guests')
          .update({
            invitation_sent: true,
            invitation_sent_at: new Date().toISOString(),
            invitation_last_channel: 'email',
          })
          .in('id', sentIds)
      }
    }

    return json({
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    })
  } catch (err) {
    console.error('send-invitation-email error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
