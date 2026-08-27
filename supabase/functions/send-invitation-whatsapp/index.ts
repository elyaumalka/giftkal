import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { SITE_URL } from '../_shared/site.ts'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio'

type SendResult = {
  guestId: string
  status: 'sent' | 'failed'
  recipient: string | null
  error?: string
}

/** Normalize an Israeli phone number to E.164 (+972...). */
function toE164(raw: string | null): string | null {
  if (!raw) return null
  let p = raw.replace(/[^\d+]/g, '')
  if (p.startsWith('+')) return p.length >= 11 ? p : null
  if (p.startsWith('00')) p = p.slice(2)
  if (p.startsWith('972')) return `+${p}`
  if (p.startsWith('0')) return `+972${p.slice(1)}`
  if (p.length === 9) return `+972${p}`
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY')
    const WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM')
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      return json({ error: 'חיבור טוויליו אינו מוגדר במערכת' }, 500)
    }
    if (!WHATSAPP_FROM) {
      return json({ error: 'לא הוגדר מספר שולח לוואטסאפ (TWILIO_WHATSAPP_FROM)' }, 500)
    }
    const from = WHATSAPP_FROM.startsWith('whatsapp:') ? WHATSAPP_FROM : `whatsapp:${WHATSAPP_FROM}`

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
    // Approved WhatsApp template (invitation_rsvp_he). Can be overridden per request.
    const DEFAULT_CONTENT_SID = Deno.env.get('TWILIO_WHATSAPP_CONTENT_SID') || 'HXd968b435201244b338299d4498946ff6'
    const contentSid: unknown = typeof body?.contentSid === 'string' && body.contentSid
      ? body.contentSid
      : DEFAULT_CONTENT_SID
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

    const { data: guests } = await admin
      .from('guests')
      .select('id, full_name, phone')
      .eq('event_id', eventId)
      .in('id', guestIds as string[])

    const results: SendResult[] = []

    for (const guest of guests ?? []) {
      const e164 = toE164(guest.phone)
      if (!e164) {
        results.push({ guestId: guest.id, status: 'failed', recipient: guest.phone, error: 'מספר טלפון לא תקין' })
        continue
      }

      const rsvpUrl = `${SITE_URL}/rsvp/${eventId}/${guest.id}`
      const message = `שלום ${guest.full_name},\nהוזמנתם לאירוע של ${eventName}${eventDate ? ` בתאריך ${eventDate}` : ''}${event.custom_venue_name ? ` ב${event.custom_venue_name}` : ''}.\nלאישור הגעה: ${rsvpUrl}`

      const params = new URLSearchParams({ To: `whatsapp:${e164}`, From: from })
      if (typeof contentSid === 'string' && contentSid) {
        // Approved WhatsApp template (required outside the 24h customer-service window)
        params.set('ContentSid', contentSid)
        params.set(
          'ContentVariables',
          JSON.stringify({ '1': guest.full_name, '2': eventName, '3': eventDate, '4': rsvpUrl }),
        )
      } else {
        params.set('Body', message)
      }

      try {
        const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TWILIO_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        })
        if (!res.ok) {
          const errorBody = await res.text()
          console.error(`Twilio WhatsApp send failed [${res.status}]: ${errorBody}`)
          results.push({
            guestId: guest.id,
            status: 'failed',
            recipient: e164,
            error: `[${res.status}] ${errorBody.slice(0, 300)}`,
          })
        } else {
          results.push({ guestId: guest.id, status: 'sent', recipient: e164 })
        }
      } catch (e) {
        results.push({ guestId: guest.id, status: 'failed', recipient: e164, error: (e as Error).message })
      }
    }

    if (results.length > 0) {
      await admin.from('guest_invitation_sends').insert(
        results.map((r) => ({
          event_id: eventId,
          guest_id: r.guestId,
          channel: 'whatsapp',
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
            invitation_last_channel: 'whatsapp',
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
    console.error('send-invitation-whatsapp error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
