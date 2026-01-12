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

    // Test user credentials
    const testUsers = [
      { email: 'admin@test.com', password: 'Admin123!', role: 'admin', fullName: 'מנהל מערכת' },
      { email: 'venue@test.com', password: 'Venue123!', role: 'venue_owner', fullName: 'יוסי אולמות' },
      { email: 'event@test.com', password: 'Event123!', role: 'event_owner', fullName: 'דני ומיכל כהן' },
    ]

    const createdUsers: { email: string; id: string; role: string }[] = []

    // Create users
    for (const user of testUsers) {
      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === user.email)
      
      let userId: string

      if (existingUser) {
        userId = existingUser.id
        console.log(`User ${user.email} already exists`)
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.fullName }
        })

        if (createError) {
          console.error(`Error creating user ${user.email}:`, createError)
          continue
        }
        userId = newUser.user.id
        console.log(`Created user ${user.email}`)
      }

      createdUsers.push({ email: user.email, id: userId, role: user.role })

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          user_id: userId,
          full_name: user.fullName,
          email: user.email,
          phone: '050-' + Math.floor(1000000 + Math.random() * 9000000)
        })
      }

      // Assign role (upsert)
      await supabase.from('user_roles').upsert({
        user_id: userId,
        role: user.role
      }, { onConflict: 'user_id,role' })
    }

    const venueOwnerId = createdUsers.find(u => u.role === 'venue_owner')?.id
    const eventOwnerId = createdUsers.find(u => u.role === 'event_owner')?.id

    if (!venueOwnerId || !eventOwnerId) {
      throw new Error('Failed to create required users')
    }

    // Create venues
    const venues = [
      { name: 'אולמי הזהב', address: 'רחוב הרצל 50, תל אביב', phone: '03-5551234', email: 'info@gold-halls.co.il', owner_id: venueOwnerId, monthly_subscription: 2500 },
      { name: 'גני האירועים', address: 'שדרות רוטשילד 15, ראשון לציון', phone: '03-5559876', email: 'events@ganim.co.il', owner_id: venueOwnerId, monthly_subscription: 3000 },
    ]

    const { data: createdVenues, error: venueError } = await supabase
      .from('venues')
      .upsert(venues, { onConflict: 'name' })
      .select()

    if (venueError) {
      console.error('Venue error:', venueError)
    }

    // Get venue IDs
    const { data: venueData } = await supabase.from('venues').select('id, name').eq('owner_id', venueOwnerId)
    const venueIds = venueData?.map(v => v.id) || []

    // Create devices for venues
    if (venueIds.length > 0) {
      const devices = [
        { name: 'מכשיר ראשי', serial_number: 'DEV-001-2024', venue_id: venueIds[0], is_active: true },
        { name: 'מכשיר גיבוי', serial_number: 'DEV-002-2024', venue_id: venueIds[0], is_active: true },
        { name: 'מכשיר ראשי', serial_number: 'DEV-003-2024', venue_id: venueIds[1] || venueIds[0], is_active: true },
      ]

      await supabase.from('devices').upsert(devices, { onConflict: 'serial_number' })
    }

    // Create events
    const eventDates = [
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 months from now
    ]

    const events = [
      {
        owner_id: eventOwnerId,
        venue_id: venueIds[0] || null,
        event_type: 'חתונה',
        event_date: eventDates[0].toISOString().split('T')[0],
        bride_name: 'מיכל',
        groom_name: 'דני',
        bride_parents: 'שרה ויעקב לוי',
        groom_parents: 'רחל ומשה כהן',
        bride_grandparents: 'סבתא רבקה',
        groom_grandparents: 'סבא אברהם',
        invitation_text: 'בשמחה רבה אנו מזמינים אתכם לחתונתנו',
        payment_completed: false,
        documents_complete: false,
        device_returned: false,
        device_rental_cost: 500
      },
      {
        owner_id: eventOwnerId,
        venue_id: venueIds[1] || venueIds[0] || null,
        event_type: 'בר מצווה',
        event_date: eventDates[1].toISOString().split('T')[0],
        groom_name: 'יונתן כהן',
        groom_parents: 'דני ומיכל כהן',
        invitation_text: 'בשמחה אנו מזמינים אתכם לבר המצווה של בננו',
        payment_completed: false,
        documents_complete: true,
        device_returned: false,
        device_rental_cost: 300
      }
    ]

    const { data: createdEvents } = await supabase
      .from('events')
      .upsert(events, { onConflict: 'owner_id,event_date,event_type' })
      .select()

    // Get event IDs
    const { data: eventData } = await supabase.from('events').select('id').eq('owner_id', eventOwnerId)
    const eventIds = eventData?.map(e => e.id) || []

    // Create guests
    if (eventIds.length > 0) {
      const guestNames = [
        'משה ישראלי', 'רחל כהן', 'דוד לוי', 'שרה אברהם', 'יעקב מזרחי',
        'אסתר גולן', 'אברהם בן דוד', 'מרים שלום', 'יוסף חיים', 'חנה רוזן',
        'משפחת פרידמן', 'משפחת שטרן', 'משפחת גרינברג', 'משפחת וולף', 'משפחת קליין'
      ]

      const guests = guestNames.map((name, i) => ({
        event_id: eventIds[0],
        full_name: name,
        phone: '05' + Math.floor(10000000 + Math.random() * 90000000),
        email: `guest${i + 1}@example.com`,
        relationship: ['משפחה', 'חברים', 'עבודה'][i % 3],
        invitation_sent: i < 10
      }))

      await supabase.from('guests').upsert(guests, { onConflict: 'event_id,full_name' })
    }

    // Create transactions
    if (eventIds.length > 0 && venueIds.length > 0) {
      const transactionData = [
        { payer_name: 'משה ישראלי', amount: 500, blessing_text: 'מזל טוב! שתזכו לבנות בית נאמן בישראל' },
        { payer_name: 'משפחת כהן', amount: 1000, blessing_text: 'באהבה רבה, מאחלים לכם חיים מאושרים' },
        { payer_name: 'דוד ושרה לוי', amount: 750, blessing_text: 'מזל טוב לזוג הנפלא!' },
        { payer_name: 'סבא וסבתא', amount: 2000, blessing_text: 'לנכדים האהובים, מזל טוב!' },
        { payer_name: 'חברים מהעבודה', amount: 1500, blessing_text: 'מזל טוב מכל החברים!' },
        { payer_name: 'משפחת אברהם', amount: 600, blessing_text: 'שתהיה לכם רק שמחה' },
        { payer_name: 'יעקב מזרחי', amount: 400, blessing_text: 'מזל טוב ובהצלחה!' },
        { payer_name: 'אסתר וגיל', amount: 800, blessing_text: 'מאחלים לכם את כל הטוב' },
      ]

      const transactions = transactionData.map((t, i) => ({
        event_id: eventIds[0],
        venue_id: venueIds[0],
        payer_name: t.payer_name,
        payer_phone: '05' + Math.floor(10000000 + Math.random() * 90000000),
        payer_email: `payer${i + 1}@example.com`,
        amount: t.amount,
        blessing_text: t.blessing_text,
        relationship: ['משפחה', 'חברים', 'עבודה'][i % 3],
        installments: [1, 1, 3, 1, 1, 1, 1, 2][i],
        transaction_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }))

      await supabase.from('transactions').insert(transactions)
    }

    // Create leads
    const leads = [
      { full_name: 'רונית שמש', email: 'ronit@example.com', phone: '052-1234567', lead_type: 'venue_owner', venue_name: 'אולמי השמש', venue_address: 'אשדוד', venue_count: 2, status: 'new' },
      { full_name: 'אמיר דהן', email: 'amir@example.com', phone: '054-9876543', lead_type: 'venue_owner', venue_name: 'גן אירועים דהן', venue_address: 'באר שבע', venue_count: 1, status: 'contacted' },
      { full_name: 'נעמי ויוסי בר', email: 'naomi@example.com', phone: '050-5555555', lead_type: 'event_owner', status: 'new' },
      { full_name: 'דניאל כהן', email: 'daniel@example.com', phone: '053-1112233', lead_type: 'event_owner', status: 'qualified' },
      { full_name: 'מיכאל לוי', email: 'michael@example.com', phone: '058-4445566', lead_type: 'venue_owner', venue_name: 'אולמי לוי', venue_address: 'חיפה', venue_count: 3, status: 'new' },
    ]

    const { data: createdLeads } = await supabase.from('leads').upsert(leads, { onConflict: 'email' }).select()
    const leadIds = createdLeads?.map(l => l.id) || []

    // Create tasks for leads
    if (leadIds.length > 0) {
      const tasks = [
        { lead_id: leadIds[0], description: 'להתקשר לרונית לתאם פגישה', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false },
        { lead_id: leadIds[1], description: 'לשלוח הצעת מחיר לאמיר', due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false },
        { lead_id: leadIds[0], description: 'לשלוח חוזה לחתימה', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false },
      ]

      await supabase.from('tasks').insert(tasks)
    }

    // Create notes for leads
    if (leadIds.length > 0) {
      const notes = [
        { lead_id: leadIds[0], content: 'התעניין במערכת, ביקש הדגמה', is_completed: true },
        { lead_id: leadIds[1], content: 'דיברנו בטלפון, מעוניין מאוד', is_completed: false },
        { lead_id: leadIds[2], content: 'חתונה בעוד 3 חודשים', is_completed: false },
      ]

      await supabase.from('notes').insert(notes)
    }

    // Create support tickets
    const adminId = createdUsers.find(u => u.role === 'admin')?.id
    const supportTickets = [
      { user_id: venueOwnerId, venue_id: venueIds[0] || null, ticket_type: 'תמיכה טכנית', subject: 'בעיה בחיבור מכשיר', description: 'המכשיר לא מתחבר לאינטרנט', status: 'open' },
      { user_id: eventOwnerId, ticket_type: 'שאלה כללית', subject: 'שאלה על תשלומים', description: 'איך אני רואה את כל התשלומים?', status: 'resolved', response: 'ניתן לראות את כל התשלומים בדף המתנות' },
      { user_id: venueOwnerId, venue_id: venueIds[0] || null, ticket_type: 'בקשת שיפור', subject: 'בקשה להוספת פיצ׳ר', description: 'האם אפשר להוסיף ייצוא לאקסל?', status: 'in_progress' },
    ]

    await supabase.from('support_tickets').insert(supportTickets)

    // Create invoices
    if (venueIds.length > 0) {
      const invoices = [
        { venue_id: venueIds[0], amount: 2500, for_month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { venue_id: venueIds[0], amount: 2500, for_month: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { venue_id: venueIds[1] || venueIds[0], amount: 3000, for_month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      ]

      await supabase.from('invoices').insert(invoices)
    }

    // Create system settings
    await supabase.from('system_settings').upsert({
      admin_email: 'admin@gifted.co.il',
      logo_url: null
    })

    // Create required documents
    const requiredDocs = [
      { document_type: 'תעודת זהות', for_type: 'event_owner', is_required: true },
      { document_type: 'אישור ניהול חשבון', for_type: 'event_owner', is_required: true },
      { document_type: 'רישיון עסק', for_type: 'venue_owner', is_required: true },
      { document_type: 'תעודת עוסק מורשה', for_type: 'venue_owner', is_required: true },
    ]

    await supabase.from('required_documents').upsert(requiredDocs, { onConflict: 'document_type,for_type' })

    return new Response(JSON.stringify({
      success: true,
      message: 'נתוני הדמה נוצרו בהצלחה!',
      users: [
        { email: 'admin@test.com', password: 'Admin123!', role: 'מנהל מערכת' },
        { email: 'venue@test.com', password: 'Venue123!', role: 'בעל אולם' },
        { email: 'event@test.com', password: 'Event123!', role: 'בעל אירוע' },
      ],
      data: {
        venues: venueIds.length,
        events: eventIds.length,
        leads: leadIds.length
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
