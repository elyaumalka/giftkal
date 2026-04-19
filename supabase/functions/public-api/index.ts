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

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ responseStatus: 'ERROR', error: message, code: status }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function okResponse(result: any) {
  return new Response(JSON.stringify({ responseStatus: 'OK', ...result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ===== Handler modules =====

async function handleEvents(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'GetEvent': {
      const eventId = url.searchParams.get('event_id') || body.event_id;
      if (!eventId) return errorResponse('event_id is required', 400);
      const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single();
      if (error) return errorResponse(error.message, 404);
      return okResponse({ event: data });
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
      return okResponse({ events: data, count: data?.length || 0 });
    }
    case 'UpdateEvent': {
      const { event_id, ...updates } = body;
      if (!event_id) return errorResponse('event_id is required', 400);
      const { data, error } = await supabase.from('events').update(updates).eq('id', event_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ event: data });
    }
    case 'CreateEvent': {
      const { owner_id, event_date, event_type, groom_name, bride_name, child_name, family_name, venue_id, hall_id, custom_venue_name, custom_venue_location, reception_time, ceremony_time } = body;
      if (!owner_id || !event_date) return errorResponse('owner_id and event_date are required', 400);
      // Verify owner exists
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', owner_id).maybeSingle();
      if (!profile) return errorResponse('Owner not found. Use CreateEventOwner for new users.', 404);
      const { data, error } = await supabase.from('events').insert({
        owner_id, event_date, event_type: event_type || 'חתונה',
        groom_name: groom_name || null, bride_name: bride_name || null,
        child_name: child_name || null, family_name: family_name || null,
        venue_id: venue_id || null, hall_id: hall_id || null,
        custom_venue_name: custom_venue_name || null, custom_venue_location: custom_venue_location || null,
        reception_time: reception_time || null, ceremony_time: ceremony_time || null,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ event: data });
    }
  }
  return null;
}

async function handleGuests(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
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
      return okResponse({
        guests: data, count: data?.length || 0,
        stats: {
          total: data?.length || 0, approved: approved.length,
          approved_guests_total: approvedTotal,
          declined: (data || []).filter((g: any) => g.rsvp_status === 'declined').length,
          pending: (data || []).filter((g: any) => g.rsvp_status === 'pending').length,
        }
      });
    }
    case 'AddGuest': {
      const { event_id, full_name, phone, email, relationship, number_of_guests } = body;
      if (!event_id || !full_name) return errorResponse('event_id and full_name are required', 400);
      const { data, error } = await supabase.from('guests').insert({
        event_id, full_name, phone: phone || null, email: email || null,
        relationship: relationship || null, number_of_guests: number_of_guests || 1,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ guest: data });
    }
    case 'UpdateGuest': {
      const { guest_id, ...updates } = body;
      if (!guest_id) return errorResponse('guest_id is required', 400);
      const { data, error } = await supabase.from('guests').update(updates).eq('id', guest_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ guest: data });
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
      return okResponse({ guest: data });
    }
    case 'DeleteGuest': {
      const guestId = url.searchParams.get('guest_id') || body.guest_id;
      if (!guestId) return errorResponse('guest_id is required', 400);
      const { error } = await supabase.from('guests').delete().eq('id', guestId);
      if (error) return errorResponse(error.message, 400);
      return okResponse({ success: true });
    }
    case 'BulkAddGuests': {
      const { event_id, guests } = body;
      if (!event_id || !Array.isArray(guests) || guests.length === 0) {
        return errorResponse('event_id and guests array are required', 400);
      }
      const rows = guests.map((g: any) => ({
        event_id, full_name: g.full_name, phone: g.phone || null, email: g.email || null,
        relationship: g.relationship || null, number_of_guests: g.number_of_guests || 1,
      }));
      const { data, error } = await supabase.from('guests').insert(rows).select();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ guests: data, count: data?.length || 0 });
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
      return okResponse({ results });
    }
  }
  return null;
}

