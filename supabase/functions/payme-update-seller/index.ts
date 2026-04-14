import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const paymeClientKey = Deno.env.get('PAYME_CLIENT_KEY')

    if (!paymeClientKey) {
      throw new Error('PayMe credentials not configured')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { eventId, ...updateData } = body

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Missing eventId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify ownership
    const { data: event } = await supabase
      .from('events')
      .select('id, owner_id, seller_payme_id')
      .eq('id', eventId)
      .single()

    if (!event || event.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Event not found or unauthorized' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!event.seller_payme_id) {
      return new Response(JSON.stringify({ error: 'No seller to update' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 1: Get existing seller data from PayMe (update-seller requires ALL fields)
    console.log('Fetching existing seller data for:', event.seller_payme_id)
    const getSellersResponse = await fetch('https://live.payme.io/api/get-sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payme_client_key: paymeClientKey,
        seller_payme_id: event.seller_payme_id,
      }),
    })

    const getSellersResult = await getSellersResponse.json()
    console.log('get-sellers response status:', getSellersResult.status_code)

    if (getSellersResult.status_code !== 0) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch seller data',
        details: getSellersResult.status_error_details || 'Unknown error',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const seller = getSellersResult.items?.find(
      (s: any) => s.seller_payme_id === event.seller_payme_id
    )

    if (!seller) {
      return new Response(JSON.stringify({ error: 'Seller not found in PayMe' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const personal = seller.seller_personal_details || {}
    const business = seller.seller_business_details || {}

    // Step 2: Build FULL update payload with existing data + overrides
    const updatePayload: Record<string, any> = {
      payme_client_key: paymeClientKey,
      seller_payme_id: event.seller_payme_id,
      // Required personal fields - use existing data
      seller_first_name: personal.seller_first_name || '',
      seller_last_name: personal.seller_last_name || '',
      seller_social_id: personal.seller_social_id || '',
      seller_birthdate: personal.seller_birthdate || '',
      seller_social_id_issued: personal.seller_social_id_issued || '',
      seller_gender: personal.seller_gender ?? 0,
      seller_email: personal.seller_email || '',
      seller_phone: personal.seller_phone || '',
      // Required business fields - use existing data
      seller_bank_code: business.seller_bank_code || 0,
      seller_bank_branch: business.seller_bank_branch || 0,
      seller_bank_account_number: business.seller_bank_account_number || '',
      seller_description: business.seller_description || 'שירותי מתנות לאירועים',
      seller_site_url: business.seller_site_url || 'https://giftkal.com',
      seller_person_business_type: business.seller_person_business_type || 780,
      seller_inc: business.seller_inc ?? 0,
      seller_merchant_name: business.seller_merchant_name || '',
      seller_address_city: business.seller_address_city || '',
      seller_address_street: business.seller_address_street || '',
      seller_address_street_number: business.seller_address_street_number || '',
      seller_address_country: business.seller_address_country || 'IL',
    }

    // Optional fields if they exist
    if (business.seller_inc_code) {
      updatePayload.seller_inc_code = business.seller_inc_code
    }
    if (personal.seller_first_name_en) {
      updatePayload.seller_first_name_en = personal.seller_first_name_en
    }
    if (personal.seller_last_name_en) {
      updatePayload.seller_last_name_en = personal.seller_last_name_en
    }
    if (business.seller_merchant_name_en) {
      updatePayload.seller_merchant_name_en = business.seller_merchant_name_en
    }

    // Step 3: Apply the user's updates on top
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== null && value !== '') {
        updatePayload[key] = value
      }
    }

    console.log('Updating seller with full payload:', JSON.stringify(updatePayload))

    // Step 4: Send to PayMe update-seller
    const paymeResponse = await fetch('https://live.payme.io/api/update-seller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    })

    const paymeResult = await paymeResponse.json()
    console.log('PayMe update-seller response:', JSON.stringify(paymeResult))

    if (paymeResult.status_code !== 0) {
      return new Response(JSON.stringify({
        error: 'PayMe error',
        details: paymeResult.status_error_details || paymeResult.status_error_code || 'Unknown error',
        code: paymeResult.status_code,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Seller updated successfully',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: unknown) {
    console.error('Error in payme-update-seller:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
