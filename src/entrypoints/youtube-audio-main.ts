// MAIN-world script (injected via injectScript from the isolated content script).
// YouTube's player audio-track methods live on the page-world #movie_player /
// #shorts-player element and are NOT reachable from the isolated content world,
// so this runs in the page's MAIN world.
//
// "Force original audio" = undo YouTube auto-dubbing by selecting the original
// audio track. The original track is identified language-independently by
// base64-decoding `track.id` (after the "<itag>;" prefix): the decoded xtags
// carry an "acont" (audio content) field whose value is "original" for the
// original track and "dubbed"/"dubbed-auto" for dubs. Verified empirically
// against live youtube.com and corroborated by the YouTube-No-Translation and
// yt-anti-translate projects.

interface YtAudioTrack {
    id: string;
}

interface YtPlayer extends HTMLElement {
    getAvailableAudioTracks?: () => YtAudioTrack[];
    getAudioTrack?: () => YtAudioTrack;
    setAudioTrack?: (track: YtAudioTrack) => void;
}

const CONFIG_EVENT = 'tubefilter:audio-config';
const PLAYER_IDS = ['movie_player', 'shorts-player'];
const MAX_ATTEMPTS = 12; // ~6s of 500ms ticks before giving up per trigger

export default defineUnlistedScript(() => {
    let enabled = false;
    let timer: number | null = null;

    const stopTimer = () => {
        if (timer !== null) {
            window.clearInterval(timer);
            timer = null;
        }
    };

    // True only when the decoded xtags mark this track's audio content as original
    // (anchored near the "acont" key so the word "original" elsewhere can't match).
    const isOriginal = (track: YtAudioTrack | null | undefined): boolean => {
        if (!track || typeof track.id !== 'string') return false;
        const b64 = track.id.split(';')[1];
        if (!b64) return false;
        try {
            const decoded = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
            return /acont[\s\S]{0,8}original/.test(decoded);
        } catch {
            return false;
        }
    };

    // Returns true when this player is already on / has been switched to the
    // original track (i.e. nothing more to do), false if it should be retried.
    const applyToPlayer = (player: YtPlayer): boolean => {
        if (typeof player.getAvailableAudioTracks !== 'function') return false;
        let tracks: YtAudioTrack[];
        try {
            tracks = player.getAvailableAudioTracks();
        } catch {
            return false;
        }
        if (!tracks || tracks.length <= 1) return false;

        const original = tracks.find(isOriginal);
        if (!original) return false;

        let current: YtAudioTrack | undefined;
        try {
            current = player.getAudioTrack?.();
        } catch {
            current = undefined;
        }
        // Identity compare (not the loose match) so the no-op decision is tied to
        // the exact track we would otherwise select.
        if (current && current.id === original.id) return true;

        if (typeof player.setAudioTrack === 'function') {
            try {
                player.setAudioTrack(original);
                return true;
            } catch {
                /* player API changed — fail silently */
            }
        }
        return false;
    };

    // True if every present player is satisfied (so the retry loop can stop early).
    const applyAll = (): boolean => {
        if (!enabled) return false;
        let satisfied = false;
        for (const id of PLAYER_IDS) {
            const el = document.getElementById(id) as YtPlayer | null;
            if (el && applyToPlayer(el)) satisfied = true;
        }
        return satisfied;
    };

    // The player API is often not populated the instant a navigation/media event
    // fires, so retry a bounded number of times, stopping as soon as we succeed.
    const applyWithRetry = (): void => {
        if (!enabled) return;
        stopTimer();
        let attempts = 0;
        timer = window.setInterval(() => {
            attempts += 1;
            const done = applyAll();
            if (done || attempts >= MAX_ATTEMPTS || !enabled) stopTimer();
        }, 500);
    };

    // Receive the setting from the isolated content script (which owns storage).
    window.addEventListener(CONFIG_EVENT, (e: Event) => {
        const detail = (e as CustomEvent<{ forceOriginalAudio?: boolean }>).detail;
        enabled = !!detail?.forceOriginalAudio;
        if (enabled) applyWithRetry();
        else stopTimer(); // disable immediately (already-switched videos revert on next nav)
    });

    // Re-apply on SPA navigation and when a new media source loads.
    for (const ev of ['yt-navigate-finish', 'yt-page-data-updated', 'yt-player-updated']) {
        window.addEventListener(ev, applyWithRetry);
    }
    document.addEventListener('loadstart', () => { void applyAll(); }, true);
    document.addEventListener('loadedmetadata', () => { void applyAll(); }, true);

    // Initial attempt (in case the page is already on a watch/shorts page).
    applyWithRetry();
});