async function handleTransactions(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'GetTransactions': {
      const eventId = url.searchParams.get('event_id') || body.event_id;
      if (!eventId) return errorResponse('event_id is required', 400);
      const { data, error } = await supabase.from('transactions').select('*').eq('event_id', eventId)
        .order('transaction_date', { ascending: false });
      if (error) return errorResponse(error.message, 500);
      const totalAmount = (data || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      return okResponse({ transactions: data, count: data?.length || 0, stats: { total_amount: totalAmount } });
    }
    case 'GetTransaction': {
      const txId = url.searchParams.get('transaction_id') || body.transaction_id;
      if (!txId) return errorResponse('transaction_id is required', 400);
      const { data, error } = await supabase.from('transactions').select('*').eq('id', txId).single();
      if (error) return errorResponse(error.message, 404);
      return okResponse({ transaction: data });
    }
    case 'CreateTransaction': {
      const { event_id, payer_name, amount, payer_phone, payer_email, relationship, blessing_text, venue_id, installments, payment_status, side } = body;
      if (!event_id || !payer_name || !amount) return errorResponse('event_id, payer_name, and amount are required', 400);
      const { data, error } = await supabase.from('transactions').insert({
        event_id, payer_name, amount, payer_phone: payer_phone || null,
        payer_email: payer_email || null, relationship: relationship || null,
        blessing_text: blessing_text || null, venue_id: venue_id || null,
        installments: installments || 1, payment_status: payment_status || 'completed',
        side: side || null,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ transaction: data });
    }
  }
  return null;
}

async function handleVenues(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'GetVenue': {
      const venueId = url.searchParams.get('venue_id') || body.venue_id;
      if (!venueId) return errorResponse('venue_id is required', 400);
      const { data, error } = await supabase.from('venues').select('*').eq('id', venueId).single();
      if (error) return errorResponse(error.message, 404);
      return okResponse({ venue: data });
    }
    case 'ListVenues': {
      const ownerId = url.searchParams.get('owner_id') || body.owner_id;
      let query = supabase.from('venues').select('*');
      if (ownerId) query = query.eq('owner_id', ownerId);
      const { data, error } = await query;
      if (error) return errorResponse(error.message, 500);
      return okResponse({ venues: data, count: data?.length || 0 });
    }
    case 'UpdateVenue': {
      const { venue_id, ...updates } = body;
      if (!venue_id) return errorResponse('venue_id is required', 400);
      const { data, error } = await supabase.from('venues').update(updates).eq('id', venue_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ venue: data });
    }
    case 'CreateVenue': {
      const { owner_id, name, address, phone, email, monthly_subscription } = body;
      if (!owner_id || !name || !address) return errorResponse('owner_id, name, and address are required', 400);
      const { data, error } = await supabase.from('venues').insert({
        owner_id, name, address, phone: phone || null, email: email || null,
        monthly_subscription: monthly_subscription || 0,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ venue: data });
    }
    case 'DeleteVenue': {
      const venueId = url.searchParams.get('venue_id') || body.venue_id;
      if (!venueId) return errorResponse('venue_id is required', 400);
      const { error } = await supabase.from('venues').delete().eq('id', venueId);
      if (error) return errorResponse(error.message, 400);
      return okResponse({ success: true });
    }
  }
  return null;
}

async function handleLeads(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'ListLeads': {
      const status = url.searchParams.get('status') || body.status;
      const leadType = url.searchParams.get('lead_type') || body.lead_type;
      let query = supabase.from('leads').select('*');
      if (status) query = query.eq('status', status);
      if (leadType) query = query.eq('lead_type', leadType);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return errorResponse(error.message, 500);
      return okResponse({ leads: data, count: data?.length || 0 });
    }
    case 'GetLead': {
      const leadId = url.searchParams.get('lead_id') || body.lead_id;
      if (!leadId) return errorResponse('lead_id is required', 400);
      const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single();
      if (error) return errorResponse(error.message, 404);
      return okResponse({ lead: data });
    }
    case 'CreateLead': {
      const { lead_type, full_name, phone, email, venue_name, venue_address, venue_count, status } = body;
      if (!lead_type || !full_name) return errorResponse('lead_type and full_name are required', 400);
      const { data, error } = await supabase.from('leads').insert({
        lead_type, full_name, phone: phone || null, email: email || null,
        venue_name: venue_name || null, venue_address: venue_address || null,
        venue_count: venue_count || 1, status: status || 'new',
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ lead: data });
    }
    case 'UpdateLead': {
      const { lead_id, ...updates } = body;
      if (!lead_id) return errorResponse('lead_id is required', 400);
      const { data, error } = await supabase.from('leads').update(updates).eq('id', lead_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ lead: data });
    }
    case 'DeleteLead': {
      const leadId = url.searchParams.get('lead_id') || body.lead_id;
      if (!leadId) return errorResponse('lead_id is required', 400);
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) return errorResponse(error.message, 400);
      return okResponse({ success: true });
    }
  }
  return null;
}

