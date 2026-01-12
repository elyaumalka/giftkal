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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { email, password, fullName, phone, role } = await req.json()

    if (!email || !password || !fullName || !role) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'חסרים שדות חובה' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    
    if (existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'משתמש עם מייל זה כבר קיים' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: createError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = newUser.user.id

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: userId,
      full_name: fullName,
      email: email,
      phone: phone || null
    })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    }

    // Assign role
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: role
    })

    if (roleError) {
      console.error('Error assigning role:', roleError)
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email,
        fullName,
        role
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
