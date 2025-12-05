export const parseViewCount = (text: string): number | null => {
    if (!text) return null;

    // Remove "views", "回視聴", etc.
    // "1.2万回視聴" -> "1.2万"
    // "12K watching" -> "12K"
    const cleanText = text.replace(/views|view|回視聴|視聴|回|watching|人|人が視聴中/gi, '').trim();

    // Handle "No views" or similar
    if (cleanText.includes('No') || cleanText === 'なし') return 0;

    // Handle Japanese units
    if (cleanText.includes('万')) {
        const num = parseFloat(cleanText.replace('万', ''));
        return num * 10000;
    }
    if (cleanText.includes('億')) {
        const num = parseFloat(cleanText.replace('億', ''));
        return num * 100000000;
    }

    // Handle English units
    if (cleanText.toUpperCase().includes('K')) {
        const num = parseFloat(cleanText.replace(/K/i, ''));
        return num * 1000;
    }
    if (cleanText.toUpperCase().includes('M')) {
        const num = parseFloat(cleanText.replace(/M/i, ''));
        return num * 1000000;
    }
    if (cleanText.toUpperCase().includes('B')) {
        const num = parseFloat(cleanText.replace(/B/i, ''));
        return num * 1000000000;
    }

    // Plain number (with commas)
    const num = parseFloat(cleanText.replace(/,/g, ''));
    return isNaN(num) ? null : num;
};

export const isLive = (text: string): boolean => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return lower.includes('視聴中') || lower.includes('watching') || lower.includes('live') || lower.includes('ライブ');
};
