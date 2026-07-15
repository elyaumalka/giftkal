import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let eventId = url.searchParams.get('eventId');

    if (!eventId && req.method === 'POST') {
      const body = await req.json();
      eventId = body.eventId;
    }

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'eventId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paymeClientKey = Deno.env.get('PAYME_CLIENT_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: event, error } = await supabase
      .from('events')
      .select('hf_api_key, seller_payme_id, payment_setup_status, created_by_partner_id')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Partner-referral markup. When present, guest is charged extra:
    //   partnerCommissionPct → paid to partner
    //   platformPartnerPct   → paid to giftkal
    let partnerId: string | null = null;
    let partnerCommissionPct = 0;
    let platformPartnerPct = 0;
    if (event.created_by_partner_id) {
      const { data: partner } = await supabase
        .from('partners')
        .select('id, partner_commission_pct, platform_commission_pct, is_active')
        .eq('id', event.created_by_partner_id)
        .maybeSingle();
      if (partner?.is_active) {
        partnerId = partner.id;
        partnerCommissionPct = Number(partner.partner_commission_pct) || 0;
        platformPartnerPct = Number(partner.platform_commission_pct) || 0;
      }
    }

    if (!event.seller_payme_id) {
      return new Response(
        JSON.stringify({ error: 'Payment not configured for this event' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let clientKey = event.hf_api_key;
    let sellerApproved = event.payment_setup_status === 'approved';
    const isTestSeller = event.seller_payme_id.startsWith('TEST-');

    if (isTestSeller) {
      sellerApproved = true;
    }

    // If event has no hf_api_key (Hosted Fields key), fetch it from PayMe using seller_payme_id
    // The hf_api_key is the seller's `uuid` returned by get-sellers/create-seller.
    // It is NOT the same as PAYME_CLIENT_KEY (which is the master/secret key for server-side calls).
    if (paymeClientKey && !isTestSeller) {
      console.log(`Fetching seller status from PayMe for seller: ${event.seller_payme_id}`);

      try {
        const paymeResponse = await fetch('https://live.payme.io/api/get-sellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payme_client_key: paymeClientKey,
            seller_payme_id: event.seller_payme_id,
          }),
        });

        const paymeResult = await paymeResponse.json();
        console.log('PayMe get-sellers raw response:', JSON.stringify(paymeResult));

        if (paymeResult.status_code === 0 && paymeResult.items?.length > 0) {
          const seller = paymeResult.items.find(
            (s: { seller_payme_id: string }) => s.seller_payme_id === event.seller_payme_id
          );
          console.log('Matched seller object:', JSON.stringify(seller));

          sellerApproved = sellerApproved || !!seller?.seller_approved;

          // Try multiple possible field names for the front-end uuid key
          const uuid = seller?.uuid || seller?.seller_uuid || seller?.hf_api_key || seller?.client_key;
          if (!clientKey && uuid) {
            clientKey = uuid;
            await supabase
              .from('events')
              .update({ hf_api_key: clientKey })
              .eq('id', eventId);
            console.log(`Saved hf_api_key=${clientKey} for event ${eventId}`);
          }
        } else {
          console.error('PayMe get-sellers error:', JSON.stringify(paymeResult));
        }
      } catch (fetchErr) {
        console.error('Failed to fetch seller from PayMe:', fetchErr);
      }
    }

    // If seller is not approved by PayMe, block payments entirely
    if (!sellerApproved) {
      return new Response(
        JSON.stringify({
          clientKey: null,
          testMode: false,
          sellerApproved: false,
          blocked: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!clientKey) {
      return new Response(
        JSON.stringify({
          clientKey: null,
          testMode: false,
          sellerApproved: true,
          fallbackToRedirect: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        clientKey,
        testMode: false,
        sellerApproved: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in get-payme-key:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
