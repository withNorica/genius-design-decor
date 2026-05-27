import React, { useState, useEffect } from 'react';

export const LoadingSpinner: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 1 : prev));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    // Acesta este "fereastra magică" care apare peste tot
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
        {/* Rotița (spinner-ul) vizibilă pe fundal alb */}
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#E75480]/20 border-t-[#E75480] rounded-full animate-spin"></div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Creating Magic...</h2>
        <p className="text-gray-500 text-sm mb-6">
          AI is analyzing your space and creating a new design... This usually takes 15-30 seconds.
        </p>

        {/* Progresul */}
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-[#E75480] h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};