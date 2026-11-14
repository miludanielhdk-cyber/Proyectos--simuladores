"""
Construye la base de conocimiento del Asistente Educativo (netlify/functions/base_conocimiento.json).

Uso:  python3 herramientas/construir_base.py <carpeta_con_textos>

La carpeta debe contener los textos extraídos de los documentos oficiales (ver FUENTES)
y la subcarpeta cuad/ con los cuadernillos (<archivo>.txt) y cuad/indice.tsv
(archivo<TAB>título del cuadernillo).
Cada fragmento guarda la institución, el nombre del documento y el texto.
"""
import json, re, sys, os, openpyxl
from collections import defaultdict

RAIZ = sys.argv[1]
FUNC = os.path.join(os.path.dirname(__file__), "..", "netlify", "functions", "chat")
SALIDA = os.path.join(FUNC, "base_conocimiento.mjs")

FUENTES = [  # (archivo, institución, nombre del documento, etiquetas extra para la búsqueda)
    ("RAI.txt", "iset", "Régimen Académico Institucional (RAI) del ISET N.º 812", "regimen academico institucional regularidad promocion examen asistencia"),
    ("RAM.txt", "iset", "Régimen Académico Marco (RAM)", "regimen academico marco"),
    ("ROM.txt", "iset", "Reglamento Orgánico Marco de la Educación Superior (ROM)", "reglamento organico marco"),
    ("Calendario.txt", "iset", "Calendario Académico Anual 2026 del ISET N.º 812", "calendario fechas 2026 inscripcion mesas cuatrimestre feriado"),
    ("Horario_TSER.txt", "iset", "Horarios 2026 – Tecnicatura Superior en Gestión de Energías Renovables (TSER)", "horario horarios energias renovables tser"),
    ("Horario_TSL.txt", "iset", "Horarios 2026 – Tecnicatura Superior en Logística (TSL)", "horario horarios logistica tsl"),
    ("Horario_TSMI.txt", "iset", "Horarios 2026 – Tecnicatura Superior en Mantenimiento Industrial (TSMI)", "horario horarios mantenimiento industrial tsmi"),
    ("Horario_TSPIA.txt", "iset", "Horarios 2026 – Tecnicatura Superior en Producción Industrial de Alimentos (TSPIA)", "horario horarios alimentos tspia"),
    ("DC_TSL.txt", "iset", "Diseño Curricular – Tecnicatura Superior en Logística (2022)", "diseno curricular plan logistica tsl"),
    ("DC_PYG.txt", "iset", "Diseño Curricular – Tecnicatura Superior en Petróleo y Gas", "diseno curricular plan petroleo gas pyg"),
    ("DC_TSMI.txt", "iset", "Diseño Curricular – Tecnicatura Superior en Mantenimiento Industrial", "diseno curricular plan mantenimiento industrial tsmi"),
    ("DC_Multimedios.txt", "iset", "Diseño Curricular – Tecnicatura Superior en Producción de Multimedios", "diseno curricular plan multimedios"),
    ("DC_TSPIA.txt", "iset", "Diseño Curricular – Tecnicatura Superior en Producción Industrial de Alimentos (cohorte 2017)", "diseno curricular plan alimentos tspia"),
    ("DC_TSER.txt", "iset", "Diseño Curricular – Tecnicatura Superior en Gestión de Energías Renovables 2022 (versión preliminar)", "diseno curricular plan energias renovables tser"),
]

SIGLAS = {
    "Mantenimiento Industrial": "TSMI", "Petróleo y Gas": "PyG", "Producción Industrial de Alimentos": "TSPIA",
    "Logística": "TSL", "Gestión de Energías Renovables": "TSER", "Producción de Multimedios": "Multimedios",
    "Confección de Indumentaria y Productos Textiles": "Indumentaria",
}


def limpiar(t):
    t = t.replace("﻿", "").replace("\f", "\n")
    t = re.sub(r"Descripción generada automáticamente[^\n]*", "", t)
    t = re.sub(r"[ \t]{2,}", "  ", t)          # columnas del PDF
    t = re.sub(r"-{6,}", "—", t)               # celdas vacías
    t = re.sub(r"_{4,}[_ \t]*", "____ ", t)     # renglones para completar
    t = re.sub(r"\n\s*\n\s*\n+", "\n\n", t)
    return t.strip()


def fragmentar(texto, tam=1400, solape=250):
    partes, actual = [], ""
    for par in re.split(r"\n\s*\n", texto):
        par = par.strip()
        if not par:
            continue
        while len(par) > tam:                  # párrafos enormes
            corte = par.rfind(" ", 0, tam)
            corte = corte if corte > tam // 2 else tam
            if actual:
                partes.append(actual); actual = ""
            partes.append(par[:corte]); par = par[corte:].strip()
        if len(actual) + len(par) + 2 > tam and actual:
            partes.append(actual)
            actual = actual[-solape:] + "\n\n" + par if solape else par
        else:
            actual = (actual + "\n\n" + par) if actual else par
    if actual:
        partes.append(actual)
    return partes


fragmentos = []

