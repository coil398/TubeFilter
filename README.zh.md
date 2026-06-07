# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** 是一款跨浏览器的 Manifest V3 扩展，根据你自定的播放量与直播在线人数阈值过滤内容，让你的 YouTube 信息流更清爽。它会将低播放量视频和低在线人数的直播淡化或隐藏，并且可以独立地剔除推广顶部横幅、Mix 列表和 Shorts。设置项保存在一个 React 弹窗中，会立即应用到已打开的 YouTube 标签页且无需刷新，弹窗 UI 提供 **9 种语言**（English、日本語、Español、Português、Deutsch、Français、Русский、한국어、简体中文），并带有跟随浏览器语言的 **Auto** 模式。播放量／在线人数会以区域设置感知（locale-aware）的方式，在同样的 **9 种 YouTube 页面语言** 下进行解析。

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **状态：** v1.0.0 —— 尚未发布到 Chrome 网上应用店或 AMO。请通过本地未打包构建安装（见 [安装（终端用户）](#installation-end-users)）。

## 概览

TubeFilter 会隐藏或淡化低于你所设播放量／在线人数阈值的 YouTube 信息流条目，并可按需剔除横幅、Mix 列表和 Shorts。三步即可试用：

1. `npm ci`
2. `npm run build`（Chrome）或 `npm run build:firefox`（Firefox）
3. 从 `.output/chrome-mv3`（或 `.output/firefox-mv3`）加载未打包构建 —— 见 [安装（终端用户）](#installation-end-users)。

你的设置永远不会离开浏览器：TubeFilter 仅申请 `storage` 权限以及对 `youtube.com` 的主机访问权限，所有配置都保存在本地浏览器存储中。

## 功能特性

### 播放量过滤（普通视频）

当以下条件 **全部** 成立时，一个普通视频会被过滤：

- 视频过滤已启用（`enableVideoFilter`）。
- 成功从卡片中解析出了播放量。
- 解析出的播放量 **低于** 你的 `minViews` 阈值。

如果某个视频没有可解析的播放量，则保持原样不动。弹窗中的 **Min Views** 滑块控制该阈值，并在视频过滤关闭时被禁用。

### 直播过滤（直播流）

直播流会根据一个 **独立的** 阈值来评估 —— 即同时在线人数，而非总播放量。当直播过滤已启用（`enableLiveFilter`）、解析出了在线人数，且该人数 **低于** 你的 `minConcurrent` 阈值时，直播流会被过滤。直播状态通过 DOM 的 live-now 徽章，或播放量字符串中表示直播的文本来检测（见 [工作原理](#live-detection)）。

### 内容过滤（无阈值）

这三个过滤器是无条件的开／关开关 —— 它们完全忽略播放量：

| 过滤器 | 设置项 | 移除的内容 |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | 推广横幅广告（masthead）以及声明／推广横幅。当匹配到的横幅位于某个 rich section 内部时，会隐藏整个父级 section。 |
| **Mix Lists** | `enableMixFilter` | 自动生成的 Mix／电台播放列表。 |
| **Shorts** | `enableShortsFilter` | Shorts 链接和货架（shelf）。 |

### 过滤模式：Hide 与 Opacity

**Filter Mode** 选择器决定被过滤的视频／直播流如何处理：

- **Hide** —— 设置 `display: none`，将元素从视图中完全移除。
- **Opacity** —— 设置 `opacity: 0.1`，将元素淡化到 **10%** 不透明度，但仍保持可见。这是默认值。

> ℹ️ 无论选择哪种过滤模式，Top Banner 过滤器始终隐藏横幅（`display: none`）。过滤模式只影响视频和直播流。

### 过滤优先级

每张卡片仅分类一次，采用固定的 if/else 顺序。只有第一个匹配类别的规则会生效：

1. **Shorts**（最高优先级）
2. **Mix 列表**
3. **直播流**
4. **普通视频**

### 关闭自动配音（强制原始音轨）

YouTube 的自动配音会根据你的界面语言，用 AI 翻译的音轨替换视频的音频 —— 因此一个英语视频默认会以日语、德语等语言播放。开启 **Force Original Audio**（`forceOriginalAudio`，**默认开启**）后，TubeFilter 会检测原始音轨，并在每个视频和 Short 上自动将播放器切换到该音轨，撤销自动配音。

- 适用于 `/watch` 视频和 Shorts，并在每次应用内导航时重新应用。
- 原始音轨通过解码播放器的音轨 id **以与语言无关的方式** 识别（原始音轨的数据包含 `original`；配音音轨包含 `dubbed` / `dubbed-auto`）。
- 通过注入页面的 **MAIN-world 脚本** 实现 —— 因为从隔离的内容脚本世界无法访问 YouTube 播放器的音频 API —— 并将该设置从扩展存储桥接过去。
- 可随时在弹窗中关闭它，以保留 YouTube 的配音音频。

### 多语言播放量识别

YouTube 在 **每种页面语言下对播放量／在线人数的呈现差异很大** —— 不只是翻译词语，还包括不同的小数／千分位分隔符和缩写单位。同一个约 17 亿的数字会显示为：

| 语言 | YouTube 字符串 |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

内容脚本会自动检测 **YouTube 页面语言**（`document.documentElement.lang`），并用该区域设置对应的小数分隔符、千分位分隔符和缩写单位来解析数字。这一点很重要，因为此前的解析器假定为英语格式，从而 **误读了使用逗号小数的区域设置**（`de` / `fr` / `ru` / `pt`）—— 例如把 `1,7 Mrd.` 读成 `1` 或 `17`，而不是 `1,700,000,000`。区域设置正确的解析支持 **9 种语言**（见 [国际化](#internationalization)）；未知的页面语言会回退到一个宽松的通用解析器。

### 语言（弹窗 UI）

弹窗 UI 提供 **9 种语言** —— English、日本語、Español、Português、Deutsch、Français、Русский、한국어、简体中文 —— 外加一个跟随浏览器 UI 语言（`navigator.language`，映射到最接近的受支持区域设置，回退到英语）的 **Auto（`auto`，默认）** 模式。弹窗头部的下拉菜单可在它们之间切换。

## 截图

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## 支持的浏览器

| 浏览器 | Manifest | 备注 |
|---|---|---|
| **Chrome / Chromium** | MV3 | 默认构建目标；Chrome 默认使用 MV3。 |
| **Firefox** | MV3 | 输出目录为 `.output/firefox-mv3`；通过 `wxt.config.ts` 中的 `manifestVersion: 3` 强制使用 MV3（否则 Firefox 会默认使用 MV2）。 |

> ℹ️ 内容脚本在两种浏览器中都运行于 `https://www.youtube.com/*`。Firefox 构建携带一个值为 `tube-filter@coil398.github.io` 的 `browser_specific_settings.gecko.id`（AMO MV3 必需，在 Chrome 上无害）。

## 安装（终端用户）

完整且受支持的发布与安装步骤，请参阅 **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**。

要加载本地未打包构建进行测试：

### Chrome / Chromium

1. 运行 `npm run build` 生成 `.output/chrome-mv3`。
2. 打开 `chrome://extensions`。
3. 启用 **开发者模式**（右上角）。
4. 点击 **加载已解压的扩展程序**，选择 `.output/chrome-mv3` 目录。

### Firefox

1. 运行 `npm run build:firefox` 生成 `.output/firefox-mv3`。
2. 打开 `about:debugging`。
3. 进入 **此 Firefox** → **临时载入附加组件…**。
4. 选择 `.output/firefox-mv3` 目录中的任意文件（例如其 `manifest.json`）。

## 用法

打开扩展弹窗即可调整过滤设置。更改会立即保存，并实时应用到任何已打开的 YouTube 标签页 —— 无需刷新。

### 设置项参考

| 设置项 | 控制内容 | 范围 / 步长 | 默认值 | JA label | EN label |
|---|---|---|---|---|---|
| `minViews` | 普通视频被过滤的最低播放量阈值 | 范围 `0`–`100000`，步长 `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | 直播流被过滤的最低同时在线人数阈值 | 范围 `0`–`5000`，步长 `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | 被过滤的视频／直播流如何处理（`hide` / `opacity`） | 双按钮选择器 | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | 启用／禁用播放量过滤（同时启用／禁用 Min Views 滑块） | 开/关开关 | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | 启用／禁用直播过滤（同时启用／禁用 Min Concurrent 滑块） | 开/关开关 | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | 隐藏推广顶部横幅 | 开/关开关 | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | 隐藏 Mix 列表 | 开/关开关 | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | 隐藏 Shorts | 开/关开关 | `true` | ショート動画非表示 | Hide Shorts |
| `forceOriginalAudio` | 在观看页面和 Shorts 上强制使用原始音轨（撤销自动配音） | 开/关开关 | `true` | 元の音声に固定 | Force Original Audio |
| `language` | 弹窗 UI 语言：`auto` + 9 种区域设置（`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`）；**Auto** 跟随浏览器 UI 语言（`navigator.language`） | 下拉选择器 | `auto` | Language | 言語 |

两个滑块都会通过 `toLocaleString()` 以千分位分隔的方式显示其数值。Min Concurrent 滑块下方有一条辅助提示：

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### 过滤模式选择器

一个双按钮控件。**Hide** 设置 `filterMode = 'hide'`；**Opacity** 设置 `filterMode = 'opacity'`。当前激活的模式会高亮显示。标签已本地化 —— JA: 非表示 / 薄く表示，EN: Hide / Opacity。

### 语言选择器

弹窗头部的下拉菜单将 `language` 设为 `auto` 或 9 种区域设置之一（`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`）。**Auto**（默认）从 `navigator.language` 解析出有效 UI 语言，映射到最接近的受支持区域设置，并回退到英语。选择某个具体语言会将 UI 固定为该语言，无论浏览器设置如何。

## 工作原理

### 内容脚本

- **匹配与时机** —— 匹配 `https://www.youtube.com/*`，并在 `run_at: document_end` 时运行。
- **页面语言检测** —— 每一遍处理都会读取 `document.documentElement.lang`（回退到 `navigator.language`，再回退到 `'en'`），并据此选择区域设置正确的播放量解析器（见 [国际化](#internationalization)）。
- **目标元素** —— 扫描 7 个视频选择器，覆盖首页（`ytd-rich-item-renderer`）、搜索（`ytd-video-renderer`）、侧边栏（`ytd-compact-video-renderer`）、频道（`ytd-grid-video-renderer`）、Mix 列表（`ytd-radio-renderer`）、单个 Shorts（`ytd-reel-item-renderer`）和 Shorts 货架（`ytd-rich-shelf-renderer`）；外加 9 个横幅选择器（`#masthead-ad`、`#big-yoodle`、`ytd-statement-banner-renderer`、`ytd-banner-promo-renderer`、`ytd-ad-slot-renderer`、`ytd-in-feed-ad-layout-renderer`，以及若干 `ytd-rich-section-renderer > #content > …` 变体）。
- **动态信息流处理** —— 一个 `MutationObserver` 以 `{ childList: true, subtree: true }` 监视 `document.body`。当有节点被添加时，它用一个 **500 ms** 的 `setTimeout` 做防抖（每一批都会清除并重新设置计时器），因此过滤会在最后一批添加节点之后 500 ms 运行。过滤还会在初次加载时运行一次，并在设置加载完成后立即再运行一次。

  > ℹ️ 这是一个尾随防抖（trailing debounce），而非固定的节流（throttle）：在持续不断的变更下，处理会一直被推迟。（源码自带的内联注释 `// Run at most every 500ms` 描述的是节流，措辞略有不准确。）
- **Mix / Shorts 检测** —— Mix 列表通过 `start_radio=1`、`list=RD`、`MIX` 覆盖徽章或 `ytd-radio-renderer` 匹配；Shorts 通过 `/shorts/` 链接、`SHORTS` 覆盖徽章、`ytd-reel-item-renderer` 和 `ytd-rich-shelf-renderer` 货架匹配。
- **横幅父级 section 隐藏** —— 当匹配到的横幅有一个 `closest('ytd-rich-section-renderer')` 祖先时，会隐藏整个父级 section，而不只是内部横幅。

<a id="live-detection"></a>

直播状态通过 DOM 徽章（`.badge-style-type-live-now`、`.badge-style-type-live-now-alternate`、`[overlay-style="LIVE"]`）检测，或通过播放量文本本身检测（不区分大小写地包含 `視聴中`、`watching`、`live` 或 `ライブ`，外加当前页面区域设置自身的直播关键词 —— 见 [国际化](#internationalization)）。

<a id="internationalization"></a>

### 国际化

YouTube 在每种 UI 语言下对播放量／在线人数的格式化方式都不同，因此数字解析由 **检测到的 YouTube 页面语言** 驱动，而非弹窗 UI 语言。每一遍处理时，内容脚本都会读取 `document.documentElement.lang`（回退到 `navigator.language`，再回退到 `'en'`），将其规范化为基础语言代码（例如 `zh-Hans-CN` → `zh`，`es-419` → `es`），并选择一份描述该语言的小数分隔符、千分位分隔符、缩写单位（例如 `K`/`M`/`B`、`万`/`億`、`Mio.`/`Mrd.`、`тыс.`/`млн`/`млрд`、`万`/`亿`）、“views”连接词、日期／往期直播标记、直播词语以及“no views” → `0` 词语的按区域设置的规格（spec）。

区域设置正确的解析支持 **9 种语言**：

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

如果页面语言不属于以上任何一种，解析会回退到一份 **宽松的通用规格**，它使用 `.` 作为小数分隔符，并以尽力而为的方式识别常见单位的并集（`K`/`M`/`B` 以及 CJK／韩语单位）。这种区域设置感知能力修复了此前解析器对逗号小数区域设置（`de` / `fr` / `ru` / `pt`）的误读，那时 `1,7 Mrd.` 会被读成 `1` 或 `17`，而不是 `1,700,000,000`。

### 弹窗（React）

一个 React 19 弹窗（`src/entrypoints/popup/`）渲染各个滑块、开关、过滤模式选择器和三态语言选择器。编辑任何控件都会立即写入存储。弹窗从 `settings.language` 解析其有效显示语言：`auto` 跟随 `navigator.language`，而 `ja` / `en` 将其固定。

### 设置存储与实时同步

- 设置以 **扁平的顶层键** 持久化到 `browser.storage.local` —— 每个字段一个键（`minViews`、`minConcurrent`、`filterMode`、…）。这与迁移到 WXT 之前的 `chrome.storage.local` 结构一致，因此现有用户在迁移后仍保留其设置。
- `loadSettings()` 调用 `browser.storage.local.get(defaultSettings)`，将存储的值合并到默认值之上；`saveSettings()` 调用 `browser.storage.local.set(settings)`。
- `watchSettings()` 注册一个 `browser.storage.onChanged` 监听器。`local` 区域发生任何变化时，它都会重新读取完整的设置记录并重新运行过滤 —— 这正是弹窗编辑能立即应用到已打开标签页的原因。

`Settings` 类型恰好有 9 个字段：`minViews`、`minConcurrent`、`filterMode`、`enableVideoFilter`、`enableLiveFilter`、`enableBannerFilter`、`enableMixFilter`、`enableShortsFilter`、`language`（`'auto' | 'ja' | 'en'`，默认 `'auto'`）。

### 播放量解析

`parseViewCount(text, lang)` 为给定的页面语言解析出对应的区域设置规格（当语言未知／省略时则使用通用规格），并将 YouTube 各式各样的数字字符串规范化为一个数字（或 `null`）。在所有受支持的区域设置下，它会：

| 输入模式 | 处理方式 | 示例 |
|---|---|---|
| 缩写单位（按区域设置） | 乘以该区域设置的单位系数 | `1.2万` → `12000`，`12K` → `12000`，`1,7 Mrd.`（de）→ `1700000000` |
| 区域设置的小数／千分位分隔符 | 逗号小数区域设置（`de`/`fr`/`ru`/`pt`）和空格千分位区域设置（`fr`/`ru`）能被正确解析 | `129.069 Aufrufe`（de）→ `129069` |
| “No views”词语（例如 `No views`、`なし`、各区域设置的对应词） | 返回 `0` | `No views` → `0` |
| 纯数字 | 按区域设置去除分隔符，然后解析 | `1,234`（en）→ `1234` |
| 日期／往期直播文本 | 视为“不是数字”，因此卡片保持原样不动 | `2 days ago`、`〜前` |
| 无法解析 | 返回 `null`（元素不受播放量规则过滤） | — |

在解析之前，会先去除该区域设置的“views”／连接词关键词（例如 `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`）。空白字符 —— 包括真实 YouTube 字符串中出现的 NBSP 和窄 NBSP —— 会先被规范化。`isLive(text, lang)` 辅助函数在文本（不区分大小写）包含通用直播标记（`視聴中`、`watching`、`live`、`ライブ`）或当前区域设置的某个直播词语时返回 `true`。

## 已知限制

> ⚠️ `src/utils/filter.ts` 中的调试日志目前被硬编码为开启（`const debug = true`），因此内容脚本会输出大量控制台日志。`FILTERED` 汇总日志会无条件输出 —— 它位于 `debug` 守卫之外 —— 所以即便该标志被关闭也仍会出现。

## 开发

### 前置条件

- **Node.js 20**（CI 所使用的版本）。
- npm（仓库随附了 `package-lock.json`）。

### 安装

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### npm 脚本

| 脚本 | 命令 | 作用 |
|---|---|---|
| `dev` | `wxt` | 启动面向 Chrome（默认目标）的 WXT 开发服务器，带 HMR。 |
| `dev:firefox` | `wxt -b firefox` | 启动面向 Firefox 的 WXT 开发服务器。 |
| `build` | `wxt build` | 面向 Chrome 的生产构建 → `.output/chrome-mv3`。 |
| `build:firefox` | `wxt build -b firefox` | 面向 Firefox 的生产构建 → `.output/firefox-mv3`。 |
| `zip` | `wxt zip` | 构建并将 Chrome 扩展打包为可分发的 zip，放入 `.output/`。 |
| `zip:firefox` | `wxt zip -b firefox` | 构建并将 Firefox 扩展 zip 打包，放入 `.output/`。 |
| `compile` | `wxt prepare && tsc --noEmit` | 生成 WXT 类型，然后进行不产出文件的类型检查。 |
| `lint` | `eslint .` | 对整个项目进行 lint（ESLint 9 flat config，位于 `eslint.config.js`）。 |
| `test` | `tsx test-parser.ts` | 运行区域设置播放量解析器测试（`test-parser.ts`），覆盖全部 9 种受支持语言的播放量／在线人数解析和直播检测。 |

> ℹ️ `postinstall` 会在 `npm install` / `npm ci` 之后自动运行 `wxt prepare`。

在更改 `src/utils/locales.ts` 或 `src/utils/parser.ts` 中的任何内容后，请运行 `npm test` —— 它会断言真实的 YouTube 数字字符串（包括 NBSP 分隔和逗号小数形式）能针对 English、日本語、Español、Português、Deutsch、Français、Русский、한국어 和 简体中文 解析为预期的数字。

### 项目结构

```text
TubeFilter/
├── src/
│   ├── entrypoints/
│   │   ├── content/
│   │   │   └── index.ts        # Content script: matches youtube.com, runs at document_end
│   │   └── popup/
│   │       ├── App.tsx          # React 19 popup UI
│   │       ├── main.tsx
│   │       ├── index.html
│   │       └── index.css
│   └── utils/
│       ├── filter.ts            # processVideoElement, processBannerElement
│       ├── parser.ts            # parseViewCount, isLive (locale-aware wrappers)
│       ├── locales.ts           # per-language LocaleSpec table + generic fallback, detectLang/parseCount
│       ├── storage.ts           # defaultSettings, loadSettings, watchSettings
│       └── types.ts             # Settings type
├── public/
│   └── icon/                    # 16.png, 48.png, 128.png
├── test-parser.ts               # `npm test` — locale parser tests for all 9 languages
├── wxt.config.ts                # srcDir: 'src', React module, manifestVersion: 3, manifest fields
├── tsconfig.json                # extends .wxt/tsconfig.json
├── eslint.config.js
├── postcss.config.js
├── tailwind.config.js
├── package.json
├── README.md
└── RELEASE_GUIDE.md
```

WXT 配置为 `srcDir: 'src'` 和 `modules: ['@wxt-dev/module-react']`。共享逻辑通过 `@/utils/...` 别名导入。manifest 声明了 `permissions: ['storage']` 和 `host_permissions: ['https://www.youtube.com/*']`，`name: 'TubeFilter'`，描述为 “Filter YouTube videos based on views and other metrics.” `wxt.config.ts` 中的 `manifestVersion: 3` 是强制两个目标均输出 MV3 的唯一可信源（single source of truth）。

`tsconfig.json` 继承 WXT 生成的 `./.wxt/tsconfig.json`，并添加了 `jsx: 'react-jsx'`、`allowImportingTsExtensions`、`noUnusedLocals`、`noUnusedParameters` 和 `noFallthroughCasesInSwitch`。

## 构建与发布

### 构建产物

| 目标 | 输出目录 |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Zip 产物

`wxt zip` 使用 WXT 默认的 zip 文件名模板（`{{name}}-{{version}}-{{browser}}.zip`，其中 `{{name}}` 是 `package.json` 的名称 `tube-filter`）将构建打包到 `.output/`。`wxt.config.ts` 中未设置自定义的 `zipFileName`/`sources` 模板，因此下面的名称遵循 WXT 默认：

- `tube-filter-<version>-chrome.zip`（例如 `tube-filter-1.0.0-chrome.zip`）—— 与发布工作流的上传 glob 相印证。
- `tube-filter-<version>-firefox.zip`（例如 `tube-filter-1.0.0-firefox.zip`）—— 与发布工作流的上传 glob 相印证。
- 一个用于 AMO 审核的源码 zip（WXT 针对 Firefox 目标的默认产物，通常为 `tube-filter-<version>-sources.zip`）。这个名称是 WXT 默认，仓库中没有任何代码引用它；运行 `npm run zip:firefox` 以确认你环境中的确切文件名。

### GitHub Actions 发布工作流

`.github/workflows/release.yml`（名为 **Release**）在 GitHub `release` 事件且 `types: [published]` 时触发，并具有 `permissions: contents: write`。该任务在 `ubuntu-latest` 上运行，并会：

1. 检出代码（`actions/checkout@v4`）。
2. 设置 **Node.js 20** 并启用 npm 缓存（`actions/setup-node@v4`）。
3. 运行 `npm ci`（其 `postinstall` 会运行 `wxt prepare`）。
4. 运行 `npm run zip`（Chrome）和 `npm run zip:firefox`（Firefox），生成两个浏览器的 zip。
5. 通过 `softprops/action-gh-release@v2`（由 `startsWith(github.ref, 'refs/tags/')` 守卫）将它们作为发布资产上传，匹配 `.output/tube-filter-*-chrome.zip` 和 `.output/tube-filter-*-firefox.zip`。

## 技术栈

| 技术 | 版本 |
|---|---|
| [WXT](https://wxt.dev/) | `^0.20.26` |
| [React](https://react.dev/) + React DOM | `^19.2.0` |
| [TypeScript](https://www.typescriptlang.org/) | `~5.9.3` |
| [Tailwind CSS](https://tailwindcss.com/) | `^3.4.18` |
| `@wxt-dev/module-react` | `^1.2.2` |
| ESLint | `^9.39.1` |
| `typescript-eslint` | `^8.46.4` |
| autoprefixer | `^10.4.22` |
| postcss | `^8.5.6` |

该包为 `tube-filter` v`1.0.0`（`private`，ESM `"type": "module"`）；扩展显示名称在 `wxt.config.ts` 中被覆盖为 **TubeFilter**。

## 贡献

欢迎贡献。在提交 PR 之前：

1. `npm ci` 安装依赖（这也会生成 WXT 类型）。
2. `npm run lint` 用 ESLint 检查代码。
3. `npm run compile` 进行类型检查（`wxt prepare && tsc --noEmit`）。
4. `npm test` 运行区域设置解析器测试（尤其是在改动 `src/utils/locales.ts` 或 `src/utils/parser.ts` 之后）。
5. 用 `npm run dev` 和 `npm run dev:firefox` 在两个目标中测试你的更改。

## 许可证

本项目未指定任何许可证，仓库中也不存在 `LICENSE` 文件。在没有明确许可证的情况下，代码默认为 **保留所有权利（all rights reserved）** —— 你没有权限复用、再分发或修改它。如果你打算将其开放，请添加一个声明条款的 `LICENSE` 文件。
