import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // PayMe sends callback data as form-urlencoded OR JSON
    const contentType = req.headers.get('content-type') || '';
    let callbackData: Record<string, string | number | undefined>;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      console.log('PayMe webhook received (form-urlencoded):', text);
      const params = new URLSearchParams(text);
      callbackData = Object.fromEntries(params.entries());
    } else {
      callbackData = await req.json();
      console.log('PayMe webhook received (JSON):', JSON.stringify(callbackData));
    }

    // Extract relevant fields from PayMe callback
    const {
      payme_sale_id,
      payme_transaction_id,
      transaction_id, // Our transaction ID
      payme_status,
      sale_status,
      status_code,
    } = callbackData as Record<string, string | number | undefined>;

    if (!transaction_id && !payme_sale_id) {
      console.error('No transaction identifier in callback');
      return new Response(
        JSON.stringify({ error: 'Missing transaction identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the transaction
    let query = supabase.from('transactions').select('*');
    
    if (transaction_id) {
      query = query.eq('id', transaction_id);
    } else if (payme_sale_id) {
      query = query.eq('payme_sale_id', payme_sale_id);
    }

    const { data: transaction, error: findError } = await query.single();

    if (findError || !transaction) {
      console.error('Transaction not found:', findError);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine payment status based on PayMe response
    // PayMe sends: payme_status (success/error), sale_status (completed/failed/refunded), status_code (0=success)
    let paymentStatus = 'pending';
    
    // Check for success - PayMe sends sale_status=completed when payment succeeds
    if (sale_status === 'completed' || (status_code === 0 && payme_status === 'success')) {
      paymentStatus = 'completed';
    } else if (payme_status === 'error' || payme_status === 'failed' || sale_status === 'failed') {
      paymentStatus = 'failed';
    } else if (sale_status === 'refunded') {
      paymentStatus = 'refunded';
    }

    console.log(`Updating transaction ${transaction.id} to status: ${paymentStatus}`);

    // Update transaction with PayMe response
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        payme_transaction_id: payme_transaction_id || null,
        payme_sale_id: payme_sale_id || transaction.payme_sale_id,
        payment_status: paymentStatus,
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Transaction ${transaction.id} updated successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionId: transaction.id,
        status: paymentStatus 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in payme-webhook:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
