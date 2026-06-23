// payme-generate-transfer
// ---------------------------------------------------------------------------
// Moves money from one PayMe wallet to another inside our marketplace.
// Used to sweep giftkal's platform commission out of an event-owner's wallet
// into the master wallet after each sale (or in batches at admin discretion).
//
// Endpoint:    POST https://live.payme.io/api/sales
// PayMe trick: same /api/sales endpoint used for guest sales — payment.method
//              = "Bank Transfer" tells PayMe to treat the request as a
//              wallet-to-wallet transfer instead of a card sale.
//
// Auth:        admin only (system-wide role). We verify via Supabase Auth
//              user → user_roles table.
// ---------------------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransferRequest {
  eventId: string
  /** Amount in ILS (whole shekels with decimals OK). */
  amount: number
  /** Human-readable label that shows up in the PayMe ledger. */
  productName?: string
  /**
   * Optional: link this transfer back to one or more guest transactions so the
   * commission_transfers row stays joinable.
   */
  sourceTransactionIds?: string[]
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
    // The seller_payme_id of giftkal's own (master) PayMe account — where the
    // commission lands. Configured once in Supabase secrets after onboarding.
    const masterSellerId = Deno.env.get('PAYME_MASTER_SELLER_ID')

    if (!paymeClientKey) {
      throw new Error('PAYME_CLIENT_KEY not configured')
    }
    if (!masterSellerId) {
      throw new Error('PAYME_MASTER_SELLER_ID not configured (giftkal\'s seller id)')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (userError || !user) return json({ error: 'Invalid token' }, 401)

    // Only admins may sweep wallets.
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!adminRole) return json({ error: 'Admin only' }, 403)

    const body = await req.json() as TransferRequest
    if (!body.eventId || !body.amount || body.amount <= 0) {
      return json({ error: 'Missing or invalid eventId / amount' }, 400)
    }

    // Find the event-owner's seller_payme_id (the source wallet).
    const { data: event, error: evErr } = await supabase
      .from('events')
      .select('id, seller_payme_id, groom_name, bride_name, child_name, family_name')
      .eq('id', body.eventId)
      .single()

    if (evErr || !event) return json({ error: 'Event not found' }, 404)
    if (!event.seller_payme_id) {
      return json({ error: 'Event has no PayMe seller — cannot transfer' }, 400)
    }

    const paymeBaseUrl = 'https://live.payme.io'
    const productName = body.productName
      ?? `giftkal commission · ${event.groom_name ?? event.child_name ?? event.family_name ?? body.eventId.slice(0, 8)}`

    // PayMe payload for wallet-to-wallet transfer.
    // payment.method = "Bank Transfer"
    // payment.origin_seller_id = the seller WE PULL FROM (event owner)
    // seller_payme_id          = the seller WE PUSH TO   (giftkal master)
    const transferPayload = {
      payme_client_key: paymeClientKey,
      payment: {
        method: 'Bank Transfer',
        origin_seller_id: event.seller_payme_id,
      },
      currency: 'ILS',
      sale_price: body.amount,
      product_name: productName,
      seller_payme_id: masterSellerId,
    }

    console.log('PayMe transfer:', {
      origin: event.seller_payme_id,
      destination: masterSellerId,
      amount: body.amount,
    })

    // Insert a pending row before calling PayMe so we never lose track if the
    // process dies mid-call. The webhook (or a manual sync) will flip it
    // to 'completed' once PayMe confirms.
    const { data: pendingRow, error: pendingErr } = await supabase
      .from('platform_commission_transfers')
      .insert({
        event_id: body.eventId,
        amount: body.amount,
        status: 'submitted',
        initiated_by: user.id,
        source_transaction_ids: body.sourceTransactionIds ?? null,
      })
      .select('id')
      .single()

    if (pendingErr) {
      console.error('Failed to record pending transfer:', pendingErr.message)
      // Continue anyway — the PayMe call is what matters; we'll patch the DB.
    }

    const paymeResponse = await fetch(`${paymeBaseUrl}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferPayload),
    })
    const paymeResult = await paymeResponse.json()

    if (paymeResult.status_code !== 0) {
      console.error('PayMe transfer rejected:', paymeResult.status_error_details ?? paymeResult.status_message)
      if (pendingRow) {
        await supabase
          .from('platform_commission_transfers')
          .update({
            status: 'failed',
            failure_reason: paymeResult.status_error_details ?? paymeResult.status_message ?? 'PayMe error',
          })
          .eq('id', pendingRow.id)
      }
      return json({
        error: 'PayMe transfer failed',
        details: paymeResult.status_error_details ?? paymeResult.status_error_code ?? paymeResult.status_message,
      }, 400)
    }

    // Success — record the PayMe identifiers so we can reconcile later.
    if (pendingRow) {
      await supabase
        .from('platform_commission_transfers')
        .update({
          status: 'completed',
          payme_sale_id: paymeResult.payme_sale_id ?? null,
          payme_transaction_id: paymeResult.payme_transaction_id ?? null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', pendingRow.id)
    }

    return json({
      success: true,
      transferId: pendingRow?.id,
      paymeSaleId: paymeResult.payme_sale_id,
      releaseDate: paymeResult.sale_release_date ?? null,
      amount: body.amount,
    })

  } catch (error: unknown) {
    console.error('Error in payme-generate-transfer:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return json({ error: message }, 500)
  }
})
