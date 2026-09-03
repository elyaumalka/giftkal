// Shared helpers for building Hebrew event names / details used in SMS texts.

export type EventRow = {
  id: string
  event_type: string | null
  event_date: string | null
  reception_time?: string | null
  groom_name?: string | null
  bride_name?: string | null
  child_name?: string | null
  family_name?: string | null
  custom_venue_name?: string | null
  custom_venue_location?: string | null
}

export function hostNames(event: EventRow): string {
  if (['חתונה', 'אירוסין'].includes(event.event_type ?? '')) {
    return `${event.groom_name ?? ''} ו${event.bride_name ?? ''}`.trim()
  }
  return event.child_name || event.family_name || 'בעלי האירוע'
}

export function eventTitle(event: EventRow): string {
  const names = hostNames(event)
  return `${event.event_type ?? 'האירוע'} של ${names}`
}

export function eventDateHe(event: EventRow): string {
  return event.event_date ? new Date(event.event_date).toLocaleDateString('he-IL') : ''
}

/** Normalize an Israeli phone number to E.164 (+972...). */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null
  let p = raw.replace(/[^\d+]/g, '')
  if (p.startsWith('+')) return p.length >= 11 ? p : null
  if (p.startsWith('00')) p = p.slice(2)
  if (p.startsWith('972')) return `+${p}`
  if (p.startsWith('0')) return `+972${p.slice(1)}`
  if (p.length === 9) return `+972${p}`
  return null
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio'

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY')
  const TWILIO_SMS_FROM = Deno.env.get('TWILIO_SMS_FROM')
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_SMS_FROM) {
    return { ok: false, error: 'חיבור ה-SMS אינו מוגדר במערכת' }
  }
  try {
    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: TWILIO_SMS_FROM, Body: body }),
    })
    if (!res.ok) {
      const errorBody = await res.text()
      console.error(`Twilio send failed [${res.status}]: ${errorBody}`)
      return { ok: false, error: `[${res.status}] ${errorBody.slice(0, 300)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
