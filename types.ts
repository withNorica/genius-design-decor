export enum FlowType {
  Design = 'design',
  Decor = 'decor',
}

export interface DesignSuggestions {
  general: string[];
  lowBudget: string[];
  diy: string[];
}

export interface DecorSuggestions {
  general: string[];
  lowBudget: string[];
  diy: string[];
}

export type Suggestions = DesignSuggestions | DecorSuggestions;

export interface GenerationResult {
  id: string;
  type: FlowType;
  imageBase64?: string; // The user's original uploaded image.
  imageMimeType?: string; // Mime type for the original image
  generatedImageBase64: string[];
  style: string;
  details: string;
  suggestions: Suggestions;
  holiday?: string;
  event?: string;
  seasonalTheme?: string;
}
