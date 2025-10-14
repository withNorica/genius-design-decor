// VERSIUNEA CORECTATĂ PENTRU BeforeAfterSlider.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleTouchMove, handleMouseUp, handleTouchEnd]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video select-none cursor-ew-resize overflow-hidden rounded-lg bg-slate-100"
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      <img src={beforeImage} alt="Before" className="absolute top-0 left-0 w-full h-full object-contain" draggable={false} />
      <div 
        className="absolute top-0 left-0 w-full h-full object-contain overflow-hidden" 
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img src={afterImage} alt="After" className="absolute top-0 left-0 w-full h-full object-contain" draggable={false} />
      </div>
      <div className="absolute top-0 bottom-0 bg-white/50 w-1 backdrop-blur-sm" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
        <div className="absolute top-1/2 left-1/2 bg-white border-2 border-[#E75480] rounded-full h-10 w-10 flex items-center justify-center shadow-lg" style={{ transform: 'translate(-50%, -50%)' }}>
          {/* --- AICI ESTE SĂGEATA CORECTĂ --- */}
          <svg className="w-6 h-6 text-[#E75480]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19L3 12l7-7m4 14l7-7-7-7" /></svg>
        </div>
      </div>
    </div>
  );
};