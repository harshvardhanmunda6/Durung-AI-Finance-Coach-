import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { CategoryType, Transaction } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants';
import { formatINR } from '../lib/engines';
import { MerchantAvatar } from './MerchantAvatar';

interface CategoryAssignSheetProps {
  transaction: Transaction;
  pastCount: number;
  onAssign: (category: CategoryType, applyToPast: boolean) => void;
  onClose: () => void;
}

export const CategoryAssignSheet: React.FC<CategoryAssignSheetProps> = ({
  transaction,
  pastCount,
  onAssign,
  onClose,
}) => {
  const [applyToPast, setApplyToPast] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[390px] bg-[#052A1A] border-t border-white/20 rounded-t-[32px] p-5 pb-8 shadow-2xl text-white max-h-[85vh] flex flex-col">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3 shrink-0" />

        {/* Transaction Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <MerchantAvatar merchant={transaction.merchant} size={42} />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-[#FF7A59] tracking-wider">
                Uncategorized Transaction
              </span>
              <h3 className="text-sm font-semibold text-white truncate">{transaction.merchant}</h3>
              <p className="text-xs text-white/50">{transaction.date}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-base font-light text-[#C8F03C] tabular-nums">
              {formatINR(transaction.amount)}
            </span>
            <button
              onClick={onClose}
              className="block ml-auto mt-1 text-white/40 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Apply to past toggle */}
        {pastCount > 1 && (
          <label className="flex items-center gap-2.5 bg-white/[0.08] p-3 rounded-2xl mb-4 cursor-pointer hover:bg-white/[0.12] transition-colors shrink-0">
            <input
              type="checkbox"
              checked={applyToPast}
              onChange={(e) => setApplyToPast(e.target.checked)}
              className="w-4 h-4 rounded text-[#C8F03C] accent-[#C8F03C] cursor-pointer"
            />
            <span className="text-xs text-white/90">
              Apply to all <strong className="text-[#C8F03C]">{pastCount} past</strong> transactions from "{transaction.merchant}" and remember for future entries.
            </span>
          </label>
        )}

        <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2 shrink-0">
          Select Category
        </p>

        {/* Categories Grid (One-tap assign) */}
        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1">
          {CATEGORIES.filter((c) => c !== 'Uncategorized').map((cat) => {
            const color = CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                onClick={() => onAssign(cat, applyToPast)}
                className="text-left p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 hover:border-[#C8F03C]/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-white/90 group-hover:text-white font-medium truncate">
                    {cat}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
