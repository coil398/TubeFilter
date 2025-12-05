import { useEffect, useState } from 'react'

interface Settings {
  minViews: number
  minConcurrent: number
  filterMode: 'hide' | 'opacity'
  enableVideoFilter: boolean
  enableLiveFilter: boolean
}

const defaultSettings: Settings = {
  minViews: 1000,
  minConcurrent: 50,
  filterMode: 'opacity',
  enableVideoFilter: true,
  enableLiveFilter: true,
}

function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(defaultSettings as unknown as { [key: string]: unknown }, (items) => {
      setSettings(items as unknown as Settings)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (loaded) {
      chrome.storage.local.set(settings)
    }
  }, [settings, loaded])

  if (!loaded) return <div className="p-4 text-white">Loading...</div>

  return (
    <div className="p-4 space-y-6 bg-gray-900 text-gray-100 font-sans min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-700 pb-4">
        <h1 className="text-xl font-bold text-red-500">TubeFilter</h1>
        <span className="text-xs text-gray-400">v1.0</span>
      </header>

      <div className="space-y-6">
        {/* Min Views Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="font-medium text-gray-300">Minimum Views</label>
            <span className="text-red-400 font-mono">{settings.minViews.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-4">
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
          <p className="text-xs text-gray-500">Videos with fewer views will be filtered.</p>
        </div>

        {/* Min Concurrent Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="font-medium text-gray-300">Min Concurrent (Live)</label>
            <span className="text-red-400 font-mono">{settings.minConcurrent.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="5000"
              step="10"
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
          <p className="text-xs text-gray-500">Live streams with fewer viewers will be filtered.</p>
        </div>

        {/* Filter Mode Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800 mt-4">
          <label className="font-medium text-gray-300">Filter Mode</label>
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setSettings({ ...settings, filterMode: 'opacity' })}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                settings.filterMode === 'opacity'
                  ? 'bg-gray-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Fade
            </button>
            <button
              onClick={() => setSettings({ ...settings, filterMode: 'hide' })}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                settings.filterMode === 'hide'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Hide
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