async function handleUsers(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'ListProfiles': {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) return errorResponse(error.message, 500);
      return okResponse({ profiles: data, count: data?.length || 0 });
    }
    case 'GetProfile': {
      const userId = url.searchParams.get('user_id') || body.user_id;
      if (!userId) return errorResponse('user_id is required', 400);
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (error) return errorResponse(error.message, 404);
      return okResponse({ profile: data });
    }
    case 'CreateEventOwner': {
      const { email, password, full_name, phone, event } = body;
      if (!email || !password || !full_name) return errorResponse('email, password, and full_name are required', 400);

      // Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name }
      });
      if (createError) return errorResponse(createError.message, 400);

      const userId = newUser.user.id;
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update profile
      await supabase.from('profiles').update({ full_name, phone: phone || null }).eq('user_id', userId);

      // Assign role
      await supabase.from('user_roles').insert({ user_id: userId, role: 'event_owner' });

      let createdEvent = null;
      if (event) {
        const { data: eventData } = await supabase.from('events').insert({
          owner_id: userId, venue_id: event.venue_id || null,
          event_type: event.event_type || 'חתונה', event_date: event.event_date,
          groom_name: event.groom_name || null, bride_name: event.bride_name || null,
        }).select().single();
        createdEvent = eventData;
      }

      return okResponse({ user: { id: userId, email, full_name }, event: createdEvent });
    }
    case 'CreateVenueOwner': {
      const { email, password, full_name, phone, venue } = body;
      if (!email || !password || !full_name) return errorResponse('email, password, and full_name are required', 400);

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name }
      });
      if (createError) return errorResponse(createError.message, 400);

      const userId = newUser.user.id;
      await new Promise(resolve => setTimeout(resolve, 300));

      await supabase.from('profiles').update({ full_name, phone: phone || null }).eq('user_id', userId);
      await supabase.from('user_roles').insert({ user_id: userId, role: 'venue_owner' });

      let createdVenue = null;
      if (venue) {
        const { data: venueData } = await supabase.from('venues').insert({
          owner_id: userId, name: venue.name, address: venue.address,
          phone: venue.phone || null, email: venue.email || null,
          monthly_subscription: venue.monthly_subscription || 0,
        }).select().single();
        createdVenue = venueData;
      }

      return okResponse({ user: { id: userId, email, full_name }, venue: createdVenue });
    }
    case 'ListUsers': {
      const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) return errorResponse(error.message, 500);
      // Get roles for all users
      const userIds = (profiles || []).map((p: any) => p.user_id);
      const { data: roles } = await supabase.from('user_roles').select('*').in('user_id', userIds);
      const rolesMap: Record<string, string[]> = {};
      for (const r of (roles || [])) {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      }
      const users = (profiles || []).map((p: any) => ({ ...p, roles: rolesMap[p.user_id] || [] }));
      return okResponse({ users, count: users.length });
    }
    case 'UpdateProfile': {
      const { user_id, full_name, phone, avatar_url } = body;
      if (!user_id) return errorResponse('user_id is required', 400);
      const updates: any = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (phone !== undefined) updates.phone = phone;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      const { data, error } = await supabase.from('profiles').update(updates).eq('user_id', user_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ profile: data });
    }
  }
  return null;
}

