---
name: Golf Plan
description: Plan de entrenamiento de golf, móvil primero, donde cada resultado se lee como un anillo contra su objetivo.
colors:
  bg: "#f2f4f0"
  surface: "#ffffff"
  surface-2: "#e8ede6"
  text: "#0c1611"
  muted: "#4f5c55"
  line: "#d5ddd5"
  line-strong: "#7f8c84"
  primary: "#0b6a3c"
  primary-soft: "#d9efe1"
  on-primary: "#ffffff"
  danger: "#b4372f"
  warn: "#b7791f"
  warn-text: "#8a5a12"
  ok: "#138a4a"
  ok-text: "#0f5f34"
  shell: "#0d1f16"
  shell-2: "#163024"
  on-shell: "#f2f7f3"
  shell-muted: "#a3b6aa"
  shell-line: "#2a4335"
  volt: "#c6f432"
  on-volt: "#0c1611"
  c-largo: "#2563c4"
  c-approach: "#0f8a55"
  c-juegocorto: "#c8620f"
  c-bunker: "#a07a1e"
  c-putt: "#7442c2"
  bg-dark: "#0a100c"
  surface-dark: "#131b16"
  surface-2-dark: "#1c2620"
  text-dark: "#ecf2ee"
  muted-dark: "#a0b1a7"
  line-dark: "#26332b"
  line-strong-dark: "#5c6e63"
  primary-dark: "#3fcf7f"
  primary-soft-dark: "#16301f"
  on-primary-dark: "#06110a"
  danger-dark: "#ef6b62"
  warn-dark: "#e0a54a"
  ok-dark: "#4fd38a"
  shell-dark: "#050906"
  shell-2-dark: "#102018"
  shell-line-dark: "#1f3127"
  c-largo-dark: "#6aa3f0"
  c-approach-dark: "#45c98c"
  c-juegocorto-dark: "#f0954a"
  c-bunker-dark: "#d8b85e"
  c-putt-dark: "#b48cf0"
typography:
  display:
    fontFamily: "Saira Condensed, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Saira Condensed, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "0.01em"
  title:
    fontFamily: "Saira Condensed, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0"
  title-sm:
    fontFamily: "Saira Condensed, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0"
  figure:
    fontFamily: "Saira Condensed, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 800
    letterSpacing: "0"
    fontFeature: "tnum"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 650
  label-xs:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
rounded:
  indicator: "3px"
  field: "10px"
  control: "12px"
  card: "16px"
  dialog: "18px"
  sheet: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  sm-plus: "10px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  topbar:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.on-shell}"
    typography: "{typography.headline}"
    padding: "12px 16px"
  tabbar:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-muted}"
    typography: "{typography.label-xs}"
    height: "64px"
  tabbar-active:
    textColor: "{colors.volt}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-highlight:
    backgroundColor: "{colors.primary-soft}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-hint:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-hero:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.on-shell}"
    rounded: "{rounded.card}"
    padding: "16px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-sm:
    rounded: "{rounded.field}"
    padding: "0 12px"
    height: "40px"
  button-ghost:
    textColor: "{colors.primary}"
  button-danger-solid:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    height: "44px"
  button-dock:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    height: "50px"
  button-win:
    backgroundColor: "{colors.volt}"
    textColor: "{colors.on-volt}"
    rounded: "{rounded.control}"
    height: "44px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  chip-active:
    backgroundColor: "{colors.text}"
    textColor: "{colors.bg}"
  chip-check-checked:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  stat:
    backgroundColor: "{colors.surface-2}"
    typography: "{typography.figure}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  badge:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  sheet:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.sheet}"
    padding: "18px 16px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.dialog}"
    padding: "20px"
  toast:
    backgroundColor: "{colors.text}"
    textColor: "{colors.bg}"
    rounded: "{rounded.control}"
    padding: "11px 16px"
  toast-win:
    backgroundColor: "{colors.volt}"
    textColor: "{colors.on-volt}"
  celebrate:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.on-shell}"
    typography: "{typography.display}"
