import React, { useState } from 'react';
import { Check, X, Edit3, ArrowRight, Sparkles, Tag, Calendar, AlertTriangle } from 'lucide-react';
import { ActionCardData, CategoryType } from '../types';
import { formatINR } from '../lib/engines';
import { CATEGORIES } from '../lib/constants';
import { MerchantAvatar } from './MerchantAvatar';

interface ActionCardModalProps {
  card: ActionCardData;
  onConfirm: (card: ActionCardData) => void;
  onReject: () => void;
}

export const ActionCardModal: React.FC<ActionCardModalProps> = ({
  card,
  onConfirm,
  onReject,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(JSON.parse(JSON.stringify(card.data)));

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleFinalConfirm = () => {
    onConfirm({
      ...card,
      data: editedData,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[370px] bg-[#052A1A]/95 border border-white/20 rounded-[28px] p-5 shadow-2xl backdrop-blur-2xl text-white relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#C8F03C]/20 text-[#C8F03C] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">{card.title}</h3>
              {card.subtitle && (
                <p className="text-[11px] text-white/60">{card.subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onReject}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="py-2">
          {card.type === 'add_transactions' && (
            <div className="space-y-2">
              {editedData.transactions?.map((tx: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white/[0.08] border border-white/10 rounded-[20px] p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MerchantAvatar merchant={tx.merchant} size={36} />
                    <div className="min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={tx.merchant}
                          onChange={(e) => {
                            const copy = [...editedData.transactions];
                            copy[idx].merchant = e.target.value;
                            setEditedData({ ...editedData, transactions: copy });
                          }}
                          className="bg-white/10 px-2 py-0.5 rounded text-xs text-white w-24 mb-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-white truncate">{tx.merchant}</p>
                      )}

                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isEditing ? (
                          <select
                            value={tx.category}
                            onChange={(e) => {
                              const copy = [...editedData.transactions];
                              copy[idx].category = e.target.value;
                              setEditedData({ ...editedData, transactions: copy });
                            }}
                            className="bg-[#052A1A] border border-white/20 text-[10px] text-white/80 rounded px-1.5 py-0.5"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-white/60 border border-white/10 px-1.5 py-0.2 rounded-full">
                            {tx.category}
                          </span>
                        )}
                        <span className="text-[10px] text-white/40">{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isEditing ? (
                      <input
                        type="number"
                        value={tx.amount}
                        onChange={(e) => {
                          const copy = [...editedData.transactions];
                          copy[idx].amount = Number(e.target.value);
                          setEditedData({ ...editedData, transactions: copy });
                        }}
                        className="bg-white/10 px-2 py-0.5 rounded text-xs text-[#C8F03C] w-20 text-right"
                      />
                    ) : (
                      <span className="text-base font-light text-[#C8F03C] tabular-nums">
                        {formatINR(tx.amount)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {card.type === 'recategorize_merchant' && (
            <div className="bg-white/[0.08] border border-white/10 rounded-[20px] p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C8F03C]" />
                <span className="text-xs font-medium text-white/90">
                  Assign "{card.data.merchantKey}" to category:
                </span>
              </div>
              <div className="inline-block bg-[#C8F03C]/20 border border-[#C8F03C]/40 text-[#C8F03C] px-3 py-1 rounded-full text-xs font-semibold">
                {card.data.category}
              </div>
              {card.data.applyToPast && (
                <p className="text-[11px] text-white/60">
                  Will apply to all past transactions matching "{card.data.merchantKey}" and remember for future entries.
                </p>
              )}
            </div>
          )}

          {card.type === 'simulate_scenario' && (
            <div className="bg-white/[0.08] border border-white/10 rounded-[20px] p-4 space-y-2.5">
              <p className="text-xs font-semibold text-white">{card.data.label}</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white/10 rounded-2xl p-2.5">
                  <span className="text-[10px] text-white/50 block">Monthly Surplus Shift</span>
                  <span className="text-sm font-medium text-[#C8F03C]">
                    +{formatINR(card.data.deltaAmount || 3600)}/mo
                  </span>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5">
                  <span className="text-[10px] text-white/50 block">Goal Acceleration</span>
                  <span className="text-sm font-medium text-[#2FB4E8]">
                    ~{card.data.etaShiftMonths || '0.8'} months faster
                  </span>
                </div>
              </div>
            </div>
          )}

          {card.type === 'set_goal' && (
            <div className="bg-white/[0.08] border border-white/10 rounded-[20px] p-3.5 space-y-2">
              <h4 className="text-sm font-medium text-white">{card.data.title}</h4>
              <div className="flex justify-between text-xs text-white/70">
                <span>Target: {formatINR(card.data.targetAmount)}</span>
                <span>By: {card.data.deadline}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-3">
          {card.type === 'add_transactions' && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 py-2.5 px-3 rounded-full bg-white/10 hover:bg-white/15 text-xs text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Done Editing' : 'Edit'}
            </button>
          )}

          <button
            onClick={onReject}
            className="flex-1 py-2.5 px-3 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/70 font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleFinalConfirm}
            className="flex-1 py-2.5 px-3 rounded-full bg-[#C8F03C] hover:bg-[#b8e028] text-xs text-[#052A1A] font-semibold flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(200,240,60,0.3)] transition-transform active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
