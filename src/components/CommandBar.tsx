import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Sparkles, AlertCircle, ChevronUp, FileText, CornerDownLeft } from 'lucide-react';
import { SAMPLE_BANK_SMS } from '../lib/constants';

interface CommandBarProps {
  onSubmit: (input: string) => Promise<void>;
  isLoading: boolean;
  isOfflineMode: boolean;
}

const ROTATING_EXAMPLES = [
  "Say or paste: 450 on Swiggy",
  "Try: kal Zomato pe 380 gaye",
  "Ask: What if dining -30%?",
  "Say: 150 chai and 600 cab",
  "Try: 400 on Swiggy, no wait 450",
  "Paste: HDFC Bank SMS...",
  "Test: What stock should I buy?",
];

export const CommandBar: React.FC<CommandBarProps> = ({
  onSubmit,
  isLoading,
  isOfflineMode,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Rotating placeholder
  useEffect(() => {
    const timer = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Web Speech API setup for real speech dictation
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputValue(transcript);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      // Fallback: put sample messy voice string
      setInputValue('kal Zomato pe 380 gaye aur 450 Swiggy pe');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Mic start failed', err);
        setIsListening(false);
      }
    }
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setInputValue('');
    setShowDrawer(false);
    await onSubmit(text);
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputValue(promptText);
    setShowDrawer(false);
    onSubmit(promptText);
  };

  return (
    <div className="absolute bottom-[72px] left-3 right-3 z-40">
      {/* Quick Test Drawer */}
      {showDrawer && (
        <div className="mb-2 p-3 bg-[#052A1A]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-white/60">
            <span className="font-medium text-white/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C8F03C]" /> Quick voice & SMS test prompts
            </span>
            <button
              onClick={() => setShowDrawer(false)}
              className="text-white/40 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Voice & Hinglish</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "450 on Swiggy",
                "kal Zomato pe 380 gaye",
                "400 on Swiggy, no wait 450",
                "150 chai and 600 cab",
                "1.2k sneakers on Amazon",
                "mark Rahul as Rent",
              ].map((txt) => (
                <button
                  key={txt}
                  onClick={() => handleQuickPrompt(txt)}
                  className="text-left text-xs bg-white/10 hover:bg-[#C8F03C]/20 hover:text-[#C8F03C] px-2.5 py-1 rounded-full transition-colors border border-white/10"
                >
                  "{txt}"
                </button>
              ))}
            </div>

            <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider pt-1">What-If Scenarios & Guardrails</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "What if dining -30%?",
                "What if rent goes up by 4000?",
                "What stock should I buy?", // Guardrail refusal test!
              ].map((txt) => (
                <button
                  key={txt}
                  onClick={() => handleQuickPrompt(txt)}
                  className={`text-left text-xs px-2.5 py-1 rounded-full transition-colors border ${
                    txt.includes('stock')
                      ? 'bg-[#FF7A59]/15 border-[#FF7A59]/30 text-[#FF7A59] hover:bg-[#FF7A59]/30'
                      : 'bg-white/10 hover:bg-[#C8F03C]/20 hover:text-[#C8F03C] border-white/10'
                  }`}
                >
                  {txt}
                </button>
              ))}
            </div>

            <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider pt-1">Bank SMS Snippet</p>
            <button
              onClick={() => handleQuickPrompt(SAMPLE_BANK_SMS[0])}
              className="w-full text-left text-xs bg-white/5 hover:bg-white/15 p-2 rounded-2xl border border-white/10 truncate font-mono text-white/80"
            >
              {SAMPLE_BANK_SMS[0]}
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Translucent Pill */}
      <div className="relative group">
        <form
          onSubmit={handleFormSubmit}
          className={`flex items-center gap-2 bg-[#052A1A]/85 backdrop-blur-2xl border ${
            isListening ? 'border-[#C8F03C] shadow-[0_0_24px_rgba(200,240,60,0.35)]' : 'border-white/20'
          } rounded-full px-2 py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all`}
        >
          {/* Microphone button with Wispr Flow speech pulse */}
          <button
            type="button"
            onClick={handleToggleMic}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C8F03C] ${
              isListening
                ? 'bg-[#C8F03C] text-[#052A1A] animate-mic-pulse scale-105 shadow-[0_0_15px_#C8F03C]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isListening ? 'Listening... Tap to stop' : 'Tap to speak'}
            aria-label="Dictate expense or question"
          >
            <Mic className={`w-5 h-5 ${isListening ? 'text-[#052A1A]' : 'text-[#C8F03C]'}`} strokeWidth={1.75} />
          </button>

          {/* Input text field with rotating suggestion placeholder */}
          <div className="flex-1 relative flex items-center min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? 'Listening to voice...' : ROTATING_EXAMPLES[exampleIndex]}
              className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none pr-6 truncate"
              disabled={isLoading}
            />

            {/* Offline Mode indicator */}
            {isOfflineMode && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full mr-1 shrink-0">
                offline
              </span>
            )}
          </div>

          {/* Quick Drawer toggler */}
          <button
            type="button"
            onClick={() => setShowDrawer((v) => !v)}
            className="w-8 h-8 shrink-0 rounded-full text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            title="Quick prompt samples"
          >
            <ChevronUp className={`w-4 h-4 transition-transform ${showDrawer ? 'rotate-180' : ''}`} />
          </button>

          {/* Submit or loading button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all outline-none ${
              inputValue.trim() && !isLoading
                ? 'bg-[#C8F03C] text-[#052A1A] shadow-[0_0_12px_rgba(200,240,60,0.3)] hover:scale-105 active:scale-95'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
            aria-label="Send"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#052A1A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
