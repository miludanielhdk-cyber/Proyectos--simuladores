import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Undo, Download, PenTool, Eraser } from 'lucide-react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  equationString?: string;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({
  isOpen,
  onClose,
  equationString,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#818CF8'); // Indigo
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : color;
    ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 relative flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Pizarra Digital de Cálculos</h3>
              <p className="text-xs text-slate-400">
                Escribe a mano o haz tus cuentas intermedias antes de responder
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

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg flex items-center gap-1 font-bold ${
                tool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Lápiz</span>
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg flex items-center gap-1 font-bold ${
                tool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Borrador</span>
            </button>

            {/* Colors */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              {['#818CF8', '#34D399', '#F472B6', '#FBBF24', '#FFFFFF'].map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool('pen'); }}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c && tool === 'pen' ? 'scale-125 border-white' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={clearCanvas}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Pizarra</span>
          </button>
        </div>

        {/* Canvas Area */}
        <div className="relative w-full h-[380px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden cursor-crosshair touch-none">
          {equationString && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 pointer-events-none">
              Ecuación: {equationString}
            </div>
          )}
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};
