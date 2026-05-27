import React, { useState } from 'react';
import { ColorPalette } from '../types';
import { extractColorPalette } from '../services/advancedAiService';
import { Button } from './Button';

interface ColorPaletteExtractorProps {
  imageBase64: string;
  mimeType: string;
  onExtracted?: (palette: ColorPalette) => void;
  initialPalette?: ColorPalette;
}

export const ColorPaletteExtractor: React.FC<ColorPaletteExtractorProps> = ({ 
  imageBase64, 
  mimeType, 
  onExtracted,
  initialPalette 
}) => {
  const [palette, setPalette] = useState<ColorPalette | null>(initialPalette || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await extractColorPalette(imageBase64, mimeType);
      setPalette(result);
      if (onExtracted) onExtracted(result);
    } catch (error) {
      console.error("Extraction error:", error);
      setError("We couldn't analyze this image right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-stone-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Colors & Materials</h2>
        {!palette && (
          <Button onClick={handleExtract} isLoading={isLoading} className="text-sm px-4 py-2">
            {error ? 'Retry' : 'Extract Palette'}
          </Button>
        )}
      </div>

      {palette ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Color Palette</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {palette.colors.map((color, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-stone-100 bg-stone-50">
                  <div 
                    className="w-10 h-10 rounded-full shadow-inner border border-black/5" 
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">{color.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono uppercase">{color.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Materials</h3>
            <div className="flex flex-wrap gap-2">
              {palette.materials.map((material, i) => (
                <span key={i} className="px-3 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-full border border-stone-200">
                  {material}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-10 border-2 border-dashed border-red-200 bg-red-50 rounded-xl">
          <p className="text-red-700 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={handleExtract}
            disabled={isLoading}
            className="mt-4 text-[10px] text-[#E75480] hover:text-[#D2436D] disabled:text-stone-300 font-bold uppercase tracking-widest"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-xl">
          <p className="text-stone-400 text-sm">Click the button to analyze colors and materials from this design.</p>
        </div>
      )}
    </div>
  );
};
