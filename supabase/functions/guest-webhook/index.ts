import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('GUEST_WEBHOOK_URL');
    if (!webhookUrl) {
      console.error('[guest-webhook] GUEST_WEBHOOK_URL not configured');
      return new Response(JSON.stringify({ error: 'Webhook URL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    // Build webhook payload
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get event details for context
    const eventId = record?.event_id || old_record?.event_id;
    let eventData = null;
    if (eventId) {
      const { data } = await supabase.from('events').select('id, event_type, groom_name, bride_name, child_name, family_name, event_date').eq('id', eventId).single();
      eventData = data;
    }

    const webhookPayload = {
      event_type: type, // INSERT, UPDATE, DELETE
      table,
      guest: record,
      old_guest: old_record,
      event: eventData,
      timestamp: new Date().toISOString(),
    };

    console.log('[guest-webhook] Sending to webhook:', webhookUrl);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      console.error('[guest-webhook] Webhook failed:', response.status, await response.text());
      return new Response(JSON.stringify({ error: 'Webhook delivery failed', status: response.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[guest-webhook] Webhook delivered successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[guest-webhook] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
