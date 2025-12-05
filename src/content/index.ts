import { processVideoElement } from './filter';

interface Settings {
    minViews: number;
    minConcurrent: number;
    filterMode: 'hide' | 'opacity';
    enableVideoFilter: boolean;
    enableLiveFilter: boolean;
}

const defaultSettings: Settings = {
    minViews: 1000,
    minConcurrent: 50,
    filterMode: 'opacity',
    enableVideoFilter: true,
    enableLiveFilter: true,
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
    runFilter();
});

const runFilter = () => {
    const BUILD_TIMESTAMP = '2025-12-05T14:20:00';
    console.log(`TubeFilter: runFilter started (Build: ${BUILD_TIMESTAMP})`);
    const videoSelectors = [
        'ytd-rich-item-renderer', // Home
        'ytd-video-renderer', // Search
        'ytd-compact-video-renderer', // Related
        'ytd-grid-video-renderer' // Channel videos
    ];

    const videos = document.querySelectorAll(videoSelectors.join(','));
    console.log(`TubeFilter: Found ${videos.length} video elements`);

    videos.forEach((video, index) => {
        processVideoElement(video as HTMLElement, currentSettings, index);
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
