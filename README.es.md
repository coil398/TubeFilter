# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** es una extensión multinavegador con Manifest V3 que limpia tu feed de YouTube filtrando el contenido según los umbrales de recuento de visualizaciones y de espectadores en directo que tú controlas. Atenúa u oculta los vídeos con pocas visualizaciones y las retransmisiones en directo con pocos espectadores, y puede eliminar de forma independiente los banners promocionales superiores, las listas Mix y los Shorts. Los ajustes se gestionan en un popup de React, se aplican al instante a las pestañas de YouTube abiertas sin necesidad de recargar, y la interfaz del popup está disponible en **9 idiomas** (English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文) con un modo **Auto** que sigue el idioma de tu navegador. Los recuentos de visualizaciones/espectadores se analizan teniendo en cuenta la configuración regional en los mismos **9 idiomas de página de YouTube**.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **Estado:** v1.0.0 — todavía no publicada en Chrome Web Store ni en AMO. Instálala mediante una compilación local sin empaquetar (consulta [Instalación](#installation-end-users)).

## De un vistazo

TubeFilter oculta o atenúa los elementos del feed de YouTube que quedan por debajo de los umbrales de visualizaciones/espectadores que defines, y puede eliminar banners, listas Mix y Shorts cuando lo desees. Para probarlo en tres pasos:

