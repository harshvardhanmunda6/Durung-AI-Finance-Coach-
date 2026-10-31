import React, { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  durationMs?: number;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  onUndo,
  durationMs = 8000,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [durationMs, onDismiss]);

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[350px] animate-in slide-in-from-top-4 duration-200">
      <div className="bg-[#052A1A]/95 border border-[#C8F03C]/30 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-white flex items-center justify-between gap-3 overflow-hidden relative">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-[#C8F03C] shrink-0" />
          <p className="text-xs font-medium text-white/90 truncate">{message}</p>
        </div>

        <button
          onClick={onUndo}
          className="shrink-0 bg-white/10 hover:bg-[#C8F03C]/20 text-[#C8F03C] text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 transition-colors border border-[#C8F03C]/20"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Undo
        </button>

        {/* 8-second progress countdown bar at bottom */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#C8F03C] to-[#2FB4E8] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
