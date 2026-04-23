// Webhook endpoint that receives event signup data from Nedarim Plus
// Accepts Nedarim's PascalCase Hebrew payload OR our internal snake_case format
// Auth: validates EventPassword against NEDARIM_API_VALID secret, OR X-API-Key header

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

// Nedarim sends date as DD/MM/YY → convert to YYYY-MM-DD
function parseNedarimDate(d: string | undefined | null): string | null {
  if (!d) return null;
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.substring(0, 10);
  const m = d.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return null;
  let [, dd, mm, yy] = m;
  if (yy.length === 2) yy = '20' + yy;
  return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

// Map Nedarim's PascalCase Hebrew payload to our internal shape
function normalizeNedarimPayload(body: any) {
  // Heuristic: if any of the Nedarim PascalCase keys exist, treat as Nedarim format
  const isNedarim =
    'ContactMail' in body || 'ContactPhone' in body || 'EventDate' in body ||
    'VenueName' in body || 'EventType' in body;

  if (!isNedarim) return body;

  const eventTypeRaw = (body.EventType || '').trim();
  const fullName = `${body.ContactFirstName || ''} ${body.ContactLastName || ''}`.trim();
  const venueLocation = [body.VenueCity, body.VenueStreet].filter(Boolean).join(', ');

  // Determine groom/bride/child/family based on event type
  let groomName: string | null = null;
  let brideName: string | null = null;
  let childName: string | null = null;
  let familyName: string | null = null;

  const groomFull = `${body.GroomFirstName || ''} ${body.GroomLastName || ''}`.trim();
  const brideFull = `${body.BrideFirstName || ''} ${body.BrideLastName || ''}`.trim();

  if (eventTypeRaw.includes('חתונה') || eventTypeRaw.includes('אירוסין')) {
    groomName = groomFull || null;
    brideName = brideFull || null;
  } else if (eventTypeRaw.includes('בר מצווה') || eventTypeRaw.includes('בת מצווה')) {
    childName = groomFull || brideFull || fullName || null;
  } else if (eventTypeRaw.includes('ברית') || eventTypeRaw.includes('בריתה')) {
    familyName = body.ContactLastName || null;
  } else {
    // Fallback
    childName = groomFull || brideFull || null;
    familyName = body.ContactLastName || null;
  }

  return {
    // Auth/identification fields
    event_password: body.EventPassword,

    // Owner
    email: body.ContactMail || body.GroomMail || body.BrideMail || '',
    full_name: fullName || 'בעל אירוע',
    phone: body.ContactPhone || '',

    // Event
    event_date: parseNedarimDate(body.EventDate),
    event_type: eventTypeRaw || 'אירוע',
    groom_name: groomName,
    bride_name: brideName,
    child_name: childName,
    family_name: familyName,
    custom_venue_name: body.VenueName || null,
    custom_venue_location: venueLocation || null,

    // Nedarim metadata (stored on event for reference)
    nedarim_metadata: {
      contact_zeout: body.ContactZeout,
      bank: body.Bank,
      snif: body.Snif,
      account: body.Account,
      service_choice: body.ServiceChoice,
      tashlum_amount: body.TashlumAmount,
      original_payload: body,
    },
  };
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
    const rawBody = await req.json();
    console.log('[nedarim-event-signup] Received raw:', JSON.stringify(rawBody));

    const body = normalizeNedarimPayload(rawBody);

    // === Authentication ===
    // Accept either:
    // 1. X-API-Key header (matched against api_keys table) — our internal flow
    // 2. EventPassword field matching NEDARIM_SIGNUP_PASSWORD secret — Nedarim's flow
    const apiKey = req.headers.get('x-api-key') || '';
    const expectedPassword = Deno.env.get('NEDARIM_SIGNUP_PASSWORD') || '';

    let authorized = false;
    if (apiKey) {
      authorized = await validateApiKey(supabase, apiKey);
    }
    if (!authorized && body.event_password && expectedPassword) {
      authorized = body.event_password === expectedPassword;
    }

    if (!authorized) {
      console.error('[nedarim-event-signup] Auth failed. Has X-API-Key:', !!apiKey, 'Has EventPassword:', !!body.event_password);
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Unauthorized: provide valid X-API-Key header or EventPassword field',
      }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      email, full_name, phone,
      event_date, event_type,
      groom_name, bride_name, child_name, family_name,
      venue_id, hall_id, custom_venue_name, custom_venue_location,
      reception_time, ceremony_time,
      seller_payme_id,
      nedarim_metadata,
    } = body;

    if (!email || !full_name || !event_date) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing required fields: email, full_name, event_date (received email=' + (email || 'empty') + ', event_date=' + (event_date || 'empty') + ')',
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
      payment_setup_data: nedarim_metadata || null,
    }).select().single();

    if (eventError) {
      console.error('[nedarim-event-signup] Event creation failed:', eventError);
      return new Response(JSON.stringify({
        status: 'error',
        message: 'User created but event failed: ' + eventError.message,
        user_id: userId,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
