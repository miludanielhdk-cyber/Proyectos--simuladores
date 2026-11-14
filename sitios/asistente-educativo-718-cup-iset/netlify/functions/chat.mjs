// ============================================================
//  Función de Netlify: recibe la conversación desde la página,
//  arma las instrucciones según institución / perfil / modo y
//  consulta a Gemini. La clave NUNCA llega al navegador: se lee
//  de la variable de entorno GEMINI_API_KEY configurada en Netlify.
//
//  Variables de entorno (Netlify > Site configuration > Environment variables):
//    GEMINI_API_KEY   (obligatoria) clave de Google AI Studio
//    CODIGO_DOCENTE   (recomendada) código que deben ingresar los docentes
//    GEMINI_MODEL     (opcional)    por defecto: gemini-flash-latest
// ============================================================

import { INSTITUCIONES } from "./conocimiento.mjs";

const MAX_MENSAJES = 20;      // historial máximo que se envía a Gemini
const MAX_CARACTERES = 2000;  // largo máximo de cada mensaje

const MODOS_POR_PERFIL = {
  estudiante: ["tutor", "info"],
  docente: ["tutor", "info", "docente"],
};

// ---------- Utilidades ----------
function responder(status, datos) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// ---------- Instrucciones del asistente ----------
function armarInstrucciones(inst, perfil, modo) {
  const comunes = `
Sos el Asistente Educativo ${inst.conNombre} (${inst.lugar}), nivel ${inst.nivel}.
Respondés en español rioplatense, con trato cordial y respetuoso (voseo), claro y breve.
Estás hablando con ${perfil === "docente" ? "un/a docente de la institución" : "un/a estudiante de la institución"}.

Reglas generales (obligatorias):
- No inventes datos. Si no sabés algo o no tenés la información, decilo con claridad.
- No pidas ni guardes datos personales (nombre completo, DNI, teléfono, dirección, etc.). Si alguien los escribe, indicá amablemente que no hace falta compartirlos.
- Mantenete dentro de tu función: Matemática y temas de la institución${perfil === "docente" ? ", y apoyo a la tarea docente" : ""}. Si te consultan otra cosa, explicá con amabilidad que no es tu función.
- Si un/a estudiante expresa malestar, angustia o una situación de riesgo, respondé con calidez y sugerí hablar cuanto antes con un adulto de confianza, preceptoría o el equipo de orientación de la escuela.
- Formato matemático: escribí las expresiones en LaTeX entre signos $...$ (en línea) o $$...$$ (en bloque). Las fracciones SIEMPRE con \\frac{numerador}{denominador}, nunca como a/b. Usá \\cdot o \\times para multiplicar y \\sqrt{} para raíces.
- Usá listas o pasos numerados cuando ayuden a ordenar; evitá respuestas larguísimas.
`;

  const porModo = {
    tutor:
      perfil === "estudiante"
        ? `
MODO: TUTOR DE MATEMÁTICA para estudiantes.
- Guiá el razonamiento paso a paso con preguntas y pistas. NO des directamente la respuesta final de un ejercicio: primero orientá, pedí que el/la estudiante intente el paso siguiente y revisá lo que propone.
- Si después de intentarlo sigue trabado/a, mostrá la resolución de un ejercicio SIMILAR (con otros números) para que luego resuelva el suyo.
- Cuidá la precisión: signos, jerarquía de operaciones, exponentes, radicales y fracciones. Verificá cada cuenta antes de responder.
- Adecuá el lenguaje y la dificultad al nivel ${inst.nivel}.
- Felicitá los avances con naturalidad y animá a seguir.
- Si te piden que resuelvas una evaluación o examen en curso, no lo hagas: ofrecé practicar con ejercicios parecidos.`
        : `
MODO: TUTOR DE MATEMÁTICA (consulta docente).
- Podés mostrar resoluciones completas y comentadas, señalar errores frecuentes de estudiantes y proponer variantes del ejercicio.
- Verificá rigurosamente cada resultado (signos, jerarquía de operaciones, exponentes, radicales, fracciones).`,

    info: `
MODO: INFORMACIÓN INSTITUCIONAL.
- Respondé ÚNICAMENTE con la información de la sección «INFORMACIÓN OFICIAL CARGADA» que figura abajo. No completes con suposiciones ni con datos de otras instituciones.
- Si la respuesta no está en esa información, decí: «No tengo ese dato cargado. Te recomiendo consultarlo en ${perfil === "docente" ? "Secretaría o con el equipo directivo" : "preceptoría o Secretaría"} de la institución.»
- Cuando uses un dato, mencioná de qué documento o sección proviene si figura.

INFORMACIÓN OFICIAL CARGADA:
${inst.conocimiento.trim()}`,

    docente: `
MODO: ASISTENTE DOCENTE.
- Ayudás a planificar clases y secuencias, redactar consignas claras, armar actividades graduadas, rúbricas, criterios de evaluación y adecuaciones para estudiantes con necesidades específicas.
- Las propuestas deben estar listas para usar: título, propósito, consignas numeradas, espacio sugerido para resolver y, si se pide, clave de corrección aparte.
- Verificá todos los resultados matemáticos antes de entregarlos.
- No inventes normativa, diseños curriculares ni datos institucionales: si hacen falta, indicá que deben consultarse en los documentos oficiales.`,
  };

  return comunes + porModo[modo];
}

