import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * System instruction for the voice-first finance coach parser
 */
const PARSER_SYSTEM_INSTRUCTION = `
You are DURUNG's core semantic parser for salaried Indians (aged 22-30).
Your job is to parse conversational voice dictations, Hinglish, messy bank SMS, and what-if simulation questions into structured financial actions.

CRITICAL GUARDRAIL:
You are an educational cashflow modeler, NOT a SEBI-registered advisor.
If the user asks which stock, mutual fund, crypto, or equity to buy, sell, or trade (e.g., "Which stock should I buy?", "Is NIFTY going up?", "Buy Reliance or HDFC?"), DO NOT give any recommendation.
Instead, return a 'guardrail_refusal' intent with an educational explanation of what DURUNG can model instead (e.g. surplus runway, SIP budgeting), and the mandatory disclaimer: "Educational modeling, not investment advice."

RULES:
1. Handle self-corrections: "400 on Swiggy, no wait 450" -> amount is 450.
2. Handle Hinglish: "kal Zomato pe 380 gaye" -> 380 on Zomato, date is yesterday.
3. Handle multiple expenses in one sentence: "150 chai and 600 cab" -> 2 transactions.
4. Handle abbreviations: "1.2k" -> 1200, "50k" -> 50000.
5. Standard categories:
   - Food & Dining
   - Housing & Rent
   - Groceries
   - Transport
   - Shopping
   - Subscriptions & Media
   - Bills & Utilities
   - Health & Fitness
   - Travel
   - Investments & Savings
   - Uncategorized (use if confidence < 0.7 or unknown UPI)
   - Other
6. Grounding: Do NOT perform arithmetic yourself. Just extract parameters.
`;

// API endpoint: Parse natural language or voice dictation
app.post('/api/ai/parse', async (req, res) => {
  const { text, context } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text prompt is required.' });
  }

  // Check investment guardrail pattern fast on server
  const lower = text.toLowerCase();
  const isInvestmentQuery =
    /\b(buy|sell|recommend|invest in)\b.*\b(stock|stocks|share|shares|nifty|sensex|crypto|bitcoin|mutual fund|smallcap|midcap|multibagger)\b/i.test(lower) ||
    /\bwhich stock\b/i.test(lower) ||
    /\bbest mutual fund\b/i.test(lower) ||
    /\bshould i buy\b/i.test(lower);

  if (isInvestmentQuery) {
    return res.json({
      success: true,
      result: {
        intent: 'guardrail',
        guardrailRefusal: {
          topic: 'Stock & Mutual Fund Recommendations',
          reason: 'DURUNG is a personal cashflow modeler, not a SEBI-registered investment advisor. We do not provide recommendations for individual stocks, mutual funds, or trading calls.',
          alternativeSuggestions: [
            'What if I save ₹5,000 extra per month?',
            'How many months of emergency runway do I have?',
            'What if I cut dining spend by 30%?',
            'Will I reach my Goa trip goal by March?',
          ],
        },
      },
    });
  }

  if (!ai) {
    return res.json({
      success: false,
      isOffline: true,
      message: 'Gemini API key is not configured; using deterministic fallback.',
    });
  }

  try {
    const todayStr = '2026-10-31';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Current Date is ${todayStr}. User input: "${text}". Known profile: salary=${context?.salary || 60000}, rent=${context?.rent || 22000}.`,
      config: {
        systemInstruction: PARSER_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description: 'One of: expense, scenario, recategorize, goal, question, guardrail',
            },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  amount: { type: Type.NUMBER },
                  merchant: { type: Type.STRING },
                  category: { type: Type.STRING },
                  date: { type: Type.STRING, description: 'YYYY-MM-DD' },
                  confidence: { type: Type.NUMBER },
                  note: { type: Type.STRING },
                },
                required: ['amount', 'merchant', 'category', 'date'],
              },
            },
            scenario: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: 'category_cut, fixed_cost_change, or income_boost' },
                target: { type: Type.STRING },
                delta: { type: Type.NUMBER },
                label: { type: Type.STRING },
              },
            },
            recategorize: {
              type: Type.OBJECT,
              properties: {
                merchantKey: { type: Type.STRING },
                category: { type: Type.STRING },
                applyToPast: { type: Type.BOOLEAN },
              },
            },
            goal: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                targetAmount: { type: Type.NUMBER },
                deadline: { type: Type.STRING },
              },
            },
            answer: {
              type: Type.STRING,
              description: 'Clear direct response if user asked a question',
            },
          },
          required: ['intent'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      result: parsedJson,
    });
  } catch (error: any) {
    console.error('Gemini parse error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse with Gemini',
      isOffline: true,
    });
  }
});

// API endpoint: Generate grounded 3-sentence monthly review narrative
app.post('/api/ai/report-narrative', async (req, res) => {
  const { month, surplus, totalSpent, netIncome, goalTitle, goalETAWeeks, topCategory, subscriptionHike } = req.body;

  if (!ai) {
    const templateNarrative = `In ${month || 'October'}, you generated a net cash surplus of ₹${surplus?.toLocaleString('en-IN') || '18,400'} with total outflows of ₹${totalSpent?.toLocaleString('en-IN') || '41,600'}. Your top discretionary expense was ${topCategory || 'Food & Dining'}, and you are currently ${goalETAWeeks || 2} weeks ahead of schedule on your ${goalTitle || 'Goa trip'} goal. Trimming subscriptions and dining drift will keep your emergency runway above 4 months.`;
    return res.json({ narrative: templateNarrative });
  }

  try {
    const prompt = `
Generate a grounded, high-conviction 3-sentence financial review for ${month || 'October 2026'}.
Ground truth stats:
- Net Income: ₹${netIncome?.toLocaleString('en-IN')}
- Total Expenses: ₹${totalSpent?.toLocaleString('en-IN')}
- Net Surplus: ₹${surplus?.toLocaleString('en-IN')}
- Primary Goal: "${goalTitle}", currently ${goalETAWeeks} weeks ahead of target
- Top Variable Category: ${topCategory}
- Subscription note: ${subscriptionHike || 'Netflix price increase flagged'}

STRICT INSTRUCTION:
- EXACTLY 3 sentences.
- Only reference numbers provided above. Never invent amounts.
- Tone: Crisp, intelligent, encouraging Indian fintech coach.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are DURUNG, a voice-first finance coach. Grounded statements only.',
      },
    });

    const text = response.text?.trim() || '';
    return res.json({ narrative: text });
  } catch (err: any) {
    const fallback = `In ${month || 'October'}, you generated a net cash surplus of ₹${surplus?.toLocaleString('en-IN') || '18,400'} against total outflows of ₹${totalSpent?.toLocaleString('en-IN') || '41,600'}. Your highest discretionary outflow was ${topCategory || 'Food & Dining'}, while staying ${goalETAWeeks || 2} weeks ahead of your ${goalTitle || 'Goa trip'} goal. Managing recurring price hikes will keep your savings runway firmly on track.`;
    return res.json({ narrative: fallback });
  }
});

// Start full-stack dev / prod server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DURUNG server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
