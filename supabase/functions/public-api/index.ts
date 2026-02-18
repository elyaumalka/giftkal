import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

async function validateApiKey(supabase: any, apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  // Simple hash for comparison (in production use bcrypt)
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Auth via X-API-Key header
    const apiKey = req.headers.get('x-api-key') || '';
    const isValid = await validateApiKey(supabase, apiKey);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid or missing API key', code: 401 }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || '';
    const body = req.method === 'POST' ? await req.json() : {};

    let result: any;

    switch (action) {
      // ===== EVENTS =====
      case 'GetEvent': {
        const eventId = url.searchParams.get('event_id') || body.event_id;
        if (!eventId) return errorResponse('event_id is required', 400);
        const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single();
        if (error) return errorResponse(error.message, 404);
        result = { event: data };
        break;
      }
      case 'ListEvents': {
        const venueId = url.searchParams.get('venue_id') || body.venue_id;
        const ownerId = url.searchParams.get('owner_id') || body.owner_id;
        let query = supabase.from('events').select('*');
        if (venueId) query = query.eq('venue_id', venueId);
        if (ownerId) query = query.eq('owner_id', ownerId);
        query = query.order('event_date', { ascending: false });
        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);
        result = { events: data, count: data?.length || 0 };
        break;
      }
      case 'UpdateEvent': {
        const { event_id, ...updates } = body;
        if (!event_id) return errorResponse('event_id is required', 400);
        const { data, error } = await supabase.from('events').update(updates).eq('id', event_id).select().single();
        if (error) return errorResponse(error.message, 400);
        result = { event: data };
        break;
      }

      // ===== GUESTS =====
      case 'ListGuests': {
        const eventId = url.searchParams.get('event_id') || body.event_id;
        if (!eventId) return errorResponse('event_id is required', 400);
        const status = url.searchParams.get('status');
        let query = supabase.from('guests').select('*').eq('event_id', eventId);
        if (status) query = query.eq('rsvp_status', status);
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);
        const approved = (data || []).filter((g: any) => g.rsvp_status === 'approved');
        const approvedTotal = approved.reduce((sum: number, g: any) => sum + (g.number_of_guests || 1), 0);
        result = {
          guests: data,
          count: data?.length || 0,
          stats: {
            total: data?.length || 0,
            approved: approved.length,
            approved_guests_total: approvedTotal,
            declined: (data || []).filter((g: any) => g.rsvp_status === 'declined').length,
            pending: (data || []).filter((g: any) => g.rsvp_status === 'pending').length,
          }
        };
        break;
      }
      case 'AddGuest': {
        const { event_id, full_name, phone, email, relationship, number_of_guests } = body;
        if (!event_id || !full_name) return errorResponse('event_id and full_name are required', 400);
        const { data, error } = await supabase.from('guests').insert({
          event_id, full_name, phone: phone || null, email: email || null,
          relationship: relationship || null, number_of_guests: number_of_guests || 1,
        }).select().single();
        if (error) return errorResponse(error.message, 400);
        result = { guest: data };
        break;
      }
      case 'UpdateGuest': {
        const { guest_id, ...updates } = body;
        if (!guest_id) return errorResponse('guest_id is required', 400);
        const { data, error } = await supabase.from('guests').update(updates).eq('id', guest_id).select().single();
        if (error) return errorResponse(error.message, 400);
        result = { guest: data };
        break;
      }
      case 'UpdateRSVP': {
        const { guest_id, rsvp_status, number_of_guests } = body;
        if (!guest_id || !rsvp_status) return errorResponse('guest_id and rsvp_status are required', 400);
        if (!['approved', 'declined', 'pending'].includes(rsvp_status)) {
          return errorResponse('rsvp_status must be: approved, declined, or pending', 400);
        }
        const updateData: any = { rsvp_status, rsvp_date: new Date().toISOString() };
        if (number_of_guests !== undefined) updateData.number_of_guests = number_of_guests;
        const { data, error } = await supabase.from('guests').update(updateData).eq('id', guest_id).select().single();
        if (error) return errorResponse(error.message, 400);
        result = { guest: data };
        break;
      }
      case 'DeleteGuest': {
        const guestId = url.searchParams.get('guest_id') || body.guest_id;
        if (!guestId) return errorResponse('guest_id is required', 400);
        const { error } = await supabase.from('guests').delete().eq('id', guestId);
        if (error) return errorResponse(error.message, 400);
        result = { success: true };
        break;
      }
      case 'BulkAddGuests': {
        const { event_id, guests } = body;
        if (!event_id || !Array.isArray(guests) || guests.length === 0) {
          return errorResponse('event_id and guests array are required', 400);
        }
        const rows = guests.map((g: any) => ({
          event_id,
          full_name: g.full_name,
          phone: g.phone || null,
          email: g.email || null,
          relationship: g.relationship || null,
          number_of_guests: g.number_of_guests || 1,
        }));
        const { data, error } = await supabase.from('guests').insert(rows).select();
        if (error) return errorResponse(error.message, 400);
        result = { guests: data, count: data?.length || 0 };
        break;
      }
      case 'BulkUpdateRSVP': {
        const { updates } = body;
        if (!Array.isArray(updates) || updates.length === 0) {
          return errorResponse('updates array is required', 400);
        }
        const results: any[] = [];
        for (const u of updates) {
          const updateData: any = { rsvp_status: u.rsvp_status, rsvp_date: new Date().toISOString() };
          if (u.number_of_guests !== undefined) updateData.number_of_guests = u.number_of_guests;
          const { data, error } = await supabase.from('guests').update(updateData).eq('id', u.guest_id).select().single();
          results.push({ guest_id: u.guest_id, success: !error, data, error: error?.message });
        }
        result = { results };
        break;
      }

      // ===== TRANSACTIONS =====
      case 'GetTransactions': {
        const eventId = url.searchParams.get('event_id') || body.event_id;
        if (!eventId) return errorResponse('event_id is required', 400);
        const { data, error } = await supabase.from('transactions').select('*').eq('event_id', eventId)
          .order('transaction_date', { ascending: false });
        if (error) return errorResponse(error.message, 500);
        const totalAmount = (data || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        result = {
          transactions: data,
          count: data?.length || 0,
          stats: { total_amount: totalAmount }
        };
        break;
      }

      // ===== VENUES =====
      case 'GetVenue': {
        const venueId = url.searchParams.get('venue_id') || body.venue_id;
        if (!venueId) return errorResponse('venue_id is required', 400);
        const { data, error } = await supabase.from('venues').select('*').eq('id', venueId).single();
        if (error) return errorResponse(error.message, 404);
        result = { venue: data };
        break;
      }
      case 'ListVenues': {
        const ownerId = url.searchParams.get('owner_id') || body.owner_id;
        let query = supabase.from('venues').select('*');
        if (ownerId) query = query.eq('owner_id', ownerId);
        const { data, error } = await query;
        if (error) return errorResponse(error.message, 500);
        result = { venues: data, count: data?.length || 0 };
        break;
      }

      // ===== EVENT STATS =====
      case 'GetEventStats': {
        const eventId = url.searchParams.get('event_id') || body.event_id;
        if (!eventId) return errorResponse('event_id is required', 400);

        const [eventRes, guestsRes, transactionsRes] = await Promise.all([
          supabase.from('events').select('*').eq('id', eventId).single(),
          supabase.from('guests').select('*').eq('event_id', eventId),
          supabase.from('transactions').select('*').eq('event_id', eventId),
        ]);

        const guests = guestsRes.data || [];
        const transactions = transactionsRes.data || [];
        const approved = guests.filter((g: any) => g.rsvp_status === 'approved');

        result = {
          event: eventRes.data,
          stats: {
            guests_total: guests.length,
            guests_approved: approved.length,
            guests_approved_total: approved.reduce((s: number, g: any) => s + (g.number_of_guests || 1), 0),
            guests_declined: guests.filter((g: any) => g.rsvp_status === 'declined').length,
            guests_pending: guests.filter((g: any) => g.rsvp_status === 'pending').length,
            transactions_count: transactions.length,
            transactions_total_amount: transactions.reduce((s: number, t: any) => s + Number(t.amount), 0),
          }
        };
        break;
      }

      default:
        return errorResponse(`Unknown action: ${action}. See API docs for available actions.`, 400);
    }

    return new Response(JSON.stringify({ responseStatus: 'OK', ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    console.error('Public API Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ responseStatus: 'ERROR', error: message, code: status }),
    { status, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key', 'Content-Type': 'application/json' } }
  );
}
