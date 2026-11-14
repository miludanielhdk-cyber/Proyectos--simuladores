// ============================================================
//  Función de Netlify: recibe la conversación desde la página,
//  busca en la base de conocimiento los fragmentos relevantes,
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
import INSTRUCCIONES from "./instrucciones.mjs";
import { buscar } from "./buscador.mjs";

const MAX_MENSAJES = 20;      // historial máximo que se envía a Gemini
const MAX_CARACTERES = 2000;  // largo máximo de cada mensaje

const MODOS_POR_PERFIL = {
  estudiante: ["tutor", "info"],
  docente: ["tutor", "info", "docente"],
};

function responder(status, datos) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function bloqueFragmentos(titulo, fragmentos) {
  if (!fragmentos.length) return `\n${titulo}:\n(No se encontraron fragmentos relacionados con esta consulta.)\n`;
  return `\n${titulo}:\n` + fragmentos
    .map((f, i) => `--- Fragmento ${i + 1} · Fuente: ${f.fuente} ---\n${f.texto}`)
    .join("\n\n") + "\n--- Fin de los fragmentos ---\n";
}

// ---------- Instrucciones del asistente ----------
function armarInstrucciones(clave, inst, perfil, modo, consulta) {
  const comunes = `
Sos el Asistente Educativo ${inst.conNombre} (${inst.lugar}), nivel ${inst.nivel}.
Respondés SIEMPRE en español rioplatense con voseo («podés», «tenés»), con trato cordial y respetuoso, claro y breve (aunque alguna instrucción de abajo esté escrita con tuteo).
Estás hablando con ${perfil === "docente" ? "un/a docente de la institución" : "un/a estudiante de la institución"}.

Reglas generales (obligatorias):
- No inventes datos. Si no sabés algo o no tenés la información, decilo con claridad.
- No pidas ni guardes datos personales (nombre completo, DNI, teléfono, dirección, etc.). Si alguien los escribe, indicá amablemente que no hace falta compartirlos.
- Si un/a estudiante expresa malestar, angustia o una situación de riesgo, respondé con calidez y sugerí hablar cuanto antes con una persona adulta de confianza, preceptoría o el equipo de orientación.
- Formato matemático: escribí las expresiones en LaTeX entre signos $...$ (en línea) o $$...$$ (en bloque). Las fracciones SIEMPRE con \\frac{numerador}{denominador}, nunca como a/b. Usá \\cdot o \\times para multiplicar y \\sqrt{} para raíces. No uses tablas en formato Markdown con barras verticales: usá listas.
- Usá listas o pasos numerados cuando ayuden; evitá respuestas larguísimas.
`;

  // ----- TUTOR -----
  if (modo === "tutor") {
    let texto = comunes;
    if (perfil === "estudiante" && (clave === "cup" || clave === "718")) {
      texto += `\nINSTRUCCIONES ESPECÍFICAS DEL TUTOR (definidas por los docentes de la institución):\n${INSTRUCCIONES[clave]}\n`;
    } else if (perfil === "estudiante") {
      texto += `
MODO: TUTOR DE MATEMÁTICA para estudiantes de nivel superior.
- Guiá el razonamiento paso a paso con preguntas y pistas. No des directamente la respuesta final de un ejercicio: primero orientá y revisá lo que propone el/la estudiante.
- Si sigue trabado/a, mostrá la resolución de un ejercicio SIMILAR para que luego resuelva el suyo.
- Cuidá la precisión: signos, jerarquía de operaciones, exponentes, radicales y fracciones. Verificá cada cuenta.
- No resuelvas evaluaciones o exámenes en curso: ofrecé practicar con ejercicios parecidos.\n`;
    } else {
      texto += `
MODO: TUTOR DE ${inst.materias.toUpperCase()} (consulta docente).
- Podés mostrar resoluciones completas y comentadas, señalar errores frecuentes de estudiantes y proponer variantes.
- Verificá rigurosamente cada resultado (signos, jerarquía de operaciones, exponentes, radicales, fracciones).\n`;
    }
    if (clave === "cup" || clave === "718") {
      const frs = buscar(clave, consulta, { tipo: "cuadernillo", k: 3, maxCaracteres: 5000 });
      texto += `
MATERIAL DEL DOCENTE: abajo hay fragmentos de los cuadernillos de Matemática de la institución relacionados con la consulta.
- Usalos como referencia para explicar con el mismo lenguaje, los mismos procedimientos y contextos que se trabajan en clase.
- Si la consulta coincide con una actividad de un cuadernillo, podés mencionar el nombre del cuadernillo, pero NO entregues la resolución completa a un/a estudiante: guiá.
- Son solo fragmentos: no afirmes conocer partes del material que no aparecen acá. Si el/la estudiante menciona una actividad que no está, pedile que copie la consigna.
${bloqueFragmentos("FRAGMENTOS DE CUADERNILLOS", frs)}`;
    }
    return texto;
  }

  // ----- INFORMACIÓN INSTITUCIONAL -----
  if (modo === "info") {
    if (clave === "iset") {
      const frs = buscar("iset", consulta, { tipo: "doc", k: 8, maxCaracteres: 12000 });
      return comunes + `
INSTRUCCIONES DEL ASISTENTE ACADÉMICO (definidas por la institución). No repitas el mensaje de bienvenida: la página ya lo muestra.
${INSTRUCCIONES.iset}

ACLARACIONES SOBRE LA DOCUMENTACIÓN DISPONIBLE:
- Tu «base de conocimiento» son ÚNICAMENTE los fragmentos de abajo, recuperados automáticamente para esta consulta. Si no alcanzan para responder con certeza, usá el mensaje de derivación.
- Los horarios corresponden al cuatrimestre que indica cada encabezado (por ejemplo, «1er cuatrimestre»): mencionalo siempre al informar un horario.
- El Diseño Curricular de Gestión de Energías Renovables es una versión preliminar: aclaralo si lo usás.
- Las correlatividades figuran por carrera y unidad curricular, diferenciando PARA CURSAR (regular / aprobada) y PARA APROBAR. Recordá que lo que rige es el Diseño Curricular de la cohorte del estudiante.
${bloqueFragmentos("DOCUMENTACIÓN OFICIAL RECUPERADA", frs)}`;
    }
    return comunes + `
MODO: INFORMACIÓN INSTITUCIONAL.
- Por ahora NO hay documentación institucional cargada de esta escuela.
- Ante cualquier consulta institucional (horarios, fechas, evaluaciones, normas, docentes, autoridades), respondé: «Todavía no tengo información institucional cargada. Te recomiendo consultarlo en ${perfil === "docente" ? "Secretaría o con el equipo directivo" : "preceptoría, con tu docente o en Secretaría"}.»
- No inventes ningún dato sobre la escuela.\n`;
  }

  // ----- ASISTENTE DOCENTE -----
  let texto = comunes + `
MODO: ASISTENTE DOCENTE.
- Ayudás a planificar clases y secuencias, redactar consignas claras, armar actividades graduadas, rúbricas, criterios de evaluación y adecuaciones para estudiantes con necesidades específicas.
- Las propuestas deben estar listas para usar: título, propósito, consignas numeradas, espacio sugerido para resolver y, si se pide, clave de corrección aparte.
- Verificá todos los resultados matemáticos antes de entregarlos.
- No inventes normativa, diseños curriculares ni datos institucionales: si hacen falta, indicá que deben consultarse en los documentos oficiales.\n`;
  if (clave === "cup" || clave === "718") {
    const frs = buscar(clave, consulta, { tipo: "cuadernillo", k: 3, maxCaracteres: 5000 });
    texto += `\nComo referencia de estilo y contenidos ya trabajados, estos son fragmentos de los cuadernillos de la institución relacionados con la consulta (podés tomarlos como modelo):\n${bloqueFragmentos("FRAGMENTOS DE CUADERNILLOS", frs)}`;
  } else {
    const frs = buscar("iset", consulta, { tipo: "doc", k: 4, maxCaracteres: 6000 });
    texto += `\nSi la consulta involucra planes, contenidos o normativa del ISET, podés apoyarte en estos fragmentos oficiales (citá la fuente):\n${bloqueFragmentos("DOCUMENTACIÓN DEL ISET", frs)}`;
  }
  return texto;
}

