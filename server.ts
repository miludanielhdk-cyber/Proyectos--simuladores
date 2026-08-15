import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini instance
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// System Instruction for MathMaster AI
const SYSTEM_INSTRUCTION = `Eres "MathMaster AI", un tutor de matemáticas empático, riguroso y socrático para estudiantes de secundaria (12 a 17 años).
Tu especialidad es la resolución de ecuaciones algebraicas en tres conjuntos numéricos:
1. Números Naturales (N): x in {1, 2, 3, ...} (x > 0, positivos enteros).
2. Números Enteros (Z): x in {..., -2, -1, 0, 1, 2, ...} (incluye negativos y 0, no fracciones).
3. Números Racionales (Q): x in Q (fracciones irreducibles a/b con b != 0, decimales exactos o periódicos).

REGLAS PEDAGÓGICAS Y DE RIGOR MATEMÁTICO:
- Enfoque Socrático: Nunca des la respuesta final directamente si el estudiante pide ayuda o se equivoca. Guíalo con preguntas reflexivas y pasos intermedios.
- Propiedad Uniforme de la Igualdad: Basa las explicaciones en operar lo mismo a ambos miembros de la ecuación (ej. "sumamos el opuesto a ambos lados", "multiplicamos por el inverso multiplicativo a ambos miembros") en vez del atajo informal "pasa sumando".
- Tono: Motivador, claro, en español neutro accesible para adolescentes, con formato Markdown limpio y emojis educativos.`;

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", tutor: "MathMaster AI active" });
});

// Socratic Hint Endpoint
app.post("/api/tutor/hint", async (req, res) => {
  try {
    const { equation, level, levelName, solution, currentStep, hintCount = 1 } = req.body;

    const ai = getAiClient();
    const prompt = `El estudiante está en el nivel ${levelName} (${level}) resolviendo la ecuación:
Ecuación: ${equation}
Solución matemática correcta (para tu referencia interna, NO la reveles): x = ${solution}
Pistas ya dadas previamente: ${hintCount - 1}

Genera la Pista #${hintCount} (Pista Socrática Progresiva).
- Si es la pista 1: Pregúntale cuál es el término independiente o qué operación estorba a la variable 'x'.
- Si es la pista 2: Indícale qué operación aplicar a ambos miembros usando la Propiedad Uniforme de la Igualdad.
- Si es la pista 3+: Guíalo al último paso de simplificación sin decir el número final directamente.

Sé breve (máximo 3-4 líneas), claro y amigable.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({ hint: response.text || "Intenta aislar la variable 'x' aplicando la misma operación a ambos lados." });
  } catch (error) {
    console.error("Error generating hint:", error);
    // Fallback deterministic helpful hint
    res.json({
      hint: "💡 Observa la ecuación: ¿Qué término está sumando o restando a la incógnita? Recuerda que para mantener el equilibrio, debes aplicar la operación inversa en ambos miembros.",
    });
  }
});

// Error feedback endpoint
app.post("/api/tutor/evaluate-mistake", async (req, res) => {
  try {
    const { equation, level, levelName, studentAnswer, correctAnswer } = req.body;
    const ai = getAiClient();

    const prompt = `Un estudiante de secundaria intentó resolver la ecuación en el conjunto ${levelName} (${level}):
Ecuación: ${equation}
Respuesta del estudiante: "${studentAnswer}"
Solución correcta: "${correctAnswer}"

Diagnostica el posible error del estudiante (por ejemplo: error de signo, no multiplicó ambos lados, olvidó cambiar el signo al restar, error al sumar fracciones, no simplificó).
Brinda una retroalimentación constructiva, socrática y motivadora de 2 o 3 oraciones, explicando dónde pudo ocurrir la confusión e invitándolo a reintentar.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    res.json({ feedback: response.text });
  } catch (error) {
    console.error("Error evaluating mistake:", error);
    res.json({
      feedback: `¡Buen intento! Revisa con cuidado las operaciones aplicadas a ambos miembros. Recuerda verificar el signo y comprobar si sustituyendo tu valor en la ecuación original se cumple la igualdad.`,
    });
  }
});

