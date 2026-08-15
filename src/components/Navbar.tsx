import React from 'react';
import { NumericSet, UserStats } from '../types';
import { 
  Sparkles, 
  Calendar, 
  Scale, 
  PenTool, 
  BookOpen, 
  Bot, 
  Flame, 
  Award,
  GraduationCap,
  Trophy
} from 'lucide-react';

interface NavbarProps {
  currentLevel: NumericSet;
  stats: UserStats;
  onOpenDaily: () => void;
  onOpenScale: () => void;
  onOpenScratchpad: () => void;
  onOpenTheory: () => void;
  onOpenChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLevel,
  stats,
  onOpenDaily,
  onOpenScale,
  onOpenScratchpad,
  onOpenTheory,
  onOpenChat,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg text-white tracking-tight">MathMaster AI</h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Secundaria
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Tutor de Álgebra &bull; Rigor en ℕ, ℤ y ℚ
            </p>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="nav-btn-daily"
            onClick={onOpenDaily}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reto Diario</span>
          </button>

          <button
            id="nav-btn-scale"
            onClick={onOpenScale}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Balanza</span>
          </button>

          <button
            id="nav-btn-scratchpad"
            onClick={onOpenScratchpad}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <PenTool className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Pizarra</span>
          </button>

          <button
            id="nav-btn-theory"
            onClick={onOpenTheory}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Teoría</span>
          </button>

          <button
            id="nav-btn-tutor-chat"
            onClick={onOpenChat}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
          >
            <Bot className="w-4 h-4" />
            <span>Tutor AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