---

# Design System: Golf Plan

## Overview

**Creative North Star: "El anillo contra el objetivo"**

Golf Plan es un cuaderno de entrenamiento con identidad deportiva moderna: alto contraste, tinta oscura en el marco y un único gesto propio. Cada resultado (un ejercicio, un área, la semana) se dibuja como un anillo con una marca de objetivo; cumplirlo enciende el anillo en lima "volt". El resto de la interfaz es deliberadamente sobrio para que ese encendido signifique algo.

La app se usa de pie, con una mano y a pleno sol, así que la densidad es la de una herramienta: columna única de 640 px como máximo, tarjetas claras sobre un fondo frío, objetivos táctiles de 40 a 50 px y la acción principal fija al alcance del pulgar. El marco (barra superior, pestañas, bloque de "Hoy" y celebración) vive en tinta verde casi negra; el contenido, en superficies claras. En modo oscuro el marco baja a casi negro y el contenido sube a verdes apagados, con la misma lógica de roles.

El movimiento es escaso y con propósito: la hoja sube, el check salta, y solo el logro tiene coreografía (barrido del anillo, pop del centro, rayos). Todo tiene alternativa para movimiento reducido.

**Key Characteristics:**
- Anillo de objetivo como gesto propio: arco = valor, marca = objetivo, centro encendido = cumplido.
- Tres capas de color: marco en tinta (`shell`), acción en verde de calle (`primary`), logro en volt.
- Tipografía del sistema muy pesada (750 a 900) con cifras tabulares.
- Esquinas de 16 px en tarjetas, píldoras en chips; sin sombras de color ni brillos.
- Celebración a pantalla completa como único momento expresivo.

## Colors

Paleta fría y verdosa de alto contraste: casi todo es tinta y papel, el verde de calle marca la acción y el volt queda guardado para los logros.

### Primary
- **Verde de calle** (primary): botones principales, enlaces, foco, arco del anillo en curso, línea de las gráficas y chips marcados. En oscuro sube a un verde luminoso (primary-dark) con tinta encima (on-primary-dark).
- **Verde de calle suave** (primary-soft): fondo de tarjetas destacadas y consejos (`tip`).

### Secondary
- **Tinta de marco** (shell, shell-2, shell-line): barra superior, pestañas, bloque de "Hoy" y fondo de la celebración. `shell-2` para botones de icono sobre el marco; `on-shell` y `shell-muted` para texto encima.

### Tertiary
- **Volt** (volt, con on-volt encima): el color del logro. Arco y centro del anillo cumplido, check de ejercicio hecho en el bloque de hoy, celebración, toast de logro, indicador de pestaña activa y anillo de foco sobre el marco.

### Neutral
- **Papel frío** (bg): fondo de la app y de la hoja inferior.
- **Blanco tarjeta** (surface) y **Gris salvia** (surface-2): tarjetas; stats, badges, barras y botones de cierre.
- **Tinta** (text) y **Gris musgo** (muted): texto principal y secundario.
- **Línea** (line) y **Línea fuerte** (line-strong): separadores de lista y pista del anillo; bordes de botones, campos y chips.
- **Estados**: danger para borrar, warn para anillos por debajo del 80 % del objetivo, ok/ok-text y warn-text para badges y porcentajes cumplidos.
- **Áreas de juego** (c-largo azul, c-approach verde, c-juegocorto naranja, c-bunker arena, c-putt violeta, con versiones `-dark`): solo en puntos de categoría y barras de foco; nunca como fondo ni como color de acción.

### Named Rules
**The Volt Is Earned Rule.** El volt se gana: aparece cuando se cumple un objetivo (anillo, check, celebración, toast de logro) y, como señal de posición, en el indicador de pestaña activa y el foco sobre el marco oscuro. Nunca en botones de acción ordinarios, fondos de sección ni decoración.

