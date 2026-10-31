import React from 'react';
import { X, RotateCcw, Trash2, Shield, Info, CheckCircle2 } from 'lucide-react';
import { AppState } from '../lib/storage';
import { formatINR } from '../lib/engines';

interface SettingsModalProps {
  appState: AppState;
  onResetSampleData: () => void;
  onClearAllData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  appState,
  onResetSampleData,
  onClearAllData,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[370px] bg-[#052A1A] border border-white/20 rounded-[28px] p-5 shadow-2xl text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C8F03C]" />
            <h3 className="text-sm font-semibold text-white">DURUNG Settings & Data</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Stats */}
        <div className="bg-white/[0.08] border border-white/10 rounded-[20px] p-3 text-xs space-y-2">
          <div className="flex justify-between text-white/70">
            <span>Current Earner:</span>
            <strong className="text-white">{appState.profile.name} ({formatINR(appState.profile.monthlySalary)}/mo)</strong>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Ledger Records:</span>
            <span className="text-white font-mono">{appState.transactions.length} items</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Learned Rules:</span>
            <span className="text-[#C8F03C] font-mono">{appState.rules.length} active</span>
          </div>
        </div>

        {/* Guardrail Disclaimer */}
        <div className="bg-[#0B3D26] border border-white/10 rounded-[20px] p-3 text-[11px] text-white/70 space-y-1">
          <div className="flex items-center gap-1.5 text-[#C8F03C] font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>AI Guardrail Architecture</span>
          </div>
          <p className="leading-relaxed">
            DURUNG is strictly an educational cashflow modeler. Arithmetic is performed by deterministic TypeScript engines, and individual stock/fund recommendations are blocked.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onResetSampleData();
              onClose();
            }}
            className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors border border-white/15"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#C8F03C]" />
            Reload 90-Day Sample Data
          </button>

          <button
            onClick={() => {
              onClearAllData();
              onClose();
            }}
            className="w-full py-2.5 rounded-full bg-[#FF7A59]/10 hover:bg-[#FF7A59]/20 text-xs font-semibold text-[#FF7A59] flex items-center justify-center gap-2 transition-colors border border-[#FF7A59]/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset and Clear All Data
          </button>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[10px] text-white/40 font-mono">
            Educational modeling, not investment advice.
          </p>
        </div>
      </div>
    </div>
  );
};
