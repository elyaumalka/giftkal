import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

async function validateApiKey(supabase: any, apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data: keyData } = await supabase
    .from('api_keys')
    .select('id, is_active')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .maybeSingle();

  return !!keyData;
}

/**
 * Public endpoint for Nedarim Plus form to create a PayMe gift sale.
 * 
 * Flow:
 * 1. Nedarim form sends gift details (event_id, payer info, amount)
 * 2. We validate the API key (from api_keys table, managed in admin panel)
 * 3. We find the event's PayMe seller
 * 4. We create a transaction record (pending)
 * 5. We generate a PayMe sale for the event owner's seller
 * 6. We return the sale_url for redirect
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paymeClientKey = Deno.env.get('PAYME_CLIENT_KEY');

    if (!paymeClientKey) {
      throw new Error('PayMe credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    console.log('[nedarim-gift] Received:', JSON.stringify(body));

    // Validate API key - from header or body
    const apiKey = req.headers.get('x-api-key') || body.api_key;
    const isValid = await validateApiKey(supabase, apiKey);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid or missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { event_id, payer_name, payer_phone, payer_email, payer_id, amount, relationship, blessing_text, event_type, venue_name, venue_location, event_date, event_owner_name } = body;


    if (!event_id || !amount || !payer_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event_id, amount, payer_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the event and its PayMe seller
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, seller_payme_id, groom_name, bride_name, venue_id, event_type, event_date')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found', event_id }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!event.seller_payme_id) {
      return new Response(
        JSON.stringify({ error: 'Event not configured for payments - no PayMe seller' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create transaction record (pending)
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        event_id: event_id,
        venue_id: event.venue_id,
        payer_name: payer_name,
        payer_email: payer_email || null,
        payer_phone: payer_phone || null,
        amount: Number(amount),
        relationship: relationship || null,
        blessing_text: blessing_text || null,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (txError) {
      console.error('[nedarim-gift] Transaction creation error:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate PayMe sale
    const paymeBaseUrl = 'https://ng.payme.io';
    const callbackUrl = `${supabaseUrl}/functions/v1/payme-webhook`;

    const productName = `מתנה ל${event.groom_name || ''} & ${event.bride_name || ''}`;

    const salePayload = {
      seller_payme_id: event.seller_payme_id,
      sale_price: Math.round(Number(amount) * 100), // agorot
      currency: 'ILS',
      product_name: productName,
      transaction_id: transaction.id,
      installments: '1',
      sale_send_notification: true,
      sale_callback_url: callbackUrl,
      sale_return_url: body.return_url || `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/gift/${event_id}/success`,
      sale_email: payer_email || '',
      sale_mobile: payer_phone || '',
      sale_name: payer_name,
      capture_buyer: '0',
      sale_type: 'sale',
      sale_payment_method: 'credit-card',
      language: 'he',
    };

    console.log('[nedarim-gift] Creating PayMe sale:', JSON.stringify(salePayload));

    const paymeResponse = await fetch(`${paymeBaseUrl}/api/generate-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salePayload),
    });

    const paymeResult = await paymeResponse.json();
    console.log('[nedarim-gift] PayMe response:', JSON.stringify(paymeResult));

    if (paymeResult.status_code !== 0) {
      await supabase
        .from('transactions')
        .update({ payment_status: 'failed' })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          error: 'PayMe error',
          details: paymeResult.status_error_details || paymeResult.status_error_code,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update transaction with PayMe sale ID
    await supabase
      .from('transactions')
      .update({ payme_sale_id: paymeResult.payme_sale_id })
      .eq('id', transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        sale_url: paymeResult.sale_url,
        transaction_id: transaction.id,
        payme_sale_id: paymeResult.payme_sale_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[nedarim-gift] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
