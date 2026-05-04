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

async function readRequestBody(req: Request): Promise<Record<string, any>> {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return {};

  const text = await req.text();
  if (!text.trim()) return {};

  return JSON.parse(text);
}

/**
 * Public endpoint for Nedarim Plus form.
 * 
 * Actions:
 * - POST with { action: "create" } or no action → Create a new gift sale (returns sale_url + transaction_id)
 * - POST with { action: "status", transaction_id } → Check payment status of a transaction
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const body = await readRequestBody(req);
    console.log('[nedarim-gift] Received:', JSON.stringify(body));

    const action = body.action || url.searchParams.get('action') || (url.searchParams.get('id') ? 'info' : 'create');

    // ─── ACTION: INFO (public, no API key needed) ───
    if (action === 'info') {
      const eventId = body.event_id || body.id || url.searchParams.get('event_id') || url.searchParams.get('id');
      if (!eventId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required field: event_id', error_code: 'MISSING_FIELD' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('id, event_type, event_date, groom_name, bride_name, child_name, family_name, groom_parents, bride_parents, groom_grandparents, bride_grandparents, custom_venue_name, custom_venue_location, reception_time, ceremony_time, invitation_text, gifts_enabled, rsvp_enabled, invitations_enabled, seller_payme_id, venue_id, hall_id')
        .eq('id', eventId)
        .single();

      if (eventErr || !event) {
        return new Response(
          JSON.stringify({ success: false, error: 'Event not found', error_code: 'NOT_FOUND', event_id: eventId }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build display name
      let display_name = '';
      if (event.groom_name && event.bride_name) {
        display_name = `${event.groom_name} & ${event.bride_name}`;
      } else if (event.child_name) {
        display_name = event.child_name;
      } else if (event.family_name) {
        display_name = `משפחת ${event.family_name}`;
      }

      // Fetch venue name if venue_id exists
      let venue_name = event.custom_venue_name || null;
      let venue_location = event.custom_venue_location || null;
      if (event.venue_id && !venue_name) {
        const { data: venue } = await supabase.from('venues').select('name, address').eq('id', event.venue_id).maybeSingle();
        if (venue) {
          venue_name = venue.name;
          venue_location = venue_location || venue.address;
        }
      }

      // Fetch hall name if hall_id exists
      let hall_name = null;
      if (event.hall_id) {
        const { data: hall } = await supabase.from('halls').select('name').eq('id', event.hall_id).maybeSingle();
        if (hall) hall_name = hall.name;
      }

      const projectUrl = supabaseUrl.includes('xadihaigjkbvphzphxxk') ? 'https://giftkal.com' : supabaseUrl;

      return new Response(
        JSON.stringify({
          success: true,
          event: {
            id: event.id,
            event_type: event.event_type,
            event_date: event.event_date,
            display_name,
            groom_name: event.groom_name,
            bride_name: event.bride_name,
            child_name: event.child_name,
            family_name: event.family_name,
            groom_parents: event.groom_parents,
            bride_parents: event.bride_parents,
            groom_grandparents: event.groom_grandparents,
            bride_grandparents: event.bride_grandparents,
            venue_name,
            venue_location,
            hall_name,
            reception_time: event.reception_time,
            ceremony_time: event.ceremony_time,
            invitation_text: event.invitation_text,
            gifts_enabled: event.gifts_enabled,
            has_payment: !!event.seller_payme_id,
            gift_url: `${projectUrl}/gift/${event.id}`,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── ACTION: LIST (public, no API key needed) ───
    if (action === 'list') {
      const date_from = body.date_from || url.searchParams.get('date_from');
      const date_to = body.date_to || url.searchParams.get('date_to');
      const event_type = body.event_type || url.searchParams.get('event_type');
      const search = body.search || url.searchParams.get('search');
      const limit = Math.min(Number(body.limit || url.searchParams.get('limit') || 500), 1000);
      const offset = Math.max(Number(body.offset || url.searchParams.get('offset') || 0), 0);

      let query = supabase
        .from('events')
        .select('id, event_type, event_date, groom_name, bride_name, child_name, family_name, custom_venue_name, custom_venue_location, venue_id, gifts_enabled, seller_payme_id')
        .order('event_date', { ascending: true });

      if (date_from) query = query.gte('event_date', date_from);
      if (date_to) query = query.lte('event_date', date_to);
      if (event_type) query = query.eq('event_type', event_type);

      const { data: events, error: listErr } = await query.range(offset, offset + limit - 1);

      if (listErr) {
        return new Response(
          JSON.stringify({ success: false, error: listErr.message, error_code: 'DB_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = (events || []).map((e: any) => {
        let display_name = '';
        if (e.groom_name && e.bride_name) display_name = `${e.groom_name} & ${e.bride_name}`;
        else if (e.child_name) display_name = e.child_name;
        else if (e.family_name) display_name = `משפחת ${e.family_name}`;

        return {
          id: e.id,
          event_type: e.event_type,
          event_date: e.event_date,
          display_name,
          venue_name: e.custom_venue_name || null,
          gifts_enabled: e.gifts_enabled,
          has_payment: !!e.seller_payme_id,
        };
      });

      // Filter by search term if provided
      let filtered = results;
      if (search) {
        const s = search.toLowerCase();
        filtered = results.filter((e: any) => e.display_name.toLowerCase().includes(s));
      }

      return new Response(
        JSON.stringify({ success: true, events: filtered, count: filtered.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── All other actions require API key ───
    const apiKey = req.headers.get('x-api-key') || body.api_key;
    const isValid = await validateApiKey(supabase, apiKey);
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - invalid or missing API key', error_code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── ACTION: STATUS ───
    if (action === 'status') {
      const { transaction_id } = body;
      if (!transaction_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required field: transaction_id', error_code: 'MISSING_FIELD' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: tx, error: txErr } = await supabase
        .from('transactions')
        .select('id, payment_status, amount, payer_name, created_at, payme_sale_id')
        .eq('id', transaction_id)
        .single();

      if (txErr || !tx) {
        return new Response(
          JSON.stringify({ success: false, error: 'Transaction not found', error_code: 'NOT_FOUND', transaction_id }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: tx.id,
          status: tx.payment_status, // pending | completed | failed | refunded
          amount: tx.amount,
          payer_name: tx.payer_name,
          created_at: tx.created_at,
          payme_sale_id: tx.payme_sale_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── ACTION: CREATE (default) ───
    const paymeClientKey = Deno.env.get('PAYME_CLIENT_KEY');
    if (!paymeClientKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'PayMe credentials not configured on server', error_code: 'SERVER_CONFIG' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { event_id, payer_name, payer_phone, payer_email, payer_id, amount, relationship, blessing_text, side } = body;

    if (!event_id || !amount || !payer_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: event_id, amount, payer_name', error_code: 'MISSING_FIELD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the event and its PayMe seller
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, seller_payme_id, groom_name, bride_name, venue_id, event_type, event_date')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event not found', error_code: 'NOT_FOUND', event_id }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!event.seller_payme_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event not configured for payments - no PayMe seller', error_code: 'NO_SELLER' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create transaction record (pending) - transaction_id is a UUID, guaranteed unique
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
        side: side || null,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (txError) {
      console.error('[nedarim-gift] Transaction creation error:', txError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create transaction record', error_code: 'DB_ERROR' }),
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
          success: false,
          error: 'PayMe error',
          error_code: 'PAYME_ERROR',
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
        status: 'pending',
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
      JSON.stringify({ success: false, error: message, error_code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
