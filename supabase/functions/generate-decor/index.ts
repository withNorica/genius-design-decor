import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/genai';

// Funcție ajutătoare pentru a trimite răspunsuri standard
const sendResponse = (body: object, status: number = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Permite accesul de la orice origine
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
};

// Inițializează clientul AI cu cheia din secrete
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);

Deno.serve(async (req) => {
  // Gestionează cererea 'preflight' CORS trimisă de browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verifică dacă utilizatorul este autentificat
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return sendResponse({ error: 'Authentication failed.' }, 401);
    }
    
    // Extrage datele trimise de frontend
    const { image, mimeType, occasion, customPreferences } = await req.json();

    if (!image || !mimeType || !occasion) {
      return sendResponse({ error: 'Imagine, tipul imaginii și ocazia sunt obligatorii.' }, 400);
    }
    
    // Verifică și scade creditele
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
       return sendResponse({ error: 'Nu am găsit profilul utilizatorului.' }, 500);
    }

    if (profile.credits <= 0) {
      return sendResponse({ error: 'Credite insuficiente. Te rugăm să reîncarci.' }, 402);
    }

    // Apelează modelul Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const imagePart = { inlineData: { data: image, mimeType } };
    const prompt = `
      Redecorează imaginea pentru ocazia: "${occasion}". Preferințe: "${customPreferences || 'Niciuna'}".
      Răspunsul TREBUIE să fie un obiect JSON valid cu două chei:
      1. "image": un string base64 al noii imagini (doar string-ul, fără prefix).
      2. "suggestions": un string cu 3-5 sugestii de decorațiuni, formatat ca listă cu buline.
      Nu include tag-ul de markdown "json" în răspuns.
    `;
    
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);
    
    // Scade un credit
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    if (updateError) {
      // Chiar dacă actualizarea creditelor eșuează, tot trimitem imaginea.
      // E mai bine pentru experiența utilizatorului.
      console.error("Eroare la actualizarea creditelor:", updateError);
    }

    // Trimite rezultatul înapoi la frontend
    return sendResponse(parsedData);

  } catch (error) {
    console.error('Eroare în funcție:', error);
    return sendResponse({ error: 'A apărut o eroare pe server.' }, 500);
  }
});