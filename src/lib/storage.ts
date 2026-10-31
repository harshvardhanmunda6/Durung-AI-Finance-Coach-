import { Goal, LearnedRule, Profile, Transaction, WhatIfScenario } from '../types';
import { generateSampleTransactions, INITIAL_GOALS, INITIAL_PROFILE } from './constants';

const STORAGE_KEYS = {
  PROFILE: 'durung_profile_v1',
  TRANSACTIONS: 'durung_transactions_v1',
  GOALS: 'durung_goals_v1',
  RULES: 'durung_rules_v1',
  SCENARIOS: 'durung_scenarios_v1',
  FLAGGED_SUBS: 'durung_flagged_subs_v1',
};

export interface AppState {
  profile: Profile;
  transactions: Transaction[];
  goals: Goal[];
  rules: LearnedRule[];
  activeScenario: WhatIfScenario | null;
  flaggedSubs: Record<string, boolean>;
}

export function loadInitialState(): AppState {
  try {
    const rawProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    const rawTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    const rawRules = localStorage.getItem(STORAGE_KEYS.RULES);
    const rawScenarios = localStorage.getItem(STORAGE_KEYS.SCENARIOS);
    const rawFlags = localStorage.getItem(STORAGE_KEYS.FLAGGED_SUBS);

    if (rawProfile && rawTransactions) {
      return {
        profile: JSON.parse(rawProfile),
        transactions: JSON.parse(rawTransactions),
        goals: rawGoals ? JSON.parse(rawGoals) : INITIAL_GOALS,
        rules: rawRules ? JSON.parse(rawRules) : [],
        activeScenario: rawScenarios ? JSON.parse(rawScenarios) : null,
        flaggedSubs: rawFlags ? JSON.parse(rawFlags) : {},
      };
    }
  } catch (err) {
    console.warn('Could not read from localStorage, using sample data', err);
  }

  // First run: load realistic sample data
  const sampleState: AppState = {
    profile: INITIAL_PROFILE,
    transactions: generateSampleTransactions(),
    goals: INITIAL_GOALS,
    rules: [],
    activeScenario: null,
    flaggedSubs: {},
  };
  saveState(sampleState);
  return sampleState;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(state.profile));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(state.rules));
    localStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(state.activeScenario));
    localStorage.setItem(STORAGE_KEYS.FLAGGED_SUBS, JSON.stringify(state.flaggedSubs));
  } catch (err) {
    console.warn('Failed to persist to localStorage', err);
  }
}

export function resetToSampleData(): AppState {
  const sampleState: AppState = {
    profile: { ...INITIAL_PROFILE, hasOnboarded: true },
    transactions: generateSampleTransactions(),
    goals: INITIAL_GOALS,
    rules: [],
    activeScenario: null,
    flaggedSubs: {},
  };
  saveState(sampleState);
  return sampleState;
}

export function clearAllData(): AppState {
  const emptyState: AppState = {
    profile: {
      name: 'User',
      monthlySalary: 0,
      emergencyFundAmount: 0,
      payDay: 1,
      currency: 'INR',
      hasOnboarded: false,
      fixedCosts: [],
    },
    transactions: [],
    goals: [],
    rules: [],
    activeScenario: null,
    flaggedSubs: {},
  };
  saveState(emptyState);
  return emptyState;
}
