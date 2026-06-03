# TubeFilter

**TubeFilter** is a cross-browser Manifest V3 extension that cleans up your YouTube feed by filtering content against view-count and live-viewer thresholds you control. It dims or hides low-view videos and low-viewer live streams, and can independently strip out promotional top banners, Mix lists, and Shorts. Settings live in a React popup, apply instantly to open YouTube tabs with no reload, and are available in Japanese and English.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **Status:** v1.0.0 — not yet published to the Chrome Web Store or AMO. Install via a local unpacked build (see [Installation](#installation-end-users)).

## At a glance

TubeFilter hides or dims YouTube feed items that fall below the view/viewer thresholds you set, and can strip banners, Mix lists, and Shorts on demand. To try it in three steps:

1. `npm ci`
2. `npm run build` (Chrome) or `npm run build:firefox` (Firefox)
3. Load the unpacked build from `.output/chrome-mv3` (or `.output/firefox-mv3`) — see [Installation](#installation-end-users).

Your settings never leave your browser: TubeFilter requests only `storage` and host access to `youtube.com`, and all configuration is kept in local browser storage.

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Supported browsers](#supported-browsers)
- [Installation (end users)](#installation-end-users)
- [Usage](#usage)
- [How it works](#how-it-works)
- [Known limitations](#known-limitations)
- [Development](#development)
- [Build and release](#build-and-release)
- [Tech stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

## Features

### View-count filter (regular videos)

A regular video is filtered when **all** of the following are true:

- The video filter is enabled (`enableVideoFilter`).
- A view count was successfully parsed from the card.
- The parsed view count is **below** your `minViews` threshold.

If a video has no parseable view count, it is left untouched. The popup's **Min Views** slider controls the threshold and is disabled while the video filter is toggled off.

### Live filter (live streams)

Live streams are evaluated against a **separate** threshold — concurrent viewers, not total views. A live stream is filtered when the live filter is enabled (`enableLiveFilter`), a viewer count was parsed, and that count is **below** your `minConcurrent` threshold. Live status is detected from DOM live-now badges or from live-indicating text in the view-count string (see [How it works](#live-detection)).

### Content filters (no threshold)

These three filters are unconditional on/off switches — they ignore view counts entirely:

| Filter | Setting | What it removes |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | Promotional masthead ads and statement/promo banners. When a matched banner sits inside a rich section, the whole parent section is hidden. |
| **Mix Lists** | `enableMixFilter` | Auto-generated Mix / radio playlists. |
| **Shorts** | `enableShortsFilter` | Shorts links and shelves. |

### Filter modes: Hide vs. Opacity

The **Filter Mode** selector decides how filtered videos/live streams are treated:

- **Hide** — sets `display: none`, removing the element from view entirely.
- **Opacity** — sets `opacity: 0.1`, dimming the element to **10%** opacity while keeping it visible. This is the default.

> ℹ️ The Top Banner filter always hides banners (`display: none`) regardless of the selected filter mode. The filter mode only affects videos and live streams.

### Filter precedence

Each card is classified once, using a fixed if/else order. Only the first matching category's rule applies:

1. **Shorts** (highest priority)
2. **Mix lists**
3. **Live streams**
4. **Regular videos**

### Languages

The popup UI ships in **Japanese (`ja`, default)** and **English (`en`)**, toggled from the header. The button reads **English** while the current language is Japanese, and **日本語** while the current language is English.

## Screenshots

> 📷 _TODO: add a popup screenshot and a before/after of a filtered feed (Hide vs. Opacity). No screenshots are committed yet._

## Supported browsers

| Browser | Manifest | Notes |
|---|---|---|
| **Chrome / Chromium** | MV3 | Default build target; Chrome is MV3 by default. |
| **Firefox** | MV3 | Output directory is `.output/firefox-mv3`; MV3 is forced via `manifestVersion: 3` in `wxt.config.ts` (Firefox would otherwise default to MV2). |

> ℹ️ The content script runs on `https://www.youtube.com/*` in both browsers. The Firefox build carries a `browser_specific_settings.gecko.id` of `tube-filter@coil398.github.io` (required for AMO MV3, harmless on Chrome).

## Installation (end users)

For the full, supported release-and-install walkthrough, see **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**.

To load a local unpacked build for testing:

### Chrome / Chromium

1. Run `npm run build` to produce `.output/chrome-mv3`.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the `.output/chrome-mv3` directory.

### Firefox

1. Run `npm run build:firefox` to produce `.output/firefox-mv3`.
2. Open `about:debugging`.
3. Go to **This Firefox** → **Load Temporary Add-on…**.
4. Select any file inside the `.output/firefox-mv3` directory (e.g. its `manifest.json`).

## Usage

Open the extension popup to adjust filtering. Changes are saved immediately and applied live to any open YouTube tab — no reload required.

### Settings reference

| Setting | What it controls | Range / step | Default | JA label | EN label |
|---|---|---|---|---|---|
| `minViews` | Min view count below which regular videos are filtered | range `0`–`100000`, step `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | Min concurrent-viewer count below which live streams are filtered | range `0`–`5000`, step `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | How filtered videos/live streams are treated (`hide` / `opacity`) | two-button selector | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | Enable/disable the view-count filter (also enables/disables the Min Views slider) | on/off toggle | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | Enable/disable the live filter (also enables/disables the Min Concurrent slider) | on/off toggle | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | Hide promotional top banners | on/off toggle | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | Hide Mix lists | on/off toggle | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Hide Shorts | on/off toggle | `true` | ショート動画非表示 | Hide Shorts |
| `language` | Popup UI language (`ja` / `en`) | header toggle button | `ja` | Language | 言語 |

Both sliders show their value thousands-separated via `toLocaleString()`. A helper note sits beneath the Min Concurrent slider:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### Filter-mode selector

A two-button control. **Hide** sets `filterMode = 'hide'`; **Opacity** sets `filterMode = 'opacity'`. The active mode is highlighted. Labels are localized — JA: 非表示 / 薄く表示, EN: Hide / Opacity.

### Language toggle

A single button in the popup header flips `language` between `ja` and `en`. It shows **English** when the current language is Japanese, and **日本語** when the current language is English.

## How it works

### Content script

- **Match & timing** — matches `https://www.youtube.com/*` and runs at `run_at: document_end`.
- **Targets** — scans 7 video selectors covering Home (`ytd-rich-item-renderer`), Search (`ytd-video-renderer`), Sidebar (`ytd-compact-video-renderer`), Channel (`ytd-grid-video-renderer`), Mix lists (`ytd-radio-renderer`), individual Shorts (`ytd-reel-item-renderer`), and the Shorts shelf (`ytd-rich-shelf-renderer`); plus 9 banner selectors (`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer`, and several `ytd-rich-section-renderer > #content > …` variants).
- **Dynamic feed handling** — a `MutationObserver` watches `document.body` with `{ childList: true, subtree: true }`. When nodes are added, it debounces with a **500 ms** `setTimeout` (clearing and re-arming the timer on each batch), so the filter runs 500 ms after the last burst of added nodes. The filter also runs once on initial load and once right after settings load.

  > ℹ️ This is a trailing debounce, not a fixed throttle: under continuous mutations the pass keeps getting deferred. (The source's own inline comment, `// Run at most every 500ms`, describes throttling and is slightly imprecise.)
- **Mix / Shorts detection** — Mix lists are matched via `start_radio=1`, `list=RD`, the `MIX` overlay badge, or `ytd-radio-renderer`; Shorts via `/shorts/` links, the `SHORTS` overlay badge, `ytd-reel-item-renderer`, and `ytd-rich-shelf-renderer` shelves.
- **Banner parent-section hiding** — when a matched banner has a `closest('ytd-rich-section-renderer')` ancestor, the entire parent section is hidden rather than just the inner banner.

<a id="live-detection"></a>

Live status is detected from DOM badges (`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) or from the view-count text itself (case-insensitively containing `視聴中`, `watching`, `live`, or `ライブ`).

### Popup (React)

A React 19 popup (`src/entrypoints/popup/`) renders the sliders, toggles, filter-mode selector, and language toggle. Editing any control writes to storage immediately.

### Settings storage & live sync

- Settings are persisted to `browser.storage.local` as **flat, top-level keys** — one key per field (`minViews`, `minConcurrent`, `filterMode`, …). This matches the pre-WXT `chrome.storage.local` shape, so existing users keep their settings across the migration.
- `loadSettings()` calls `browser.storage.local.get(defaultSettings)`, merging stored values over the defaults; `saveSettings()` calls `browser.storage.local.set(settings)`.
- `watchSettings()` registers a `browser.storage.onChanged` listener. On any change in the `local` area it re-reads the full settings record and re-runs the filter — which is why popup edits apply instantly to open tabs.

The `Settings` type has exactly 9 fields: `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language`.

### View-count parsing

`parseViewCount` normalizes YouTube's varied count strings into a number (or `null`):

| Input pattern | Handling | Example |
|---|---|---|
| Japanese unit `万` | × 10,000 | `1.2万` → `12000` |
| Japanese unit `億` | × 100,000,000 | — |
| English `K` (case-insensitive) | × 1,000 | `12K` → `12000` |
| English `M` | × 1,000,000 | — |
| English `B` | × 1,000,000,000 | — |
| `No` (e.g. `No views`) or `なし` | returns `0` | `No views` → `0` |
| Plain numbers | commas stripped, then `parseFloat` | `1,234` → `1234` |
| Unparseable | returns `null` (element not filtered by view-count rules) | — |

Before parsing, the words `views` / `view` / `回視聴` / `視聴` / `回` / `watching` / `人` / `人が視聴中` are stripped. The `isLive(text)` helper returns `true` (case-insensitive) when the text contains `視聴中`, `watching`, `live`, or `ライブ`.

## Known limitations

> ⚠️ Debug logging in `src/utils/filter.ts` is currently hardcoded on (`const debug = true`), so the content script emits verbose console output. The `FILTERED` summary log is emitted unconditionally — it is outside the `debug` guard — so it appears even if the flag is turned off.

## Development

### Prerequisites

- **Node.js 20** (the version used by CI).
- npm (the repo ships a `package-lock.json`).

### Install

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### npm scripts

| Script | Command | What it does |
|---|---|---|
| `dev` | `wxt` | Starts the WXT dev server for Chrome (default target) with HMR. |
| `dev:firefox` | `wxt -b firefox` | Starts the WXT dev server targeting Firefox. |
| `build` | `wxt build` | Production build for Chrome → `.output/chrome-mv3`. |
| `build:firefox` | `wxt build -b firefox` | Production build for Firefox → `.output/firefox-mv3`. |
| `zip` | `wxt zip` | Builds and packages the Chrome extension into a distributable zip in `.output/`. |
| `zip:firefox` | `wxt zip -b firefox` | Builds and packages the Firefox extension zip in `.output/`. |
| `compile` | `wxt prepare && tsc --noEmit` | Generates WXT types, then type-checks without emitting. |
| `lint` | `eslint .` | Lints the whole project (ESLint 9 flat config at `eslint.config.js`). |

> ℹ️ `postinstall` runs `wxt prepare` automatically after `npm install` / `npm ci`.

### Project structure

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
│       ├── parser.ts            # parseViewCount, isLive
│       ├── storage.ts           # defaultSettings, loadSettings, watchSettings
│       └── types.ts             # Settings type
├── public/
│   └── icon/                    # 16.png, 48.png, 128.png
├── wxt.config.ts                # srcDir: 'src', React module, manifestVersion: 3, manifest fields
├── tsconfig.json                # extends .wxt/tsconfig.json
├── eslint.config.js
├── postcss.config.js
├── tailwind.config.js
├── package.json
├── README.md
└── RELEASE_GUIDE.md
```

WXT is configured with `srcDir: 'src'` and `modules: ['@wxt-dev/module-react']`. Shared logic is imported via the `@/utils/...` alias. The manifest declares `permissions: ['storage']` and `host_permissions: ['https://www.youtube.com/*']`, with `name: 'TubeFilter'` and description "Filter YouTube videos based on views and other metrics." `manifestVersion: 3` in `wxt.config.ts` is the single source of truth that forces MV3 output for both targets.

`tsconfig.json` extends the WXT-generated `./.wxt/tsconfig.json` and adds `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.

## Build and release

### Build outputs

| Target | Output directory |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Zip artifacts

`wxt zip` packages the build into `.output/` using WXT's default zip filename template (`{{name}}-{{version}}-{{browser}}.zip`, where `{{name}}` is the `package.json` name `tube-filter`). No custom `zipFileName`/`sources` template is set in `wxt.config.ts`, so the names below follow the WXT defaults:

- `tube-filter-<version>-chrome.zip` (e.g. `tube-filter-1.0.0-chrome.zip`) — corroborated by the release workflow's upload glob.
- `tube-filter-<version>-firefox.zip` (e.g. `tube-filter-1.0.0-firefox.zip`) — corroborated by the release workflow's upload glob.
- A sources zip for AMO review (WXT's default for the Firefox target, typically `tube-filter-<version>-sources.zip`). This name is the WXT default and is not referenced by any code in the repo; run `npm run zip:firefox` to confirm the exact filename in your environment.

### GitHub Actions release workflow

`.github/workflows/release.yml` (named **Release**) triggers on the GitHub `release` event with `types: [published]` and has `permissions: contents: write`. The job runs on `ubuntu-latest` and:

1. Checks out the code (`actions/checkout@v4`).
2. Sets up **Node.js 20** with npm cache (`actions/setup-node@v4`).
3. Runs `npm ci` (its `postinstall` runs `wxt prepare`).
4. Runs `npm run zip` (Chrome) and `npm run zip:firefox` (Firefox), producing both browser zips.
5. Uploads them as release assets via `softprops/action-gh-release@v2` (guarded by `startsWith(github.ref, 'refs/tags/')`), matching `.output/tube-filter-*-chrome.zip` and `.output/tube-filter-*-firefox.zip`.

## Tech stack

| Technology | Version |
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

The package is `tube-filter` v`1.0.0` (`private`, ESM `"type": "module"`); the extension display name is overridden to **TubeFilter** in `wxt.config.ts`.

## Contributing

Contributions are welcome. Before opening a PR:

1. `npm ci` to install dependencies (this also generates WXT types).
2. `npm run lint` to check the code with ESLint.
3. `npm run compile` to type-check (`wxt prepare && tsc --noEmit`).
4. Test your changes in both targets with `npm run dev` and `npm run dev:firefox`.

## License

No license has been specified for this project, and no `LICENSE` file is present in the repository. Absent an explicit license, the code is **all rights reserved** by default — you do not have permission to reuse, redistribute, or modify it. If you intend to open it up, add a `LICENSE` file declaring the terms.
