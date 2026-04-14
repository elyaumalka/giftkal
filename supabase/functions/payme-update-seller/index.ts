import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function normalizePaymeDate(value: string | undefined | null): string {
  if (!value) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    return value.replace(/-/g, '/')
  }

  return value
}

function normalizeIsraeliPhone(value: string | undefined | null): string {
  if (!value) return ''

  const cleaned = value.replace(/[^0-9+]/g, '')
  if (cleaned.startsWith('+972')) return cleaned
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+972${cleaned.slice(1)}`
  }

  return value
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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { eventId, ...rawUpdateData } = body

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Missing eventId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: event } = await supabase
      .from('events')
      .select('id, owner_id, seller_payme_id')
      .eq('id', eventId)
      .single()

    if (!event || event.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Event not found or unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!event.seller_payme_id) {
      return new Response(JSON.stringify({ error: 'No seller to update' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const getSellersResponse = await fetch('https://live.payme.io/api/get-sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payme_client_key: paymeClientKey,
        seller_payme_id: event.seller_payme_id,
      }),
    })

    const getSellersResult = await getSellersResponse.json()
    console.log('PayMe get-sellers before update:', JSON.stringify(getSellersResult))

    if (getSellersResult.status_code !== 0) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch seller data',
        details: getSellersResult.status_error_details || getSellersResult.status_error_code || 'Unknown error',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const seller = getSellersResult.items?.find((item: any) => item.seller_payme_id === event.seller_payme_id)

    if (!seller) {
      return new Response(JSON.stringify({ error: 'Seller not found in PayMe' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const personal = seller.seller_personal_details || {}
    const business = seller.seller_business_details || {}

    const updateData = {
      ...rawUpdateData,
      ...(rawUpdateData.seller_social_id_issued ? { seller_social_id_issued: normalizePaymeDate(rawUpdateData.seller_social_id_issued) } : {}),
      ...(rawUpdateData.seller_birthdate ? { seller_birthdate: normalizePaymeDate(rawUpdateData.seller_birthdate) } : {}),
      ...(rawUpdateData.seller_phone ? { seller_phone: normalizeIsraeliPhone(rawUpdateData.seller_phone) } : {}),
      ...(rawUpdateData.seller_contact_phone ? { seller_contact_phone: normalizeIsraeliPhone(rawUpdateData.seller_contact_phone) } : {}),
    }

    const updatePayload: Record<string, any> = {
      payme_client_key: paymeClientKey,
      seller_payme_id: event.seller_payme_id,
      seller_first_name: personal.seller_first_name || '',
      seller_last_name: personal.seller_last_name || '',
      seller_social_id: personal.seller_social_id || '',
      seller_birthdate: normalizePaymeDate(personal.seller_birthdate),
      seller_social_id_issued: normalizePaymeDate(personal.seller_social_id_issued),
      seller_gender: personal.seller_gender ?? 0,
      seller_email: personal.seller_email || '',
      seller_phone: normalizeIsraeliPhone(personal.seller_phone),
      seller_contact_email: personal.seller_contact_email || personal.seller_email || '',
      seller_contact_phone: normalizeIsraeliPhone(personal.seller_contact_phone || personal.seller_phone),
      seller_bank_code: business.seller_bank_code || 0,
      seller_bank_branch: business.seller_bank_branch || 0,
      seller_bank_account_number: business.seller_bank_account_number || '',
      seller_description: business.seller_description || 'אירוע - GiftKal',
      seller_site_url: business.seller_site_url || 'https://giftkal.com',
      seller_person_business_type: business.seller_person_business_type || 10010,
      seller_inc: business.seller_inc ?? 0,
      seller_merchant_name: business.seller_merchant_name || '',
      seller_address_city: business.seller_address_city || '',
      seller_address_street: business.seller_address_street || '',
      seller_address_street_number: business.seller_address_street_number || '',
      seller_address_country: business.seller_address_country || 'IL',
      seller_retail_type: business.seller_retail_type || 1,
      language: 'he',
    }

    if (business.seller_inc_code) updatePayload.seller_inc_code = business.seller_inc_code
    if (business.seller_merchant_name_en) updatePayload.seller_merchant_name_en = business.seller_merchant_name_en
    if (business.seller_dba) updatePayload.seller_dba = business.seller_dba
    if (business.seller_dba_en) updatePayload.seller_dba_en = business.seller_dba_en
    if (personal.seller_first_name_en) updatePayload.seller_first_name_en = personal.seller_first_name_en
    if (personal.seller_last_name_en) updatePayload.seller_last_name_en = personal.seller_last_name_en
    if (business.market_fee) updatePayload.market_fee = business.market_fee
    if (business.seller_plan) updatePayload.seller_plan = business.seller_plan

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== null && value !== '') {
        updatePayload[key] = value
      }
    }

    console.log('PayMe update-seller payload:', JSON.stringify(updatePayload))

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
        details: paymeResult.status_error_details || paymeResult.status_error_code || paymeResult.status_message || 'Unknown error',
        code: paymeResult.status_code,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Seller updated successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error in payme-update-seller:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
