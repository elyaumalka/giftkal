import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import md5 from 'https://esm.sh/js-md5@0.8.3'
import { dispatchPartnerWebhooks } from '../_shared/partner-webhooks.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Map every PayMe notify_type to what we do with it.
// Confirmed list from PayMe docs (SaleCallbacksNotifyTypes + CompanyCallbacksNotifyTypes):
const PAYME_SALE_EVENTS = new Set([
  'sale-create',
  'sale-authorized',
  'sale-paid',
  'sale-failure',
  'sale-il-direct-debit-update',
  'sale-chargeback',
  'sale-chargeback-refund',
  'refund',
  'sale-complete',
  'charge-complete',
])
const PAYME_SELLER_EVENTS = new Set([
  'seller-create',
  'seller-update',
  'seller-approve',
])
const PAYME_PAYOUT_EVENTS = new Set([
  'withdrawal-complete',
])

type Payload = Record<string, string | number | undefined | null>

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Verify the MD5 signature PayMe attaches to webhook payloads.
 * Per PayMe support:
 *   signature = MD5(merchant_key + merchant_password + transaction_local_guid + sale_local_id)
 *
 * merchant_key      → our PAYME_CLIENT_KEY env var
 * merchant_password → our PAYME_CLIENT_SECRET env var
 * transaction_local_guid / sale_local_id → fields from the webhook payload itself
 *
 * Returns true if the signature matches OR if we don't have enough info to verify
 * (e.g. seller events that may not carry a sale_local_id). False only when we have
 * a non-matching signature.
 */
function verifyPaymeSignature(
  payload: Payload,
  merchantKey: string,
  merchantPassword: string,
): { ok: boolean; reason: string } {
  const received = (payload.payme_signature ?? payload.signature) as string | undefined
  if (!received) {
    return { ok: true, reason: 'no_signature_in_payload' }
  }

  // PayMe field names vary slightly between event families — try the common ones.
  const txGuid = (payload.transaction_id
    ?? payload.tran_id
    ?? payload.transaction_local_guid
    ?? '') as string
  const saleLocalId = (payload.sale_local_id
    ?? payload.payme_sale_id
    ?? payload.tran_payme_code
    ?? '') as string

  if (!txGuid && !saleLocalId) {
    return { ok: true, reason: 'no_signature_inputs' }
  }

  const expected = md5(merchantKey + merchantPassword + txGuid + saleLocalId)
  if (expected.toLowerCase() === String(received).toLowerCase()) {
    return { ok: true, reason: 'match' }
  }
  return { ok: false, reason: 'mismatch' }
}

async function handleSellerApprove(supabase: SupabaseClient, payload: Payload) {
  const sellerPaymeId = payload.seller_payme_id as string | undefined
  if (!sellerPaymeId) {
    return json({ error: 'Missing seller_payme_id' }, 400)
  }

  // Grab prior status so we only notify the partner on the actual transition
  // to approved. The admin's manual "בדוק ועדכן" may have already flipped this
  // to approved and dispatched — we don't want a duplicate here.
  const { data: prior } = await supabase
    .from('events')
    .select('id, payment_setup_status')
    .eq('seller_payme_id', sellerPaymeId)

  const { data: events, error: findErr } = await supabase
    .from('events')
    .update({ payment_setup_status: 'approved' })
    .eq('seller_payme_id', sellerPaymeId)
    .select('id')

  if (findErr) {
    console.error('seller-approve: failed to update event', findErr.message)
    return json({ error: 'Update failed' }, 500)
  }

  console.log(`seller-approve: ${sellerPaymeId} → approved (${events?.length ?? 0} event(s) updated)`)

  const priorByEvent: Record<string, string | null> = {}
  for (const p of prior ?? []) priorByEvent[p.id] = p.payment_setup_status ?? null

  // Notify any partner that created this event — but only if this is the
  // first time we're marking it approved.
  for (const ev of events ?? []) {
    if (priorByEvent[ev.id] === 'approved') {
      console.log(`seller-approve: event ${ev.id} already approved, skipping partner notify`)
      continue
    }
    await dispatchPartnerWebhooks(supabase, {
      eventType: 'seller-approve',
      eventId: ev.id,
      payload: {
        event_id: ev.id,
        seller_payme_id: sellerPaymeId,
        status: 'approved',
      },
    })
  }

  return json({ ok: true, updated: events?.length ?? 0 })
}

