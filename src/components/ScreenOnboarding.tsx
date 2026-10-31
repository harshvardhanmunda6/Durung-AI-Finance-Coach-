import React, { useState } from 'react';
import { Mic, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';
import { Profile } from '../types';
import { formatINR } from '../lib/engines';

interface ScreenOnboardingProps {
  onCompleteWithSampleData: () => void;
  onCompleteWithProfile: (profile: Partial<Profile>) => void;
}

export const ScreenOnboarding: React.FC<ScreenOnboardingProps> = ({
  onCompleteWithSampleData,
  onCompleteWithProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    name: string;
    salary: number;
    rent: number;
    goal: string;
  } | null>(null);

  const handleParseCustomSpeech = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);

    // Look for salary & rent numbers in user text
    const salaryMatch = inputText.match(/(?:earn|salary|make|income)?\s*(?:rs\.?|inr)?\s*(\d+(?:\.\d+)?k?|\d+)/i);
    const rentMatch = inputText.match(/(?:rent|housing|flat)\s*(?:of|is|pe)?\s*(?:rs\.?|inr)?\s*(\d+(?:\.\d+)?k?|\d+)/i);

    const parseNum = (str: string | undefined, def: number) => {
      if (!str) return def;
      let s = str.toLowerCase().replace(/,/g, '');
      if (s.endsWith('k')) return parseFloat(s.slice(0, -1)) * 1000;
      return parseFloat(s) || def;
    };

    const salary = parseNum(salaryMatch?.[1], 60000);
    const rent = parseNum(rentMatch?.[1], 22000);

    setTimeout(() => {
      setParsedPreview({
        name: 'Aryan',
        salary,
        rent,
        goal: 'Goa Trip ₹80,000 by 31 Mar',
      });
      setIsParsing(false);
    }, 600);
  };

  const handleConfirmProfile = () => {
    if (parsedPreview) {
      onCompleteWithProfile({
        name: parsedPreview.name,
        monthlySalary: parsedPreview.salary,
        emergencyFundAmount: 150000,
        fixedCosts: [
          { id: 'fc-rent', name: 'Rent', amount: parsedPreview.rent, category: 'Housing & Rent', dueDay: 1 },
          { id: 'fc-gym', name: 'Cult.fit Gym', amount: 1750, category: 'Health & Fitness', dueDay: 5 },
          { id: 'fc-netflix', name: 'Netflix', amount: 649, category: 'Subscriptions & Media', dueDay: 14 },
        ],
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-8 pb-10 flex flex-col justify-between text-white relative z-10">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#C8F03C]/15 border border-[#C8F03C]/30 px-3 py-1 rounded-full text-xs font-semibold text-[#C8F03C]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Living Money Model</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white leading-tight">
            DURUNG
          </h1>
          <p className="text-sm text-white/70 leading-relaxed">
            Voice-first finance coach for salaried professionals in India. Speaks UPI, SMS, and learns from corrections.
          </p>
        </div>

        {/* Core Prompt: "Tell me about your money in your own words" */}
        <div className="bg-white/[0.08] border border-white/10 rounded-[28px] p-4.5 space-y-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#C8F03C]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Tell me about your money in your own words
            </h3>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            placeholder="e.g. I earn ₹60k/month, pay ₹22k rent to Rahul, spend on Swiggy and Uber, and want to save ₹80k for a Goa trip."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C8F03C] leading-relaxed resize-none"
          />

          <button
            onClick={handleParseCustomSpeech}
            disabled={!inputText.trim() || isParsing}
            className={`w-full py-2.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              inputText.trim()
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {isParsing ? 'Understanding your money...' : 'Parse My Words into Model'}
          </button>
        </div>

        {/* Confirm Card if parsed */}
        {parsedPreview && (
          <div className="bg-[#052A1A]/90 border border-[#C8F03C]/40 rounded-[28px] p-4 space-y-3 shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C8F03C]" />
              <h4 className="text-xs font-semibold text-white">Here is your live model preview:</h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/10 p-2.5 rounded-2xl">
                <span className="text-[10px] text-white/50 block">Monthly Salary</span>
                <span className="font-medium text-white">{formatINR(parsedPreview.salary)}</span>
              </div>
              <div className="bg-white/10 p-2.5 rounded-2xl">
                <span className="text-[10px] text-white/50 block">Rent Outflow</span>
                <span className="font-medium text-white">{formatINR(parsedPreview.rent)}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmProfile}
              className="w-full py-2.5 rounded-full bg-[#C8F03C] text-[#052A1A] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md hover:bg-[#b8e028]"
            >
              Confirm and Enter DURUNG <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Prominent "Try with sample data" button */}
      <div className="space-y-3 pt-6">
        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/15 w-full" />
          <span className="bg-[#052A1A] px-3 text-[11px] text-white/50 uppercase tracking-widest absolute">
            or instant start
          </span>
        </div>

        <button
          onClick={onCompleteWithSampleData}
          className="w-full py-4 rounded-full bg-gradient-to-r from-[#C8F03C] to-[#2FB4E8] text-[#052A1A] text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(200,240,60,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          Try with sample data (under 30s)
        </button>

        <p className="text-center text-[11px] text-white/50">
          Pre-loaded with ₹60k salary, rent to Rahul, Goa goal, and realistic UPI/SMS entries.
        </p>
      </div>
    </div>
  );
};
