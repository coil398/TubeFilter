# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** ist eine browserübergreifende Manifest-V3-Erweiterung, die deinen YouTube-Feed aufräumt, indem sie Inhalte anhand von Schwellenwerten für Aufrufzahlen und Live-Zuschauerzahlen filtert, die du selbst festlegst. Sie dimmt oder versteckt Videos mit wenigen Aufrufen und Live-Streams mit wenigen Zuschauern und kann unabhängig davon werbliche Top-Banner, Mix-Listen und Shorts entfernen. Die Einstellungen liegen in einem React-Popup, werden sofort auf geöffnete YouTube-Tabs angewendet, ohne dass ein Neuladen nötig ist, und die Popup-Oberfläche ist in **9 Sprachen** verfügbar (English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文) mit einem **Auto**-Modus, der deiner Browsersprache folgt. Aufruf- und Zuschauerzahlen werden über dieselben **9 YouTube-Seitensprachen** hinweg sprachregionsbewusst geparst.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **Status:** v1.0.0 — noch nicht im Chrome Web Store oder bei AMO veröffentlicht. Installation über einen lokalen entpackten Build (siehe [Installation](#installation-end-users)).

## Auf einen Blick

TubeFilter versteckt oder dimmt YouTube-Feed-Einträge, die unter die von dir festgelegten Aufruf-/Zuschauer-Schwellenwerte fallen, und kann auf Wunsch Banner, Mix-Listen und Shorts entfernen. So probierst du es in drei Schritten aus:

