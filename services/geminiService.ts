// VERSIUNEA FINALĂ - SINTAXA CORECTATĂ

import { GoogleGenAI, Type, GenerateContentResponse, Part, Modality } from "@google/genai";
import { DesignSuggestions, DecorSuggestions, FlowType } from '../types';

// Folosim NUMELE CORECT: GoogleGenAI
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Folosim modelele de top
const textModel = 'gemini-2.5-flash';
const imageModel = 'gemini-2.5-flash-image-preview'; 

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

    try {
        const generateSingleImage = async (): Promise<string> => {
            // SINTAXA CORECTĂ: accesăm modelul prin `ai.models.generateContent`
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: imageModel,
                contents: {
                    parts: [
                        imagePart,
                        { text: prompt }
                    ]
                },
                // Această configurație este specifică pentru generarea de imagini
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            if (imagePartResponse?.inlineData) {
                return `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`;
            } else {
                const textPart = response.text;
                console.error("Model refusal or unexpected response:", textPart);
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
            general: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 5-7 actionable design suggestions." },
            lowBudget: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-5 budget-friendly alternatives." },
            diy: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-4 practical DIY projects." }
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

    try {
        // SINTAXA CORECTĂ: accesăm modelul prin `ai.models.generateContent`
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