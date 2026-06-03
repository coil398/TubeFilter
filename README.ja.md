# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** は、あなたが設定する再生回数およびライブ視聴者数のしきい値に照らしてコンテンツをフィルタリングし、YouTube のフィードを整理するクロスブラウザ対応の Manifest V3 拡張機能です。再生回数の少ない動画や視聴者数の少ないライブ配信を薄く表示したり非表示にしたりするほか、プロモーション用のトップバナー、ミックスリスト、ショート動画を個別に取り除くこともできます。設定は React 製のポップアップで管理され、開いている YouTube タブにリロードなしで即座に反映されます。ポップアップ UI は日本語と英語に対応し（さらにブラウザの言語に追従する **Auto** モードもあります）、再生回数・視聴者数は **9 つの YouTube ページ言語** にわたってロケールを意識した方法で解析されます。

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **ステータス:** v1.0.0 — まだ Chrome ウェブストアや AMO には公開されていません。ローカルでビルドした展開済みパッケージ経由でインストールしてください（[インストール](#installation-end-users) を参照）。

## 概要

TubeFilter は、設定した再生回数・視聴者数のしきい値を下回る YouTube フィードの項目を非表示または薄く表示し、必要に応じてバナー、ミックスリスト、ショート動画を取り除きます。3 ステップで試すには:

1. `npm ci`
2. `npm run build`（Chrome）または `npm run build:firefox`（Firefox）
3. `.output/chrome-mv3`（または `.output/firefox-mv3`）から展開済みパッケージを読み込む — [インストール](#installation-end-users) を参照。

あなたの設定がブラウザの外に出ることはありません。TubeFilter が要求するのは `storage` 権限と `youtube.com` へのホストアクセスのみで、すべての設定はローカルのブラウザストレージに保存されます。

## 機能

### 再生回数フィルタ（通常動画）

通常動画は、以下の **すべて** が満たされたときにフィルタリングされます:

- 動画フィルタが有効になっている（`enableVideoFilter`）。
- カードから再生回数の解析に成功している。
- 解析した再生回数が `minViews` のしきい値を **下回っている**。

再生回数が解析できない動画はそのまま手を加えられません。ポップアップの **Min Views** スライダーがしきい値を制御し、動画フィルタがオフのときは無効になります。

### ライブフィルタ（ライブ配信）

ライブ配信は **別個の** しきい値、すなわち総再生回数ではなく同時接続視聴者数に照らして評価されます。ライブ配信は、ライブフィルタが有効（`enableLiveFilter`）で、視聴者数が解析され、その数が `minConcurrent` のしきい値を **下回っている** ときにフィルタリングされます。ライブ状態は DOM の「ライブ配信中」バッジ、または再生回数文字列内のライブを示すテキストから検出されます（[仕組み](#live-detection) を参照）。

### コンテンツフィルタ（しきい値なし）

これら 3 つのフィルタは無条件のオン/オフスイッチで、再生回数を完全に無視します:

| フィルタ | 設定 | 取り除く対象 |
|---|---|---|
| **トップバナー** | `enableBannerFilter` | プロモーション用のマストヘッド広告やステートメント/プロモバナー。一致したバナーがリッチセクション内にある場合、親セクション全体が非表示になります。 |
| **ミックスリスト** | `enableMixFilter` | 自動生成されるミックス/ラジオプレイリスト。 |
| **ショート動画** | `enableShortsFilter` | ショート動画のリンクおよび棚。 |

### フィルタモード: Hide と Opacity

**Filter Mode** セレクタは、フィルタリングされた動画/ライブ配信の扱いを決めます:

- **Hide** — `display: none` を設定し、要素を表示から完全に取り除きます。
- **Opacity** — `opacity: 0.1` を設定し、要素を表示したまま不透明度 **10%** に薄くします。これがデフォルトです。

> ℹ️ トップバナーフィルタは、選択されたフィルタモードに関係なく常にバナーを非表示（`display: none`）にします。フィルタモードが影響するのは動画とライブ配信だけです。

### フィルタの優先順位

各カードは、固定の if/else 順序を用いて一度だけ分類されます。最初に一致したカテゴリのルールのみが適用されます:

1. **ショート動画**（最優先）
2. **ミックスリスト**
3. **ライブ配信**
4. **通常動画**

### 多言語の再生回数検出

YouTube は再生回数・視聴者数を **ページ言語ごとに大きく異なる形式** で表示します。単に単語が翻訳されるだけでなく、小数点・桁区切りの記号や省略単位も異なります。同じ約 17 億の数値が次のように表示されます:

| 言語 | YouTube の文字列 |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

コンテンツスクリプトは **YouTube のページ言語**（`document.documentElement.lang`）を自動検出し、そのロケールに合った小数点記号、桁区切り記号、省略単位で数値を解析します。これが重要なのは、以前の解析器が英語式の形式を前提としており、**カンマ小数点のロケール**（`de` / `fr` / `ru` / `pt`）を **誤読していた** ためです。たとえば `1,7 Mrd.` を `1,700,000,000` ではなく `1` や `17` と読んでいました。ロケールに正しい解析は **9 言語** でサポートされています（[国際化](#internationalization) を参照）。未知のページ言語の場合は、寛容な汎用解析器にフォールバックします。

### 言語（ポップアップ UI）

ポップアップ UI は **日本語（`ja`）** と **英語（`en`）** で提供され、加えてブラウザ UI 言語（`navigator.language`）に追従する 3 つ目の **Auto（`auto`、デフォルト）** モードがあります。ブラウザの言語が `ja` で始まる場合は UI が日本語で表示され、それ以外の場合は英語で表示されます。ポップアップのヘッダーにある 3 ボタンのコントロール（`Auto` / `日本語` / `EN`）でこれらを切り替えられ、選択中の項目がハイライトされます。

## スクリーンショット

> 📷 _TODO: ポップアップのスクリーンショットと、フィルタリングされたフィードのビフォー/アフター（Hide と Opacity）を追加する。スクリーンショットはまだコミットされていません。_

## 対応ブラウザ

| ブラウザ | マニフェスト | 備考 |
|---|---|---|
| **Chrome / Chromium** | MV3 | デフォルトのビルドターゲット。Chrome はデフォルトで MV3 です。 |
| **Firefox** | MV3 | 出力ディレクトリは `.output/firefox-mv3`。`wxt.config.ts` の `manifestVersion: 3` によって MV3 が強制されます（そうしなければ Firefox はデフォルトで MV2 になります）。 |

> ℹ️ コンテンツスクリプトは両ブラウザで `https://www.youtube.com/*` 上で実行されます。Firefox ビルドには `tube-filter@coil398.github.io` という `browser_specific_settings.gecko.id` が含まれています（AMO の MV3 で必須、Chrome では無害）。

## インストール（エンドユーザー向け）

サポートされたリリースおよびインストールの完全な手順については、**[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)** を参照してください。

テスト用にローカルでビルドした展開済みパッケージを読み込むには:

### Chrome / Chromium

1. `npm run build` を実行して `.output/chrome-mv3` を生成します。
2. `chrome://extensions` を開きます。
3. **デベロッパーモード**（右上）を有効にします。
4. **パッケージ化されていない拡張機能を読み込む** をクリックし、`.output/chrome-mv3` ディレクトリを選択します。

### Firefox

1. `npm run build:firefox` を実行して `.output/firefox-mv3` を生成します。
2. `about:debugging` を開きます。
3. **この Firefox** → **一時的なアドオンを読み込む…** に移動します。
4. `.output/firefox-mv3` ディレクトリ内の任意のファイル（たとえば `manifest.json`）を選択します。

## 使い方

拡張機能のポップアップを開いてフィルタリングを調整します。変更は即座に保存され、開いているすべての YouTube タブにライブで適用されます。リロードは不要です。

### 設定リファレンス

| 設定 | 制御する内容 | 範囲 / 刻み | デフォルト | JA ラベル | EN ラベル |
|---|---|---|---|---|---|
| `minViews` | これを下回る再生回数の通常動画をフィルタリングする最小再生回数 | 範囲 `0`–`100000`、刻み `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | これを下回る同時接続視聴者数のライブ配信をフィルタリングする最小同時接続数 | 範囲 `0`–`5000`、刻み `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | フィルタリングされた動画/ライブ配信の扱い（`hide` / `opacity`） | 2 ボタンセレクタ | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | 再生回数フィルタの有効/無効（Min Views スライダーの有効/無効も切り替える） | オン/オフトグル | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | ライブフィルタの有効/無効（Min Concurrent スライダーの有効/無効も切り替える） | オン/オフトグル | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | プロモーション用トップバナーを非表示にする | オン/オフトグル | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | ミックスリストを非表示にする | オン/オフトグル | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | ショート動画を非表示にする | オン/オフトグル | `true` | ショート動画非表示 | Hide Shorts |
| `language` | ポップアップ UI の言語（`auto` / `ja` / `en`）。**Auto** はブラウザ UI 言語（`navigator.language`）に追従する | 3 ボタンセレクタ（`Auto` / `日本語` / `EN`） | `auto` | Language | 言語 |

両方のスライダーは、値を `toLocaleString()` によって桁区切りで表示します。Min Concurrent スライダーの下には補助的な注記があります:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### フィルタモードセレクタ

2 ボタンのコントロールです。**Hide** は `filterMode = 'hide'` を、**Opacity** は `filterMode = 'opacity'` を設定します。アクティブなモードがハイライトされます。ラベルはローカライズされています — JA: 非表示 / 薄く表示、EN: Hide / Opacity。

### 言語セレクタ

ポップアップのヘッダーにある 3 ボタンのコントロールで、`language` を `auto`、`ja`、`en` のいずれかに設定します。ボタンには **Auto** / **日本語** / **EN** と表示され、選択中の項目がハイライトされます。**Auto**（デフォルト）は実効 UI 言語を `navigator.language` から解決します。ブラウザの言語が `ja` で始まる場合は UI を日本語で表示し、それ以外は英語で表示します。**日本語** または **EN** を選択すると、ブラウザ設定に関係なく UI がその言語に固定されます。

## 仕組み

### コンテンツスクリプト

- **マッチング & タイミング** — `https://www.youtube.com/*` にマッチし、`run_at: document_end` で実行されます。
- **ページ言語検出** — 毎回のパスで `document.documentElement.lang` を読み取り（`navigator.language`、続いて `'en'` にフォールバック）、それを使ってロケールに正しい再生回数解析器を選択します（[国際化](#internationalization) を参照）。
- **対象** — Home（`ytd-rich-item-renderer`）、Search（`ytd-video-renderer`）、Sidebar（`ytd-compact-video-renderer`）、Channel（`ytd-grid-video-renderer`）、ミックスリスト（`ytd-radio-renderer`）、個別のショート動画（`ytd-reel-item-renderer`）、ショート動画の棚（`ytd-rich-shelf-renderer`）をカバーする 7 つの動画セレクタをスキャンします。加えて 9 つのバナーセレクタ（`#masthead-ad`、`#big-yoodle`、`ytd-statement-banner-renderer`、`ytd-banner-promo-renderer`、`ytd-ad-slot-renderer`、`ytd-in-feed-ad-layout-renderer`、および複数の `ytd-rich-section-renderer > #content > …` バリアント）もスキャンします。
- **動的フィードの処理** — `MutationObserver` が `document.body` を `{ childList: true, subtree: true }` で監視します。ノードが追加されると、**500 ms** の `setTimeout` でデバウンスし（バッチごとにタイマーをクリアして再設定）、追加されたノードの最後のバーストから 500 ms 後にフィルタが実行されます。フィルタは初回読み込み時にも一度、設定読み込み直後にも一度実行されます。

  > ℹ️ これは固定スロットルではなく末尾デバウンスです。連続的な変更が続くと、パスは後ろへずれ続けます。（ソース内のインラインコメント `// Run at most every 500ms` はスロットルを表現しており、やや不正確です。）
- **ミックス / ショート動画の検出** — ミックスリストは `start_radio=1`、`list=RD`、`MIX` オーバーレイバッジ、または `ytd-radio-renderer` によってマッチします。ショート動画は `/shorts/` リンク、`SHORTS` オーバーレイバッジ、`ytd-reel-item-renderer`、`ytd-rich-shelf-renderer` の棚によってマッチします。
- **バナーの親セクション非表示** — 一致したバナーが `closest('ytd-rich-section-renderer')` の祖先を持つ場合、内側のバナーだけでなく親セクション全体を非表示にします。

<a id="live-detection"></a>

ライブ状態は、DOM バッジ（`.badge-style-type-live-now`、`.badge-style-type-live-now-alternate`、`[overlay-style="LIVE"]`）から、または再生回数テキスト自体（大文字小文字を区別せず `視聴中`、`watching`、`live`、`ライブ` を含む場合、加えてアクティブなページロケール独自のライブキーワード — [国際化](#internationalization) を参照）から検出されます。

<a id="internationalization"></a>

### 国際化

YouTube は再生回数・視聴者数を UI 言語ごとに異なる形式で表示するため、数値の解析はポップアップ UI の言語ではなく **検出された YouTube ページ言語** によって駆動されます。毎回のパスでコンテンツスクリプトは `document.documentElement.lang` を読み取り（`navigator.language`、続いて `'en'` にフォールバック）、それを基本言語コードに正規化し（例: `zh-Hans-CN` → `zh`、`es-419` → `es`）、その言語の小数点記号、桁区切り記号、省略単位（例: `K`/`M`/`B`、`万`/`億`、`Mio.`/`Mrd.`、`тыс.`/`млн`/`млрд`、`万`/`亿`）、「views」を示す連結語、日付/過去配信のマーカー、ライブ配信を表す語、「再生回数なし」→ `0` を表す語を記述したロケール別の仕様を選択します。

ロケールに正しい解析は **9 言語** でサポートされています:

- **English**（`en`）
- **日本語**（`ja`）
- **Español**（`es`）
- **Português**（`pt`）
- **Deutsch**（`de`）
- **Français**（`fr`）
- **Русский**（`ru`）
- **한국어**（`ko`）
- **简体中文**（`zh`）

ページ言語がこれらのいずれでもない場合、解析は `.` を小数点とし、一般的な単位（`K`/`M`/`B` および CJK/韓国語の単位）の和集合をベストエフォートで認識する **寛容な汎用仕様** にフォールバックします。このロケール対応により、以前の解析器がカンマ小数点のロケール（`de` / `fr` / `ru` / `pt`）で `1,7 Mrd.` を `1,700,000,000` ではなく `1` や `17` と誤読していた問題が修正されます。

### ポップアップ（React）

React 19 製のポップアップ（`src/entrypoints/popup/`）が、スライダー、トグル、フィルタモードセレクタ、3 択の言語セレクタを描画します。いずれかのコントロールを編集すると、即座にストレージへ書き込まれます。ポップアップは実効表示言語を `settings.language` から解決します。`auto` は `navigator.language` に追従し、`ja` / `en` はそれに固定します。

### 設定ストレージとライブ同期

- 設定は `browser.storage.local` に **フラットなトップレベルキー** として永続化されます。フィールドごとに 1 キー（`minViews`、`minConcurrent`、`filterMode`、…）です。これは WXT 以前の `chrome.storage.local` の形と一致するため、既存ユーザーは移行をまたいで設定を引き継げます。
- `loadSettings()` は `browser.storage.local.get(defaultSettings)` を呼び出し、保存された値をデフォルトの上にマージします。`saveSettings()` は `browser.storage.local.set(settings)` を呼び出します。
- `watchSettings()` は `browser.storage.onChanged` リスナーを登録します。`local` 領域に変更があると、設定レコード全体を読み直してフィルタを再実行します。これが、ポップアップの編集が開いているタブに即座に反映される理由です。

`Settings` 型はちょうど 9 つのフィールドを持ちます: `minViews`、`minConcurrent`、`filterMode`、`enableVideoFilter`、`enableLiveFilter`、`enableBannerFilter`、`enableMixFilter`、`enableShortsFilter`、`language`（`'auto' | 'ja' | 'en'`、デフォルト `'auto'`）。

### 再生回数の解析

`parseViewCount(text, lang)` は、指定されたページ言語に対応するロケール仕様（言語が不明/省略の場合は汎用仕様）を解決し、YouTube のさまざまな数値文字列を数値（または `null`）に正規化します。サポートされるすべてのロケールにわたって、次の処理を行います:

| 入力パターン | 処理 | 例 |
|---|---|---|
| 省略単位（ロケールごと） | ロケールの単位係数を掛ける | `1.2万` → `12000`、`12K` → `12000`、`1,7 Mrd.`（de）→ `1700000000` |
| ロケールの小数点 / 桁区切り記号 | カンマ小数点のロケール（`de`/`fr`/`ru`/`pt`）とスペース桁区切りのロケール（`fr`/`ru`）を正しく解析 | `129.069 Aufrufe`（de）→ `129069` |
| 「再生回数なし」を表す語（例: `No views`、`なし`、各ロケールの相当語） | `0` を返す | `No views` → `0` |
| 単純な数値 | ロケールごとに区切り記号を取り除いてから解析 | `1,234`（en）→ `1234` |
| 日付 / 過去配信のテキスト | 「数値ではない」として扱い、カードに手を加えない | `2 days ago`、`〜前` |
| 解析不能 | `null` を返す（要素は再生回数ルールでフィルタリングされない） | — |

解析の前に、ロケールの「views」/連結キーワード（例: `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`）が取り除かれます。空白（実際の YouTube 文字列に現れる NBSP や狭い NBSP を含む）は先に正規化されます。`isLive(text, lang)` ヘルパーは、テキストに汎用的なライブマーカー（`視聴中`、`watching`、`live`、`ライブ`）またはアクティブなロケールのライブ配信語のいずれかが含まれる場合に `true` を返します（大文字小文字を区別しません）。

## 既知の制限事項

> ⚠️ `src/utils/filter.ts` のデバッグログは現在ハードコードでオン（`const debug = true`）になっているため、コンテンツスクリプトは冗長なコンソール出力を吐き出します。`FILTERED` サマリーログは無条件で出力されます — `debug` ガードの外にあるため、フラグをオフにしても出力されます。

## 開発

### 前提条件

- **Node.js 20**（CI が使用するバージョン）。
- npm（このリポジトリには `package-lock.json` が同梱されています）。

### インストール

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### npm スクリプト

| スクリプト | コマンド | 動作内容 |
|---|---|---|
| `dev` | `wxt` | Chrome（デフォルトターゲット）向けに HMR 付きの WXT 開発サーバーを起動します。 |
| `dev:firefox` | `wxt -b firefox` | Firefox をターゲットに WXT 開発サーバーを起動します。 |
| `build` | `wxt build` | Chrome 向けのプロダクションビルド → `.output/chrome-mv3`。 |
| `build:firefox` | `wxt build -b firefox` | Firefox 向けのプロダクションビルド → `.output/firefox-mv3`。 |
| `zip` | `wxt zip` | Chrome 拡張機能をビルドし、配布可能な zip として `.output/` にパッケージ化します。 |
| `zip:firefox` | `wxt zip -b firefox` | Firefox 拡張機能の zip をビルドして `.output/` にパッケージ化します。 |
| `compile` | `wxt prepare && tsc --noEmit` | WXT の型を生成してから、出力なしで型チェックします。 |
| `lint` | `eslint .` | プロジェクト全体を Lint します（`eslint.config.js` の ESLint 9 フラット設定）。 |
| `test` | `tsx test-parser.ts` | ロケール別の再生回数解析器テスト（`test-parser.ts`）を実行し、サポートされる全 9 言語にわたる再生回数/視聴者数の解析とライブ検出をカバーします。 |

> ℹ️ `postinstall` は `npm install` / `npm ci` の後に `wxt prepare` を自動実行します。

`src/utils/locales.ts` または `src/utils/parser.ts` 内のいずれかを変更したら `npm test` を実行してください。English、日本語、Español、Português、Deutsch、Français、Русский、한국어、简体中文 について、実際の YouTube の数値文字列（NBSP 区切りやカンマ小数点の形式を含む）が期待される数値に解析されることをアサートします。

### プロジェクト構成

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

WXT は `srcDir: 'src'` と `modules: ['@wxt-dev/module-react']` で構成されています。共有ロジックは `@/utils/...` エイリアス経由でインポートされます。マニフェストは `permissions: ['storage']` と `host_permissions: ['https://www.youtube.com/*']` を宣言し、`name: 'TubeFilter'`、説明は "Filter YouTube videos based on views and other metrics." です。`wxt.config.ts` の `manifestVersion: 3` が、両ターゲットで MV3 出力を強制する単一の信頼できる情報源（SSOT）です。

`tsconfig.json` は WXT が生成する `./.wxt/tsconfig.json` を継承し、`jsx: 'react-jsx'`、`allowImportingTsExtensions`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch` を追加します。

## ビルドとリリース

### ビルド出力

| ターゲット | 出力ディレクトリ |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### zip アーティファクト

`wxt zip` は、WXT のデフォルト zip ファイル名テンプレート（`{{name}}-{{version}}-{{browser}}.zip`、ここで `{{name}}` は `package.json` の名前 `tube-filter`）を用いてビルドを `.output/` にパッケージ化します。`wxt.config.ts` にカスタムの `zipFileName`/`sources` テンプレートは設定されていないため、以下の名前は WXT のデフォルトに従います:

- `tube-filter-<version>-chrome.zip`（例: `tube-filter-1.0.0-chrome.zip`）— リリースワークフローのアップロード glob によって裏付けられています。
- `tube-filter-<version>-firefox.zip`（例: `tube-filter-1.0.0-firefox.zip`）— リリースワークフローのアップロード glob によって裏付けられています。
- AMO レビュー用のソース zip（Firefox ターゲットにおける WXT のデフォルト、通常は `tube-filter-<version>-sources.zip`）。この名前は WXT のデフォルトであり、リポジトリのどのコードからも参照されていません。正確なファイル名はお使いの環境で `npm run zip:firefox` を実行して確認してください。

### GitHub Actions リリースワークフロー

`.github/workflows/release.yml`（**Release** という名前）は、GitHub の `release` イベント（`types: [published]`）でトリガーされ、`permissions: contents: write` を持ちます。ジョブは `ubuntu-latest` 上で実行され、次を行います:

1. コードをチェックアウトします（`actions/checkout@v4`）。
2. npm キャッシュ付きで **Node.js 20** をセットアップします（`actions/setup-node@v4`）。
3. `npm ci` を実行します（その `postinstall` が `wxt prepare` を実行）。
4. `npm run zip`（Chrome）と `npm run zip:firefox`（Firefox）を実行し、両ブラウザの zip を生成します。
5. `softprops/action-gh-release@v2` 経由でそれらをリリースアセットとしてアップロードします（`startsWith(github.ref, 'refs/tags/')` でガード）。`.output/tube-filter-*-chrome.zip` と `.output/tube-filter-*-firefox.zip` にマッチします。

## 技術スタック

| 技術 | バージョン |
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

パッケージは `tube-filter` v`1.0.0`（`private`、ESM `"type": "module"`）です。拡張機能の表示名は `wxt.config.ts` で **TubeFilter** に上書きされています。

## コントリビュート

コントリビュートを歓迎します。PR を開く前に:

1. `npm ci` で依存関係をインストールします（これにより WXT の型も生成されます）。
2. `npm run lint` で ESLint によるコードチェックを行います。
3. `npm run compile` で型チェックします（`wxt prepare && tsc --noEmit`）。
4. `npm test` でロケール解析器テストを実行します（特に `src/utils/locales.ts` または `src/utils/parser.ts` を触った後）。
5. `npm run dev` と `npm run dev:firefox` で両ターゲットでの変更をテストします。

## ライセンス

このプロジェクトにはライセンスが指定されておらず、リポジトリに `LICENSE` ファイルも存在しません。明示的なライセンスがない場合、コードはデフォルトで **All Rights Reserved（無断転載禁止）** となります。再利用、再配布、改変の許可はありません。公開する意図がある場合は、条件を明記した `LICENSE` ファイルを追加してください。
