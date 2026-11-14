# Asistente Educativo · Escuela N.º 718 · CUP · ISET N.º 812

Asistente con IA (Gemini) para estudiantes y docentes de las tres instituciones.
Diseño y desarrollo: Prof. y Mg. Hugo D. Karlau.

## Qué hace

| Perfil | Modos disponibles |
|---|---|
| Estudiante | Tutor de Matemática (guía paso a paso, sin dar la respuesta directa) · Información institucional |
| Docente (con código) | Tutor de Matemática (resoluciones completas) · Información institucional · Asistente docente |

- La clave de Gemini queda guardada en Netlify y **nunca** llega al navegador.
- Las fórmulas se muestran con formato matemático (fracciones apiladas).
- **Tutor:** en la 718 sigue las instrucciones de Botito718 (Matemática e Inglés); en el CUP, las de Albus Bot. En ambos casos usa como referencia fragmentos de los cuadernillos del docente.
- **Información institucional del ISET:** sigue las instrucciones del Asistente 812 y responde solo con la documentación oficial cargada, citando la fuente; lo que no está cargado lo deriva.
- **Información institucional de la 718 y el CUP:** todavía sin documentación; deriva a preceptoría o Secretaría.

## Archivos

```
index.html                                   página del asistente (selector + chat)
img/                                         logos de la 718, el CUP y el CeRET
vendor/katex/                                fórmulas matemáticas
netlify/functions/chat/chat.mjs              función segura que consulta a Gemini
netlify/functions/chat/buscador.mjs          busca los fragmentos relevantes para cada consulta
netlify/functions/chat/base_conocimiento.mjs documentos y cuadernillos en fragmentos (generado)
netlify/functions/chat/instrucciones/*.md    instrucciones de Botito718, Albus Bot y Asistente 812
netlify/functions/chat/conocimiento.mjs      datos de cada institución
herramientas/construir_base.py               regenera la base y las instrucciones
netlify.toml                                 configuración de Netlify
```

## Publicación en Netlify (una sola vez)

1. Netlify → **Add new site → Import an existing project → GitHub** → repo `Proyectos--simuladores`.
2. En **Base directory** escribir: `sitios/asistente-educativo-718-cup-iset`. Lo demás se deja como está.
3. **Site configuration → Environment variables**, agregar:
   - `GEMINI_API_KEY` = la clave de Google AI Studio (obligatoria).
   - `CODIGO_DOCENTE` = un código para docentes, por ejemplo `docente2026` (recomendado; si no se carga, cualquiera puede entrar como docente).
   - `GEMINI_MODEL` = opcional; por defecto `gemini-flash-latest`.
4. **Deploys → Trigger deploy**. Listo: se comparte el enlace del sitio.

## Actualizar la información

- **Instrucciones de un bot:** editar el `.md` correspondiente en `netlify/functions/chat/instrucciones/` y correr `python3 herramientas/construir_base.py <carpeta_textos>`.
- **Documentos o cuadernillos nuevos:** agregar el texto a la carpeta de textos, sumarlo a `FUENTES` (o a `cuad/indice.tsv`) en `construir_base.py` y volver a generar la base.
- De la planilla de correlatividades se usan **solo** las hojas DATOS_UC y DATOS_REQ: nunca se cargan datos de estudiantes.
- Al guardar en GitHub, Netlify vuelve a publicar solo.

### Fuentes cargadas (14/11/2026)

ISET N.º 812: RAI; RAM; ROM; horarios del 2.º cuatrimestre 2026 de TSER; diseños curriculares de TSL 2022, PyG, TSMI, Multimedios y TSPIA 2017; correlatividades y planes de esas cinco tecnicaturas.
Excluidos por presentar errores o estar incompletos: Calendario Académico 2026, horarios del 1.er cuatrimestre (TSL, TSMI, TSPIA), diseño curricular preliminar de TSER y correlatividades de TSER e Indumentaria.
Escuela 718 y CUP: 32 cuadernillos del estudiante (16 por institución) de 1.º y 3.º (718) y 1.º y 2.º (CUP).

## Cuidados

- Plan gratuito de Gemini: tiene límite de consultas y Google puede usar las conversaciones para mejorar sus productos. Por eso la página pide no escribir datos personales.
- Si el uso crece, conviene activar facturación en Google AI Studio y poner un tope de gasto.
