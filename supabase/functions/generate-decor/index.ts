import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

console.log('Function booting up...')

// Funcție ajutătoare pentru a trimite răspunsuri standard
const sendResponse = (body: object, status: number = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}

Deno.serve(async (req) => {
  // Gestionează cererea 'preflight' CORS trimisă de browser
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    console.log('Received a new request.')

    // Inițializează clientul AI cu cheia din secrete
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
    
    // Verifică dacă utilizatorul este autentificat
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication failed:', userError)
      return sendResponse({ error: 'Authentication failed.' }, 401)
    }
    console.log('User authenticated:', user.id)
    
    // Extrage datele trimise de frontend
    const body = await req.json()
    const { imageBase64, imageMimeType, style, details, holiday, event, seasonalTheme, flowType } = body
    console.log('Request body parsed. Flow type:', flowType)

    // Verifică și scade creditele
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found:', profileError)
      return sendResponse({ error: 'Nu am găsit profilul utilizatorului.' }, 500)
    }
    console.log('User has credits:', profile.credits)

    if (profile.credits <= 0) {
      return sendResponse({ error: 'Credite insuficiente.' }, 402)
    }

    // Construiește prompt-ul dinamic
    let prompt = `Redecorează imaginea. `
    if (flowType === 'Design') {
      prompt += `Stil: "${style}". Detalii: "${details}".`
    } else if (flowType === 'Decor') {
      prompt += `Sărbătoare: "${holiday}". Eveniment: "${event}". Temă: "${seasonalTheme}".`
    }
    prompt += ` Răspunsul TREBUIE să fie un obiect JSON valid cu două chei: "image" (string base64 al noii imagini) și "suggestions" (string cu 3-5 sugestii). Nu include tag-ul "json" în răspuns.`
    console.log('Generated prompt:', prompt)

    // Apelează modelul Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const imagePart = { inlineData: { data: imageBase64, mimeType: imageMimeType } }
    
    console.log('Calling Gemini API...')
    const result = await model.generateContent([prompt, imagePart])
    const responseText = result.response.text()
    const parsedData = JSON.parse(responseText)
    console.log('Gemini API call successful.')
    
    // Scade un credit
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id)

    if (updateError) {
      console.error("Eroare la actualizarea creditelor:", updateError)
    } else {
      console.log('Credits updated successfully.')
    }

    return sendResponse(parsedData)

  } catch (error) {
    console.error('Critical error in function:', error)
    return sendResponse({ error: 'A apărut o eroare pe server.' }, 500)
  }
})