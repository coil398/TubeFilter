# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** ist eine browserübergreifende Manifest-V3-Erweiterung, die deinen YouTube-Feed aufräumt, indem sie Inhalte anhand von Schwellenwerten für Aufrufzahlen und Live-Zuschauer filtert, die du selbst festlegst. Sie blendet Videos mit wenigen Aufrufen und Livestreams mit wenigen Zuschauern aus oder dimmt sie und kann unabhängig davon werbliche Top-Banner, Mix-Listen und Shorts entfernen. Die Einstellungen befinden sich in einem React-Popup, gelten sofort für geöffnete YouTube-Tabs ohne Neuladen, und die Popup-Oberfläche ist auf Japanisch und Englisch verfügbar (plus ein **Auto**-Modus, der der Sprache deines Browsers folgt). Aufruf- und Zuschauerzahlen werden gebietsschemabewusst über **9 YouTube-Seitensprachen** hinweg ausgewertet.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **Status:** v1.0.0 — noch nicht im Chrome Web Store oder bei AMO veröffentlicht. Installation über einen lokalen, entpackten Build (siehe [Installation](#installation-end-users)).

## Auf einen Blick

TubeFilter blendet YouTube-Feed-Elemente aus oder dimmt sie, wenn sie unter die von dir festgelegten Schwellenwerte für Aufrufe/Zuschauer fallen, und kann Banner, Mix-Listen und Shorts bei Bedarf entfernen. So probierst du es in drei Schritten aus:

