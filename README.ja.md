# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** は、あなたが設定した再生回数・ライブ同時接続数のしきい値に照らしてコンテンツをフィルタリングし、YouTube のフィードを整理するクロスブラウザ対応の Manifest V3 拡張機能です。再生回数の少ない動画や同時接続数の少ないライブ配信を薄く表示したり非表示にしたりするほか、プロモーション用のトップバナー、ミックスリスト、ショート動画をそれぞれ独立して取り除けます。設定は React 製のポップアップで管理し、開いている YouTube タブにリロードなしで即座に反映されます。ポップアップ UI は **9 言語**（English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文）に対応し、ブラウザの言語に追従する **Auto** モードも備えています。再生回数・視聴者数は、同じ **9 種類の YouTube ページ言語** にわたってロケールを考慮した方法で解析されます。

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **ステータス:** v1.0.0 — Chrome ウェブストアおよび AMO には未公開です。ローカルの unpacked ビルドからインストールしてください（[インストール](#installation-end-users) を参照）。

## 概要

TubeFilter は、あなたが設定した再生回数・視聴者数のしきい値を下回る YouTube フィードの項目を非表示または薄く表示し、必要に応じてバナー・ミックスリスト・ショート動画を取り除きます。3 ステップで試すには:

1. `npm ci`
2. `npm run build`（Chrome）または `npm run build:firefox`（Firefox）
3. `.output/chrome-mv3`（または `.output/firefox-mv3`）から unpacked ビルドを読み込む — [インストール](#installation-end-users) を参照。

設定がブラウザの外に出ることはありません。TubeFilter が要求するのは `storage` 権限と `youtube.com` へのホストアクセスだけで、すべての構成はローカルのブラウザストレージに保存されます。

## 機能

### 再生回数フィルタ（通常の動画）

通常の動画は、次の **すべて** が満たされたときにフィルタリングされます:

- 動画フィルタが有効になっている（`enableVideoFilter`）。
- カードから再生回数の解析に成功している。
- 解析された再生回数が `minViews` しきい値を **下回っている**。

再生回数を解析できない動画はそのまま残ります。ポップアップの **Min Views** スライダーがしきい値を制御し、動画フィルタがオフのときは無効化されます。

### ライブフィルタ（ライブ配信）

ライブ配信は **別の** しきい値 — 総再生回数ではなく同時接続数 — で評価されます。ライブ配信は、ライブフィルタが有効（`enableLiveFilter`）で、視聴者数が解析でき、その数が `minConcurrent` しきい値を **下回っている** ときにフィルタリングされます。ライブ状態は DOM のライブ配信中バッジ、または再生回数文字列内のライブを示すテキストから検出されます（[仕組み](#live-detection) を参照）。

### コンテンツフィルタ（しきい値なし）

これら 3 つのフィルタは無条件のオン/オフスイッチで、再生回数を一切考慮しません:

| フィルタ | 設定 | 取り除く対象 |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | プロモーション用のマストヘッド広告とステートメント/プロモバナー。一致したバナーがリッチセクション内にある場合、親セクション全体が非表示になります。 |
| **Mix Lists** | `enableMixFilter` | 自動生成されるミックス / ラジオ プレイリスト。 |
| **Shorts** | `enableShortsFilter` | ショート動画のリンクとシェルフ。 |

### チャンネルルールとキーワードフィルタ

数値のしきい値に加えて、チャンネル単位で強制的に表示/非表示にしたり、タイトルのテキストで非表示にしたりできます — ポップアップで 1 行 1 エントリのリストとして管理します。

- **常に非表示にするチャンネル**（`channelBlocklist`）— これらのチャンネルの動画は、再生回数に関係なく常に非表示になります。
- **常に表示するチャンネル**（`channelAllowlist`）— これらのチャンネルの動画は決してフィルタリングされません（`minViews` を下回る、お気に入りの小規模クリエイターに便利です）。
- **この語を含むタイトルを非表示**（`titleKeywords`）— リストに挙げたいずれかの語をタイトルに含む動画を非表示にします。スラッシュで囲んだエントリ（例: `/spoiler.*ending/`）は大文字小文字を区別しない **正規表現** として扱われ、それ以外は大文字小文字を区別しない単純な部分文字列として扱われます。

チャンネルは `@handle`、チャンネル ID、またはチャンネル名で **完全一致** で照合されます（そのため `mr` は `@MrBeast` に一致 **しません**）。これらのルールは個々の動画 / プレイリスト / ミックスのカードに適用されますが、集約シェルフ（例: ショート動画のシェルフ）には **適用されません**。これにより、子要素 1 つが行全体を非表示にしてしまうことはありません。

### フィルタリングが適用される場所

コンテンツスクリプトは YouTube 全体で動作し、ナビゲーションに合わせて再フィルタリングします — ホーム、検索、登録チャンネル、視聴ページのサイドバーのおすすめ、チャンネルページ — レガシーレンダラーと新しい `yt-lockup-view-model` レイアウトの両方をカバーします。

### フィルタモード: 非表示 vs. 不透明度

**Filter Mode** セレクターは、フィルタリングされた動画 / ライブ配信をどう扱うかを決めます:

- **Hide** — `display: none` を設定し、要素を表示から完全に取り除きます。
- **Opacity** — `opacity: 0.1` を設定し、要素を表示したまま **10%** の不透明度に薄くします。これがデフォルトです。

> ℹ️ Top Banner フィルタは、選択したフィルタモードに関係なく常にバナーを非表示（`display: none`）にします。フィルタモードが影響するのは動画とライブ配信のみです。

### フィルタの優先順位

各カードは固定の if/else 順で一度だけ分類されます。最初に一致したカテゴリのルールだけが適用されます:

1. **チャンネルブロックリスト** — 常に非表示（最優先）
2. **チャンネル許可リスト** — 常に表示（以降のすべてのルールをスキップ）
3. **タイトルキーワード** — 一致するタイトルを非表示
4. **ショート動画**
5. **ミックスリスト**
6. **ライブ配信**
7. **通常の動画**

（チャンネル/キーワードのルール 1〜3 は個々のカードにのみ適用され、集約シェルフには適用されません。）

### 自動吹き替えの無効化（元の音声を強制）

YouTube の自動吹き替えは、あなたのインターフェイス言語に基づいて動画の音声を AI 翻訳されたトラックに差し替えます — そのため英語の動画がデフォルトで日本語やドイツ語などで再生されてしまいます。**Force Original Audio**（`forceOriginalAudio`、**デフォルトでオン**）を使うと、TubeFilter は元の音声トラックを検出し、すべての動画とショート動画でプレーヤーを自動的にそのトラックに切り替えて、自動吹き替えを元に戻します。

- `/watch` の動画とショート動画で動作し、アプリ内ナビゲーションのたびに再適用されます。
- 元のトラックは、プレーヤーの音声トラック ID をデコードすることで **言語に依存せず** 識別されます（元のトラックのデータには `original` が含まれ、吹き替えトラックには `dubbed` / `dubbed-auto` が含まれます）。
- ページに注入される **MAIN-world スクリプト** で実装されています — YouTube のプレーヤー音声 API は分離されたコンテンツスクリプトの世界からは到達できないためです — 設定は拡張機能のストレージからブリッジされます。
- YouTube の吹き替え音声を維持したい場合は、いつでもポップアップでオフに切り替えられます。

### 多言語の再生回数検出

YouTube は再生回数・視聴者数を **ページ言語ごとに大きく異なる形** でレンダリングします — 単に言葉が翻訳されるだけでなく、小数点/桁区切りの記号や省略単位も異なります。同じ約 17 億という数値は次のように表示されます:

| 言語 | YouTube の文字列 |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

コンテンツスクリプトは **YouTube のページ言語**（`document.documentElement.lang`）を自動検出し、そのロケールに合った小数点記号、桁区切り記号、省略単位で回数を解析します。これが重要なのは、以前のパーサーが英語形式を前提としており、コンマを小数点とするロケール（`de` / `fr` / `ru` / `pt`）を **誤読** していたためです — 例えば `1,7 Mrd.` を `1,700,000,000` ではなく `1` や `17` と読んでいました。ロケールを正しく扱う解析は **9 言語** に対応しています（[国際化対応](#internationalization) を参照）。未知のページ言語は、寛容な汎用パーサーにフォールバックします。

### 言語（ポップアップ UI）

ポップアップ UI は **9 言語** — English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文 — に加えて、ブラウザの UI 言語（`navigator.language`、最も近い対応ロケールにマッピングされ、該当がなければ英語にフォールバック）に追従する **Auto（`auto`、デフォルト）** モードで提供されます。ポップアップのヘッダーにあるドロップダウンで切り替えます。

## スクリーンショット

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## 対応ブラウザ

| ブラウザ | Manifest | 備考 |
|---|---|---|
| **Chrome / Chromium** | MV3 | デフォルトのビルドターゲット。Chrome はデフォルトで MV3 です。 |
| **Firefox** | MV3 | 出力ディレクトリは `.output/firefox-mv3`。`wxt.config.ts` の `manifestVersion: 3` によって MV3 が強制されます（指定しない場合 Firefox はデフォルトで MV2 になります）。 |

> ℹ️ コンテンツスクリプトは両方のブラウザで `https://www.youtube.com/*` 上で動作します。Firefox ビルドには `tube-filter@coil398.github.io` という `browser_specific_settings.gecko.id` が付与されています（AMO の MV3 では必須で、Chrome では無害です）。

## インストール（エンドユーザー向け）

完全にサポートされたリリース・インストールの手順については、**[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)** を参照してください。

テスト用にローカルの unpacked ビルドを読み込むには:

### Chrome / Chromium

1. `npm run build` を実行して `.output/chrome-mv3` を生成します。
2. `chrome://extensions` を開きます。
3. **デベロッパーモード**（右上）を有効にします。
4. **パッケージ化されていない拡張機能を読み込む** をクリックし、`.output/chrome-mv3` ディレクトリを選択します。

### Firefox

1. `npm run build:firefox` を実行して `.output/firefox-mv3` を生成します。
2. `about:debugging` を開きます。
3. **この Firefox** → **一時的なアドオンを読み込む…** に進みます。
4. `.output/firefox-mv3` ディレクトリ内の任意のファイル（例: その `manifest.json`）を選択します。

## 使い方

拡張機能のポップアップを開いてフィルタリングを調整します。変更はすぐに保存され、開いているすべての YouTube タブにライブで適用されます — リロードは不要です。

### 設定リファレンス

| 設定 | 制御する内容 | 範囲 / ステップ | デフォルト | JA label | EN label |
|---|---|---|---|---|---|
| `minViews` | これを下回ると通常の動画がフィルタリングされる最低再生回数 | range `0`–`100000`, step `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | これを下回るとライブ配信がフィルタリングされる最低同時接続数 | range `0`–`5000`, step `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | フィルタリングされた動画 / ライブ配信の扱い方（`hide` / `opacity`） | 2 ボタンのセレクター | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | 再生回数フィルタの有効/無効（Min Views スライダーの有効/無効も切り替え） | オン/オフトグル | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | ライブフィルタの有効/無効（Min Concurrent スライダーの有効/無効も切り替え） | オン/オフトグル | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | プロモーション用トップバナーを非表示にする | オン/オフトグル | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | ミックスリストを非表示にする | オン/オフトグル | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | ショート動画を非表示にする | オン/オフトグル | `true` | ショート動画非表示 | Hide Shorts |
| `forceOriginalAudio` | 視聴ページとショート動画で元の音声トラックを強制する（自動吹き替えを元に戻す） | オン/オフトグル | `true` | 元の音声に固定 | Force Original Audio |
| `channelAllowlist` | 決してフィルタリングしない（常に表示する）チャンネル、1 行 1 件。@handle、ID、または名前で照合 | テキストエリアのリスト | `[]` | 常に表示するチャンネル | Always-show channels |
| `channelBlocklist` | 常に非表示にするチャンネル、1 行 1 件 | テキストエリアのリスト | `[]` | 常に非表示のチャンネル | Always-hide channels |
| `titleKeywords` | タイトルに語を含む動画を非表示にする。`/…/` のエントリは大文字小文字を区別しない正規表現 | テキストエリアのリスト | `[]` | この語を含むタイトルを非表示 | Hide titles containing |
| `language` | ポップアップ UI の言語: `auto` + 9 ロケール（`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`）。**Auto** はブラウザの UI 言語（`navigator.language`）に追従 | ドロップダウンセレクター | `auto` | Language | 言語 |

どちらのスライダーも、値を `toLocaleString()` で桁区切り表示します。Min Concurrent スライダーの下には補足が表示されます:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### フィルタモードセレクター

2 ボタンのコントロールです。**Hide** は `filterMode = 'hide'` を、**Opacity** は `filterMode = 'opacity'` を設定します。アクティブなモードがハイライトされます。ラベルはローカライズされます — JA: 非表示 / 薄く表示、EN: Hide / Opacity。

### 言語セレクター

ポップアップのヘッダーにあるドロップダウンで、`language` を `auto` または 9 ロケール（`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`）のいずれかに設定します。**Auto**（デフォルト）は実効的な UI 言語を `navigator.language` から解決し、最も近い対応ロケールにマッピングし、該当がなければ英語にフォールバックします。特定の言語を選ぶと、ブラウザの設定に関係なく UI がその言語に固定されます。

## 仕組み

### コンテンツスクリプト

- **マッチと実行タイミング** — `https://www.youtube.com/*` に一致し、`run_at: document_end` で動作します。
- **ページ言語の検出** — 毎回のパスで `document.documentElement.lang`（なければ `navigator.language`、それもなければ `'en'`）を読み取り、それを使ってロケールに合った再生回数パーサーを選びます（[国際化対応](#internationalization) を参照）。
- **対象** — 7 つの動画セレクターをスキャンします。ホーム（`ytd-rich-item-renderer`）、検索（`ytd-video-renderer`）、サイドバー（`ytd-compact-video-renderer`）、チャンネル（`ytd-grid-video-renderer`）、ミックスリスト（`ytd-radio-renderer`）、個々のショート動画（`ytd-reel-item-renderer`）、ショート動画のシェルフ（`ytd-rich-shelf-renderer`）をカバーします。加えて 9 つのバナーセレクター（`#masthead-ad`、`#big-yoodle`、`ytd-statement-banner-renderer`、`ytd-banner-promo-renderer`、`ytd-ad-slot-renderer`、`ytd-in-feed-ad-layout-renderer`、および複数の `ytd-rich-section-renderer > #content > …` のバリエーション）もスキャンします。
- **動的フィードの処理** — `MutationObserver` が `document.body` を `{ childList: true, subtree: true }` で監視します。ノードが追加されると **500 ms** の `setTimeout` でデバウンスし（バッチごとにタイマーをクリアして再アーム）、追加されたノードの最後のまとまりから 500 ms 後にフィルタが実行されます。フィルタは初回読み込み時と、設定の読み込み直後にも 1 回ずつ実行されます。

  > ℹ️ これは固定スロットルではなく末尾デバウンスです。連続的なミューテーションのもとではパスが繰り返し先送りされます。（ソース内のインラインコメント `// Run at most every 500ms` はスロットリングを説明しており、やや不正確です。）
- **ミックス / ショート動画の検出** — ミックスリストは `start_radio=1`、`list=RD`、`MIX` のオーバーレイバッジ、または `ytd-radio-renderer` で照合されます。ショート動画は `/shorts/` リンク、`SHORTS` のオーバーレイバッジ、`ytd-reel-item-renderer`、および `ytd-rich-shelf-renderer` のシェルフで照合されます。
- **バナーの親セクション非表示** — 一致したバナーに `closest('ytd-rich-section-renderer')` の祖先がある場合、内側のバナーだけでなく親セクション全体が非表示になります。

<a id="live-detection"></a>

ライブ状態は DOM のバッジ（`.badge-style-type-live-now`、`.badge-style-type-live-now-alternate`、`[overlay-style="LIVE"]`）、または再生回数のテキスト自体（大文字小文字を区別せず `視聴中`、`watching`、`live`、`ライブ` を含むか、加えて現在のページロケール固有のライブキーワードを含むか — [国際化対応](#internationalization) を参照）から検出されます。

<a id="internationalization"></a>

### 国際化対応

YouTube は再生回数・視聴者数を UI 言語ごとに異なる形式で表示するため、回数の解析はポップアップ UI の言語ではなく、**検出された YouTube ページ言語** によって駆動されます。各パスでコンテンツスクリプトは `document.documentElement.lang`（なければ `navigator.language`、それもなければ `'en'`）を読み取り、それを基底の言語コードに正規化し（例: `zh-Hans-CN` → `zh`、`es-419` → `es`）、その言語の小数点記号、桁区切り記号、省略単位（例: `K`/`M`/`B`、`万`/`億`、`Mio.`/`Mrd.`、`тыс.`/`млн`/`млрд`、`万`/`亿`）、「views」をつなぐ語、日付/過去の配信を示すマーカー、ライブ配信を示す語、「視聴回数なし」→ `0` を示す語を記述したロケールごとの仕様を選択します。

ロケールを正しく扱う解析は **9 言語** に対応しています:

- **English**（`en`）
- **日本語**（`ja`）
- **Español**（`es`）
- **Português**（`pt`）
- **Deutsch**（`de`）
- **Français**（`fr`）
- **Русский**（`ru`）
- **한국어**（`ko`）
- **简体中文**（`zh`）

ページ言語がこれらのいずれでもない場合、解析は `.` を小数点として使い、一般的な単位の和集合（`K`/`M`/`B` および CJK/韓国語の単位）をベストエフォートで認識する **寛容な汎用仕様** にフォールバックします。このロケール対応により、以前のパーサーがコンマを小数点とするロケール（`de` / `fr` / `ru` / `pt`）で `1,7 Mrd.` を `1,700,000,000` ではなく `1` や `17` と誤読していた問題が修正されます。

### ポップアップ（React）

React 19 製のポップアップ（`src/entrypoints/popup/`）が、スライダー、トグル、フィルタモードセレクター、3 種類の言語セレクターをレンダリングします。いずれかのコントロールを編集すると、即座にストレージへ書き込まれます。ポップアップは `settings.language` から実効的な表示言語を解決します: `auto` は `navigator.language` に追従し、`ja` / `en` はその言語に固定します。

### 設定ストレージとライブ同期

- 設定は `browser.storage.local` に **フラットなトップレベルキー** として永続化されます — 1 フィールドにつき 1 キー（`minViews`、`minConcurrent`、`filterMode`、…）。これは WXT 移行前の `chrome.storage.local` の形と一致するため、既存ユーザーは移行をまたいで設定を保持できます。
- `loadSettings()` は `browser.storage.local.get(defaultSettings)` を呼び、保存値をデフォルトに重ねてマージします。`saveSettings()` は `browser.storage.local.set(settings)` を呼びます。
- `watchSettings()` は `browser.storage.onChanged` リスナーを登録します。`local` 領域で変更があるたびに設定レコード全体を読み直してフィルタを再実行します — これがポップアップの編集が開いているタブに即座に反映される理由です。

`Settings` 型はちょうど 9 つのフィールドを持ちます: `minViews`、`minConcurrent`、`filterMode`、`enableVideoFilter`、`enableLiveFilter`、`enableBannerFilter`、`enableMixFilter`、`enableShortsFilter`、`language`（`'auto' | 'ja' | 'en'`、デフォルト `'auto'`）。

### 再生回数の解析

`parseViewCount(text, lang)` は、与えられたページ言語のロケール仕様（言語が不明/省略された場合は汎用仕様）を解決し、YouTube のさまざまな回数文字列を数値（または `null`）に正規化します。対応する全ロケールにわたって、次のように処理します:

| 入力パターン | 処理 | 例 |
|---|---|---|
| 省略単位（ロケールごと） | ロケールの単位係数で乗算 | `1.2万` → `12000`、`12K` → `12000`、`1,7 Mrd.`（de）→ `1700000000` |
| ロケールの小数点 / 桁区切り記号 | コンマを小数点とするロケール（`de`/`fr`/`ru`/`pt`）とスペースを桁区切りとするロケール（`fr`/`ru`）を正しく解析 | `129.069 Aufrufe`（de）→ `129069` |
| 「視聴回数なし」を示す語（例: `No views`、`なし`、ロケールごとの相当語） | `0` を返す | `No views` → `0` |
| 単純な数値 | ロケールごとに区切り記号を取り除いてから解析 | `1,234`（en）→ `1234` |
| 日付 / 過去の配信のテキスト | 「回数ではない」として扱い、カードはそのまま残す | `2 days ago`、`〜前` |
| 解析不能 | `null` を返す（要素は再生回数ルールでフィルタリングされない） | — |

解析の前に、ロケールの「views」/つなぎのキーワード（例: `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`）が取り除かれます。空白 — 実際の YouTube 文字列に現れる NBSP や narrow-NBSP を含む — はまず正規化されます。`isLive(text, lang)` ヘルパーは、テキストが共通のライブマーカー（`視聴中`、`watching`、`live`、`ライブ`）または現在のロケールのライブ配信を示す語のいずれかを含むとき（大文字小文字を区別せず）`true` を返します。

## 既知の制限事項

> ⚠️ `src/utils/filter.ts` のデバッグログは現在ハードコードでオン（`const debug = true`）になっているため、コンテンツスクリプトは冗長なコンソール出力を発します。`FILTERED` のサマリーログは無条件に出力されます — `debug` ガードの外にあるため — フラグをオフにしても表示されます。

## 開発

### 前提条件

- **Node.js 20**（CI で使用しているバージョン）。
- npm（リポジトリには `package-lock.json` が同梱されています）。

### インストール

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### npm スクリプト

| スクリプト | コマンド | 内容 |
|---|---|---|
| `dev` | `wxt` | Chrome（デフォルトターゲット）向けの WXT 開発サーバーを HMR 付きで起動します。 |
| `dev:firefox` | `wxt -b firefox` | Firefox をターゲットにした WXT 開発サーバーを起動します。 |
| `build` | `wxt build` | Chrome 向けのプロダクションビルド → `.output/chrome-mv3`。 |
| `build:firefox` | `wxt build -b firefox` | Firefox 向けのプロダクションビルド → `.output/firefox-mv3`。 |
| `zip` | `wxt zip` | Chrome 拡張機能をビルドして、配布可能な zip として `.output/` にパッケージ化します。 |
| `zip:firefox` | `wxt zip -b firefox` | Firefox 拡張機能の zip をビルドして `.output/` にパッケージ化します。 |
| `compile` | `wxt prepare && tsc --noEmit` | WXT の型を生成してから、出力なしで型チェックします。 |
| `lint` | `eslint .` | プロジェクト全体を Lint します（`eslint.config.js` の ESLint 9 flat config）。 |
| `test` | `tsx test-parser.ts` | ロケール再生回数パーサーのテスト（`test-parser.ts`）を実行します。対応する全 9 言語にわたる再生回数/視聴者数の解析とライブ検出をカバーします。 |

> ℹ️ `postinstall` は `npm install` / `npm ci` の後に `wxt prepare` を自動実行します。

`src/utils/locales.ts` または `src/utils/parser.ts` の内容を変更したら `npm test` を実行してください — English、日本語、Español、Português、Deutsch、Français、Русский、한국어、简体中文 について、実際の YouTube 回数文字列（NBSP 区切りやコンマ小数点の形式を含む）が期待される数値に解析されることを検証します。

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

WXT は `srcDir: 'src'` と `modules: ['@wxt-dev/module-react']` で構成されています。共有ロジックは `@/utils/...` エイリアス経由でインポートされます。manifest は `permissions: ['storage']` と `host_permissions: ['https://www.youtube.com/*']` を宣言し、`name: 'TubeFilter'`、description は "Filter YouTube videos based on views and other metrics." です。`wxt.config.ts` の `manifestVersion: 3` が、両ターゲットで MV3 出力を強制する唯一の信頼できる情報源（SSOT）です。

`tsconfig.json` は WXT が生成する `./.wxt/tsconfig.json` を継承し、`jsx: 'react-jsx'`、`allowImportingTsExtensions`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch` を追加します。

## ビルドとリリース

### ビルド出力

| ターゲット | 出力ディレクトリ |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Zip 成果物

`wxt zip` は、WXT のデフォルトの zip ファイル名テンプレート（`{{name}}-{{version}}-{{browser}}.zip`、`{{name}}` は `package.json` の名前 `tube-filter`）を使って、ビルドを `.output/` にパッケージ化します。`wxt.config.ts` にカスタムの `zipFileName`/`sources` テンプレートは設定されていないため、以下の名前は WXT のデフォルトに従います:

- `tube-filter-<version>-chrome.zip`（例: `tube-filter-1.0.0-chrome.zip`）— リリースワークフローのアップロード glob で裏付けられています。
- `tube-filter-<version>-firefox.zip`（例: `tube-filter-1.0.0-firefox.zip`）— リリースワークフローのアップロード glob で裏付けられています。
- AMO レビュー用のソース zip（Firefox ターゲットでの WXT のデフォルト。通常は `tube-filter-<version>-sources.zip`）。この名前は WXT のデフォルトで、リポジトリのどのコードからも参照されていません。正確なファイル名はあなたの環境で `npm run zip:firefox` を実行して確認してください。

### GitHub Actions リリースワークフロー

`.github/workflows/release.yml`（名前は **Release**）は、GitHub の `release` イベント（`types: [published]`）でトリガーされ、`permissions: contents: write` を持ちます。ジョブは `ubuntu-latest` 上で動作し、次を行います:

1. コードをチェックアウトする（`actions/checkout@v4`）。
2. **Node.js 20** を npm キャッシュ付きでセットアップする（`actions/setup-node@v4`）。
3. `npm ci` を実行する（その `postinstall` が `wxt prepare` を実行）。
4. `npm run zip`（Chrome）と `npm run zip:firefox`（Firefox）を実行し、両ブラウザの zip を生成する。
5. `softprops/action-gh-release@v2` でそれらをリリースアセットとしてアップロードする（`startsWith(github.ref, 'refs/tags/')` でガードされ、`.output/tube-filter-*-chrome.zip` と `.output/tube-filter-*-firefox.zip` に一致）。

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

1. `npm ci` で依存関係をインストールする（これで WXT の型も生成されます）。
2. `npm run lint` で ESLint によりコードをチェックする。
3. `npm run compile` で型チェックする（`wxt prepare && tsc --noEmit`）。
4. `npm test` でロケールパーサーのテストを実行する（特に `src/utils/locales.ts` や `src/utils/parser.ts` を触った後）。
5. `npm run dev` と `npm run dev:firefox` で両ターゲットでの変更をテストする。

## ライセンス

このプロジェクトにはライセンスが指定されておらず、リポジトリに `LICENSE` ファイルは存在しません。明示的なライセンスがない場合、コードはデフォルトで **all rights reserved（全権利留保）** となります — 再利用、再配布、改変は許可されていません。公開する意図がある場合は、条件を宣言する `LICENSE` ファイルを追加してください。
