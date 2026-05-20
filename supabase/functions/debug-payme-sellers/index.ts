import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const paymeClientKey = Deno.env.get('PAYME_CLIENT_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = req.method === 'POST' ? await req.json() : {};
  const sellerId: string | undefined = body.seller_payme_id;

  if (!paymeClientKey) {
    return new Response(JSON.stringify({ error: 'no PAYME_CLIENT_KEY' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const res = await fetch('https://live.payme.io/api/get-sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payme_client_key: paymeClientKey,
        ...(sellerId ? { seller_payme_id: sellerId } : {}),
      }),
    });
    const text = await res.text();
    let json: unknown = null;
    try { json = JSON.parse(text); } catch { /* keep as text */ }

    // Update events with uuid if available
    const updates: Array<{ id: string; hf_api_key: string }> = [];
    if (json && typeof json === 'object' && 'items' in json) {
      // deno-lint-ignore no-explicit-any
      const items: any[] = (json as any).items || [];
      for (const it of items) {
        if (it.uuid && it.seller_payme_id) {
          const { data: evs } = await supabase
            .from('events')
            .select('id')
            .eq('seller_payme_id', it.seller_payme_id);
          if (evs && evs.length > 0) {
            for (const ev of evs) {
              await supabase.from('events').update({ hf_api_key: it.uuid }).eq('id', ev.id);
              updates.push({ id: ev.id, hf_api_key: it.uuid });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ status: res.status, raw: json ?? text, updates }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
