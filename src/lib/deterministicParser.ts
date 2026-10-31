import { CategoryType, LearnedRule, ParsedSpeechResult, Transaction } from '../types';
import { CATEGORIES } from './constants';
import { checkInvestmentGuardrails, normalizeMerchantKey } from './engines';

/**
 * Deterministic parser for natural language, messy speech, Hinglish, bank SMS, and what-if scenarios.
 */
export function parseNaturalLanguageInput(
  rawInput: string,
  learnedRules: LearnedRule[] = [],
  transactions: Transaction[] = []
): ParsedSpeechResult {
  const text = rawInput.trim();

  // 1. Guardrail check first
  const guardrail = checkInvestmentGuardrails(text);
  if (guardrail.isRefusal) {
    return {
      intent: 'guardrail',
      guardrailRefusal: {
        topic: guardrail.topic || 'Investment Recommendation',
        alternativeSuggestions: guardrail.alternativeSuggestions,
      },
    };
  }

  // 2. What-if Scenario check
  // e.g. "what if dining -30%", "what if rent goes up by 4000", "what if I cut dining by 20%"
  const scenarioMatch = parseScenarioText(text);
  if (scenarioMatch) {
    return {
      intent: 'scenario',
      scenario: scenarioMatch,
    };
  }

  // 3. Recategorize / Rule learning trigger
  // e.g. "mark Rahul as Rent", "Rahul is rent", "categorize Swiggy as Food & Dining"
  const recatMatch = parseRecategorizeText(text);
  if (recatMatch) {
    return {
      intent: 'recategorize',
      recategorize: recatMatch,
    };
  }

  // 4. Goal setting trigger
  // e.g. "set goal Goa trip 80000 by 2027-03-31" or "save 50000 for laptop"
  const goalMatch = parseGoalText(text);
  if (goalMatch) {
    return {
      intent: 'goal',
      goal: goalMatch,
    };
  }

  // 5. Expense parsing (handles bank SMS, Hinglish, multiple expenses, self-corrections, k-suffix)
  const expenses = parseExpensesFromText(text, learnedRules);
  if (expenses.length > 0) {
    return {
      intent: 'expense',
      transactions: expenses,
    };
  }

  // 6. Fallback Question / Answer intent
  return {
    intent: 'question',
    answer: `I understood "${text}". Say an expense like "450 on Swiggy", or a scenario like "What if dining -20%?".`,
  };
}

/**
 * Parses self-corrections like "400 on Swiggy, no wait 450", "300 actually 450"
 */
function resolveSelfCorrections(input: string): string {
  // If text contains "no wait", "actually", "scratch that", take the latter part or replace number
  const correctionMarkers = [/\bno wait\b/i, /\bactually\b/i, /\bscratch that\b/i, /\bnaah\b/i];
  for (const marker of correctionMarkers) {
    if (marker.test(input)) {
      const parts = input.split(marker);
      if (parts.length >= 2) {
        // Look for amount in second part and previous merchant in first part
        const lastPart = parts[parts.length - 1].trim();
        const firstPart = parts[0].trim();
        return `${firstPart} ${lastPart}`;
      }
    }
  }
  return input;
}

/**
 * Convert k suffixes (e.g. 1.2k -> 1200, 50k -> 50000)
 */
function normalizeAmountString(str: string): number {
  const cleaned = str.replace(/,/g, '').trim().toLowerCase();
  if (cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }
  if (cleaned.endsWith('l') || cleaned.endsWith('lac') || cleaned.endsWith('lakh')) {
    const num = parseFloat(cleaned.replace(/(lac|lakh|l)/, ''));
    return isNaN(num) ? 0 : Math.round(num * 100000);
  }
  return Math.round(parseFloat(cleaned)) || 0;
}

/**
 * Parse one or multiple expenses from text / SMS
 */
