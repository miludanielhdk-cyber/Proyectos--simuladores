import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  displayMode = false,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return `<span class="text-amber-400 font-mono">${latex}</span>`;
    }
  }, [latex, displayMode]);

  return (
    <span
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
