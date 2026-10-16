# Registro de cambios

Los cambios importantes de Golf Plan. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las versiones, [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido
- Vueltas hoyo a hoyo: par, golpes, putts, calle, penalidad y distancia del primer putt por hoyo; los totales, greens en regulación y up & down se calculan solos.
- Campos guardados: pares, valoración y slope se rellenan al elegir un campo ya jugado.
- Índice de hándicap WHS calculado con las vueltas de 18 hoyos que tienen valoración y slope, con opción de llevarlo al perfil.
- Putt frente a una referencia profesional aproximada a partir de la distancia del primer putt.
- Prueba de nivel: 5 estaciones de 6 bolas con puntuación de 0 a 100, en Ejercicios y Progreso, y celebración al batir la mejor marca.
- Tests de los cálculos de golf (`tests/golf.test.js`) y de los datos nuevos en la validación.
- `.gitattributes` para fijar finales de línea LF.

### Cambiado
- La hoja inferior y la celebración ya no aparecen con fundido: son visibles desde el primer frame.

## [1.1.0] - 2026-10-16

### Añadido
- Pantalla del plan con bloque "Hoy", días pasados plegados, foco de la semana visible y resumen de la semana anterior.
- Alta en tres pasos; hándicap plus con "+".
- Registro más ágil: formulario de vuelta agrupado, mantener pulsado +/− y acción principal fija sobre las pestañas.
- Identidad deportiva: anillos de objetivo, celebraciones a pantalla completa y fuente Saira Condensed autoalojada.
- Diálogos de confirmación propios, gráficas espaciadas por fecha con datos en tabla y anillos por área en Progreso.
- Tests con `node:test` del motor del plan y del saneado de datos.
- CI en GitHub Actions con publicación en GitHub Pages, Dependabot, CodeQL y OpenSSF Scorecard.
- Licencia MIT, `SECURITY.md`, `CONTRIBUTING.md` y capturas en el README.
- Content-Security-Policy y política de referrer.

### Corregido
- Registrar desde la ficha de un ejercicio no marcaba el ejercicio en el plan.
- Las vueltas de 9 hoyos usaban par 72 y 14 calles.
- "142,5" en distancias se guardaba como dos golpes.
- Regenerar el plan o cambiar el perfil borraba las marcas de completado.
- Contraste insuficiente en insignias, bordes y textos de gráficas.

### Seguridad
- Los datos de una copia importada o de localStorage se validan campo a campo; antes, las cifras de una copia manipulada se insertaban en la página sin escapar.

## [1.0.0] - 2026-10-15

### Añadido
- Primera versión: plan semanal, 20 ejercicios, vueltas, distancias, progreso y uso sin conexión.

[Sin publicar]: https://github.com/PruebaGHluis/App/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/PruebaGHluis/App/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/PruebaGHluis/App/releases/tag/v1.0.0
