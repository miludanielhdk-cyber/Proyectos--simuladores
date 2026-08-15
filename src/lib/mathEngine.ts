import { NumericSet, EquationProblem, SetInfo, StepExplanation } from '../types';

export const NUMERIC_SETS: Record<NumericSet, SetInfo> = {
  N: {
    id: 'N',
    symbol: 'ℕ',
    name: 'Números Naturales',
    description: 'Números enteros positivos utilizados para contar elementos.',
    domainDefinition: 'x \\in \\{1, 2, 3, 4, \\dots\\} \\text{ con } x > 0',
    examples: ['x + 4 = 9 \\implies x = 5', '3x = 18 \\implies x = 6', '2x + 7 = 19 \\implies x = 6'],
    rules: [
      'La solución DEBE ser un número entero estrictamente mayor que cero (x > 0).',
      'No se admiten números negativos, cero (0) ni números fraccionarios.',
      'Aplica la Propiedad Uniforme operando el mismo valor a ambos miembros.',
    ],
    color: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  Z: {
    id: 'Z',
    symbol: 'ℤ',
    name: 'Números Enteros',
    description: 'Conjunto formado por los números naturales, el cero y los opuestos negativos.',
    domainDefinition: 'x \\in \\{\\dots, -3, -2, -1, 0, 1, 2, 3, \\dots\\}',
    examples: ['x - 8 = -15 \\implies x = -7', '3x + 5 = 2x - 4 \\implies x = -9', '2(x - 3) = -16 \\implies x = -5'],
    rules: [
      'La solución puede ser positiva, negativa o cero (x ∈ ℤ).',
      'Cuidado riguroso con la Ley de Signos: (-)(-) = +, (-)(+) = -.',
      'Si hay paréntesis, aplica la propiedad distributiva: a(b + c) = ab + ac.',
    ],
    color: 'from-blue-500 to-indigo-600',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  Q: {
    id: 'Q',
    symbol: 'ℚ',
    name: 'Números Racionales',
    description: 'Números que pueden expresarse como cociente de dos números enteros a/b con b ≠ 0.',
    domainDefinition: 'x = \\frac{a}{b}, \\quad a, b \\in \\mathbb{Z}, \\; b \\neq 0',
    examples: ['\\frac{x}{3} + \\frac{1}{2} = \\frac{5}{6} \\implies x = 1', '\\frac{2x - 1}{4} = \\frac{3}{5} \\implies x = \\frac{17}{10}', '3x + \\frac{1}{4} = \\frac{5}{2} \\implies x = \\frac{3}{4}'],
    rules: [
      'La solución se expresa preferentemente como fracción irreducible p/q.',
      'Para sumar o restar fracciones, halla el mínimo común múltiplo (m.c.m.).',
      'Multiplica ambos miembros por el denominador común para eliminar fracciones.',
    ],
    color: 'from-purple-500 to-violet-600',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
};

// Greatest Common Divisor (Euclidean algorithm)
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

// Least Common Multiple
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

export interface SimplifiedFraction {
  num: number;
  den: number;
  formatted: string;
  latex: string;
}

export function simplifyFraction(num: number, den: number): SimplifiedFraction {
  if (den === 0) throw new Error("División por cero en fracción");
  
  let sign = (num < 0 ? -1 : 1) * (den < 0 ? -1 : 1);
  let absNum = Math.abs(num);
  let absDen = Math.abs(den);
  
  if (absNum === 0) {
    return { num: 0, den: 1, formatted: '0', latex: '0' };
  }

  const common = gcd(absNum, absDen);
  const sNum = sign * (absNum / common);
  const sDen = absDen / common;

  if (sDen === 1) {
    return {
      num: sNum,
      den: 1,
      formatted: `${sNum}`,
      latex: `${sNum}`,
    };
  }

  return {
    num: sNum,
    den: sDen,
    formatted: `${sNum}/${sDen}`,
    latex: sNum < 0 ? `-\\frac{${Math.abs(sNum)}}{${sDen}}` : `\\frac{${sNum}}{${sDen}}`,
  };
}

// Parse student input strings (e.g. "5", "-3", "3/4", "-7/2", "x=4", "0.75")
export function parseStudentAnswer(input: string): { num: number; den: number; value: number } | null {
  if (!input) return null;
  
  let cleaned = input.trim().toLowerCase();
  // Remove "x=" or "x =" or "x: "
  cleaned = cleaned.replace(/^x\s*[:=]\s*/, '');
  cleaned = cleaned.replace(/\s+/g, '');

  // Check for fraction: a/b or -a/b
  const fractionMatch = cleaned.match(/^(-?\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den === 0) return null;
    return { num, den, value: num / den };
  }

  // Check for integer: e.g. 5, -12
  const integerMatch = cleaned.match(/^-?\d+$/);
  if (integerMatch) {
    const val = parseInt(integerMatch[0], 10);
    return { num: val, den: 1, value: val };
  }

  // Check for decimal: e.g. 0.75, -2.5
  const decimalMatch = cleaned.match(/^-?\d+\.\d+$/);
  if (decimalMatch) {
    const val = parseFloat(decimalMatch[0]);
    // Convert decimal to fraction with precision
    const decimals = decimalMatch[0].split('.')[1].length;
    const den = Math.pow(10, decimals);
    const num = Math.round(val * den);
    return { num, den, value: val };
  }

  return null;
}

// Check if user answer matches the problem solution
export function checkAnswerCorrectness(
  userAnswerStr: string,
  problem: EquationProblem
): {
  isCorrect: boolean;
  message: string;
  reason?: string;
} {
  const parsed = parseStudentAnswer(userAnswerStr);
  if (!parsed) {
    return {
      isCorrect: false,
      message: 'Formato no reconocido. Ingresa un número (ej. 5 o -3) o una fracción (ej. 3/4).',
      reason: 'formato',
    };
  }

  // Validate strict numerical set constraint
  if (problem.level === 'N') {
    if (parsed.value <= 0 || !Number.isInteger(parsed.value)) {
      return {
        isCorrect: false,
        message: '¡Atención! En el conjunto ℕ (Naturales), la incógnita x debe ser un número entero estrictamente positivo (x ≥ 1).',
        reason: 'conjunto_invalido',
      };
    }
  }

  if (problem.level === 'Z') {
    if (!Number.isInteger(parsed.value)) {
      return {
        isCorrect: false,
        message: '¡Atención! En el conjunto ℤ (Enteros), x no puede tener parte decimal ni ser una fracción irreducible con denominador distinto de 1.',
        reason: 'conjunto_invalido',
      };
    }
  }

  // Compare numerical values with high precision tolerance
  const diff = Math.abs(parsed.value - problem.solutionNumeric);
  if (diff < 0.000001) {
    return {
      isCorrect: true,
      message: `¡Excelente trabajo! La solución ${problem.solutionFormatted} es correcta y satisface rigurosamente la ecuación.`,
    };
  }

  // Check common mistakes
  // 1. Sign inverted
  if (Math.abs(parsed.value + problem.solutionNumeric) < 0.000001) {
    return {
      isCorrect: false,
      message: '¡Cerca! Obtuviste el valor absoluto correcto pero con el SIGNO INVERTIDO. Revisa la regla de los signos o el inverso aditivo aplicado.',
      reason: 'error_signo',
    };
  }

  // 2. Inverse fraction
  if (problem.solutionNumeric !== 0 && Math.abs(parsed.value - 1 / problem.solutionNumeric) < 0.000001) {
    return {
      isCorrect: false,
      message: '¡Cuidado! Invertiste la fracción (numerador y denominador al revés). Recuerda que si ax = b, entonces x = b / a.',
      reason: 'fraccion_invertida',
    };
  }

  return {
    isCorrect: false,
    message: 'La respuesta no coincide. Recuerda aplicar la Propiedad Uniforme operando exactamente lo mismo a ambos miembros.',
    reason: 'incorrecto',
  };
}

// Random helper
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generator: LEVEL 1 (ℕ - Natural Numbers)
export function generateNaturalEquation(): EquationProblem {
  const types = ['one_step_add', 'one_step_sub', 'one_step_mul', 'two_step_add', 'two_step_sub'];
  const chosenType = types[randInt(0, types.length - 1)];
  const id = `eq_N_${Date.now()}_${randInt(100, 999)}`;

  if (chosenType === 'one_step_add') {
    // x + a = b  =>  x = b - a (with b > a >= 1 => x >= 1)
    const a = randInt(2, 15);
    const x = randInt(1, 20);
    const b = x + a;

    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        operationDescription: `Restamos ${a} (sumamos su opuesto -${a}) a ambos miembros de la ecuación para aplicar la Propiedad Uniforme de la Igualdad:`,
        uniformPropertyMath: `x + ${a} - ${a} = ${b} - ${a}`,
        resultingEquation: `x = ${x}`,
      },
    ];

    return {
      id,
      level: 'N',
      subType: 'Suma de un paso en ℕ',
      difficulty: 1,
      equationString: `x + ${a} = ${b}`,
      latexEquation: `x + ${a} = ${b}`,
      solutionNumeric: x,
      solutionFormatted: `${x}`,
      hints: [
        `Identifica el número que acompaña a la variable x: está sumando +${a}.`,
        `Para despejar x manteniendo la igualdad, debes restar ${a} en ambos miembros: x + ${a} - ${a} = ${b} - ${a}.`,
        `Realiza la resta del segundo miembro: ${b} - ${a}.`,
      ],
      steps,
      verificationStep: `Comprobación: Sustituimos x = ${x} en la ecuación original: ${x} + ${a} = ${b} \\implies ${b} = ${b} \\; \\checkmark`,
    };
  }

  if (chosenType === 'one_step_sub') {
    // x - a = b => x = b + a (a >= 1, b >= 1 => x >= 2 in N)
    const a = randInt(3, 18);
    const b = randInt(2, 20);
    const x = b + a;

    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        operationDescription: `Sumamos ${a} a ambos miembros de la ecuación para aislar la incógnita x mediante la Propiedad Uniforme:`,
        uniformPropertyMath: `x - ${a} + ${a} = ${b} + ${a}`,
        resultingEquation: `x = ${x}`,
      },
    ];

    return {
      id,
      level: 'N',
      subType: 'Resta de un paso en ℕ',
      difficulty: 1,
      equationString: `x - ${a} = ${b}`,
      latexEquation: `x - ${a} = ${b}`,
      solutionNumeric: x,
      solutionFormatted: `${x}`,
      hints: [
        `A la incógnita x se le está restando ${a}.`,
        `Aplica la operación inversa: suma ${a} a ambos miembros de la igualdad.`,
        `Calcula el valor resultante: ${b} + ${a}.`,
      ],
      steps,
      verificationStep: `Comprobación: Sustituimos x = ${x} en la ecuación: ${x} - ${a} = ${b} \\implies ${b} = ${b} \\; \\checkmark`,
    };
  }

  if (chosenType === 'one_step_mul') {
    // ax = b => x = b / a (a >= 2, x >= 1 in N)
    const a = randInt(2, 9);
    const x = randInt(2, 12);
    const b = a * x;

    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        operationDescription: `Multiplicamos por el inverso multiplicativo de ${a} (es decir, dividimos entre ${a}) a ambos miembros:`,
        uniformPropertyMath: `\\frac{${a}x}{${a}} = \\frac{${b}}{${a}}`,
        resultingEquation: `x = ${x}`,
      },
    ];

    return {
      id,
      level: 'N',
      subType: 'Multiplicación en ℕ',
      difficulty: 1,
      equationString: `${a}x = ${b}`,
      latexEquation: `${a}x = ${b}`,
      solutionNumeric: x,
      solutionFormatted: `${x}`,
      hints: [
        `El coeficiente ${a} está multiplicando a la variable x.`,
        `Para despejar x con rigor, divide ambos miembros de la ecuación entre ${a}.`,
        `Realiza la división exacta: ${b} ÷ ${a}.`,
      ],
      steps,
      verificationStep: `Comprobación: ${a} \\cdot (${x}) = ${b} \\implies ${b} = ${b} \\; \\checkmark`,
    };
  }

  if (chosenType === 'two_step_add') {
    // ax + b = c  => ax = c - b => x = (c-b)/a (a >= 2, x >= 1, b >= 1)
    const a = randInt(2, 6);
    const x = randInt(1, 10);
    const b = randInt(2, 15);
    const c = a * x + b;

    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        operationDescription: `Restamos ${b} a ambos miembros de la igualdad para aislar el término con la incógnita (${a}x):`,
        uniformPropertyMath: `${a}x + ${b} - ${b} = ${c} - ${b}`,
        resultingEquation: `${a}x = ${c - b}`,
      },
      {
        stepNumber: 2,
        operationDescription: `Dividimos ambos miembros de la ecuación entre ${a} (multiplicamos por 1/${a}):`,
        uniformPropertyMath: `\\frac{${a}x}{${a}} = \\frac{${c - b}}{${a}}`,
        resultingEquation: `x = ${x}`,
      },
    ];

    return {
      id,
      level: 'N',
      subType: 'Ecuación de dos pasos en ℕ',
      difficulty: 2,
      equationString: `${a}x + ${b} = ${c}`,
      latexEquation: `${a}x + ${b} = ${c}`,
      solutionNumeric: x,
      solutionFormatted: `${x}`,
      hints: [
        `Primero deshazte del término independiente +${b} restándolo en ambos miembros.`,
        `Esto te dejará: ${a}x = ${c - b}.`,
        `Ahora divide ambos miembros entre el coeficiente ${a} para hallar x.`,
      ],
      steps,
      verificationStep: `Comprobación: ${a}(${x}) + ${b} = ${a * x} + ${b} = ${c} \\; \\checkmark`,
    };
  }

  // two_step_sub: ax - b = c => ax = c + b => x = (c+b)/a
  const a = randInt(2, 5);
  const x = randInt(2, 10);
  const b = randInt(3, 14);
  const c = a * x - b;

  const steps: StepExplanation[] = [
    {
      stepNumber: 1,
      operationDescription: `Sumamos ${b} a ambos miembros de la ecuación para despejar el término ${a}x:`,
      uniformPropertyMath: `${a}x - ${b} + ${b} = ${c} + ${b}`,
      resultingEquation: `${a}x = ${c + b}`,
    },
    {
      stepNumber: 2,
      operationDescription: `Dividimos ambos miembros entre ${a}:`,
      uniformPropertyMath: `\\frac{${a}x}{${a}} = \\frac{${c + b}}{${a}}`,
      resultingEquation: `x = ${x}`,
    },
  ];

  return {
    id,
    level: 'N',
    subType: 'Ecuación combinada en ℕ',
    difficulty: 2,
    equationString: `${a}x - ${b} = ${c}`,
    latexEquation: `${a}x - ${b} = ${c}`,
    solutionNumeric: x,
    solutionFormatted: `${x}`,
    hints: [
      `Suma ${b} a ambos lados de la igualdad para cancelar el -${b}.`,
      `Obtienes ${a}x = ${c + b}.`,
      `Divide ${c + b} entre ${a} para obtener el valor natural de x.`,
    ],
    steps,
    verificationStep: `Comprobación: ${a}(${x}) - ${b} = ${a * x} - ${b} = ${c} \\; \\checkmark`,
  };
}

