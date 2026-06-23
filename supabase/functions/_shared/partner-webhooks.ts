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
  /** notify_type — e.g. 'sale-paid', 'seller-approve', 'withdrawal-complete'. */
  eventType: string
  /** Optional event_id whose created_by_partner_id determines who gets notified. */
  eventId?: string | null
  /** Optional explicit partnerId — wins over eventId-based lookup. */
  partnerId?: string | null
  /** Payload that gets serialized as the POST body. */
  payload: Record<string, unknown>
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

    const body = JSON.stringify({
      event_type: input.eventType,
      delivered_at: new Date().toISOString(),
      data: input.payload,
    })

    for (const partner of partners) {
      if (!partner.is_active) continue
      if (!partner.webhook_url) continue
      const subs: string[] = partner.webhook_events ?? []
      if (subs.length > 0 && !subs.includes(input.eventType)) continue

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
            'X-Giftkal-Event': input.eventType,
          },
          body,
        })
        responseStatus = resp.status
        // Truncate so we don't bloat the deliveries table.
        responseBody = (await resp.text()).slice(0, 1000)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'unknown error'
        responseBody = `network error: ${msg}`
      }

      await supabase.from('partner_webhook_deliveries').insert({
        partner_id: partner.id,
        event_type: input.eventType,
        payload: input.payload,
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
