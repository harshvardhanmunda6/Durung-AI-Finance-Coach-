export type CategoryType =
  | 'Food & Dining'
  | 'Housing & Rent'
  | 'Groceries'
  | 'Transport'
  | 'Shopping'
  | 'Subscriptions & Media'
  | 'Bills & Utilities'
  | 'Health & Fitness'
  | 'Travel'
  | 'Investments & Savings'
  | 'Uncategorized'
  | 'Other';

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  category: CategoryType;
  dueDay?: number;
}

export interface Profile {
  name: string;
  monthlySalary: number;
  fixedCosts: FixedCost[];
  emergencyFundAmount: number;
  payDay: number;
  currency: string;
  hasOnboarded: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  merchant: string;
  normalizedMerchant: string;
  category: CategoryType;
  confidence?: number;
  rawText?: string;
  isRecurring?: boolean;
  isPriceHike?: boolean;
  previousAmount?: number;
  account?: string;
  type?: 'debit' | 'credit';
  note?: string;
  status: 'confirmed' | 'pending';
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  category: CategoryType;
  createdAt: string;
}

export interface LearnedRule {
  id: string;
  merchantKey: string;
  category: CategoryType;
  confidence: number;
  createdAt: string;
}

export interface SubscriptionItem {
  id: string;
  merchant: string;
  domain: string;
  currentAmount: number;
  previousAmount?: number;
  isPriceHike?: boolean;
  hikePercent?: number;
  category: CategoryType;
  billingDay: number;
  isUnused: boolean;
  lastBilledDate: string;
}

export interface WhatIfScenario {
  id: string;
  type: 'category_cut' | 'fixed_cost_change' | 'income_boost' | 'custom';
  target: string;
  deltaPercent?: number;
  deltaAmount: number;
  label: string;
  active: boolean;
}

export type ActionCardType =
  | 'add_transactions'
  | 'recategorize_merchant'
  | 'update_profile'
  | 'set_goal'
  | 'simulate_scenario'
  | 'flag_subscription'
  | 'guardrail_refusal'
  | 'coach_answer';

export interface ActionCardData {
  id: string;
  type: ActionCardType;
  title: string;
  subtitle?: string;
  data: any;
  confidence?: number;
  timestamp: number;
  status: 'preview' | 'confirmed' | 'rejected' | 'undone';
  refusalDetails?: {
    topic: string;
    reason: string;
    alternativeSuggestions: string[];
  };
}

export interface Nudge {
  id: string;
  type: 'drift' | 'price_hike' | 'unused_sub' | 'goal_pace';
  severity: 'alert' | 'warning' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  actionScenario?: Partial<WhatIfScenario>;
  merchant?: string;
}

export interface ParsedSpeechResult {
  intent: 'expense' | 'scenario' | 'question' | 'recategorize' | 'goal' | 'profile' | 'guardrail';
  transactions?: Array<{
    amount: number;
    merchant: string;
    category: CategoryType;
    date: string;
    rawText?: string;
    confidence: number;
  }>;
  scenario?: {
    type: 'category_cut' | 'fixed_cost_change' | 'income_boost';
    target: string;
    delta: number;
    label: string;
  };
  goal?: {
    title: string;
    targetAmount: number;
    deadline: string;
  };
  recategorize?: {
    merchantKey: string;
    category: CategoryType;
    applyToPast: boolean;
  };
  answer?: string;
  guardrailRefusal?: {
    topic: string;
    alternativeSuggestions: string[];
  };
}
