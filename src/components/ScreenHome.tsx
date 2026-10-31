import React, { useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { AppState } from '../lib/storage';
import { formatINR, formatCompactINR, calculateSurplus, calculateGoalETA, generateActiveNudges } from '../lib/engines';
import { MerchantAvatar } from './MerchantAvatar';
import { Nudge, Transaction } from '../types';

interface ScreenHomeProps {
  appState: AppState;
  onNavigateTab: (tab: 'home' | 'ledger' | 'plan' | 'report') => void;
  onOpenSettings: () => void;
  onSelectNudgeAction: (nudge: Nudge) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const ScreenHome: React.FC<ScreenHomeProps> = ({
  appState,
  onNavigateTab,
  onOpenSettings,
  onSelectNudgeAction,
  onSelectTransaction,
}) => {
  const [activeOutlinedTab, setActiveOutlinedTab] = useState<'in_out' | 'bills_subs' | 'footprint'>('in_out');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = Oct 2026

  const { profile, transactions, goals } = appState;
  const primaryGoal = goals[0];

  // Surplus calculation
  const surplusMetrics = calculateSurplus(profile, transactions);
  const leftToSpend = surplusMetrics.surplus;

  // Goal ETA calculation
  const goalETA = primaryGoal
    ? calculateGoalETA(primaryGoal, surplusMetrics.surplus)
    : null;

  // Active Nudges (Max 2 cards)
  const activeNudges = generateActiveNudges(profile, transactions, primaryGoal);

  // Month spend
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith('2026-10') && t.type !== 'credit');
  const totalOctExpenses = currentMonthTxs.reduce((sum, t) => sum + t.amount, 0);
  const netIncome = profile.monthlySalary;

  // Last 5 transactions
  const last5Transactions = transactions
    .filter((t) => t.type !== 'credit')
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-2 pb-36 space-y-4">
      {/* Top Header: Initials Avatar, Welcome, Settings Icon */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C8F03C] to-[#2FB4E8] p-[1.5px] shadow-sm">
            <div className="w-full h-full rounded-full bg-[#052A1A] flex items-center justify-center text-xs font-bold text-[#C8F03C] tracking-wider">
              {profile.name?.slice(0, 2).toUpperCase() || 'DU'}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-white/50 block font-normal leading-tight">Good morning,</span>
            <h1 className="text-sm font-medium text-white tracking-tight">Welcome {profile.name}</h1>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="Settings and Sample Data"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Hero Header Row: Left to spend + right-aligned Goal Status */}
      <div className="pt-2">
        <div className="flex items-start justify-between">
          <span className="text-[13px] font-normal text-white/60 tracking-tight">Left to spend</span>
          {goalETA && (
            <div className="text-right">
              <span className="text-xs font-semibold text-[#C8F03C] block leading-tight">
                {goalETA.isAhead ? `${goalETA.weeksAhead} weeks ahead` : 'Pacing towards'}
              </span>
              <span className="text-[10px] text-white/50">of your {primaryGoal?.title || 'goal'}</span>
            </div>
          )}
        </div>

        {/* Hero Numeral: 56-64px, weight 300, letter-spacing -0.04em, tabular-nums */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[58px] leading-none font-light tracking-[-0.04em] text-white tabular-nums select-all">
            {formatINR(leftToSpend)}
          </span>
        </div>

        {/* 4-point lime sparkle with one-line status + gradient badge (+12% vs last month) */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <svg
              className="w-3.5 h-3.5 text-[#C8F03C] shrink-0 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
            <span className="text-xs font-normal">You're on track this month</span>
          </div>

          <div
            className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-[#052A1A] shadow-sm ml-auto"
            style={{
              background: 'linear-gradient(90deg, #C8F03C 0%, #2FB4E8 100%)',
            }}
          >
            +12% vs last mo
          </div>
        </div>
      </div>

      {/* Scrollable outlined pill tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
        {[
          { id: 'in_out', label: 'In & Out' },
          { id: 'bills_subs', label: 'Bills & Subs' },
          { id: 'footprint', label: 'Spending Footprint' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveOutlinedTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeOutlinedTab === tab.id
                ? 'border-[#C8F03C] text-[#C8F03C] bg-[#C8F03C]/10'
                : 'border-white/15 text-white/60 hover:text-white hover:border-white/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* "This Month" Card: date range, balance numeral, thin line chart with peak dot, month switcher */}
      <div className="bg-white/[0.08] border border-white/10 rounded-[28px] p-4.5 text-white space-y-3 relative overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-white/60 font-medium block">
              {activeOutlinedTab === 'bills_subs' ? 'Fixed Outflows & Subs' : activeOutlinedTab === 'footprint' ? 'Variable Spend Pace' : 'October 2026 Outflows'}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-light tabular-nums text-white">
                {activeOutlinedTab === 'bills_subs'
                  ? formatINR(surplusMetrics.totalFixedCosts)
                  : activeOutlinedTab === 'footprint'
                  ? formatINR(surplusMetrics.averageVariableSpend)
                  : formatINR(totalOctExpenses)}
              </span>
              <span className="text-[11px] text-white/40">1 Oct - 31 Oct</span>
            </div>
          </div>

          {/* Month Switcher (< >) */}
          <div className="flex items-center gap-1 bg-white/10 rounded-full p-0.5 border border-white/10">
            <button
              onClick={() => setSelectedMonthOffset((v) => v - 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-white/70 px-1">
              {selectedMonthOffset === 0 ? 'OCT' : selectedMonthOffset === -1 ? 'SEP' : 'AUG'}
            </span>
            <button
              onClick={() => setSelectedMonthOffset((v) => Math.min(0, v + 1))}
              disabled={selectedMonthOffset === 0}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                selectedMonthOffset === 0
                  ? 'text-white/20 cursor-not-allowed'
                  : 'hover:bg-white/10 text-white/70 hover:text-white'
              }`}
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thin white line chart with lime dot at peak */}
        <div className="h-16 w-full relative pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 300 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C8F03C" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#C8F03C" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area under curve */}
            <path
              d="M 0 50 Q 50 48, 80 32 T 150 15 T 220 28 T 300 40 L 300 60 L 0 60 Z"
              fill="url(#lineFill)"
            />
            {/* Thin white curve */}
            <path
              d="M 0 50 Q 50 48, 80 32 T 150 15 T 220 28 T 300 40"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
            />
            {/* Peak Lime Marker Dot */}
            <circle cx="150" cy="15" r="4" fill="#C8F03C" className="animate-pulse" />
            <circle cx="150" cy="15" r="8" fill="none" stroke="#C8F03C" strokeOpacity="0.4" />
          </svg>
          <div className="absolute top-0 left-[142px] -translate-y-2 text-[9px] font-mono text-[#C8F03C] bg-[#052A1A] px-1 rounded border border-[#C8F03C]/30">
            Peak ₹3.2k
          </div>
        </div>

        {/* Two Inner Tiles: Total Expenses & Net Income */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-white/10 rounded-[20px] p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#FF7A59]" />
              <span>Total Expenses</span>
            </div>
            <span className="text-base font-light text-white tabular-nums mt-1">
              {formatINR(totalOctExpenses)}
            </span>
          </div>

          <div className="bg-white/10 rounded-[20px] p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#C8F03C]" />
              <span>Net Income</span>
            </div>
            <span className="text-base font-light text-[#C8F03C] tabular-nums mt-1">
              {formatINR(netIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* Max 2 Nudge Cards */}
      {activeNudges.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-white/60 tracking-tight">Active Nudges</span>
            <span className="text-[10px] text-white/40">{activeNudges.length} priority</span>
          </div>

          {activeNudges.map((nudge) => (
            <div
              key={nudge.id}
              className={`rounded-[28px] p-4 border transition-all ${
                nudge.severity === 'alert'
                  ? 'bg-[#FF7A59]/10 border-[#FF7A59]/25 text-white'
                  : nudge.severity === 'warning'
                  ? 'bg-[#C8F03C]/10 border-[#C8F03C]/25 text-white'
                  : 'bg-white/[0.08] border-white/10 text-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      nudge.severity === 'alert'
                        ? 'bg-[#FF7A59]/20 text-[#FF7A59]'
                        : 'bg-[#C8F03C]/20 text-[#C8F03C]'
                    }`}
                  >
                    {nudge.severity === 'alert' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold tracking-tight text-white">{nudge.title}</h4>
                    <p className="text-[11px] text-white/70 leading-relaxed mt-0.5">{nudge.message}</p>
                  </div>
                </div>
              </div>

              {nudge.actionLabel && (
                <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-end">
                  <button
                    onClick={() => onSelectNudgeAction(nudge)}
                    className="text-xs font-semibold text-[#C8F03C] hover:underline flex items-center gap-1"
                  >
                    {nudge.actionLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Last 5 Transactions */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-white/60 tracking-tight">Recent Activity</span>
          <button
            onClick={() => onNavigateTab('ledger')}
            className="text-xs text-[#C8F03C] hover:underline font-medium"
          >
            See all
          </button>
        </div>

        <div className="bg-white/[0.08] border border-white/10 rounded-[28px] divide-y divide-white/[0.06] overflow-hidden">
          {last5Transactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              className="p-3.5 flex items-center justify-between hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <MerchantAvatar merchant={tx.merchant} size={38} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{tx.merchant}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-white/50 border border-white/10 px-1.5 py-0.2 rounded-full">
                      {tx.category}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {tx.date === '2026-10-31' ? 'Today' : tx.date === '2026-10-30' ? 'Yesterday' : tx.date.slice(5)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-light text-white tabular-nums">
                  {formatINR(tx.amount)}
                </span>
                {tx.isPriceHike && (
                  <span className="block text-[9px] text-[#FF7A59] font-mono">price hike</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
