import { processVideoElement, processBannerElement } from '@/utils/filter';
import type { Settings } from '@/utils/types';
import { defaultSettings, loadSettings, watchSettings } from '@/utils/storage';

export default defineContentScript({
    matches: ['https://www.youtube.com/*'],
    runAt: 'document_end',
    main() {
        let currentSettings: Settings = defaultSettings;
        let timeoutId: number | null = null;

        const runFilter = () => {
            const BUILD_TIMESTAMP = '2025-12-05T16:10:00';
            console.log(`TubeFilter: runFilter started (Build: ${BUILD_TIMESTAMP})`);

            // Detect the YouTube page language for locale-aware view-count parsing
            // (e.g. "1,7 Mrd." in de vs "1.7B" in en vs "17億" in ja).
            const pageLang = document.documentElement.lang || navigator.language || 'en';

            const videoSelectors = [
                'ytd-rich-item-renderer', // Home
                'ytd-video-renderer', // Search
                'ytd-compact-video-renderer', // Sidebar
                'ytd-grid-video-renderer', // Channel
                'ytd-radio-renderer', // Mix lists
                'ytd-reel-item-renderer', // Shorts (individual)
                'ytd-rich-shelf-renderer' // Shorts (shelf)
            ];

            const bannerSelectors = [
                '#masthead-ad',
                '#big-yoodle', // New banner container
                'ytd-statement-banner-renderer', // Specific banner renderer
                'ytd-rich-section-renderer > #content > ytd-statement-banner-renderer',
                'ytd-rich-section-renderer > #content > ytd-banner-promo-renderer-background',
                'ytd-banner-promo-renderer', // General promo banner
                'ytd-ad-slot-renderer', // Ad slot
                'ytd-in-feed-ad-layout-renderer', // In-feed ad
                'ytd-rich-section-renderer > #content > ytd-banner-renderer' // Generic banner inside section
            ];

            const videos = document.querySelectorAll(videoSelectors.join(','));
            console.log(`TubeFilter: Found ${videos.length} video elements`);

            videos.forEach((video, index) => {
                processVideoElement(video as HTMLElement, currentSettings, index, pageLang);
            });

            const banners = document.querySelectorAll(bannerSelectors.join(','));
            console.log(`TubeFilter: Found ${banners.length} banner elements`);
            if (document.querySelector('#big-yoodle')) {
                console.log('TubeFilter: #big-yoodle FOUND in DOM');
            } else {
                console.log('TubeFilter: #big-yoodle NOT found in DOM');
            }

            banners.forEach((banner) => {
                // If we found the inner banner element, we want to hide its parent section
                const section = banner.closest('ytd-rich-section-renderer');
                if (section) {
                    processBannerElement(section as HTMLElement, currentSettings);
                } else {
                    processBannerElement(banner as HTMLElement, currentSettings);
                }
            });
        };

        // Load settings (replaces chrome.storage.local.get)
        void loadSettings().then((settings) => {
            currentSettings = settings;
            runFilter();
        });

        // Re-run on any settings change (replaces chrome.storage.onChanged fan-out)
        watchSettings((settings) => {
            currentSettings = settings;
            runFilter();
        });

        // Throttled Observer
        const observer = new MutationObserver((mutations) => {
            let shouldRun = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldRun = true;
                    break;
                }
            }

            if (shouldRun) {
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                }
                timeoutId = window.setTimeout(() => {
                    runFilter();
                }, 500); // Run at most every 500ms
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Initial run
        runFilter();
    },
});
