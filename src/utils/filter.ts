import { parseViewCount, isLive } from './parser';
import { resolveSpec, isDateText, hasViewKeyword, isLiveText, looksNumericCount } from './locales';
import type { Settings } from './types';

export const processVideoElement = (element: HTMLElement, settings: Settings, index: number, lang?: string) => {
    // Set to true for verbose logging during development
    const debug = true;

    if (debug) console.log(`TubeFilter [${index}]: Processing element`, element);

    // Check if the element is fully loaded by looking for the title
    const titleElement = element.querySelector('#video-title') ||
        element.querySelector('#video-title-link') ||
        element.querySelector('.yt-lockup-metadata-view-model__title');

    // Special check for Shorts shelf or items which might not have standard video titles
    const isShortsElement = element.tagName.toLowerCase() === 'ytd-rich-shelf-renderer' ||
        element.tagName.toLowerCase() === 'ytd-reel-item-renderer';

    if (!titleElement && !isShortsElement) {
        if (debug) console.log(`TubeFilter [${index}]: Skipped - No title element found`, element.tagName);
        return;
    }

    if (debug) console.log(`TubeFilter [${index}]: Title found: "${titleElement?.textContent?.trim()}"`);

    // Identify metadata
    // ytd-video-meta-block is common, but sometimes it's inside other containers
    let metaBlock = element.querySelector('#metadata-line');
    if (!metaBlock) {
        // Fallback for different renderer types or potential YouTube DOM changes
        metaBlock = element.querySelector('.ytd-video-meta-block');
    }
    if (!metaBlock) {
        metaBlock = element.querySelector('ytd-video-meta-block');
    }
    // New UI support
    if (!metaBlock) {
        metaBlock = element.querySelector('yt-content-metadata-view-model');
    }

    if (!metaBlock && !isShortsElement) {
        if (debug) console.log(`TubeFilter [${index}]: Skipped - No metadata block found`);
        return;
    }

    const spans = metaBlock ? metaBlock.querySelectorAll('span') : [];
    if (debug) console.log(`TubeFilter [${index}]: Found ${spans.length} spans in metadata`);
    let viewCountText = '';
    let isStream = false;

    // Check for live badge
    const badges = element.querySelectorAll('.badge-style-type-live-now, .badge-style-type-live-now-alternate, [overlay-style="LIVE"]');
    if (badges.length > 0) {
        isStream = true;
        if (debug) console.log(`TubeFilter [${index}]: Live badge found`);
    }

    // Resolve the locale spec for the current YouTube page language.
    const spec = resolveSpec(lang);

    // Iterate spans to find the view-count span (locale-aware).
    let foundViewCount = false;
    for (const span of spans) {
        const text = span.textContent?.trim() || '';
        if (debug) console.log(`TubeFilter [${index}]: Checking span text: "${text}"`);

        // Skip date / past-stream timestamps.
        if (isDateText(text, spec)) continue;

        // A span with the locale's "views" keyword — or a live-viewer span like
        // "12K watching" / "1,2 mil espectadores" — is the count-bearing span.
        if (hasViewKeyword(text, spec) || isLiveText(text, spec)) {
            viewCountText = text;
            if (isLive(text, lang)) isStream = true;
            foundViewCount = true;
            break;
        }
    }

    // Fallback: a bare numeric count (e.g. English "62K" with no "views" word).
    if (!foundViewCount) {
        for (const span of spans) {
            const text = span.textContent?.trim() || '';
            if (debug) console.log(`TubeFilter [${index}]: Checking fallback text: "${text}"`);
            if (isDateText(text, spec)) continue;

            if (looksNumericCount(text, spec)) {
                viewCountText = text;
                break;
            }
        }
    }

    const views = parseViewCount(viewCountText, lang);
    if (debug) console.log(`TubeFilter [${index}]: Parsed views: ${views} from "${viewCountText}" (Live: ${isStream})`);

    // Check for Mix list
    let isMix = false;
    const radioLink = element.querySelector('a[href*="start_radio=1"], a[href*="list=RD"]');
    const mixBadge = element.querySelector('ytd-thumbnail-overlay-bottom-panel-renderer[overlay-style="MIX"]');
    // Also check for "Mix" text in title if it's a radio renderer (though we are processing generic elements)
    // Or if the element itself is a radio renderer (which might be passed here)
    if (radioLink || mixBadge || element.tagName.toLowerCase() === 'ytd-radio-renderer') {
        isMix = true;
        if (debug) console.log(`TubeFilter [${index}]: Mix list detected`);
    }

    // Check for Shorts
    let isShorts = false;
    const shortsLink = element.querySelector('a[href*="/shorts/"]');
    const shortsOverlay = element.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]');
    if (shortsLink || shortsOverlay || element.tagName.toLowerCase() === 'ytd-reel-item-renderer' || element.tagName.toLowerCase() === 'ytd-rich-shelf-renderer') {
        isShorts = true;
        if (debug) console.log(`TubeFilter [${index}]: Shorts detected`);
    }

    let shouldFilter = false;

    if (isShorts) {
        if (settings.enableShortsFilter) {
            shouldFilter = true;
        }
    } else if (isMix) {
        if (settings.enableMixFilter) {
            shouldFilter = true;
        }
    } else if (isStream) {
        if (settings.enableLiveFilter && views !== null && views < settings.minConcurrent) {
            shouldFilter = true;
        }
    } else {
        if (settings.enableVideoFilter && views !== null && views < settings.minViews) {
            shouldFilter = true;
        }
    }

    // Apply filter
    if (shouldFilter) {
        console.log(`TubeFilter [${index}]: FILTERED (Shorts: ${isShorts}, Mix: ${isMix}, Views: ${views}, Min: ${isStream ? settings.minConcurrent : settings.minViews})`);
        if (settings.filterMode === 'hide') {
            element.style.display = 'none';
        } else {
            element.style.opacity = '0.1';
        }
    } else {
        // Reset styles if previously filtered
        element.style.display = '';
        element.style.opacity = '';
    }
};

export const processBannerElement = (element: HTMLElement, settings: Settings) => {
    if (settings.enableBannerFilter) {
        element.style.display = 'none';
    } else {
        element.style.display = '';
    }
};
