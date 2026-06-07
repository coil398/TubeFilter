# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** es una extensión Manifest V3 multinavegador que limpia tu feed de YouTube filtrando el contenido según los umbrales de número de visualizaciones y de espectadores en directo que tú controlas. Atenúa u oculta los vídeos con pocas visualizaciones y las retransmisiones en directo con pocos espectadores, y puede eliminar de forma independiente los banners promocionales superiores, las listas de Mix y los Shorts. La configuración reside en un popup de React, se aplica al instante en las pestañas de YouTube abiertas sin necesidad de recargar, y la interfaz del popup está disponible en **9 idiomas** (English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文) con un modo **Auto** que sigue el idioma de tu navegador. Los recuentos de visualizaciones/espectadores se interpretan teniendo en cuenta la configuración regional en los mismos **9 idiomas de página de YouTube**.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **Estado:** v1.0.0 — aún no publicada en la Chrome Web Store ni en AMO. Instálala mediante una compilación local sin empaquetar (consulta [Instalación](#installation-end-users)).

## De un vistazo

TubeFilter oculta o atenúa los elementos del feed de YouTube que quedan por debajo de los umbrales de visualizaciones/espectadores que estableces, y puede eliminar banners, listas de Mix y Shorts cuando lo solicites. Para probarla en tres pasos:

