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
    // gecko.id required for AMO (MV3). Harmless on Chrome (ignored).
    browser_specific_settings: {
      gecko: {
        id: 'tube-filter@coil398.github.io',
      },
    },
  },
});
