import React from 'react';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';

interface GuardrailRefusalCardProps {
  topic?: string;
  reason?: string;
  alternativeSuggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  onDismiss: () => void;
}

export const GuardrailRefusalCard: React.FC<GuardrailRefusalCardProps> = ({
  topic = 'Stock & Equity Recommendations',
  reason,
  alternativeSuggestions,
  onSelectSuggestion,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[370px] bg-[#052A1A]/95 border border-[#FF7A59]/30 rounded-[28px] p-5 shadow-2xl backdrop-blur-2xl text-white relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FF7A59]/20 border border-[#FF7A59]/40 text-[#FF7A59] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#FF7A59] tracking-wider block">
                Guardrail Policy
              </span>
              <h3 className="text-sm font-semibold text-white tracking-tight">{topic}</h3>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Calm explanation */}
        <p className="text-xs text-white/80 leading-relaxed mb-4">
          {reason ||
            'DURUNG is a personal cashflow modeler, not a SEBI-registered investment advisor. We do not recommend individual stocks, mutual funds, or trade signals.'}
        </p>

        {/* What DURUNG can model instead */}
        <div className="space-y-2 mb-4">
          <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
            What I can model for you instead:
          </p>
          <div className="space-y-1.5">
            {alternativeSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelectSuggestion(sug);
                  onDismiss();
                }}
                className="w-full text-left text-xs bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 hover:border-[#C8F03C]/40 p-2.5 rounded-2xl flex items-center justify-between text-white/90 group transition-all"
              >
                <span className="group-hover:text-[#C8F03C] transition-colors">{sug}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#C8F03C] group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Mandatory Footer */}
        <div className="pt-2.5 border-t border-white/10 text-center">
          <p className="text-[10px] text-white/40 font-mono tracking-wide">
            Educational modeling, not investment advice.
          </p>
        </div>
      </div>
    </div>
  );
};
