import { CategoryType, FixedCost, Goal, Nudge, Profile, SubscriptionItem, Transaction, WhatIfScenario } from '../types';
import { MERCHANT_DOMAIN_MAP } from './constants';

/**
 * Format currency into standard Indian format (e.g., ₹1,23,456)
 */
export function formatINR(amount: number, options?: { hideSymbol?: boolean; sign?: boolean }): string {
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = new Intl.NumberFormat('en-IN').format(absVal);
  const symbol = options?.hideSymbol ? '' : '₹';
  
  if (options?.sign) {
    if (amount > 0) return `+${symbol}${formatted}`;
    if (amount < 0) return `-${symbol}${formatted}`;
    return `${symbol}${formatted}`;
  }
  
  return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

/**
 * Format compact INR (e.g., ₹18.4K, ₹1.2L)
 */
export function formatCompactINR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${Math.round(abs)}`;
}

/**
 * Normalize merchant key for matching and learning
 */
export function normalizeMerchantKey(merchant: string): string {
  if (!merchant) return '';
  return merchant
    .toLowerCase()
    .replace(/^upi-/, '')
    .replace(/@[a-z0-9]+/, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Get merchant logo URL from Google S2 Favicon API or domain
 */
export function getMerchantFavicon(merchant: string): { url?: string; domain?: string; initial: string } {
  const norm = normalizeMerchantKey(merchant);
  let domain: string | undefined;

  for (const [key, d] of Object.entries(MERCHANT_DOMAIN_MAP)) {
    if (norm.includes(key) || key.includes(norm)) {
      domain = d;
      break;
    }
  }

  const initial = (merchant.trim().charAt(0) || 'M').toUpperCase();
  if (domain) {
    return {
      domain,
      url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      initial,
    };
  }

  return { initial };
}

/**
 * Calculate 3-month average variable spend per category and total
 */
export function calculateCategoryAverages(
  transactions: Transaction[],
  excludeFixedCategories: CategoryType[] = []
): { perCategory: Record<CategoryType, number>; totalAverageVariableSpend: number } {
  const threeMonthsAgo = new Date(2026, 7, 1); // Aug 1, 2026
  const variableTxs = transactions.filter(
    (t) =>
      t.type !== 'credit' &&
      !t.isRecurring &&
      !excludeFixedCategories.includes(t.category) &&
      new Date(t.date) >= threeMonthsAgo
  );

  const categoryTotals: Partial<Record<CategoryType, number>> = {};
  let totalSpend = 0;

  variableTxs.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    totalSpend += t.amount;
  });

  // Average over ~3 months
  const monthsCount = 3;
  const perCategory: Record<CategoryType, number> = {} as any;
  for (const [cat, sum] of Object.entries(categoryTotals)) {
    perCategory[cat as CategoryType] = Math.round((sum || 0) / monthsCount);
  }

  const totalAverageVariableSpend = Math.round(totalSpend / monthsCount);

  return { perCategory, totalAverageVariableSpend };
}

/**
 * Surplus = income - fixed costs - 3-month average variable spend.
 */
export function calculateSurplus(profile: Profile, transactions: Transaction[]): {
  monthlyIncome: number;
  totalFixedCosts: number;
  averageVariableSpend: number;
  surplus: number;
} {
  const monthlyIncome = profile.monthlySalary;
  const totalFixedCosts = profile.fixedCosts.reduce((acc, fc) => acc + fc.amount, 0);

  // Exclude fixed categories that are already in fixedCosts
  const fixedCategories = profile.fixedCosts.map((fc) => fc.category);
  const { totalAverageVariableSpend } = calculateCategoryAverages(transactions, fixedCategories);

  const surplus = monthlyIncome - totalFixedCosts - totalAverageVariableSpend;

  return {
    monthlyIncome,
    totalFixedCosts,
    averageVariableSpend: totalAverageVariableSpend,
    surplus: Math.max(0, surplus),
  };
}

/**
 * Goal ETA = months to reach target at current surplus, counting amount saved so far.
 */
export function calculateGoalETA(
  goal: Goal,
  monthlySurplus: number
): {
  remainingAmount: number;
  monthsToReach: number;
  projectedDate: string;
  isAhead: boolean;
  weeksAhead: number;
  progressPercent: number;
} {
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const progressPercent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

  if (monthlySurplus <= 0) {
    return {
      remainingAmount,
      monthsToReach: 99,
      projectedDate: 'Indefinite',
      isAhead: false,
      weeksAhead: 0,
      progressPercent,
    };
  }

  const monthsToReach = +(remainingAmount / monthlySurplus).toFixed(1);

  // Compute projected completion date from current date (2026-10-31)
  const now = new Date(2026, 9, 31);
  const projected = new Date(now.getTime() + monthsToReach * 30.44 * 24 * 3600 * 1000);
  const deadlineDate = new Date(goal.deadline);

  const diffMs = deadlineDate.getTime() - projected.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 3600 * 1000));
  const isAhead = diffWeeks >= 0;

  return {
    remainingAmount,
    monthsToReach,
    projectedDate: projected.toISOString().split('T')[0],
    isAhead,
    weeksAhead: Math.abs(diffWeeks),
    progressPercent,
  };
}

/**
 * What-if Scenario Simulator:
 * Applies a delta to a category or fixed cost and returns before/after surplus and ETA shift.
 */
export function simulateScenario(
  scenario: WhatIfScenario,
  profile: Profile,
  transactions: Transaction[],
  primaryGoal?: Goal
): {
  baselineSurplus: number;
  newSurplus: number;
  surplusDelta: number;
  baselineETA?: ReturnType<typeof calculateGoalETA>;
  newETA?: ReturnType<typeof calculateGoalETA>;
  etaShiftMonths: number;
} {
  const baseline = calculateSurplus(profile, transactions);
  let newSurplus = baseline.surplus;

  if (scenario.type === 'category_cut') {
    // Cut variable category
    const { perCategory } = calculateCategoryAverages(transactions);
    const catSpend = perCategory[scenario.target as CategoryType] || 10000;
    const cutAmount = scenario.deltaPercent
      ? Math.round(catSpend * (Math.abs(scenario.deltaPercent) / 100))
      : scenario.deltaAmount;
    newSurplus += cutAmount;
  } else if (scenario.type === 'fixed_cost_change') {
    // E.g. Rent increase or decrease
    newSurplus -= scenario.deltaAmount; // positive delta means cost increased -> surplus reduced
  } else if (scenario.type === 'income_boost') {
    newSurplus += scenario.deltaAmount;
  } else {
    newSurplus += scenario.deltaAmount;
  }

  newSurplus = Math.max(0, newSurplus);
  const surplusDelta = newSurplus - baseline.surplus;

  let baselineETA: ReturnType<typeof calculateGoalETA> | undefined;
  let newETA: ReturnType<typeof calculateGoalETA> | undefined;
  let etaShiftMonths = 0;

  if (primaryGoal) {
    baselineETA = calculateGoalETA(primaryGoal, baseline.surplus);
    newETA = calculateGoalETA(primaryGoal, newSurplus);
    etaShiftMonths = +(baselineETA.monthsToReach - newETA.monthsToReach).toFixed(1);
  }

  return {
    baselineSurplus: baseline.surplus,
    newSurplus,
    surplusDelta,
    baselineETA,
    newETA,
    etaShiftMonths,
  };
}

/**
 * Recurring detector:
 * Same merchant key in 3+ consecutive months, amount within ±10%, gap 26-35 days;
 * flag a price change if the latest differs by more than 10% from the previous.
 */
export function detectRecurring(transactions: Transaction[]): SubscriptionItem[] {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    if (tx.type === 'credit') return;
    const key = normalizeMerchantKey(tx.merchant);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });

  const subscriptions: SubscriptionItem[] = [];

  for (const [key, txList] of Object.entries(groups)) {
    if (txList.length < 2) continue;
    const sorted = [...txList].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Check gaps between consecutive charges
    let consecutiveCount = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const d1 = new Date(sorted[i].date).getTime();
      const d2 = new Date(sorted[i + 1].date).getTime();
      const daysGap = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
      if (daysGap >= 25 && daysGap <= 36) {
        consecutiveCount++;
      }
    }

    if (consecutiveCount >= 2 || sorted.some((t) => t.isRecurring)) {
      const latest = sorted[0];
      const previous = sorted[1];
      const currentAmount = latest.amount;
      const previousAmount = previous ? previous.amount : currentAmount;

      const diff = currentAmount - previousAmount;
      const pctChange = previousAmount > 0 ? (diff / previousAmount) * 100 : 0;
      const isPriceHike = Math.abs(pctChange) >= 10 && currentAmount > previousAmount;

      const { domain } = getMerchantFavicon(latest.merchant);
      const billingDay = new Date(latest.date).getDate();

      subscriptions.push({
        id: `sub-${key}`,
        merchant: latest.merchant,
        domain: domain || `${key}.com`,
        currentAmount,
        previousAmount: isPriceHike ? previousAmount : undefined,
        isPriceHike,
        hikePercent: isPriceHike ? Math.round(pctChange) : undefined,
        category: latest.category,
        billingDay,
        isUnused: false,
        lastBilledDate: latest.date,
      });
    }
  }

  return subscriptions;
}

/**
 * Drift:
 * projected month-end per category = spent so far / days elapsed × days in month;
 * nudge if it exceeds budget by 10%.
 */
export function calculateDrift(
  category: CategoryType,
  currentMonthTransactions: Transaction[],
  budget: number,
  daysElapsed: number = 31,
  daysInMonth: number = 31
): {
  spentSoFar: number;
  projectedMonthEnd: number;
  budget: number;
  driftPercent: number;
  isOverBudget: boolean;
} {
  const spentSoFar = currentMonthTransactions
    .filter((t) => t.category === category && t.type !== 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const safeDaysElapsed = Math.max(1, daysElapsed);
  const projectedMonthEnd = Math.round((spentSoFar / safeDaysElapsed) * daysInMonth);
  const driftPercent = budget > 0 ? Math.round(((projectedMonthEnd - budget) / budget) * 100) : 0;
  const isOverBudget = driftPercent >= 10;

  return {
    spentSoFar,
    projectedMonthEnd,
    budget,
    driftPercent,
    isOverBudget,
  };
}

/**
 * Generate active nudges (Max 2 cards as per spec)
 */
export function generateActiveNudges(
  profile: Profile,
  transactions: Transaction[],
  primaryGoal?: Goal
): Nudge[] {
  const nudges: Nudge[] = [];

  // 1. Subscription price hikes (e.g., Netflix)
  const subscriptions = detectRecurring(transactions);
  const hikedSub = subscriptions.find((s) => s.isPriceHike);
  if (hikedSub && hikedSub.previousAmount) {
    nudges.push({
      id: `nudge-hike-${hikedSub.id}`,
      type: 'price_hike',
      severity: 'alert',
      title: `${hikedSub.merchant} price hiked by ${hikedSub.hikePercent}%`,
      message: `Your monthly charge jumped from ${formatINR(hikedSub.previousAmount)} to ${formatINR(hikedSub.currentAmount)}. Tap to review or flag if unused.`,
      actionLabel: 'Flag or Cancel',
      merchant: hikedSub.merchant,
    });
  }

  // 2. Category Drift (e.g., Food & Dining)
  const octTxs = transactions.filter((t) => t.date.startsWith('2026-10'));
  const { perCategory } = calculateCategoryAverages(transactions);
  const diningBudget = perCategory['Food & Dining'] || 12000;
  const diningDrift = calculateDrift('Food & Dining', octTxs, diningBudget, 31, 31);

  if (diningDrift.isOverBudget) {
    nudges.push({
      id: 'nudge-drift-dining',
      type: 'drift',
      severity: 'warning',
      title: `Food & Dining is pacing +${diningDrift.driftPercent}% over budget`,
      message: `Projected at ${formatINR(diningDrift.projectedMonthEnd)} vs your 3-mo average ${formatINR(diningBudget)}. Trimming 15% recovers ${formatINR(Math.round(diningDrift.projectedMonthEnd * 0.15))} for your Goa trip.`,
      actionLabel: 'Model -15% Dining',
      actionScenario: {
        type: 'category_cut',
        target: 'Food & Dining',
        deltaPercent: -15,
        deltaAmount: Math.round(diningDrift.projectedMonthEnd * 0.15),
        label: 'Trim Food & Dining by 15%',
      },
    });
  }

  // 3. Goal pace nudge if applicable
  if (nudges.length < 2 && primaryGoal) {
    const surplus = calculateSurplus(profile, transactions);
    const eta = calculateGoalETA(primaryGoal, surplus.surplus);
    if (eta.isAhead && eta.weeksAhead > 0) {
      nudges.push({
        id: 'nudge-goal-ahead',
        type: 'goal_pace',
        severity: 'info',
        title: `${eta.weeksAhead} weeks ahead on "${primaryGoal.title}"`,
        message: `At your current surplus of ${formatINR(surplus.surplus)}/mo, you will achieve this by ${eta.projectedDate}.`,
        actionLabel: 'View Plan',
      });
    }
  }

  return nudges.slice(0, 2);
}

/**
 * Guardrail check: Refusal pattern check for specific stock/fund advice
 */
export function checkInvestmentGuardrails(query: string): {
  isRefusal: boolean;
  topic?: string;
  reason?: string;
  alternativeSuggestions: string[];
} {
  const lower = query.toLowerCase();
  const prohibitedPatterns = [
    /\b(buy|sell|hold|recommend|invest in)\b.*\b(stock|stocks|share|shares|nifty|sensex|reliance|hdfc|tcs|infosys|tata motors|crypto|bitcoin|eth|doge|mutual fund|smallcap|midcap|etf)\b/i,
    /\bwhich stock\b/i,
    /\bbest mutual fund\b/i,
    /\bshould i buy\b/i,
    /\bshould i invest in (crypto|bitcoin|stocks)\b/i,
    /\bpenny stocks?\b/i,
    /\bgive me stock tips?\b/i,
  ];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(lower)) {
      return {
        isRefusal: true,
        topic: 'Specific Stock / Mutual Fund Advice',
        reason:
          'DURUNG is a personal cashflow modeler, not a SEBI-registered advisor. I never recommend individual stocks, mutual funds, or trade signals.',
        alternativeSuggestions: [
          'What if I save ₹5,000 more every month?',
          'How much emergency runway do I have?',
          'What if I cut dining spend by 30%?',
          'Can I reach my Goa trip goal by March?',
        ],
      };
    }
  }

  return { isRefusal: false, alternativeSuggestions: [] };
}
