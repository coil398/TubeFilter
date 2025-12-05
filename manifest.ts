import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
    manifest_version: 3,
    name: 'TubeFilter',
    version: '1.0.0',
    description: 'Filter YouTube videos based on views and other metrics.',
    action: {
        default_popup: 'src/popup/index.html',
    },
    permissions: ['storage', 'tabs'],
    host_permissions: ['https://www.youtube.com/*'],
    content_scripts: [
        {
            matches: ['https://www.youtube.com/*'],
            js: ['src/content/index.ts'],
            run_at: 'document_end',
        },
    ],
})
