// Locale-aware parsing of YouTube view/viewer counts.
//
// YouTube renders counts very differently per UI language (decimal/thousand
// separators, abbreviation units, the word for "views"). These specs were
// derived from real youtube.com strings scraped across 9 languages, e.g.:
//   en  "62K" / "2.7M"            ja  "285万回視聴" / "3.6億回視聴"
//   es  "1704 M de vistas"        pt  "5,3 mil" / "1,7 bi de visualizações"
//   de  "1,7 Mrd. Aufrufe" / "129.069 Aufrufe"   fr  "42 M de vues" / "1,7 Md"
//   ru  "1,1 млн просмотров"      ko  "조회수 6.2만회" / "조회수 6.9천회"
//   zh  "6.2万次观看" / "67亿次观看"
// Unknown languages fall back to a permissive generic spec.

export type LangKey = 'en' | 'ja' | 'es' | 'pt' | 'de' | 'fr' | 'ru' | 'ko' | 'zh';

export interface LocaleSpec {
    /** Decimal separator used in count strings. */
    decimal: '.' | ',';
    /** Thousands separator to strip (' ' means whitespace, handled generically). */
    thousand: ',' | '.' | ' ';
    /** Abbreviation units → multiplier, MUST be ordered longest-suffix-first. */
    units: Array<[string, number]>;
    /** "views"/connector words to remove before parsing the number (longest-first). */
    strip: string[];
    /** Words that mark a span as a date / past-stream timestamp (NOT a count). */
    dateWords: string[];
    /** Words indicating a currently-live stream (ongoing), used by isLive().
     *  Best-effort for non-en/ja locales (the "streamed-ago" dateWords are verified;
     *  the live-now words are not all confirmed against live pages). */
    liveWords: string[];
    /** Words meaning "no views" → 0. */
    zeroWords: string[];
    /** When true (generic fallback), resolve '.'/',' separators heuristically. */
    ambiguous: boolean;
}

// Universal markers that apply regardless of detected language.
const UNIVERSAL_DATE = ['ago', '前', 'streamed'];
const UNIVERSAL_LIVE = ['watching', 'live', 'ライブ', '視聴中'];

const sortLongest = (arr: string[]) => [...arr].sort((a, b) => b.length - a.length);

function spec(s: {
    decimal: '.' | ',';
    thousand: ',' | '.' | ' ';
    units: Array<[string, number]>;
    strip: string[];
    dateWords: string[];
    liveWords: string[];
    zeroWords?: string[];
    ambiguous?: boolean;
}): LocaleSpec {
    return {
        decimal: s.decimal,
        thousand: s.thousand,
        units: [...s.units].sort((a, b) => b[0].length - a[0].length),
        strip: sortLongest(s.strip),
        dateWords: s.dateWords,
        liveWords: s.liveWords,
        zeroWords: s.zeroWords ?? [],
        ambiguous: s.ambiguous ?? false,
    };
}

