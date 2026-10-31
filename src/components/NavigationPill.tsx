import React from 'react';
import { Home, ReceiptText, Compass, BarChart3 } from 'lucide-react';

export type TabType = 'home' | 'ledger' | 'plan' | 'report';

interface NavigationPillProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  uncategorizedCount?: number;
}

export const NavigationPill: React.FC<NavigationPillProps> = ({
  activeTab,
  onChangeTab,
  uncategorizedCount = 0,
}) => {
  const tabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'ledger', label: 'Ledger', icon: ReceiptText },
    { id: 'plan', label: 'Plan', icon: Compass },
    { id: 'report', label: 'Report', icon: BarChart3 },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-[280px]">
      <div className="bg-[#052A1A]/85 backdrop-blur-xl border border-white/15 p-1.5 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.5)] flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative rounded-full transition-all duration-200 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#C8F03C] ${
                isActive
                  ? 'w-13 h-13 bg-white/20 text-[#C8F03C] scale-105 shadow-inner'
                  : 'w-11 h-11 text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title={tab.label}
              aria-label={tab.label}
            >
              <Icon className={isActive ? 'w-5 h-5 text-[#C8F03C]' : 'w-5 h-5'} strokeWidth={1.5} />

              {/* Uncategorized badge on Ledger tab */}
              {tab.id === 'ledger' && uncategorizedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF7A59] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-[#052A1A]">
                  {uncategorizedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
