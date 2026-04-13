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

    // Build PayMe update payload
    const updatePayload: Record<string, any> = {
      payme_client_key: paymeClientKey,
      seller_payme_id: event.seller_payme_id,
    }

    // Map our field names to PayMe field names
    if (updateData.seller_social_id_issued) {
      updatePayload.seller_social_id_issued = updateData.seller_social_id_issued
    }
    if (updateData.seller_site_url) {
      updatePayload.seller_site_url = updateData.seller_site_url
    }
    if (updateData.seller_first_name_en) {
      updatePayload.seller_first_name_en = updateData.seller_first_name_en
    }
    if (updateData.seller_last_name_en) {
      updatePayload.seller_last_name_en = updateData.seller_last_name_en
    }

    console.log('Updating seller:', JSON.stringify(updatePayload))

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