async function handleDocuments(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'ListDocuments': {
      const userId = url.searchParams.get('user_id') || body.user_id;
      const eventId = url.searchParams.get('event_id') || body.event_id;
      const venueId = url.searchParams.get('venue_id') || body.venue_id;
      let query = supabase.from('documents').select('*');
      if (userId) query = query.eq('user_id', userId);
      if (eventId) query = query.eq('event_id', eventId);
      if (venueId) query = query.eq('venue_id', venueId);
      query = query.order('uploaded_at', { ascending: false });
      const { data, error } = await query;
      if (error) return errorResponse(error.message, 500);
      return okResponse({ documents: data, count: data?.length || 0 });
    }
    case 'AddDocument': {
      const { user_id, document_type, file_url, file_name, event_id, venue_id } = body;
      if (!user_id || !document_type || !file_url || !file_name) {
        return errorResponse('user_id, document_type, file_url, and file_name are required', 400);
      }
      const { data, error } = await supabase.from('documents').insert({
        user_id, document_type, file_url, file_name,
        event_id: event_id || null, venue_id: venue_id || null,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ document: data });
    }
    case 'DeleteDocument': {
      const docId = url.searchParams.get('document_id') || body.document_id;
      if (!docId) return errorResponse('document_id is required', 400);
      const { error } = await supabase.from('documents').delete().eq('id', docId);
      if (error) return errorResponse(error.message, 400);
      return okResponse({ success: true });
    }
  }
  return null;
}

async function handleStats(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
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
      return okResponse({
        event: eventRes.data,
        stats: {
          guests_total: guests.length, guests_approved: approved.length,
          guests_approved_total: approved.reduce((s: number, g: any) => s + (g.number_of_guests || 1), 0),
          guests_declined: guests.filter((g: any) => g.rsvp_status === 'declined').length,
          guests_pending: guests.filter((g: any) => g.rsvp_status === 'pending').length,
          transactions_count: transactions.length,
          transactions_total_amount: transactions.reduce((s: number, t: any) => s + Number(t.amount), 0),
        }
      });
    }
    case 'GetSystemStats': {
      const [eventsRes, venuesRes, profilesRes, leadsRes, transactionsRes] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('venues').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('leads').select('id', { count: 'exact' }),
        supabase.from('transactions').select('amount'),
      ]);
      const totalAmount = (transactionsRes.data || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
      return okResponse({
        stats: {
          events_count: eventsRes.count || 0,
          venues_count: venuesRes.count || 0,
          users_count: profilesRes.count || 0,
          leads_count: leadsRes.count || 0,
          transactions_total_amount: totalAmount,
        }
      });
    }
  }
  return null;
}

async function handleSupportTickets(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'ListTickets': {
      const userId = url.searchParams.get('user_id') || body.user_id;
      const status = url.searchParams.get('status') || body.status;
      let query = supabase.from('support_tickets').select('*');
      if (userId) query = query.eq('user_id', userId);
      if (status) query = query.eq('status', status);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return errorResponse(error.message, 500);
      return okResponse({ tickets: data, count: data?.length || 0 });
    }
    case 'CreateTicket': {
      const { user_id, venue_id, ticket_type, subject, description } = body;
      if (!user_id || !ticket_type || !subject || !description) {
        return errorResponse('user_id, ticket_type, subject, and description are required', 400);
      }
      const { data, error } = await supabase.from('support_tickets').insert({
        user_id, venue_id: venue_id || null, ticket_type, subject, description,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ ticket: data });
    }
    case 'UpdateTicket': {
      const { ticket_id, ...updates } = body;
      if (!ticket_id) return errorResponse('ticket_id is required', 400);
      const { data, error } = await supabase.from('support_tickets').update(updates).eq('id', ticket_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ ticket: data });
    }
  }
  return null;
}

async function handleInvoices(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'ListInvoices': {
      const venueId = url.searchParams.get('venue_id') || body.venue_id;
      if (!venueId) return errorResponse('venue_id is required', 400);
      const { data, error } = await supabase.from('invoices').select('*').eq('venue_id', venueId)
        .order('for_month', { ascending: false });
      if (error) return errorResponse(error.message, 500);
      return okResponse({ invoices: data, count: data?.length || 0 });
    }
    case 'GetInvoice': {
      const invoiceId = url.searchParams.get('invoice_id') || body.invoice_id;
      if (!invoiceId) return errorResponse('invoice_id is required', 400);
      const { data, error } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
      if (error) return errorResponse(error.message, 404);
      return okResponse({ invoice: data });
    }
    case 'CreateInvoice': {
      const { venue_id, amount, for_month, file_url } = body;
      if (!venue_id || !amount || !for_month) return errorResponse('venue_id, amount, and for_month are required', 400);
      const { data, error } = await supabase.from('invoices').insert({
        venue_id, amount, for_month, file_url: file_url || null,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ invoice: data });
    }
    case 'UpdateInvoice': {
      const { invoice_id, ...updates } = body;
      if (!invoice_id) return errorResponse('invoice_id is required', 400);
      const { data, error } = await supabase.from('invoices').update(updates).eq('id', invoice_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ invoice: data });
    }
  }
  return null;
}

