// payme-withdraw-balance
// ---------------------------------------------------------------------------
// Triggers a withdrawal from an event-owner's PayMe wallet to their linked
// bank account. The bank account itself is whatever was registered when the
// seller was created — we don't need to specify it again here.
//
// Endpoint:    POST https://live.payme.io/api/withdraw-balance
// Required:    payme_client_key, seller_payme_id, withdraw_currency
// Optional:    language, transaction_ids[] (for partial withdrawal)
//
// Notes from PayMe docs:
//   - Until KYC + bank docs are verified, the wallet is locked. Test for that
//     by checking seller_approved on the events row.
//   - Funds aren't withdrawable until 6 business days after the event (Israeli
//     cards). The frontend dashboard should show the release date, not this
//     function — here we just trust the admin's go-ahead.
//
// Webhook:     `withdrawal-complete` arrives separately and the existing
//              payme-webhook handler logs it. Phase C+ wires that to the
//              `payouts` table.
//
// Auth:        admin (initiating bulk payouts) OR event owner (self-service).
// ---------------------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WithdrawRequest {
  eventId: string
  /** Optional — limit the withdrawal to specific sales (for partial payouts). */
  transactionIds?: string[]
  /** Internal note saved on the payout row (e.g. "after wedding 2026-08-30"). */
  note?: string
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const paymeClientKey = Deno.env.get('PAYME_CLIENT_KEY')
    if (!paymeClientKey) throw new Error('PAYME_CLIENT_KEY not configured')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (userError || !user) return json({ error: 'Invalid token' }, 401)

    const body = await req.json() as WithdrawRequest
    if (!body.eventId) return json({ error: 'Missing eventId' }, 400)

    // Authorize: must be event owner OR admin.
    const [{ data: event, error: evErr }, { data: adminRole }] = await Promise.all([
      supabase
        .from('events')
        .select('id, owner_id, seller_payme_id, payment_setup_status, groom_name, bride_name')
        .eq('id', body.eventId)
        .single(),
      supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle(),
    ])

    if (evErr || !event) return json({ error: 'Event not found' }, 404)
    if (!event.seller_payme_id) return json({ error: 'Event has no PayMe seller' }, 400)

    const isOwner = event.owner_id === user.id
    const isAdmin = Boolean(adminRole)
    if (!isOwner && !isAdmin) return json({ error: 'Not allowed' }, 403)

    if (event.payment_setup_status !== 'approved') {
      return json({
        error: 'Seller not approved by PayMe yet — withdrawal not possible',
        currentStatus: event.payment_setup_status,
      }, 400)
    }

    // Record the pending payout BEFORE we hit PayMe so we have a stable row to
    // flip via the `withdrawal-complete` webhook. If the PayMe call fails we
    // mark it failed; otherwise we leave it 'submitted' and the webhook will
    // mark it 'completed'.
    const { data: payoutRow, error: payoutErr } = await supabase
      .from('payouts')
      .insert({
        event_id: body.eventId,
        seller_payme_id: event.seller_payme_id,
        currency: 'ILS',
        partial_transaction_ids: body.transactionIds ?? null,
        status: 'submitted',
        requested_by: user.id,
        approved_by: isAdmin ? user.id : null,
        note: body.note ?? null,
      })
      .select('id')
      .single()

    if (payoutErr) {
      console.error('Failed to record pending payout:', payoutErr.message)
      // Continue — we still want to attempt the PayMe call.
    }

    const paymePayload: Record<string, unknown> = {
      payme_client_key: paymeClientKey,
      seller_payme_id: event.seller_payme_id,
      withdraw_currency: 'ILS',
      language: 'he',
    }
    if (body.transactionIds?.length) {
      paymePayload.transaction_ids = body.transactionIds
    }

    console.log('PayMe withdraw:', {
      seller: event.seller_payme_id,
      partial: Boolean(body.transactionIds?.length),
    })

    const paymeResponse = await fetch('https://live.payme.io/api/withdraw-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymePayload),
    })
    const paymeResult = await paymeResponse.json()

    if (paymeResult.status_code !== 0) {
      console.error('PayMe withdraw rejected:', paymeResult.status_error_details ?? paymeResult.status_message)
      if (payoutRow) {
        await supabase
          .from('payouts')
          .update({
            status: 'failed',
            failure_reason: paymeResult.status_error_details ?? paymeResult.status_message ?? 'PayMe error',
          })
          .eq('id', payoutRow.id)
      }
      return json({
        error: 'PayMe withdrawal failed',
        details: paymeResult.status_error_details ?? paymeResult.status_error_code ?? paymeResult.status_message,
      }, 400)
    }

    return json({
      success: true,
      payoutId: payoutRow?.id,
      message: 'הבקשה התקבלה. הכסף יועבר לחשבון הבנק של בעל האירוע בתוך כמה ימי עסקים.',
    })

  } catch (error: unknown) {
    console.error('Error in payme-withdraw-balance:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return json({ error: message }, 500)
  }
})
