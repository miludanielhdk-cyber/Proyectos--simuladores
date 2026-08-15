export type NumericSet = 'N' | 'Z' | 'Q';

export interface SetInfo {
  id: NumericSet;
  symbol: string;
  name: string;
  description: string;
  domainDefinition: string;
  examples: string[];
  rules: string[];
  color: string;
  badgeBg: string;
}

export interface StepExplanation {
  stepNumber: number;
  operationDescription: string; // e.g. "Restamos 5 a ambos miembros de la ecuación (Propiedad Uniforme)"
  uniformPropertyMath: string;  // e.g. "2x + 5 - 5 = 17 - 5"
  resultingEquation: string;    // e.g. "2x = 12"
}

export interface EquationProblem {
  id: string;
  level: NumericSet;
  subType: string;
  difficulty: 1 | 2 | 3;
  equationString: string;
  latexEquation: string;
  solutionNumeric: number;
  solutionFormatted: string; // e.g. "6", "-4", "3/4", "-5/2"
  solutionFraction?: {
    num: number;
    den: number;
  };
  hints: string[];
  steps: StepExplanation[];
  verificationStep: string;
  contextStory?: {
    title: string;
    story: string;
    question: string;
    unit?: string;
  };
}

export interface UserStats {
  points: number;
  streak: number;
  highestStreak: number;
  totalSolved: number;
  solvedBySet: Record<NumericSet, number>;
  masteryLevels: Record<NumericSet, number>; // 0 to 100%
  completedDailyChallenge: boolean;
  unlockedAchievements: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
  isHint?: boolean;
}

export interface DailyChallengeData {
  title: string;
  story: string;
  question: string;
  equation: string;
  solution: string;
  solutionExplanation: string;
  unit?: string;
  level: NumericSet;
}
