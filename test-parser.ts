import { parseViewCount, isLive } from './src/content/parser';

const testCases = [
    { input: '1.2万回視聴', expected: 12000 },
    { input: '345 views', expected: 345 },
    { input: '1.5M views', expected: 1500000 },
    { input: '1.2K views', expected: 1200 },
    { input: 'No views', expected: 0 },
    { input: '視聴中', expectedLive: true },
    { input: '12K watching', expectedLive: true },
    { input: '1.2万人が視聴中', expectedLive: true },
];

let failed = false;

console.log('Running Parser Tests...');

testCases.forEach(({ input, expected, expectedLive }) => {
    if (expected !== undefined) {
        const result = parseViewCount(input);
        if (result !== expected) {
            console.error(`FAIL: "${input}" -> Expected ${expected}, got ${result}`);
            failed = true;
        } else {
            console.log(`PASS: "${input}" -> ${result}`);
        }
    }

    if (expectedLive !== undefined) {
        const result = isLive(input);
        if (result !== expectedLive) {
            console.error(`FAIL Live: "${input}" -> Expected ${expectedLive}, got ${result}`);
            failed = true;
        } else {
            console.log(`PASS Live: "${input}" -> ${result}`);
        }
    }
});

if (failed) {
    console.error('Some tests failed.');
    process.exit(1);
} else {
    console.log('All tests passed!');
}
