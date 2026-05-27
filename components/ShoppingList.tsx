import React, { useState } from 'react';
import { ShoppingItem } from '../types';
import { generateShoppingList } from '../services/advancedAiService';
import { Button } from './Button';

interface ShoppingListProps {
  imageBase64: string;
  mimeType: string;
  onGenerated?: (list: ShoppingItem[]) => void;
  initialList?: ShoppingItem[];
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ 
  imageBase64, 
  mimeType, 
  onGenerated,
  initialList 
}) => {
  const [list, setList] = useState<ShoppingItem[] | null>(initialList || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState('Romania');

  const countries = [
    { name: 'Romania', tld: 'ro' },
    { name: 'United Kingdom', tld: 'co.uk' },
    { name: 'United States', tld: 'com' },
    { name: 'Germany', tld: 'de' },
    { name: 'France', tld: 'fr' },
    { name: 'Italy', tld: 'it' },
    { name: 'Spain', tld: 'es' }
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateShoppingList(imageBase64, mimeType, country);
      setList(result);
      if (onGenerated) onGenerated(result);
    } catch (error) {
      console.error("Shopping list error:", error);
      setError("We couldn't analyze this image right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getGoogleShoppingUrl = (item: ShoppingItem) => {
    const selectedCountry = countries.find(c => c.name === country) || countries[0];
    const query = item.searchQuery || item.name;
    return `https://www.google.${selectedCountry.tld}/search?q=${encodeURIComponent(query)}&tbm=shop`;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-stone-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Shopping List</h2>
        <div className="flex items-center gap-2">
          <select 
            value={country} 
            onChange={(e) => setCountry(e.target.value)}
            className="text-xs border border-stone-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-pink-300"
            disabled={isLoading}
          >
            {countries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          {!list && (
            <Button onClick={handleGenerate} isLoading={isLoading} className="text-sm px-4 py-2">
              {error ? 'Retry' : 'Find Items'}
            </Button>
          )}
        </div>
      </div>

      {list ? (
        <div className="space-y-4">
          <div className="flex justify-end">
             <button onClick={() => setList(null)} className="text-[10px] text-stone-400 hover:text-[#E75480] font-bold uppercase tracking-widest">Regenerate for {country}</button>
          </div>
          {list.map((item, i) => (
            <div key={i} className="group p-4 rounded-xl border border-stone-100 bg-stone-50 hover:bg-white hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#E75480]">{item.category}</span>
                </div>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">{item.estimatedPrice}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{item.description}</p>
              <a 
                href={getGoogleShoppingUrl(item)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#E75480] hover:text-[#D2436D] uppercase tracking-wider"
              >
                Search in {country}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 border-2 border-dashed border-red-200 bg-red-50 rounded-xl">
          <p className="text-red-700 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="mt-4 text-[10px] text-[#E75480] hover:text-[#D2436D] disabled:text-stone-300 font-bold uppercase tracking-widest"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-xl">
          <p className="text-stone-400 text-sm">Click to identify furniture and decor items from this design.</p>
        </div>
      )}
    </div>
  );
};
