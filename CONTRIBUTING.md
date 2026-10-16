# Cómo contribuir

Gracias por querer mejorar Golf Plan. Se aceptan informes de errores, propuestas y pull requests.

## Informar de un error

Abre un [issue](https://github.com/PruebaGHluis/App/issues/new) con:

- Qué hiciste, qué esperabas y qué pasó.
- Pantalla afectada y, si puedes, una captura.
- Navegador y dispositivo (por ejemplo, Chrome en Android, Safari en iPhone).

Si el error afecta a la seguridad, **no abras un issue**: sigue [SECURITY.md](SECURITY.md).

## Proponer una mejora

Abre un issue explicando el problema que resuelve antes de escribir código; así se puede acordar el enfoque.

## Preparar el entorno

No hay compilación ni dependencias.

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Abre http://localhost:8080. Los tests necesitan Node 22 o superior:

```
npm test
```

## Enviar un pull request

1. Crea una rama desde `main`.
2. Mantén el estilo del código que tocas: JavaScript sin frameworks, comentarios breves en español.
3. Si cambias el motor del plan (`js/plan.js`) o la validación de datos (`js/validate.js`), añade o ajusta sus tests en `tests/`.
4. Si cambias archivos de la app, sube la versión de `CACHE` en `sw.js` y, si añades un archivo, inclúyelo en su lista `ASSETS`.
5. Si cambias algo visual, sigue [DESIGN.md](DESIGN.md) y adjunta una captura en el pull request.
6. Comprueba que `npm test` pasa; GitHub Actions lo vuelve a ejecutar en cada pull request.
7. Anota el cambio en [CHANGELOG.md](CHANGELOG.md), en la sección *Sin publicar*.

Al contribuir aceptas que tu aportación se publique con la [licencia MIT](LICENSE) del proyecto.
