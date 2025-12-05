import { processVideoElement, processBannerElement, type Settings } from './filter';

const defaultSettings: Settings = {
    minViews: 1000,
    minConcurrent: 50,
    filterMode: 'opacity',
    enableVideoFilter: true,
    enableLiveFilter: true,
    enableBannerFilter: true,
    enableMixFilter: true,
    enableShortsFilter: true,
    language: 'ja',
};

let currentSettings: Settings = defaultSettings;
let timeoutId: number | null = null;

// Load settings
chrome.storage.local.get(defaultSettings as unknown as { [key: string]: unknown }, (items) => {
    currentSettings = items as unknown as Settings;
    runFilter();
});

// Listen for changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.minViews) currentSettings.minViews = changes.minViews.newValue as number;
    if (changes.minConcurrent) currentSettings.minConcurrent = changes.minConcurrent.newValue as number;
    if (changes.filterMode) currentSettings.filterMode = changes.filterMode.newValue as 'hide' | 'opacity';
    if (changes.enableVideoFilter) currentSettings.enableVideoFilter = changes.enableVideoFilter.newValue as boolean;
    if (changes.enableLiveFilter) currentSettings.enableLiveFilter = changes.enableLiveFilter.newValue as boolean;
    if (changes.enableBannerFilter) currentSettings.enableBannerFilter = changes.enableBannerFilter.newValue as boolean;
    if (changes.enableMixFilter) currentSettings.enableMixFilter = changes.enableMixFilter.newValue as boolean;
    if (changes.enableShortsFilter) currentSettings.enableShortsFilter = changes.enableShortsFilter.newValue as boolean;
    if (changes.language) currentSettings.language = changes.language.newValue as 'ja' | 'en';
    runFilter();
});

const runFilter = () => {
    // const BUILD_TIMESTAMP = '2025-12-05T14:50:00';
    // console.log(`TubeFilter: runFilter started (Build: ${BUILD_TIMESTAMP})`);
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
        // 'ytd-rich-section-renderer.style-scope.ytd-rich-grid-renderer' // This was too broad and hid Shorts shelves
        'ytd-rich-section-renderer > #content > ytd-statement-banner-renderer', // Specific to statement banner
        'ytd-rich-section-renderer > #content > ytd-banner-promo-renderer-background' // Another banner type
    ];

    const videos = document.querySelectorAll(videoSelectors.join(','));
    // console.log(`TubeFilter: Found ${videos.length} video elements`);

    videos.forEach((video, index) => {
        processVideoElement(video as HTMLElement, currentSettings, index);
    });

    const banners = document.querySelectorAll(bannerSelectors.join(','));
    // console.log(`TubeFilter: Found ${banners.length} banner elements`);

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