// Generator: LEVEL 2 (ℤ - Integers)
export function generateIntegerEquation(): EquationProblem {
  const types = ['both_sides', 'parentheses', 'negative_coeff', 'signs_mixed'];
  const chosenType = types[randInt(0, types.length - 1)];
  const id = `eq_Z_${Date.now()}_${randInt(100, 999)}`;

  if (chosenType === 'both_sides') {
    // ax + b = cx + d => (a - c)x = d - b => x = (d - b) / (a - c)
    let a = randInt(-6, 8);
    let c = randInt(-6, 8);
    while (a === c || a === 0 || c === 0) {
      c = randInt(-6, 8);
    }
    const x = randInt(-12, 12);
    const b = randInt(-15, 15);
    const d = (a - c) * x + b;

    const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    const dSign = d >= 0 ? `+ ${d}` : `- ${Math.abs(d)}`;
    const latex = `${a}x ${bSign} = ${c}x ${dSign}`;

    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        operationDescription: `Restamos (${c}x) a ambos miembros para agrupar las variables en el primer miembro:`,
        uniformPropertyMath: `${a}x ${bSign} - (${c}x) = ${c}x ${dSign} - (${c}x)`,
        resultingEquation: `${a - c}x ${bSign} = ${d}`,
      },
      {
        stepNumber: 2,
        operationDescription: `Sumamos el inverso aditivo de ${b} (${-b >= 0 ? `+${-b}` : `${-b}`}) a ambos miembros:`,
        uniformPropertyMath: `${a - c}x ${bSign} ${-b >= 0 ? `+ ${-b}` : `- ${Math.abs(-b)}`} = ${d} ${-b >= 0 ? `+ ${-b}` : `- ${Math.abs(-b)}`}`,
        resultingEquation: `${a - c}x = ${d - b}`,
      },
      {
        stepNumber: 3,
        operationDescription: `Dividimos ambos miembros entre el coeficiente (${a - c}):`,
        uniformPropertyMath: `\\frac{${a - c}x}{${a - c}} = \\frac{${d - b}}{${a - c}}`,
        resultingEquation: `x = ${x}`,
      },
    ];

    return {
      id,
      level: 'Z',
      subType: 'Términos en ambos miembros en ℤ',
      difficulty: 2,
      equationString: `${a}x ${b >= 0 ? '+' : ''}${b} = ${c}x ${d >= 0 ? '+' : ''}${d}`,
      latexEquation: latex,
      solutionNumeric: x,
      solutionFormatted: `${x}`,
      hints: [
        `Agrupa los términos con incógnita x en un miembro y los números constantes en el otro.`,
        `Para eliminar ${c}x del segundo miembro, réstale ${c}x a ambos lados.`,
        `Recuerda aplicar con cuidado la regla de signos: si divides entre un número negativo, el signo cambia.`,
      ],
      steps,
      verificationStep: `Comprobación: ${a}(${x}) ${bSign} = ${a * x + b} \\quad \\text{y} \\quad ${c}(${x}) ${dSign} = ${c * x + d} \\implies ${a * x + b} = ${c * x + d} \\; \\checkmark`,
    };
  }

  if (chosenType === 'parentheses') {
    // a(x + b) = c => ax + ab = c => ax = c - ab => x = (c - ab)/a
    const a = randInt(-4, 5) || 2;
    const b = randInt(-8, 8);
    const x = randInt(-10, 10);
    const c = a * (x + b);

    const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    const latex = `${a}(x ${bSign}) = ${c}`;

    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        operationDescription: `Aplicamos la propiedad distributiva: ${a} · x + ${a} · (${b}) = ${c}:`,
        uniformPropertyMath: `${a}x ${a * b >= 0 ? `+ ${a * b}` : `- ${Math.abs(a * b)}`} = ${c}`,
        resultingEquation: `${a}x ${a * b >= 0 ? `+ ${a * b}` : `- ${Math.abs(a * b)}`} = ${c}`,
      },
      {
        stepNumber: 2,
        operationDescription: `Restamos (${a * b}) a ambos miembros para aislar el término con variable:`,
        uniformPropertyMath: `${a}x = ${c} - (${a * b})`,
        resultingEquation: `${a}x = ${c - a * b}`,
      },
      {
        stepNumber: 3,
        operationDescription: `Dividimos ambos miembros entre ${a}:`,
        uniformPropertyMath: `\\frac{${a}x}{${a}} = \\frac{${c - a * b}}{${a}}`,
        resultingEquation: `x = ${x}`,
      },
    ];

    return {
      id,
      level: 'Z',
      subType: 'Ecuación con Paréntesis en ℤ',
      difficulty: 2,
      equationString: `${a}(x ${b >= 0 ? '+' : ''}${b}) = ${c}`,
      latexEquation: latex,
      solutionNumeric: x,
      solutionFormatted: `${x}`,
      hints: [
        `Primero elimina el paréntesis multiplicando ${a} por cada término interior: ${a} · x y ${a} · (${b}).`,
        `Te queda ${a}x ${a * b >= 0 ? `+ ${a * b}` : `- ${Math.abs(a * b)}`} = ${c}.`,
        `Despeja x operando el inverso a ambos lados con atención a los signos.`,
      ],
      steps,
      verificationStep: `Comprobación: ${a}(${x} ${bSign}) = ${a}(${x + b}) = ${c} \\; \\checkmark`,
    };
  }

  // negative_coeff / signs_mixed: -ax + b = c
  const a = randInt(2, 6);
  const b = randInt(-15, 15);
  const x = randInt(-10, 10);
  const c = -a * x + b;

  const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
  const latex = `-${a}x ${bSign} = ${c}`;

  const steps: StepExplanation[] = [
    {
      stepNumber: 1,
      operationDescription: `Restamos ${b} a ambos miembros de la ecuación:`,
      uniformPropertyMath: `-${a}x ${bSign} - (${b}) = ${c} - (${b})`,
      resultingEquation: `-${a}x = ${c - b}`,
    },
    {
      stepNumber: 2,
      operationDescription: `Dividimos ambos miembros entre (-${a}). ¡Atención al cambio de signo por la ley de signos!`,
      uniformPropertyMath: `\\frac{-${a}x}{-${a}} = \\frac{${c - b}}{-${a}}`,
      resultingEquation: `x = ${x}`,
    },
  ];

  return {
    id,
    level: 'Z',
    subType: 'Coeficiente Negativo y Signos en ℤ',
    difficulty: 2,
    equationString: `-${a}x ${b >= 0 ? '+' : ''}${b} = ${c}`,
    latexEquation: latex,
    solutionNumeric: x,
    solutionFormatted: `${x}`,
    hints: [
      `Primero aísla el término -${a}x operando el término constante en ambos lados.`,
      `Obtienes -${a}x = ${c - b}.`,
      `Al dividir entre un número negativo (-${a}), recuerda: positivo / negativo = negativo, y negativo / negativo = positivo.`,
    ],
    steps,
    verificationStep: `Comprobación: -${a}(${x}) ${bSign} = ${-a * x + b} = ${c} \\; \\checkmark`,
  };
}

