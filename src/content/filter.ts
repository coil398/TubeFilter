import { parseViewCount, isLive } from './parser';

export interface Settings {
    minViews: number;
    minConcurrent: number;
    filterMode: 'hide' | 'opacity';
    enableVideoFilter: boolean;
    enableLiveFilter: boolean;
    enableBannerFilter: boolean;
    enableMixFilter: boolean;
}

export const processVideoElement = (element: HTMLElement, settings: Settings, index: number) => {
    const debug = index < 3; // Verbose log for first 3 elements

    if (debug) console.log(`TubeFilter [${index}]: Processing element`, element);

    // Check if the element is fully loaded by looking for the title
    const titleElement = element.querySelector('#video-title') ||
        element.querySelector('#video-title-link') ||
        element.querySelector('.yt-lockup-metadata-view-model__title');
    if (!titleElement) {
        if (debug) console.log(`TubeFilter [${index}]: Skipped - No title element found`);
        return;
    }

    if (debug) console.log(`TubeFilter [${index}]: Title found: "${titleElement.textContent?.trim()}"`);

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

    if (!metaBlock) {
        if (debug) console.log(`TubeFilter [${index}]: Skipped - No metadata block found`);
        return;
    }

    const spans = metaBlock.querySelectorAll('span');
    if (debug) console.log(`TubeFilter [${index}]: Found ${spans.length} spans in metadata`);
    let viewCountText = '';
    let isStream = false;

    // Check for live badge
    const badges = element.querySelectorAll('.badge-style-type-live-now, .badge-style-type-live-now-alternate, [overlay-style="LIVE"]');
    if (badges.length > 0) {
        isStream = true;
        if (debug) console.log(`TubeFilter [${index}]: Live badge found`);
    }

    // Iterate spans to find view count pattern
    for (const span of spans) {
        const text = span.textContent || '';
        if (debug) console.log(`TubeFilter [${index}]: Checking span text: "${text}"`);
        // console.log('TubeFilter: Checking text:', text);
        if (isLive(text)) {
            isStream = true;
            viewCountText = text;
            break;
        }
        if (/\d/.test(text)) {
            if (!text.includes('ago') && !text.includes('前')) {
                viewCountText = text;
                break;
            }
        }
    }

    const views = parseViewCount(viewCountText);
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

    let shouldFilter = false;

    if (isMix) {
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
        console.log(`TubeFilter [${index}]: FILTERED (Mix: ${isMix}, Views: ${views}, Min: ${isStream ? settings.minConcurrent : settings.minViews})`);
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
