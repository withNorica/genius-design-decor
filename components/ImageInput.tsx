import React, { useState, useRef, useCallback } from 'react';
import { fileToBase64 } from '../utils';

interface ImageInputProps {
  onImageSelect: (file: File, base64: string) => void;
  onImageRemove: () => void;
  imagePreview: string | null;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onImageSelect, onImageRemove, imagePreview }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      setError(null);
      const base64 = await fileToBase64(file);
      onImageSelect(file, base64);
    }
  }, [onImageSelect]);

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null);
  };

  return (
    <div className="w-full">
        {imagePreview ? (
            <>
                <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-contain rounded-xl mx-auto bg-slate-100" />
                <div className="text-center mt-4">
                    <button type="button" onClick={onImageRemove} className="text-[#E75480] hover:text-[#D2436D] font-medium">Replace Image</button>
                </div>
            </>
        ) : (
            <>
                <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 transition-colors ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-white'}`}
                >
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-[#E75480] hover:text-[#D2436D] cursor-pointer" onClick={() => fileInputRef.current?.click()}>Upload a file</span>
                        , or drag and drop.
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm10 4a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" /></svg>
                        Take Photo
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98a4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H5.5z" /><path d="M9 13.5V9.5m2 4V9.5" /></svg>
                        Upload Image
                    </button>
                </div>
            </>
        )}

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      
      {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
    </div>
  );
};