// ---------- Manejador principal ----------
export default async (req) => {
  if (req.method !== "POST") {
    return responder(405, { error: "Método no permitido." });
  }

  const clave = process.env.GEMINI_API_KEY;
  if (!clave) {
    return responder(500, {
      error: "El asistente todavía no está configurado (falta la clave de Gemini en Netlify).",
    });
  }

  let datos;
  try {
    datos = await req.json();
  } catch {
    return responder(400, { error: "Solicitud inválida." });
  }

  const { institucion, perfil, modo, codigo, mensajes } = datos || {};

  // --- Validaciones ---
  const inst = INSTITUCIONES[institucion];
  if (!inst) return responder(400, { error: "Institución no válida." });
  if (!MODOS_POR_PERFIL[perfil]) return responder(400, { error: "Perfil no válido." });
  if (!MODOS_POR_PERFIL[perfil].includes(modo)) return responder(400, { error: "Modo no válido para este perfil." });

  if (perfil === "docente") {
    const codigoReal = process.env.CODIGO_DOCENTE;
    if (codigoReal && String(codigo || "").trim() !== codigoReal) {
      return responder(403, { error: "El código docente no es correcto." });
    }
  }

  if (!Array.isArray(mensajes) || mensajes.length === 0) {
    return responder(400, { error: "No llegó ningún mensaje." });
  }

  const historial = mensajes.slice(-MAX_MENSAJES).map((m) => ({
    role: m && m.rol === "asistente" ? "model" : "user",
    parts: [{ text: String((m && m.texto) || "").slice(0, MAX_CARACTERES) }],
  }));

  if (historial[historial.length - 1].role !== "user") {
    return responder(400, { error: "El último mensaje debe ser del usuario." });
  }

  // --- Llamada a Gemini ---
  const modelo = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: armarInstrucciones(inst, perfil, modo) }] },
        contents: historial,
        generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
      }),
    });

    if (r.status === 429) {
      return responder(429, { error: "Se alcanzó el límite de consultas por el momento. Probá de nuevo en unos minutos." });
    }
    if (!r.ok) {
      console.error("Error de Gemini:", r.status, await r.text());
      return responder(502, { error: "No se pudo obtener respuesta del asistente. Probá de nuevo en un rato." });
    }

    const json = await r.json();
    const partes = json?.candidates?.[0]?.content?.parts || [];
    const texto = partes
      .filter((p) => typeof p.text === "string" && !p.thought)
      .map((p) => p.text)
      .join("")
      .trim();

    if (!texto) {
      return responder(200, { respuesta: "No pude generar una respuesta para esa consulta. ¿Podés reformularla?" });
    }
    return responder(200, { respuesta: texto });
  } catch (e) {
    console.error(e);
    return responder(500, { error: "Ocurrió un error de conexión. Probá de nuevo." });
  }
};

export const config = { path: "/api/chat" };
