export interface Settings {
    minViews: number;
    minConcurrent: number;
    filterMode: 'hide' | 'opacity';
    enableVideoFilter: boolean;
    enableLiveFilter: boolean;
    enableBannerFilter: boolean;
    enableMixFilter: boolean;
    enableShortsFilter: boolean;
    language: 'auto' | 'en' | 'ja' | 'es' | 'pt' | 'de' | 'fr' | 'ru' | 'ko' | 'zh';
}