async function handleDevices(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'IdentifyDevice': {
      // Identify the active event for a kiosk device by serial_number or hall_id.
      // Returns: hall info, today's active event (if any), and gift URL.
      const serialNumber = url.searchParams.get('serial_number') || body.serial_number;
      const hallIdParam = url.searchParams.get('hall_id') || body.hall_id;

      if (!serialNumber && !hallIdParam) {
        return errorResponse('serial_number or hall_id is required', 400);
      }

      let resolvedHallId = hallIdParam as string | null;
      let device: any = null;

      // Resolve hall via device serial if provided
      if (serialNumber) {
        const { data: dev } = await supabase
          .from('devices')
          .select('id, name, hall_id, venue_id, is_active')
          .eq('serial_number', serialNumber)
          .maybeSingle();
        if (!dev) return errorResponse(`Device not found for serial_number: ${serialNumber}`, 404);
        if (!dev.is_active) return errorResponse('Device is inactive', 403);
        device = dev;
        resolvedHallId = dev.hall_id || resolvedHallId;
      }

      if (!resolvedHallId) {
        return errorResponse('Device is not assigned to a hall', 404);
      }

      // Fetch hall + venue
      const { data: hall } = await supabase
        .from('halls')
        .select('id, name, default_message, logo_url, venue_id, kiosk_access_code, venues(name, logo_url)')
        .eq('id', resolvedHallId)
        .maybeSingle();
      if (!hall) return errorResponse('Hall not found', 404);

      // Find today's event
      const today = new Date().toISOString().split('T')[0];
      const { data: events } = await supabase
        .from('events')
        .select('id, event_type, event_date, groom_name, bride_name, child_name, family_name, reception_time, ceremony_time, gifts_enabled, seller_payme_id')
        .eq('hall_id', resolvedHallId)
        .eq('event_date', today)
        .order('reception_time', { ascending: true });

      const activeEvent = (events && events.length > 0) ? events[0] : null;
      const projectUrl = Deno.env.get('SUPABASE_URL') || '';
      const baseUrl = projectUrl.includes('xadihaigjkbvphzphxxk') ? 'https://giftkal.com' : '';

      return okResponse({
        device,
        hall: {
          id: hall.id,
          name: hall.name,
          default_message: hall.default_message,
          logo_url: hall.logo_url,
          venue: hall.venues,
          kiosk_url: `${baseUrl}/kiosk/${hall.id}`,
        },
        active_event: activeEvent ? {
          ...activeEvent,
          gift_url: `${baseUrl}/gift/${activeEvent.id}`,
        } : null,
        has_active_event: !!activeEvent,
      });
    }
    case 'ListDevices': {
      const venueId = url.searchParams.get('venue_id') || body.venue_id;
      if (!venueId) return errorResponse('venue_id is required', 400);
      const { data, error } = await supabase.from('devices').select('*').eq('venue_id', venueId);
      if (error) return errorResponse(error.message, 500);
      return okResponse({ devices: data, count: data?.length || 0 });
    }
    case 'CreateDevice': {
      const { venue_id, name, serial_number, is_active } = body;
      if (!venue_id || !name || !serial_number) return errorResponse('venue_id, name, and serial_number are required', 400);
      const { data, error } = await supabase.from('devices').insert({
        venue_id, name, serial_number, is_active: is_active !== false,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ device: data });
    }
    case 'UpdateDevice': {
      const { device_id, ...updates } = body;
      if (!device_id) return errorResponse('device_id is required', 400);
      const { data, error } = await supabase.from('devices').update(updates).eq('id', device_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ device: data });
    }
    case 'DeleteDevice': {
      const deviceId = url.searchParams.get('device_id') || body.device_id;
      if (!deviceId) return errorResponse('device_id is required', 400);
      const { error } = await supabase.from('devices').delete().eq('id', deviceId);
      if (error) return errorResponse(error.message, 400);
      return okResponse({ success: true });
    }
  }
  return null;
}

