import React from 'react';
import { NumericSet, UserStats } from '../types';
import { NUMERIC_SETS } from '../lib/mathEngine';
import { Flame, Award, Zap, Sparkles } from 'lucide-react';

interface HeaderStatusBannerProps {
  currentLevel: NumericSet;
  onSelectLevel: (level: NumericSet) => void;
  stats: UserStats;
}

export const HeaderStatusBanner: React.FC<HeaderStatusBannerProps> = ({
  currentLevel,
  onSelectLevel,
  stats,
}) => {
  const currentSetInfo = NUMERIC_SETS[currentLevel];

  return (
    <div id="header-status-banner" className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Output format as specified in the prompt: **[NIVEL ACTUAL: N / Z / Q]** | **[PUNTOS / RACHA]** */}
        <div className="flex items-center flex-wrap gap-2 text-sm font-semibold tracking-wide">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 shadow-inner">
            <span className="text-slate-400 font-mono text-xs uppercase tracking-wider">NIVEL ACTUAL:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              currentLevel === 'N' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
              currentLevel === 'Z' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
              'bg-purple-500/20 text-purple-300 border border-purple-500/40'
            }`}>
              {currentSetInfo.symbol} ({currentLevel}) - {currentSetInfo.name}
            </span>
          </div>

          <span className="text-slate-600 font-bold hidden sm:inline">|</span>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400/80 uppercase font-mono">PUNTOS:</span>
              <span className="font-bold font-mono">{stats.points}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="text-xs text-orange-400/80 uppercase font-mono">RACHA:</span>
              <span className="font-bold font-mono">{stats.streak} 🔥</span>
            </div>
          </div>
        </div>

        {/* Level Switcher Quick Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {(['N', 'Z', 'Q'] as NumericSet[]).map((lvl) => {
            const isSelected = currentLevel === lvl;
            const setObj = NUMERIC_SETS[lvl];
            return (
              <button
                key={lvl}
                id={`btn-select-level-${lvl}`}
                onClick={() => onSelectLevel(lvl)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r ' + setObj.color + ' text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-sm font-serif font-bold">{setObj.symbol}</span>
                <span>{lvl === 'N' ? 'Naturales' : lvl === 'Z' ? 'Enteros' : 'Racionales'}</span>
                {isSelected && <Sparkles className="w-3 h-3 text-amber-200 animate-bounce" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