// ---------- Manejador principal ----------
export default async (req) => {
  if (req.method !== "POST") return responder(405, { error: "Método no permitido." });

  const clave = process.env.GEMINI_API_KEY;
  if (!clave) {
    return responder(500, { error: "El asistente todavía no está configurado (falta la clave de Gemini en Netlify)." });
  }

  let datos;
  try { datos = await req.json(); } catch { return responder(400, { error: "Solicitud inválida." }); }

  const { institucion, perfil, modo, codigo, mensajes } = datos || {};

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

  if (!Array.isArray(mensajes) || mensajes.length === 0) return responder(400, { error: "No llegó ningún mensaje." });

  const historial = mensajes.slice(-MAX_MENSAJES).map((m) => ({
    role: m && m.rol === "asistente" ? "model" : "user",
    parts: [{ text: String((m && m.texto) || "").slice(0, MAX_CARACTERES) }],
  }));
  if (historial[0].role !== "user") historial.shift();   // Gemini espera que empiece el usuario
  if (!historial.length || historial[historial.length - 1].role !== "user") {
    return responder(400, { error: "El último mensaje debe ser del usuario." });
  }

  // Consulta para la búsqueda: último mensaje (con más peso) + el anterior del usuario
  const delUsuario = historial.filter((h) => h.role === "user").map((h) => h.parts[0].text);
  const ultimo = delUsuario[delUsuario.length - 1];
  const consulta = `${ultimo} ${ultimo} ${delUsuario[delUsuario.length - 2] || ""}`;

  const modelo = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: armarInstrucciones(institucion, inst, perfil, modo, consulta) }] },
        contents: historial,
        generationConfig: { temperature: modo === "info" ? 0.1 : 0.4, maxOutputTokens: 4096 },
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
    const texto = partes.filter((p) => typeof p.text === "string" && !p.thought).map((p) => p.text).join("").trim();

    if (!texto) return responder(200, { respuesta: "No pude generar una respuesta para esa consulta. ¿Podés reformularla?" });
    return responder(200, { respuesta: texto });
  } catch (e) {
    console.error(e);
    return responder(500, { error: "Ocurrió un error de conexión. Probá de nuevo." });
  }
};

export const config = { path: "/api/chat" };
