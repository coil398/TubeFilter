import { resolveSpec, parseCount, isLiveText } from './locales';

// Locale-aware parsing. `lang` is the YouTube page language (from the page's
// `<html lang>` / navigator.language). When omitted, a permissive generic spec
// is used (handles en/ja/CJK and K/M/B best-effort).

export const parseViewCount = (text: string, lang?: string): number | null =>
    parseCount(text, resolveSpec(lang));

export const isLive = (text: string, lang?: string): boolean =>
    isLiveText(text, resolveSpec(lang));
