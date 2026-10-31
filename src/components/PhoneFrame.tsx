import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F3FAD9] via-[#EAF7C6] to-[#E3F3A8] flex items-center justify-center sm:py-6 sm:px-4 font-sans select-none overflow-x-hidden">
      {/* Outer Phone Bezel (Only visible on sm+ screens) */}
      <div className="relative w-full max-w-[400px] h-screen sm:h-[844px] bg-[#052A1A] sm:rounded-[48px] shadow-[0_25px_60px_-15px_rgba(5,42,26,0.35)] sm:border-[8px] sm:border-[#1A261E] flex flex-col overflow-hidden text-white">
        
        {/* Dynamic Island / Speaker Notch on Desktop */}
        <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#111] mr-3" />
          <div className="w-2 h-2 rounded-full bg-[#052A1A]/80 border border-white/20" />
        </div>

        {/* Mobile Top Status Bar */}
        <div className="h-10 w-full flex items-center justify-between px-6 pt-2 shrink-0 z-40 text-xs text-white/70 select-none">
          <span className="font-semibold tracking-tight text-[13px]">10:04</span>
          <div className="flex items-center space-x-1.5">
            <Signal className="w-3.5 h-3.5 opacity-80" strokeWidth={1.5} />
            <Wifi className="w-3.5 h-3.5 opacity-80" strokeWidth={1.5} />
            <div className="flex items-center">
              <Battery className="w-4 h-4 opacity-80" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Inner App Container with Glow Canvas */}
        <div className="relative flex-1 w-full overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="h-5 w-full flex items-center justify-center shrink-0 z-40 pb-1">
          <div className="w-32 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};
