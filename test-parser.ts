import { parseViewCount, isLive } from './src/utils/parser';

// NBSP / narrow-NBSP as they actually appear in scraped YouTube strings.
const NB = '\u00a0';

// Real strings scraped from youtube.com across 9 UI languages, with the
// view counts they must parse to. (lang = YouTube page language.)
const viewCases: { input: string; lang: string; expected: number }[] = [
    // English
    { input: '62K', lang: 'en', expected: 62000 },
    { input: '2.7M', lang: 'en', expected: 2700000 },
    { input: '24M', lang: 'en', expected: 24000000 },
    { input: '1.2B', lang: 'en', expected: 1200000000 },
    // Japanese
    { input: '285万回視聴', lang: 'ja', expected: 2850000 },
    { input: '6.2万回視聴', lang: 'ja', expected: 62000 },
    { input: '3.6億回視聴', lang: 'ja', expected: 360000000 },
    { input: '67億回視聴', lang: 'ja', expected: 6700000000 },
    // Spanish (NBSP between number and unit)
    { input: `1704${NB}M de vistas`, lang: 'es', expected: 1704000000 },
    { input: `6.9${NB}K vistas`, lang: 'es', expected: 6900 },
    { input: `18${NB}k vistas`, lang: 'es', expected: 18000 },
    // Portuguese (comma decimal, mil/mi/bi)
    { input: `5,3${NB}mil visualizações`, lang: 'pt', expected: 5300 },
    { input: `42${NB}mi de visualizações`, lang: 'pt', expected: 42000000 },
    { input: `1,7${NB}bi de visualizações`, lang: 'pt', expected: 1700000000 },
    // German (comma decimal, period thousands, Mio./Mrd.)
    { input: `42${NB}Mio. Aufrufe`, lang: 'de', expected: 42000000 },
    { input: '129.069 Aufrufe', lang: 'de', expected: 129069 },
    { input: `1,7${NB}Mrd. Aufrufe`, lang: 'de', expected: 1700000000 },
    // French (comma decimal, space thousands, k/M/Md)
    { input: `42${NB}M de vues`, lang: 'fr', expected: 42000000 },
    { input: `1,7${NB}Md de vues`, lang: 'fr', expected: 1700000000 },
    { input: `109${NB}k${NB}vues`, lang: 'fr', expected: 109000 },
    // Russian (comma decimal, тыс./млн/млрд)
    { input: `1,1${NB}млн просмотров`, lang: 'ru', expected: 1100000 },
    { input: `62${NB}тыс. просмотров`, lang: 'ru', expected: 62000 },
    { input: `24${NB}млн просмотров`, lang: 'ru', expected: 24000000 },
    // Korean (조회수 … 회, 천/만/억)
    { input: '조회수 6.2만회', lang: 'ko', expected: 62000 },
    { input: '조회수 6.9천회', lang: 'ko', expected: 6900 },
    { input: '조회수 1406만회', lang: 'ko', expected: 14060000 },
    { input: '조회수 1.3억회', lang: 'ko', expected: 130000000 },
    // Chinese simplified (万/亿, 次观看)
    { input: '6.2万次观看', lang: 'zh', expected: 62000 },
    { input: '67亿次观看', lang: 'zh', expected: 6700000000 },
    { input: '6901次观看', lang: 'zh', expected: 6901 },
    { input: '12万次观看', lang: 'zh', expected: 120000 },
    // Generic fallback (no lang) — legacy en/ja behavior
    { input: '345 views', lang: '', expected: 345 },
    { input: '1.5M views', lang: '', expected: 1500000 },
    { input: '1.2万回視聴', lang: '', expected: 12000 },
    { input: 'No views', lang: '', expected: 0 },
    // es-ES (Spain): '.' thousands, ',' decimal — must NOT 1000x-undercount
    { input: '12.345 vistas', lang: 'es-ES', expected: 12345 },
    { input: '1.234.567 vistas', lang: 'es-ES', expected: 1234567 },
    { input: `6,9${NB}K vistas`, lang: 'es-ES', expected: 6900 },
    // Generic fallback with ambiguous period-thousands (it/tr/nl/id/vi, etc.)
    { input: '12.345', lang: '', expected: 12345 },
    { input: '1.234.567', lang: '', expected: 1234567 },
    // English live-viewer count ("watching") must still parse to a number
    { input: '12K watching', lang: 'en', expected: 12000 },
];

// Cross-check: a German "1,7 Mrd." MUST NOT be parsed with the generic spec
// (which would mangle the comma) — proves locale detection matters.
const localeMattersCases: { input: string; lang: string; notExpected: number }[] = [
    { input: `1,7${NB}Mrd. Aufrufe`, lang: 'de', notExpected: 17 },
];

const liveCases: { input: string; lang: string; expectedLive: boolean }[] = [
    { input: '視聴中', lang: 'ja', expectedLive: true },
    { input: '12K watching', lang: 'en', expectedLive: true },
    { input: '1.2万人が視聴中', lang: 'ja', expectedLive: true },
    // "streamed X ago" is a PAST stream, not currently live
    { input: `vor 1 Jahr gestreamt`, lang: 'de', expectedLive: false },
    { input: '스트리밍 시간: 1년 전', lang: 'ko', expectedLive: false },
    { input: '285万回視聴', lang: 'ja', expectedLive: false },
];

let failed = false;
console.log('Running locale-aware parser tests...\n');

for (const { input, lang, expected } of viewCases) {
    const result = parseViewCount(input, lang || undefined);
    if (result !== expected) {
        console.error(`FAIL [${lang || 'generic'}]: "${input}" -> expected ${expected}, got ${result}`);
        failed = true;
    } else {
        console.log(`PASS [${lang || 'generic'}]: "${input}" -> ${result}`);
    }
}

for (const { input, lang, notExpected } of localeMattersCases) {
    const result = parseViewCount(input, lang);
    if (result === notExpected) {
        console.error(`FAIL [${lang}] locale-matters: "${input}" wrongly parsed to ${notExpected}`);
        failed = true;
    } else {
        console.log(`PASS [${lang}] locale-matters: "${input}" -> ${result} (not ${notExpected})`);
    }
}

for (const { input, lang, expectedLive } of liveCases) {
    const result = isLive(input, lang);
    if (result !== expectedLive) {
        console.error(`FAIL live [${lang}]: "${input}" -> expected ${expectedLive}, got ${result}`);
        failed = true;
    } else {
        console.log(`PASS live [${lang}]: "${input}" -> ${result}`);
    }
}

if (failed) {
    console.error('\nSome tests failed.');
    process.exit(1);
} else {
    console.log('\nAll tests passed!');
}