**The Win Inversion Rule.** El logro se pinta con el par `win-bg`/`win-fg`: en claro, centro de tinta con check volt; en oscuro y sobre el marco, centro volt con check de tinta. El estado cumplido siempre lleva el centro relleno; el arco volt nunca comunica el logro por sí solo sobre superficies claras.

**The Shell Remap Rule.** Un bloque en color de marco no reescribe componentes: redefine los tokens (`--surface`, `--text`, `--muted`, `--line`, `--primary`, `--win-bg`...) a sus equivalentes de marco, y los componentes de dentro se adaptan solos.

## Typography

**Display Font:** Saira Condensed 800 y 900 (SIL OFL 1.1), autoalojada en `fonts/` como woff2 (subconjunto latino) y precargada en el service worker para funcionar sin conexión. Licencia en `fonts/OFL.txt`. Se declara como `--font-display` con la pila del sistema de respaldo.
**Body Font:** la pila del sistema (system-ui, -apple-system, Segoe UI, Roboto, sans-serif).

**Character:** dos voces. Condensada y pesada para títulos y cifras, como un marcador deportivo; la del sistema, a 400, para el texto corrido y los controles. La barra superior y la celebración van en mayúsculas.

### Hierarchy
- **Display** (Saira Condensed 900, 2.75rem, 1, mayúsculas): solo el titular de la celebración, en volt.
- **Headline** (Saira Condensed 900, 1.85rem, mayúsculas): título de la barra superior.
- **Title** (Saira Condensed 800, 1.5rem, 1.05): títulos de tarjeta y de hoja; 1.75rem en el bloque de "Hoy".
- **Title small** (Saira Condensed 800, 1.2rem): días del plan y subtítulos. El mensaje del diálogo sigue en la fuente del sistema (750, 1.05rem).
- **Figure** (Saira Condensed 800, 1.8rem, tabular): valores de stats, texto central de los anillos, porcentajes de las filas del plan (1.1rem) y cifras de volumen (1.6rem).
- **Body** (400, 16px, 1.45): texto corrido; `small` a 0.85rem para metadatos.
- **Label** (650, 0.85rem): etiquetas de campo y leyendas; nombres de ejercicio a 650; badges a 700 y 0.75rem; pestañas a 600 y 0.72rem (800 activa).

### Named Rules
**The Tabular Numbers Rule.** Toda cifra que se compara (porcentajes, aciertos, golpes, minutos, tablas, stepper) usa `font-variant-numeric: tabular-nums`.

**The Heavy Ink Rule.** Ningún titular baja de 800: títulos y cifras van en Saira Condensed 800/900 (autoalojada, OFL). El peso hace el trabajo que en otros sistemas haría el tamaño o el color.

## Layout

Columna única centrada de 640 px como máximo con 16 px de margen. La barra superior es pegajosa y las pestañas fijas abajo (64 px más el área segura); en pantallas anchas ambas alinean su contenido con la columna. Las tarjetas se apilan con 12 px de separación; en formularios, 14 px. Rejillas de 2 y 3 columnas con 10 px de hueco para stats; los anillos por área usan `auto-fit` con mínimo de 96 px.

La acción principal de una pantalla vive en el dock: fija encima de las pestañas, a ancho de columna, sobre un degradado del fondo, y el contenido reserva 84 px para no quedar tapado. El ritmo de espaciado es 4 / 8 / 10 / 12 / 16 / 24 px. Los objetivos táctiles miden al menos 40 px (44 px los botones, 50 px el del dock, 52 px de ancho los del stepper).

## Elevation & Depth

Sistema plano con un levantamiento ambiental mínimo. En claro, las tarjetas llevan una sombra neutra muy suave teñida de tinta; en oscuro no hay sombras y la profundidad la da el escalón tonal (`bg` → `surface` → `surface-2`). Las capas modales se separan con un velo de tinta al 55 %.

