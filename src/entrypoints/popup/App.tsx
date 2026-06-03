import { useEffect, useState } from 'react'
import type { Settings } from '@/utils/types'
import { defaultSettings, loadSettings, saveSettings } from '@/utils/storage'

const translations = {
  ja: {
    title: 'TubeFilter 設定',
    minViews: '最低再生回数',
    minConcurrent: '最低同時接続数 (ライブ)',
    filterMode: 'フィルタリングモード',
    modeHide: '非表示',
    modeOpacity: '薄く表示',
    enableVideoFilter: '動画フィルタ有効',
    enableLiveFilter: 'ライブフィルタ有効',
    hideTopBanner: 'トップバナー非表示',
    hideMixLists: 'ミックスリスト非表示',
    hideShorts: 'ショート動画非表示',
    liveStreamNote: '視聴者数が少ないライブ配信はフィルタリングされます。',
    language: '言語',
  },
  en: {
    title: 'TubeFilter Settings',
    minViews: 'Min Views',
    minConcurrent: 'Min Concurrent (Live)',
    filterMode: 'Filter Mode',
    modeHide: 'Hide',
    modeOpacity: 'Opacity',
    enableVideoFilter: 'Enable Video Filter',
    enableLiveFilter: 'Enable Live Filter',
    hideTopBanner: 'Hide Top Banner',
    hideMixLists: 'Hide Mix Lists',
    hideShorts: 'Hide Shorts',
    liveStreamNote: 'Live streams with fewer viewers will be filtered.',
    language: 'Language',
  },
}

function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    void loadSettings().then(setSettings)
  }, [])

  useEffect(() => {
    void saveSettings(settings)
  }, [settings])

  // Effective UI language: 'auto' follows the browser UI language (navigator.language).
  const uiLang: 'ja' | 'en' =
    settings.language === 'auto'
      ? (navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en')
      : settings.language

  const t = (key: keyof typeof translations.ja) => {
    return translations[uiLang][key]
  }

  return (
    <div className="w-80 bg-gray-900 text-white p-4 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-red-500 flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </svg>
          {t('title')}
        </h1>
        <div className="flex items-center gap-1" role="group" aria-label={t('language')}>
          {(['auto', 'ja', 'en'] as const).map((lng) => (
            <button
              key={lng}
              onClick={() => setSettings({ ...settings, language: lng })}
              aria-pressed={settings.language === lng}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                settings.language === lng
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300'
              }`}
              title={lng === 'auto' ? 'Auto (follow browser language)' : lng === 'ja' ? '日本語' : 'English'}
            >
              {lng === 'auto' ? 'Auto' : lng === 'ja' ? '日本語' : 'EN'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Min Views Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">{t('minViews')}</label>
            <span className="text-sm font-bold text-red-400">{settings.minViews.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={settings.minViews}
              onChange={(e) => setSettings({ ...settings, minViews: Number(e.target.value) })}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              disabled={!settings.enableVideoFilter}
            />
            <button
              onClick={() => setSettings({ ...settings, enableVideoFilter: !settings.enableVideoFilter })}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                settings.enableVideoFilter ? 'bg-red-600' : 'bg-gray-700'
              }`}
              title={settings.enableVideoFilter ? 'Disable Filter' : 'Enable Filter'}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.enableVideoFilter ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Min Concurrent Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">{t('minConcurrent')}</label>
            <span className="text-sm font-bold text-red-400">{settings.minConcurrent.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={settings.minConcurrent}
              onChange={(e) => setSettings({ ...settings, minConcurrent: Number(e.target.value) })}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              disabled={!settings.enableLiveFilter}
            />
            <button
              onClick={() => setSettings({ ...settings, enableLiveFilter: !settings.enableLiveFilter })}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                settings.enableLiveFilter ? 'bg-red-600' : 'bg-gray-700'
              }`}
              title={settings.enableLiveFilter ? 'Disable Filter' : 'Enable Filter'}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.enableLiveFilter ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-500">{t('liveStreamNote')}</p>
        </div>

        {/* Toggles Section */}
        <div className="space-y-3 pt-2 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-300">{t('hideTopBanner')}</label>
            <button
              onClick={() => setSettings({ ...settings, enableBannerFilter: !settings.enableBannerFilter })}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                settings.enableBannerFilter ? 'bg-red-600' : 'bg-gray-700'
              }`}
              title={settings.enableBannerFilter ? 'Show Banner' : 'Hide Banner'}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.enableBannerFilter ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-300">{t('hideMixLists')}</label>
            <button
              onClick={() => setSettings({ ...settings, enableMixFilter: !settings.enableMixFilter })}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                settings.enableMixFilter ? 'bg-red-600' : 'bg-gray-700'
              }`}
              title={settings.enableMixFilter ? 'Show Mixes' : 'Hide Mixes'}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.enableMixFilter ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-300">{t('hideShorts')}</label>
            <button
              onClick={() => setSettings({ ...settings, enableShortsFilter: !settings.enableShortsFilter })}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                settings.enableShortsFilter ? 'bg-red-600' : 'bg-gray-700'
              }`}
              title={settings.enableShortsFilter ? 'Show Shorts' : 'Hide Shorts'}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.enableShortsFilter ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Filter Mode */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <label className="text-sm font-medium text-gray-300 block">{t('filterMode')}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSettings({ ...settings, filterMode: 'hide' })}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                settings.filterMode === 'hide'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t('modeHide')}
            </button>
            <button
              onClick={() => setSettings({ ...settings, filterMode: 'opacity' })}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                settings.filterMode === 'opacity'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t('modeOpacity')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
