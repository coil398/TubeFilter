import { injectScript } from '#imports';
import { loadSettings, watchSettings } from '@/utils/storage';

// Isolated-world content script for the "force original audio" feature.
// It owns storage access (the MAIN-world script cannot read chrome.storage),
// injects the MAIN-world player script, and bridges the setting to it.
// Matches all of youtube.com so it survives SPA navigation between feed and
// watch/shorts pages; the MAIN script only acts when a player is present.

const CONFIG_EVENT = 'tubefilter:audio-config';

export default defineContentScript({
    matches: ['https://www.youtube.com/*'],
    runAt: 'document_end',
    async main() {
        await injectScript('/youtube-audio-main.js', { keepInDom: true });

        const send = (forceOriginalAudio: boolean) => {
            window.dispatchEvent(new CustomEvent(CONFIG_EVENT, { detail: { forceOriginalAudio } }));
        };

        const settings = await loadSettings();
        send(settings.forceOriginalAudio);

        // Push live updates when the user toggles the setting.
        watchSettings((next) => send(next.forceOriginalAudio));
    },
});
