import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

// Aici definești câte credite primește fiecare pachet.
// TODO: Va trebui să înlocuiești numerele astea cu ID-urile REALE ale produselor tale din Lemon Squeezy!
const CREDIT_PACKAGES: Record<string, number> = {
  '1320727': 20,  // Exemplu: ID-ul variantei "Basic" adaugă 20 credite
  '1320753': 50, // Exemplu: ID-ul variantei "Pro" adaugă 50 credite
  '1320460': 50,  // creator plan (abonament) -> ÎNLOCUIEȘTE 100 CU CÂTE CREDITE DAI LA ACEST PLAN
  '1320696': 150,  // pro designer (abonament) -> ÎNLOCUIEȘTE 300 CU CÂTE CREDITE DAI LA ACEST PLAN
};

serve(async (req) => {
  // Webhook-ul acceptă doar mesaje de tip POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 1. Preluăm datele trimise de Lemon Squeezy
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature');
    const secret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');

    if (!signature || !secret) {
      return new Response('Lipseste semnatura sau parola secreta', { status: 400 });
    }

    // 2. Securitate: Verificăm dacă mesajul vine chiar de la Lemon Squeezy
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    const hmacBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const hmacArray = Array.from(new Uint8Array(hmacBuffer));
    const hmacHex = hmacArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Dacă semnăturile nu se potrivesc, e un posibil atacator
    if (hmacHex !== signature) {
      return new Response('Semnatura invalida! Tentativa de frauda.', { status: 401 });
    }

    // 3. Procesăm datele comenzii
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;

    // Ne interesează doar când o comandă a fost plătită cu succes
    if (eventName === 'order_created') {
      // Luăm ID-ul produsului cumpărat
      const variantId = payload.data.attributes.first_order_item.variant_id.toString();
      
      // Luăm ID-ul utilizatorului din aplicația ta (îl vom trimite prin linkul de plată)
      const userId = payload.meta.custom_data?.user_id; 

      if (!userId) {
        console.error('Eroare: Nu am gasit user_id in datele comenzii.');
        return new Response('Missing user_id', { status: 400 });
      }

      // Căutăm câte credite trebuie să dăm pentru acest produs
      const creditsToAdd = CREDIT_PACKAGES[variantId];

      if (!creditsToAdd) {
        console.error(`Eroare: ID Produs necunoscut (${variantId})`);
        return new Response('Produs necunoscut', { status: 400 });
      }

      // 4. Ne conectăm la Supabase cu puteri de Admin (bypass reguli)
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 5. Verificăm câte credite are omul în acest moment
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const newCredits = (profile?.credits || 0) + creditsToAdd;

      // 6. Adăugăm creditele în contul lui
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', userId);

      if (updateError) throw updateError;

      console.log(`SUCCES: Am adaugat ${creditsToAdd} credite pentru userul ${userId}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error('Eroare la procesarea webhook-ului:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
});