async function handleNotes(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'ListNotes': {
      const leadId = url.searchParams.get('lead_id') || body.lead_id;
      if (!leadId) return errorResponse('lead_id is required', 400);
      const { data, error } = await supabase.from('notes').select('*').eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) return errorResponse(error.message, 500);
      return okResponse({ notes: data, count: data?.length || 0 });
    }
    case 'CreateNote': {
      const { lead_id, content } = body;
      if (!lead_id || !content) return errorResponse('lead_id and content are required', 400);
      const { data, error } = await supabase.from('notes').insert({ lead_id, content }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ note: data });
    }
    case 'UpdateNote': {
      const { note_id, content, is_completed } = body;
      if (!note_id) return errorResponse('note_id is required', 400);
      const updates: any = {};
      if (content !== undefined) updates.content = content;
      if (is_completed !== undefined) updates.is_completed = is_completed;
      const { data, error } = await supabase.from('notes').update(updates).eq('id', note_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ note: data });
    }
    case 'DeleteNote': {
      const noteId = url.searchParams.get('note_id') || body.note_id;
      if (!noteId) return errorResponse('note_id is required', 400);
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) return errorResponse(error.message, 400);
      return okResponse({ success: true });
    }
  }
  return null;
}

async function handleTasks(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'ListTasks': {
      const leadId = url.searchParams.get('lead_id') || body.lead_id;
      const userId = url.searchParams.get('user_id') || body.user_id;
      let query = supabase.from('tasks').select('*');
      if (leadId) query = query.eq('lead_id', leadId);
      if (userId) query = query.eq('user_id', userId);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return errorResponse(error.message, 500);
      return okResponse({ tasks: data, count: data?.length || 0 });
    }
    case 'CreateTask': {
      const { lead_id, user_id, description, due_date } = body;
      if (!description) return errorResponse('description is required', 400);
      const { data, error } = await supabase.from('tasks').insert({
        lead_id: lead_id || null, user_id: user_id || null,
        description, due_date: due_date || null,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ task: data });
    }
    case 'UpdateTask': {
      const { task_id, ...updates } = body;
      if (!task_id) return errorResponse('task_id is required', 400);
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', task_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ task: data });
    }
    case 'DeleteTask': {
      const taskId = url.searchParams.get('task_id') || body.task_id;
      if (!taskId) return errorResponse('task_id is required', 400);
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) return errorResponse(error.message, 400);
      return okResponse({ success: true });
    }
  }
  return null;
}

async function handleLandingLeads(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'ListLandingLeads': {
      const venueId = url.searchParams.get('venue_id') || body.venue_id;
      if (!venueId) return errorResponse('venue_id is required', 400);
      const status = url.searchParams.get('status') || body.status;
      let query = supabase.from('landing_page_leads').select('*').eq('venue_id', venueId);
      if (status) query = query.eq('status', status);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) return errorResponse(error.message, 500);
      return okResponse({ leads: data, count: data?.length || 0 });
    }
    case 'CreateLandingLead': {
      const { venue_id, full_name, phone, email, event_date, notes } = body;
      if (!venue_id || !full_name) return errorResponse('venue_id and full_name are required', 400);
      const { data, error } = await supabase.from('landing_page_leads').insert({
        venue_id, full_name, phone: phone || null, email: email || null,
        event_date: event_date || null, notes: notes || null,
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ lead: data });
    }
    case 'UpdateLandingLead': {
      const { lead_id, ...updates } = body;
      if (!lead_id) return errorResponse('lead_id is required', 400);
      const { data, error } = await supabase.from('landing_page_leads').update(updates).eq('id', lead_id).select().single();
      if (error) return errorResponse(error.message, 400);
      return okResponse({ lead: data });
    }
    case 'DeleteLandingLead': {
      const leadId = url.searchParams.get('lead_id') || body.lead_id;
      if (!leadId) return errorResponse('lead_id is required', 400);
      const { error } = await supabase.from('landing_page_leads').delete().eq('id', leadId);
      if (error) return errorResponse(error.message, 400);
      return okResponse({ success: true });
    }
  }
  return null;
}

