# Golf Plan

App web instalable en el móvil (PWA) para seguir un plan de entrenamiento de golf. Pensada para jugadores de nivel medio y avanzado.

- **Plan semanal**: se genera automáticamente según tu hándicap, tus días y tiempo disponibles, tus puntos débiles, tus últimas vueltas y tus resultados en los ejercicios.
- **Ejercicios**: 20 ejercicios de juego largo, approach, juego corto, bunker y putt, cada uno con un criterio de acierto y un objetivo.
- **Vueltas**: calles, greens en regulación, putts, up & down y penalidades.
- **Distancias**: media y dispersión por palo.
- **Progreso**: gráficas por ejercicio, rendimiento por área y tendencias de tus vueltas.

Los datos se guardan solo en el dispositivo (localStorage). Desde **Perfil → Copia de seguridad** puedes exportarlos e importarlos.

## Probar en el PC

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Abre http://localhost:8080.

## Usarla en el móvil

No necesita compilación: basta con publicar la carpeta tal cual, por ejemplo con GitHub Pages (*Settings → Pages → Deploy from branch → main / root*). Después, en el móvil:

- **Android (Chrome)**: menú ⋮ → *Añadir a pantalla de inicio*.
- **iPhone (Safari)**: botón Compartir → *Añadir a pantalla de inicio*.

Una vez instalada, funciona sin conexión.

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

Si cambias archivos de la app, sube la versión de `CACHE` en `sw.js` para que los móviles descarguen la nueva versión.
