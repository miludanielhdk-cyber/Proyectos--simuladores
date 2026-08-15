import React, { useState, useEffect, useRef } from 'react';
import { EquationProblem, NumericSet } from '../types';
import { MathRenderer } from './MathRenderer';
import { NUMERIC_SETS, checkAnswerCorrectness } from '../lib/mathEngine';
import confetti from 'canvas-confetti';
import { 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Sparkles, 
  Scale, 
  PenTool, 
  Send,
  ChevronDown,
  ChevronUp,
  BrainCircuit
} from 'lucide-react';

interface EquationCardProps {
  problem: EquationProblem;
  currentLevel: NumericSet;
  onNextProblem: () => void;
  onAnswerSubmit: (isCorrect: boolean) => void;
  onOpenScale: () => void;
  onOpenScratchpad: () => void;
  onOpenTheory: () => void;
}

export const EquationCard: React.FC<EquationCardProps> = ({
  problem,
  currentLevel,
  onNextProblem,
  onAnswerSubmit,
  onOpenScale,
  onOpenScratchpad,
  onOpenTheory,
}) => {
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{
    status: 'idle' | 'correct' | 'incorrect';
    message: string;
    aiDiagnostic?: string;
  }>({ status: 'idle', message: '' });

  const [hintsUnlocked, setHintsUnlocked] = useState<number>(0);
  const [loadingHint, setLoadingHint] = useState(false);
  const [aiHints, setAiHints] = useState<string[]>([]);
  const [showFullExplanation, setShowFullExplanation] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSetInfo = NUMERIC_SETS[currentLevel];

  // Reset local state when problem changes
  useEffect(() => {
    setUserInput('');
    setFeedback({ status: 'idle', message: '' });
    setHintsUnlocked(0);
    setAiHints([]);
    setShowFullExplanation(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [problem.id]);

  // Request a Socratic Hint
  const handleRequestHint = async () => {
    if (hintsUnlocked < problem.hints.length) {
      setHintsUnlocked((prev) => prev + 1);
      return;
    }

    // If all pre-built hints are used, ask Gemini for an advanced Socratic hint
    try {
      setLoadingHint(true);
      const res = await fetch('/api/tutor/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equation: problem.equationString,
          level: problem.level,
          levelName: currentSetInfo.name,
          solution: problem.solutionFormatted,
          hintCount: hintsUnlocked + 1,
        }),
      });
      const data = await res.json();
      if (data.hint) {
        setAiHints((prev) => [...prev, data.hint]);
        setHintsUnlocked((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error fetching hint:', err);
      // Fallback
      setHintsUnlocked((prev) => prev + 1);
    } finally {
      setLoadingHint(false);
    }
  };

  // Evaluate student answer
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isVerifying) return;

    // Check if user typed "ayuda" or "pista"
    const lower = userInput.trim().toLowerCase();
    if (lower === 'ayuda' || lower === 'pista' || lower === 'help') {
      setUserInput('');
      handleRequestHint();
      return;
    }

    setIsVerifying(true);
    const result = checkAnswerCorrectness(userInput, problem);

    if (result.isCorrect) {
      setFeedback({
        status: 'correct',
        message: result.message,
      });
      onAnswerSubmit(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'],
      });
    } else {
      onAnswerSubmit(false);
      
      // Request AI mistake evaluation for rich socratic guidance
      let aiDiagnostic = '';
      try {
        const aiRes = await fetch('/api/tutor/evaluate-mistake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            equation: problem.equationString,
            level: problem.level,
            levelName: currentSetInfo.name,
            studentAnswer: userInput,
            correctAnswer: problem.solutionFormatted,
          }),
        });
        const aiData = await aiRes.json();
        aiDiagnostic = aiData.feedback || '';
      } catch (err) {
        console.error('AI mistake eval error:', err);
      }

      setFeedback({
        status: 'incorrect',
        message: result.message,
        aiDiagnostic,
      });
    }
    setIsVerifying(false);
  };

  // Math Keypad button handler
  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setUserInput('');
    } else if (val === 'BACK') {
      setUserInput((prev) => prev.slice(0, -1));
    } else if (val === 'SUBMIT') {
      handleSubmit();
    } else {
      setUserInput((prev) => prev + val);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const allHints = [...problem.hints, ...aiHints];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Challenge Card */}
      <div 
        id="equation-main-card" 
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
      >
        {/* Subtle glowing ambient gradient */}
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
          currentLevel === 'N' ? 'bg-emerald-500' : currentLevel === 'Z' ? 'bg-blue-500' : 'bg-purple-500'
        }`} />

        {/* Card Header with Question Prompt */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>🎯 Desafío / Pregunta</span>
              </h2>
              <p className="text-xs text-slate-400">
                {problem.subType} &bull; Conjunto <span className="font-semibold text-slate-200">{currentSetInfo.symbol} ({currentSetInfo.name})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-scale-helper"
              onClick={onOpenScale}
              title="Abrir Balanza de la Igualdad"
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Balanza</span>
            </button>

            <button
              id="btn-open-scratchpad-helper"
              onClick={onOpenScratchpad}
              title="Abrir Pizarra de notas"
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pizarra</span>
            </button>

            <button
              id="btn-open-theory-helper"
              onClick={onOpenTheory}
              title="Ver Reglas del Conjunto"
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Teoría</span>
            </button>
          </div>
        </div>

        {/* Prominent Equation Display */}
        <div className="my-6 py-8 px-6 bg-slate-950/80 rounded-2xl border border-slate-800/80 shadow-inner flex flex-col items-center justify-center text-center relative group">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-mono mb-3">
            Encuentra el valor riguroso de la incógnita <span className="text-indigo-400 font-bold">x</span>
          </div>

          <div className="text-3xl sm:text-4xl md:text-5xl font-serif text-white py-2 tracking-wide select-all">
            <MathRenderer latex={problem.latexEquation} displayMode={true} />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Condición: <MathRenderer latex={currentSetInfo.domainDefinition} /></span>
          </div>
        </div>

        {/* Student Answer Input and Action Row */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-xl font-serif font-bold text-indigo-400">x =</span>
              </div>
              <input
                ref={inputRef}
                id="input-equation-solution"
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={feedback.status === 'correct'}
                placeholder={`Ej: ${currentLevel === 'Q' ? '3/4 o -5/2' : currentLevel === 'Z' ? '-7 o 12' : '8'}`}
                className="w-full pl-14 pr-4 py-3.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xl font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-60"
              />
            </div>

            <button
              id="btn-submit-solution"
              type="submit"
              disabled={!userInput.trim() || feedback.status === 'correct' || isVerifying}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifying ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Comprobar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick On-Screen Math Keypad */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Teclado Rápido de Álgebra</span>
              <span className="text-slate-600">Haz clic o escribe con tu teclado</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-sm font-mono font-medium">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '/'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white border border-slate-700 transition-colors"
                >
                  {k}
                </button>
              ))}
              {['+', '*', '(', ')', '.', 'CLEAR'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-colors col-span-1 ${
                    k === 'CLEAR' 
                      ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/50 text-rose-300 col-span-2' 
                      : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-indigo-300'
                  }`}
                >
                  {k === 'CLEAR' ? 'Limpiar' : k}
                </button>
              ))}
              <button
                type="button"
                onClick={handleRequestHint}
                className="py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-colors col-span-4 flex items-center justify-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Pedir Pista (o escribe "ayuda")</span>
              </button>
            </div>
          </div>
        </form>

        {/* Required Bottom Notification / Hint Prompt */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 italic">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span>💡 Pista disponible si la necesitas escribiendo <strong>"ayuda"</strong> o pulsando el botón de pista.</span>
          </div>
          {hintsUnlocked > 0 && (
            <span className="text-amber-400 font-mono font-semibold">
              Pistas reveladas: {hintsUnlocked}
            </span>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback.status !== 'idle' && (
          <div
            id="feedback-alert-box"
            className={`mt-6 p-5 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2 ${
              feedback.status === 'correct'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {feedback.status === 'correct' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <p className="font-semibold text-base">{feedback.message}</p>
                {feedback.aiDiagnostic && (
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-300">Diagnóstico Socrático de MathMaster: </span>
                      {feedback.aiDiagnostic}
                    </div>
                  </div>
                )}
                {feedback.status === 'correct' && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      id="btn-next-equation"
                      onClick={onNextProblem}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-900/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Siguiente Desafío</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      id="btn-toggle-view-explanation"
                      onClick={() => setShowFullExplanation(!showFullExplanation)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>{showFullExplanation ? 'Ocultar' : 'Ver'} Demostración Rigurosa</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Socratic Hints List */}
        {hintsUnlocked > 0 && (
          <div id="socratic-hints-container" className="mt-6 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Pistas Socráticas Progresivas</span>
            </h3>
            <div className="space-y-2">
              {allHints.slice(0, hintsUnlocked).map((hint, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-200 text-sm flex items-start gap-2.5 shadow-sm"
                >
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold shrink-0">
                    Pista #{idx + 1}
                  </span>
                  <div className="flex-1 leading-relaxed">
                    {hint}
                  </div>
                </div>
              ))}
            </div>

            {hintsUnlocked < problem.hints.length + 2 && (
              <button
                id="btn-request-more-hints"
                onClick={handleRequestHint}
                disabled={loadingHint}
                className="text-xs text-amber-300/80 hover:text-amber-300 font-semibold underline underline-offset-4 flex items-center gap-1 mt-1 transition-colors"
              >
                {loadingHint ? 'Generando pista con IA...' : '¿Aún tienes dudas? Revelar siguiente pista socrática →'}
              </button>
            )}
          </div>
        )}

        {/* Rigorous Step-by-Step Explanation Accordion (Propiedad Uniforme de la Igualdad) */}
        {showFullExplanation && (
          <div 
            id="rigorous-explanation-box" 
            className="mt-6 p-6 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-white text-base">
                  Resolución Rigurosa: Propiedad Uniforme de la Igualdad
                </h4>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                100% Rigor Matemático
              </span>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
                📌 <strong>Axioma Fundamental:</strong> Lo que se opera (suma, resta, multiplica o divide) en un miembro de la ecuación, debe operarse exactamente igual en el otro miembro para preservar la igualdad.
              </div>

              {problem.steps.map((step) => (
                <div key={step.stepNumber} className="space-y-1.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-semibold text-indigo-300 text-xs uppercase tracking-wide">
                    Paso {step.stepNumber}: {step.operationDescription}
                  </div>
                  <div className="py-1 px-3 bg-slate-950 rounded border border-slate-800/80 font-mono text-white text-center">
                    <MathRenderer latex={step.uniformPropertyMath} />
                  </div>
                  <div className="text-xs text-slate-400 text-right">
                    Ecuación resultante: <MathRenderer latex={step.resultingEquation} />
                  </div>
                </div>
              ))}

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                {problem.verificationStep}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
