# Política de seguridad

## Versiones con soporte

Golf Plan es una app web sin servidor. Solo se mantiene la versión publicada en https://pruebaghluis.github.io/App/, que corresponde a la rama `main`. Las correcciones de seguridad se publican ahí; no hay versiones antiguas con soporte.

| Versión | Soporte |
|---|---|
| `main` (la publicada) | Sí |
| Anteriores | No |

## Cómo informar de una vulnerabilidad

**No abras un issue público.** Usa el aviso privado de GitHub:

1. Ve a la pestaña [Security → Advisories](https://github.com/PruebaGHluis/App/security/advisories/new) del repositorio.
2. Pulsa **Report a vulnerability** y describe el problema: qué pantalla o archivo afecta, cómo reproducirlo y qué impacto tiene.

Se intentará confirmar la recepción en un plazo de dos semanas. Si se confirma el fallo, se corregirá en `main`, se publicará el aviso con los detalles y se mencionará a quien lo descubrió, si lo desea.

## Alcance

Dentro del alcance:

- El código de la app: `index.html`, `css/`, `js/`, `sw.js` y `manifest.webmanifest`.
- La importación de copias de seguridad y los datos guardados en el navegador.
- Los workflows de GitHub Actions de `.github/workflows/`.

Fuera del alcance:

- La herramienta de diseño Impeccable (`.claude/`), que es de terceros; informa a su proyecto.
- La infraestructura de GitHub Pages y las cabeceras HTTP que sirve.

## Datos

La app no tiene servidor ni cuentas: todos los datos se guardan solo en el navegador del usuario (localStorage) y nunca se envían a ningún sitio. Las copias de seguridad son archivos JSON que el usuario exporta e importa; al importarlas, la app valida cada campo y descarta lo que no sea válido.