async function handleWithdrawalComplete(supabase: SupabaseClient, payload: Payload) {
  const sellerPaymeId = payload.seller_payme_id as string | undefined
  const paymePayoutCode = (payload.tran_payme_code ?? payload.payme_payout_code) as string | undefined
  const tranTotal = payload.tran_total as number | string | undefined

  console.log('withdrawal-complete:', {
    seller_payme_id: sellerPaymeId,
    payme_payout_code: paymePayoutCode,
    amount: tranTotal,
  })

  if (!sellerPaymeId) {
    return json({ error: 'Missing seller_payme_id' }, 400)
  }

  // Find the most recent 'submitted' payout for this seller and flip it to
  // 'completed'. We match on seller_payme_id + 'submitted' status because PayMe
  // doesn't echo our payouts.id back — but we only ever have one outstanding
  // withdrawal per seller at a time per our admin UX.
  const { data: matched, error: findErr } = await supabase
    .from('payouts')
    .select('id')
    .eq('seller_payme_id', sellerPaymeId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findErr) {
    console.error('Failed to look up payout:', findErr.message)
    return json({ ok: true, note: 'no payout row matched (logged only)' })
  }

  if (matched) {
    const { error: updErr } = await supabase
      .from('payouts')
      .update({
        status: 'completed',
        amount: typeof tranTotal === 'string' ? Number(tranTotal) : tranTotal ?? null,
        payme_payout_code: paymePayoutCode ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', matched.id)
    if (updErr) console.error('Failed to mark payout completed:', updErr.message)
    else console.log(`Marked payout ${matched.id} → completed`)
  } else {
    console.log('No submitted payout row matched; webhook recorded in logs only.')
  }

  return json({ ok: true, payoutId: matched?.id ?? null })
}

async function handleSellerLifecycle(_: SupabaseClient, payload: Payload, type: string) {
  // seller-create / seller-update — informational only. We already track sellers via
  // our own create-seller flow, so no DB action is needed here. Log for audit.
  console.log(`${type}:`, {
    seller_payme_id: payload.seller_payme_id,
  })
  return json({ ok: true })
}

async function handleSaleEvent(supabase: SupabaseClient, payload: Payload, type: string | undefined) {
  const transactionId = payload.transaction_id as string | undefined
  const paymeSaleId = payload.payme_sale_id as string | undefined

  if (!transactionId && !paymeSaleId) {
    console.error('Sale event missing both transaction_id and payme_sale_id', type)
    return json({ error: 'Missing transaction identifier' }, 400)
  }

  let query = supabase.from('transactions').select('*')
  if (transactionId) query = query.eq('id', transactionId)
  else if (paymeSaleId) query = query.eq('payme_sale_id', paymeSaleId)

  const { data: transaction, error: findErr } = await query.single()
  if (findErr || !transaction) {
    console.error('Transaction not found for sale webhook:', findErr?.message ?? 'no row')
    return json({ error: 'Transaction not found' }, 404)
  }

  // Map notify_type → our payment_status. We prefer the explicit event over the
  // raw sale_status/payme_status flags so we behave consistently with PayMe's lifecycle.
  let paymentStatus = transaction.payment_status
  switch (type) {
    case 'sale-paid':
    case 'sale-complete':
    case 'charge-complete':
      paymentStatus = 'completed'
      break
    case 'sale-authorized':
      paymentStatus = 'authorized'
      break
    case 'sale-failure':
      paymentStatus = 'failed'
      break
    case 'refund':
    case 'sale-chargeback-refund':
      paymentStatus = 'refunded'
      break
    case 'sale-chargeback':
      paymentStatus = 'chargeback'
      break
    default:
      // Fallback to the older heuristics for callbacks that don't carry notify_type.
      if (payload.sale_status === 'completed' || (payload.status_code === 0 && payload.payme_status === 'success')) {
        paymentStatus = 'completed'
      } else if (payload.payme_status === 'error' || payload.payme_status === 'failed' || payload.sale_status === 'failed') {
        paymentStatus = 'failed'
      } else if (payload.sale_status === 'refunded') {
        paymentStatus = 'refunded'
      }
  }

  const { error: updateErr } = await supabase
    .from('transactions')
    .update({
      payme_transaction_id: payload.payme_transaction_id ?? transaction.payme_transaction_id,
      payme_sale_id: paymeSaleId ?? transaction.payme_sale_id,
      payment_status: paymentStatus,
    })
    .eq('id', transaction.id)

  if (updateErr) {
    console.error('Failed to update transaction:', updateErr.message)
    return json({ error: 'Failed to update transaction' }, 500)
  }

  console.log(`${type ?? 'sale-event'}: tx=${transaction.id} → ${paymentStatus}`)

  // Notify the originating partner (if any) about the new payment state.
  if (paymentStatus !== transaction.payment_status) {
    await dispatchPartnerWebhooks(supabase, {
      eventType: type ?? 'sale-event',
      eventId: transaction.event_id,
      partnerId: transaction.partner_id ?? undefined,
      payload: {
        transaction_id: transaction.id,
        event_id: transaction.event_id,
        payment_status: paymentStatus,
        amount: transaction.amount,
        gift_amount: transaction.gift_amount,
        fee_amount: transaction.fee_amount,
        partner_share: transaction.partner_share,
        platform_partner_share: transaction.platform_partner_share,
        payer_name: transaction.payer_name,
        installments: transaction.installments,
      },
    })
  }

  return json({ success: true, transactionId: transaction.id, status: paymentStatus })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const merchantKey = Deno.env.get('PAYME_CLIENT_KEY') ?? ''
    const merchantPassword = Deno.env.get('PAYME_CLIENT_SECRET') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // PayMe sends callbacks as JSON or form-urlencoded depending on event family.
    const contentType = req.headers.get('content-type') ?? ''
    let payload: Payload
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text()
      payload = Object.fromEntries(new URLSearchParams(text).entries()) as Payload
      console.log('PayMe webhook (form):', text.slice(0, 800))
    } else {
      payload = await req.json() as Payload
      console.log('PayMe webhook (JSON):', JSON.stringify(payload).slice(0, 800))
    }

    const notifyType = payload.notify_type as string | undefined

    // Signature verification: hard-reject mismatches when both env secrets are
    // present AND PayMe sent a signature. We still let through events that don't
    // carry a signature (some seller-* event types may not — verified() returns
    // ok:true with reason='no_signature_in_payload' for those).
    if (merchantKey && merchantPassword) {
      const sig = verifyPaymeSignature(payload, merchantKey, merchantPassword)
      if (!sig.ok) {
        console.warn('PayMe signature mismatch — rejecting', {
          notify_type: notifyType,
          reason: sig.reason,
        })
        return json({ error: 'Invalid signature' }, 401)
      }
      if (sig.reason === 'match') {
        console.log('PayMe signature verified', { notify_type: notifyType })
      }
    } else {
      console.warn('PayMe webhook: missing merchant credentials — signature NOT verified', {
        hasKey: Boolean(merchantKey),
        hasPassword: Boolean(merchantPassword),
      })
    }

    // Route by notify_type. Unknown event types are accepted with a log so PayMe
    // doesn't retry storm us; we'll add handlers later if needed.
    if (notifyType === 'seller-approve') {
      return await handleSellerApprove(supabase, payload)
    }
    if (notifyType && PAYME_SELLER_EVENTS.has(notifyType)) {
      return await handleSellerLifecycle(supabase, payload, notifyType)
    }
    if (notifyType && PAYME_PAYOUT_EVENTS.has(notifyType)) {
      return await handleWithdrawalComplete(supabase, payload)
    }
    if (notifyType && PAYME_SALE_EVENTS.has(notifyType)) {
      return await handleSaleEvent(supabase, payload, notifyType)
    }

    // No notify_type — old-style callback from /api/generate-sale.
    // Treat as a sale event.
    if (!notifyType) {
      return await handleSaleEvent(supabase, payload, undefined)
    }

    console.log('Unhandled PayMe notify_type:', notifyType)
    return json({ ok: true, ignored: notifyType })

  } catch (error: unknown) {
    console.error('Error in payme-webhook:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return json({ error: message }, 500)
  }
})