export function parseExpensesFromText(
  rawInput: string,
  learnedRules: LearnedRule[] = []
): Array<{
  amount: number;
  merchant: string;
  category: CategoryType;
  date: string;
  rawText?: string;
  confidence: number;
}> {
  const input = resolveSelfCorrections(rawInput);
  const results: Array<{
    amount: number;
    merchant: string;
    category: CategoryType;
    date: string;
    rawText?: string;
    confidence: number;
  }> = [];

  // Determine date: check for "kal" (yesterday), "aaj" (today), "yesterday", or specific dates
  const today = new Date(2026, 9, 31); // 2026-10-31
  let targetDate = today.toISOString().split('T')[0];

  if (/\b(kal|yesterday)\b/i.test(input)) {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    targetDate = y.toISOString().split('T')[0];
  }

  // Check for Bank SMS patterns first
  // e.g. "HDFC Bank: Rs 450.00 debited ... to SWIGGY", "Sent Rs.22,000 to UPI-RAHUL"
  const smsAmountMatch = input.match(/(?:(?:rs\.?|inr)\s*([\d,]+(?:\.\d+)?)|(?:debited for|debited)\s*(?:inr|rs\.?)?\s*([\d,]+(?:\.\d+)?))/i);
  if (smsAmountMatch) {
    const amountStr = smsAmountMatch[1] || smsAmountMatch[2];
    const amount = normalizeAmountString(amountStr);

    let merchant = 'Unknown Merchant';
    // Match merchant after "to", "at", "by", "on your Card ending ... at", etc.
    const merchantMatch = input.match(/(?:to|at|by|for)\s+([A-Za-z0-9\-@._ ]+?)(?:\s+(?:on|via|ref|bal|avail|\.|\n|$))/i);
    if (merchantMatch) {
      merchant = merchantMatch[1].trim();
    }

    if (amount > 0) {
      const { category, confidence } = categorizeMerchant(merchant, learnedRules);
      results.push({
        amount,
        merchant,
        category,
        date: targetDate,
        rawText: input,
        confidence,
      });
      return results;
    }
  }

  // Multiple expenses separated by "and", "aur", commas, semicolons
  // e.g. "150 chai and 600 cab", "Swiggy 450, uber 320"
  const segments = input.split(/\band\b|\baur\b|,|;/i);

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    // Pattern A: Amount first: "450 on Swiggy", "450 swiggy", "1.2k sneakers on amazon"
    const amountFirst = trimmed.match(/(?:rs\.?|inr\s*)?(\d+(?:\.\d+)?k?|\d+)\s*(?:on|pe|for|at)?\s*([a-zA-Z0-9\s\-@._]+)/i);

    // Pattern B: Merchant first: "Swiggy 450", "kal Zomato pe 380 gaye", "uber ride 340 rs"
    const merchantFirst = trimmed.match(/([a-zA-Z0-9\s\-@._]+?)\s*(?:pe|for|me)?\s*(?:rs\.?|inr)?\s*(\d+(?:\.\d+)?k?)\s*(?:gaye|spent|debit|paid|kharch)?/i);

    let amount = 0;
    let merchant = '';

    if (amountFirst && !isNaN(normalizeAmountString(amountFirst[1]))) {
      amount = normalizeAmountString(amountFirst[1]);
      merchant = amountFirst[2].replace(/\b(pe|gaye|spent|kharch|today|yesterday|kal|aaj|rs|inr)\b/gi, '').trim();
    } else if (merchantFirst && !isNaN(normalizeAmountString(merchantFirst[2]))) {
      amount = normalizeAmountString(merchantFirst[2]);
      merchant = merchantFirst[1].replace(/\b(kal|aaj|yesterday|today|spent|paid)\b/gi, '').trim();
    }

    if (amount > 0 && merchant.length > 1) {
      // Clean up common filler words
      merchant = merchant.replace(/\b(hai|ka|ki|ke|order|bill)\b/gi, '').trim();
      const { category, confidence } = categorizeMerchant(merchant, learnedRules);
      results.push({
        amount,
        merchant: capitalize(merchant),
        category,
        date: targetDate,
        rawText: trimmed,
        confidence,
      });
    }
  }

  return results;
}

/**
 * Categorize a merchant using learned rules first, then keyword dictionary, defaulting to Uncategorized
 */
export function categorizeMerchant(
  merchant: string,
  learnedRules: LearnedRule[] = []
): { category: CategoryType; confidence: number } {
  const norm = normalizeMerchantKey(merchant);

  // 1. Learned rules match
  for (const rule of learnedRules) {
    const ruleKey = normalizeMerchantKey(rule.merchantKey);
    if (norm.includes(ruleKey) || ruleKey.includes(norm)) {
      return { category: rule.category, confidence: rule.confidence || 0.98 };
    }
  }

  // 2. Keyword mapping
  const keywordMap: Array<{ keywords: string[]; category: CategoryType }> = [
    {
      keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'coffee', 'chai', 'starbucks', 'blue tokai', 'mcdonalds', 'kfc', 'burger', 'pizza', 'dining', 'food'],
      category: 'Food & Dining',
    },
    {
      keywords: ['rent', 'landlord', 'housing', 'flat', 'deposit', 'maintenance', 'rahul kumar', 'anita'],
      category: 'Housing & Rent',
    },
    {
      keywords: ['bigbasket', 'blinkit', 'zepto', 'grocery', 'supermarket', 'nature basket', 'milk', 'vegetables', 'kirana'],
      category: 'Groceries',
    },
    {
      keywords: ['uber', 'ola', 'rapido', 'cab', 'auto', 'metro', 'petrol', 'fuel', 'fastag', 'toll', 'flight', 'irctc'],
      category: 'Transport',
    },
    {
      keywords: ['amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'sneakers', 'clothes', 'shopping', 'shoes', 'nykaa'],
      category: 'Shopping',
    },
    {
      keywords: ['netflix', 'spotify', 'prime video', 'hotstar', 'youtube', 'bookmyshow', 'apple music', 'subscription'],
      category: 'Subscriptions & Media',
    },
    {
      keywords: ['electricity', 'tata power', 'bescom', 'jio fiber', 'airtel', 'broadband', 'wifi', 'gas', 'water bill'],
      category: 'Bills & Utilities',
    },
    {
      keywords: ['cult', 'cultfit', 'gym', 'fitness', 'protein', 'pharmacy', 'apollo', 'practo', 'doctor'],
      category: 'Health & Fitness',
    },
    {
      keywords: ['makemytrip', 'hotel', 'airbnb', 'flight', 'goa', 'travel', 'resort', 'agoda'],
      category: 'Travel',
    },
    {
      keywords: ['zerodha', 'groww', 'sip', 'mutual fund', 'stocks', 'ppf', 'nps', 'gold', 'salary credit'],
      category: 'Investments & Savings',
    },
  ];

  for (const entry of keywordMap) {
    if (entry.keywords.some((k) => norm.includes(k))) {
      return { category: entry.category, confidence: 0.92 };
    }
  }

  // If starts with UPI and name, highlight for user (confidence < 0.7 triggers uncategorized sheet)
  if (norm.startsWith('upi') || merchant.includes('@')) {
    return { category: 'Uncategorized', confidence: 0.4 };
  }

  return { category: 'Other', confidence: 0.5 };
}

