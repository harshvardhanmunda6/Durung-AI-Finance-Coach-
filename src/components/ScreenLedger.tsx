import React, { useState, useMemo } from 'react';
import { Search, Tag, AlertCircle, Filter, Upload, Check, RotateCcw } from 'lucide-react';
import { CategoryType, Transaction } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants';
import { formatINR } from '../lib/engines';
import { MerchantAvatar } from './MerchantAvatar';

interface ScreenLedgerProps {
  transactions: Transaction[];
  onOpenCategorySheet: (tx: Transaction) => void;
  onOpenImportModal: () => void;
}

export const ScreenLedger: React.FC<ScreenLedgerProps> = ({
  transactions,
  onOpenCategorySheet,
  onOpenImportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'ALL'>('ALL');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.type === 'credit') return false; // Outflows ledger focus
      const matchesSearch =
        tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.amount.toString().includes(searchQuery);

      const matchesCat = selectedCategory === 'ALL' || tx.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [transactions, searchQuery, selectedCategory]);

  // Group by date
  const groupedByDay = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      const d = tx.date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  // Donut category breakdown
  const categoryBreakdown = useMemo(() => {
    const totals: Partial<Record<CategoryType, number>> = {};
    let totalSpend = 0;

    transactions
      .filter((t) => t.type !== 'credit')
      .forEach((t) => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
        totalSpend += t.amount;
      });

    const slices = Object.entries(totals)
      .map(([cat, amount]) => ({
        category: cat as CategoryType,
        amount: amount || 0,
        percentage: totalSpend > 0 ? ((amount || 0) / totalSpend) * 100 : 0,
        color: CATEGORY_COLORS[cat as CategoryType] || '#94A3B8',
      }))
      .sort((a, b) => b.amount - a.amount);

    return { slices, totalSpend };
  }, [transactions]);

  // Relative date label
  const formatDayLabel = (dateStr: string) => {
    if (dateStr === '2026-10-31') return 'Today · 31 Oct';
    if (dateStr === '2026-10-30') return 'Yesterday · 30 Oct';
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // SVG Donut Path calculations
  let accumulatedAngle = 0;
  const donutPaths = categoryBreakdown.slices.map((slice) => {
    const angle = (slice.percentage / 100) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;

    // Convert polar to cartesian
    const radius = 42;
    const innerRadius = 28;
    const center = 50;

    const radStart = (startAngle - 90) * (Math.PI / 180);
    const radEnd = (startAngle + angle - 0.5 - 90) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(radStart);
    const y1 = center + radius * Math.sin(radStart);
    const x2 = center + radius * Math.cos(radEnd);
    const y2 = center + radius * Math.sin(radEnd);

    const x3 = center + innerRadius * Math.cos(radEnd);
    const y3 = center + innerRadius * Math.sin(radEnd);
    const x4 = center + innerRadius * Math.cos(radStart);
    const y4 = center + innerRadius * Math.sin(radStart);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const d = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;

    return { ...slice, pathData: d };
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-2 pb-36 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] text-white/50 block font-normal leading-tight">Living Ledger</span>
          <h1 className="text-xl font-medium text-white tracking-tight">Transactions & Rules</h1>
        </div>

        <button
          onClick={onOpenImportModal}
          className="px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-xs font-medium text-white/90 flex items-center gap-1.5 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-[#C8F03C]" />
          Import
        </button>
      </div>

      {/* Interactive Donut Breakdown */}
      <div className="bg-white/[0.08] border border-white/10 rounded-[28px] p-4 text-white backdrop-blur-md">
        <div className="flex items-center gap-4">
          {/* Donut SVG */}
          <div className="w-28 h-28 shrink-0 relative flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {donutPaths.map((slice, i) => (
                <path
                  key={i}
                  d={slice.pathData}
                  fill={slice.color}
                  className="cursor-pointer hover:opacity-85 transition-opacity"
                  onClick={() =>
                    setSelectedCategory((prev) => (prev === slice.category ? 'ALL' : slice.category))
                  }
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/40">Total</span>
              <span className="text-xs font-semibold text-white">
                {formatINR(categoryBreakdown.totalSpend)}
              </span>
            </div>
          </div>

          {/* Slices legend */}
          <div className="flex-1 space-y-1.5 overflow-hidden">
            <p className="text-[11px] text-white/50 font-medium">Tap slice to filter:</p>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {categoryBreakdown.slices.slice(0, 5).map((slice) => (
                <button
                  key={slice.category}
                  onClick={() =>
                    setSelectedCategory((prev) => (prev === slice.category ? 'ALL' : slice.category))
                  }
                  className={`w-full text-left flex items-center justify-between text-xs py-0.5 px-1.5 rounded-lg transition-colors ${
                    selectedCategory === slice.category
                      ? 'bg-white/20 text-[#C8F03C]'
                      : 'hover:bg-white/5 text-white/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate">{slice.category}</span>
                  </div>
                  <span className="text-[11px] font-mono text-white/50 ml-1">
                    {Math.round(slice.percentage)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedCategory !== 'ALL' && (
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/60">
              Filtered by: <strong className="text-[#C8F03C]">{selectedCategory}</strong>
            </span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="text-[#C8F03C] hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search merchant, amount, or category..."
          className="w-full bg-white/[0.08] border border-white/10 rounded-full pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C8F03C]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Grouped Day List */}
      <div className="space-y-4">
        {Object.keys(groupedByDay).length === 0 ? (
          <div className="text-center py-12 bg-white/[0.04] border border-white/10 rounded-[28px] p-6">
            <p className="text-sm text-white/60">No transactions match your search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="mt-2 text-xs text-[#C8F03C] hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          Object.entries(groupedByDay).map(([dayDate, dayTransactions]) => (
            <div key={dayDate} className="space-y-1.5">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-white/50 tracking-tight">
                  {formatDayLabel(dayDate)}
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  {formatINR(dayTransactions.reduce((acc, t) => acc + t.amount, 0))}
                </span>
              </div>

              <div className="bg-white/[0.08] border border-white/10 rounded-[28px] divide-y divide-white/[0.06] overflow-hidden">
                {dayTransactions.map((tx) => {
                  const isUncategorized = tx.category === 'Uncategorized';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onOpenCategorySheet(tx)}
                      className={`p-3.5 flex items-center justify-between transition-colors cursor-pointer group ${
                        isUncategorized
                          ? 'bg-[#FF7A59]/10 hover:bg-[#FF7A59]/15 border-l-4 border-l-[#FF7A59]'
                          : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MerchantAvatar merchant={tx.merchant} size={40} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate group-hover:text-[#C8F03C] transition-colors">
                            {tx.merchant}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isUncategorized ? (
                              <span className="text-[10px] bg-[#FF7A59]/20 text-[#FF7A59] border border-[#FF7A59]/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 animate-pulse">
                                <AlertCircle className="w-2.5 h-2.5" /> Tap to categorize
                              </span>
                            ) : (
                              <span className="text-[10px] text-white/60 border border-white/10 px-2 py-0.5 rounded-full">
                                {tx.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-light text-white tabular-nums">
                          {formatINR(tx.amount)}
                        </span>
                        {tx.isPriceHike && (
                          <span className="block text-[9px] text-[#FF7A59] font-mono">
                            price hike
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
