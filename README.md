# TubeFilter

TubeFilter is a browser extension (Chrome / Chromium and Firefox) that filters YouTube videos based on view counts and concurrent viewers. It helps you declutter your feed by hiding videos with low engagement or specific types of content you want to avoid.

## Features

- **View Count Filtering**: Hide videos with less than a specified number of views.
- **Live Stream Filtering**: Hide live streams with fewer than a specified number of concurrent viewers.
- **Content Filtering**:
    - **Top Banner**: Hide the large banner at the top of the Home feed.
    - **Mix Lists**: Hide YouTube Mix playlists.
    - **Shorts**: Hide Shorts videos from the feed and shelves.
- **Customizable Settings**:
    - Toggle each filter independently.
    - Choose between **Hide** mode (completely remove) or **Opacity** mode (fade out).
    - **Language Support**: Switch between Japanese and English.
- **Cross-browser**: One codebase builds Manifest V3 extensions for both Chrome/Chromium and Firefox, powered by [WXT](https://wxt.dev).

## Installation

詳細なインストール手順については [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) を参照してください。

1.  Clone the repository.
2.  Run `npm install` to install dependencies.
3.  Build for your browser:
    - Chrome/Chromium: `npm run build` → output in `.output/chrome-mv3`
    - Firefox: `npm run build:firefox` → output in `.output/firefox-mv3`
4.  Load the unpacked extension:
    - **Chrome**: open `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the `.output/chrome-mv3` folder.
    - **Firefox**: open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select any file inside `.output/firefox-mv3` (e.g. `manifest.json`).

## Usage

1.  Click the TubeFilter icon in the browser toolbar.
2.  Adjust the **Minimum Views** slider to set the threshold for regular videos.
3.  Adjust the **Min Concurrent (Live)** slider to set the threshold for live streams.
4.  Use the toggle switches to enable/disable specific filters:
    - **Enable Video Filter**: Toggle view count filtering.
    - **Enable Live Filter**: Toggle live stream filtering.
    - **Hide Top Banner**: Remove the large top banner.
    - **Hide Mix Lists**: Remove auto-generated Mix playlists.
    - **Hide Shorts**: Remove Shorts videos.
5.  Select **Filter Mode**:
    - **Hide**: Completely removes filtered elements from the layout.
    - **Opacity**: Makes filtered elements semi-transparent (useful for checking what's being filtered).
6.  Click the language button (top right) to switch between Japanese and English.

## Development

-   `npm run dev`: Run the Chrome dev build with auto-reload (WXT launches a browser).
-   `npm run dev:firefox`: Run the Firefox dev build.
-   `npm run build` / `npm run build:firefox`: Production build per browser.
-   `npm run zip` / `npm run zip:firefox`: Produce distributable zips in `.output/`.
-   `npm run compile`: Type-check (`wxt prepare && tsc --noEmit`).
-   `npm run lint`: Run ESLint.

## Project structure

-   `src/entrypoints/` — WXT entrypoints: `content/` (content script) and `popup/` (React UI).
-   `src/utils/` — shared, browser-agnostic modules: `filter.ts` / `parser.ts` (core filtering logic), `types.ts` (the `Settings` type), `storage.ts` (settings persistence over `browser.storage.local`).
-   `wxt.config.ts` — WXT config (manifest, Firefox `gecko` settings, MV3).

## Tech Stack

-   [WXT](https://wxt.dev/) (cross-browser MV3 extension framework, built on Vite)
-   [React](https://react.dev/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
