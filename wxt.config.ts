import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  // Single source of truth for Firefox MV3 -> .output/firefox-mv3 (no --mv3 in scripts).
  // Chrome is MV3 by default; this is harmless for it.
  manifestVersion: 3,
  manifest: {
    // Only fields that are NOT auto-generated and NOT entrypoint-derived.
    // name overrides package.json "tube-filter" to preserve the display name.
    name: 'TubeFilter',
    description: 'Filter YouTube videos based on views and other metrics.',
    permissions: ['storage'],
    host_permissions: ['https://www.youtube.com/*'],
    // The MAIN-world player script is injected via injectScript(), so it must be
    // web-accessible (WXT does not auto-add it — see wxt issue #536).
    web_accessible_resources: [
      {
        resources: ['youtube-audio-main.js'],
        matches: ['https://www.youtube.com/*'],
      },
    ],
    // gecko.id required for AMO (MV3). Harmless on Chrome (ignored).
    browser_specific_settings: {
      gecko: {
        id: 'tube-filter@coil398.github.io',
        // Firefox (AMO) requires a data-collection declaration for new
        // extensions since 2025-11-03. TubeFilter collects nothing — it only
        // reads YouTube DOM and stores settings locally — so declare "none".
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
});
