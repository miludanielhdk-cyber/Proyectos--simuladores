// ============================================================
//  Buscador de fragmentos (BM25 simple, sin dependencias).
//  Elige los fragmentos de la base de conocimiento más parecidos
//  a la consulta, para enviar a Gemini solo lo necesario.
// ============================================================
import BASE from "./base_conocimiento.mjs";

const VACIAS = new Set(("que como para por con una uno unos unas los las del al de la el en y o u a se su sus es son " +
  "tengo tiene tener puedo puede hay cual cuales cuando donde quien esta este esto estos estas ese esa eso " +
  "me mi mis te tu tus le les lo nos hola gracias porfa favor necesito quiero saber sobre algo muy mas pero " +
  "sin hace hacer ser fue era").split(" "));

const ROMANOS = new Set(["ii", "iii", "iv", "vi", "vii"]);

// Sinónimos frecuentes en las consultas (se agregan a la consulta antes de buscar).
const SINONIMOS = {
  faltas: "asistencia inasistencias regularidad", falte: "asistencia inasistencias", faltar: "asistencia inasistencias",
  correlativas: "correlatividades regular aprobada", correlativa: "correlatividades regular aprobada",
  rendir: "examen final acreditar aprobar", final: "examen acreditar", finales: "examen acreditar",
  mesa: "examen turno", mesas: "examen turno", promocionar: "promocion acreditacion", promociona: "promocion acreditacion",
  materia: "unidad curricular", materias: "unidades curriculares", libre: "examen libre", recursar: "regularidad",
  horario: "horarios", inscribirme: "inscripcion", anotarme: "inscripcion",
};

export function normalizar(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]+/g, " ").trim();
}

// Palabras normalizadas, sin vacías, recortadas a 7 letras (raíz aproximada).
export function tokens(texto) {
  return normalizar(texto)
    .split(" ")
    .filter((t) => (t.length >= 3 || ROMANOS.has(t) || /^\d$/.test(t)) && !VACIAS.has(t))
    .map((t) => t.slice(0, 7));
}

function expandir(consulta) {
  const extra = normalizar(consulta).split(" ").map((t) => SINONIMOS[t] || "").join(" ");
  return consulta + " " + extra;
}

// ---- Índice (se arma una sola vez por instancia de la función) ----
const DOCS = BASE.map((f) => {
  const lista = tokens(f.texto + " " + (f.etiquetas || "") + " " + f.fuente);
  const tf = new Map();
  for (const t of lista) tf.set(t, (tf.get(t) || 0) + 1);
  // nombre de la unidad curricular («...») en los fragmentos de correlatividades
  const m = /«([^»]+)»/.exec(f.texto);
  const nombre = m && f.fuente.startsWith("Régimen de correlatividades") ? normalizar(m[1]) : null;
  return { f, tf, largo: lista.length, nombre };
});
const DF = new Map();
for (const d of DOCS) for (const t of d.tf.keys()) DF.set(t, (DF.get(t) || 0) + 1);
const N = DOCS.length;
const PROM = DOCS.reduce((s, d) => s + d.largo, 0) / N;

/**
 * Devuelve los fragmentos más relevantes.
 * @param {string} inst  "718" | "cup" | "iset"
 * @param {string} consulta
 * @param {{tipo?: "cuadernillo"|"doc", k?: number, maxCaracteres?: number}} op
 */
export function buscar(inst, consulta, { tipo = "doc", k = 8, maxCaracteres = 12000 } = {}) {
  const q = tokens(expandir(consulta));
  if (!q.length) return [];
  const qNorm = " " + normalizar(consulta) + " ";
  const k1 = 1.4, b = 0.75;
  const puntajes = [];
  for (const d of DOCS) {
    if (d.f.inst !== inst) continue;
    if ((d.f.tipo || "doc") !== tipo) continue;
    let s = 0;
    for (const t of q) {
      const n = d.tf.get(t);
      if (!n) continue;
      const idf = Math.log(1 + (N - DF.get(t) + 0.5) / (DF.get(t) + 0.5));
      s += idf * (n * (k1 + 1)) / (n + k1 * (1 - b + b * d.largo / PROM));
    }
    // Bonus: la consulta nombra exactamente la unidad curricular del fragmento
    if (s > 0 && d.nombre && qNorm.includes(" " + d.nombre + " ")) s *= 3;
    if (s > 0) puntajes.push([s, d.f]);
  }
  puntajes.sort((a, c) => c[0] - a[0]);
  const elegidos = [];
  let total = 0;
  for (const [, f] of puntajes) {
    if (elegidos.length >= k) break;
    if (total + f.texto.length > maxCaracteres) continue;
    elegidos.push(f);
    total += f.texto.length;
  }
  return elegidos;
}
