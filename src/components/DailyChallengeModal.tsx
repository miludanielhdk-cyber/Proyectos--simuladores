import React, { useState, useEffect } from 'react';
import { NumericSet, DailyChallengeData } from '../types';
import { MathRenderer } from './MathRenderer';
import { NUMERIC_SETS, checkAnswerCorrectness } from '../lib/mathEngine';
import { Calendar, CheckCircle2, Sparkles, X, ArrowRight, Lightbulb, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: NumericSet;
  onChallengeCompleted: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  onChallengeCompleted,
}) => {
  const [challenge, setChallenge] = useState<DailyChallengeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDailyChallenge();
    }
  }, [isOpen, currentLevel]);

  const loadDailyChallenge = async () => {
    setLoading(true);
    setUserAnswer('');
    setIsCompleted(false);
    setFeedback(null);
    setShowHint(false);

    try {
      const res = await fetch('/api/tutor/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: currentLevel }),
      });
      const data = await res.json();
      setChallenge(data);
    } catch (err) {
      console.error('Error loading daily challenge:', err);
      // Fallback
      setChallenge({
        title: 'El Desafío del Cine',
        story: 'Un grupo de amigos compró 3 entradas idénticas y un combo de palomitas de $12, gastando un total de $48.',
        question: '¿Cuál es el precio de cada entrada individual x?',
        equation: '3x + 12 = 48',
        solution: '12',
        solutionExplanation: 'Restamos 12 a ambos miembros: 3x = 36. Dividimos entre 3: x = 12.',
        unit: 'pesos',
        level: currentLevel,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge || !userAnswer.trim()) return;

    // Build mock problem for correctness checker
    const mockProblem: any = {
      level: currentLevel,
      solutionNumeric: parseFloat(challenge.solution) || 0,
      solutionFormatted: challenge.solution,
    };

    const res = checkAnswerCorrectness(userAnswer, mockProblem);
    if (res.isCorrect) {
      setIsCompleted(true);
      setFeedback(`¡Felicidades! Has resuelto con éxito el Reto Diario. ${challenge.solutionExplanation}`);
      onChallengeCompleted();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } else {
      setFeedback(res.message);
    }
  };

  const currentSetInfo = NUMERIC_SETS[currentLevel];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <span>🎯 Reto Diario Contextualizado</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentSetInfo.symbol} ({currentSetInfo.name})
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Aplica álgebra a situaciones de la vida real (problemas de texto)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-mono">Generando problema contextualizado en la vida real...</p>
          </div>
        ) : challenge ? (
          <div className="space-y-5">
            {/* Story Box */}
            <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Sparkles className="w-4 h-4" />
                <span>{challenge.title}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {challenge.story}
              </p>
              <div className="pt-2 border-t border-slate-800 text-indigo-300 font-semibold text-sm">
                ❓ {challenge.question}
              </div>
            </div>

            {/* Modeled Equation */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-mono block">Ecuación que modela la situación:</span>
                <span className="text-2xl font-serif text-white font-bold">
                  <MathRenderer latex={challenge.equation} />
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Ocultar Pista' : 'Pedir Pista'}</span>
              </button>
            </div>

            {showHint && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200 animate-in fade-in">
                💡 <strong>Pista de MathMaster:</strong> Recuerda aislar la incógnita <em>x</em> aplicando la misma operación a ambos lados. ¿Qué operación cancela el término independiente?
              </div>
            )}

            {/* Answer input */}
            <form onSubmit={handleVerify} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indigo-400 font-bold font-serif">
                    x =
                  </span>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={isCompleted}
                    placeholder={`Valor de x ${challenge.unit ? `(${challenge.unit})` : ''}`}
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-lg text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!userAnswer.trim() || isCompleted}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <span>Comprobar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Result Message */}
            {feedback && (
              <div className={`p-4 rounded-xl border text-sm ${
                isCompleted 
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  {isCompleted ? (
                    <Trophy className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : null}
                  <p className="leading-relaxed">{feedback}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
