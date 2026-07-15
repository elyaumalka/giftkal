// Shared partner-webhook dispatcher.
// ----------------------------------------------------------------------------
// Used by edge functions that observe a real-world event (PayMe webhook,
// admin action, etc.) and need to notify any partner that subscribed to it.
//
// Each partner row carries:
//   - webhook_url     where to POST the payload
//   - webhook_secret  HMAC-SHA256 secret used to sign the payload
//   - webhook_events  array of notify_type strings the partner cares about
//
// Every delivery attempt is recorded into partner_webhook_deliveries so the
// admin can debug missed events.
// ----------------------------------------------------------------------------

import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

export interface DispatchInput {
  /** Internal notify_type — e.g. 'sale-paid', 'seller-approve', 'withdrawal-complete'.
   *  Gets translated to the partner-facing event name before sending. */
  eventType: string
  /** Optional event_id whose created_by_partner_id determines who gets notified. */
  eventId?: string | null
  /** Optional explicit partnerId — wins over eventId-based lookup. */
  partnerId?: string | null
  /** Payload — PayMe-specific fields are stripped automatically. */
  payload: Record<string, unknown>
}

/**
 * Public webhook contract. Partners never see PayMe branding or IDs.
 *  Internal name          → Public event name we send to partners.
 */
const INTERNAL_TO_PUBLIC: Record<string, string> = {
  'seller-created': 'payment-account-pending',
  'seller-approve': 'payment-account-approved',
  'seller-reject': 'payment-account-rejected',
  'sale-paid': 'sale-paid',
  'sale-failure': 'sale-failure',
  'sale-complete': 'sale-paid',
  'charge-complete': 'sale-paid',
  'sale-authorized': 'sale-authorized',
  'refund': 'refund',
  'sale-chargeback-refund': 'refund',
  'sale-chargeback': 'chargeback',
  'withdrawal-complete': 'withdrawal-complete',
}

/** Fields we must never expose to partners (they leak the processor identity). */
const FORBIDDEN_KEYS = new Set([
  'seller_payme_id',
  'payme_payout_code',
  'payme_transaction_id',
  'payme_sale_id',
  'payme_status',
  'payme_client_key',
])

function sanitizeForPartner(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(payload)) {
    if (FORBIDDEN_KEYS.has(k)) continue
    if (k.startsWith('payme_')) continue
    out[k] = v
  }
  // Normalize a couple of processor-specific field names to neutral ones.
  if (payload.payme_payout_code && !out.payout_reference) {
    out.payout_reference = payload.payme_payout_code
  }
  return out
}

/**
 * Find partner(s) interested in this event and POST a signed payload to each
 * one. Best-effort: failures don't bubble up — we record them and let the
 * caller continue with its own work (the partner can retry via a separate
 * admin replay tool later).
 */
export async function dispatchPartnerWebhooks(
  supabase: any,
  input: DispatchInput,
): Promise<void> {
  try {
    // Resolve the partner(s) to notify.
    let partnerIds: string[] = []
    if (input.partnerId) {
      partnerIds = [input.partnerId]
    } else if (input.eventId) {
      const { data: ev } = await supabase
        .from('events')
        .select('created_by_partner_id')
        .eq('id', input.eventId)
        .maybeSingle()
      if (ev?.created_by_partner_id) partnerIds = [ev.created_by_partner_id]
    }

    if (partnerIds.length === 0) return // No partner to notify.

    const { data: partners } = await supabase
      .from('partners')
      .select('id, webhook_url, webhook_secret, webhook_events, is_active')
      .in('id', partnerIds)

    if (!partners?.length) return

    // Translate to the partner-facing event name and strip processor-specific fields.
    const publicEventType = INTERNAL_TO_PUBLIC[input.eventType] ?? input.eventType
    const publicPayload = sanitizeForPartner(input.payload)

    const body = JSON.stringify({
      event_type: publicEventType,
      delivered_at: new Date().toISOString(),
      data: publicPayload,
    })

    for (const partner of partners) {
      if (!partner.is_active) continue
      if (!partner.webhook_url) continue
      const subs: string[] = partner.webhook_events ?? []
      // Match subscription against either the public or the legacy internal name
      // so partners saved with older event ids keep working.
      if (subs.length > 0 && !subs.includes(publicEventType) && !subs.includes(input.eventType)) continue

      const signature = partner.webhook_secret
        ? signHmac(partner.webhook_secret, body)
        : null

      let responseStatus: number | null = null
      let responseBody: string | null = null

      try {
        const resp = await fetch(partner.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature ? { 'X-Giftkal-Signature': signature } : {}),
            'X-Giftkal-Event': publicEventType,
          },
          body,
        })
        responseStatus = resp.status
        responseBody = (await resp.text()).slice(0, 1000)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'unknown error'
        responseBody = `network error: ${msg}`
      }

      await supabase.from('partner_webhook_deliveries').insert({
        partner_id: partner.id,
        event_type: publicEventType,
        payload: publicPayload,
        signature,
        response_status: responseStatus,
        response_body: responseBody,
      })
    }
  } catch (err) {
    console.error('dispatchPartnerWebhooks failed (non-fatal):', err)
  }
}

function signHmac(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}
