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
- En «Información institucional» solo responde con lo cargado en `netlify/functions/conocimiento.mjs`; si no tiene el dato, deriva a la institución.

## Archivos

```
index.html                       página del asistente (selector + chat)
img/logo_cup.png                 logo del CUP
netlify/functions/chat.mjs       función segura que consulta a Gemini
netlify/functions/conocimiento.mjs  fichas de información oficial por institución
netlify.toml                     configuración de Netlify
```

## Publicación en Netlify (una sola vez)

1. Netlify → **Add new site → Import an existing project → GitHub** → repo `Proyectos--simuladores`.
2. En **Base directory** escribir: `sitios/asistente-educativo-718-cup-iset`. Lo demás se deja como está.
3. **Site configuration → Environment variables**, agregar:
   - `GEMINI_API_KEY` = la clave de Google AI Studio (obligatoria).
   - `CODIGO_DOCENTE` = un código para docentes, por ejemplo `docente2026` (recomendado; si no se carga, cualquiera puede entrar como docente).
   - `GEMINI_MODEL` = opcional; por defecto `gemini-flash-latest`.
4. **Deploys → Trigger deploy**. Listo: se comparte el enlace del sitio.

## Cargar información institucional

Editar `netlify/functions/conocimiento.mjs` y pegar texto de documentos **oficiales** de cada institución
(horarios, calendario, mesas, correlatividades, régimen de asistencia, contactos), indicando fuente y fecha.
Al guardar en GitHub, Netlify vuelve a publicar solo.

## Cuidados

- Plan gratuito de Gemini: tiene límite de consultas y Google puede usar las conversaciones para mejorar sus productos. Por eso la página pide no escribir datos personales.
- Si el uso crece, conviene activar facturación en Google AI Studio y poner un tope de gasto.
