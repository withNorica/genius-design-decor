import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from 'npm:@google/generative-ai';

Deno.serve(async (req) => {
  const sendResponse = (body: object, status: number = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });

  try {
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return sendResponse({ error: 'Authentication failed.' }, 401);

    const body = await req.json();
    const { imageBase64, imageMimeType, style, details, holiday, event, seasonalTheme, flowType } = body;
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    if (!profile) return sendResponse({ error: 'Profile not found.' }, 500);
    if (profile.credits <= 0) return sendResponse({ error: 'Insufficient credits.' }, 402);

    let userRequest = '';
    if (flowType === 'Design') userRequest = `Style: "${style}". Details: "${details}".`;
    else if (flowType === 'Decor') userRequest = `Holiday: "${holiday}". Event: "${event}". Theme: "${seasonalTheme}".`;
    
    const prompt = `Based on the user's image and request ("${userRequest}"), generate a new image. Your response MUST contain a single, valid JSON object with two keys: "image" (base64 string) and "suggestions" (string).`;
    
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image', safetySettings });
    const imagePart = { inlineData: { data: imageBase64, mimeType: imageMimeType } };
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }
    
    // --->>> AICI ESTE SOLUȚIA "ANTIGLONȚ" <<<---
    const startIndex = responseText.indexOf('{');
    const endIndex = responseText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Valid JSON object not found in Gemini's response.");
    }

    const jsonString = responseText.substring(startIndex, endIndex + 1);
    const parsedData = JSON.parse(jsonString);
    // --->>> SFÂRȘIT SOLUȚIE <<<---

    await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);
    return sendResponse(parsedData);

  } catch (error) {
    console.error('Critical error in function:', error);
    return sendResponse({ error: 'An error occurred on the server.' }, 500);
  }
});