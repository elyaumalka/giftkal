import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface GenerateLinkRequest {
  eventId: string;
  amount: number;
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: GenerateLinkRequest = await req.json();
    const {
      eventId, amount, payerName, payerEmail, payerPhone,
      relationship, blessing, blessingImageUrl, blessingVideoUrl, installments = 1,
    } = body;

    if (!eventId || !amount || !payerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId, amount, payerName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get event and seller info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, seller_payme_id, groom_name, bride_name, venue_id')
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
        JSON.stringify({ error: 'Event not configured for payments' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create pending transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        event_id: eventId,
        venue_id: event.venue_id,
        payer_name: payerName,
        payer_email: payerEmail || null,
        payer_phone: payerPhone || null,
        amount,
        installments,
        relationship: relationship || null,
        blessing_text: blessing || null,
        receipt_url: blessingImageUrl || null,
        blessing_video_url: blessingVideoUrl || null,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction creation error:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build PayMe generate-sale request (redirect mode, no buyer_key)
    const paymeBaseUrl = 'https://live.payme.io';
    const callbackUrl = `${supabaseUrl}/functions/v1/payme-webhook`;
    
    // Build return URLs - use the app's gift page with query params
    // We need to figure out the app URL from the request origin or use a fallback
    const requestOrigin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '');
    const origin = requestOrigin && /^https:\/\//.test(requestOrigin)
      ? requestOrigin
      : 'https://giftkal.com';
    const successUrl = `${origin}/gift/${eventId}/send?payment_status=success&transaction_id=${transaction.id}`;
    const failureUrl = `${origin}/gift/${eventId}/send?payment_status=failed&transaction_id=${transaction.id}`;

    const productName = `מתנה ל${event.groom_name || ''} & ${event.bride_name || ''}`;

    const salePayload: Record<string, unknown> = {
      seller_payme_id: event.seller_payme_id,
      sale_price: Math.round(amount * 100), // agorot
      currency: 'ILS',
      product_name: productName,
      transaction_id: transaction.id,
      installments: installments > 1 ? installments.toString() : '1',
      language: 'he',
      capture_buyer: '0',
      sale_callback_url: callbackUrl,
      sale_return_url: successUrl,
      sale_failure_url: failureUrl,
      sale_name: payerName,
    };

    if (payerEmail) salePayload.sale_email = payerEmail;
    if (payerPhone) salePayload.sale_mobile = payerPhone;

    console.log('Calling PayMe generate-sale (redirect mode):', paymeBaseUrl);
    console.log('Payload:', JSON.stringify({ ...salePayload, seller_payme_id: '[REDACTED]' }));

    const paymeResponse = await fetch(`${paymeBaseUrl}/api/generate-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salePayload),
    });

    const paymeResult = await paymeResponse.json();
    console.log('PayMe response:', JSON.stringify(paymeResult));

    if (paymeResult.status_code !== 0) {
      await supabase
        .from('transactions')
        .update({ payment_status: 'failed' })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          error: 'PayMe error',
          details: paymeResult.status_error_details || paymeResult.status_error_code || paymeResult.status_additional_info,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PayMe returns a sale_url for redirect
    const saleUrl = paymeResult.sale_url;
    if (!saleUrl) {
      console.error('No sale_url in PayMe response:', paymeResult);
      return new Response(
        JSON.stringify({ error: 'No payment URL returned from PayMe' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update transaction with PayMe sale ID
    if (paymeResult.payme_sale_id) {
      await supabase
        .from('transactions')
        .update({ payme_sale_id: paymeResult.payme_sale_id })
        .eq('id', transaction.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        saleUrl,
        transactionId: transaction.id,
        paymeSaleId: paymeResult.payme_sale_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in payme-generate-link:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
