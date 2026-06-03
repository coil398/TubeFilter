export interface Settings {
    minViews: number;
    minConcurrent: number;
    filterMode: 'hide' | 'opacity';
    enableVideoFilter: boolean;
    enableLiveFilter: boolean;
    enableBannerFilter: boolean;
    enableMixFilter: boolean;
    enableShortsFilter: boolean;
    language: 'auto' | 'ja' | 'en';
}
