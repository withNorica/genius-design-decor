import React, { useRef } from 'react';

interface ImageInputProps {
  onImageSelect: (file: File, base64: string) => void;
  imagePreview?: string | null;
  onImageRemove?: () => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onImageSelect, imagePreview, onImageRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onImageSelect(file, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (imagePreview) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
          />
          {onImageRemove && (
            <button
              type="button"
              onClick={onImageRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              aria-label="Remove image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
        >
          Choose Different Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#E75480] hover:bg-pink-50 transition text-gray-600 font-medium"
      >
        Click to Upload Image
      </button>
    </div>
  );
};
