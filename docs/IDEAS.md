# TubeFilter — Feature Ideas / Backlog

A living backlog of candidate features. **Anyone can add an idea** under
"Your ideas" at the bottom — rough notes are fine. Items are picked from here
when we decide to implement; mark status as you go.

Status legend: `proposed` · `accepted` · `in-progress` · `done` · `wontfix`

Effort: S (≲ half-day) · M (≲ couple days) · L (larger)

---

## A. Filtering power

| Idea | Value | Effort | Status |
|---|---|---|---|
| **Channel allow/blocklist** — always show favourite small creators / always hide specific channels, regardless of view count | High | M | proposed |
| **Title keyword / regex filter** — hide videos whose title matches user words (clickbait, spoilers) | High | M | proposed |
| **Upload-age filter** — hide videos older/newer than N (reuse the locale date parsing) | Med | M | proposed |
| **Duration filter** — hide very short / very long videos (thumbnail duration overlay) | Med | S | proposed |
| **View-velocity filter** — views ÷ age, to surface "rising now" over "old but high" | Med | M | proposed |
| **Hide already-watched** — videos with a watched-progress bar | Med | S | proposed |

## B. Control / UX

| Idea | Value | Effort | Status |
|---|---|---|---|
| **Filtered-count badge** — show how many items were filtered (toolbar/popup) | Med | S | proposed |
| **"Show anyway" hover reveal** — temporarily un-dim a filtered item | Med | S | proposed |
| **Opacity-level slider** — make the dim level (fixed 0.1) configurable | Low | S | proposed |
| **Presets (Strict / Relaxed) + keyboard shortcut** to toggle filtering | Med | M | proposed |
| **`storage.sync` cross-device sync + settings import/export (JSON)** | Med | S | proposed |

## C. Coverage / robustness

| Idea | Value | Effort | Status |
|---|---|---|---|
| **More surfaces** — Subscriptions feed, watch-page sidebar recommendations, channel pages | High | M | proposed |
| **Selector robustness + self-diagnostics** — resist YouTube DOM changes | Med | M | proposed |
| **Verified live-now keywords per locale** — current live-viewer words are best-effort (see locales.ts) | Low | M | proposed |

## D. Polish / infra

| Idea | Value | Effort | Status |
|---|---|---|---|
| CI: run compile/lint/test/build on push & PR | Med | S | **done** (`.github/workflows/ci.yml`) |
| AMO `data_collection_permissions` declaration | Low | S | **done** (`wxt.config.ts`) |
| Popup UI in 9 languages (Auto + locales) | Low | M | **done** |
| README screenshots | Low | S | **done** (`docs/screenshots/`) |
| Translate the 8 non-English READMEs' "popup UI languages" prose to say 9 (currently still say ja/en) | Low | S | proposed |
| Expand parse languages (e.g. hi/ar with lakh/crore, it/tr/nl verified) | Low | M | proposed |

---

## Your ideas

> Add features you actually want —邪魔に感じるもの / 欲しい設定 / 不便な点。Free-form is fine.

- _(empty — add yours here)_
