import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { SAMPLE_BANK_SMS } from '../lib/constants';
import { parseExpensesFromText } from '../lib/deterministicParser';

interface CSVImportModalProps {
  onImport: (newTransactions: Transaction[]) => void;
  onClose: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  onImport,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sms' | 'csv'>('sms');
  const [smsText, setSmsText] = useState(SAMPLE_BANK_SMS.slice(0, 4).join('\n\n'));
  const [csvText, setCsvText] = useState(
`Date,Merchant,Amount,Category
2026-10-30,Zepto Quick,480,Groceries
2026-10-29,Blue Tokai,320,Food & Dining
2026-10-28,Uber Ride,410,Transport
2026-10-27,Amazon India,1890,Shopping`
  );
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);

  const handleParseSMS = () => {
    const lines = smsText.split(/\n+/).filter((l) => l.trim().length > 0);
    const parsed: any[] = [];

    lines.forEach((line) => {
      const expenses = parseExpensesFromText(line);
      expenses.forEach((exp) => {
        parsed.push({
          id: `tx-sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: exp.date,
          amount: exp.amount,
          merchant: exp.merchant,
          normalizedMerchant: exp.merchant.toLowerCase().replace(/[^a-z0-9]/g, ''),
          category: exp.category,
          confidence: exp.confidence,
          status: 'confirmed',
          rawText: line,
        });
      });
    });

    setParsedPreview(parsed);
  };

  const handleParseCSV = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dateIdx = headers.findIndex((h) => h.includes('date'));
    const merchantIdx = headers.findIndex((h) => h.includes('merchant') || h.includes('desc') || h.includes('party'));
    const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('inr') || h.includes('debit'));
    const catIdx = headers.findIndex((h) => h.includes('cat'));

    const parsed: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((c) => c.trim());
      if (row.length < 2) continue;

      const date = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : '2026-10-31';
      const merchant = merchantIdx !== -1 && row[merchantIdx] ? row[merchantIdx] : 'Vendor';
      const rawAmt = amountIdx !== -1 ? row[amountIdx] : row[1];
      const amount = Math.abs(parseFloat(rawAmt.replace(/[^0-9.]/g, ''))) || 100;
      const category = catIdx !== -1 && row[catIdx] ? row[catIdx] : 'Other';

      parsed.push({
        id: `tx-csv-${Date.now()}-${i}`,
        date,
        amount,
        merchant,
        normalizedMerchant: merchant.toLowerCase().replace(/[^a-z0-9]/g, ''),
        category,
        confidence: 0.9,
        status: 'confirmed',
      });
    }

    setParsedPreview(parsed);
  };

  const handleFinalConfirm = () => {
    if (parsedPreview.length > 0) {
      onImport(parsedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[380px] bg-[#052A1A] border border-white/20 rounded-[28px] p-5 shadow-2xl text-white max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 shrink-0">
          <h3 className="text-sm font-semibold text-white">Import Bank SMS / CSV</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 p-1 bg-white/10 rounded-full mb-3 shrink-0">
          <button
            onClick={() => {
              setActiveTab('sms');
              setParsedPreview([]);
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'sms' ? 'bg-[#C8F03C] text-[#052A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            Bank SMS Batch
          </button>
          <button
            onClick={() => {
              setActiveTab('csv');
              setParsedPreview([]);
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === 'csv' ? 'bg-[#C8F03C] text-[#052A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            CSV Data
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeTab === 'sms' ? (
            <div>
              <label className="text-[11px] text-white/60 mb-1 block">
                Paste one or multiple HDFC / ICICI / SBI / Axis bank SMS:
              </label>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                rows={5}
                className="w-full bg-white/5 border border-white/15 rounded-2xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C8F03C] font-mono leading-relaxed"
                placeholder="Paste SMS here..."
              />
              <button
                onClick={handleParseSMS}
                className="w-full mt-2 py-2 bg-white/10 hover:bg-white/20 text-xs text-white rounded-xl font-medium transition-colors"
              >
                Parse Bank SMS Batch
              </button>
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-white/60 mb-1 block">
                Paste comma-separated rows (Date, Merchant, Amount, Category):
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={5}
                className="w-full bg-white/5 border border-white/15 rounded-2xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C8F03C] font-mono leading-relaxed"
              />
              <button
                onClick={handleParseCSV}
                className="w-full mt-2 py-2 bg-white/10 hover:bg-white/20 text-xs text-white rounded-xl font-medium transition-colors"
              >
                Map and Preview CSV
              </button>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedPreview.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-[#C8F03C] block">
                Extracted {parsedPreview.length} Transactions:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {parsedPreview.map((tx, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-medium text-white truncate max-w-[170px]">{tx.merchant}</p>
                      <span className="text-[10px] text-white/50">{tx.category}</span>
                    </div>
                    <span className="text-[#C8F03C] font-mono">₹{tx.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 pt-3 border-t border-white/10 mt-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-full bg-white/5 text-xs text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleFinalConfirm}
            disabled={parsedPreview.length === 0}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition-colors ${
              parsedPreview.length > 0
                ? 'bg-[#C8F03C] text-[#052A1A] hover:bg-[#b8e028]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            Import to Ledger ({parsedPreview.length})
          </button>
        </div>
      </div>
    </div>
  );
};
