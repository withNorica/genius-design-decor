import { GoogleGenerativeAI } from '@google/generative-ai';
import { ColorPalette, ShoppingItem } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const ai = new GoogleGenerativeAI(API_KEY);
const textModel = 'gemini-2.5-flash';

function base64ToPart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64.includes(',') ? base64.split(',')[1] : base64,
      mimeType,
    },
  };
}

function parseJsonResponse<T>(text: string): T {
  const trimmed = text.trim();
  const startIndex = trimmed.indexOf('{');
  const endIndex = trimmed.lastIndexOf('}');

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Gemini response did not contain valid JSON.');
  }

  try {
    return JSON.parse(trimmed.slice(startIndex, endIndex + 1)) as T;
  } catch {
    throw new Error('Gemini response contained malformed JSON.');
  }
}

function validateShoppingListResponse(value: unknown): ShoppingItem[] {
  if (
    !value ||
    typeof value !== 'object' ||
    !Array.isArray((value as { items?: unknown }).items)
  ) {
    throw new Error('Gemini returned an invalid shopping list. Please try again.');
  }

  return (value as { items: ShoppingItem[] }).items;
}

function validateColorPaletteResponse(value: unknown): ColorPalette {
  if (!value || typeof value !== 'object') {
    throw new Error('Gemini returned an invalid color palette. Please try again.');
  }

  const palette = value as Partial<ColorPalette>;

  if (!Array.isArray(palette.colors)) {
    throw new Error('Gemini returned an invalid color palette. Please try again.');
  }

  if (!Array.isArray(palette.materials)) {
    throw new Error('Gemini returned an invalid materials list. Please try again.');
  }

  const hexColorPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
  const hasInvalidHex = palette.colors.some(
    (color) =>
      !color ||
      typeof color.hex !== 'string' ||
      !hexColorPattern.test(color.hex),
  );

  if (hasInvalidHex) {
    throw new Error('Gemini returned an invalid color value. Please try again.');
  }

  return palette as ColorPalette;
}

export async function generateShoppingList(
  imageBase64: string,
  mimeType: string,
  country: string,
): Promise<ShoppingItem[]> {
  const model = ai.getGenerativeModel({
    model: textModel,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `Analyze this interior, exterior, garden, or decor design image and identify purchasable furniture, decor, lighting, materials, and accessories. Return a JSON object with an "items" array. Each item must include: "name", "category", "description", "estimatedPrice", and "searchQuery". Estimate prices for ${country}. Keep descriptions concise.`;

  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [base64ToPart(imageBase64, mimeType), { text: prompt }],
      },
    ],
  });

  const parsed = parseJsonResponse<unknown>(
    response.response.text(),
  );

  return validateShoppingListResponse(parsed);
}

export async function extractColorPalette(
  imageBase64: string,
  mimeType: string,
): Promise<ColorPalette> {
  const model = ai.getGenerativeModel({
    model: textModel,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = 'Analyze this design image and return a JSON object with two keys: "colors" and "materials". "colors" must be an array of 5 to 8 objects with "name" and "hex" keys. "materials" must be an array of concise material names visible or strongly implied in the design.';

  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [base64ToPart(imageBase64, mimeType), { text: prompt }],
      },
    ],
  });

  const parsed = parseJsonResponse<unknown>(response.response.text());

  return validateColorPaletteResponse(parsed);
}
