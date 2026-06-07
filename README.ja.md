# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** は、自分で設定した再生回数・同時視聴者数のしきい値に基づいて YouTube フィードのコンテンツをフィルタリングし、フィードをすっきり整えるクロスブラウザ対応の Manifest V3 拡張機能です。再生回数の少ない動画や同時視聴者数の少ないライブ配信を薄く表示または非表示にし、加えてプロモーション用のトップバナー、ミックスリスト、ショート動画をそれぞれ独立して取り除けます。設定は React 製のポップアップに集約され、開いている YouTube タブにはリロードなしで即座に反映されます。ポップアップ UI は **9 言語**（English、日本語、Español、Português、Deutsch、Français、Русский、한국어、简体中文）に対応し、ブラウザの言語に追従する **Auto** モードも用意しています。再生回数・視聴者数は、同じ **9 種類の YouTube ページ言語**にわたってロケールを考慮した方法で解析されます。

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **ステータス:** v1.0.0 — Chrome ウェブストアおよび AMO にはまだ公開されていません。ローカルでビルドした unpacked 版からインストールしてください（[インストール](#installation-end-users)を参照）。

## 概要

TubeFilter は、設定した再生回数・視聴者数のしきい値を下回る YouTube フィードのアイテムを非表示または薄く表示し、必要に応じてバナー、ミックスリスト、ショート動画を取り除きます。3 ステップで試すには:

1. `npm ci`
2. `npm run build`（Chrome）または `npm run build:firefox`（Firefox）
3. `.output/chrome-mv3`（または `.output/firefox-mv3`）から unpacked 版を読み込む — [インストール](#installation-end-users)を参照。

設定がブラウザの外に出ることはありません。TubeFilter が要求するのは `storage` 権限と `youtube.com` へのホストアクセスのみで、すべての設定はローカルのブラウザストレージに保持されます。

## 機能

### 再生回数フィルタ（通常の動画）

通常の動画は、次の条件が**すべて**満たされたときにフィルタリングされます:

- 動画フィルタが有効である（`enableVideoFilter`）。
- カードから再生回数の解析に成功している。
- 解析された再生回数が `minViews` のしきい値を**下回っている**。

再生回数を解析できない動画はそのまま手を付けません。ポップアップの **Min Views** スライダーがしきい値を制御し、動画フィルタがオフのときは無効になります。

### ライブフィルタ（ライブ配信）

ライブ配信は、総再生回数ではなく同時視聴者数という**別の**しきい値で評価されます。ライブ配信は、ライブフィルタが有効（`enableLiveFilter`）で、視聴者数が解析でき、その数が `minConcurrent` のしきい値を**下回っている**ときにフィルタリングされます。ライブ状態は DOM 上の live-now バッジ、または再生回数文字列内のライブを示すテキストから検出されます（[仕組み](#live-detection)を参照）。

### コンテンツフィルタ（しきい値なし）

これら 3 つのフィルタは無条件のオン/オフスイッチで、再生回数を一切考慮しません:

| フィルタ | 設定 | 取り除く対象 |
|---|---|---|
| **トップバナー** | `enableBannerFilter` | プロモーション用のマストヘッド広告やステートメント/プロモーションバナー。マッチしたバナーがリッチセクション内にある場合は、親セクション全体を非表示にします。 |
| **ミックスリスト** | `enableMixFilter` | 自動生成されたミックス/ラジオプレイリスト。 |
| **ショート動画** | `enableShortsFilter` | ショート動画のリンクとシェルフ。 |

### フィルタモード: 非表示 vs. 不透明度

**Filter Mode** セレクターは、フィルタリングされた動画/ライブ配信をどう扱うかを決めます:

- **Hide** — `display: none` を設定し、要素を表示から完全に取り除きます。
- **Opacity** — `opacity: 0.1` を設定し、要素を不透明度 **10%** まで薄くしつつ表示は残します。こちらがデフォルトです。

> ℹ️ トップバナーフィルタは、選択したフィルタモードに関係なく常にバナーを非表示にします（`display: none`）。フィルタモードが影響するのは動画とライブ配信のみです。

### フィルタの優先順位

各カードは固定の if/else 順序で一度だけ分類されます。最初にマッチしたカテゴリのルールだけが適用されます:

1. **ショート動画**（最優先）
2. **ミックスリスト**
3. **ライブ配信**
4. **通常の動画**

### 自動吹き替えの無効化（元の音声に固定）

YouTube の自動吹き替えは、インターフェース言語に基づいて動画の音声を AI 翻訳されたトラックに置き換えます。そのため、英語の動画がデフォルトで日本語やドイツ語などで再生されてしまいます。**Force Original Audio**（`forceOriginalAudio`、**デフォルトでオン**）を使うと、TubeFilter が元の音声トラックを検出し、すべての動画とショート動画で自動的にプレーヤーをそのトラックへ切り替え、自動吹き替えを元に戻します。

- `/watch` 動画とショート動画で動作し、アプリ内ナビゲーションのたびに再適用されます。
- 元のトラックは、プレーヤーの音声トラック ID をデコードすることで**言語非依存**に識別されます（元のトラックのデータには `original` が含まれ、吹き替えトラックには `dubbed` / `dubbed-auto` が含まれます）。
- ページに注入される **MAIN-world スクリプト**として実装されています（YouTube のプレーヤー音声 API は分離された content-script の世界からは到達できないため）。設定は拡張機能のストレージからブリッジされます。
- YouTube の吹き替え音声を残したい場合は、ポップアップでいつでもオフに切り替えられます。

### 多言語の再生回数検出

YouTube は再生回数・視聴者数を**ページ言語ごとに大きく異なる形で**表示します。単語が翻訳されるだけでなく、小数点/桁区切り記号や省略単位も異なります。同じおよそ 17 億という数値は次のように表示されます:

| 言語 | YouTube の文字列 |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

コンテンツスクリプトは **YouTube のページ言語**（`document.documentElement.lang`）を自動検出し、そのロケールに合った小数点記号・桁区切り記号・省略単位で数値を解析します。これが重要なのは、以前のパーサーが英語形式を前提としており、**カンマ小数のロケール**（`de` / `fr` / `ru` / `pt`）を**読み間違えていた**ためです。たとえば `1,7 Mrd.` を `1,700,000,000` ではなく `1` や `17` と読んでしまっていました。ロケール対応の解析は **9 言語**でサポートされています（[国際化](#internationalization)を参照）。未知のページ言語の場合は寛容な汎用パーサーにフォールバックします。

### 言語（ポップアップ UI）

ポップアップ UI は **9 言語**（English、日本語、Español、Português、Deutsch、Français、Русский、한국어、简体中文）で提供され、加えてブラウザの UI 言語（`navigator.language`、サポートされる最も近いロケールにマッピングされ、英語にフォールバック）に追従する **Auto（`auto`、デフォルト）** モードもあります。ポップアップヘッダーのドロップダウンで切り替えられます。

## スクリーンショット

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## 対応ブラウザ

| ブラウザ | Manifest | 備考 |
|---|---|---|
| **Chrome / Chromium** | MV3 | デフォルトのビルドターゲット。Chrome はデフォルトで MV3 です。 |
| **Firefox** | MV3 | 出力ディレクトリは `.output/firefox-mv3`。`wxt.config.ts` の `manifestVersion: 3` によって MV3 が強制されます（指定しない場合、Firefox はデフォルトで MV2 になります）。 |

> ℹ️ コンテンツスクリプトは両ブラウザで `https://www.youtube.com/*` 上で動作します。Firefox 版は `browser_specific_settings.gecko.id` として `tube-filter@coil398.github.io` を持ちます（AMO の MV3 で必須、Chrome では無害）。

## インストール（エンドユーザー向け）

サポートされている完全なリリース・インストール手順については、**[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)** を参照してください。

テスト用にローカルの unpacked 版を読み込むには:

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

拡張機能のポップアップを開いてフィルタリングを調整します。変更は即座に保存され、開いている任意の YouTube タブにライブで適用されます。リロードは不要です。

### 設定リファレンス

| 設定 | 制御する内容 | 範囲 / ステップ | デフォルト | JA label | EN label |
|---|---|---|---|---|---|
| `minViews` | これを下回ると通常の動画がフィルタリングされる最低再生回数 | range `0`–`100000`, step `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | これを下回るとライブ配信がフィルタリングされる最低同時視聴者数 | range `0`–`5000`, step `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | フィルタリングされた動画/ライブ配信の扱い方（`hide` / `opacity`） | 2 ボタンセレクター | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | 再生回数フィルタの有効/無効（Min Views スライダーの有効/無効も切り替える） | オン/オフトグル | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | ライブフィルタの有効/無効（Min Concurrent スライダーの有効/無効も切り替える） | オン/オフトグル | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | プロモーション用トップバナーを非表示にする | オン/オフトグル | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | ミックスリストを非表示にする | オン/オフトグル | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | ショート動画を非表示にする | オン/オフトグル | `true` | ショート動画非表示 | Hide Shorts |
| `forceOriginalAudio` | 視聴ページとショート動画で元の音声トラックを強制する（自動吹き替えを元に戻す） | オン/オフトグル | `true` | 元の音声に固定 | Force Original Audio |
| `language` | ポップアップ UI の言語: `auto` + 9 ロケール（`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`）。**Auto** はブラウザの UI 言語（`navigator.language`）に追従する | ドロップダウンセレクター | `auto` | Language | 言語 |

どちらのスライダーも `toLocaleString()` によって桁区切りされた値を表示します。Min Concurrent スライダーの下には補助的な注記があります:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### フィルタモードセレクター

2 ボタンのコントロールです。**Hide** は `filterMode = 'hide'` を、**Opacity** は `filterMode = 'opacity'` を設定します。アクティブなモードがハイライトされます。ラベルはローカライズされています — JA: 非表示 / 薄く表示、EN: Hide / Opacity。

### 言語セレクター

ポップアップヘッダーのドロップダウンで、`language` を `auto` または 9 ロケール（`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`）のいずれかに設定します。**Auto**（デフォルト）は、`navigator.language` から有効な UI 言語を解決し、サポートされる最も近いロケールにマッピングして、英語にフォールバックします。特定の言語を選ぶと、ブラウザの設定に関係なく UI がその言語に固定されます。

## 仕組み

### コンテンツスクリプト

- **マッチ＆タイミング** — `https://www.youtube.com/*` にマッチし、`run_at: document_end` で実行されます。
- **ページ言語検出** — 毎回のパスで `document.documentElement.lang` を読み（`navigator.language`、次に `'en'` にフォールバック）、それを使ってロケールに合った再生回数パーサーを選びます（[国際化](#internationalization)を参照）。
- **対象** — ホーム（`ytd-rich-item-renderer`）、検索（`ytd-video-renderer`）、サイドバー（`ytd-compact-video-renderer`）、チャンネル（`ytd-grid-video-renderer`）、ミックスリスト（`ytd-radio-renderer`）、個別のショート動画（`ytd-reel-item-renderer`）、ショート動画シェルフ（`ytd-rich-shelf-renderer`）をカバーする 7 種類の動画セレクターをスキャンします。加えて 9 種類のバナーセレクター（`#masthead-ad`、`#big-yoodle`、`ytd-statement-banner-renderer`、`ytd-banner-promo-renderer`、`ytd-ad-slot-renderer`、`ytd-in-feed-ad-layout-renderer`、および複数の `ytd-rich-section-renderer > #content > …` バリアント）もスキャンします。
- **動的フィードの処理** — `MutationObserver` が `document.body` を `{ childList: true, subtree: true }` で監視します。ノードが追加されると **500 ms** の `setTimeout` でデバウンスし（バッチごとにタイマーをクリアして再設定）、ノード追加のバーストが止んでから 500 ms 後にフィルタを実行します。フィルタは初回ロード時にも一度実行され、設定読み込み直後にも一度実行されます。

  > ℹ️ これは固定スロットルではなく trailing デバウンスです。変更が連続している間はパスが後ろへ繰り延べられ続けます。（ソース内のインラインコメント `// Run at most every 500ms` はスロットリングを説明しており、やや不正確です。）
- **ミックス/ショート動画の検出** — ミックスリストは `start_radio=1`、`list=RD`、`MIX` オーバーレイバッジ、または `ytd-radio-renderer` でマッチします。ショート動画は `/shorts/` リンク、`SHORTS` オーバーレイバッジ、`ytd-reel-item-renderer`、`ytd-rich-shelf-renderer` シェルフでマッチします。
- **バナーの親セクション非表示** — マッチしたバナーに `closest('ytd-rich-section-renderer')` の祖先がある場合、内側のバナーだけでなく親セクション全体を非表示にします。

<a id="live-detection"></a>

ライブ状態は、DOM のバッジ（`.badge-style-type-live-now`、`.badge-style-type-live-now-alternate`、`[overlay-style="LIVE"]`）、または再生回数テキスト自体（大文字小文字を区別せず `視聴中`、`watching`、`live`、`ライブ` を含む場合、加えて現在のページロケール固有のライブキーワード — [国際化](#internationalization)を参照）から検出されます。

<a id="internationalization"></a>

### 国際化

YouTube は再生回数・視聴者数を UI 言語ごとに異なる形式で表示するため、数値の解析はポップアップ UI 言語ではなく**検出された YouTube ページ言語**によって駆動されます。各パスでコンテンツスクリプトは `document.documentElement.lang` を読み（`navigator.language`、次に `'en'` にフォールバック）、それを基底言語コードに正規化し（例: `zh-Hans-CN` → `zh`、`es-419` → `es`）、その言語の小数点記号、桁区切り記号、省略単位（例: `K`/`M`/`B`、`万`/`億`、`Mio.`/`Mrd.`、`тыс.`/`млн`/`млрд`、`万`/`亿`）、「views」を表す接続語、日付/過去配信のマーカー、ライブ配信を表す語、「再生回数なし」→ `0` の語を記述したロケールごとの spec を選びます。

ロケール対応の解析は **9 言語**でサポートされています:

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

ページ言語がこれらのいずれでもない場合は、`.` を小数点とし、よく使われる単位（`K`/`M`/`B` と CJK/韓国語の単位）の和集合をベストエフォートで認識する**寛容な汎用 spec** にフォールバックします。このロケール対応により、以前のパーサーがカンマ小数のロケール（`de` / `fr` / `ru` / `pt`）で `1,7 Mrd.` を `1,700,000,000` ではなく `1` や `17` と読み間違えていた問題が修正されます。

### ポップアップ（React）

React 19 製のポップアップ（`src/entrypoints/popup/`）が、スライダー、トグル、フィルタモードセレクター、3 種類の言語セレクターを描画します。いずれかのコントロールを編集すると即座にストレージへ書き込まれます。ポップアップは `settings.language` から有効な表示言語を解決します。`auto` は `navigator.language` に追従し、`ja` / `en` は固定します。

### 設定ストレージとライブ同期

- 設定は `browser.storage.local` に**フラットなトップレベルキー**として永続化されます。フィールドごとに 1 キー（`minViews`、`minConcurrent`、`filterMode`、…）です。これは WXT 移行前の `chrome.storage.local` の形に一致するため、既存ユーザーは移行をまたいで設定を保持できます。
- `loadSettings()` は `browser.storage.local.get(defaultSettings)` を呼び、保存された値をデフォルトの上にマージします。`saveSettings()` は `browser.storage.local.set(settings)` を呼びます。
- `watchSettings()` は `browser.storage.onChanged` リスナーを登録します。`local` エリアに変更があるたびに設定レコード全体を読み直してフィルタを再実行します。これが、ポップアップの編集が開いているタブに即座に反映される理由です。

`Settings` 型はちょうど 9 個のフィールドを持ちます: `minViews`、`minConcurrent`、`filterMode`、`enableVideoFilter`、`enableLiveFilter`、`enableBannerFilter`、`enableMixFilter`、`enableShortsFilter`、`language`（`'auto' | 'ja' | 'en'`、デフォルト `'auto'`）。

### 再生回数の解析

`parseViewCount(text, lang)` は、指定されたページ言語のロケール spec（言語が未知/省略された場合は汎用 spec）を解決し、YouTube のさまざまな数値文字列を数値（または `null`）に正規化します。サポートされるすべてのロケールにわたって、次のように処理します:

| 入力パターン | 処理 | 例 |
|---|---|---|
| 省略単位（ロケールごと） | ロケールの単位係数で乗算 | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| ロケールの小数点 / 桁区切り記号 | カンマ小数のロケール（`de`/`fr`/`ru`/`pt`）とスペース桁区切りのロケール（`fr`/`ru`）を正しく解析 | `129.069 Aufrufe` (de) → `129069` |
| 「再生回数なし」の語（例: `No views`、`なし`、各ロケールの相当語） | `0` を返す | `No views` → `0` |
| 単純な数値 | ロケールごとに区切り記号を除去してから解析 | `1,234` (en) → `1234` |
| 日付 / 過去配信のテキスト | 「数値ではない」として扱い、カードはそのまま手を付けない | `2 days ago`, `〜前` |
| 解析不能 | `null` を返す（再生回数ルールではフィルタリングされない） | — |

解析の前に、ロケールの「views」/接続キーワード（例: `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`）が除去されます。空白（実際の YouTube 文字列に現れる NBSP や narrow-NBSP を含む）が最初に正規化されます。`isLive(text, lang)` ヘルパーは、テキストに汎用のライブマーカー（`視聴中`、`watching`、`live`、`ライブ`）または現在のロケールのライブ配信を表す語のいずれかが含まれるとき（大文字小文字を区別せず）`true` を返します。

## 既知の制限

> ⚠️ `src/utils/filter.ts` のデバッグログは現在ハードコードでオンになっており（`const debug = true`）、コンテンツスクリプトが詳細なコンソール出力を吐きます。`FILTERED` サマリーログは無条件に出力されます — `debug` ガードの外にあるため、フラグをオフにしても表示されます。

## 開発

### 前提条件

- **Node.js 20**（CI で使用しているバージョン）。
- npm（リポジトリには `package-lock.json` が含まれます）。

### インストール

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### npm スクリプト

| スクリプト | コマンド | 内容 |
|---|---|---|
| `dev` | `wxt` | Chrome（デフォルトターゲット）向けに HMR 付きの WXT 開発サーバーを起動します。 |
| `dev:firefox` | `wxt -b firefox` | Firefox をターゲットに WXT 開発サーバーを起動します。 |
| `build` | `wxt build` | Chrome 向けのプロダクションビルド → `.output/chrome-mv3`。 |
| `build:firefox` | `wxt build -b firefox` | Firefox 向けのプロダクションビルド → `.output/firefox-mv3`。 |
| `zip` | `wxt zip` | Chrome 拡張機能をビルドし、配布用 zip として `.output/` にパッケージします。 |
| `zip:firefox` | `wxt zip -b firefox` | Firefox 拡張機能の zip をビルドして `.output/` にパッケージします。 |
| `compile` | `wxt prepare && tsc --noEmit` | WXT の型を生成してから、出力なしで型チェックします。 |
| `lint` | `eslint .` | プロジェクト全体を lint します（`eslint.config.js` の ESLint 9 flat config）。 |
| `test` | `tsx test-parser.ts` | ロケール対応の再生回数パーサーのテスト（`test-parser.ts`）を実行します。サポートされる全 9 言語にわたる再生回数/視聴者数の解析とライブ検出をカバーします。 |

> ℹ️ `postinstall` は `npm install` / `npm ci` の後に `wxt prepare` を自動的に実行します。

`src/utils/locales.ts` または `src/utils/parser.ts` を変更したら `npm test` を実行してください。English、日本語、Español、Português、Deutsch、Français、Русский、한국어、简体中文 について、実際の YouTube 数値文字列（NBSP 区切りやカンマ小数の形式を含む）が期待どおりの数値に解析されることを検証します。

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

WXT は `srcDir: 'src'` および `modules: ['@wxt-dev/module-react']` で構成されています。共有ロジックは `@/utils/...` エイリアス経由でインポートされます。マニフェストは `permissions: ['storage']` と `host_permissions: ['https://www.youtube.com/*']` を宣言し、`name: 'TubeFilter'`、説明文は "Filter YouTube videos based on views and other metrics." です。`wxt.config.ts` の `manifestVersion: 3` が、両ターゲットの MV3 出力を強制する唯一の信頼できる情報源（single source of truth）です。

`tsconfig.json` は WXT が生成する `./.wxt/tsconfig.json` を継承し、`jsx: 'react-jsx'`、`allowImportingTsExtensions`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch` を追加します。

## ビルドとリリース

### ビルド出力

| ターゲット | 出力ディレクトリ |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Zip 成果物

`wxt zip` は、WXT のデフォルトの zip ファイル名テンプレート（`{{name}}-{{version}}-{{browser}}.zip`、ここで `{{name}}` は `package.json` の名前 `tube-filter`）を使ってビルドを `.output/` にパッケージします。`wxt.config.ts` ではカスタムの `zipFileName`/`sources` テンプレートを設定していないため、以下の名前は WXT のデフォルトに従います:

- `tube-filter-<version>-chrome.zip`（例: `tube-filter-1.0.0-chrome.zip`）— リリースワークフローのアップロード glob で裏付けられています。
- `tube-filter-<version>-firefox.zip`（例: `tube-filter-1.0.0-firefox.zip`）— リリースワークフローのアップロード glob で裏付けられています。
- AMO レビュー用のソース zip（Firefox ターゲット向けの WXT デフォルト、通常は `tube-filter-<version>-sources.zip`）。この名前は WXT のデフォルトであり、リポジトリ内のコードからは参照されていません。正確なファイル名は `npm run zip:firefox` を実行して各自の環境で確認してください。

### GitHub Actions リリースワークフロー

`.github/workflows/release.yml`（名称 **Release**）は、GitHub の `release` イベント（`types: [published]`）でトリガーされ、`permissions: contents: write` を持ちます。ジョブは `ubuntu-latest` で実行され、次を行います:

1. コードをチェックアウトする（`actions/checkout@v4`）。
2. npm キャッシュ付きで **Node.js 20** をセットアップする（`actions/setup-node@v4`）。
3. `npm ci` を実行する（その `postinstall` が `wxt prepare` を実行）。
4. `npm run zip`（Chrome）と `npm run zip:firefox`（Firefox）を実行し、両ブラウザの zip を生成する。
5. `softprops/action-gh-release@v2` 経由でそれらをリリースアセットとしてアップロードする（`startsWith(github.ref, 'refs/tags/')` でガード）。`.output/tube-filter-*-chrome.zip` と `.output/tube-filter-*-firefox.zip` にマッチします。

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

## コントリビューション

コントリビューションを歓迎します。PR を開く前に:

1. `npm ci` で依存関係をインストールする（これにより WXT の型も生成されます）。
2. `npm run lint` で ESLint によるコードチェックを行う。
3. `npm run compile` で型チェックを行う（`wxt prepare && tsc --noEmit`）。
4. `npm test` でロケールパーサーのテストを実行する（特に `src/utils/locales.ts` または `src/utils/parser.ts` を触った後）。
5. `npm run dev` と `npm run dev:firefox` で両ターゲットでの変更をテストする。

## ライセンス

このプロジェクトにはライセンスが指定されておらず、リポジトリに `LICENSE` ファイルは存在しません。明示的なライセンスがない場合、コードはデフォルトで**全権利保留（all rights reserved）**となります。つまり、再利用・再配布・改変の許可はありません。公開するつもりであれば、条項を明記した `LICENSE` ファイルを追加してください。
