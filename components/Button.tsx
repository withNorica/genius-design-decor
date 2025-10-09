import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ isLoading = false, children, className, ...props }) => {
  return (
    <button
      className={`relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-[#E75480] border border-transparent rounded-xl shadow-sm hover:bg-[#D2436D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E75480] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>{children}</span>
    </button>
  );
};
