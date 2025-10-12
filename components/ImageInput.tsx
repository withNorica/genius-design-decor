import React, { useRef } from 'react';

interface ImageInputProps {
  onImageSelect: (file: File, base64: string) => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onImageSelect }) => {
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
