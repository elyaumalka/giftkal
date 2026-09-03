import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { SITE_URL } from '../_shared/site.ts'
import { hostNames, toE164, sendSms } from '../_shared/event-text.ts'

/**
 * Runs hourly (pg_cron). For every event happening today whose reception time
 * has arrived, sends confirmed guests an SMS with the gift link — once per guest.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Israel local time (UTC+3 / UTC+2). Use Intl to be DST-safe.
    const now = new Date()
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]))
    const today = `${parts.year}-${parts.month}-${parts.day}`
    const nowMinutes = Number(parts.hour) * 60 + Number(parts.minute)

    const body = await req.json().catch(() => ({}))
    const forcedEventId: string | undefined =
      typeof body?.eventId === 'string' ? body.eventId : undefined

    let query = admin
      .from('events')
      .select(
        'id, event_type, event_date, reception_time, groom_name, bride_name, child_name, family_name, gifts_enabled',
      )
    query = forcedEventId ? query.eq('id', forcedEventId) : query.eq('event_date', today)

    const { data: events } = await query
    let totalSent = 0
    let totalFailed = 0

    for (const event of events ?? []) {
      if (!forcedEventId) {
        const [h, m] = (event.reception_time || '19:00').split(':')
        const startMinutes = Number(h) * 60 + Number(m || 0)
        if (Number.isNaN(startMinutes) || nowMinutes < startMinutes) continue
      }

      const { data: guests } = await admin
        .from('guests')
        .select('id, full_name, phone, rsvp_status, gift_sms_sent_at')
        .eq('event_id', event.id)
        .eq('rsvp_status', 'confirmed')
        .is('gift_sms_sent_at', null)

      const names = hostNames(event as any)
      const giftUrl = `${SITE_URL}/gift/${event.id}`

      for (const guest of guests ?? []) {
        const to = toE164(guest.phone)
        if (!to) continue

        const message = [
          `${guest.full_name}, אנחנו כבר חוגגים ואיזה כיף שאתם איתנו! 🥂`,
          `רוצים לברך את ${names} במתנה דיגיטלית?`,
          'מהיר, מאובטח ומגיע ישירות אליהם:',
          giftUrl,
          `באהבה, ${names} 💛`,
        ].join('\n')

        const result = await sendSms(to, message)

        await admin.from('guest_invitation_sends').insert({
          event_id: event.id,
          guest_id: guest.id,
          channel: 'sms',
          status: result.ok ? 'sent' : 'failed',
          recipient: to,
          error_message: result.error ?? null,
        })

        if (result.ok) {
          totalSent++
          await admin
            .from('guests')
            .update({ gift_sms_sent_at: new Date().toISOString() })
            .eq('id', guest.id)
        } else {
          totalFailed++
        }
      }
    }

    return json({ sent: totalSent, failed: totalFailed })
  } catch (err) {
    console.error('send-event-day-gift-sms error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
