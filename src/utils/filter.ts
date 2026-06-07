import { parseViewCount, isLive } from './parser';
import { resolveSpec, isDateText, hasViewKeyword, isLiveText, looksNumericCount } from './locales';
import type { Settings } from './types';

export const processVideoElement = (element: HTMLElement, settings: Settings, index: number, lang?: string) => {
    // Verbose logging in dev builds only (silent in production builds).
    const debug = import.meta.env.DEV;

    if (debug) console.log(`TubeFilter [${index}]: Processing element`, element);

    // Avoid double-processing: on grids the outer ytd-rich-item-renderer wraps a
    // yt-lockup-view-model. Let the wrapper own styling and skip the nested lockup
    // (watch-sidebar lockups are not wrapped, so they are still processed).
    if (element.tagName.toLowerCase() === 'yt-lockup-view-model' && element.closest('ytd-rich-item-renderer')) {
        return;
    }

    // Check if the element is fully loaded by looking for the title
    const titleElement = element.querySelector('#video-title') ||
        element.querySelector('#video-title-link') ||
        element.querySelector('.yt-lockup-metadata-view-model__title') ||
        element.querySelector('h3 a, h3'); // new yt-lockup-view-model layout

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

    // Channel identity. Old layout: ytd-channel-name / an @handle link.
    // New yt-lockup layout: the first metadata span is the channel name.
    const channelHref = (element.querySelector('a[href^="/@"], a[href*="/channel/"]')?.getAttribute('href') ?? '').toLowerCase();
    let channelName = element.querySelector('ytd-channel-name #text, ytd-channel-name a, #channel-name #text, #channel-name a')?.textContent?.trim() ?? '';
    if (!channelName) {
        channelName = element.querySelector('yt-content-metadata-view-model span')?.textContent?.trim() ?? '';
    }
    const channelLower = channelName.toLowerCase();

    // Exact handle / channel-id / name matching (no substring — "cat" must not
    // match "@catlover" or a /channel/<id> that happens to contain "cat").
    const hrefHandle = channelHref.match(/\/@([^/?]+)/)?.[1] ?? '';
    const hrefId = channelHref.match(/\/channel\/([^/?]+)/)?.[1] ?? '';
    const channelInList = (list: string[]): boolean => list.some((raw) => {
        const e = raw.trim().toLowerCase();
        if (!e) return false;
        const eHandle = e.replace(/^@/, '');
        return channelLower === e || (!!hrefHandle && hrefHandle === eHandle) || (!!hrefId && hrefId === e);
    });

    const title = titleElement?.textContent?.trim() ?? '';
    const titleLower = title.toLowerCase();
    const titleHitsKeyword = settings.titleKeywords.some((raw) => {
        const k = raw.trim();
        if (!k) return false;
        // "/pattern/" is treated as a case-insensitive regex; otherwise substring.
        if (k.length > 2 && k.startsWith('/') && k.endsWith('/')) {
            try { return new RegExp(k.slice(1, -1), 'i').test(title); } catch { return false; }
        }
        return titleLower.includes(k.toLowerCase());
    });

    let shouldFilter = false;
    let reason = '';

    // Channel/keyword overrides apply to individual cards only — NOT aggregate
    // shelves (where querySelector matches an arbitrary first child). They DO
    // apply to single video/playlist/mix cards of a matched channel/title.
    if (!isShortsElement && channelInList(settings.channelBlocklist)) {
        shouldFilter = true; reason = 'channel-blocklist';
    } else if (!isShortsElement && channelInList(settings.channelAllowlist)) {
        shouldFilter = false; reason = 'channel-allowlist'; // always show
    } else if (!isShortsElement && titleHitsKeyword) {
        shouldFilter = true; reason = 'title-keyword';
    } else if (isShorts) {
        if (settings.enableShortsFilter) { shouldFilter = true; reason = 'shorts'; }
    } else if (isMix) {
        if (settings.enableMixFilter) { shouldFilter = true; reason = 'mix'; }
    } else if (isStream) {
        if (settings.enableLiveFilter && views !== null && views < settings.minConcurrent) { shouldFilter = true; reason = 'live'; }
    } else {
        if (settings.enableVideoFilter && views !== null && views < settings.minViews) { shouldFilter = true; reason = 'views'; }
    }

    // Apply filter
    if (shouldFilter) {
        if (debug) console.log(`TubeFilter [${index}]: FILTERED (${reason}; Views: ${views}, Channel: "${channelName}")`);
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
