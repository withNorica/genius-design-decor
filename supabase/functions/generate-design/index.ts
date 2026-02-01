import { GoogleGenAI, Type, GenerateContentResponse, Part, Modality } from 'npm:@google/genai@1.23.0';
import { createClient } from 'npm:@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

enum FlowType {
  Design = 'design',
  Decor = 'decor'
}

interface DesignSuggestions {
  general: string[];
  lowBudget: string[];
  diy: string[];
}

interface DecorSuggestions {
  general: string[];
  lowBudget: string[];
  diy: string[];
}

interface GenerateRequest {
  imageBase64: string;
  imageMimeType: string;
  style: string;
  details: string;
  flowType: FlowType;
  holiday?: string;
  event?: string;
  seasonalTheme?: string;
}

function base64ToPart(base64: string, mimeType: string): Part {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType
    }
  };
}

async function generateImage(
  ai: GoogleGenAI,
  base64Image: string,
  mimeType: string,
  style: string,
  details: string,
  holiday?: string,
  event?: string,
  seasonalTheme?: string
): Promise<string[]> {
  const imagePart = base64ToPart(base64Image, mimeType);
  const imageModel = 'gemini-2.5-flash-image';
  
  let prompt = `Redesign the provided image in a photorealistic "${style}" style. Create a distinct variation.`;
  if (holiday && holiday !== 'None') {
    prompt += ` The theme should be for the "${holiday}" holiday.`;
  }
  if (event && event !== 'None') {
    prompt += ` The theme should be for a "${event}" event.`;
  }
  if (seasonalTheme && seasonalTheme !== 'None') {
    prompt += ` The theme should also incorporate a "${seasonalTheme}" feel.`;
  }
  prompt += ` ${details ? `Additional details: ${details}.` : ''} Make the changes appear natural and well-integrated. The output must be a high-quality, realistic image.`;

  const generateSingleImage = async (): Promise<string> => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: imageModel,
      contents: {
        parts: [imagePart, { text: prompt }]
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (imagePartResponse?.inlineData) {
      return `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`;
    } else {
      const textPart = response.text;
      throw new Error(textPart || 'No image data in response.');
    }
  };

  const imagePromises = Array(2).fill(0).map(() => generateSingleImage());
  return await Promise.all(imagePromises);
}

async function generateSuggestions(
  ai: GoogleGenAI,
  base64Image: string,
  mimeType: string,
  style: string,
  details: string,
  flowType: FlowType,
  holiday?: string,
  event?: string,
  seasonalTheme?: string
): Promise<DesignSuggestions | DecorSuggestions> {
  const textModel = 'gemini-2.5-flash';
  
  const designSchema = {
    type: Type.OBJECT,
    properties: {
      general: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of 5-7 actionable design suggestions.' },
      lowBudget: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of 3-5 budget-friendly alternatives.' },
      diy: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of 3-4 practical DIY projects.' }
    },
    required: ['general', 'lowBudget', 'diy']
  };

  const decorSchema = {
    type: Type.OBJECT,
    properties: {
      general: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of 5 general decor suggestions.' },
      lowBudget: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of 5 low-budget decor ideas.' },
      diy: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of 5 DIY decor projects.' }
    },
    required: ['general', 'lowBudget', 'diy']
  };
  
  let promptText: string;
  const schema = flowType === FlowType.Design ? designSchema : decorSchema;

  if (flowType === FlowType.Design) {
    promptText = `Analyze the image and generate concise, prescriptive design suggestions for a "${style}" style. ${details ? `Incorporate: ${details}.` : ''} Provide 5-7 general ideas, 3-5 low-budget options, and 3-4 DIY projects. Do not repeat ideas.`;
  } else {
    promptText = `Analyze the image and generate concise, prescriptive decor suggestions. Theme: "${style}".`;
    if (holiday && holiday !== 'None') promptText += ` Holiday: "${holiday}".`;
    if (event && event !== 'None') promptText += ` Event: "${event}".`;
    if (seasonalTheme && seasonalTheme !== 'None') promptText += ` Seasonal Theme: "${seasonalTheme}".`;
    if (details) promptText += ` Incorporate: ${details}.`;
    promptText += ` Provide 5 general ideas, 5 low-budget options, and 5 DIY projects. Do not repeat ideas.`;
  }
  
  const imagePart = base64ToPart(base64Image, mimeType);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: textModel,
    contents: { parts: [imagePart, { text: promptText }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema
    }
  });
  
  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile || profile.credits <= 0) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: GenerateRequest = await req.json();
    const { imageBase64, imageMimeType, style, details, flowType, holiday, event, seasonalTheme } = requestData;

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const suggestions = await generateSuggestions(
      ai,
      imageBase64,
      imageMimeType,
      style,
      details,
      flowType,
      holiday,
      event,
      seasonalTheme
    );

    const generatedImages = await generateImage(
      ai,
      imageBase64,
      imageMimeType,
      style,
      details,
      holiday,
      event,
      seasonalTheme
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to decrement credits:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        generatedImages,
        creditsRemaining: profile.credits - 1
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-design function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});