import React, { useState, useRef, useEffect } from 'react';
import { NumericSet, ChatMessage } from '../types';
import { NUMERIC_SETS } from '../lib/mathEngine';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  MessageSquare, 
  HelpCircle, 
  Lightbulb, 
  Flame,
  BrainCircuit,
  GraduationCap
} from 'lucide-react';

interface SocraticChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: NumericSet;
  currentEquation: string;
  points: number;
  streak: number;
}

export const SocraticChatDrawer: React.FC<SocraticChatDrawerProps> = ({
  isOpen,
  onClose,
  currentLevel,
  currentEquation,
  points,
  streak,
}) => {
  const currentSetInfo = NUMERIC_SETS[currentLevel];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'tutor',
      text: `¡Hola! Soy **MathMaster AI**, tu tutor interactivo de álgebra. Estoy aquí para guiarte en el conjunto **${currentSetInfo.name} (${currentSetInfo.symbol})**. ¿En qué paso o concepto te gustaría que profundicemos con el método socrático?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6),
          currentContext: {
            level: currentLevel,
            levelName: currentSetInfo.name,
            equation: currentEquation,
            points,
            streak,
          },
        }),
      });
      const data = await res.json();
      const tutorMsg: ChatMessage = {
        id: `msg_tutor_${Date.now()}`,
        sender: 'tutor',
        text: data.reply || '¡Muy buena pregunta! Recuerda que para mantener el equilibrio, cada paso debe respetar la propiedad uniforme de la igualdad.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg_tutor_${Date.now()}`,
        sender: 'tutor',
        text: 'Para resolver la ecuación actual, identifica qué número está sumando o restando a la incógnita x y suma su opuesto a ambos miembros de la ecuación.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    '💡 ¿Cómo inicio el despeje de mi ecuación?',
    '⚖️ ¿Por qué no se debe decir "pasa sumando"?',
    '➖ Explícame la Ley de Signos en ℤ',
    '🍰 ¿Cómo saco el común denominador en ℚ?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <span>MathMaster AI Tutor</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-400">
              Guía Socrática personalizada &bull; {currentSetInfo.symbol} ({currentSetInfo.name})
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

      {/* Current Equation Context Card */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div>
          <span className="font-mono text-slate-500 uppercase">Ecuación actual: </span>
          <span className="font-bold text-white font-mono">{currentEquation || 'Sin ecuación'}</span>
        </div>
        <div className="flex items-center gap-1 text-amber-400 font-mono">
          <Flame className="w-3.5 h-3.5" />
          <span>Racha: {streak}</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none'
              }`}
            >
              {m.text.split('\n').map((line, idx) => (
                <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                  {line}
                </p>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {m.sender === 'user' ? 'Tú' : 'MathMaster AI'}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 w-fit">
            <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            <span>MathMaster está razonando la pista...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/60 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-thin">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/70 shrink-0 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe 'ayuda' o haz una pregunta..."
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
