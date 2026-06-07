import { browser } from '#imports';
import type { Settings } from './types';

export const defaultSettings: Settings = {
    minViews: 1000,
    minConcurrent: 50,
    filterMode: 'opacity',
    enableVideoFilter: true,
    enableLiveFilter: true,
    enableBannerFilter: true,
    enableMixFilter: true,
    enableShortsFilter: true,
    forceOriginalAudio: true,
    language: 'auto',
};

// Flat key layout preserved (one top-level key per field), identical to the
// pre-WXT chrome.storage.local shape, so existing users keep their settings.
// browser.storage.local.get(defaults) merges stored values over the defaults.
export async function loadSettings(): Promise<Settings> {
    const items = await browser.storage.local.get(defaultSettings as unknown as Record<string, unknown>);
    return items as unknown as Settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
    await browser.storage.local.set(settings);
}

// Re-read the whole flat record on any local change and hand it back.
// Replaces the per-field onChanged fan-out; behavior is equivalent
// (any settings change re-runs the filter) and robust to new fields.
export function watchSettings(callback: (settings: Settings) => void): void {
    browser.storage.onChanged.addListener((_changes, areaName) => {
        if (areaName !== 'local') return;
        void loadSettings().then(callback);
    });
}
