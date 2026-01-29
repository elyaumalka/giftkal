import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface ChargeTokenRequest {
  token: string;
  eventId: string;
  amount: number;
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  relationship?: string;
  blessing?: string;
  blessingImageUrl?: string;
  installments?: number;
  cardMask?: string;
  cardExpiry?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paymeClientKey = Deno.env.get('PAYME_CLIENT_KEY');
    const paymeClientSecret = Deno.env.get('PAYME_CLIENT_SECRET');

    if (!paymeClientKey || !paymeClientSecret) {
      throw new Error('PayMe credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: ChargeTokenRequest = await req.json();

    const { 
      token, 
      eventId, 
      amount, 
      payerName, 
      payerEmail, 
      payerPhone, 
      relationship, 
      blessing, 
      blessingImageUrl, 
      installments = 1,
      cardMask,
      cardExpiry,
    } = body;

    if (!token || !eventId || !amount || !payerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, eventId, amount, payerName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get event and seller info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, seller_payme_id, groom_name, bride_name, venue_id, venues(name)')
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
        installments: installments,
        relationship: relationship || null,
        blessing_text: blessing || null,
        receipt_url: blessingImageUrl || null,
        payment_status: 'pending',
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

    // PayMe environment
    const paymeEnv = 'sandbox'; // Change to 'ng' for production
    const paymeBaseUrl = `https://${paymeEnv}.payme.io`;

    // Format installments for PayMe
    const maxInstallments = installments && installments > 1 ? installments : 1;
    const installmentsValue = maxInstallments > 1 ? `1${maxInstallments.toString().padStart(2, '0')}` : '1';

    // Generate sale using token from Hosted Fields
    const productName = `מתנה ל${event.groom_name || ''} & ${event.bride_name || ''}`;
    
    const salePayload = {
      seller_payme_id: event.seller_payme_id,
      sale_price: Math.round(amount * 100), // PayMe expects price in agorot
      currency: 'ILS',
      product_name: productName,
      transaction_id: transaction.id,
      installments: installmentsValue,
      buyer_key: token, // The token from Hosted Fields tokenization
      sale_type: 'token', // Important: use token sale type
      language: 'he',
    };

    console.log('Calling PayMe capture-sale with token:', paymeBaseUrl);
    console.log('Sale payload:', JSON.stringify({ ...salePayload, buyer_key: '[REDACTED]' }));

    const paymeResponse = await fetch(`${paymeBaseUrl}/api/capture-sale`, {
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
          details: paymeResult.status_error_details || paymeResult.status_error_code 
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