### Shadow Vocabulary
- **Levantamiento de tarjeta** (`box-shadow: 0 1px 2px rgba(12, 22, 17, .06), 0 4px 14px rgba(12, 22, 17, .05)`): tarjetas en modo claro; se anula en tarjetas destacadas, de pista y en oscuro.
- **Diálogo** (`box-shadow: 0 12px 40px rgba(0, 0, 0, .25)`): solo el diálogo de confirmación.

### Named Rules
**The No Glow Rule.** Ni sombras de color ni brillos. El volt se enciende por relleno, no por halo.

## Shapes

Esquinas suaves y consistentes: 16 px en tarjetas, 12 px en botones, stats y toast, 10 px en campos, botones pequeños y consejos, 18 px en el diálogo y 20 px en la parte superior de la hoja. Chips, badges y barras son píldoras; botones de icono, checks, puntos y anillos son círculos. El indicador de pestaña es una barra de 28 × 3 px con las esquinas inferiores redondeadas. El círculo es la forma propia: anillos, checks y rayos de celebración repiten la misma geometría radial.

## Components

### Buttons
- **Shape:** esquinas suaves (12 px; 10 px en pequeño), altura mínima 44 px (40 px en pequeño, 50 px en el dock), peso 700.
- **Primary:** verde de calle con texto `on-primary`. Para la acción principal de la pantalla (dock) y para los "Registrar" del bloque de hoy; fuera de él, "Registrar" es secundario.
- **Secondary:** superficie con borde `line-strong` y texto de tinta.
- **Ghost:** sin fondo ni borde, texto verde de calle.
- **Danger:** texto rojo con borde rojo al 50 %; en el diálogo, versión sólida roja.
- **Win:** volt con tinta encima; solo el "Seguir" de la celebración.
- **Focus:** contorno de 3 px en `primary` con 2 px de separación; volt sobre el marco.

### Chips
- **Filtro:** píldora con borde `line-strong`; activa en tinta invertida (`text` de fondo, `bg` de texto).
- **Selección (días):** píldora con checkbox oculto; marcada en verde de calle.

### Cards / Containers
- **Corner Style:** 16 px.
- **Background:** `surface`; destacada en `primary-soft`; de pista en `surface-2`.
- **Shadow Strategy:** levantamiento de tarjeta en claro, ninguna en oscuro.
- **Border:** 1 px `line` (transparente en destacada y pista).
- **Internal Padding:** 16 px; cabecera de tarjeta en fila con 8 px bajo ella.

### Hero (bloque de "Hoy")
Tarjeta en color de marco que aplica la Shell Remap Rule: dentro, el primario pasa a `on-shell`, el texto cumplido a volt y el par de logro a volt/tinta. Titular a 1.4rem. Con la sesión o la semana completada, el titular lleva delante un disco volt de 24 px con check de tinta.

### Inputs / Fields
- **Style:** superficie, borde 1 px `line-strong`, 10 px de radio, 10 × 12 px de relleno, 16 px de texto (sin zoom en iOS). Etiqueta encima a 650 y 0.85rem en `muted`.
- **Focus:** contorno de 2 px en `primary` hacia dentro, el borde se vuelve transparente.
- **Stepper:** botones de 52 px de ancho en `surface-2` a ambos lados del número (800, 1.25rem, tabular).

### Navigation
- **Barra superior:** marco oscuro, título a 850, botón de perfil circular de 40 px en `shell-2`.
- **Pestañas:** cinco botones con icono SVG de trazo 2 px (24 px) y etiqueta de 0.72rem en `shell-muted`. La activa pasa a volt, peso 800, con una barra volt de 28 × 3 px pegada al borde superior.