def agregar(inst, fuente, texto, etiquetas=""):
    for i, p in enumerate(fragmentar(limpiar(texto))):
        fragmentos.append({"inst": inst, "fuente": fuente, "texto": p, "etiquetas": etiquetas})

for archivo, inst, fuente, etiquetas in FUENTES:
    with open(os.path.join(RAIZ, archivo), encoding="utf-8", errors="ignore") as f:
        agregar(inst, fuente, f.read(), etiquetas)

# ---- Correlatividades y planes: SOLO las hojas DATOS_UC y DATOS_REQ (sin datos de estudiantes) ----
wb = openpyxl.load_workbook(os.path.join(RAIZ, "Correlatividades.xlsx"), data_only=True)
anio = {}
plan = defaultdict(lambda: defaultdict(list))
for car, a, uc, _ in wb["DATOS_UC"].iter_rows(min_row=2, values_only=True):
    if car and uc:
        a = int(a); anio[(car, uc)] = a; plan[car][a].append(uc)
req = defaultdict(lambda: defaultdict(list))
for car, uc, tipo, cor, a_cor, _ in wb["DATOS_REQ"].iter_rows(min_row=2, values_only=True):
    if car and uc and cor:
        req[(car, uc)][tipo].append(f"{cor} ({int(a_cor)}.º año)" if a_cor else cor)

FUENTE_COR = "Régimen de correlatividades (Sistema de Correlatividades ISET N.º 812, según el Diseño Curricular de cada carrera)"
for car in plan:
    sig = SIGLAS.get(car, "")
    lineas = [f"Plan de estudios – Tecnicatura Superior en {car} ({sig}). Unidades curriculares por año:"]
    for a in sorted(plan[car]):
        lineas.append(f"{a}.º año: " + "; ".join(plan[car][a]) + ".")
    agregar("iset", FUENTE_COR, "\n".join(lineas), f"plan estudios materias unidades curriculares {car} {sig}")
    bloque = []
    for a in sorted(plan[car]):
        for uc in plan[car][a]:
            r = req.get((car, uc), {})
            l = [f"Tecnicatura Superior en {car} ({sig}) – «{uc}» ({a}.º año).",
                 "PARA CURSAR: debe tener REGULAR: " + (", ".join(r["REGULAR"]) if r.get("REGULAR") else "ninguna") +
                 "; debe tener APROBADA: " + (", ".join(r["APROBADA"]) if r.get("APROBADA") else "ninguna") + ".",
                 "PARA APROBAR (rendir/acreditar): debe tener APROBADA: " + (", ".join(r["APROBAR"]) if r.get("APROBAR") else "ninguna") + "."]
            bloque.append(" ".join(l))
    for linea in bloque:                        # una unidad curricular por fragmento
        fragmentos.append({"inst": "iset", "fuente": FUENTE_COR, "texto": linea,
                           "etiquetas": f"correlatividades correlativas cursar rendir aprobar regular {car} {sig}"})

# ---- Cuadernillos de la 718 y del CUP (material del docente) ----
with open(os.path.join(RAIZ, "cuad", "indice.tsv"), encoding="utf-8") as f:
    for linea in f:
        archivo, titulo = linea.rstrip("\n").split("\t")
        inst = "718" if titulo.startswith("718") else "cup"
        with open(os.path.join(RAIZ, "cuad", archivo), encoding="utf-8", errors="ignore") as g:
            texto = g.read()
        for p in fragmentar(limpiar(texto), tam=1600, solape=150):
            fragmentos.append({"inst": inst, "fuente": f"Cuadernillo «{titulo}»", "texto": p,
                               "etiquetas": "cuadernillo", "tipo": "cuadernillo"})

for i, fr in enumerate(fragmentos):
    fr["id"] = i
with open(SALIDA, "w", encoding="utf-8") as f:
    f.write("// Archivo generado por herramientas/construir_base.py — no editar a mano.\n")
    f.write("export default ")
    json.dump(fragmentos, f, ensure_ascii=False)
    f.write(";\n")

# ---- Instrucciones de cada bot (archivos .md de netlify/functions/instrucciones) → módulo JS ----
INSTR = os.path.join(FUNC, "instrucciones")
textos = {}
for clave, archivo in [("cup", "cup_albus.md"), ("718", "718_botito.md"), ("iset", "iset_asistente812.md")]:
    with open(os.path.join(INSTR, archivo), encoding="utf-8") as f:
        textos[clave] = f.read().strip()
with open(os.path.join(FUNC, "instrucciones.mjs"), "w", encoding="utf-8") as f:
    f.write("// Archivo generado por herramientas/construir_base.py a partir de instrucciones/*.md — no editar a mano.\n")
    f.write("export default " + json.dumps(textos, ensure_ascii=False, indent=1) + ";\n")

cuenta = defaultdict(int)
for fr in fragmentos:
    cuenta[(fr["inst"], fr.get("tipo", "doc"))] += 1
print(len(fragmentos), "fragmentos;", dict(cuenta), "→", os.path.getsize(SALIDA) // 1024, "KB")
