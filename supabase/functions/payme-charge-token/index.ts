import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { dispatchPartnerWebhooks } from '../_shared/partner-webhooks.ts'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface ChargeTokenRequest {
  token: string;
  eventId: string;
  /** What the card is debited (gross-up total). */
  amount: number;
  /** What the couple receives (gift intent). Falls back to `amount` if missing
   *  for backward compatibility with old clients. */
  giftAmount?: number;
  /** Fee surcharge collected on top of the gift amount. Defaults to 0. */
  feeAmount?: number;
  /** Client-computed partner share (informational — recomputed server-side). */
  partnerShare?: number;
  platformPartnerShare?: number;
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  relationship?: string;
  blessing?: string;
  blessingImageUrl?: string;
  blessingVideoUrl?: string;
  installments?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: ChargeTokenRequest = await req.json();

    const {
      token,
      eventId,
      amount,
      giftAmount,
      feeAmount,
      payerName,
      payerEmail,
      payerPhone,
      relationship,
      blessing,
      blessingImageUrl,
      blessingVideoUrl,
      installments = 1,
    } = body;

    // Gross-up bookkeeping. Backward-compatible: if the client didn't send the
    // breakdown, treat the whole charge as the gift (zero fee).
    const giftPart = typeof giftAmount === 'number' && giftAmount > 0 ? giftAmount : amount;
    const feePart = typeof feeAmount === 'number' && feeAmount >= 0
      ? feeAmount
      : Math.max(0, amount - giftPart);

    if (!token || !eventId || !amount || !payerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, eventId, amount, payerName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get event and seller info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, seller_payme_id, groom_name, bride_name, venue_id, created_by_partner_id, venues(name)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!event.seller_payme_id) {
      return new Response(
        JSON.stringify({ error: 'Event not configured for payments - missing seller_payme_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-authoritative partner share computation: never trust the client.
    let partnerId: string | null = null;
    let partnerShare = 0;
    let platformPartnerShare = 0;
    if (event.created_by_partner_id) {
      const { data: partner } = await supabase
        .from('partners')
        .select('id, partner_commission_pct, platform_commission_pct, is_active')
        .eq('id', event.created_by_partner_id)
        .maybeSingle();
      if (partner?.is_active) {
        partnerId = partner.id;
        const partnerPct = Number(partner.partner_commission_pct) || 0;
        const platformPct = Number(partner.platform_commission_pct) || 0;
        partnerShare = Math.round(giftPart * partnerPct) / 100;
        platformPartnerShare = Math.round(giftPart * platformPct) / 100;
      }
    }

    // Create transaction record first (pending)
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        event_id: eventId,
        venue_id: event.venue_id,
        payer_name: payerName,
        payer_email: payerEmail || null,
        payer_phone: payerPhone || null,
        amount: amount,
        gift_amount: giftPart,
        fee_amount: feePart,
        installments: installments,
        relationship: relationship || null,
        blessing_text: blessing || null,
        receipt_url: blessingImageUrl || null,
        blessing_video_url: blessingVideoUrl || null,
        payment_status: 'pending',
        partner_id: partnerId,
        partner_share: partnerShare,
        platform_partner_share: platformPartnerShare,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PayMe production environment
    const paymeBaseUrl = 'https://live.payme.io';

    // Generate sale using buyer_key (token from Hosted Fields)
    // Per PayMe Postman collection: POST /api/generate-sale with buyer_key
    const productName = `מתנה ל${event.groom_name || ''} & ${event.bride_name || ''}`;
    
    // Callback URL for PayMe webhook
    const callbackUrl = `${supabaseUrl}/functions/v1/payme-webhook`;
    
    const salePayload: Record<string, unknown> = {
      seller_payme_id: event.seller_payme_id,
      sale_price: Math.round(amount * 100), // PayMe expects price in agorot
      currency: 'ILS',
      product_name: productName,
      transaction_id: transaction.id,
      buyer_key: token, // The token from Hosted Fields tokenization
      sale_callback_url: callbackUrl,
      sale_name: payerName,
      language: 'he',
    };

    // Add optional fields
    if (payerEmail) salePayload.sale_email = payerEmail;
    if (payerPhone) salePayload.sale_mobile = payerPhone;
    if (installments > 1) salePayload.installments = installments.toString();
    else salePayload.installments = '1';

    console.log('Calling PayMe generate-sale with token:', paymeBaseUrl);
    console.log('Sale payload:', JSON.stringify({ ...salePayload, buyer_key: '[REDACTED]' }));

    const paymeResponse = await fetch(`${paymeBaseUrl}/api/generate-sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(salePayload),
    });

    const paymeResult = await paymeResponse.json();
    console.log('PayMe response:', JSON.stringify(paymeResult));

    if (paymeResult.status_code !== 0) {
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({ payment_status: 'failed' })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({ 
          error: 'PayMe error', 
          details: paymeResult.status_error_details || paymeResult.status_error_code || paymeResult.status_additional_info
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update transaction as completed
    await supabase
      .from('transactions')
      .update({ 
        payment_status: 'completed',
        payme_sale_id: paymeResult.payme_sale_id,
        payme_transaction_id: paymeResult.payme_transaction_id,
      })
      .eq('id', transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        paymeSaleId: paymeResult.payme_sale_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in payme-charge-token:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
