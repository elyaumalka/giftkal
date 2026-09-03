import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { eventTitle, eventDateHe, toE164, sendSms } from '../_shared/event-text.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const body = await req.json().catch(() => null)
    const token: unknown = body?.token
    const guestId: unknown = body?.guestId
    if (typeof token !== 'string' || typeof guestId !== 'string') {
      return json({ error: 'נתונים חסרים' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: event } = await admin
      .from('events')
      .select(
        'id, event_type, event_date, reception_time, groom_name, bride_name, child_name, family_name, custom_venue_name, custom_venue_location',
      )
      .eq('share_token_general', token)
      .maybeSingle()
    if (!event) return json({ error: 'אירוע לא נמצא' }, 404)

    const { data: guest } = await admin
      .from('guests')
      .select('id, full_name, phone, rsvp_status, number_of_guests, children_count, event_id')
      .eq('id', guestId)
      .eq('event_id', event.id)
      .maybeSingle()
    if (!guest) return json({ error: 'מוזמן לא נמצא' }, 404)
    if (guest.rsvp_status !== 'confirmed') return json({ skipped: true })

    const to = toE164(guest.phone)
    if (!to) return json({ error: 'מספר טלפון לא תקין' }, 400)

    const place = [event.custom_venue_name, event.custom_venue_location].filter(Boolean).join(', ')
    const lines = [
      `היי ${guest.full_name}, איזה כיף שאתם באים! 🤍`,
      eventTitle(event as any),
      `🗓️ ${eventDateHe(event as any)}${event.reception_time ? ` | 🕖 קבלת פנים ${event.reception_time}` : ''}`,
      place ? `📍 ${place}` : '',
      `אישרתם ${guest.number_of_guests || 1} מוזמנים${guest.children_count ? ` ו-${guest.children_count} ילדים` : ''}.`,
      'מחכים לכם לחגוג יחד!',
    ].filter(Boolean)

    const result = await sendSms(to, lines.join('\n'))

    await admin.from('guest_invitation_sends').insert({
      event_id: event.id,
      guest_id: guest.id,
      channel: 'sms',
      status: result.ok ? 'sent' : 'failed',
      recipient: to,
      error_message: result.error ?? null,
    })

    if (!result.ok) return json({ error: result.error }, 502)
    return json({ sent: true })
  } catch (err) {
    console.error('send-rsvp-confirmation-sms error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
