import React, { useState } from 'react';
import { NumericSet } from '../types';
import { NUMERIC_SETS } from '../lib/mathEngine';
import { MathRenderer } from './MathRenderer';
import { BookOpen, X, Sparkles, Check, ShieldCheck, HelpCircle } from 'lucide-react';

interface TheoryReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: NumericSet | 'PROPERTIES';
}

export const TheoryReferenceModal: React.FC<TheoryReferenceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'N',
}) => {
  const [activeTab, setActiveTab] = useState<NumericSet | 'PROPERTIES'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Biblioteca y Rigor Matemático</h3>
              <p className="text-xs text-slate-400">
                Fundamentos algebraicos, conjuntos numéricos y propiedades de la igualdad
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          {(['N', 'Z', 'Q', 'PROPERTIES'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab === 'N' ? 'ℕ Naturales' : tab === 'Z' ? 'ℤ Enteros' : tab === 'Q' ? 'ℚ Racionales' : '⚖️ Propiedad Uniforme'}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-sm text-slate-300">
          {activeTab === 'PROPERTIES' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-2">
                <h4 className="font-bold text-indigo-300 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span>La Propiedad Uniforme de la Igualdad (Rigor vs. Atajos)</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  En álgebra secundaria es común escuchar la frase coloquial <em>"si está sumando pasa restando"</em>. Sin embargo, en rigor matemático los números no viajan ni pasan de un lado a otro: lo que realmente ocurre es la aplicación del <strong>axioma uniforme</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
                    1. Inverso Aditivo (Suma/Resta)
                  </h5>
                  <p className="text-xs text-slate-400">
                    Si sumamos o restamos el mismo número a ambos miembros, la igualdad se conserva:
                  </p>
                  <div className="p-2 bg-slate-900 rounded font-mono text-center text-white text-xs">
                    <MathRenderer latex="a = b \iff a + c = b + c" />
                  </div>
                </div>

                <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">
                    2. Inverso Multiplicativo (Multiplicación/División)
                  </h5>
                  <p className="text-xs text-slate-400">
                    Si multiplicamos o dividimos ambos miembros por un número no nulo ($c \neq 0$), la igualdad se conserva:
                  </p>
                  <div className="p-2 bg-slate-900 rounded font-mono text-center text-white text-xs">
                    <MathRenderer latex="a = b \iff a \cdot c = b \cdot c \quad (c \neq 0)" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2 text-xs text-amber-200">
                <h5 className="font-bold text-amber-300">💡 Regla de los Signos en Multiplicación y División:</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono pt-1">
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">(+) · (+) = (+)</div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">(-) · (-) = (+)</div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">(+) · (-) = (-)</div>
                  <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">(-) · (+) = (-)</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const info = NUMERIC_SETS[activeTab];
                return (
                  <>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-lg flex items-center gap-2">
                          <span>{info.symbol} - {info.name}</span>
                        </h4>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300">
                          <MathRenderer latex={info.domainDefinition} />
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{info.description}</p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-400">
                        Reglas y Restricciones Obligatorias:
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {info.rules.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-400">
                        Ejemplos Resueltos en este Conjunto:
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {info.examples.map((ex, i) => (
                          <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center font-mono text-xs text-indigo-300">
                            <MathRenderer latex={ex} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
