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

    const body = await req.json()
    const { type, user, venue, event } = body

    if (!type || !user?.email || !user?.password || !user?.fullName) {
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
    const existingUser = existingUsers?.users?.find(u => u.email === user.email)
    
    if (existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'משתמש עם מייל זה כבר קיים במערכת' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.fullName }
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

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 300))

    // Update profile with additional info
    await supabase
      .from('profiles')
      .update({
        full_name: user.fullName,
        phone: user.phone || null
      })
      .eq('user_id', userId)

    // Assign role based on type
    const role = type === 'venue' ? 'venue_owner' : 'event_owner'
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: role
    })

    if (roleError) {
      console.error('Error assigning role:', roleError)
    }

    let createdRecord = null

    // Create venue or event based on type
    if (type === 'venue' && venue) {
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .insert({
          owner_id: userId,
          name: venue.name,
          address: venue.address,
          phone: venue.phone || null,
          email: venue.email || null,
          monthly_subscription: venue.monthlySubscription || 0
        })
        .select()
        .single()

      if (venueError) {
        console.error('Error creating venue:', venueError)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'המשתמש נוצר אך הייתה שגיאה ביצירת האולם: ' + venueError.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      createdRecord = venueData
    }

    if (type === 'event' && event) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          owner_id: userId,
          venue_id: event.venueId || null,
          event_type: event.eventType || 'חתונה',
          event_date: event.eventDate,
          groom_name: event.groomName || null,
          bride_name: event.brideName || null,
          device_rental_cost: event.deviceRentalCost || 0
        })
        .select()
        .single()

      if (eventError) {
        console.error('Error creating event:', eventError)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'המשתמש נוצר אך הייתה שגיאה ביצירת האירוע: ' + eventError.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      createdRecord = eventData
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email: user.email,
        fullName: user.fullName
      },
      record: createdRecord
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
