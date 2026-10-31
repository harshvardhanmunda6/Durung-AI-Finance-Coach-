import React from 'react';

export const RadialGlowCanvas: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Base Canvas #052A1A */}
      <div className="absolute inset-0 bg-[#052A1A]" />

      {/* Top-Right Lime Radial Glow with 20s drift */}
      <div
        className="absolute -top-12 -right-12 w-[340px] h-[340px] rounded-full animate-glow-drift blur-3xl opacity-75"
        style={{
          background: 'radial-gradient(120% 60% at 85% 0%, #C6E02E 0%, rgba(198,224,46,0) 55%)',
        }}
      />

      {/* Soft #0B3D26 wash fading down to dark by mid-screen */}
      <div
        className="absolute top-0 left-0 right-0 h-[480px] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(11, 61, 38, 0.45) 0%, rgba(5, 42, 26, 0.95) 70%, #052A1A 100%)',
        }}
      />

      {/* Subtle bottom ambient scrim */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#052A1A] to-transparent" />
    </div>
  );
};