// Daily Real-World Challenge Endpoint
app.post("/api/tutor/daily-challenge", async (req, res) => {
  try {
    const { level = "N" } = req.body;
    const ai = getAiClient();

    const setDescriptions: Record<string, string> = {
      N: "Números Naturales N (solución x entero positivo > 0, ej. cantidades de objetos, edades, boletos)",
      Z: "Números Enteros Z (solución x entero positivo, negativo o cero, ej. temperaturas bajo cero, balances bancarios, pisos de elevador, variación de altitud)",
      Q: "Números Racionales Q (solución x fraccionario o decimal exacto/periódico, ej. recetas, litros de combustible, proporciones, velocidad y tiempo)",
    };

    const prompt = `Crea un "Reto Matemático Contextualizado en la Vida Real" para secundaria en el conjunto ${setDescriptions[level] || setDescriptions.N}.
Devuelve un objeto JSON con los siguientes campos exactos:
{
  "title": "Título llamativo del problema",
  "story": "Historia o contexto cotidiano breve y divertido (2-3 oraciones)",
  "question": "La pregunta clara que pide encontrar el valor desconocido x",
  "equation": "La ecuación algebraica que modela el problema (ej: 2x + 5 = 25)",
  "solution": "El valor numérico de x (ej: 10 o 3/4)",
  "solutionExplanation": "Breve explicación de 2 pasos aplicando la propiedad uniforme",
  "unit": "Unidad de medida (ej: pesos, grados Celsius, horas, metros, manzanas)"
}
Asegúrate con 100% de rigor que la solución x pertenece estrictamente a ${level}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error) {
    console.error("Error generating daily challenge:", error);
    // Deterministic fallback challenge based on level
    const fallbacks: Record<string, any> = {
      N: {
        title: "El misterio de los videojuegos",
        story: "Lucas compró 3 videojuegos idénticos y pagó una suscripción de $15. El total gastado fue de $75.",
        question: "¿Cuánto costó cada videojuego?",
        equation: "3x + 15 = 75",
        solution: "20",
        solutionExplanation: "Restamos 15 a ambos miembros: 3x = 60. Dividimos ambos miembros entre 3: x = 20.",
        unit: "dólares",
      },
      Z: {
        title: "El submarino en el Ártico",
        story: "Un submarino parte a cierta profundidad x metros bajo el nivel del mar. Tras descender 45 metros más, se encuentra a -120 metros.",
        question: "¿A qué profundidad inicial se encontraba el submarino?",
        equation: "x - 45 = -120",
        solution: "-75",
        solutionExplanation: "Sumamos 45 a ambos miembros: x = -120 + 45 = -75.",
        unit: "metros",
      },
      Q: {
        title: "La receta de la abuela",
        story: "Para preparar 4 pasteles iguales, María utilizó cierta cantidad de harina más 1/2 taza extra, sumando un total de 7/2 tazas de harina.",
        question: "¿Cuántas tazas de harina lleva cada pastel individual?",
        equation: "4x + 1/2 = 7/2",
        solution: "3/4",
        solutionExplanation: "Restamos 1/2 a ambos lados: 4x = 6/2 = 3. Dividimos entre 4: x = 3/4.",
        unit: "tazas",
      },
    };
    res.json(fallbacks[req.body.level] || fallbacks.N);
  }
});

// Socratic Chat with Tutor
app.post("/api/tutor/chat", async (req, res) => {
  try {
    const { message, history = [], currentContext } = req.body;
    const ai = getAiClient();

    const formattedHistory = (history || []).map((h: any) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    }));

    const chat = ai.chats.create({
      model: "gemini-3.7-flash",
      history: formattedHistory,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION}
Contexto actual del estudiante en la app:
- Nivel activo: ${currentContext?.level || "N"} (${currentContext?.levelName || "Naturales"})
- Ecuación actual: ${currentContext?.equation || "Ninguna seleccionada"}
- Puntos acumulados: ${currentContext?.points || 0}
- Racha de aciertos: ${currentContext?.streak || 0}

Instrucciones para tus respuestas:
1. Sé cálido, entusiasta y motivador.
2. Si el estudiante escribe "ayuda" o pide pistas, bríndale una pregunta orientadora o paso socrático.
3. Si el estudiante te hace preguntas conceptuales (ej: "¿Por qué en Z los negativos al multiplicar dan positivo?"), explícaselo con ejemplos visuales o de la vida real intuitivos.
4. Mantén tus respuestas concisas y bien estructuradas en Markdown.`,
      },
    });

    const response = await chat.sendMessage({ message: message });
    res.json({ reply: response.text });
  } catch (error) {
    console.error("Error in tutor chat:", error);
    res.json({
      reply: "¡Hola! Estoy aquí para acompañarte paso a paso. Recuerda que cualquier duda que tengas sobre la ecuación o los números naturales, enteros o racionales, puedes preguntarme con total confianza.",
    });
  }
});

// Step by Step Rigorous Uniform Property Explanation
app.post("/api/tutor/explain-steps", async (req, res) => {
  try {
    const { equation, level, solution } = req.body;
    const ai = getAiClient();

    const prompt = `Desarrolla una explicación paso a paso con máximo rigor pedagógico para resolver la ecuación:
Ecuación: ${equation}
Conjunto numérico: ${level}
Solución: ${solution}

REQUISITO FUNDAMENTAL:
Aplica explícitamente la PROPIEDAD UNIFORME DE LA IGUALDAD en cada paso (menciona qué se suma, resta, multiplica o divide exactamente a ambos miembros de la ecuación).
Explica también el paso de verificación o comprobación final sustituyendo el valor hallado en la ecuación original.
Formatea la respuesta en Markdown con encabezados claros y ecuaciones destacadas.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    res.json({ explanation: response.text });
  } catch (error) {
    console.error("Error generating explanation:", error);
    res.json({
      explanation: `### Paso a Paso Riguroso (Propiedad Uniforme)
1. **Identificación**: Ecuación inicial $${req.body.equation}$.
2. **Propiedad Uniforme**: Operamos el mismo término a ambos miembros para simplificar y aislar la incógnita.
3. **Solución**: $x = ${req.body.solution}$.
4. **Comprobación**: Al sustituir $x$ en la ecuación original se verifica la igualdad.`,
    });
  }
});

// Vite middleware in development vs static serving in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MathMaster AI Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
