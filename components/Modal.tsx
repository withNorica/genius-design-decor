
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 id="modal-title" className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="p-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          {footer}
        </div>
      </div>
    </div>
  );
};
