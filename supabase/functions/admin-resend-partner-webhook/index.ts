// Admin-only helper: resend a partner webhook for a given event.
// ----------------------------------------------------------------------------
// We use this to prove end-to-end delivery works, or to backfill notifications
// for events that were approved before the automatic webhook dispatch shipped.
// ----------------------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { dispatchPartnerWebhooks } from '../_shared/partner-webhooks.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_EVENT_TYPES = new Set([
  'seller-created',
  'seller-approve',
  'seller-reject',
])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin-only.
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { eventId, eventType } = await req.json() as {
      eventId?: string
      eventType?: string
    }
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Missing eventId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const chosenType = eventType ?? 'seller-approve'
    if (!ALLOWED_EVENT_TYPES.has(chosenType)) {
      return new Response(JSON.stringify({ error: `Unsupported eventType: ${chosenType}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: event, error: findErr } = await supabase
      .from('events')
      .select('id, seller_payme_id, payment_setup_status, created_by_partner_id')
      .eq('id', eventId)
      .maybeSingle()
    if (findErr || !event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!event.created_by_partner_id) {
      return new Response(JSON.stringify({ error: 'Event has no partner to notify' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const statusForPayload: Record<string, string> = {
      'seller-created': 'pending',
      'seller-approve': 'approved',
      'seller-reject': 'rejected',
    }

    await dispatchPartnerWebhooks(supabase, {
      eventType: chosenType,
      eventId,
      payload: {
        event_id: eventId,
        seller_payme_id: event.seller_payme_id,
        status: statusForPayload[chosenType],
        resent_by_admin: true,
      },
    })

    // Return the latest delivery row we just wrote for feedback.
    const { data: latest } = await supabase
      .from('partner_webhook_deliveries')
      .select('id, event_type, response_status, response_body, created_at')
      .eq('partner_id', event.created_by_partner_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return new Response(JSON.stringify({ ok: true, delivery: latest }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('admin-resend-partner-webhook error', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
