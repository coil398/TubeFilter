# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** 是一款跨浏览器的 Manifest V3 扩展，它会根据你设定的观看次数和直播观众数阈值过滤内容，从而清理你的 YouTube 信息流。它会将低观看次数的视频和低观众数的直播变暗或隐藏，并且可以独立地剔除推广性的顶部横幅、Mix 列表和 Shorts。设置保存在 React 弹窗中，无需重新加载即可立即应用到已打开的 YouTube 标签页，弹窗界面提供日语和英语两种语言（外加一个跟随浏览器语言的 **Auto** 模式）。观看/观众数的解析会在 **9 种 YouTube 页面语言**下以区域设置感知的方式进行。

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **状态：** v1.0.0 — 尚未发布到 Chrome Web Store 或 AMO。请通过本地未打包构建安装（参见 [安装](#installation-end-users)）。

## 概览

TubeFilter 会隐藏或变暗低于你设定的观看/观众阈值的 YouTube 信息流项目，并可按需剔除横幅、Mix 列表和 Shorts。三步即可试用：

1. `npm ci`
2. `npm run build`（Chrome）或 `npm run build:firefox`（Firefox）
3. 从 `.output/chrome-mv3`（或 `.output/firefox-mv3`）加载未打包构建 — 参见 [安装](#installation-end-users)。

你的设置永远不会离开浏览器：TubeFilter 仅请求 `storage` 权限和对 `youtube.com` 的主机访问权限，所有配置都保存在本地浏览器存储中。

## 功能特性

### 观看次数过滤（普通视频）

当以下条件**全部**满足时，普通视频会被过滤：

- 视频过滤已启用（`enableVideoFilter`）。
- 已成功从卡片中解析出观看次数。
- 解析出的观看次数**低于**你的 `minViews` 阈值。

如果某个视频没有可解析的观看次数，则保持原样不动。弹窗中的 **Min Views** 滑块控制该阈值，当视频过滤被关闭时该滑块会被禁用。

### 直播过滤（直播流）

直播流会针对一个**单独的**阈值进行评估 — 即同时在线观众数，而非总观看次数。当直播过滤已启用（`enableLiveFilter`）、已解析出观众数、且该数值**低于**你的 `minConcurrent` 阈值时，直播流会被过滤。直播状态会从 DOM 中的直播徽标，或从观看次数字符串中表示直播的文本中检测（参见 [How it works](#live-detection)）。

### 内容过滤（无阈值）

这三个过滤器是无条件的开/关开关 — 它们完全忽略观看次数：

| 过滤器 | 设置 | 移除内容 |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | 推广性的标头广告以及声明/推广横幅。当匹配到的横幅位于某个 rich section 内部时，会隐藏整个父级 section。 |
| **Mix Lists** | `enableMixFilter` | 自动生成的 Mix / 电台播放列表。 |
| **Shorts** | `enableShortsFilter` | Shorts 链接和栏架。 |

### 过滤模式：Hide 与 Opacity

**Filter Mode** 选择器决定如何处理被过滤的视频/直播流：

- **Hide** — 设置 `display: none`，将元素从视图中完全移除。
- **Opacity** — 设置 `opacity: 0.1`，将元素变暗至 **10%** 不透明度，同时保持其可见。这是默认值。

> ℹ️ 无论选择哪种过滤模式，Top Banner 过滤器始终隐藏横幅（`display: none`）。过滤模式仅影响视频和直播流。

### 过滤优先级

每张卡片只分类一次，使用固定的 if/else 顺序。只应用第一个匹配类别的规则：

1. **Shorts**（最高优先级）
2. **Mix 列表**
3. **直播流**
4. **普通视频**

### 多语言观看次数检测

YouTube **在每种页面语言下渲染观看数和观众数的方式都大不相同** — 不仅是翻译后的词语不同，连小数/千位分隔符和缩写单位也不同。同一个约 17 亿的数值会显示为：

| 语言 | YouTube 字符串 |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

内容脚本会自动检测 **YouTube 页面语言**（`document.documentElement.lang`），并使用该区域设置对应的正确小数分隔符、千位分隔符和缩写单位来解析数值。这一点很重要，因为之前的解析器假设的是英语风格的格式，从而**误读了使用逗号小数的区域设置**（`de` / `fr` / `ru` / `pt`）— 例如把 `1,7 Mrd.` 读成 `1` 或 `17`，而非 `1,700,000,000`。**9 种语言**支持区域设置正确的解析（参见 [Internationalization](#internationalization)）；未知的页面语言会回退到一个宽松的通用解析器。

### 语言（弹窗界面）

弹窗界面提供 **日语（`ja`）** 和 **英语（`en`）**，外加第三种 **Auto（`auto`，默认）** 模式，该模式跟随浏览器界面语言（`navigator.language`）：如果浏览器语言以 `ja` 开头，界面以日语渲染，否则以英语渲染。弹窗头部的三按钮控件（`Auto` / `日本語` / `EN`）用于在它们之间切换，当前选中项会高亮显示。

## 截图

> 📷 _TODO：添加一张弹窗截图，以及一张过滤前后信息流的对比图（Hide 与 Opacity）。目前尚未提交任何截图。_

## 支持的浏览器

| 浏览器 | Manifest | 备注 |
|---|---|---|
| **Chrome / Chromium** | MV3 | 默认构建目标；Chrome 默认即为 MV3。 |
| **Firefox** | MV3 | 输出目录为 `.output/firefox-mv3`；通过 `wxt.config.ts` 中的 `manifestVersion: 3` 强制使用 MV3（否则 Firefox 会默认使用 MV2）。 |

> ℹ️ 内容脚本在两种浏览器中都运行于 `https://www.youtube.com/*`。Firefox 构建携带一个值为 `tube-filter@coil398.github.io` 的 `browser_specific_settings.gecko.id`（AMO MV3 所必需，在 Chrome 上无害）。

## 安装（最终用户）

完整且受支持的发布与安装演练，请参见 **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**。

加载本地未打包构建以进行测试：

### Chrome / Chromium

1. 运行 `npm run build` 以生成 `.output/chrome-mv3`。
2. 打开 `chrome://extensions`。
3. 启用 **开发者模式**（右上角）。
4. 点击 **加载已解压的扩展程序**，并选择 `.output/chrome-mv3` 目录。

### Firefox

1. 运行 `npm run build:firefox` 以生成 `.output/firefox-mv3`。
2. 打开 `about:debugging`。
3. 进入 **This Firefox** → **Load Temporary Add-on…**。
4. 选择 `.output/firefox-mv3` 目录内的任意文件（例如其 `manifest.json`）。

## 用法

打开扩展弹窗以调整过滤。更改会立即保存并实时应用到任何已打开的 YouTube 标签页 — 无需重新加载。

### 设置参考

| 设置 | 控制内容 | 范围 / 步长 | 默认值 | JA 标签 | EN 标签 |
|---|---|---|---|---|---|
| `minViews` | 普通视频低于此观看次数时会被过滤的最小值 | 范围 `0`–`100000`，步长 `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | 直播流低于此同时在线观众数时会被过滤的最小值 | 范围 `0`–`5000`，步长 `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | 如何处理被过滤的视频/直播流（`hide` / `opacity`） | 双按钮选择器 | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | 启用/禁用观看次数过滤（同时启用/禁用 Min Views 滑块） | 开/关切换 | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | 启用/禁用直播过滤（同时启用/禁用 Min Concurrent 滑块） | 开/关切换 | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | 隐藏推广性的顶部横幅 | 开/关切换 | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | 隐藏 Mix 列表 | 开/关切换 | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | 隐藏 Shorts | 开/关切换 | `true` | ショート動画非表示 | Hide Shorts |
| `language` | 弹窗界面语言（`auto` / `ja` / `en`）；**Auto** 跟随浏览器界面语言（`navigator.language`） | 三按钮选择器（`Auto` / `日本語` / `EN`） | `auto` | Language | 言語 |

两个滑块都会通过 `toLocaleString()` 以千位分隔的形式显示其数值。Min Concurrent 滑块下方有一条辅助说明：

- JA：視聴者数が少ないライブ配信はフィルタリングされます。
- EN：Live streams with fewer viewers will be filtered.

### 过滤模式选择器

一个双按钮控件。**Hide** 设置 `filterMode = 'hide'`；**Opacity** 设置 `filterMode = 'opacity'`。当前激活的模式会高亮显示。标签已本地化 — JA：非表示 / 薄く表示，EN：Hide / Opacity。

### 语言选择器

弹窗头部的三按钮控件将 `language` 设置为 `auto`、`ja` 或 `en` 之一。这些按钮显示为 **Auto** / **日本語** / **EN**，当前选中项会高亮显示。**Auto**（默认值）会从 `navigator.language` 解析出实际生效的界面语言：以 `ja` 开头的浏览器语言会将界面渲染为日语，其他任何情况都渲染为英语。选择 **日本語** 或 **EN** 会将界面固定为该语言，无论浏览器设置如何。

## 工作原理

### 内容脚本

- **匹配与时机** — 匹配 `https://www.youtube.com/*`，并在 `run_at: document_end` 时运行。
- **页面语言检测** — 在每次执行时它都会读取 `document.documentElement.lang`（回退到 `navigator.language`，再回退到 `'en'`），并据此选择一个区域设置正确的观看次数解析器（参见 [Internationalization](#internationalization)）。
- **目标** — 扫描 7 个视频选择器，覆盖首页（`ytd-rich-item-renderer`）、搜索（`ytd-video-renderer`）、侧边栏（`ytd-compact-video-renderer`）、频道（`ytd-grid-video-renderer`）、Mix 列表（`ytd-radio-renderer`）、单个 Shorts（`ytd-reel-item-renderer`）和 Shorts 栏架（`ytd-rich-shelf-renderer`）；外加 9 个横幅选择器（`#masthead-ad`、`#big-yoodle`、`ytd-statement-banner-renderer`、`ytd-banner-promo-renderer`、`ytd-ad-slot-renderer`、`ytd-in-feed-ad-layout-renderer`，以及若干 `ytd-rich-section-renderer > #content > …` 变体）。
- **动态信息流处理** — 一个 `MutationObserver` 以 `{ childList: true, subtree: true }` 监视 `document.body`。当有节点被添加时，它会用一个 **500 ms** 的 `setTimeout` 进行防抖（每批都会清除并重新设置定时器），因此过滤器会在最后一批添加节点之后 500 ms 运行。过滤器还会在初次加载时运行一次，并在设置加载完成后立即再运行一次。

  > ℹ️ 这是一个尾部防抖（trailing debounce），而非固定的节流（throttle）：在持续变更的情况下，该执行会被不断推迟。（源码自带的内联注释 `// Run at most every 500ms` 描述的是节流，措辞略有不准确。）
- **Mix / Shorts 检测** — Mix 列表通过 `start_radio=1`、`list=RD`、`MIX` 覆盖徽标或 `ytd-radio-renderer` 匹配；Shorts 通过 `/shorts/` 链接、`SHORTS` 覆盖徽标、`ytd-reel-item-renderer` 以及 `ytd-rich-shelf-renderer` 栏架匹配。
- **横幅父级 section 隐藏** — 当匹配到的横幅有一个 `closest('ytd-rich-section-renderer')` 祖先元素时，会隐藏整个父级 section，而不仅仅是内部横幅。

<a id="live-detection"></a>

直播状态会从 DOM 徽标（`.badge-style-type-live-now`、`.badge-style-type-live-now-alternate`、`[overlay-style="LIVE"]`）或从观看次数文本本身（不区分大小写地包含 `視聴中`、`watching`、`live` 或 `ライブ`，外加当前页面区域设置自身的直播关键词 — 参见 [Internationalization](#internationalization)）中检测。

<a id="internationalization"></a>

### 国际化

YouTube 在每种界面语言下对观看/观众数的格式化方式都不同，因此数值解析由**检测到的 YouTube 页面语言**驱动，而非弹窗界面语言。在每次执行时，内容脚本会读取 `document.documentElement.lang`（回退到 `navigator.language`，再回退到 `'en'`），将其规范化为基础语言代码（例如 `zh-Hans-CN` → `zh`，`es-419` → `es`），并选择一份针对该区域设置的规格，描述该语言的小数分隔符、千位分隔符、缩写单位（例如 `K`/`M`/`B`、`万`/`億`、`Mio.`/`Mrd.`、`тыс.`/`млн`/`млрд`、`万`/`亿`）、“views” 连接词、日期/往期直播标记、直播相关词语，以及 “no views” → `0` 的词语。

**9 种语言**支持区域设置正确的解析：

- **English**（`en`）
- **日本語**（`ja`）
- **Español**（`es`）
- **Português**（`pt`）
- **Deutsch**（`de`）
- **Français**（`fr`）
- **Русский**（`ru`）
- **한국어**（`ko`）
- **简体中文**（`zh`）

如果页面语言不属于上述任何一种，解析会回退到一份**宽松的通用规格**，该规格使用 `.` 作为小数点，并尽力识别常见单位的并集（`K`/`M`/`B` 以及中日韩/韩语单位）。这种区域设置感知能力修复了之前解析器对逗号小数区域设置（`de` / `fr` / `ru` / `pt`）的误读，即 `1,7 Mrd.` 被读成 `1` 或 `17`，而非 `1,700,000,000`。

### 弹窗（React）

一个 React 19 弹窗（`src/entrypoints/popup/`）渲染滑块、开关、过滤模式选择器和三向语言选择器。编辑任何控件都会立即写入存储。弹窗会从 `settings.language` 解析出实际生效的显示语言：`auto` 跟随 `navigator.language`，而 `ja` / `en` 则将其固定。

### 设置存储与实时同步

- 设置以**扁平的顶级键**形式持久化到 `browser.storage.local` — 每个字段一个键（`minViews`、`minConcurrent`、`filterMode`、…）。这与 WXT 之前的 `chrome.storage.local` 结构一致，因此现有用户在迁移后仍能保留其设置。
- `loadSettings()` 调用 `browser.storage.local.get(defaultSettings)`，将存储的值合并覆盖到默认值之上；`saveSettings()` 调用 `browser.storage.local.set(settings)`。
- `watchSettings()` 注册一个 `browser.storage.onChanged` 监听器。当 `local` 区域发生任何更改时，它会重新读取完整的设置记录并重新运行过滤器 — 这正是弹窗编辑能即时应用到已打开标签页的原因。

`Settings` 类型恰好有 9 个字段：`minViews`、`minConcurrent`、`filterMode`、`enableVideoFilter`、`enableLiveFilter`、`enableBannerFilter`、`enableMixFilter`、`enableShortsFilter`、`language`（`'auto' | 'ja' | 'en'`，默认 `'auto'`）。

### 观看次数解析

`parseViewCount(text, lang)` 为给定的页面语言解析出区域设置规格（当语言未知/省略时使用通用规格），并将 YouTube 各式各样的数值字符串规范化为一个数字（或 `null`）。在所有受支持的区域设置下，它会：

| 输入模式 | 处理方式 | 示例 |
|---|---|---|
| 缩写单位（按区域设置） | 乘以该区域设置的单位系数 | `1.2万` → `12000`、`12K` → `12000`、`1,7 Mrd.`（de）→ `1700000000` |
| 区域设置的小数 / 千位分隔符 | 逗号小数区域设置（`de`/`fr`/`ru`/`pt`）和空格千位区域设置（`fr`/`ru`）会被正确解析 | `129.069 Aufrufe`（de）→ `129069` |
| “No views” 词语（例如 `No views`、`なし`、各区域设置的等价词） | 返回 `0` | `No views` → `0` |
| 纯数字 | 按区域设置剥离分隔符，然后解析 | `1,234`（en）→ `1234` |
| 日期 / 往期直播文本 | 视为“非数值”，因此卡片保持原样不动 | `2 days ago`、`〜前` |
| 无法解析 | 返回 `null`（元素不受观看次数规则过滤） | — |

在解析之前，会先剥离区域设置的 “views”/连接词关键词（例如 `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`）。空白字符 — 包括真实 YouTube 字符串中出现的 NBSP 和窄 NBSP — 会被首先规范化。当文本包含一个通用的直播标记（`視聴中`、`watching`、`live`、`ライブ`）或当前区域设置的某个直播相关词语时，`isLive(text, lang)` 辅助函数会返回 `true`（不区分大小写）。

## 已知限制

> ⚠️ `src/utils/filter.ts` 中的调试日志当前被硬编码为开启（`const debug = true`），因此内容脚本会输出冗长的控制台日志。`FILTERED` 汇总日志会无条件输出 — 它位于 `debug` 守卫之外 — 因此即使该标志被关闭它仍会出现。

## 开发

### 前置条件

- **Node.js 20**（CI 使用的版本）。
- npm（仓库附带 `package-lock.json`）。

### 安装

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### npm 脚本

| 脚本 | 命令 | 作用 |
|---|---|---|
| `dev` | `wxt` | 启动针对 Chrome（默认目标）的 WXT 开发服务器，带 HMR。 |
| `dev:firefox` | `wxt -b firefox` | 启动针对 Firefox 的 WXT 开发服务器。 |
| `build` | `wxt build` | Chrome 的生产构建 → `.output/chrome-mv3`。 |
| `build:firefox` | `wxt build -b firefox` | Firefox 的生产构建 → `.output/firefox-mv3`。 |
| `zip` | `wxt zip` | 构建并将 Chrome 扩展打包成 `.output/` 中可分发的 zip。 |
| `zip:firefox` | `wxt zip -b firefox` | 构建并将 Firefox 扩展 zip 打包到 `.output/` 中。 |
| `compile` | `wxt prepare && tsc --noEmit` | 生成 WXT 类型，然后进行类型检查但不输出文件。 |
| `lint` | `eslint .` | 对整个项目进行 lint（位于 `eslint.config.js` 的 ESLint 9 扁平配置）。 |
| `test` | `tsx test-parser.ts` | 运行区域设置观看次数解析器测试（`test-parser.ts`），覆盖全部 9 种受支持语言的观看/观众解析和直播检测。 |

> ℹ️ `postinstall` 会在 `npm install` / `npm ci` 之后自动运行 `wxt prepare`。

在更改 `src/utils/locales.ts` 或 `src/utils/parser.ts` 中的任何内容后,运行 `npm test` — 它会断言真实的 YouTube 数值字符串（包括以 NBSP 分隔和逗号小数的形式）对 English、日本語、Español、Português、Deutsch、Français、Русский、한국어 和 简体中文 都能解析为预期的数字。

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

WXT 配置了 `srcDir: 'src'` 和 `modules: ['@wxt-dev/module-react']`。共享逻辑通过 `@/utils/...` 别名导入。manifest 声明了 `permissions: ['storage']` 和 `host_permissions: ['https://www.youtube.com/*']`，其 `name: 'TubeFilter'`，描述为 "Filter YouTube videos based on views and other metrics."。`wxt.config.ts` 中的 `manifestVersion: 3` 是为两个目标强制输出 MV3 的单一信息源（SSOT）。

`tsconfig.json` 继承自 WXT 生成的 `./.wxt/tsconfig.json`，并添加了 `jsx: 'react-jsx'`、`allowImportingTsExtensions`、`noUnusedLocals`、`noUnusedParameters` 和 `noFallthroughCasesInSwitch`。

## 构建与发布

### 构建产物

| 目标 | 输出目录 |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Zip 产物

`wxt zip` 使用 WXT 的默认 zip 文件名模板（`{{name}}-{{version}}-{{browser}}.zip`，其中 `{{name}}` 是 `package.json` 中的名称 `tube-filter`）将构建打包到 `.output/` 中。`wxt.config.ts` 中未设置自定义的 `zipFileName`/`sources` 模板，因此下面的名称遵循 WXT 默认值：

- `tube-filter-<version>-chrome.zip`（例如 `tube-filter-1.0.0-chrome.zip`）— 已由发布工作流的上传 glob 印证。
- `tube-filter-<version>-firefox.zip`（例如 `tube-filter-1.0.0-firefox.zip`）— 已由发布工作流的上传 glob 印证。
- 一个供 AMO 审核用的源代码 zip（WXT 针对 Firefox 目标的默认行为，通常为 `tube-filter-<version>-sources.zip`）。该名称是 WXT 默认值，且未被仓库中的任何代码引用；运行 `npm run zip:firefox` 以确认你环境中的确切文件名。

### GitHub Actions 发布工作流

`.github/workflows/release.yml`（名为 **Release**）在 GitHub 的 `release` 事件（`types: [published]`）上触发，并具有 `permissions: contents: write`。该作业在 `ubuntu-latest` 上运行，并：

1. 检出代码（`actions/checkout@v4`）。
2. 设置带 npm 缓存的 **Node.js 20**（`actions/setup-node@v4`）。
3. 运行 `npm ci`（其 `postinstall` 会运行 `wxt prepare`）。
4. 运行 `npm run zip`（Chrome）和 `npm run zip:firefox`（Firefox），产出两个浏览器的 zip。
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
4. `npm test` 运行区域设置解析器测试（尤其是在改动了 `src/utils/locales.ts` 或 `src/utils/parser.ts` 之后）。
5. 用 `npm run dev` 和 `npm run dev:firefox` 在两个目标中测试你的更改。

## 许可证

本项目未指定任何许可证，仓库中也不存在 `LICENSE` 文件。在缺乏明确许可证的情况下，代码默认为**保留所有权利**（all rights reserved）— 你没有权限复用、再分发或修改它。如果你打算将其开放，请添加一个 `LICENSE` 文件来声明相关条款。
