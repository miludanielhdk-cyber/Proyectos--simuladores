import React, { useState } from 'react';
import { MathRenderer } from './MathRenderer';
import { X, Scale, Plus, Minus, Divide, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

interface InteractiveScaleProps {
  isOpen: boolean;
  onClose: () => void;
  initialLeft?: string;
  initialRight?: string;
}

export const InteractiveScale: React.FC<InteractiveScaleProps> = ({
  isOpen,
  onClose,
  initialLeft = '2x + 6',
  initialRight = '18',
}) => {
  const [leftExpr, setLeftExpr] = useState(initialLeft);
  const [rightExpr, setRightExpr] = useState(initialRight);
  const [history, setHistory] = useState<string[]>([
    'Ecuación inicial: 2x + 6 = 18'
  ]);
  const [opValue, setOpValue] = useState('6');

  if (!isOpen) return null;

  const applyOperation = (op: '+' | '-' | '*' | '/') => {
    const val = opValue.trim();
    if (!val) return;

    let opText = '';
    if (op === '+') opText = `Sumamos ${val} a ambos miembros`;
    if (op === '-') opText = `Restamos ${val} a ambos miembros`;
    if (op === '*') opText = `Multiplicamos por ${val} en ambos miembros`;
    if (op === '/') opText = `Dividimos entre ${val} a ambos miembros`;

    // Example transformation for interactive intuition
    if (op === '-' && val === '6') {
      setLeftExpr('2x');
      setRightExpr('12');
      setHistory(prev => [...prev, `${opText} ⟹ 2x = 12`]);
    } else if (op === '/' && val === '2') {
      setLeftExpr('x');
      setRightExpr('6');
      setHistory(prev => [...prev, `${opText} ⟹ x = 6 (¡Solución!)`]);
    } else {
      const sym = op === '*' ? '\\cdot' : op === '/' ? '\\div' : op;
      setLeftExpr(`(${leftExpr}) ${sym} ${val}`);
      setRightExpr(`(${rightExpr}) ${sym} ${val}`);
      setHistory(prev => [...prev, `${opText}`]);
    }
  };

  const handleReset = () => {
    setLeftExpr(initialLeft);
    setRightExpr(initialRight);
    setHistory(['Ecuación inicial: 2x + 6 = 18']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Balanza Interactiva de la Igualdad</h3>
              <p className="text-xs text-slate-400">
                Visualiza por qué debemos operar en ambos miembros para mantener el equilibrio perfecto
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

        {/* Visual Balance Animation */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative">
          <div className="text-xs font-mono text-slate-500 mb-4 uppercase tracking-wider">
            ⚖️ Balanza en Equilibrio Riguroso
          </div>

          {/* Balance Scale graphic */}
          <div className="w-full max-w-md flex flex-col items-center">
            {/* Top Bar */}
            <div className="w-full h-3 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full shadow-lg relative flex justify-between px-6">
              {/* Center Fulcrum indicator */}
              <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-4 h-4 bg-amber-300 rounded-full border-2 border-amber-800 shadow" />
            </div>

            {/* Scale Pans */}
            <div className="w-full flex justify-between px-2 pt-2">
              {/* Left Pan */}
              <div className="flex flex-col items-center w-40">
                <div className="w-0.5 h-12 bg-amber-500/60" />
                <div className="w-full py-3 px-2 rounded-xl bg-slate-900 border-2 border-amber-500/50 shadow-lg text-center font-mono font-bold text-amber-200 text-sm">
                  <MathRenderer latex={leftExpr} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono">Miembro Izquierdo</span>
              </div>

              {/* Equals sign in center */}
              <div className="flex flex-col items-center justify-center pt-8">
                <span className="text-2xl font-serif font-black text-amber-400">=</span>
              </div>

              {/* Right Pan */}
              <div className="flex flex-col items-center w-40">
                <div className="w-0.5 h-12 bg-amber-500/60" />
                <div className="w-full py-3 px-2 rounded-xl bg-slate-900 border-2 border-amber-500/50 shadow-lg text-center font-mono font-bold text-amber-200 text-sm">
                  <MathRenderer latex={rightExpr} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono">Miembro Derecho</span>
              </div>
            </div>

            {/* Fulcrum Base */}
            <div className="w-12 h-10 border-l-[24px] border-r-[24px] border-b-[36px] border-l-transparent border-r-transparent border-b-slate-700 mt-1" />
          </div>
        </div>

        {/* Operation Controls */}
        <div className="space-y-3">
          <label className="text-xs font-mono text-slate-400 block uppercase">
            Aplicar Operación Uniforme a Ambos Miembros:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={opValue}
              onChange={(e) => setOpValue(e.target.value)}
              placeholder="Número (ej. 6 o 2)"
              className="w-28 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => applyOperation('-')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 transition-all"
            >
              <Minus className="w-3.5 h-3.5 text-rose-400" />
              <span>Restar a ambos lados</span>
            </button>
            <button
              onClick={() => applyOperation('+')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sumar a ambos lados</span>
            </button>
            <button
              onClick={() => applyOperation('/')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 transition-all"
            >
              <Divide className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dividir a ambos lados</span>
            </button>
            <button
              onClick={handleReset}
              title="Reiniciar ecuación de prueba"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-all ml-auto"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Log */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5 max-h-32 overflow-y-auto font-mono text-xs">
          <div className="text-slate-500 uppercase tracking-wider text-[10px]">Historial de Transformaciones:</div>
          {history.map((h, i) => (
            <div key={i} className="text-slate-300 flex items-center gap-2">
              <span className="text-amber-400">▸</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
