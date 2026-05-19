# Iconos PWA requeridos

Los archivos `.placeholder` en este directorio deben ser reemplazados con PNGs reales antes del deploy a producción.

## Especificaciones

| Archivo | Tamaño | Propósito |
|---|---|---|
| `icon-192.png` | 192 x 192 px | Icono estándar Android / Chrome |
| `icon-512.png` | 512 x 512 px | Icono estándar splash screen / store |
| `icon-192-maskable.png` | 192 x 192 px | Icono maskable — safe zone: círculo centrado al 80% |
| `icon-512-maskable.png` | 512 x 512 px | Icono maskable grande — safe zone: círculo centrado al 80% |

## Diseño

- Fondo: `#D94F00` (naranja Ziteo)
- Logo/símbolo: blanco, centrado
- Para los maskable: mantener el logo dentro del safe zone (círculo al 80% del canvas)
- Formato: PNG, sin transparencia en versión maskable

## Herramientas sugeridas

- https://maskable.app — previsualizar iconos maskable
- https://realfavicongenerator.net — generar todos los tamaños desde un SVG
- El archivo `public/pwa-icon.svg` puede servir de base
