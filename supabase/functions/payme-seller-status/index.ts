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

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { eventId } = await req.json()
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Missing eventId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get event and verify ownership
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
      return new Response(JSON.stringify({ error: 'No seller configured for this event' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Test seller bypass
    if (event.seller_payme_id.startsWith('TEST-')) {
      return new Response(JSON.stringify({
        status: 'approved',
        testMode: true,
        sellerPaymeId: event.seller_payme_id,
        approved: true,
        active: true,
        accountType: 'Test',
        missingFields: [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Call PayMe get-sellers API
    const paymeResponse = await fetch('https://live.payme.io/api/get-sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payme_client_key: paymeClientKey,
        seller_payme_id: event.seller_payme_id,
      }),
    })

    const paymeResult = await paymeResponse.json()
    console.log('PayMe get-sellers response status:', paymeResult.status_code)

    if (paymeResult.status_code !== 0) {
      return new Response(JSON.stringify({
        error: 'PayMe error',
        details: paymeResult.status_error_details || 'Unknown error',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Find our seller in the items
    const seller = paymeResult.items?.find(
      (s: any) => s.seller_payme_id === event.seller_payme_id
    )

    if (!seller) {
      return new Response(JSON.stringify({ error: 'Seller not found in PayMe' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Analyze missing fields
    const missingFields: { field: string; label: string; required: boolean }[] = []
    const personal = seller.seller_personal_details || {}
    const business = seller.seller_business_details || {}

    if (!personal.seller_social_id_issued) {
      missingFields.push({ field: 'seller_social_id_issued', label: 'תאריך הנפקת תעודת זהות', required: true })
    }
    if (!business.seller_site_url) {
      missingFields.push({ field: 'seller_site_url', label: 'כתובת אתר', required: true })
    }
    if (!personal.seller_first_name_en) {
      missingFields.push({ field: 'seller_first_name_en', label: 'שם פרטי באנגלית', required: false })
    }
    if (!personal.seller_last_name_en) {
      missingFields.push({ field: 'seller_last_name_en', label: 'שם משפחה באנגלית', required: false })
    }
    if (business.seller_was_rejected_by_bank) {
      missingFields.push({ field: 'bank_rejected', label: `חשבון בנק נדחה: ${business.seller_bank_rejection_reason || 'לא ידוע'}`, required: true })
    }

    // Determine overall status
    let status: string
    if (seller.seller_approved) {
      status = 'approved'
    } else if (missingFields.some(f => f.required)) {
      status = 'missing_info'
    } else {
      status = 'pending'
    }

    return new Response(JSON.stringify({
      status,
      sellerPaymeId: seller.seller_payme_id,
      approved: seller.seller_approved,
      active: seller.seller_active,
      accountType: business.seller_account_type || 'Unknown',
      approvedDate: seller.seller_approved_date,
      createdDate: seller.seller_created,
      merchantName: business.seller_merchant_name,
      missingFields,
      wallets: seller.seller_wallets,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: unknown) {
    console.error('Error in payme-seller-status:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