// Generator: LEVEL 3 (ℚ - Rational Numbers)
export function generateRationalEquation(): EquationProblem {
  const types = ['fraction_coeff', 'denom_common', 'binomial_fraction'];
  const chosenType = types[randInt(0, types.length - 1)];
  const id = `eq_Q_${Date.now()}_${randInt(100, 999)}`;

  if (chosenType === 'fraction_coeff') {
    // (a/b)x + c/d = e/f  => simplified fractions
    const b = randInt(2, 5);
    const a = randInt(1, 4);
    const numX = randInt(-7, 7) || 3;
    const denX = randInt(2, 5);
    const xFrac = simplifyFraction(numX, denX);

    // Let's create an equation: (a/b)x + c = rhs
    const c = randInt(-4, 5) || 1;
    // rhs = (a/b)*(xNum/xDen) + c = (a * xNum + b * xDen * c) / (b * xDen)
    const rhsNum = a * xFrac.num + b * xFrac.den * c;
    const rhsDen = b * xFrac.den;
    const rhsFrac = simplifyFraction(rhsNum, rhsDen);

    const aOverB = simplifyFraction(a, b);
    const cSign = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    const latex = `${aOverB.latex}x ${cSign} = ${rhsFrac.latex}`;

    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        operationDescription: `Restamos (${c}) a ambos miembros de la ecuación:`,
        uniformPropertyMath: `${aOverB.latex}x = ${rhsFrac.latex} - (${c})`,
        resultingEquation: `${aOverB.latex}x = ${simplifyFraction(rhsNum - c * rhsDen, rhsDen).latex}`,
      },
      {
        stepNumber: 2,
        operationDescription: `Multiplicamos ambos miembros por el inverso de ${aOverB.latex} (es decir, por ${b}/${a}):`,
        uniformPropertyMath: `x = ${simplifyFraction(rhsNum - c * rhsDen, rhsDen).latex} \\cdot \\frac{${b}}{${a}}`,
        resultingEquation: `x = ${xFrac.latex}`,
      },
    ];

    return {
      id,
      level: 'Q',
      subType: 'Coeficientes fraccionarios en ℚ',
      difficulty: 3,
      equationString: `${a}/${b}x ${c >= 0 ? '+' : ''}${c} = ${rhsFrac.formatted}`,
      latexEquation: latex,
      solutionNumeric: xFrac.num / xFrac.den,
      solutionFormatted: xFrac.formatted,
      solutionFraction: { num: xFrac.num, den: xFrac.den },
      hints: [
        `Resta ${c} a ambos miembros operando con el denominador común de ${rhsFrac.formatted}.`,
        `Para despejar x, multiplica el resultado por la fracción inversa: ${b}/${a}.`,
        `Simplifica la fracción final a su forma irreducible dividiendo entre el m.c.d.`,
      ],
      steps,
      verificationStep: `Comprobación: Sustituyendo x = ${xFrac.latex}: ${aOverB.latex}\\left(${xFrac.latex}\\right) ${cSign} = ${rhsFrac.latex} \\; \\checkmark`,
    };
  }

  if (chosenType === 'denom_common') {
    // x / a + b / c = d
    const a = randInt(2, 6);
    const c = randInt(2, 5);
    const b = randInt(1, 4);
    const d = randInt(1, 5);

    // x/a = d - b/c = (d*c - b)/c  => x = a*(d*c - b)/c
    const solNum = a * (d * c - b);
    const solDen = c;
    const solFrac = simplifyFraction(solNum, solDen);
    const bOverC = simplifyFraction(b, c);

    const latex = `\\frac{x}{${a}} + ${bOverC.latex} = ${d}`;
    const m = lcm(a, c);

    const steps: StepExplanation[] = [
      {
        stepNumber: 1,
        operationDescription: `Multiplicamos toda la ecuación por el mínimo común múltiplo (m.c.m. = ${m}) de los denominadores para eliminar fracciones:`,
        uniformPropertyMath: `${m} \\cdot \\left(\\frac{x}{${a}} + ${bOverC.latex}\\right) = ${m} \\cdot ${d}`,
        resultingEquation: `${m / a}x + ${(m / c) * b} = ${m * d}`,
      },
      {
        stepNumber: 2,
        operationDescription: `Restamos ${(m / c) * b} a ambos miembros:`,
        uniformPropertyMath: `${m / a}x = ${m * d} - ${(m / c) * b}`,
        resultingEquation: `${m / a}x = ${m * d - (m / c) * b}`,
      },
      {
        stepNumber: 3,
        operationDescription: `Dividimos entre ${m / a} y simplificamos la fracción resultante:`,
        uniformPropertyMath: `x = \\frac{${m * d - (m / c) * b}}{${m / a}}`,
        resultingEquation: `x = ${solFrac.latex}`,
      },
    ];

    return {
      id,
      level: 'Q',
      subType: 'Denominadores comunes en ℚ',
      difficulty: 3,
      equationString: `x/${a} + ${b}/${c} = ${d}`,
      latexEquation: latex,
      solutionNumeric: solFrac.num / solFrac.den,
      solutionFormatted: solFrac.formatted,
      solutionFraction: { num: solFrac.num, den: solFrac.den },
      hints: [
        `Puedes restar primero la fracción ${bOverC.formatted} del lado derecho o multiplicar ambos miembros por el m.c.m. (${m}).`,
        `Si multiplicas por ${m}, la ecuación se convierte en ${m / a}x + ${(m / c) * b} = ${m * d}.`,
        `Despeja x y expresa tu respuesta como fracción simplificada ${solFrac.formatted}.`,
      ],
      steps,
      verificationStep: `Comprobación: Sustituyendo x = ${solFrac.latex}: \\frac{${solFrac.latex}}{${a}} + ${bOverC.latex} = ${d} \\; \\checkmark`,
    };
  }

  // binomial_fraction: (ax + b)/c = d/e
  const c = randInt(2, 5);
  const e = randInt(2, 4);
  const a = randInt(2, 4);
  const b = randInt(-5, 5) || 1;
  const numX = randInt(-5, 6) || 2;
  const denX = randInt(1, 3);
  const xFrac = simplifyFraction(numX, denX);

  // (a * xFrac + b) / c = d / e  => d/e = (a*xNum/xDen + b) / c = (a*xNum + b*xDen) / (c * xDen)
  const dNum = a * xFrac.num + b * xFrac.den;
  const dDen = c * xFrac.den;
  const dFrac = simplifyFraction(dNum, dDen);

  const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
  const latex = `\\frac{${a}x ${bSign}}{${c}} = ${dFrac.latex}`;

  const steps: StepExplanation[] = [
    {
      stepNumber: 1,
      operationDescription: `Multiplicamos ambos miembros por el denominador ${c} para eliminar el cociente:`,
      uniformPropertyMath: `${c} \\cdot \\left(\\frac{${a}x ${bSign}}{${c}}\\right) = ${c} \\cdot \\left(${dFrac.latex}\\right)`,
      resultingEquation: `${a}x ${bSign} = ${simplifyFraction(dFrac.num * c, dFrac.den).latex}`,
    },
    {
      stepNumber: 2,
      operationDescription: `Sumamos el inverso aditivo de ${b} a ambos miembros:`,
      uniformPropertyMath: `${a}x = ${simplifyFraction(dFrac.num * c, dFrac.den).latex} - (${b})`,
      resultingEquation: `${a}x = ${simplifyFraction(dFrac.num * c - b * dFrac.den, dFrac.den).latex}`,
    },
    {
      stepNumber: 3,
      operationDescription: `Dividimos entre ${a} y simplificamos a fracción irreducible:`,
      uniformPropertyMath: `x = ${xFrac.latex}`,
      resultingEquation: `x = ${xFrac.latex}`,
    },
  ];

  return {
    id,
    level: 'Q',
    subType: 'Expresión Racional Combinada',
    difficulty: 3,
    equationString: `(${a}x ${b >= 0 ? '+' : ''}${b})/${c} = ${dFrac.formatted}`,
    latexEquation: latex,
    solutionNumeric: xFrac.num / xFrac.den,
    solutionFormatted: xFrac.formatted,
    solutionFraction: { num: xFrac.num, den: xFrac.den },
    hints: [
      `Multiplica ambos miembros por ${c} para quitar el denominador del primer miembro.`,
      `Te quedará ${a}x ${bSign} = ${simplifyFraction(dFrac.num * c, dFrac.den).formatted}.`,
      `Resta ${b} y luego divide entre ${a}, simplificando la fracción final.`,
    ],
    steps,
    verificationStep: `Comprobación: Sustituyendo x = ${xFrac.latex}: \\frac{${a}(${xFrac.latex}) ${bSign}}{${c}} = ${dFrac.latex} \\; \\checkmark`,
  };
}

export function generateEquationByLevel(level: NumericSet): EquationProblem {
  switch (level) {
    case 'N':
      return generateNaturalEquation();
    case 'Z':
      return generateIntegerEquation();
    case 'Q':
      return generateRationalEquation();
    default:
      return generateNaturalEquation();
  }
}