export const LOCALES: Record<LangKey, LocaleSpec> = {
    en: spec({
        decimal: '.', thousand: ',',
        units: [['K', 1e3], ['M', 1e6], ['B', 1e9]],
        strip: ['views', 'view'],
        dateWords: ['ago'],
        liveWords: ['watching'],
        zeroWords: ['no views'],
    }),
    ja: spec({
        decimal: '.', thousand: ',',
        units: [['万', 1e4], ['億', 1e8], ['兆', 1e12]],
        strip: ['回視聴', '視聴', '回'],
        dateWords: ['前', '配信済み'],
        liveWords: ['視聴中', '人が視聴中'],
        zeroWords: ['なし'],
    }),
    es: spec({
        decimal: '.', thousand: ',',
        units: [['mil', 1e3], ['k', 1e3], ['M', 1e6]],
        strip: ['de vistas', 'vistas', 'reproducciones'],
        dateWords: ['hace', 'transmitido', 'emitido'],
        liveWords: ['viendo', 'en vivo', 'en directo', 'espectadores'],
        zeroWords: ['sin vistas'],
    }),
    pt: spec({
        decimal: ',', thousand: '.',
        units: [['mil', 1e3], ['mi', 1e6], ['bi', 1e9]],
        strip: ['de visualizações', 'visualizações', 'visualização'],
        dateWords: ['há', 'transmitido', 'atrás'],
        liveWords: ['assistindo', 'ao vivo', 'espectadores'],
        zeroWords: ['sem visualizações'],
    }),
    de: spec({
        decimal: ',', thousand: '.',
        units: [['Mio.', 1e6], ['Mrd.', 1e9], ['Mio', 1e6], ['Mrd', 1e9]],
        strip: ['Aufrufe', 'Aufruf'],
        dateWords: ['vor', 'gestreamt'],
        liveWords: ['Zuschauer', 'sehen sich', 'live'],
        zeroWords: ['keine Aufrufe'],
    }),
    fr: spec({
        decimal: ',', thousand: ' ',
        units: [['Md', 1e9], ['k', 1e3], ['M', 1e6]],
        strip: ['de vues', 'vues', 'vue'],
        dateWords: ['il y a', 'diffusé'],
        liveWords: ['regardent', 'en direct', 'spectateurs'],
        zeroWords: ['aucune vue'],
    }),
    ru: spec({
        decimal: ',', thousand: ' ',
        units: [['тыс.', 1e3], ['млрд', 1e9], ['тыс', 1e3], ['млн', 1e6]],
        strip: ['просмотров', 'просмотра', 'просмотр'],
        dateWords: ['назад', 'трансляция'],
        liveWords: ['смотрят', 'в эфире', 'прямой эфир'],
        zeroWords: ['нет просмотров'],
    }),
    ko: spec({
        decimal: '.', thousand: ',',
        units: [['천', 1e3], ['만', 1e4], ['억', 1e8]],
        strip: ['조회수', '회'],
        dateWords: ['전', '스트리밍'],
        liveWords: ['시청 중', '명 시청', '실시간'],
        zeroWords: ['조회수 없음'],
    }),
    zh: spec({
        decimal: '.', thousand: ',',
        units: [['万', 1e4], ['亿', 1e8], ['億', 1e8], ['萬', 1e4]],
        strip: ['次观看', '观看', '次觀看', '觀看'],
        dateWords: ['前', '直播时间', '直播時間'],
        liveWords: ['正在观看', '人在观看', '观看中', '正在觀看'],
        zeroWords: ['没有观看', '無觀看'],
    }),
};

// Permissive fallback for unknown languages: union of common units, '.' decimal.
const GENERIC: LocaleSpec = spec({
    decimal: '.', thousand: ',',
    units: [
        ['万', 1e4], ['億', 1e8], ['亿', 1e8], ['만', 1e4], ['억', 1e8],
        ['K', 1e3], ['M', 1e6], ['B', 1e9],
    ],
    strip: ['views', 'view', '回視聴', '視聴', '回', '次观看', '观看', '조회수', '회'],
    dateWords: ['ago', '前', '전', 'назад'],
    liveWords: [],
    zeroWords: ['no views', 'なし'],
    ambiguous: true,
});

// European Spanish (Spain) groups thousands with '.' and uses ',' as decimal,
// unlike es-419 (Latin America), which YouTube renders en-style ('.' decimal).
const ES_ES: LocaleSpec = spec({
    decimal: ',', thousand: '.',
    units: [['mil', 1e3], ['k', 1e3], ['M', 1e6]],
    strip: ['de visualizaciones', 'visualizaciones', 'de vistas', 'vistas', 'reproducciones'],
    dateWords: ['hace', 'transmitido', 'emitido'],
    liveWords: ['viendo', 'en directo', 'espectadores'],
    zeroWords: ['sin visualizaciones', 'sin vistas'],
});

/** Normalize an html `lang` / navigator language (e.g. "zh-Hans-CN", "es-419") to a LangKey. */
export function detectLang(raw: string | null | undefined): LangKey | null {
    if (!raw) return null;
    const lower = raw.toLowerCase();
    const primary = lower.split('-')[0];
    const map: Record<string, LangKey> = {
        en: 'en', ja: 'ja', es: 'es', pt: 'pt', de: 'de',
        fr: 'fr', ru: 'ru', ko: 'ko', zh: 'zh',
    };
    return map[primary] ?? null;
}

