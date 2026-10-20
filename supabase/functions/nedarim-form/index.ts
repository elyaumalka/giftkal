// Keyless, browser-safe gateway for the Nedarim Plus forms.
// Exposes ONLY: create owner+event (optionally with payment account), submit/upload
// payment account for events created here, list/get PUBLIC event fields, and record a gift.
// No API key is needed or returned; nothing sensitive (phones, emails, IDs, bank) is ever read back.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SITE_URL } from '../_shared/site.ts'

const SOURCE = 'nedarim_form'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}
const PUBLIC_EVENT_FIELDS =
  'id, event_type, event_date, groom_name, bride_name, child_name, family_name, custom_venue_name, custom_venue_location, venue_id, hall_id, hf_api_key, gifts_enabled, payment_setup_status, seller_payme_id, venues(name, address)'

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const err = (message: string, status = 400) => json({ responseStatus: 'ERROR', error: message, code: status }, status)
const ok = (r: Record<string, unknown>) => json({ responseStatus: 'OK', ...r })

// Best-effort per-IP rate limit (per instance)
const hits = new Map<string, number[]>()
function limited(ip: string, action: string, max: number, windowMs: number) {
  const k = ip + '|' + action, now = Date.now()
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs)
  arr.push(now); hits.set(k, arr)
  return arr.length > max
}

function publicEvent(e: any) {
  const venue = e.venues || null
  return {
    id: e.id, event_type: e.event_type, event_date: e.event_date,
    groom_name: e.groom_name, bride_name: e.bride_name, child_name: e.child_name, family_name: e.family_name,
    venue_name: venue?.name || e.custom_venue_name || null,
    venue_location: venue?.address || e.custom_venue_location || null,
    venue_id: e.venue_id, hall_id: e.hall_id,
    hf_api_key: e.hf_api_key,
    can_receive_payments: e.payment_setup_status === 'approved' && !!e.seller_payme_id,
    gift_link: `${SITE_URL}/gift/${e.id}`,
  }
}