1. `npm ci`
2. `npm run build` (Chrome) oder `npm run build:firefox` (Firefox)
3. Lade den entpackten Build aus `.output/chrome-mv3` (oder `.output/firefox-mv3`) — siehe [Installation](#installation-end-users).

Deine Einstellungen verlassen niemals deinen Browser: TubeFilter fordert lediglich `storage` und Host-Zugriff auf `youtube.com` an, und die gesamte Konfiguration wird im lokalen Browser-Speicher gehalten.

## Funktionen

### Aufrufzahlen-Filter (reguläre Videos)

Ein reguläres Video wird gefiltert, wenn **alle** der folgenden Bedingungen zutreffen:

- Der Videofilter ist aktiviert (`enableVideoFilter`).
- Eine Aufrufzahl konnte erfolgreich aus der Karte ausgelesen werden.
- Die ausgelesene Aufrufzahl liegt **unter** deinem `minViews`-Schwellenwert.

Wenn ein Video keine auslesbare Aufrufzahl hat, bleibt es unangetastet. Der Schieberegler **Min Views** im Popup steuert den Schwellenwert und ist deaktiviert, solange der Videofilter ausgeschaltet ist.

### Live-Filter (Livestreams)

Livestreams werden gegen einen **separaten** Schwellenwert ausgewertet — gleichzeitige Zuschauer, nicht Gesamtaufrufe. Ein Livestream wird gefiltert, wenn der Live-Filter aktiviert ist (`enableLiveFilter`), eine Zuschauerzahl ausgelesen wurde und diese Zahl **unter** deinem `minConcurrent`-Schwellenwert liegt. Der Live-Status wird aus DOM-„Jetzt live"-Badges oder aus live-anzeigendem Text in der Aufrufzahlen-Zeichenkette erkannt (siehe [Funktionsweise](#live-detection)).

### Inhaltsfilter (ohne Schwellenwert)

Diese drei Filter sind bedingungslose Ein/Aus-Schalter — sie ignorieren Aufrufzahlen vollständig:

| Filter | Einstellung | Was er entfernt |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | Werbliche Masthead-Anzeigen sowie Statement-/Promo-Banner. Wenn ein passendes Banner innerhalb eines Rich-Abschnitts sitzt, wird der gesamte übergeordnete Abschnitt ausgeblendet. |
| **Mix Lists** | `enableMixFilter` | Automatisch generierte Mix-/Radio-Playlists. |
| **Shorts** | `enableShortsFilter` | Shorts-Links und -Regale. |

### Filtermodi: Ausblenden vs. Transparenz

Der Selektor **Filter Mode** entscheidet, wie gefilterte Videos/Livestreams behandelt werden:

- **Hide** — setzt `display: none` und entfernt das Element vollständig aus der Ansicht.
- **Opacity** — setzt `opacity: 0.1` und dimmt das Element auf **10 %** Deckkraft, während es sichtbar bleibt. Dies ist die Standardeinstellung.

> ℹ️ Der Top-Banner-Filter blendet Banner unabhängig vom gewählten Filtermodus immer aus (`display: none`). Der Filtermodus betrifft nur Videos und Livestreams.

### Filter-Vorrang

Jede Karte wird einmal klassifiziert, unter Verwendung einer festen if/else-Reihenfolge. Nur die Regel der ersten passenden Kategorie wird angewendet:

1. **Shorts** (höchste Priorität)
2. **Mix-Listen**
3. **Livestreams**
4. **Reguläre Videos**

### Mehrsprachige Aufrufzahlen-Erkennung

YouTube stellt Aufruf- und Zuschauerzahlen **je nach Seitensprache sehr unterschiedlich** dar — nicht nur übersetzte Wörter, sondern auch unterschiedliche Dezimal-/Tausendertrennzeichen und Abkürzungseinheiten. Dieselbe Zahl von etwa 1,7 Milliarden erscheint als:

| Sprache | YouTube-Zeichenkette |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

Das Content-Script erkennt automatisch die **YouTube-Seitensprache** (`document.documentElement.lang`) und liest Zahlen mit dem korrekten Dezimaltrennzeichen, Tausendertrennzeichen und den Abkürzungseinheiten für dieses Gebietsschema aus. Das ist wichtig, weil der bisherige Parser ein englisches Format annahm und Gebietsschemata mit Komma-Dezimaltrennzeichen (`de` / `fr` / `ru` / `pt`) **falsch las** — z. B. `1,7 Mrd.` als `1` oder `17` statt `1.700.000.000`. Gebietsschemakorrektes Auslesen wird für **9 Sprachen** unterstützt (siehe [Internationalisierung](#internationalization)); unbekannte Seitensprachen greifen auf einen toleranten generischen Parser zurück.

### Sprachen (Popup-Oberfläche)

Die Popup-Oberfläche wird auf **Japanisch (`ja`)** und **Englisch (`en`)** angeboten, mit einem dritten **Auto-Modus (`auto`, Standard)**, der der Browser-Oberflächensprache (`navigator.language`) folgt: Beginnt die Browsersprache mit `ja`, wird die Oberfläche auf Japanisch dargestellt, andernfalls auf Englisch. Ein Drei-Tasten-Steuerelement in der Popup-Kopfzeile (`Auto` / `日本語` / `EN`) wechselt zwischen ihnen, wobei die aktive Auswahl hervorgehoben wird.

## Screenshots

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## Unterstützte Browser

| Browser | Manifest | Hinweise |
|---|---|---|
| **Chrome / Chromium** | MV3 | Standard-Build-Ziel; Chrome ist standardmäßig MV3. |
| **Firefox** | MV3 | Ausgabeverzeichnis ist `.output/firefox-mv3`; MV3 wird über `manifestVersion: 3` in `wxt.config.ts` erzwungen (Firefox würde andernfalls standardmäßig MV2 verwenden). |

> ℹ️ Das Content-Script läuft in beiden Browsern auf `https://www.youtube.com/*`. Der Firefox-Build trägt eine `browser_specific_settings.gecko.id` von `tube-filter@coil398.github.io` (für AMO MV3 erforderlich, in Chrome unschädlich).

## Installation (Endbenutzer)

Die vollständige, unterstützte Anleitung zum Releasen und Installieren findest du in **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**.

So lädst du einen lokalen, entpackten Build zum Testen:

### Chrome / Chromium

1. Führe `npm run build` aus, um `.output/chrome-mv3` zu erzeugen.
2. Öffne `chrome://extensions`.
3. Aktiviere den **Entwicklermodus** (oben rechts).
4. Klicke auf **Entpackt laden** und wähle das Verzeichnis `.output/chrome-mv3`.

### Firefox

1. Führe `npm run build:firefox` aus, um `.output/firefox-mv3` zu erzeugen.
2. Öffne `about:debugging`.
3. Gehe zu **Dieser Firefox** → **Temporäres Add-on laden…**.
4. Wähle eine beliebige Datei innerhalb des Verzeichnisses `.output/firefox-mv3` (z. B. dessen `manifest.json`).

## Verwendung

Öffne das Popup der Erweiterung, um die Filterung anzupassen. Änderungen werden sofort gespeichert und live auf jeden geöffneten YouTube-Tab angewendet — kein Neuladen erforderlich.

### Einstellungsreferenz

| Einstellung | Was sie steuert | Bereich / Schritt | Standard | JA-Bezeichnung | EN-Bezeichnung |
|---|---|---|---|---|---|
| `minViews` | Mindestanzahl an Aufrufen, unterhalb derer reguläre Videos gefiltert werden | Bereich `0`–`100000`, Schritt `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | Mindestanzahl gleichzeitiger Zuschauer, unterhalb derer Livestreams gefiltert werden | Bereich `0`–`5000`, Schritt `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | Wie gefilterte Videos/Livestreams behandelt werden (`hide` / `opacity`) | Zwei-Tasten-Selektor | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | Aktiviert/deaktiviert den Aufrufzahlen-Filter (aktiviert/deaktiviert auch den Min-Views-Schieberegler) | Ein/Aus-Schalter | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | Aktiviert/deaktiviert den Live-Filter (aktiviert/deaktiviert auch den Min-Concurrent-Schieberegler) | Ein/Aus-Schalter | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | Blendet werbliche Top-Banner aus | Ein/Aus-Schalter | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | Blendet Mix-Listen aus | Ein/Aus-Schalter | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Blendet Shorts aus | Ein/Aus-Schalter | `true` | ショート動画非表示 | Hide Shorts |
| `language` | Sprache der Popup-Oberfläche (`auto` / `ja` / `en`); **Auto** folgt der Browser-Oberflächensprache (`navigator.language`) | Drei-Tasten-Selektor (`Auto` / `日本語` / `EN`) | `auto` | Language | 言語 |

Beide Schieberegler zeigen ihren Wert mit Tausendertrennzeichen über `toLocaleString()` an. Ein Hinweistext steht unter dem Min-Concurrent-Schieberegler:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### Filtermodus-Selektor

Ein Zwei-Tasten-Steuerelement. **Hide** setzt `filterMode = 'hide'`; **Opacity** setzt `filterMode = 'opacity'`. Der aktive Modus wird hervorgehoben. Die Bezeichnungen sind lokalisiert — JA: 非表示 / 薄く表示, EN: Hide / Opacity.

### Sprachauswahl

Ein Drei-Tasten-Steuerelement in der Popup-Kopfzeile setzt `language` auf einen der Werte `auto`, `ja` oder `en`. Die Schaltflächen lauten **Auto** / **日本語** / **EN**, und die aktive Auswahl wird hervorgehoben. **Auto** (der Standard) ermittelt die effektive Oberflächensprache aus `navigator.language`: Eine Browsersprache, die mit `ja` beginnt, stellt die Oberfläche auf Japanisch dar, alles andere auf Englisch. Die Auswahl von **日本語** oder **EN** fixiert die Oberfläche unabhängig von der Browsereinstellung auf diese Sprache.

## Funktionsweise

### Content-Script

- **Übereinstimmung & Timing** — passt auf `https://www.youtube.com/*` und läuft bei `run_at: document_end`.
- **Erkennung der Seitensprache** — bei jedem Durchlauf liest es `document.documentElement.lang` (mit Rückfall auf `navigator.language`, dann `'en'`) und verwendet dies, um einen gebietsschemakorrekten Aufrufzahlen-Parser auszuwählen (siehe [Internationalisierung](#internationalization)).
- **Ziele** — scannt 7 Video-Selektoren, die Startseite (`ytd-rich-item-renderer`), Suche (`ytd-video-renderer`), Seitenleiste (`ytd-compact-video-renderer`), Kanal (`ytd-grid-video-renderer`), Mix-Listen (`ytd-radio-renderer`), einzelne Shorts (`ytd-reel-item-renderer`) und das Shorts-Regal (`ytd-rich-shelf-renderer`) abdecken; plus 9 Banner-Selektoren (`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer` sowie mehrere `ytd-rich-section-renderer > #content > …`-Varianten).
- **Behandlung dynamischer Feeds** — ein `MutationObserver` beobachtet `document.body` mit `{ childList: true, subtree: true }`. Wenn Knoten hinzugefügt werden, entprellt er mit einem **500 ms**-`setTimeout` (wobei der Timer bei jeder Charge gelöscht und neu gestartet wird), sodass der Filter 500 ms nach dem letzten Schub hinzugefügter Knoten läuft. Der Filter läuft außerdem einmal beim ersten Laden und einmal direkt nach dem Laden der Einstellungen.

  > ℹ️ Dies ist ein nachlaufendes Entprellen (Trailing Debounce), kein festes Throttling: Bei kontinuierlichen Mutationen wird der Durchlauf immer weiter aufgeschoben. (Der Inline-Kommentar im Quellcode selbst, `// Run at most every 500ms`, beschreibt Throttling und ist etwas ungenau.)
- **Mix-/Shorts-Erkennung** — Mix-Listen werden über `start_radio=1`, `list=RD`, das `MIX`-Overlay-Badge oder `ytd-radio-renderer` erkannt; Shorts über `/shorts/`-Links, das `SHORTS`-Overlay-Badge, `ytd-reel-item-renderer` und `ytd-rich-shelf-renderer`-Regale.
- **Ausblenden des übergeordneten Banner-Abschnitts** — wenn ein passendes Banner einen `closest('ytd-rich-section-renderer')`-Vorfahren hat, wird der gesamte übergeordnete Abschnitt ausgeblendet, statt nur das innere Banner.

<a id="live-detection"></a>

Der Live-Status wird aus DOM-Badges (`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) oder aus dem Aufrufzahlen-Text selbst erkannt (der case-insensitiv `視聴中`, `watching`, `live` oder `ライブ` enthält, zuzüglich der eigenen Live-Schlüsselwörter des aktiven Seiten-Gebietsschemas — siehe [Internationalisierung](#internationalization)).

<a id="internationalization"></a>

### Internationalisierung

YouTube formatiert Aufruf-/Zuschauerzahlen in jeder Oberflächensprache anders, daher wird das Auslesen der Zahlen von der **erkannten YouTube-Seitensprache** gesteuert, nicht von der Popup-Oberflächensprache. Bei jedem Durchlauf liest das Content-Script `document.documentElement.lang` (mit Rückfall auf `navigator.language`, dann `'en'`), normalisiert dies zu einem Basissprachcode (z. B. `zh-Hans-CN` → `zh`, `es-419` → `es`) und wählt eine gebietsschemaspezifische Spezifikation, die das Dezimaltrennzeichen, Tausendertrennzeichen, die Abkürzungseinheiten (z. B. `K`/`M`/`B`, `万`/`億`, `Mio.`/`Mrd.`, `тыс.`/`млн`/`млрд`, `万`/`亿`), die „Aufrufe"-Verbindungswörter, die Datums-/Vergangenheitsstream-Marker, die Livestream-Wörter und die „keine Aufrufe" → `0`-Wörter dieser Sprache beschreibt.

Gebietsschemakorrektes Auslesen wird für **9 Sprachen** unterstützt:

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

Ist die Seitensprache keine dieser Sprachen, greift das Auslesen auf eine **tolerante generische Spezifikation** zurück, die einen `.` als Dezimaltrennzeichen verwendet und nach bestem Bemühen eine Vereinigung gängiger Einheiten (`K`/`M`/`B` sowie die CJK-/Korea-Einheiten) erkennt. Diese Gebietsschemabewusstheit behebt die früheren Fehllesungen des Parsers bei Gebietsschemata mit Komma-Dezimaltrennzeichen (`de` / `fr` / `ru` / `pt`), bei denen `1,7 Mrd.` als `1` oder `17` statt `1.700.000.000` gelesen wurde.

### Popup (React)

Ein React-19-Popup (`src/entrypoints/popup/`) rendert die Schieberegler, Schalter, den Filtermodus-Selektor und den dreifachen Sprachselektor. Das Bearbeiten eines beliebigen Steuerelements schreibt sofort in den Speicher. Das Popup ermittelt seine effektive Anzeigesprache aus `settings.language`: `auto` folgt `navigator.language`, während `ja` / `en` sie fixieren.

### Einstellungsspeicherung & Live-Synchronisation

- Die Einstellungen werden in `browser.storage.local` als **flache Top-Level-Schlüssel** persistiert — ein Schlüssel pro Feld (`minViews`, `minConcurrent`, `filterMode`, …). Dies entspricht der Pre-WXT-`chrome.storage.local`-Struktur, sodass bestehende Nutzer ihre Einstellungen über die Migration hinweg behalten.
- `loadSettings()` ruft `browser.storage.local.get(defaultSettings)` auf und mischt gespeicherte Werte über die Standardwerte; `saveSettings()` ruft `browser.storage.local.set(settings)` auf.
- `watchSettings()` registriert einen `browser.storage.onChanged`-Listener. Bei jeder Änderung im Bereich `local` liest es den vollständigen Einstellungsdatensatz neu und führt den Filter erneut aus — weshalb Popup-Bearbeitungen sofort auf geöffnete Tabs angewendet werden.

Der Typ `Settings` hat genau 9 Felder: `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language` (`'auto' | 'ja' | 'en'`, Standard `'auto'`).

### Aufrufzahlen-Auslesen

`parseViewCount(text, lang)` ermittelt die Gebietsschema-Spezifikation für die gegebene Seitensprache (oder die generische Spezifikation, wenn die Sprache unbekannt/weggelassen ist) und normalisiert die unterschiedlichen Zahlen-Zeichenketten von YouTube zu einer Zahl (oder `null`). Über alle unterstützten Gebietsschemata hinweg:

| Eingabemuster | Behandlung | Beispiel |
|---|---|---|
| Abkürzungseinheiten (je Gebietsschema) | multipliziert mit dem Einheitenfaktor des Gebietsschemas | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| Gebietsschema-Dezimal-/Tausendertrennzeichen | Gebietsschemata mit Komma-Dezimaltrennzeichen (`de`/`fr`/`ru`/`pt`) und solche mit Leerzeichen-Tausendertrennzeichen (`fr`/`ru`) werden korrekt ausgelesen | `129.069 Aufrufe` (de) → `129069` |
| „Keine Aufrufe"-Wörter (z. B. `No views`, `なし`, Gebietsschema-Entsprechungen) | gibt `0` zurück | `No views` → `0` |
| Reine Zahlen | Trennzeichen je Gebietsschema entfernt, dann ausgelesen | `1,234` (en) → `1234` |
| Datums-/Vergangenheitsstream-Text | als „keine Zahl" behandelt, sodass die Karte unangetastet bleibt | `2 days ago`, `〜前` |
| Nicht auslesbar | gibt `null` zurück (Element wird nicht durch Aufrufzahlen-Regeln gefiltert) | — |

Vor dem Auslesen werden die „Aufrufe"-/Verbindungsschlüsselwörter des Gebietsschemas (z. B. `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`) entfernt. Leerzeichen — einschließlich NBSP und Narrow-NBSP, wie sie in echten YouTube-Zeichenketten vorkommen — werden zuerst normalisiert. Der Helfer `isLive(text, lang)` gibt `true` zurück (case-insensitiv), wenn der Text einen universellen Live-Marker (`視聴中`, `watching`, `live`, `ライブ`) oder eines der Livestream-Wörter des aktiven Gebietsschemas enthält.

## Bekannte Einschränkungen

> ⚠️ Das Debug-Logging in `src/utils/filter.ts` ist derzeit fest auf an codiert (`const debug = true`), sodass das Content-Script ausführliche Konsolenausgaben erzeugt. Das `FILTERED`-Zusammenfassungslog wird bedingungslos ausgegeben — es liegt außerhalb der `debug`-Absicherung — und erscheint daher auch, wenn das Flag ausgeschaltet ist.

## Entwicklung

### Voraussetzungen

- **Node.js 20** (die von der CI verwendete Version).
- npm (das Repo liefert eine `package-lock.json` mit).

### Installation

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### npm-Skripte

| Skript | Befehl | Was es tut |
|---|---|---|
| `dev` | `wxt` | Startet den WXT-Dev-Server für Chrome (Standardziel) mit HMR. |
| `dev:firefox` | `wxt -b firefox` | Startet den WXT-Dev-Server mit Firefox als Ziel. |
| `build` | `wxt build` | Produktions-Build für Chrome → `.output/chrome-mv3`. |
| `build:firefox` | `wxt build -b firefox` | Produktions-Build für Firefox → `.output/firefox-mv3`. |
| `zip` | `wxt zip` | Baut und verpackt die Chrome-Erweiterung in ein verteilbares Zip in `.output/`. |
| `zip:firefox` | `wxt zip -b firefox` | Baut und verpackt das Firefox-Erweiterungs-Zip in `.output/`. |
| `compile` | `wxt prepare && tsc --noEmit` | Generiert WXT-Typen und führt dann eine Typprüfung ohne Ausgabe durch. |
| `lint` | `eslint .` | Lintet das gesamte Projekt (ESLint-9-Flat-Config in `eslint.config.js`). |
| `test` | `tsx test-parser.ts` | Führt die Tests des Gebietsschema-Aufrufzahlen-Parsers (`test-parser.ts`) aus, die das Auslesen von Aufrufen/Zuschauern sowie die Live-Erkennung über alle 9 unterstützten Sprachen abdecken. |

> ℹ️ `postinstall` führt `wxt prepare` automatisch nach `npm install` / `npm ci` aus.

Führe `npm test` aus, nachdem du etwas in `src/utils/locales.ts` oder `src/utils/parser.ts` geändert hast — es prüft, dass echte YouTube-Zahlen-Zeichenketten (einschließlich NBSP-getrennter und Komma-Dezimal-Formen) für English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어 und 简体中文 zu den erwarteten Zahlen ausgelesen werden.

### Projektstruktur

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

WXT ist mit `srcDir: 'src'` und `modules: ['@wxt-dev/module-react']` konfiguriert. Gemeinsam genutzte Logik wird über den Alias `@/utils/...` importiert. Das Manifest deklariert `permissions: ['storage']` und `host_permissions: ['https://www.youtube.com/*']`, mit `name: 'TubeFilter'` und der Beschreibung „Filter YouTube videos based on views and other metrics." `manifestVersion: 3` in `wxt.config.ts` ist die zentrale Wahrheitsquelle, die die MV3-Ausgabe für beide Ziele erzwingt.

`tsconfig.json` erweitert die WXT-generierte `./.wxt/tsconfig.json` und fügt `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters` und `noFallthroughCasesInSwitch` hinzu.

## Build und Release

### Build-Ausgaben

| Ziel | Ausgabeverzeichnis |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Zip-Artefakte

`wxt zip` verpackt den Build nach `.output/` unter Verwendung der Standard-Zip-Dateinamenvorlage von WXT (`{{name}}-{{version}}-{{browser}}.zip`, wobei `{{name}}` der `package.json`-Name `tube-filter` ist). In `wxt.config.ts` ist keine benutzerdefinierte `zipFileName`/`sources`-Vorlage gesetzt, sodass die folgenden Namen den WXT-Standards entsprechen:

- `tube-filter-<version>-chrome.zip` (z. B. `tube-filter-1.0.0-chrome.zip`) — bestätigt durch den Upload-Glob des Release-Workflows.
- `tube-filter-<version>-firefox.zip` (z. B. `tube-filter-1.0.0-firefox.zip`) — bestätigt durch den Upload-Glob des Release-Workflows.
- Ein Sources-Zip für die AMO-Prüfung (WXT-Standard für das Firefox-Ziel, typischerweise `tube-filter-<version>-sources.zip`). Dieser Name ist der WXT-Standard und wird von keinem Code im Repo referenziert; führe `npm run zip:firefox` aus, um den genauen Dateinamen in deiner Umgebung zu bestätigen.

### GitHub-Actions-Release-Workflow

`.github/workflows/release.yml` (mit dem Namen **Release**) wird durch das GitHub-`release`-Ereignis mit `types: [published]` ausgelöst und hat `permissions: contents: write`. Der Job läuft auf `ubuntu-latest` und:

1. Checkt den Code aus (`actions/checkout@v4`).
2. Richtet **Node.js 20** mit npm-Cache ein (`actions/setup-node@v4`).
3. Führt `npm ci` aus (dessen `postinstall` `wxt prepare` ausführt).
4. Führt `npm run zip` (Chrome) und `npm run zip:firefox` (Firefox) aus und erzeugt beide Browser-Zips.
5. Lädt sie als Release-Assets über `softprops/action-gh-release@v2` hoch (abgesichert durch `startsWith(github.ref, 'refs/tags/')`), passend zu `.output/tube-filter-*-chrome.zip` und `.output/tube-filter-*-firefox.zip`.

## Tech-Stack

| Technologie | Version |
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

Das Paket ist `tube-filter` v`1.0.0` (`private`, ESM `"type": "module"`); der Anzeigename der Erweiterung wird in `wxt.config.ts` auf **TubeFilter** überschrieben.

## Mitwirken

Beiträge sind willkommen. Bevor du einen PR eröffnest:

1. `npm ci`, um die Abhängigkeiten zu installieren (dies generiert auch die WXT-Typen).
2. `npm run lint`, um den Code mit ESLint zu prüfen.
3. `npm run compile` für die Typprüfung (`wxt prepare && tsc --noEmit`).
4. `npm test`, um die Gebietsschema-Parser-Tests auszuführen (insbesondere nach Änderungen an `src/utils/locales.ts` oder `src/utils/parser.ts`).
5. Teste deine Änderungen in beiden Zielen mit `npm run dev` und `npm run dev:firefox`.

## Lizenz

Für dieses Projekt wurde keine Lizenz angegeben, und es ist keine `LICENSE`-Datei im Repository vorhanden. In Ermangelung einer ausdrücklichen Lizenz sind standardmäßig **alle Rechte vorbehalten** — du hast keine Erlaubnis, den Code wiederzuverwenden, weiterzuverbreiten oder zu verändern. Wenn du beabsichtigst, ihn zu öffnen, füge eine `LICENSE`-Datei hinzu, die die Bedingungen festlegt.
