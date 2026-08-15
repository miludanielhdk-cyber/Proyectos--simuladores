/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NumericSet, EquationProblem, UserStats } from './types';
import { generateEquationByLevel, NUMERIC_SETS } from './lib/mathEngine';
import { Navbar } from './components/Navbar';
import { HeaderStatusBanner } from './components/HeaderStatusBanner';
import { EquationCard } from './components/EquationCard';
import { InteractiveScale } from './components/InteractiveScale';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { SocraticChatDrawer } from './components/SocraticChatDrawer';
import { TheoryReferenceModal } from './components/TheoryReferenceModal';
import { ScratchpadModal } from './components/ScratchpadModal';
import { 
  Sparkles, 
  Trophy, 
  Flame, 
  Award, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRight, 
  BookOpen, 
  Scale, 
  Bot,
  BrainCircuit,
  GraduationCap
} from 'lucide-react';

const INITIAL_STATS: UserStats = {
  points: 100,
  streak: 0,
  highestStreak: 0,
  totalSolved: 0,
  solvedBySet: { N: 0, Z: 0, Q: 0 },
  masteryLevels: { N: 15, Z: 0, Q: 0 },
  completedDailyChallenge: false,
  unlockedAchievements: ['first_step'],
};

export default function App() {
  const [currentLevel, setCurrentLevel] = useState<NumericSet>('N');
  const [problem, setProblem] = useState<EquationProblem>(() => generateEquationByLevel('N'));
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('mathmaster_user_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_STATS;
      }
    }
    return INITIAL_STATS;
  });

  // Modals state
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('mathmaster_user_stats', JSON.stringify(stats));
  }, [stats]);

  // Load new problem on level change
  const handleSelectLevel = (level: NumericSet) => {
    setCurrentLevel(level);
    setProblem(generateEquationByLevel(level));
  };

  const handleNextProblem = () => {
    setProblem(generateEquationByLevel(currentLevel));
  };

  const handleAnswerSubmit = (isCorrect: boolean) => {
    setStats((prev) => {
      if (isCorrect) {
        const newStreak = prev.streak + 1;
        const streakBonus = newStreak >= 3 ? 10 : 0;
        const setSolved = (prev.solvedBySet[currentLevel] || 0) + 1;
        const newMastery = Math.min(100, Math.round((setSolved / 5) * 100));

        return {
          ...prev,
          points: prev.points + 15 + streakBonus,
          streak: newStreak,
          highestStreak: Math.max(prev.highestStreak, newStreak),
          totalSolved: prev.totalSolved + 1,
          solvedBySet: {
            ...prev.solvedBySet,
            [currentLevel]: setSolved,
          },
          masteryLevels: {
            ...prev.masteryLevels,
            [currentLevel]: Math.max(prev.masteryLevels[currentLevel], newMastery),
          },
        };
      } else {
        return {
          ...prev,
          streak: 0,
        };
      }
    });
  };

  const handleDailyCompleted = () => {
    setStats((prev) => ({
      ...prev,
      points: prev.points + 50,
      completedDailyChallenge: true,
    }));
  };

  const currentSet = NUMERIC_SETS[currentLevel];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Main Navigation Bar */}
      <Navbar
        currentLevel={currentLevel}
        stats={stats}
        onOpenDaily={() => setIsDailyOpen(true)}
        onOpenScale={() => setIsScaleOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Required Status Banner: **[NIVEL ACTUAL: N / Z / Q]** | **[PUNTOS / RACHA]** */}
      <HeaderStatusBanner
        currentLevel={currentLevel}
        onSelectLevel={handleSelectLevel}
        stats={stats}
      />

      {/* Main Educational Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Main Equation Card (### 🎯 Desafío / Pregunta & 💡 Pista) */}
        <EquationCard
          problem={problem}
          currentLevel={currentLevel}
          onNextProblem={handleNextProblem}
          onAnswerSubmit={handleAnswerSubmit}
          onOpenScale={() => setIsScaleOpen(true)}
          onOpenScratchpad={() => setIsScratchpadOpen(true)}
          onOpenTheory={() => setIsTheoryOpen(true)}
        />

        {/* Level Progression & Mastery Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {(['N', 'Z', 'Q'] as NumericSet[]).map((lvl) => {
            const setObj = NUMERIC_SETS[lvl];
            const isCurrent = currentLevel === lvl;
            const mastery = stats.masteryLevels[lvl] || 0;
            const solved = stats.solvedBySet[lvl] || 0;

            return (
              <div
                key={lvl}
                onClick={() => handleSelectLevel(lvl)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isCurrent
                    ? 'bg-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold font-serif px-2.5 py-1 rounded-lg ${setObj.badgeBg}`}>
                      {setObj.symbol}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{setObj.name}</h4>
                      <span className="text-[11px] text-slate-400">Nivel {lvl === 'N' ? '1' : lvl === 'Z' ? '2' : '3'}</span>
                    </div>
                  </div>
                  {mastery >= 100 ? (
                    <Trophy className="w-5 h-5 text-amber-400" />
                  ) : (
                    <span className="text-xs font-mono font-bold text-indigo-300">{mastery}%</span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                  {setObj.description}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${setObj.color}`}
                    style={{ width: `${mastery}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                  <span>{solved} ecuaciones resueltas</span>
                  <span className="text-indigo-400 font-semibold flex items-center gap-1">
                    {isCurrent ? 'Nivel Activo' : 'Seleccionar'}
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>MathMaster AI &bull; Plataforma Educativa de Álgebra para Secundaria</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Rigor Matemático 100%</span>
            <span>&bull;</span>
            <span>Propiedad Uniforme</span>
            <span>&bull;</span>
            <span>Enfoque Socrático</span>
          </div>
        </div>
      </footer>

      {/* Floating Action Button for AI Tutor */}
      <button
        id="floating-tutor-btn"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-2xl shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-all flex items-center gap-2.5 font-bold text-sm cursor-pointer group"
      >
        <Bot className="w-6 h-6 animate-bounce" />
        <span className="hidden sm:inline">Preguntar al Tutor AI</span>
      </button>

      {/* Modals and Drawers */}
      <InteractiveScale
        isOpen={isScaleOpen}
        onClose={() => setIsScaleOpen(false)}
        initialLeft="2x + 6"
        initialRight="18"
      />

      <DailyChallengeModal
        isOpen={isDailyOpen}
        onClose={() => setIsDailyOpen(false)}
        currentLevel={currentLevel}
        onChallengeCompleted={handleDailyCompleted}
      />

      <SocraticChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentLevel={currentLevel}
        currentEquation={problem.equationString}
        points={stats.points}
        streak={stats.streak}
      />

      <TheoryReferenceModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
        initialTab={currentLevel}
      />

      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        equationString={problem.equationString}
      />
    </div>
  );
}