function buildSetupData(b: any, prior: Record<string, unknown>) {
  const required = ['first_name', 'last_name', 'social_id', 'birthdate', 'email', 'phone', 'bank_code', 'bank_branch',
    'bank_account_number', 'inc_type', 'merchant_name', 'city', 'street', 'street_number']
  for (const f of required) if (b[f] === undefined || b[f] === null || b[f] === '') return { error: `Missing required field: ${f}` }
  if (!/^\d{9}$/.test(String(b.social_id))) return { error: 'social_id must be exactly 9 digits' }
  const phone = String(b.phone).replace(/[^0-9+]/g, '')
  if (!/^(\+972|0)\d{9}$/.test(phone)) return { error: 'phone must be a valid Israeli number' }
  return {
    data: {
      firstName: String(b.first_name).trim(), lastName: String(b.last_name).trim(),
      socialId: String(b.social_id), socialIdDate: b.social_id_date || '', birthdate: b.birthdate,
      gender: b.gender ?? 0, email: String(b.email).trim().toLowerCase(), phone,
      bankCode: Number(b.bank_code), bankBranch: String(b.bank_branch), bankAccountNumber: String(b.bank_account_number),
      incType: Number(b.inc_type), incCode: b.inc_code || '',
      merchantName: String(b.merchant_name).trim(), merchantNameEn: b.merchant_name_en || String(b.merchant_name).trim(),
      siteUrl: SITE_URL, city: String(b.city).trim(), street: String(b.street).trim(), streetNumber: String(b.street_number).trim(),
      socialIdFile: prior.socialIdFile, bankApprovalFile: prior.bankApprovalFile,
      submitted_via: SOURCE, submitted_at: new Date().toISOString(),
    },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'

  try {
    const url = new URL(req.url)
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const action = url.searchParams.get('action') || body.action || ''
    const p = (k: string) => url.searchParams.get(k) || body[k]
    console.log('[nedarim-form]', action, 'ip', ip, 'origin', req.headers.get('origin'))

    // Events created through this gateway that can still be onboarded
    async function ownEvent(id: string) {
      if (!id) return null
      const { data } = await supabase.from('events')
        .select('id, created_via, seller_payme_id, payment_setup_status, payment_setup_data').eq('id', id).maybeSingle()
      return data && data.created_via === SOURCE ? data : null
    }

    switch (action) {
      case 'ListEvents': {
        if (limited(ip, action, 120, 60_000)) return err('Too many requests', 429)
        let q = supabase.from('events').select(PUBLIC_EVENT_FIELDS).order('event_date', { ascending: true })
        const from = p('from_date'); const to = p('to_date'); const venue = p('venue_id')
        q = q.gte('event_date', from || new Date(Date.now() - 86400000 * 30).toISOString().slice(0, 10))
        if (to) q = q.lte('event_date', to)
        if (venue) q = q.eq('venue_id', venue)
        const { data, error } = await q.limit(1000)
        if (error) return err(error.message, 500)
        return ok({ events: (data || []).map(publicEvent), count: data?.length || 0 })
      }
      case 'GetEvent': {
        if (limited(ip, action, 300, 60_000)) return err('Too many requests', 429)
        const id = p('event_id') || p('id')
        if (!id) return err('event_id is required')
        const { data } = await supabase.from('events').select(PUBLIC_EVENT_FIELDS).eq('id', id).maybeSingle()
        if (!data) return err('Event not found', 404)
        return ok({ event: publicEvent(data) })
      }
      case 'CreateEventOwner': {
        if (req.method !== 'POST') return err('POST required', 405)
        if (limited(ip, action, 10, 3600_000)) return err('Too many requests', 429)
        const { full_name, phone, event } = body
        const email = String(body.email || '').trim().toLowerCase()
        if (!email || !full_name || !event?.event_date) return err('email, full_name and event.event_date are required')

        let userId: string
        let isNew = false
        const { data: existing } = await supabase.from('profiles').select('user_id').eq('email', email).limit(1)
        if (existing?.length) {
          userId = existing[0].user_id
        } else {
          const password = crypto.randomUUID().replace(/-/g, '').slice(0, 12) + 'A1!'
          const { data: nu, error: ce } = await supabase.auth.admin.createUser({
            email, password, email_confirm: true, user_metadata: { full_name },
          })
          if (ce || !nu?.user) return err(ce?.message || 'Failed to create user')
          userId = nu.user.id; isNew = true
          await new Promise((r) => setTimeout(r, 300))
          await supabase.from('profiles').update({ full_name, phone: phone || null }).eq('user_id', userId)
          await supabase.from('user_roles').insert({ user_id: userId, role: 'event_owner' })
        }

        const { data: ev, error: ee } = await supabase.from('events').insert({
          owner_id: userId, created_via: SOURCE,
          event_type: event.event_type || 'חתונה', event_date: event.event_date,
          groom_name: event.groom_name || null, bride_name: event.bride_name || null,
          child_name: event.child_name || null, family_name: event.family_name || null,
          venue_id: event.venue_id || null, hall_id: event.hall_id || null,
          custom_venue_name: event.venue_name || event.custom_venue_name || null,
          custom_venue_location: event.venue_location || event.custom_venue_location || null,
          reception_time: event.reception_time || null, ceremony_time: event.ceremony_time || null,
        }).select('id, event_date, event_type').single()
        if (ee) return err('Event creation failed: ' + ee.message, 500)

        let payment: Record<string, unknown> | null = null
        if (body.payment_account) {
          const built = buildSetupData(body.payment_account, {})
          if ('error' in built) payment = { status: 'error', error: built.error }
          else {
            await supabase.from('events').update({ payment_setup_status: 'pending_approval', payment_setup_data: built.data }).eq('id', ev.id)
            payment = { status: 'pending_review' }
          }
        }
        return ok({
          is_new_user: isNew,
          event: { id: ev.id, event_date: ev.event_date, event_type: ev.event_type,
            gift_link: `${SITE_URL}/gift/${ev.id}`, login_url: `${SITE_URL}/login/event` },
          payment_account: payment,
        })
      }
      case 'SubmitPaymentAccount': {
        if (req.method !== 'POST') return err('POST required', 405)
        if (limited(ip, action, 10, 3600_000)) return err('Too many requests', 429)
        const ev = await ownEvent(body.event_id)
        if (!ev) return err('Event not found', 404)
        if (ev.seller_payme_id || ev.payment_setup_status === 'pending_approval' || ev.payment_setup_status === 'approved')
          return err('Payment account already submitted for this event')
        const built = buildSetupData(body, (ev.payment_setup_data as Record<string, unknown>) || {})
        if ('error' in built) return err(built.error!)
        const { error } = await supabase.from('events').update({ payment_setup_status: 'pending_approval', payment_setup_data: built.data }).eq('id', ev.id)
        if (error) return err(error.message, 500)
        return ok({ status: 'pending_review' })
      }
      case 'UploadPaymentDocument': {
        if (req.method !== 'POST') return err('POST required', 405)
        if (limited(ip, action, 20, 3600_000)) return err('Too many requests', 429)
        const ev = await ownEvent(body.event_id)
        if (!ev) return err('Event not found', 404)
        if (ev.seller_payme_id || ev.payment_setup_status === 'approved') return err('Payment account already active')
        if (!['social_id', 'bank_approval'].includes(body.document_type)) return err('document_type must be social_id or bank_approval')
        if (!body.file_base64 || !body.file_name) return err('file_name and file_base64 are required')
        if (String(body.file_base64).length > 14_000_000) return err('File too large (max 10MB)')
        const prior = (ev.payment_setup_data as Record<string, unknown>) || {}
        const f = { base64: String(body.file_base64), name: String(body.file_name), mimeType: body.mime_type || 'application/pdf' }
        const next = { ...prior, ...(body.document_type === 'social_id' ? { socialIdFile: f } : { bankApprovalFile: f }) }
        const { error } = await supabase.from('events').update({ payment_setup_data: next }).eq('id', ev.id)
        if (error) return err(error.message, 500)
        return ok({ uploaded: true, document_type: body.document_type })
      }
      case 'CreateTransaction': {
        if (req.method !== 'POST') return err('POST required', 405)
        if (limited(ip, action, 60, 3600_000)) return err('Too many requests', 429)
        const { event_id, payer_name, amount, payme_sale_id } = body
        if (!event_id || !payer_name || !amount || !payme_sale_id) return err('event_id, payer_name, amount and payme_sale_id are required')
        const { data: dup } = await supabase.from('transactions').select('id').eq('payme_sale_id', payme_sale_id).maybeSingle()
        if (dup) return ok({ transaction_id: dup.id, duplicate: true })
        const { data: e } = await supabase.from('events').select('id, venue_id').eq('id', event_id).maybeSingle()
        if (!e) return err('Event not found', 404)
        const { data, error } = await supabase.from('transactions').insert({
          event_id, payer_name, amount: Number(amount), payme_sale_id,
          payer_phone: body.payer_phone || null, payer_email: body.payer_email || null,
          relationship: body.relationship || null, blessing_text: body.blessing_text || null,
          side: body.side || null, installments: body.installments || 1, venue_id: e.venue_id,
          payment_status: 'completed',
        }).select('id').single()
        if (error) return err(error.message)
        return ok({ transaction_id: data.id })
      }
      default:
        return err(`Unknown action: ${action}. Allowed: ListEvents, GetEvent, CreateEventOwner, SubmitPaymentAccount, UploadPaymentDocument, CreateTransaction`)
    }
  } catch (e) {
    console.error('[nedarim-form] error', e)
    return err(e instanceof Error ? e.message : 'Internal error', 500)
  }
})