export function resolveSpec(lang: string | null | undefined): LocaleSpec {
    const lower = (lang ?? '').toLowerCase();
    if (lower.startsWith('es-es')) return ES_ES;
    const key = detectLang(lang);
    return key ? LOCALES[key] : GENERIC;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Resolve '.'/',' for the generic (unknown-locale) parser: a single separator
// followed by 1-2 digits is a decimal point; otherwise (multiple separators, or
// a trailing group of 3 digits) all separators are thousands grouping.
function normalizeAmbiguousNumber(raw: string): string {
    const n = raw.replace(/[^\d.,]/g, '');
    const seps = n.match(/[.,]/g) ?? [];
    if (seps.length === 0) return n;
    const lastSep = Math.max(n.lastIndexOf('.'), n.lastIndexOf(','));
    const after = n.slice(lastSep + 1).replace(/\D/g, '');
    if (seps.length === 1 && after.length >= 1 && after.length <= 2) {
        const sepChar = n[lastSep];
        const other = sepChar === '.' ? ',' : '.';
        return n.split(other).join('').replace(sepChar, '.');
    }
    return n.replace(/[.,]/g, '');
}

/** Collapse all whitespace (incl. NBSP / narrow-NBSP, which JS `\s` matches) to single spaces. */
const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').trim();

/** True if the span text looks like a date / past-stream timestamp, not a count. */
export function isDateText(text: string, s: LocaleSpec): boolean {
    const t = normalizeWs(text).toLowerCase();
    if (UNIVERSAL_DATE.some((w) => t.includes(w.toLowerCase()))) return true;
    return s.dateWords.some((w) => t.includes(w.toLowerCase()));
}

/** True if the text contains one of the locale's "views" keywords. */
export function hasViewKeyword(text: string, s: LocaleSpec): boolean {
    const t = normalizeWs(text).toLowerCase();
    return s.strip.some((w) => t.includes(w.toLowerCase()));
}

/** True if the text looks like a bare numeric count (digits + optional unit), no date words. */
export function looksNumericCount(text: string, s: LocaleSpec): boolean {
    const t = normalizeWs(text);
    if (!/\d/.test(t)) return false;
    if (isDateText(t, s)) return false;
    // strip keywords, then it should be number (+ optional unit) only
    let body = t;
    for (const w of s.strip) body = body.replace(new RegExp(escapeRegExp(w), 'gi'), ' ');
    body = body.trim();
    const unitAlt = s.units.map(([u]) => escapeRegExp(u)).join('|');
    const re = new RegExp(`^[\\d.,\\s]+\\s*(?:${unitAlt})?$`, 'i');
    return re.test(body);
}

/** Parse a numeric count string using the given locale spec. Returns null if unparseable. */
export function parseCount(text: string, s: LocaleSpec): number | null {
    if (!text) return null;
    let t = normalizeWs(text);
    const lower = t.toLowerCase();
    if (s.zeroWords.some((z) => lower.includes(z.toLowerCase()))) return 0;

    // Remove "views"/connector keywords.
    for (const w of s.strip) t = t.replace(new RegExp(escapeRegExp(w), 'gi'), ' ');
    t = normalizeWs(t);

    // Find an abbreviation unit (units are ordered longest-first).
    let multiplier = 1;
    let numPart = t;
    for (const [suffix, mult] of s.units) {
        const re = new RegExp(`([\\d.,\\s]+?)\\s*${escapeRegExp(suffix)}`, 'i');
        const m = t.match(re);
        if (m) {
            numPart = m[1];
            multiplier = mult;
            break;
        }
    }

    // Parse the numeric part with locale separators.
    let n = numPart.replace(/\s/g, '');
    if (s.ambiguous) {
        n = normalizeAmbiguousNumber(n);
    } else {
        if (s.thousand !== ' ') n = n.split(s.thousand).join('');
        if (s.decimal === ',') n = n.replace(',', '.');
        n = n.replace(/[^\d.]/g, '');
    }
    if (!n) return null;
    const val = parseFloat(n);
    return isNaN(val) ? null : Math.round(val * multiplier);
}

/** True if the text indicates a currently-live stream. */
export function isLiveText(text: string, s: LocaleSpec): boolean {
    if (!text) return false;
    const t = normalizeWs(text).toLowerCase();
    if (UNIVERSAL_LIVE.some((w) => t.includes(w.toLowerCase()))) return true;
    return s.liveWords.some((w) => t.includes(w.toLowerCase()));
}
