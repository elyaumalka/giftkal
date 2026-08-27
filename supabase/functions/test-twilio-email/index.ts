import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!
  const token = Deno.env.get('TWILIO_AUTH_TOKEN')!
  const from = Deno.env.get('TWILIO_EMAIL_FROM')!
  const res = await fetch('https://comms.twilio.com/v1/Emails', {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: { address: from, name: 'בשמחות פלוס' },
      to: [{ address: 'biniappai@gmail.com' }],
      content: { subject: 'בדיקת שליחת מייל', html: '<div dir="rtl">בדיקה מהמערכת</div>' },
    }),
  })
  const text = await res.text()
  return new Response(JSON.stringify({ status: res.status, body: text }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
