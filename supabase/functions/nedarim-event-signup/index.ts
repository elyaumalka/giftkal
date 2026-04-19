// Webhook endpoint that receives event signup data from Nedarim Plus
// Creates a new event owner + event in one atomic operation
// Auth: requires X-API-Key header (validated against api_keys table)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    .select('id')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .maybeSingle();
  return !!keyData;
}

function generatePassword(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 12) + 'A1!';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key') || '';
    const isValid = await validateApiKey(supabase, apiKey);
    if (!isValid) {
      return new Response(JSON.stringify({ status: 'error', message: 'Invalid or missing X-API-Key' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    console.log('[nedarim-event-signup] Received:', JSON.stringify(body));

    // Required fields
    const {
      email, full_name, phone,
      event_date, event_type,
      groom_name, bride_name, child_name, family_name,
      venue_id, hall_id, custom_venue_name, custom_venue_location,
      reception_time, ceremony_time,
      seller_payme_id,
      // Nedarim-specific identifier (optional)
      nedarim_customer_id,
    } = body;

    if (!email || !full_name || !event_date) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing required fields: email, full_name, event_date',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if user already exists by email
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .limit(1);

    let userId: string;
    let isNewUser = false;
    let generatedPassword: string | null = null;

    if (existingProfiles && existingProfiles.length > 0) {
      userId = existingProfiles[0].user_id;
      console.log('[nedarim-event-signup] Existing user:', userId);
    } else {
      // Create new auth user
      generatedPassword = generatePassword();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (createError || !newUser?.user) {
        console.error('[nedarim-event-signup] User creation failed:', createError);
        return new Response(JSON.stringify({
          status: 'error',
          message: createError?.message || 'Failed to create user',
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = newUser.user.id;
      isNewUser = true;

      // Wait for trigger to create profile
      await new Promise(r => setTimeout(r, 400));
      await supabase.from('profiles').update({ full_name, phone: phone || null }).eq('user_id', userId);
      await supabase.from('user_roles').insert({ user_id: userId, role: 'event_owner' });
    }

    // Create event
    const { data: event, error: eventError } = await supabase.from('events').insert({
      owner_id: userId,
      event_date,
      event_type: event_type || 'חתונה',
      groom_name: groom_name || null,
      bride_name: bride_name || null,
      child_name: child_name || null,
      family_name: family_name || null,
      venue_id: venue_id || null,
      hall_id: hall_id || null,
      custom_venue_name: custom_venue_name || null,
      custom_venue_location: custom_venue_location || null,
      reception_time: reception_time || null,
      ceremony_time: ceremony_time || null,
      seller_payme_id: seller_payme_id || null,
      gifts_enabled: true,
      invitations_enabled: true,
      rsvp_enabled: true,
      budget_enabled: true,
      payment_completed: true,
    }).select().single();

    if (eventError) {
      console.error('[nedarim-event-signup] Event creation failed:', eventError);
      return new Response(JSON.stringify({
        status: 'error',
        message: 'User created but event failed: ' + eventError.message,
        user_id: userId,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build login URL for the customer
    const projectUrl = Deno.env.get('SUPABASE_URL') || '';
    const baseUrl = projectUrl.includes('xadihaigjkbvphzphxxk') ? 'https://giftkal.com' : projectUrl;

    return new Response(JSON.stringify({
      status: 'success',
      message: isNewUser ? 'User and event created' : 'Event created for existing user',
      user: { id: userId, email, full_name },
      event: {
        id: event.id,
        event_date: event.event_date,
        event_type: event.event_type,
        gift_link: `${baseUrl}/gift/${event.id}`,
        login_url: `${baseUrl}/login/event`,
      },
      credentials: isNewUser ? { email, password: generatedPassword } : null,
      nedarim_customer_id: nedarim_customer_id || null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    console.error('[nedarim-event-signup] Unhandled error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ status: 'error', message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