### Target Ring (anillo de objetivo)
El gesto propio. SVG generado: pista en `line`, arco en `primary` desde las 12 en punto con extremos redondeados; por debajo del 80 % del objetivo, en `warn`. Una marca radial en tinta (2.5 px) señala el objetivo. Al cumplirlo, el arco pasa a volt, la marca desaparece y el centro se rellena con `win-bg` y un check o la cifra central en `win-fg`. Tamaños en uso: 30 px en filas del plan, 34 px en resultados, 64 y 72 px en progreso y ficha, 92 px para la semana y 168 px en la celebración; el grosor escala con el tamaño (4 a 14 px) y el texto central se reduce con el número de caracteres.

### Plan Rows
Filas de lista separadas por línea de 1 px: a la izquierda un check circular vacío de 26 px (pendiente) o el anillo de 30 px (hecho); nombre a 650 con metadatos (punto de área, minutos, intentos) en 0.82rem; a la derecha, "Registrar" pequeño o el porcentaje en Saira Condensed tabular, en `ok-text` si se cumplió (aciertos e intentos van en el texto accesible). Recién registrada, la fila hace un pop de 0.45 s en el anillo.

### Dock
Acción principal fija sobre las pestañas, ancho de columna, botón primario de 50 px a 1.02rem, sobre degradado de transparente a `bg`.

### Bottom Sheet
Panel en `bg` desde abajo, esquinas superiores de 20 px, 92 vh como máximo, asa de 40 × 4 px y botón de cierre circular de 40 px arriba a la derecha. Entra con 30 px de desplazamiento en 0.22 s; velo de tinta al 55 %. El resto de la app queda inerte mientras está abierto.

### Confirm Dialog
`<dialog>` nativo de hasta 400 px, 18 px de radio, 20 px de relleno, mensaje a 750. Dos botones a partes iguales: "Cancelar" (secundario, con foco inicial) y la acción en primario o rojo sólido si es destructiva.

### Toast
Píldora rectangular de 12 px en tinta invertida, 0.92rem a 600, encima de las pestañas (y del dock si existe); sube 20 px al aparecer. Variante de logro en volt con tinta a 800 y 3.4 s de permanencia.

### Celebration
Pantalla completa en color de marco. Anillo de 168 px cuyo arco barre desde cero en 0.9 s; a los 0.8 s el centro, el check y la cifra hacen pop; a 1 s, doce rayos volt de 4 × 18 px salen radialmente. Titular display en volt, detalle en `shell-muted`, botón "Seguir" en volt. Vibración breve, cierre automático a los 3.6 s o al tocar. Con movimiento reducido, el anillo aparece ya completo y los rayos no se muestran.

## Do's and Don'ts

### Do:
- **Do** representar cualquier resultado frente a un objetivo con el anillo: arco, marca de objetivo y centro relleno al cumplirlo.
- **Do** reservar el volt para logros y para la posición activa sobre el marco oscuro (pestaña activa, foco).
- **Do** usar el par `win-bg`/`win-fg` para todo estado cumplido, para que se invierta bien entre claro y oscuro.
- **Do** remapear tokens en los bloques de marco en vez de duplicar estilos de componente.
- **Do** usar cifras tabulares y pesos de 750 a 900 en titulares y números.
- **Do** fijar la acción principal en el dock cuando la pantalla la tiene, y usar el botón primario solo para la acción principal (dock, "Registrar" de hoy, confirmar).
- **Do** dar a cada animación su alternativa para movimiento reducido.

### Don't:
- **Don't** usar volt en botones de acción ordinarios, fondos de sección o decoración.
- **Don't** comunicar el logro solo con el arco volt sobre superficie clara; siempre con el centro relleno.
- **Don't** usar sombras de color ni brillos; en oscuro, ninguna sombra.
- **Don't** usar los colores de área como fondo o color de acción; son puntos y barras.
- **Don't** cargar fuentes alojadas fuera; la app funciona sin conexión.
- **Don't** convertir la celebración a pantalla completa en un aviso corriente: es solo para objetivo cumplido, sesión o semana completadas.
