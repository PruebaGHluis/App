# Golf Plan

[![CI y publicación](https://github.com/PruebaGHluis/App/actions/workflows/ci.yml/badge.svg)](https://github.com/PruebaGHluis/App/actions/workflows/ci.yml)
[![CodeQL](https://github.com/PruebaGHluis/App/actions/workflows/codeql.yml/badge.svg)](https://github.com/PruebaGHluis/App/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/PruebaGHluis/App/badge)](https://scorecard.dev/viewer/?uri=github.com/PruebaGHluis/App)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-0b6a3c)](LICENSE)

App web instalable en el móvil (PWA) para seguir un plan de entrenamiento de golf. Pensada para jugadores de nivel medio y avanzado que entrenan por su cuenta.

**Pruébala:** https://pruebaghluis.github.io/App/

<p>
  <img src="docs/screenshots/plan.jpg" alt="Plan semanal: bloque de hoy con los ejercicios y anillo de progreso de la semana" width="200">
  <img src="docs/screenshots/celebracion.jpg" alt="Celebración a pantalla completa al completar la sesión del día" width="200">
  <img src="docs/screenshots/ejercicio.jpg" alt="Ficha de ejercicio con historial, anillo de media frente al objetivo y gráfica" width="200">
  <img src="docs/screenshots/progreso-oscuro.jpg" alt="Progreso en modo oscuro: anillos de rendimiento por área y tendencia de vueltas" width="200">
</p>

<sub>Capturas con datos de ejemplo.</sub>

## Qué hace

- **Plan semanal**: se genera automáticamente según tu hándicap, tus días y tiempo disponibles, tus puntos débiles, tus últimas vueltas y tus resultados en los ejercicios. Te dice qué toca hoy y por qué.
- **Ejercicios**: 20 ejercicios de juego largo, approach, juego corto, bunker y putt, cada uno con un criterio de acierto y un objetivo en %.
- **Vueltas**: golpes, calles, greens en regulación, putts, up & down y penalidades, de 9 o 18 hoyos.
- **Distancias**: media, dispersión y rango por palo.
- **Progreso**: evolución por ejercicio, anillos de rendimiento por área y tendencias de tus vueltas.
- **Celebraciones** al cumplir un objetivo, completar la sesión del día o la semana.

Los datos se guardan solo en el dispositivo (localStorage). Desde **Perfil → Copia de seguridad** puedes exportarlos e importarlos.

## Usarla en el móvil

Abre https://pruebaghluis.github.io/App/ y añádela a la pantalla de inicio:

- **Android (Chrome)**: menú ⋮ → *Añadir a pantalla de inicio*.
- **iPhone (Safari)**: botón Compartir → *Añadir a pantalla de inicio*.

Una vez instalada, funciona sin conexión.

## Desarrollo

No necesita compilación ni dependencias. Para probarla en el PC:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

y abre http://localhost:8080.

Los tests del motor del plan (`js/plan.js`) usan el runner de Node (versión 22 o superior):

```
npm test
```

Cada push y pull request ejecuta los tests en GitHub Actions; si pasan en `main`, la app se publica en GitHub Pages (en *Settings → Pages*, la fuente debe ser **GitHub Actions**).

Si cambias archivos de la app, sube la versión de `CACHE` en `sw.js` para que los móviles descarguen la nueva versión.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Página y barra de navegación |
| `css/styles.css` | Estilos (incluye modo oscuro) |
| `js/app.js` | Pantallas, formularios y navegación |
| `js/data.js` | Biblioteca de ejercicios y palos |
| `js/plan.js` | Generador del plan y estadísticas |
| `js/charts.js` | Gráficas SVG |
| `js/store.js` | Guardado local |
| `sw.js`, `manifest.webmanifest` | Uso sin conexión e instalación |
| `fonts/` | Saira Condensed, autoalojada |
| `tests/` | Tests con `node:test` |
| `DESIGN.md`, `PRODUCT.md` | Sistema visual y descripción del producto |

## Contribuir y seguridad

- Errores y propuestas: [CONTRIBUTING.md](CONTRIBUTING.md).
- Vulnerabilidades: [SECURITY.md](SECURITY.md) (por aviso privado, no en issues).
- Cambios de cada versión: [CHANGELOG.md](CHANGELOG.md).

Cada cambio en `main` pasa por los tests, el análisis de CodeQL y OpenSSF Scorecard. Dependabot mantiene al día las acciones de GitHub, que van fijadas por hash.

## Licencia

El código de la app se publica con licencia [MIT](LICENSE).

- La fuente **Saira Condensed** (`fonts/`) es de The Saira Project Authors, con licencia [SIL Open Font License 1.1](fonts/OFL.txt).
- La herramienta de diseño **Impeccable** (`.claude/`) conserva su propia licencia.