1. `npm ci`
2. `npm run build` (Chrome) oder `npm run build:firefox` (Firefox)
3. Lade den entpackten Build aus `.output/chrome-mv3` (oder `.output/firefox-mv3`) — siehe [Installation](#installation-end-users).

Deine Einstellungen verlassen deinen Browser nie: TubeFilter fordert nur `storage` und Host-Zugriff auf `youtube.com` an, und die gesamte Konfiguration wird im lokalen Browser-Speicher gehalten.

## Funktionen

### Aufrufzahl-Filter (reguläre Videos)

Ein reguläres Video wird gefiltert, wenn **alle** der folgenden Bedingungen erfüllt sind:

- Der Video-Filter ist aktiviert (`enableVideoFilter`).
- Aus der Karte konnte erfolgreich eine Aufrufzahl geparst werden.
- Die geparste Aufrufzahl liegt **unter** deinem `minViews`-Schwellenwert.

Wenn ein Video keine parsebare Aufrufzahl hat, bleibt es unangetastet. Der **Min Views**-Schieberegler im Popup steuert den Schwellenwert und ist deaktiviert, solange der Video-Filter ausgeschaltet ist.

### Live-Filter (Live-Streams)

Live-Streams werden gegen einen **separaten** Schwellenwert geprüft — gleichzeitige Zuschauer, nicht Gesamtaufrufe. Ein Live-Stream wird gefiltert, wenn der Live-Filter aktiviert ist (`enableLiveFilter`), eine Zuschauerzahl geparst wurde und diese Zahl **unter** deinem `minConcurrent`-Schwellenwert liegt. Der Live-Status wird über DOM-„Live jetzt“-Badges oder über live-anzeigenden Text in der Aufrufzahl-Zeichenkette erkannt (siehe [Funktionsweise](#live-detection)).

### Inhaltsfilter (ohne Schwellenwert)

Diese drei Filter sind bedingungslose An/Aus-Schalter — sie ignorieren Aufrufzahlen vollständig:

| Filter | Einstellung | Was er entfernt |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | Werbliche Masthead-Anzeigen und Statement-/Promo-Banner. Wenn ein erkanntes Banner innerhalb eines Rich-Abschnitts sitzt, wird der gesamte übergeordnete Abschnitt versteckt. |
| **Mix Lists** | `enableMixFilter` | Automatisch generierte Mix-/Radio-Playlists. |
| **Shorts** | `enableShortsFilter` | Shorts-Links und -Regale. |

### Kanalregeln & Schlüsselwort-Filter

Über die numerischen Schwellenwerte hinaus kannst du Kanäle fest zulassen oder fest ausblenden sowie nach Titeltext ausblenden — im Popup als Listen mit einem Eintrag pro Zeile verwaltet.

- **Immer auszublendende Kanäle** (`channelBlocklist`) — Videos dieser Kanäle werden unabhängig von der Aufrufzahl immer ausgeblendet.
- **Immer anzuzeigende Kanäle** (`channelAllowlist`) — Videos dieser Kanäle werden nie gefiltert (praktisch für bevorzugte kleine Creator unterhalb deines `minViews`).
- **Titel ausblenden, die Folgendes enthalten** (`titleKeywords`) — blendet Videos aus, deren Titel einen der aufgeführten Begriffe enthält. Ein in Schrägstriche eingeschlossener Eintrag (z. B. `/spoiler.*ending/`) wird als **regulärer Ausdruck** ohne Groß-/Kleinschreibungsunterscheidung behandelt; andernfalls handelt es sich um einen einfachen Teilstring ohne Groß-/Kleinschreibungsunterscheidung.

Kanäle werden **exakt** über `@handle`, Kanal-ID oder Kanalname abgeglichen (sodass `mr` **nicht** auf `@MrBeast` passt). Diese Regeln gelten für einzelne Video-/Playlist-/Mix-Karten, aber **nicht** für aggregierte Regale (z. B. das Shorts-Regal), sodass ein einzelnes Kind nie eine ganze Reihe ausblendet.

### Wo die Filterung greift

Das Content-Skript läuft auf ganz YouTube und filtert beim Navigieren neu — Startseite, Suche, Abos, die Empfehlungen in der Seitenleiste der Wiedergabeseite und Kanalseiten — und deckt sowohl die älteren Renderer als auch das neuere `yt-lockup-view-model`-Layout ab.

### Filtermodi: Ausblenden vs. Transparenz

Der **Filter Mode**-Selektor entscheidet, wie gefilterte Videos/Live-Streams behandelt werden:

- **Hide** — setzt `display: none` und entfernt das Element vollständig aus der Ansicht.
- **Opacity** — setzt `opacity: 0.1` und dimmt das Element auf **10 %** Deckkraft, lässt es aber sichtbar. Dies ist die Voreinstellung.

> ℹ️ Der Top-Banner-Filter blendet Banner unabhängig vom gewählten Filtermodus immer aus (`display: none`). Der Filtermodus betrifft nur Videos und Live-Streams.

### Filter-Vorrang

Jede Karte wird einmal klassifiziert, in einer festen if/else-Reihenfolge. Es gilt nur die Regel der ersten passenden Kategorie:

1. **Kanal-Blockliste** — immer ausblenden (höchste Priorität)
2. **Kanal-Zulassungsliste** — immer anzeigen (überspringt jede Regel darunter)
3. **Titel-Schlüsselwort** — passende Titel ausblenden
4. **Shorts**
5. **Mix-Listen**
6. **Live-Streams**
7. **Reguläre Videos**

(Kanal-/Schlüsselwortregeln 1–3 gelten nur für einzelne Karten, nicht für aggregierte Regale.)

### Auto-Synchronisation deaktivieren (Originalton erzwingen)

YouTubes automatische Synchronisation ersetzt den Ton eines Videos durch eine KI-übersetzte Tonspur, die auf deiner Oberflächensprache basiert — sodass ein englisches Video standardmäßig auf Japanisch, Deutsch usw. abgespielt wird. Mit **Force Original Audio** (`forceOriginalAudio`, **standardmäßig aktiviert**) erkennt TubeFilter die Original-Tonspur und schaltet den Player bei jedem Video und Short automatisch darauf um und macht so die Auto-Synchronisation rückgängig.

- Funktioniert bei `/watch`-Videos und Shorts, wird bei jeder In-App-Navigation erneut angewendet.
- Die Original-Tonspur wird **sprachunabhängig** identifiziert, indem die Audiospur-ID des Players dekodiert wird (die Daten der Original-Tonspur enthalten `original`; synchronisierte Tonspuren enthalten `dubbed` / `dubbed-auto`).
- Umgesetzt über ein **MAIN-world-Skript**, das in die Seite injiziert wird — YouTubes Player-Audio-API ist aus der isolierten Content-Skript-Welt nicht erreichbar —, wobei die Einstellung aus dem Speicher der Erweiterung überbrückt wird.
- Schalte es im Popup jederzeit aus, um YouTubes synchronisierten Ton beizubehalten.

### Mehrsprachige Aufrufzahl-Erkennung

YouTube stellt Aufruf- und Zuschauerzahlen **je nach Seitensprache sehr unterschiedlich** dar — nicht nur übersetzte Wörter, sondern auch andere Dezimal-/Tausendertrennzeichen und Abkürzungseinheiten. Dieselbe Zahl von ~1,7 Milliarden erscheint als:

| Sprache | YouTube-Zeichenkette |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

Das Content-Skript erkennt automatisch die **YouTube-Seitensprache** (`document.documentElement.lang`) und parst die Zahlen mit dem korrekten Dezimaltrennzeichen, Tausendertrennzeichen und den Abkürzungseinheiten für diese Sprachregion. Das ist wichtig, weil der vorherige Parser ein englisches Format annahm und **Sprachregionen mit Komma-Dezimaltrennung** (`de` / `fr` / `ru` / `pt`) **falsch las** — z. B. wurde `1,7 Mrd.` als `1` oder `17` statt als `1.700.000.000` gelesen. Sprachregionskorrektes Parsing wird für **9 Sprachen** unterstützt (siehe [Internationalisierung](#internationalization)); unbekannte Seitensprachen fallen auf einen toleranten generischen Parser zurück.

### Sprachen (Popup-Oberfläche)

Die Popup-Oberfläche wird in **9 Sprachen** angeboten — English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文 — plus einen **Auto-Modus (`auto`, Standard)**, der der UI-Sprache des Browsers folgt (`navigator.language`, abgebildet auf die nächstgelegene unterstützte Sprachregion, mit Rückfall auf Englisch). Ein Dropdown in der Popup-Kopfzeile wechselt zwischen ihnen.

## Screenshots

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## Unterstützte Browser

| Browser | Manifest | Anmerkungen |
|---|---|---|
| **Chrome / Chromium** | MV3 | Standard-Build-Ziel; Chrome ist standardmäßig MV3. |
| **Firefox** | MV3 | Das Ausgabeverzeichnis ist `.output/firefox-mv3`; MV3 wird über `manifestVersion: 3` in `wxt.config.ts` erzwungen (Firefox würde sonst standardmäßig MV2 verwenden). |

> ℹ️ Das Content-Skript läuft in beiden Browsern auf `https://www.youtube.com/*`. Der Firefox-Build trägt eine `browser_specific_settings.gecko.id` von `tube-filter@coil398.github.io` (für AMO MV3 erforderlich, in Chrome unschädlich).

## Installation (Endnutzer)

Die vollständige, unterstützte Anleitung zum Release und zur Installation findest du in **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**.

So lädst du einen lokalen entpackten Build zum Testen:

### Chrome / Chromium

1. Führe `npm run build` aus, um `.output/chrome-mv3` zu erzeugen.
2. Öffne `chrome://extensions`.
3. Aktiviere den **Entwicklermodus** (oben rechts).
4. Klicke auf **Entpackt laden** und wähle das Verzeichnis `.output/chrome-mv3`.

### Firefox

1. Führe `npm run build:firefox` aus, um `.output/firefox-mv3` zu erzeugen.
2. Öffne `about:debugging`.
3. Gehe zu **Dieser Firefox** → **Temporäres Add-on laden…**.
4. Wähle eine beliebige Datei im Verzeichnis `.output/firefox-mv3` (z. B. dessen `manifest.json`).

## Verwendung

Öffne das Popup der Erweiterung, um die Filterung anzupassen. Änderungen werden sofort gespeichert und live auf jeden geöffneten YouTube-Tab angewendet — kein Neuladen erforderlich.

### Einstellungsreferenz

| Einstellung | Was sie steuert | Bereich / Schritt | Standard | JA label | EN label |
|---|---|---|---|---|---|
| `minViews` | Mindest-Aufrufzahl, unterhalb derer reguläre Videos gefiltert werden | Bereich `0`–`100000`, Schritt `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | Mindestzahl gleichzeitiger Zuschauer, unterhalb derer Live-Streams gefiltert werden | Bereich `0`–`5000`, Schritt `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | Wie gefilterte Videos/Live-Streams behandelt werden (`hide` / `opacity`) | Zwei-Tasten-Selektor | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | Aktiviert/deaktiviert den Aufrufzahl-Filter (aktiviert/deaktiviert auch den Min-Views-Schieberegler) | An/Aus-Schalter | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | Aktiviert/deaktiviert den Live-Filter (aktiviert/deaktiviert auch den Min-Concurrent-Schieberegler) | An/Aus-Schalter | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | Werbliche Top-Banner ausblenden | An/Aus-Schalter | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | Mix-Listen ausblenden | An/Aus-Schalter | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Shorts ausblenden | An/Aus-Schalter | `true` | ショート動画非表示 | Hide Shorts |
| `forceOriginalAudio` | Die Original-Tonspur erzwingen (Auto-Synchronisation rückgängig machen) auf Wiedergabeseiten und bei Shorts | An/Aus-Schalter | `true` | 元の音声に固定 | Force Original Audio |
| `channelAllowlist` | Kanäle, die nie gefiltert werden (immer anzeigen), einer pro Zeile; abgeglichen über @handle, ID oder Name | Textbereich-Liste | `[]` | 常に表示するチャンネル | Always-show channels |
| `channelBlocklist` | Kanäle, die immer ausgeblendet werden, einer pro Zeile | Textbereich-Liste | `[]` | 常に非表示のチャンネル | Always-hide channels |
| `titleKeywords` | Videos ausblenden, deren Titel einen Begriff enthält; `/…/`-Einträge sind Regex ohne Groß-/Kleinschreibungsunterscheidung | Textbereich-Liste | `[]` | この語を含むタイトルを非表示 | Hide titles containing |
| `language` | Popup-UI-Sprache: `auto` + 9 Sprachregionen (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`); **Auto** folgt der UI-Sprache des Browsers (`navigator.language`) | Dropdown-Selektor | `auto` | Language | 言語 |

Beide Schieberegler zeigen ihren Wert mit Tausendertrennzeichen über `toLocaleString()` an. Unter dem Min-Concurrent-Schieberegler steht ein Hinweistext:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### Filtermodus-Selektor

Ein Zwei-Tasten-Steuerelement. **Hide** setzt `filterMode = 'hide'`; **Opacity** setzt `filterMode = 'opacity'`. Der aktive Modus wird hervorgehoben. Die Beschriftungen sind lokalisiert — JA: 非表示 / 薄く表示, EN: Hide / Opacity.

### Sprachauswahl

Ein Dropdown in der Popup-Kopfzeile setzt `language` auf `auto` oder eine der 9 Sprachregionen (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`). **Auto** (die Voreinstellung) ermittelt die effektive UI-Sprache aus `navigator.language`, abgebildet auf die nächstgelegene unterstützte Sprachregion und mit Rückfall auf Englisch. Die Auswahl einer bestimmten Sprache fixiert die Oberfläche darauf, unabhängig von der Browsereinstellung.

## Funktionsweise

### Content-Skript

- **Treffer & Timing** — passt auf `https://www.youtube.com/*` und läuft bei `run_at: document_end`.
- **Seitensprach-Erkennung** — bei jedem Durchlauf liest es `document.documentElement.lang` (mit Rückfall auf `navigator.language`, dann `'en'`) und nutzt es, um einen sprachregionskorrekten Aufrufzahl-Parser zu wählen (siehe [Internationalisierung](#internationalization)).
- **Ziele** — durchsucht 7 Video-Selektoren, die Startseite (`ytd-rich-item-renderer`), Suche (`ytd-video-renderer`), Seitenleiste (`ytd-compact-video-renderer`), Kanal (`ytd-grid-video-renderer`), Mix-Listen (`ytd-radio-renderer`), einzelne Shorts (`ytd-reel-item-renderer`) und das Shorts-Regal (`ytd-rich-shelf-renderer`) abdecken; plus 9 Banner-Selektoren (`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer` und mehrere `ytd-rich-section-renderer > #content > …`-Varianten).
- **Behandlung des dynamischen Feeds** — ein `MutationObserver` überwacht `document.body` mit `{ childList: true, subtree: true }`. Wenn Knoten hinzugefügt werden, entprellt er mit einem **500-ms**-`setTimeout` (löscht den Timer und startet ihn bei jedem Batch neu), sodass der Filter 500 ms nach dem letzten Schub hinzugefügter Knoten läuft. Der Filter läuft außerdem einmal beim ersten Laden und einmal direkt nach dem Laden der Einstellungen.

  > ℹ️ Dies ist ein nachlaufendes Entprellen (Trailing Debounce), kein fester Throttle: Bei kontinuierlichen Mutationen wird der Durchlauf immer weiter aufgeschoben. (Der Inline-Kommentar im Quellcode, `// Run at most every 500ms`, beschreibt ein Throttling und ist etwas ungenau.)
- **Mix-/Shorts-Erkennung** — Mix-Listen werden über `start_radio=1`, `list=RD`, das `MIX`-Overlay-Badge oder `ytd-radio-renderer` erkannt; Shorts über `/shorts/`-Links, das `SHORTS`-Overlay-Badge, `ytd-reel-item-renderer` und `ytd-rich-shelf-renderer`-Regale.
- **Ausblenden des übergeordneten Banner-Abschnitts** — wenn ein erkanntes Banner einen `closest('ytd-rich-section-renderer')`-Vorfahren hat, wird der gesamte übergeordnete Abschnitt ausgeblendet statt nur das innere Banner.

<a id="live-detection"></a>

Der Live-Status wird über DOM-Badges (`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) oder über den Aufrufzahl-Text selbst erkannt (enthält ohne Groß-/Kleinschreibungsunterscheidung `視聴中`, `watching`, `live` oder `ライブ`, plus die eigenen Live-Schlüsselwörter der aktiven Seitensprachregion — siehe [Internationalisierung](#internationalization)).

<a id="internationalization"></a>

### Internationalisierung

YouTube formatiert Aufruf-/Zuschauerzahlen in jeder UI-Sprache anders, daher wird das Parsen der Zahlen von der **erkannten YouTube-Seitensprache** gesteuert, nicht von der Popup-UI-Sprache. Bei jedem Durchlauf liest das Content-Skript `document.documentElement.lang` (mit Rückfall auf `navigator.language`, dann `'en'`), normalisiert es auf einen Basis-Sprachcode (z. B. `zh-Hans-CN` → `zh`, `es-419` → `es`) und wählt eine Spezifikation pro Sprachregion, die das Dezimaltrennzeichen, Tausendertrennzeichen, die Abkürzungseinheiten (z. B. `K`/`M`/`B`, `万`/`億`, `Mio.`/`Mrd.`, `тыс.`/`млн`/`млрд`, `万`/`亿`), die Verbindungswörter für „Aufrufe“, die Datums-/Vergangenheits-Stream-Markierungen, die Live-Stream-Wörter und die „keine Aufrufe“ → `0`-Wörter dieser Sprache beschreibt.

Sprachregionskorrektes Parsing wird für **9 Sprachen** unterstützt:

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

Wenn die Seitensprache keine davon ist, fällt das Parsing auf eine **tolerante generische Spezifikation** zurück, die ein `.` als Dezimaltrennzeichen verwendet und eine Vereinigung gängiger Einheiten (`K`/`M`/`B` sowie die CJK-/koreanischen Einheiten) nach bestem Bemühen erkennt. Diese Sprachregionsbewusstheit behebt die früheren Fehllesungen des Parsers bei Sprachregionen mit Komma-Dezimaltrennung (`de` / `fr` / `ru` / `pt`), bei denen `1,7 Mrd.` als `1` oder `17` statt als `1.700.000.000` gelesen wurde.

### Popup (React)

Ein React-19-Popup (`src/entrypoints/popup/`) rendert die Schieberegler, Schalter, den Filtermodus-Selektor und die dreifache Sprachauswahl. Das Bearbeiten eines beliebigen Steuerelements schreibt sofort in den Speicher. Das Popup ermittelt seine effektive Anzeigesprache aus `settings.language`: `auto` folgt `navigator.language`, während `ja` / `en` sie fixieren.

### Einstellungsspeicher & Live-Synchronisation

- Die Einstellungen werden in `browser.storage.local` als **flache Schlüssel der obersten Ebene** persistiert — ein Schlüssel pro Feld (`minViews`, `minConcurrent`, `filterMode`, …). Das entspricht der Form von `chrome.storage.local` vor WXT, sodass bestehende Nutzer ihre Einstellungen über die Migration hinweg behalten.
- `loadSettings()` ruft `browser.storage.local.get(defaultSettings)` auf und legt die gespeicherten Werte über die Standardwerte; `saveSettings()` ruft `browser.storage.local.set(settings)` auf.
- `watchSettings()` registriert einen `browser.storage.onChanged`-Listener. Bei jeder Änderung im Bereich `local` liest er den vollständigen Einstellungsdatensatz erneut und führt den Filter erneut aus — deshalb werden Popup-Änderungen sofort auf geöffnete Tabs angewendet.

Der `Settings`-Typ hat genau 9 Felder: `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language` (`'auto' | 'ja' | 'en'`, Standard `'auto'`).

### Aufrufzahl-Parsing

`parseViewCount(text, lang)` ermittelt die Sprachregions-Spezifikation für die angegebene Seitensprache (oder die generische Spezifikation, wenn die Sprache unbekannt/weggelassen ist) und normalisiert YouTubes vielfältige Zahl-Zeichenketten zu einer Zahl (oder `null`). Über alle unterstützten Sprachregionen hinweg gilt:

| Eingabemuster | Behandlung | Beispiel |
|---|---|---|
| Abkürzungseinheiten (pro Sprachregion) | mit dem Einheitsfaktor der Sprachregion multipliziert | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| Sprachregions-Dezimal-/Tausendertrennzeichen | Sprachregionen mit Komma-Dezimaltrennung (`de`/`fr`/`ru`/`pt`) und Sprachregionen mit Leerzeichen-Tausendertrennung (`fr`/`ru`) korrekt geparst | `129.069 Aufrufe` (de) → `129069` |
| „Keine Aufrufe“-Wörter (z. B. `No views`, `なし`, Sprachregions-Äquivalente) | gibt `0` zurück | `No views` → `0` |
| Reine Zahlen | Trennzeichen pro Sprachregion entfernt, dann geparst | `1,234` (en) → `1234` |
| Datums-/Vergangenheits-Stream-Text | als „keine Zahl“ behandelt, sodass die Karte unangetastet bleibt | `2 days ago`, `〜前` |
| Nicht parsebar | gibt `null` zurück (Element wird nicht durch Aufrufzahl-Regeln gefiltert) | — |

Vor dem Parsen werden die „Aufrufe“/Verbindungs-Schlüsselwörter der Sprachregion (z. B. `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`) entfernt. Whitespace — einschließlich NBSP und schmalem NBSP, wie sie in echten YouTube-Zeichenketten vorkommen — wird zuerst normalisiert. Der Helfer `isLive(text, lang)` gibt `true` zurück (ohne Groß-/Kleinschreibungsunterscheidung), wenn der Text eine universelle Live-Markierung (`視聴中`, `watching`, `live`, `ライブ`) oder eines der Live-Stream-Wörter der aktiven Sprachregion enthält.

## Bekannte Einschränkungen

> ⚠️ Das Debug-Logging in `src/utils/filter.ts` ist derzeit fest aktiviert (`const debug = true`), sodass das Content-Skript ausführliche Konsolenausgaben erzeugt. Das `FILTERED`-Zusammenfassungs-Log wird bedingungslos ausgegeben — es liegt außerhalb des `debug`-Schutzes —, sodass es selbst dann erscheint, wenn das Flag ausgeschaltet ist.

## Entwicklung

### Voraussetzungen

- **Node.js 20** (die von CI verwendete Version).
- npm (das Repo liefert eine `package-lock.json` mit).

### Installation

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### npm-Skripte

| Skript | Befehl | Was es tut |
|---|---|---|
| `dev` | `wxt` | Startet den WXT-Dev-Server für Chrome (Standardziel) mit HMR. |
| `dev:firefox` | `wxt -b firefox` | Startet den WXT-Dev-Server mit Ziel Firefox. |
| `build` | `wxt build` | Produktions-Build für Chrome → `.output/chrome-mv3`. |
| `build:firefox` | `wxt build -b firefox` | Produktions-Build für Firefox → `.output/firefox-mv3`. |
| `zip` | `wxt zip` | Baut und packt die Chrome-Erweiterung in ein verteilbares Zip in `.output/`. |
| `zip:firefox` | `wxt zip -b firefox` | Baut und packt das Firefox-Erweiterungs-Zip in `.output/`. |
| `compile` | `wxt prepare && tsc --noEmit` | Generiert WXT-Typen und führt dann eine Typprüfung ohne Ausgabe durch. |
| `lint` | `eslint .` | Lintet das gesamte Projekt (ESLint 9 Flat Config in `eslint.config.js`). |
| `test` | `tsx test-parser.ts` | Führt die Tests des Sprachregions-Aufrufzahl-Parsers aus (`test-parser.ts`), die das Parsen von Aufruf-/Zuschauerzahlen und die Live-Erkennung über alle 9 unterstützten Sprachen hinweg abdecken. |

> ℹ️ `postinstall` führt nach `npm install` / `npm ci` automatisch `wxt prepare` aus.

Führe `npm test` aus, nachdem du etwas in `src/utils/locales.ts` oder `src/utils/parser.ts` geändert hast — es prüft, dass echte YouTube-Zahl-Zeichenketten (einschließlich NBSP-getrennter und Komma-Dezimal-Formen) für English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어 und 简体中文 zu den erwarteten Zahlen geparst werden.

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

WXT ist mit `srcDir: 'src'` und `modules: ['@wxt-dev/module-react']` konfiguriert. Gemeinsame Logik wird über den Alias `@/utils/...` importiert. Das Manifest deklariert `permissions: ['storage']` und `host_permissions: ['https://www.youtube.com/*']`, mit `name: 'TubeFilter'` und der Beschreibung „Filter YouTube videos based on views and other metrics.“ `manifestVersion: 3` in `wxt.config.ts` ist die einzige Quelle der Wahrheit, die MV3-Ausgabe für beide Ziele erzwingt.

`tsconfig.json` erweitert das von WXT generierte `./.wxt/tsconfig.json` und fügt `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters` und `noFallthroughCasesInSwitch` hinzu.

## Build und Release

### Build-Ausgaben

| Ziel | Ausgabeverzeichnis |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Zip-Artefakte

`wxt zip` packt den Build mit WXTs Standard-Zip-Dateinamenvorlage (`{{name}}-{{version}}-{{browser}}.zip`, wobei `{{name}}` der `package.json`-Name `tube-filter` ist) in `.output/`. In `wxt.config.ts` ist keine eigene `zipFileName`/`sources`-Vorlage gesetzt, daher folgen die untenstehenden Namen den WXT-Standards:

- `tube-filter-<version>-chrome.zip` (z. B. `tube-filter-1.0.0-chrome.zip`) — bestätigt durch das Upload-Glob des Release-Workflows.
- `tube-filter-<version>-firefox.zip` (z. B. `tube-filter-1.0.0-firefox.zip`) — bestätigt durch das Upload-Glob des Release-Workflows.
- Ein Quellcode-Zip für die AMO-Prüfung (WXTs Standard für das Firefox-Ziel, typischerweise `tube-filter-<version>-sources.zip`). Dieser Name ist der WXT-Standard und wird von keinem Code im Repo referenziert; führe `npm run zip:firefox` aus, um den genauen Dateinamen in deiner Umgebung zu bestätigen.

### GitHub-Actions-Release-Workflow

`.github/workflows/release.yml` (benannt **Release**) wird beim GitHub-`release`-Event mit `types: [published]` ausgelöst und hat `permissions: contents: write`. Der Job läuft auf `ubuntu-latest` und:

1. Checkt den Code aus (`actions/checkout@v4`).
2. Richtet **Node.js 20** mit npm-Cache ein (`actions/setup-node@v4`).
3. Führt `npm ci` aus (dessen `postinstall` führt `wxt prepare` aus).
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
4. `npm test`, um die Sprachregions-Parser-Tests auszuführen (besonders nach Änderungen an `src/utils/locales.ts` oder `src/utils/parser.ts`).
5. Teste deine Änderungen in beiden Zielen mit `npm run dev` und `npm run dev:firefox`.

## Lizenz

Für dieses Projekt wurde keine Lizenz angegeben, und im Repository ist keine `LICENSE`-Datei vorhanden. In Ermangelung einer ausdrücklichen Lizenz sind die Rechte am Code standardmäßig **vollständig vorbehalten** (all rights reserved) — du hast keine Erlaubnis, ihn wiederzuverwenden, weiterzuverbreiten oder zu verändern. Wenn du ihn öffnen möchtest, füge eine `LICENSE`-Datei hinzu, die die Bedingungen festlegt.
