import React, { useState, useEffect, useCallback } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { RadialGlowCanvas } from './components/RadialGlowCanvas';
import { NavigationPill, TabType } from './components/NavigationPill';
import { CommandBar } from './components/CommandBar';
import { ActionCardModal } from './components/ActionCardModal';
import { GuardrailRefusalCard } from './components/GuardrailRefusalCard';
import { UndoToast } from './components/UndoToast';
import { CategoryAssignSheet } from './components/CategoryAssignSheet';
import { CSVImportModal } from './components/CSVImportModal';
import { SettingsModal } from './components/SettingsModal';
import { ScreenHome } from './components/ScreenHome';
import { ScreenLedger } from './components/ScreenLedger';
import { ScreenPlan } from './components/ScreenPlan';
import { ScreenReport } from './components/ScreenReport';
import { ScreenOnboarding } from './components/ScreenOnboarding';

import { AppState, loadInitialState, saveState, resetToSampleData, clearAllData } from './lib/storage';
import { ActionCardData, CategoryType, Goal, LearnedRule, Nudge, Profile, Transaction, WhatIfScenario } from './types';
import { parseNaturalLanguageInput } from './lib/deterministicParser';
import { checkInvestmentGuardrails, formatINR, normalizeMerchantKey } from './lib/engines';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Modals & Sheets
  const [pendingActionCard, setPendingActionCard] = useState<ActionCardData | null>(null);
  const [guardrailRefusal, setGuardrailRefusal] = useState<{
    topic?: string;
    reason?: string;
    alternativeSuggestions: string[];
  } | null>(null);
  const [undoToast, setUndoToast] = useState<{
    message: string;
    onUndo: () => void;
  } | null>(null);
  const [categorizeTxTarget, setCategorizeTxTarget] = useState<Transaction | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Persist state changes
  useEffect(() => {
    saveState(appState);
  }, [appState]);

  // Count uncategorized transactions
  const uncategorizedCount = appState.transactions.filter(
    (t) => t.category === 'Uncategorized' && t.type !== 'credit'
  ).length;

  /**
   * Main Command Bar & Speech submission handler
   */
  const handleCommandSubmit = async (input: string) => {
    const query = input.trim();
    if (!query) return;

    // 1. Guardrail check first
    const guardrailCheck = checkInvestmentGuardrails(query);
    if (guardrailCheck.isRefusal) {
      setGuardrailRefusal({
        topic: guardrailCheck.topic,
        reason: guardrailCheck.reason,
        alternativeSuggestions: guardrailCheck.alternativeSuggestions,
      });
      return;
    }

    setIsLoading(true);

    try {
      // 2. Call server API with 5.5s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5500);

      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: query,
          context: {
            salary: appState.profile.monthlySalary,
            rent: appState.profile.fixedCosts[0]?.amount || 22000,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.result) {
          setIsOfflineMode(false);
          handleParsedResult(json.result, query);
          return;
        }
      }
      throw new Error('Fallback to deterministic');
    } catch (err) {
      // 3. Deterministic offline fallback
      setIsOfflineMode(true);
      const fallbackResult = parseNaturalLanguageInput(query, appState.rules, appState.transactions);
      handleParsedResult(fallbackResult, query);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Translates parsed intent into preview Action Card
   */
  const handleParsedResult = (parsed: any, originalQuery: string) => {
    if (parsed.intent === 'guardrail' || parsed.guardrailRefusal) {
      setGuardrailRefusal({
        topic: parsed.guardrailRefusal?.topic || 'Investment Recommendations',
        reason: parsed.guardrailRefusal?.reason,
        alternativeSuggestions: parsed.guardrailRefusal?.alternativeSuggestions || [
          'What if I save ₹5,000 extra per month?',
          'How much emergency runway do I have?',
          'What if I cut dining spend by 30%?',
        ],
      });
      return;
    }

    if (parsed.intent === 'expense' && parsed.transactions && parsed.transactions.length > 0) {
      setPendingActionCard({
        id: `card-${Date.now()}`,
        type: 'add_transactions',
        title: `Add ${parsed.transactions.length} Expense${parsed.transactions.length > 1 ? 's' : ''}`,
        subtitle: `Parsed from "${originalQuery}"`,
        data: { transactions: parsed.transactions },
        confidence: parsed.transactions[0]?.confidence || 0.9,
        timestamp: Date.now(),
        status: 'preview',
      });
      return;
    }

    if (parsed.intent === 'recategorize' && parsed.recategorize) {
      setPendingActionCard({
        id: `card-${Date.now()}`,
        type: 'recategorize_merchant',
        title: `Learn Category Rule`,
        subtitle: `Assign "${parsed.recategorize.merchantKey}" to ${parsed.recategorize.category}`,
        data: parsed.recategorize,
        timestamp: Date.now(),
        status: 'preview',
      });
      return;
    }

    if (parsed.intent === 'scenario' && parsed.scenario) {
      setPendingActionCard({
        id: `card-${Date.now()}`,
        type: 'simulate_scenario',
        title: `Simulate What-If Scenario`,
        subtitle: parsed.scenario.label,
        data: parsed.scenario,
        timestamp: Date.now(),
        status: 'preview',
      });
      return;
    }

    if (parsed.intent === 'goal' && parsed.goal) {
      setPendingActionCard({
        id: `card-${Date.now()}`,
        type: 'set_goal',
        title: `Create Financial Goal`,
        subtitle: parsed.goal.title,
        data: parsed.goal,
        timestamp: Date.now(),
        status: 'preview',
      });
      return;
    }

    // Question fallback
    if (parsed.answer) {
      setUndoToast({
        message: parsed.answer,
        onUndo: () => setUndoToast(null),
      });
    }
  };

  /**
   * Confirms Action Card and applies state mutation
   */
  const handleConfirmActionCard = (card: ActionCardData) => {
    const prevState = { ...appState };

    if (card.type === 'add_transactions') {
      const newTxs: Transaction[] = card.data.transactions.map((t: any, i: number) => ({
        id: `tx-add-${Date.now()}-${i}`,
        date: t.date || '2026-10-31',
        amount: Number(t.amount),
        merchant: t.merchant,
        normalizedMerchant: normalizeMerchantKey(t.merchant),
        category: t.category,
        confidence: t.confidence || 0.95,
        status: 'confirmed',
      }));

      setAppState((prev) => ({
        ...prev,
        transactions: [...newTxs, ...prev.transactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }));

      setUndoToast({
        message: `Added ${newTxs.length} transaction${newTxs.length > 1 ? 's' : ''} (${formatINR(newTxs.reduce((s, x) => s + x.amount, 0))})`,
        onUndo: () => setAppState(prevState),
      });
    } else if (card.type === 'recategorize_merchant') {
      applyCategoryRule(card.data.merchantKey, card.data.category, card.data.applyToPast);
    } else if (card.type === 'simulate_scenario') {
      setAppState((prev) => ({
        ...prev,
        activeScenario: card.data,
      }));
      setActiveTab('plan');
      setUndoToast({
        message: `Simulated: ${card.data.label}`,
        onUndo: () => setAppState(prevState),
      });
    } else if (card.type === 'set_goal') {
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: card.data.title,
        targetAmount: card.data.targetAmount,
        currentAmount: 0,
        deadline: card.data.deadline,
        category: 'Travel',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setAppState((prev) => ({
        ...prev,
        goals: [newGoal, ...prev.goals],
      }));
      setActiveTab('plan');
    }

    setPendingActionCard(null);
  };

  /**
   * Apply category rule and correction loop
   */
  const applyCategoryRule = (merchantKey: string, newCategory: CategoryType, applyToPast: boolean) => {
    const prevState = { ...appState };
    const normKey = normalizeMerchantKey(merchantKey);

    let updatedCount = 0;
    const updatedTransactions = appState.transactions.map((tx) => {
      if (applyToPast) {
        const txNorm = normalizeMerchantKey(tx.merchant);
        if (txNorm.includes(normKey) || normKey.includes(txNorm)) {
          updatedCount++;
          return {
            ...tx,
            category: newCategory,
            confidence: 1.0,
          };
        }
      }
      return tx;
    });

    const newRule: LearnedRule = {
      id: `rule-${Date.now()}`,
      merchantKey,
      category: newCategory,
      confidence: 1.0,
      createdAt: new Date().toISOString(),
    };

    setAppState((prev) => ({
      ...prev,
      transactions: updatedTransactions,
      rules: [newRule, ...prev.rules.filter((r) => r.merchantKey !== merchantKey)],
    }));

    // Toast: "Learned: RAHUL -> Rent. Applied to 3 past" with 8s Undo
    const merchantDisplay = merchantKey.toUpperCase().slice(0, 15);
    const countDisplay = updatedCount > 0 ? updatedCount : 1;
    setUndoToast({
      message: `Learned: ${merchantDisplay} → ${newCategory}. Applied to ${countDisplay} past`,
      onUndo: () => setAppState(prevState),
    });

    setCategorizeTxTarget(null);
  };

  /**
   * Onboarding Handlers
   */
  const handleOnboardSampleData = () => {
    const seeded = resetToSampleData();
    setAppState(seeded);
  };

  const handleOnboardCustomProfile = (prof: Partial<Profile>) => {
    setAppState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...prof,
        hasOnboarded: true,
      },
    }));
  };

  // If user hasn't onboarded yet, show Onboarding screen
  if (!appState.profile.hasOnboarded) {
    return (
      <PhoneFrame>
        <RadialGlowCanvas />
        <ScreenOnboarding
          onCompleteWithSampleData={handleOnboardSampleData}
          onCompleteWithProfile={handleOnboardCustomProfile}
        />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      {/* Background Canvas: Forest + Lime Glow + 20s drift */}
      <RadialGlowCanvas />

      {/* Undo Toast Notification (8-second countdown) */}
      {undoToast && (
        <UndoToast
          message={undoToast.message}
          onUndo={undoToast.onUndo}
          onDismiss={() => setUndoToast(null)}
        />
      )}

      {/* Screen Views */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {activeTab === 'home' && (
          <ScreenHome
            appState={appState}
            onNavigateTab={setActiveTab}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSelectNudgeAction={(nudge) => {
              if (nudge.actionScenario) {
                setAppState((prev) => ({
                  ...prev,
                  activeScenario: nudge.actionScenario as WhatIfScenario,
                }));
                setActiveTab('plan');
              } else if (nudge.type === 'price_hike') {
                setActiveTab('report');
              } else {
                setActiveTab('plan');
              }
            }}
            onSelectTransaction={(tx) => {
              if (tx.category === 'Uncategorized') {
                setCategorizeTxTarget(tx);
              } else {
                setActiveTab('ledger');
              }
            }}
          />
        )}

        {activeTab === 'ledger' && (
          <ScreenLedger
            transactions={appState.transactions}
            onOpenCategorySheet={(tx) => setCategorizeTxTarget(tx)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}

        {activeTab === 'plan' && (
          <ScreenPlan
            appState={appState}
            onSaveScenarioAsPlan={(scenario) => {
              const prevState = { ...appState };
              setAppState((prev) => ({
                ...prev,
                activeScenario: scenario,
              }));
              setUndoToast({
                message: `Saved plan: "${scenario.label}"`,
                onUndo: () => setAppState(prevState),
              });
            }}
          />
        )}

        {activeTab === 'report' && (
          <ScreenReport
            appState={appState}
            onToggleSubscriptionFlag={(subId) => {
              setAppState((prev) => ({
                ...prev,
                flaggedSubs: {
                  ...prev.flaggedSubs,
                  [subId]: !prev.flaggedSubs[subId],
                },
              }));
            }}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}
      </main>

      {/* Persistent Command Bar floating above bottom nav */}
      <CommandBar
        onSubmit={handleCommandSubmit}
        isLoading={isLoading}
        isOfflineMode={isOfflineMode}
      />

      {/* Floating Bottom Navigation Pill */}
      <NavigationPill
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        uncategorizedCount={uncategorizedCount}
      />

      {/* Action Card Modal (Preview before mutate) */}
      {pendingActionCard && (
        <ActionCardModal
          card={pendingActionCard}
          onConfirm={handleConfirmActionCard}
          onReject={() => setPendingActionCard(null)}
        />
      )}

      {/* Guardrail Refusal Card */}
      {guardrailRefusal && (
        <GuardrailRefusalCard
          topic={guardrailRefusal.topic}
          reason={guardrailRefusal.reason}
          alternativeSuggestions={guardrailRefusal.alternativeSuggestions}
          onSelectSuggestion={(sug) => handleCommandSubmit(sug)}
          onDismiss={() => setGuardrailRefusal(null)}
        />
      )}

      {/* One-Tap Category Assign Sheet */}
      {categorizeTxTarget && (
        <CategoryAssignSheet
          transaction={categorizeTxTarget}
          pastCount={
            appState.transactions.filter(
              (t) =>
                normalizeMerchantKey(t.merchant) ===
                normalizeMerchantKey(categorizeTxTarget.merchant)
            ).length
          }
          onAssign={(category, applyToPast) =>
            applyCategoryRule(categorizeTxTarget.merchant, category, applyToPast)
          }
          onClose={() => setCategorizeTxTarget(null)}
        />
      )}

      {/* CSV / Bank SMS Import Modal */}
      {isImportModalOpen && (
        <CSVImportModal
          onImport={(newTxs) => {
            const prevState = { ...appState };
            setAppState((prev) => ({
              ...prev,
              transactions: [...newTxs, ...prev.transactions].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              ),
            }));
            setUndoToast({
              message: `Imported ${newTxs.length} transactions`,
              onUndo: () => setAppState(prevState),
            });
          }}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          appState={appState}
          onResetSampleData={() => {
            const seeded = resetToSampleData();
            setAppState(seeded);
            setUndoToast({
              message: 'Reloaded 90-day realistic sample data',
              onUndo: () => {},
            });
          }}
          onClearAllData={() => {
            const cleared = clearAllData();
            setAppState(cleared);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </PhoneFrame>
  );
}