1. `npm ci`
2. `npm run build` (Chrome) o `npm run build:firefox` (Firefox)
3. Carga la compilación sin empaquetar desde `.output/chrome-mv3` (o `.output/firefox-mv3`) — consulta [Instalación](#installation-end-users).

Tus ajustes nunca salen de tu navegador: TubeFilter solicita únicamente `storage` y acceso de host a `youtube.com`, y toda la configuración se mantiene en el almacenamiento local del navegador.

## Características

### Filtro de recuento de visualizaciones (vídeos normales)

Un vídeo normal se filtra cuando se cumplen **todas** las condiciones siguientes:

- El filtro de vídeos está activado (`enableVideoFilter`).
- Se ha analizado correctamente un recuento de visualizaciones a partir de la tarjeta.
- El recuento de visualizaciones analizado está **por debajo** de tu umbral `minViews`.

Si un vídeo no tiene un recuento de visualizaciones analizable, se deja intacto. El control deslizante **Min Views** del popup controla el umbral y se desactiva mientras el filtro de vídeos está apagado.

### Filtro de directos (retransmisiones en vivo)

Las retransmisiones en directo se evalúan frente a un umbral **independiente**: espectadores simultáneos, no visualizaciones totales. Una retransmisión en directo se filtra cuando el filtro de directos está activado (`enableLiveFilter`), se ha analizado un recuento de espectadores y ese recuento está **por debajo** de tu umbral `minConcurrent`. El estado de directo se detecta a partir de las insignias de "en directo ahora" del DOM o del texto indicador de directo en la cadena del recuento de visualizaciones (consulta [Cómo funciona](#live-detection)).

### Filtros de contenido (sin umbral)

Estos tres filtros son interruptores incondicionales de encendido/apagado: ignoran por completo los recuentos de visualizaciones:

| Filtro | Ajuste | Qué elimina |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | Anuncios de cabecera promocionales y banners de declaración/promoción. Cuando un banner coincidente se encuentra dentro de una sección enriquecida, se oculta toda la sección padre. |
| **Mix Lists** | `enableMixFilter` | Listas de reproducción Mix / radio generadas automáticamente. |
| **Shorts** | `enableShortsFilter` | Enlaces y estantes de Shorts. |

### Reglas de canal y filtro de palabras clave

Más allá de los umbrales numéricos, puedes permitir u ocultar de forma estricta por canal, y ocultar según el texto del título, gestionado en el popup como listas de una entrada por línea.

- **Canales que siempre se ocultan** (`channelBlocklist`) — los vídeos de estos canales se ocultan siempre, sin importar el recuento de visualizaciones.
- **Canales que siempre se muestran** (`channelAllowlist`) — los vídeos de estos canales nunca se filtran (útil para tus pequeños creadores favoritos que están por debajo de tu `minViews`).
- **Ocultar títulos que contengan** (`titleKeywords`) — oculta los vídeos cuyo título contenga cualquiera de los términos indicados. Una entrada entre barras (p. ej. `/spoiler.*ending/`) se trata como una **expresión regular** que no distingue mayúsculas de minúsculas; de lo contrario, es una subcadena simple que tampoco distingue mayúsculas de minúsculas.

Los canales se comparan de forma **exacta** por `@handle`, ID de canal o nombre de canal (de modo que `mr` **no** coincide con `@MrBeast`). Estas reglas se aplican a tarjetas individuales de vídeo / lista de reproducción / Mix, pero **no** a los estantes agregados (p. ej. el estante de Shorts), de modo que un único elemento hijo nunca oculta toda una fila.

### Dónde se aplica el filtrado

El content script se ejecuta a lo largo de YouTube y vuelve a filtrar a medida que navegas — Inicio, Búsqueda, Suscripciones, las recomendaciones de la barra lateral de la página de reproducción y las páginas de canal — cubriendo tanto los renderizadores heredados como el nuevo layout `yt-lockup-view-model`.

### Modos de filtro: Ocultar vs. Opacidad

El selector de **Modo de filtro** decide cómo se tratan los vídeos/retransmisiones en directo filtrados:

- **Hide** — aplica `display: none`, eliminando por completo el elemento de la vista.
- **Opacity** — aplica `opacity: 0.1`, atenuando el elemento al **10 %** de opacidad y manteniéndolo visible. Es el valor por defecto.

> ℹ️ El filtro Top Banner siempre oculta los banners (`display: none`) sin importar el modo de filtro seleccionado. El modo de filtro solo afecta a los vídeos y a las retransmisiones en directo.

### Prioridad de filtrado

Cada tarjeta se clasifica una sola vez, usando un orden fijo if/else. Solo se aplica la regla de la primera categoría coincidente:

1. **Lista de bloqueo de canales** — ocultar siempre (máxima prioridad)
2. **Lista de permitidos de canales** — mostrar siempre (omite todas las reglas siguientes)
3. **Palabra clave del título** — ocultar los títulos coincidentes
4. **Shorts**
5. **Listas Mix**
6. **Retransmisiones en directo**
7. **Vídeos normales**

(Las reglas de canal/palabra clave 1–3 se aplican solo a tarjetas individuales, no a los estantes agregados.)

### Desactivar el doblaje automático (forzar el audio original)

El doblaje automático de YouTube sustituye el audio de un vídeo por una pista traducida por IA basada en el idioma de tu interfaz, de modo que un vídeo en inglés se reproduce por defecto en japonés, alemán, etc. Con **Force Original Audio** (`forceOriginalAudio`, **activado por defecto**), TubeFilter detecta la pista de audio original y conmuta el reproductor a ella automáticamente en cada vídeo y Short, deshaciendo el doblaje automático.

- Funciona en vídeos `/watch` y Shorts, y se vuelve a aplicar en cada navegación dentro de la app.
- La pista original se identifica de forma **independiente del idioma** decodificando el id de la pista de audio del reproductor (los datos de la pista original contienen `original`; las pistas dobladas contienen `dubbed` / `dubbed-auto`).
- Se implementa mediante un **script en el mundo MAIN** inyectado en la página — la API de audio del reproductor de YouTube no es accesible desde el mundo aislado del content script — con el ajuste puenteado desde el almacenamiento de la extensión.
- Puedes desactivarlo en cualquier momento desde el popup para conservar el audio doblado de YouTube.

### Detección multilingüe del recuento de visualizaciones

YouTube muestra los recuentos de visualizaciones y de espectadores **de forma muy distinta según el idioma de la página**, no solo con palabras traducidas, sino con separadores decimales/de millares y unidades de abreviatura diferentes. El mismo recuento de ~1700 millones aparece como:

| Idioma | Cadena de YouTube |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

El content script detecta automáticamente el **idioma de la página de YouTube** (`document.documentElement.lang`) y analiza los recuentos con el separador decimal, el separador de millares y las unidades de abreviatura correctos para esa configuración regional. Esto importa porque el analizador anterior asumía un formato al estilo inglés y **leía mal las configuraciones regionales con coma decimal** (`de` / `fr` / `ru` / `pt`) — p. ej. leía `1,7 Mrd.` como `1` o `17` en lugar de `1.700.000.000`. El análisis correcto según la configuración regional es compatible con **9 idiomas** (consulta [Internacionalización](#internationalization)); los idiomas de página desconocidos recurren a un analizador genérico permisivo.

### Idiomas (interfaz del popup)

La interfaz del popup se ofrece en **9 idiomas** — English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文 — más un modo **Auto (`auto`, por defecto)** que sigue el idioma de la interfaz del navegador (`navigator.language`, asignado a la configuración regional compatible más cercana, con recurso al inglés). Un desplegable en la cabecera del popup permite alternar entre ellos.

## Capturas de pantalla

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## Navegadores compatibles

| Navegador | Manifest | Notas |
|---|---|---|
| **Chrome / Chromium** | MV3 | Objetivo de compilación por defecto; Chrome usa MV3 por defecto. |
| **Firefox** | MV3 | El directorio de salida es `.output/firefox-mv3`; MV3 se fuerza mediante `manifestVersion: 3` en `wxt.config.ts` (de lo contrario, Firefox usaría MV2 por defecto). |

> ℹ️ El content script se ejecuta en `https://www.youtube.com/*` en ambos navegadores. La compilación de Firefox incluye un `browser_specific_settings.gecko.id` de `tube-filter@coil398.github.io` (obligatorio para MV3 en AMO, inofensivo en Chrome).

## Instalación (usuarios finales)

Para el recorrido completo y compatible de publicación e instalación, consulta **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**.

Para cargar una compilación local sin empaquetar para pruebas:

### Chrome / Chromium

1. Ejecuta `npm run build` para generar `.output/chrome-mv3`.
2. Abre `chrome://extensions`.
3. Activa el **Modo de desarrollador** (arriba a la derecha).
4. Haz clic en **Cargar descomprimida** y selecciona el directorio `.output/chrome-mv3`.

### Firefox

1. Ejecuta `npm run build:firefox` para generar `.output/firefox-mv3`.
2. Abre `about:debugging`.
3. Ve a **Este Firefox** → **Cargar complemento temporal…**.
4. Selecciona cualquier archivo dentro del directorio `.output/firefox-mv3` (p. ej. su `manifest.json`).

## Uso

Abre el popup de la extensión para ajustar el filtrado. Los cambios se guardan de inmediato y se aplican en vivo a cualquier pestaña de YouTube abierta, sin necesidad de recargar.

### Referencia de ajustes

| Ajuste | Qué controla | Rango / paso | Por defecto | Etiqueta JA | Etiqueta EN |
|---|---|---|---|---|---|
| `minViews` | Recuento mínimo de visualizaciones por debajo del cual se filtran los vídeos normales | rango `0`–`100000`, paso `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | Recuento mínimo de espectadores simultáneos por debajo del cual se filtran las retransmisiones en directo | rango `0`–`5000`, paso `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | Cómo se tratan los vídeos/retransmisiones en directo filtrados (`hide` / `opacity`) | selector de dos botones | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | Activa/desactiva el filtro de recuento de visualizaciones (también activa/desactiva el control deslizante Min Views) | interruptor on/off | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | Activa/desactiva el filtro de directos (también activa/desactiva el control deslizante Min Concurrent) | interruptor on/off | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | Ocultar banners promocionales superiores | interruptor on/off | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | Ocultar listas Mix | interruptor on/off | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Ocultar Shorts | interruptor on/off | `true` | ショート動画非表示 | Hide Shorts |
| `forceOriginalAudio` | Forzar la pista de audio original (deshacer el doblaje automático) en las páginas de reproducción y en los Shorts | interruptor on/off | `true` | 元の音声に固定 | Force Original Audio |
| `channelAllowlist` | Canales que nunca se filtran (mostrar siempre), uno por línea; se comparan por @handle, ID o nombre | lista en área de texto | `[]` | 常に表示するチャンネル | Always-show channels |
| `channelBlocklist` | Canales que siempre se ocultan, uno por línea | lista en área de texto | `[]` | 常に非表示のチャンネル | Always-hide channels |
| `titleKeywords` | Ocultar los vídeos cuyo título contenga un término; las entradas `/…/` son expresiones regulares que no distinguen mayúsculas de minúsculas | lista en área de texto | `[]` | この語を含むタイトルを非表示 | Hide titles containing |
| `language` | Idioma de la interfaz del popup: `auto` + 9 configuraciones regionales (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`); **Auto** sigue el idioma de la interfaz del navegador (`navigator.language`) | selector desplegable | `auto` | Language | 言語 |

Ambos controles deslizantes muestran su valor con separador de millares mediante `toLocaleString()`. Una nota de ayuda aparece debajo del control deslizante Min Concurrent:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### Selector de modo de filtro

Un control de dos botones. **Hide** establece `filterMode = 'hide'`; **Opacity** establece `filterMode = 'opacity'`. El modo activo se resalta. Las etiquetas están localizadas — JA: 非表示 / 薄く表示, EN: Hide / Opacity.

### Selector de idioma

Un desplegable en la cabecera del popup establece `language` en `auto` o en una de las 9 configuraciones regionales (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`). **Auto** (el valor por defecto) resuelve el idioma efectivo de la interfaz a partir de `navigator.language`, asignándolo a la configuración regional compatible más cercana y recurriendo al inglés. Seleccionar un idioma concreto fija la interfaz en él sin importar la configuración del navegador.

## Cómo funciona

### Content script

- **Coincidencia y temporización** — coincide con `https://www.youtube.com/*` y se ejecuta en `run_at: document_end`.
- **Detección del idioma de la página** — en cada pasada lee `document.documentElement.lang` (con recurso a `navigator.language`, y luego a `'en'`) y lo usa para elegir un analizador de recuento de visualizaciones correcto para la configuración regional (consulta [Internacionalización](#internationalization)).
- **Objetivos** — escanea 7 selectores de vídeo que cubren Inicio (`ytd-rich-item-renderer`), Búsqueda (`ytd-video-renderer`), Barra lateral (`ytd-compact-video-renderer`), Canal (`ytd-grid-video-renderer`), listas Mix (`ytd-radio-renderer`), Shorts individuales (`ytd-reel-item-renderer`) y el estante de Shorts (`ytd-rich-shelf-renderer`); más 9 selectores de banner (`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer` y varias variantes `ytd-rich-section-renderer > #content > …`).
- **Gestión del feed dinámico** — un `MutationObserver` observa `document.body` con `{ childList: true, subtree: true }`. Cuando se añaden nodos, aplica un debounce con un `setTimeout` de **500 ms** (borrando y rearmando el temporizador en cada lote), de modo que el filtro se ejecuta 500 ms después de la última ráfaga de nodos añadidos. El filtro también se ejecuta una vez en la carga inicial y una vez justo después de cargar los ajustes.

  > ℹ️ Esto es un debounce de cola, no una limitación de frecuencia fija: bajo mutaciones continuas, la pasada se va aplazando. (El propio comentario en línea del código fuente, `// Run at most every 500ms`, describe una limitación de frecuencia y es ligeramente impreciso.)
- **Detección de Mix / Shorts** — las listas Mix se identifican mediante `start_radio=1`, `list=RD`, la insignia superpuesta `MIX` o `ytd-radio-renderer`; los Shorts mediante enlaces `/shorts/`, la insignia superpuesta `SHORTS`, `ytd-reel-item-renderer` y los estantes `ytd-rich-shelf-renderer`.
- **Ocultación de la sección padre del banner** — cuando un banner coincidente tiene un ancestro `closest('ytd-rich-section-renderer')`, se oculta toda la sección padre en lugar de solo el banner interior.

<a id="live-detection"></a>

El estado de directo se detecta a partir de las insignias del DOM (`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) o del propio texto del recuento de visualizaciones (que contenga, sin distinción de mayúsculas y minúsculas, `視聴中`, `watching`, `live` o `ライブ`, además de las palabras propias de directo de la configuración regional de la página activa — consulta [Internacionalización](#internationalization)).

<a id="internationalization"></a>

### Internacionalización

YouTube formatea los recuentos de visualizaciones/espectadores de forma distinta en cada idioma de la interfaz, por lo que el análisis de recuentos se basa en el **idioma detectado de la página de YouTube**, no en el idioma de la interfaz del popup. En cada pasada, el content script lee `document.documentElement.lang` (con recurso a `navigator.language`, y luego a `'en'`), lo normaliza a un código de idioma base (p. ej. `zh-Hans-CN` → `zh`, `es-419` → `es`) y selecciona una especificación por configuración regional que describe el separador decimal, el separador de millares, las unidades de abreviatura (p. ej. `K`/`M`/`B`, `万`/`億`, `Mio.`/`Mrd.`, `тыс.`/`млн`/`млрд`, `万`/`亿`), las palabras conectoras de "visualizaciones", los marcadores de fecha/retransmisión pasada, las palabras de retransmisión en directo y las palabras de "sin visualizaciones" → `0` de ese idioma.

El análisis correcto según la configuración regional es compatible con **9 idiomas**:

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

Si el idioma de la página no es ninguno de estos, el análisis recurre a una **especificación genérica permisiva** que usa `.` como decimal y reconoce una unión de unidades comunes (`K`/`M`/`B` y las unidades CJK/coreanas) según el mejor esfuerzo. Esta conciencia de la configuración regional corrige las lecturas erróneas del analizador anterior en las configuraciones regionales con coma decimal (`de` / `fr` / `ru` / `pt`), donde `1,7 Mrd.` se leía como `1` o `17` en lugar de `1.700.000.000`.

### Popup (React)

Un popup de React 19 (`src/entrypoints/popup/`) renderiza los controles deslizantes, los interruptores, el selector de modo de filtro y el selector de idioma de tres vías. Editar cualquier control escribe en el almacenamiento de inmediato. El popup resuelve su idioma de visualización efectivo a partir de `settings.language`: `auto` sigue `navigator.language`, mientras que `ja` / `en` lo fijan.

### Almacenamiento de ajustes y sincronización en vivo

- Los ajustes se persisten en `browser.storage.local` como **claves planas de nivel superior**: una clave por campo (`minViews`, `minConcurrent`, `filterMode`, …). Esto coincide con la forma de `chrome.storage.local` previa a WXT, de modo que los usuarios existentes conservan sus ajustes tras la migración.
- `loadSettings()` llama a `browser.storage.local.get(defaultSettings)`, fusionando los valores almacenados sobre los predeterminados; `saveSettings()` llama a `browser.storage.local.set(settings)`.
- `watchSettings()` registra un listener `browser.storage.onChanged`. Ante cualquier cambio en el área `local`, vuelve a leer el registro completo de ajustes y vuelve a ejecutar el filtro, que es la razón por la que las ediciones del popup se aplican al instante a las pestañas abiertas.

El tipo `Settings` tiene exactamente 9 campos: `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language` (`'auto' | 'ja' | 'en'`, por defecto `'auto'`).

### Análisis del recuento de visualizaciones

`parseViewCount(text, lang)` resuelve la especificación de configuración regional para el idioma de página dado (o la especificación genérica cuando el idioma es desconocido/se omite) y normaliza las variadas cadenas de recuento de YouTube en un número (o `null`). En todas las configuraciones regionales compatibles:

| Patrón de entrada | Tratamiento | Ejemplo |
|---|---|---|
| Unidades de abreviatura (por configuración regional) | multiplicadas por el factor de unidad de la configuración regional | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| Separadores decimales / de millares de la configuración regional | las configuraciones con coma decimal (`de`/`fr`/`ru`/`pt`) y con espacio como separador de millares (`fr`/`ru`) se analizan correctamente | `129.069 Aufrufe` (de) → `129069` |
| Palabras de "sin visualizaciones" (p. ej. `No views`, `なし`, equivalentes de la configuración regional) | devuelve `0` | `No views` → `0` |
| Números simples | se eliminan los separadores según la configuración regional y luego se analiza | `1,234` (en) → `1234` |
| Texto de fecha / retransmisión pasada | tratado como "no es un recuento", de modo que la tarjeta se deja intacta | `2 days ago`, `〜前` |
| No analizable | devuelve `null` (el elemento no se filtra por las reglas de recuento de visualizaciones) | — |

Antes del análisis, se eliminan las palabras clave de "visualizaciones"/conectoras de la configuración regional (p. ej. `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`). Los espacios en blanco — incluidos NBSP y narrow-NBSP tal como aparecen en las cadenas reales de YouTube — se normalizan primero. El ayudante `isLive(text, lang)` devuelve `true` (sin distinción de mayúsculas y minúsculas) cuando el texto contiene un marcador universal de directo (`視聴中`, `watching`, `live`, `ライブ`) o una de las palabras de retransmisión en directo de la configuración regional activa.

## Limitaciones conocidas

> ⚠️ El registro de depuración en `src/utils/filter.ts` está actualmente forzado a activado (`const debug = true`), por lo que el content script emite una salida de consola detallada. El registro de resumen `FILTERED` se emite incondicionalmente — está fuera de la guarda `debug` — por lo que aparece incluso si el indicador está desactivado.

## Desarrollo

### Requisitos previos

- **Node.js 20** (la versión que usa CI).
- npm (el repositorio incluye un `package-lock.json`).

### Instalación

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### Scripts de npm

| Script | Comando | Qué hace |
|---|---|---|
| `dev` | `wxt` | Inicia el servidor de desarrollo de WXT para Chrome (objetivo por defecto) con HMR. |
| `dev:firefox` | `wxt -b firefox` | Inicia el servidor de desarrollo de WXT con Firefox como objetivo. |
| `build` | `wxt build` | Compilación de producción para Chrome → `.output/chrome-mv3`. |
| `build:firefox` | `wxt build -b firefox` | Compilación de producción para Firefox → `.output/firefox-mv3`. |
| `zip` | `wxt zip` | Compila y empaqueta la extensión de Chrome en un zip distribuible en `.output/`. |
| `zip:firefox` | `wxt zip -b firefox` | Compila y empaqueta el zip de la extensión de Firefox en `.output/`. |
| `compile` | `wxt prepare && tsc --noEmit` | Genera los tipos de WXT y luego comprueba los tipos sin emitir. |
| `lint` | `eslint .` | Analiza todo el proyecto con ESLint (configuración flat de ESLint 9 en `eslint.config.js`). |
| `test` | `tsx test-parser.ts` | Ejecuta las pruebas del analizador de recuento de visualizaciones por configuración regional (`test-parser.ts`), que cubren el análisis de visualizaciones/espectadores y la detección de directos en los 9 idiomas compatibles. |

> ℹ️ `postinstall` ejecuta `wxt prepare` automáticamente después de `npm install` / `npm ci`.

Ejecuta `npm test` después de cambiar cualquier cosa en `src/utils/locales.ts` o `src/utils/parser.ts` — comprueba que cadenas reales de recuento de YouTube (incluidas las formas separadas por NBSP y con coma decimal) se analicen a los números esperados para English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어 y 简体中文.

### Estructura del proyecto

```text
TubeFilter/
├── src/
│   ├── entrypoints/
│   │   ├── content/
│   │   │   └── index.ts        # Content script: matches youtube.com, runs at document_end
│   │   └── popup/
│   │       ├── App.tsx          # React 19 popup UI
│   │       ├── main.tsx
│   │       ├── index.html
│   │       └── index.css
│   └── utils/
│       ├── filter.ts            # processVideoElement, processBannerElement
│       ├── parser.ts            # parseViewCount, isLive (locale-aware wrappers)
│       ├── locales.ts           # per-language LocaleSpec table + generic fallback, detectLang/parseCount
│       ├── storage.ts           # defaultSettings, loadSettings, watchSettings
│       └── types.ts             # Settings type
├── public/
│   └── icon/                    # 16.png, 48.png, 128.png
├── test-parser.ts               # `npm test` — locale parser tests for all 9 languages
├── wxt.config.ts                # srcDir: 'src', React module, manifestVersion: 3, manifest fields
├── tsconfig.json                # extends .wxt/tsconfig.json
├── eslint.config.js
├── postcss.config.js
├── tailwind.config.js
├── package.json
├── README.md
└── RELEASE_GUIDE.md
```

WXT está configurado con `srcDir: 'src'` y `modules: ['@wxt-dev/module-react']`. La lógica compartida se importa a través del alias `@/utils/...`. El manifest declara `permissions: ['storage']` y `host_permissions: ['https://www.youtube.com/*']`, con `name: 'TubeFilter'` y la descripción "Filter YouTube videos based on views and other metrics." `manifestVersion: 3` en `wxt.config.ts` es la única fuente de verdad que fuerza la salida MV3 para ambos objetivos.

`tsconfig.json` extiende el `./.wxt/tsconfig.json` generado por WXT y añade `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters` y `noFallthroughCasesInSwitch`.

## Compilación y publicación

### Salidas de compilación

| Objetivo | Directorio de salida |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Artefactos zip

`wxt zip` empaqueta la compilación en `.output/` usando la plantilla de nombre de archivo zip por defecto de WXT (`{{name}}-{{version}}-{{browser}}.zip`, donde `{{name}}` es el nombre `tube-filter` de `package.json`). No se define ninguna plantilla personalizada de `zipFileName`/`sources` en `wxt.config.ts`, por lo que los nombres siguientes siguen los valores por defecto de WXT:

- `tube-filter-<version>-chrome.zip` (p. ej. `tube-filter-1.0.0-chrome.zip`) — corroborado por el patrón de subida del workflow de publicación.
- `tube-filter-<version>-firefox.zip` (p. ej. `tube-filter-1.0.0-firefox.zip`) — corroborado por el patrón de subida del workflow de publicación.
- Un zip de fuentes para la revisión de AMO (el valor por defecto de WXT para el objetivo de Firefox, normalmente `tube-filter-<version>-sources.zip`). Este nombre es el valor por defecto de WXT y no está referenciado por ningún código del repositorio; ejecuta `npm run zip:firefox` para confirmar el nombre exacto del archivo en tu entorno.

### Workflow de publicación de GitHub Actions

`.github/workflows/release.yml` (llamado **Release**) se activa con el evento `release` de GitHub con `types: [published]` y tiene `permissions: contents: write`. El job se ejecuta en `ubuntu-latest` y:

1. Hace checkout del código (`actions/checkout@v4`).
2. Configura **Node.js 20** con caché de npm (`actions/setup-node@v4`).
3. Ejecuta `npm ci` (su `postinstall` ejecuta `wxt prepare`).
4. Ejecuta `npm run zip` (Chrome) y `npm run zip:firefox` (Firefox), produciendo ambos zips de navegador.
5. Los sube como activos de la release mediante `softprops/action-gh-release@v2` (protegido por `startsWith(github.ref, 'refs/tags/')`), haciendo coincidir `.output/tube-filter-*-chrome.zip` y `.output/tube-filter-*-firefox.zip`.

## Stack tecnológico

| Tecnología | Versión |
|---|---|
| [WXT](https://wxt.dev/) | `^0.20.26` |
| [React](https://react.dev/) + React DOM | `^19.2.0` |
| [TypeScript](https://www.typescriptlang.org/) | `~5.9.3` |
| [Tailwind CSS](https://tailwindcss.com/) | `^3.4.18` |
| `@wxt-dev/module-react` | `^1.2.2` |
| ESLint | `^9.39.1` |
| `typescript-eslint` | `^8.46.4` |
| autoprefixer | `^10.4.22` |
| postcss | `^8.5.6` |

El paquete es `tube-filter` v`1.0.0` (`private`, ESM `"type": "module"`); el nombre de visualización de la extensión se sobrescribe a **TubeFilter** en `wxt.config.ts`.

## Contribuir

Las contribuciones son bienvenidas. Antes de abrir un PR:

1. `npm ci` para instalar las dependencias (esto también genera los tipos de WXT).
2. `npm run lint` para revisar el código con ESLint.
3. `npm run compile` para comprobar los tipos (`wxt prepare && tsc --noEmit`).
4. `npm test` para ejecutar las pruebas del analizador por configuración regional (especialmente tras tocar `src/utils/locales.ts` o `src/utils/parser.ts`).
5. Prueba tus cambios en ambos objetivos con `npm run dev` y `npm run dev:firefox`.

## Licencia

No se ha especificado ninguna licencia para este proyecto, y no hay ningún archivo `LICENSE` presente en el repositorio. En ausencia de una licencia explícita, el código queda por defecto con **todos los derechos reservados**: no tienes permiso para reutilizarlo, redistribuirlo ni modificarlo. Si tienes intención de abrirlo, añade un archivo `LICENSE` que declare los términos.
