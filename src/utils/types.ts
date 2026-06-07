export interface Settings {
    minViews: number;
    minConcurrent: number;
    filterMode: 'hide' | 'opacity';
    enableVideoFilter: boolean;
    enableLiveFilter: boolean;
    enableBannerFilter: boolean;
    enableMixFilter: boolean;
    enableShortsFilter: boolean;
    forceOriginalAudio: boolean;
    channelAllowlist: string[];
    channelBlocklist: string[];
    titleKeywords: string[];
    language: 'auto' | 'en' | 'ja' | 'es' | 'pt' | 'de' | 'fr' | 'ru' | 'ko' | 'zh';
}