/**
 * Scenario text parser
 * E.g., "what if dining -30%", "what if rent goes up by 4000", "what if salary increases 10k"
 */
function parseScenarioText(text: string): ParsedSpeechResult['scenario'] | null {
  const lower = text.toLowerCase();
  if (!lower.includes('what if') && !lower.includes('simulate') && !lower.includes('if i cut') && !lower.includes('if i save')) {
    return null;
  }

  // Dining / Food cut: "what if dining -30%" or "cut dining by 20%"
  const cutMatch = lower.match(/(?:dining|food|swiggy|shopping|transport)\s*(?:by|-)?\s*(\d+)%/i);
  if (cutMatch) {
    const pct = parseInt(cutMatch[1], 10);
    const target = lower.includes('shopping') ? 'Shopping' : 'Food & Dining';
    return {
      type: 'category_cut',
      target,
      delta: -pct,
      label: `Cut ${target} by ${pct}%`,
    };
  }

  // Fixed cost increase / decrease: "what if rent goes up by 4000" or "rent +4k"
  const rentMatch = lower.match(/rent\s*(?:goes up|increases|\+)\s*(?:by)?\s*(\d+(?:\.\d+)?k?|\d+)/i);
  if (rentMatch) {
    const amount = normalizeAmountString(rentMatch[1]);
    return {
      type: 'fixed_cost_change',
      target: 'Housing & Rent',
      delta: amount,
      label: `Rent increases by ₹${amount}`,
    };
  }

  // Generic amount save: "what if I save 5000 extra"
  const saveMatch = lower.match(/save\s*(\d+(?:\.\d+)?k?)\s*(?:more|extra)?/i);
  if (saveMatch) {
    const amount = normalizeAmountString(saveMatch[1]);
    return {
      type: 'income_boost',
      target: 'Surplus',
      delta: amount,
      label: `Save extra ₹${amount} monthly`,
    };
  }

  return null;
}

/**
 * Recategorize rule parser
 * E.g. "mark Rahul as Rent", "learn UPI-RAHUL is Housing & Rent"
 */
function parseRecategorizeText(text: string): ParsedSpeechResult['recategorize'] | null {
  const match = text.match(/(?:mark|set|learn|categorize)\s+([A-Za-z0-9\-@._ ]+?)\s+(?:as|to|is)\s+([A-Za-z &]+)/i);
  if (match) {
    const merchantKey = match[1].trim();
    const catInput = match[2].trim().toLowerCase();

    // Match closest category
    const foundCat = CATEGORIES.find(
      (c) => c.toLowerCase().includes(catInput) || catInput.includes(c.toLowerCase())
    ) || 'Other';

    return {
      merchantKey,
      category: foundCat,
      applyToPast: true,
    };
  }
  return null;
}

/**
 * Goal text parser
 * E.g. "set goal Goa trip 80000 by 2027-03-31" or "save 50k for laptop by Dec"
 */
function parseGoalText(text: string): ParsedSpeechResult['goal'] | null {
  const match = text.match(/(?:set goal|create goal|save for)\s+([A-Za-z0-9 ]+?)\s+(\d+(?:\.\d+)?k?)(?:\s+by\s+([A-Za-z0-9\- ]+))?/i);
  if (match) {
    const title = match[1].trim();
    const targetAmount = normalizeAmountString(match[2]);
    const deadline = match[3]?.trim() || '2027-03-31';

    return {
      title: capitalize(title),
      targetAmount,
      deadline,
    };
  }
  return null;
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
