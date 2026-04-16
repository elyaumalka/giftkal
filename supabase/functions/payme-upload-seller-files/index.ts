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

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { seller_payme_id, files } = body

    if (!seller_payme_id || !files || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing seller_payme_id or files' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build seller_files array for PayMe
    const sellerFiles = files.map((f: { base64: string; name: string; mimeType: string; type: number }) => ({
      name: f.name,
      type: f.type,
      base64: f.base64,
      mime_type: f.mimeType,
    }))

    const uploadPayload = {
      payme_client_key: paymeClientKey,
      seller_payme_id,
      seller_files: sellerFiles,
    }

    console.log(`Uploading ${sellerFiles.length} files for seller ${seller_payme_id}`)

    const paymeResponse = await fetch('https://live.payme.io/api/upload-seller-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadPayload),
    })

    const paymeResult = await paymeResponse.json()
    console.log('PayMe upload-seller-files response:', JSON.stringify(paymeResult))

    if (paymeResult.status_code !== 0) {
      return new Response(JSON.stringify({
        error: 'PayMe upload error',
        details: paymeResult.status_error_details || paymeResult.status_error_code || 'Unknown error',
        code: paymeResult.status_code,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Files uploaded successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error in payme-upload-seller-files:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