1. `npm ci`
2. `npm run build` (Chrome) o `npm run build:firefox` (Firefox)
3. Carga la compilación sin empaquetar desde `.output/chrome-mv3` (o `.output/firefox-mv3`) — consulta [Instalación](#installation-end-users).

Tu configuración nunca sale de tu navegador: TubeFilter solicita únicamente `storage` y acceso de host a `youtube.com`, y toda la configuración se mantiene en el almacenamiento local del navegador.

## Características

### Filtro de número de visualizaciones (vídeos normales)

Un vídeo normal se filtra cuando **todas** las siguientes condiciones son verdaderas:

- El filtro de vídeos está habilitado (`enableVideoFilter`).
- Se ha interpretado correctamente un número de visualizaciones a partir de la tarjeta.
- El número de visualizaciones interpretado está **por debajo** de tu umbral `minViews`.

Si un vídeo no tiene un número de visualizaciones interpretable, se deja intacto. El control deslizante **Min Views** del popup controla el umbral y se desactiva mientras el filtro de vídeos está apagado.

### Filtro de directos (retransmisiones en directo)

Las retransmisiones en directo se evalúan frente a un umbral **distinto** — espectadores simultáneos, no visualizaciones totales. Una retransmisión en directo se filtra cuando el filtro de directos está habilitado (`enableLiveFilter`), se ha interpretado un número de espectadores y ese número está **por debajo** de tu umbral `minConcurrent`. El estado de directo se detecta a partir de las insignias «en directo ahora» del DOM o del texto indicativo de directo en la cadena del número de visualizaciones (consulta [Cómo funciona](#live-detection)).

### Filtros de contenido (sin umbral)

Estos tres filtros son interruptores incondicionales de encendido/apagado — ignoran por completo los números de visualizaciones:

| Filtro | Ajuste | Qué elimina |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | Anuncios de cabecera promocionales y banners de declaración/promoción. Cuando un banner coincidente se encuentra dentro de una sección enriquecida, se oculta toda la sección padre. |
| **Mix Lists** | `enableMixFilter` | Listas de reproducción Mix / radio generadas automáticamente. |
| **Shorts** | `enableShortsFilter` | Enlaces y estanterías de Shorts. |

### Modos de filtrado: Ocultar vs. Opacidad

El selector **Filter Mode** decide cómo se tratan los vídeos/retransmisiones en directo filtrados:

- **Hide** — establece `display: none`, eliminando por completo el elemento de la vista.
- **Opacity** — establece `opacity: 0.1`, atenuando el elemento al **10 %** de opacidad sin dejar de mostrarlo. Es el valor predeterminado.

> ℹ️ El filtro Top Banner siempre oculta los banners (`display: none`) independientemente del modo de filtrado seleccionado. El modo de filtrado solo afecta a los vídeos y a las retransmisiones en directo.

### Precedencia de filtros

Cada tarjeta se clasifica una sola vez, usando un orden fijo if/else. Solo se aplica la regla de la primera categoría coincidente:

1. **Shorts** (máxima prioridad)
2. **Listas de Mix**
3. **Retransmisiones en directo**
4. **Vídeos normales**

### Desactivar el doblaje automático (forzar el audio original)

El doblaje automático de YouTube reemplaza el audio de un vídeo por una pista traducida por IA según tu idioma de interfaz — de modo que, de forma predeterminada, un vídeo en inglés se reproduce en japonés, alemán, etc. Con **Force Original Audio** (`forceOriginalAudio`, **activado de forma predeterminada**), TubeFilter detecta la pista de audio original y cambia el reproductor a ella automáticamente en todos los vídeos y Shorts, deshaciendo el doblaje automático.

- Funciona en vídeos `/watch` y en Shorts, y se vuelve a aplicar en cada navegación dentro de la aplicación.
- La pista original se identifica de forma **independiente del idioma** decodificando el id de la pista de audio del reproductor (los datos de la pista original contienen `original`; las pistas dobladas contienen `dubbed` / `dubbed-auto`).
- Se implementa mediante un **script de mundo MAIN** inyectado en la página — la API de audio del reproductor de YouTube no es accesible desde el mundo aislado del content script — con el ajuste puenteado desde el almacenamiento de la extensión.
- Desactívalo en cualquier momento en el popup para conservar el audio doblado de YouTube.

### Detección multilingüe del número de visualizaciones

YouTube muestra los recuentos de visualizaciones y de espectadores **de forma muy distinta según el idioma de la página** — no solo palabras traducidas, sino separadores decimales/de millares y unidades de abreviatura diferentes. El mismo recuento de ~1700 millones aparece como:

| Idioma | Cadena de YouTube |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

El content script detecta automáticamente el **idioma de la página de YouTube** (`document.documentElement.lang`) e interpreta los recuentos con el separador decimal, el separador de millares y las unidades de abreviatura correctos para esa configuración regional. Esto importa porque el analizador anterior asumía un formato de estilo inglés y **leía mal las configuraciones regionales con coma decimal** (`de` / `fr` / `ru` / `pt`) — por ejemplo, leyendo `1,7 Mrd.` como `1` o `17` en lugar de `1.700.000.000`. La interpretación correcta según la configuración regional es compatible con **9 idiomas** (consulta [Internacionalización](#internationalization)); los idiomas de página desconocidos recurren a un analizador genérico permisivo.

### Idiomas (interfaz del popup)

La interfaz del popup se ofrece en **9 idiomas** — English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文 — además de un modo **Auto (`auto`, predeterminado)** que sigue el idioma de la interfaz del navegador (`navigator.language`, asignado a la configuración regional compatible más cercana, con respaldo en inglés). Un menú desplegable en la cabecera del popup permite alternar entre ellos.

## Capturas de pantalla

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## Navegadores compatibles

| Navegador | Manifest | Notas |
|---|---|---|
| **Chrome / Chromium** | MV3 | Destino de compilación predeterminado; Chrome usa MV3 de forma predeterminada. |
| **Firefox** | MV3 | El directorio de salida es `.output/firefox-mv3`; MV3 se fuerza mediante `manifestVersion: 3` en `wxt.config.ts` (de lo contrario, Firefox usaría MV2 de forma predeterminada). |

> ℹ️ El content script se ejecuta en `https://www.youtube.com/*` en ambos navegadores. La compilación de Firefox lleva un `browser_specific_settings.gecko.id` de `tube-filter@coil398.github.io` (necesario para AMO MV3, inofensivo en Chrome).

## Instalación (usuarios finales)

Para ver el recorrido completo y compatible de publicación e instalación, consulta **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**.

Para cargar una compilación local sin empaquetar y probarla:

### Chrome / Chromium

1. Ejecuta `npm run build` para producir `.output/chrome-mv3`.
2. Abre `chrome://extensions`.
3. Activa el **Modo de desarrollador** (arriba a la derecha).
4. Haz clic en **Cargar descomprimida** y selecciona el directorio `.output/chrome-mv3`.

### Firefox

1. Ejecuta `npm run build:firefox` para producir `.output/firefox-mv3`.
2. Abre `about:debugging`.
3. Ve a **Este Firefox** → **Cargar complemento temporal…**.
4. Selecciona cualquier archivo dentro del directorio `.output/firefox-mv3` (por ejemplo, su `manifest.json`).

## Uso

Abre el popup de la extensión para ajustar el filtrado. Los cambios se guardan de inmediato y se aplican en vivo a cualquier pestaña de YouTube abierta — sin necesidad de recargar.

### Referencia de configuración

| Ajuste | Qué controla | Rango / paso | Predeterminado | JA label | EN label |
|---|---|---|---|---|---|
| `minViews` | Número mínimo de visualizaciones por debajo del cual se filtran los vídeos normales | rango `0`–`100000`, paso `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | Número mínimo de espectadores simultáneos por debajo del cual se filtran las retransmisiones en directo | rango `0`–`5000`, paso `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | Cómo se tratan los vídeos/retransmisiones en directo filtrados (`hide` / `opacity`) | selector de dos botones | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | Habilita/deshabilita el filtro de número de visualizaciones (también habilita/deshabilita el control deslizante Min Views) | interruptor encendido/apagado | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | Habilita/deshabilita el filtro de directos (también habilita/deshabilita el control deslizante Min Concurrent) | interruptor encendido/apagado | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | Oculta los banners promocionales superiores | interruptor encendido/apagado | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | Oculta las listas de Mix | interruptor encendido/apagado | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Oculta los Shorts | interruptor encendido/apagado | `true` | ショート動画非表示 | Hide Shorts |
| `forceOriginalAudio` | Fuerza la pista de audio original (deshace el doblaje automático) en las páginas de reproducción y en los Shorts | interruptor encendido/apagado | `true` | 元の音声に固定 | Force Original Audio |
| `language` | Idioma de la interfaz del popup: `auto` + 9 configuraciones regionales (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`); **Auto** sigue el idioma de la interfaz del navegador (`navigator.language`) | selector desplegable | `auto` | Language | 言語 |

Ambos controles deslizantes muestran su valor con separador de millares mediante `toLocaleString()`. Una nota de ayuda aparece debajo del control deslizante Min Concurrent:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### Selector de modo de filtrado

Un control de dos botones. **Hide** establece `filterMode = 'hide'`; **Opacity** establece `filterMode = 'opacity'`. El modo activo se resalta. Las etiquetas están localizadas — JA: 非表示 / 薄く表示, EN: Hide / Opacity.

### Selector de idioma

Un menú desplegable en la cabecera del popup establece `language` en `auto` o en una de las 9 configuraciones regionales (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`). **Auto** (el valor predeterminado) resuelve el idioma efectivo de la interfaz a partir de `navigator.language`, asignado a la configuración regional compatible más cercana y con respaldo en inglés. Seleccionar un idioma concreto fija la interfaz en él independientemente de la configuración del navegador.

## Cómo funciona

### Content script

- **Coincidencia y temporización** — coincide con `https://www.youtube.com/*` y se ejecuta en `run_at: document_end`.
- **Detección del idioma de la página** — en cada pasada lee `document.documentElement.lang` (con respaldo en `navigator.language` y luego en `'en'`) y lo usa para elegir un analizador del número de visualizaciones correcto según la configuración regional (consulta [Internacionalización](#internationalization)).
- **Objetivos** — escanea 7 selectores de vídeo que cubren la página de Inicio (`ytd-rich-item-renderer`), Búsqueda (`ytd-video-renderer`), Barra lateral (`ytd-compact-video-renderer`), Canal (`ytd-grid-video-renderer`), listas de Mix (`ytd-radio-renderer`), Shorts individuales (`ytd-reel-item-renderer`) y la estantería de Shorts (`ytd-rich-shelf-renderer`); además de 9 selectores de banner (`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer` y varias variantes de `ytd-rich-section-renderer > #content > …`).
- **Gestión del feed dinámico** — un `MutationObserver` observa `document.body` con `{ childList: true, subtree: true }`. Cuando se añaden nodos, aplica un debounce con un `setTimeout` de **500 ms** (borrando y rearmando el temporizador en cada lote), de modo que el filtro se ejecuta 500 ms después de la última ráfaga de nodos añadidos. El filtro también se ejecuta una vez en la carga inicial y una vez justo después de cargar la configuración.

  > ℹ️ Se trata de un debounce de cola, no de un throttle fijo: bajo mutaciones continuas, la pasada se sigue aplazando. (El propio comentario en línea del código fuente, `// Run at most every 500ms`, describe un throttling y es ligeramente impreciso.)
- **Detección de Mix / Shorts** — las listas de Mix se identifican mediante `start_radio=1`, `list=RD`, la insignia superpuesta `MIX` o `ytd-radio-renderer`; los Shorts mediante enlaces `/shorts/`, la insignia superpuesta `SHORTS`, `ytd-reel-item-renderer` y las estanterías `ytd-rich-shelf-renderer`.
- **Ocultación de la sección padre del banner** — cuando un banner coincidente tiene un ancestro `closest('ytd-rich-section-renderer')`, se oculta toda la sección padre en lugar de solo el banner interior.

<a id="live-detection"></a>

El estado de directo se detecta a partir de las insignias del DOM (`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) o a partir del propio texto del número de visualizaciones (que contenga, sin distinguir mayúsculas/minúsculas, `視聴中`, `watching`, `live` o `ライブ`, además de las propias palabras de directo de la configuración regional activa de la página — consulta [Internacionalización](#internationalization)).

<a id="internationalization"></a>

### Internacionalización

YouTube formatea los recuentos de visualizaciones/espectadores de forma distinta en cada idioma de interfaz, por lo que la interpretación de los recuentos se rige por el **idioma de la página de YouTube detectado**, no por el idioma de la interfaz del popup. En cada pasada, el content script lee `document.documentElement.lang` (con respaldo en `navigator.language` y luego en `'en'`), lo normaliza a un código de idioma base (por ejemplo, `zh-Hans-CN` → `zh`, `es-419` → `es`) y selecciona una especificación por configuración regional que describe el separador decimal, el separador de millares, las unidades de abreviatura (por ejemplo, `K`/`M`/`B`, `万`/`億`, `Mio.`/`Mrd.`, `тыс.`/`млн`/`млрд`, `万`/`亿`), las palabras conectoras de «views», los marcadores de fecha/retransmisión pasada, las palabras de retransmisión en directo y las palabras de «no views» → `0` de ese idioma.

La interpretación correcta según la configuración regional es compatible con **9 idiomas**:

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

Si el idioma de la página no es ninguno de estos, la interpretación recurre a una **especificación genérica permisiva** que usa `.` como decimal y reconoce una unión de unidades comunes (`K`/`M`/`B` y las unidades CJK/coreanas) según el mejor esfuerzo posible. Esta conciencia de la configuración regional corrige las lecturas erróneas del analizador anterior en las configuraciones regionales con coma decimal (`de` / `fr` / `ru` / `pt`), donde `1,7 Mrd.` se leía como `1` o `17` en lugar de `1.700.000.000`.

### Popup (React)

Un popup de React 19 (`src/entrypoints/popup/`) renderiza los controles deslizantes, los interruptores, el selector de modo de filtrado y el selector de idioma de tres vías. Editar cualquier control escribe en el almacenamiento de inmediato. El popup resuelve su idioma de visualización efectivo a partir de `settings.language`: `auto` sigue `navigator.language`, mientras que `ja` / `en` lo fijan.

### Almacenamiento de la configuración y sincronización en vivo

- La configuración se persiste en `browser.storage.local` como **claves planas de nivel superior** — una clave por campo (`minViews`, `minConcurrent`, `filterMode`, …). Esto coincide con la forma de `chrome.storage.local` previa a WXT, de modo que los usuarios existentes conservan su configuración tras la migración.
- `loadSettings()` llama a `browser.storage.local.get(defaultSettings)`, fusionando los valores almacenados sobre los predeterminados; `saveSettings()` llama a `browser.storage.local.set(settings)`.
- `watchSettings()` registra un listener de `browser.storage.onChanged`. Ante cualquier cambio en el área `local`, vuelve a leer el registro completo de la configuración y vuelve a ejecutar el filtro — por eso las ediciones del popup se aplican al instante en las pestañas abiertas.

El tipo `Settings` tiene exactamente 9 campos: `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language` (`'auto' | 'ja' | 'en'`, predeterminado `'auto'`).

### Interpretación del número de visualizaciones

`parseViewCount(text, lang)` resuelve la especificación de configuración regional para el idioma de página dado (o la especificación genérica cuando el idioma es desconocido/se omite) y normaliza las variadas cadenas de recuento de YouTube en un número (o `null`). En todas las configuraciones regionales compatibles:

| Patrón de entrada | Tratamiento | Ejemplo |
|---|---|---|
| Unidades de abreviatura (por configuración regional) | multiplicado por el factor de unidad de la configuración regional | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| Separadores decimales / de millares de la configuración regional | las configuraciones regionales con coma decimal (`de`/`fr`/`ru`/`pt`) y con espacio como separador de millares (`fr`/`ru`) se interpretan correctamente | `129.069 Aufrufe` (de) → `129069` |
| Palabras de «no views» (por ejemplo, `No views`, `なし`, equivalentes según la configuración regional) | devuelve `0` | `No views` → `0` |
| Números simples | separadores eliminados según la configuración regional, luego interpretados | `1,234` (en) → `1234` |
| Texto de fecha / retransmisión pasada | tratado como «no es un recuento», por lo que la tarjeta se deja intacta | `2 days ago`, `〜前` |
| No interpretable | devuelve `null` (el elemento no se filtra por las reglas del número de visualizaciones) | — |

Antes de la interpretación, se eliminan las palabras clave de «views»/conectoras de la configuración regional (por ejemplo, `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`). Los espacios en blanco — incluidos NBSP y narrow-NBSP tal como aparecen en las cadenas reales de YouTube — se normalizan primero. El helper `isLive(text, lang)` devuelve `true` (sin distinguir mayúsculas/minúsculas) cuando el texto contiene un marcador universal de directo (`視聴中`, `watching`, `live`, `ライブ`) o una de las palabras de retransmisión en directo de la configuración regional activa.

## Limitaciones conocidas

> ⚠️ El registro de depuración en `src/utils/filter.ts` está actualmente fijado en encendido (`const debug = true`), por lo que el content script emite una salida de consola detallada. El registro de resumen `FILTERED` se emite de forma incondicional — está fuera de la protección `debug` — por lo que aparece incluso si el indicador está apagado.

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
| `dev` | `wxt` | Inicia el servidor de desarrollo de WXT para Chrome (destino predeterminado) con HMR. |
| `dev:firefox` | `wxt -b firefox` | Inicia el servidor de desarrollo de WXT con destino Firefox. |
| `build` | `wxt build` | Compilación de producción para Chrome → `.output/chrome-mv3`. |
| `build:firefox` | `wxt build -b firefox` | Compilación de producción para Firefox → `.output/firefox-mv3`. |
| `zip` | `wxt zip` | Compila y empaqueta la extensión de Chrome en un zip distribuible en `.output/`. |
| `zip:firefox` | `wxt zip -b firefox` | Compila y empaqueta el zip de la extensión de Firefox en `.output/`. |
| `compile` | `wxt prepare && tsc --noEmit` | Genera los tipos de WXT y luego comprueba los tipos sin emitir. |
| `lint` | `eslint .` | Analiza todo el proyecto (configuración flat de ESLint 9 en `eslint.config.js`). |
| `test` | `tsx test-parser.ts` | Ejecuta las pruebas del analizador del número de visualizaciones por configuración regional (`test-parser.ts`), cubriendo la interpretación de visualizaciones/espectadores y la detección de directos en los 9 idiomas compatibles. |

> ℹ️ `postinstall` ejecuta `wxt prepare` automáticamente después de `npm install` / `npm ci`.

Ejecuta `npm test` tras cambiar cualquier cosa en `src/utils/locales.ts` o `src/utils/parser.ts` — comprueba que las cadenas reales de recuento de YouTube (incluidas las formas separadas por NBSP y con coma decimal) se interpretan como los números esperados para English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어 y 简体中文.

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

WXT está configurado con `srcDir: 'src'` y `modules: ['@wxt-dev/module-react']`. La lógica compartida se importa mediante el alias `@/utils/...`. El manifest declara `permissions: ['storage']` y `host_permissions: ['https://www.youtube.com/*']`, con `name: 'TubeFilter'` y la descripción "Filter YouTube videos based on views and other metrics." `manifestVersion: 3` en `wxt.config.ts` es la única fuente de verdad que fuerza la salida MV3 para ambos destinos.

`tsconfig.json` extiende el `./.wxt/tsconfig.json` generado por WXT y añade `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters` y `noFallthroughCasesInSwitch`.

## Compilación y publicación

### Salidas de compilación

| Destino | Directorio de salida |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Artefactos zip

`wxt zip` empaqueta la compilación en `.output/` usando la plantilla de nombre de archivo zip predeterminada de WXT (`{{name}}-{{version}}-{{browser}}.zip`, donde `{{name}}` es el nombre `tube-filter` de `package.json`). No se establece ninguna plantilla personalizada de `zipFileName`/`sources` en `wxt.config.ts`, por lo que los nombres siguientes siguen los valores predeterminados de WXT:

- `tube-filter-<version>-chrome.zip` (por ejemplo, `tube-filter-1.0.0-chrome.zip`) — corroborado por el glob de subida del workflow de publicación.
- `tube-filter-<version>-firefox.zip` (por ejemplo, `tube-filter-1.0.0-firefox.zip`) — corroborado por el glob de subida del workflow de publicación.
- Un zip de fuentes para la revisión de AMO (el valor predeterminado de WXT para el destino Firefox, normalmente `tube-filter-<version>-sources.zip`). Este nombre es el predeterminado de WXT y no se referencia en ningún código del repositorio; ejecuta `npm run zip:firefox` para confirmar el nombre de archivo exacto en tu entorno.

### Workflow de publicación de GitHub Actions

`.github/workflows/release.yml` (llamado **Release**) se activa con el evento `release` de GitHub con `types: [published]` y tiene `permissions: contents: write`. El job se ejecuta en `ubuntu-latest` y:

1. Hace checkout del código (`actions/checkout@v4`).
2. Configura **Node.js 20** con caché de npm (`actions/setup-node@v4`).
3. Ejecuta `npm ci` (su `postinstall` ejecuta `wxt prepare`).
4. Ejecuta `npm run zip` (Chrome) y `npm run zip:firefox` (Firefox), produciendo ambos zips de navegador.
5. Los sube como activos de la publicación mediante `softprops/action-gh-release@v2` (protegido por `startsWith(github.ref, 'refs/tags/')`), coincidiendo con `.output/tube-filter-*-chrome.zip` y `.output/tube-filter-*-firefox.zip`.

## Pila tecnológica

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
2. `npm run lint` para comprobar el código con ESLint.
3. `npm run compile` para comprobar los tipos (`wxt prepare && tsc --noEmit`).
4. `npm test` para ejecutar las pruebas del analizador por configuración regional (especialmente tras tocar `src/utils/locales.ts` o `src/utils/parser.ts`).
5. Prueba tus cambios en ambos destinos con `npm run dev` y `npm run dev:firefox`.

## Licencia

No se ha especificado ninguna licencia para este proyecto, y no hay ningún archivo `LICENSE` presente en el repositorio. A falta de una licencia explícita, el código queda **reservado todos los derechos** de forma predeterminada — no tienes permiso para reutilizarlo, redistribuirlo ni modificarlo. Si tienes la intención de abrirlo, añade un archivo `LICENSE` que declare los términos.