async function handleSettings(action: string, supabase: any, url: URL, body: any) {
  switch (action) {
    case 'GetSystemSettings': {
      const { data, error } = await supabase.from('system_settings').select('*').maybeSingle();
      if (error) return errorResponse(error.message, 500);
      return okResponse({ settings: data });
    }
    case 'UpdateSystemSettings': {
      const { admin_email, logo_url } = body;
      const updates: any = {};
      if (admin_email !== undefined) updates.admin_email = admin_email;
      if (logo_url !== undefined) updates.logo_url = logo_url;
      // Upsert since there may be only one row
      const { data: existing } = await supabase.from('system_settings').select('id').maybeSingle();
      let result;
      if (existing) {
        result = await supabase.from('system_settings').update(updates).eq('id', existing.id).select().single();
      } else {
        result = await supabase.from('system_settings').insert(updates).select().single();
      }
      if (result.error) return errorResponse(result.error.message, 400);
      return okResponse({ settings: result.data });
    }
    case 'GetRequiredDocuments': {
      const forType = url.searchParams.get('for_type') || body.for_type;
      let query = supabase.from('required_documents').select('*');
      if (forType) query = query.eq('for_type', forType);
      const { data, error } = await query;
      if (error) return errorResponse(error.message, 500);
      return okResponse({ documents: data, count: data?.length || 0 });
    }
  }
  return null;
}

// ===== Main handler =====

const actionHandlers: Record<string, (action: string, supabase: any, url: URL, body: any) => Promise<Response | null>> = {
  // Events
  GetEvent: handleEvents, ListEvents: handleEvents, UpdateEvent: handleEvents, CreateEvent: handleEvents,
  // Guests
  ListGuests: handleGuests, AddGuest: handleGuests, UpdateGuest: handleGuests,
  UpdateRSVP: handleGuests, DeleteGuest: handleGuests, BulkAddGuests: handleGuests, BulkUpdateRSVP: handleGuests,
  // Transactions
  GetTransactions: handleTransactions, GetTransaction: handleTransactions, CreateTransaction: handleTransactions,
  // Venues
  GetVenue: handleVenues, ListVenues: handleVenues, UpdateVenue: handleVenues, CreateVenue: handleVenues, DeleteVenue: handleVenues,
  // Leads
  ListLeads: handleLeads, GetLead: handleLeads, CreateLead: handleLeads, UpdateLead: handleLeads, DeleteLead: handleLeads,
  // Users
  ListProfiles: handleUsers, GetProfile: handleUsers, CreateEventOwner: handleUsers, CreateVenueOwner: handleUsers,
  ListUsers: handleUsers, UpdateProfile: handleUsers,
  // Documents
  ListDocuments: handleDocuments, AddDocument: handleDocuments, DeleteDocument: handleDocuments,
  // Stats
  GetEventStats: handleStats, GetSystemStats: handleStats,
  // Support
  ListTickets: handleSupportTickets, CreateTicket: handleSupportTickets, UpdateTicket: handleSupportTickets,
  // Invoices
  ListInvoices: handleInvoices, GetInvoice: handleInvoices, CreateInvoice: handleInvoices, UpdateInvoice: handleInvoices,
  // Devices
  ListDevices: handleDevices, CreateDevice: handleDevices, UpdateDevice: handleDevices, DeleteDevice: handleDevices,
  // Notes
  ListNotes: handleNotes, CreateNote: handleNotes, UpdateNote: handleNotes, DeleteNote: handleNotes,
  // Tasks
  ListTasks: handleTasks, CreateTask: handleTasks, UpdateTask: handleTasks, DeleteTask: handleTasks,
  // Landing Page Leads
  ListLandingLeads: handleLandingLeads, CreateLandingLead: handleLandingLeads, UpdateLandingLead: handleLandingLeads, DeleteLandingLead: handleLandingLeads,
  // Settings
  GetSystemSettings: handleSettings, UpdateSystemSettings: handleSettings, GetRequiredDocuments: handleSettings,
};

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
    const apiKey = req.headers.get('x-api-key') || '';
    const isValid = await validateApiKey(supabase, apiKey);
    if (!isValid) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || '';
    const body = req.method === 'POST' ? await req.json() : {};

    const handler = actionHandlers[action];
    if (!handler) {
      return errorResponse(`Unknown action: ${action}. See API docs for available actions.`, 400);
    }

    const result = await handler(action, supabase, url, body);
    if (result) return result;

    return errorResponse(`Action ${action} not handled`, 500);
  } catch (err: unknown) {
    console.error('Public API Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
