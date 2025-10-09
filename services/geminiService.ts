import { GoogleGenAI, Type, GenerateContentResponse, Part, Modality } from "@google/genai";
import { DesignSuggestions, DecorSuggestions, FlowType } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY || "YOUR_API_KEY_HERE" });

const textModel = 'gemini-2.5-flash';
const imageModel = 'gemini-2.5-flash-image';

function base64ToPart(base64: string, mimeType: string): Part {
    return {
        inlineData: {
            data: base64.split(',')[1],
            mimeType
        }
    };
}

export async function generateImage(
    base64Image: string, 
    mimeType: string, 
    style: string, 
    details: string,
    holiday?: string,
    event?: string,
    seasonalTheme?: string
): Promise<string[]> {
    const imagePart = base64ToPart(base64Image, mimeType);
    
    let prompt = `Redesign this image in a "${style}" style. Create a distinct variation.`;
    if (holiday && holiday !== 'None') {
        prompt += ` The theme should be for the "${holiday}" holiday.`;
    }
    if (event && event !== 'None') {
        prompt += ` The theme should be for a "${event}" event.`;
    }
    if (seasonalTheme && seasonalTheme !== 'None') {
        prompt += ` The theme should also incorporate a "${seasonalTheme}" feel.`;
    }
    prompt += ` ${details ? `Additional details: ${details}.` : ''} Make the changes appear natural and well-integrated.`;
    
    if (!API_KEY) {
      console.log("Simulating image generation...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const fetchImage = async (seed: number) => {
        const response = await fetch(`https://picsum.photos/seed/${seed}/1024/768`);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
      };
      
      return Promise.all([fetchImage(1), fetchImage(2), fetchImage(3)]);
    }

    try {
        const generateSingleImage = async (): Promise<string> => {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: imageModel,
                contents: {
                    parts: [
                        imagePart,
                        { text: prompt }
                    ]
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
                throw new Error(textPart || "No image data in response. The model may have refused the request.");
            }
        };

        const imagePromises = Array(3).fill(0).map(() => generateSingleImage());
        return await Promise.all(imagePromises);

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to generate image.");
    }
}

export async function generateSuggestions<T extends DesignSuggestions | DecorSuggestions>(
    base64Image: string, 
    mimeType: string, 
    style: string, 
    details: string,
    flowType: FlowType,
    holiday?: string,
    event?: string,
    seasonalTheme?: string
): Promise<T> {
    
    const designSchema = {
        type: Type.OBJECT,
        properties: {
            general: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 5-7 actionable design suggestions covering layout, color, furniture, lighting, and materials." },
            lowBudget: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-5 budget-friendly design alternatives." },
            diy: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-4 practical DIY design projects." }
        },
        required: ["general", "lowBudget", "diy"]
    };

    const decorSchema = {
        type: Type.OBJECT,
        properties: {
            general: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 5 general decor suggestions." },
            lowBudget: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 5 low-budget decor ideas." },
            diy: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 5 DIY decor projects." }
        },
        required: ["general", "lowBudget", "diy"]
    };
    
    let promptText: string;
    const schema = flowType === FlowType.Design ? designSchema : decorSchema;

    if (flowType === FlowType.Design) {
        promptText = `
        Analyze the provided image and generate design suggestions for a "${style}" style. ${details ? `Incorporate these user details: ${details}.` : ''}
        The tone must be concise, prescriptive, and use generic design terms. Do not use long paragraphs.

        For the 'general' suggestions (5-7 bullet points), focus on:
        - Layout & Space Planning (e.g., seating arrangement, visual flow, focal point)
        - Color Palette (e.g., 2-3 base colors, 1-2 accent tones)
        - Furniture & Materials (e.g., shapes, finishes, material combinations)
        - Lighting & Atmosphere (e.g., light layers: ambient, task, accent)
        - Materials & Textures (e.g., tactile contrast: wood, brushed metal, stone, textiles)

        For the 'lowBudget' suggestions (3-5 bullet points), provide affordable alternatives like:
        - Painted MDF instead of solid wood
        - Performance fabric upholstery instead of premium velvet
        - Flat-pack furniture with metal legs
        - Track or LED lights instead of expensive chandeliers

        For the 'diy' suggestions (3-4 bullet points), provide practical ideas like:
        - Painting an accent wall
        - Replacing cabinet handles
        - Installing LED strips in niches
        - Creating art print collages in standard frames
        - Rearranging the furniture layout for better flow
        
        Do not repeat ideas between sections. Do not mention brands.
        `;
    } else {
        promptText = `Analyze the provided image and generate ${flowType} suggestions for a "${style}" style.`;
        if (holiday && holiday !== 'None') {
            promptText += ` Focus on decor for the "${holiday}" holiday.`;
        }
        if (event && event !== 'None') {
            promptText += ` Focus on decor for a "${event}" event.`;
        }
        if (seasonalTheme && seasonalTheme !== 'None') {
            promptText += ` Focus on decor for a "${seasonalTheme}" theme.`;
        }
        promptText += ` ${details ? `Incorporate these user details: ${details}.` : ''} Provide practical and creative ideas.`;
    }
    
    if (!API_KEY) {
        console.log("Simulating text suggestions generation...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (flowType === FlowType.Design) {
            return {
                general: ["Create a focal point with a large art piece.", "Use a neutral color palette (greys, whites) with a single accent color like navy blue.", "Incorporate natural wood tones in furniture.", "Layer lighting with a central fixture, floor lamps, and task lighting.", "Mix textures: a plush rug, leather chairs, and linen curtains."],
                lowBudget: ["Use painted MDF for custom shelving instead of solid wood.", "Opt for performance fabric on sofas for durability and a luxe feel without the cost.", "Upgrade flat-pack furniture with stylish metal legs.", "Install a track lighting system for flexible illumination."],
                diy: ["Paint one wall a deep, dramatic color to act as an accent.", "Replace old kitchen cabinet handles with modern brass ones.", "Install LED light strips under cabinets or behind a headboard.", "Create a gallery wall with a collection of affordable prints in matching frames."]
            } as T;
        } else {
            return {
                general: ["Introduce more indoor plants", "Create a gallery wall with personal photos", "Update cabinet hardware", "Add an area rug to define the space", "Incorporate scented candles or diffusers"],
                lowBudget: ["Thrift store frames for art", "Paint a single accent wall", "DIY macrame plant hangers", "Use fabric remnants to create new pillow covers", "Rearrange existing furniture for a new flow"],
                diy: ["Build simple floating shelves from reclaimed wood", "Paint old furniture for a fresh look", "Create custom abstract art on canvas", "Sew your own curtains or table runners", "Make a custom headboard for the bed"]
            } as T;
        }
    }
    
    const imagePart = base64ToPart(base64Image, mimeType);

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: textModel,
            contents: { parts: [imagePart, { text: promptText }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;
    } catch (error) {
        console.error("Error generating suggestions:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to generate suggestions.");
    }
}