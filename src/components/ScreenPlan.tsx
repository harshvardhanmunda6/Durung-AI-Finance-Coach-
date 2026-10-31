import React, { useState } from 'react';
import {
  Compass,
  Sliders,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  Check,
  Calendar,
  Zap,
} from 'lucide-react';
import { AppState } from '../lib/storage';
import {
  formatINR,
  formatCompactINR,
  calculateSurplus,
  calculateGoalETA,
  simulateScenario,
  calculateCategoryAverages,
} from '../lib/engines';
import { WhatIfScenario } from '../types';

interface ScreenPlanProps {
  appState: AppState;
  onSaveScenarioAsPlan: (scenario: WhatIfScenario) => void;
}

export const ScreenPlan: React.FC<ScreenPlanProps> = ({
  appState,
  onSaveScenarioAsPlan,
}) => {
  const { profile, transactions, goals, activeScenario } = appState;
  const primaryGoal = goals[0];

  // Sliders state for what-if exploration
  const [diningCutPercent, setDiningCutPercent] = useState<number>(
    activeScenario?.type === 'category_cut' ? Math.abs(activeScenario.deltaPercent || 30) : 30
  );
  const [rentDeltaAmount, setRentDeltaAmount] = useState<number>(
    activeScenario?.type === 'fixed_cost_change' ? activeScenario.deltaAmount : 0
  );
  const [extraSavingsAmount, setExtraSavingsAmount] = useState<number>(0);
  const [activeSimulationMode, setActiveSimulationMode] = useState<'dining' | 'rent' | 'extra'>('dining');

  // Baseline surplus
  const baseline = calculateSurplus(profile, transactions);
  const monthlyBurn = baseline.totalFixedCosts + baseline.averageVariableSpend;
  const runwayMonths = monthlyBurn > 0 ? (profile.emergencyFundAmount / monthlyBurn).toFixed(1) : '6.0';

  // Construct current what-if scenario based on active slider
  const currentScenario: WhatIfScenario = {
    id: 'active-sim',
    type:
      activeSimulationMode === 'dining'
        ? 'category_cut'
        : activeSimulationMode === 'rent'
        ? 'fixed_cost_change'
        : 'income_boost',
    target:
      activeSimulationMode === 'dining'
        ? 'Food & Dining'
        : activeSimulationMode === 'rent'
        ? 'Housing & Rent'
        : 'Surplus',
    deltaPercent: activeSimulationMode === 'dining' ? -diningCutPercent : undefined,
    deltaAmount:
      activeSimulationMode === 'dining'
        ? Math.round((baseline.averageVariableSpend * 0.45 * diningCutPercent) / 100)
        : activeSimulationMode === 'rent'
        ? rentDeltaAmount
        : extraSavingsAmount,
    label:
      activeSimulationMode === 'dining'
        ? `Cut Dining by ${diningCutPercent}%`
        : activeSimulationMode === 'rent'
        ? `Rent shift of ${formatINR(rentDeltaAmount, { sign: true })}`
        : `Save extra ${formatINR(extraSavingsAmount)}/mo`,
    active: true,
  };

  const simulationResult = simulateScenario(currentScenario, profile, transactions, primaryGoal);
  const baselineETA = primaryGoal ? calculateGoalETA(primaryGoal, baseline.surplus) : null;
  const newETA = primaryGoal ? calculateGoalETA(primaryGoal, simulationResult.newSurplus) : null;

  // Chart markers calculation
  const isAccelerated = simulationResult.etaShiftMonths > 0;

  // Marker animation position in SVG (0 to 300)
  // Baseline marker at x = 200, simulated marker shifts between 140 and 260
  const baselineMarkerX = 200;
  const shiftOffset = Math.max(-60, Math.min(60, simulationResult.etaShiftMonths * 40));
  const newMarkerX = baselineMarkerX - shiftOffset;

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-2 pb-36 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] text-white/50 block font-normal leading-tight">Living Plan & Runway</span>
          <h1 className="text-xl font-medium text-white tracking-tight">Financial Runway</h1>
        </div>
        <div className="flex items-center gap-1.5 bg-[#C8F03C]/15 border border-[#C8F03C]/30 text-[#C8F03C] px-2.5 py-1 rounded-full text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          {runwayMonths} mo runway
        </div>
      </div>

      {/* Signature "Runway" Visual Card: Total Savings + Diagonal Hatch Area Chart */}
      <div className="bg-white/[0.08] border border-white/10 rounded-[28px] p-4.5 text-white backdrop-blur-md relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-white/60 font-medium block">Total Liquid Savings & Runway</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-light tabular-nums text-white">
                {formatINR(profile.emergencyFundAmount + (primaryGoal?.currentAmount || 0))}
              </span>
              <span className="text-xs text-[#C8F03C] font-medium">
                {runwayMonths} months buffer
              </span>
            </div>
          </div>
        </div>

        {/* Diagonal Hatch SVG Area Chart */}
        <div className="h-36 w-full relative pt-3">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 300 110" preserveAspectRatio="none">
            <defs>
              {/* Diagonal Hatch Pattern */}
              <pattern
                id="diagonalHatch"
                width="8"
                height="8"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="#C8F03C"
                  strokeWidth="1.2"
                  strokeOpacity="0.25"
                />
              </pattern>

              {/* Blue-to-Lime Gradient for Actual Trajectory */}
              <linearGradient id="actualGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2FB4E8" />
                <stop offset="100%" stopColor="#C8F03C" />
              </linearGradient>
            </defs>

            {/* Baseline Planned Line (thin grey dashed line) */}
            <path
              d="M 10 90 L 80 75 L 150 60 L 200 48 L 290 28"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Diagonal Hatch Fill under simulated path */}
            <path
              d={`M 10 90 L 80 75 L 140 50 L ${newMarkerX} 32 L 290 12 L 290 105 L 10 105 Z`}
              fill="url(#diagonalHatch)"
            />

            {/* Actual / Simulated Trajectory Line (Blue to Lime) */}
            <path
              d={`M 10 90 L 80 75 L 140 50 L ${newMarkerX} 32 L 290 12`}
              fill="none"
              stroke="url(#actualGradient)"
              strokeWidth="2.5"
              className="transition-all duration-300"
            />

            {/* Old Goal Date Reference Marker (grey ring) */}
            <circle cx={baselineMarkerX} cy="48" r="4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

            {/* Animated Lime Marker Dot at Goal Completion */}
            <circle
              cx={newMarkerX}
              cy="32"
              r="5"
              fill="#C8F03C"
              className="transition-all duration-300"
            />
            <circle
              cx={newMarkerX}
              cy="32"
              r="10"
              fill="none"
              stroke="#C8F03C"
              strokeOpacity="0.4"
              className="animate-ping"
            />
          </svg>

          {/* Goal ETA Marker floating badge */}
          <div
            className="absolute top-2 transition-all duration-300 -translate-x-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: `${(newMarkerX / 300) * 100}%` }}
          >
            <span className="text-[10px] font-mono font-semibold text-[#052A1A] bg-[#C8F03C] px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
              Goal ETA: {newETA?.projectedDate || '15 Mar 2027'}
            </span>
            <div className="w-1.5 h-1.5 bg-[#C8F03C] rotate-45 -mt-0.5" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-white/50">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-gradient-to-r from-[#2FB4E8] to-[#C8F03C]" />
            <span>Simulated Runway</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-white/40" />
            <span>Baseline Plan</span>
          </div>
        </div>
      </div>

      {/* Goal Target Card */}
      {primaryGoal && (
        <div className="bg-white/[0.08] border border-white/10 rounded-[28px] p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2FB4E8]/20 text-[#2FB4E8] flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">{primaryGoal.title}</h4>
                <p className="text-[10px] text-white/50">Target: {formatINR(primaryGoal.targetAmount)} by {primaryGoal.deadline}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#C8F03C]">
              {Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2FB4E8] to-[#C8F03C] rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (primaryGoal.currentAmount / primaryGoal.targetAmount) * 100)}%`,
              }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-white/60 mt-2">
            <span>Saved: {formatINR(primaryGoal.currentAmount)}</span>
            <span>Remaining: {formatINR(primaryGoal.targetAmount - primaryGoal.currentAmount)}</span>
          </div>
        </div>
      )}

      {/* What-If Simulator with Sliders */}
      <div className="bg-white/[0.08] border border-white/10 rounded-[28px] p-4 text-white space-y-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#C8F03C]" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              What-If Cashflow Simulator
            </h3>
          </div>
          <span className="text-[10px] text-white/40">Adjust sliders below</span>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-1.5 p-1 bg-white/10 rounded-full text-xs">
          <button
            onClick={() => setActiveSimulationMode('dining')}
            className={`flex-1 py-1 rounded-full font-medium transition-colors ${
              activeSimulationMode === 'dining' ? 'bg-[#C8F03C] text-[#052A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            Dining Cut
          </button>
          <button
            onClick={() => setActiveSimulationMode('rent')}
            className={`flex-1 py-1 rounded-full font-medium transition-colors ${
              activeSimulationMode === 'rent' ? 'bg-[#C8F03C] text-[#052A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            Rent Shift
          </button>
          <button
            onClick={() => setActiveSimulationMode('extra')}
            className={`flex-1 py-1 rounded-full font-medium transition-colors ${
              activeSimulationMode === 'extra' ? 'bg-[#C8F03C] text-[#052A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            Save More
          </button>
        </div>

        {/* Slider Controls */}
        {activeSimulationMode === 'dining' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/70">Cut Food & Dining Spend:</span>
              <strong className="text-[#C8F03C]">-{diningCutPercent}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={diningCutPercent}
              onChange={(e) => setDiningCutPercent(Number(e.target.value))}
              className="w-full accent-[#C8F03C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>0%</span>
              <span>-25%</span>
              <span>-50%</span>
            </div>
          </div>
        )}

        {activeSimulationMode === 'rent' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/70">Change Monthly Rent:</span>
              <strong className="text-[#C8F03C]">
                {formatINR(rentDeltaAmount, { sign: true })}/mo
              </strong>
            </div>
            <input
              type="range"
              min="-6000"
              max="8000"
              step="1000"
              value={rentDeltaAmount}
              onChange={(e) => setRentDeltaAmount(Number(e.target.value))}
              className="w-full accent-[#C8F03C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>-₹6,000</span>
              <span>₹0</span>
              <span>+₹8,000</span>
            </div>
          </div>
        )}

        {activeSimulationMode === 'extra' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/70">Extra Monthly Savings:</span>
              <strong className="text-[#C8F03C]">+{formatINR(extraSavingsAmount)}/mo</strong>
            </div>
            <input
              type="range"
              min="0"
              max="15000"
              step="1000"
              value={extraSavingsAmount}
              onChange={(e) => setExtraSavingsAmount(Number(e.target.value))}
              className="w-full accent-[#C8F03C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>₹0</span>
              <span>+₹5,000</span>
              <span>+₹15,000</span>
            </div>
          </div>
        )}

        {/* Before / After Surplus Comparison Tiles */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <div className="bg-white/10 rounded-[20px] p-2.5">
            <span className="text-[10px] text-white/50 block">Baseline Surplus</span>
            <span className="text-sm font-light text-white tabular-nums">
              {formatINR(simulationResult.baselineSurplus)}/mo
            </span>
          </div>

          <div className="bg-white/10 rounded-[20px] p-2.5">
            <span className="text-[10px] text-white/50 block">Simulated Surplus</span>
            <span className="text-sm font-light text-[#C8F03C] tabular-nums">
              {formatINR(simulationResult.newSurplus)}/mo
            </span>
          </div>
        </div>

        {/* Goal shift impact summary */}
        {simulationResult.etaShiftMonths !== 0 && (
          <div className="bg-[#C8F03C]/10 border border-[#C8F03C]/20 rounded-2xl p-2.5 text-xs text-[#C8F03C] flex items-center justify-between">
            <span>
              {simulationResult.etaShiftMonths > 0
                ? `Accelerates "${primaryGoal?.title}" by ~${simulationResult.etaShiftMonths} months!`
                : `Delays "${primaryGoal?.title}" by ~${Math.abs(simulationResult.etaShiftMonths)} months`}
            </span>
          </div>
        )}

        {/* Save as Plan CTA */}
        <button
          onClick={() => onSaveScenarioAsPlan(currentScenario)}
          className="w-full py-2.5 rounded-full bg-[#C8F03C] hover:bg-[#b8e028] text-xs font-semibold text-[#052A1A] flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-95"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          Save as plan
        </button>
      </div>
    </div>
  );
};
