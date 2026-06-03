# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter**는 직접 설정한 조회수 및 실시간 시청자 수 기준에 따라 콘텐츠를 필터링하여 YouTube 피드를 깔끔하게 정리해 주는 크로스 브라우저 Manifest V3 확장 프로그램입니다. 조회수가 낮은 동영상과 시청자가 적은 라이브 스트림을 흐리게 처리하거나 숨기며, 프로모션 상단 배너, 믹스 목록, Shorts를 각각 독립적으로 제거할 수 있습니다. 설정은 React 팝업에서 관리되며, 새로고침 없이 열려 있는 YouTube 탭에 즉시 적용됩니다. 팝업 UI는 일본어와 영어를 지원하며(브라우저 언어를 따르는 **Auto** 모드 포함), 조회수/시청자 수는 **9개 YouTube 페이지 언어**에 걸쳐 로케일을 인식하는 방식으로 파싱됩니다.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **상태:** v1.0.0 — 아직 Chrome 웹 스토어나 AMO에 게시되지 않았습니다. 로컬 압축 해제 빌드를 통해 설치하세요(자세한 내용은 [설치 (최종 사용자)](#installation-end-users) 참조).

## 한눈에 보기

TubeFilter는 설정한 조회수/시청자 수 기준에 미달하는 YouTube 피드 항목을 숨기거나 흐리게 처리하며, 필요에 따라 배너, 믹스 목록, Shorts를 제거할 수 있습니다. 세 단계로 사용해 보세요:

1. `npm ci`
2. `npm run build` (Chrome) 또는 `npm run build:firefox` (Firefox)
3. `.output/chrome-mv3`(또는 `.output/firefox-mv3`)에서 압축 해제 빌드를 로드하세요 — [설치 (최종 사용자)](#installation-end-users) 참조.

설정은 브라우저를 절대 벗어나지 않습니다: TubeFilter는 `storage` 권한과 `youtube.com`에 대한 호스트 접근 권한만 요청하며, 모든 구성은 로컬 브라우저 저장소에 보관됩니다.

## 기능

### 조회수 필터 (일반 동영상)

일반 동영상은 다음 조건이 **모두** 충족될 때 필터링됩니다:

- 동영상 필터가 활성화되어 있음 (`enableVideoFilter`).
- 카드에서 조회수가 성공적으로 파싱되었음.
- 파싱된 조회수가 `minViews` 기준값 **미만**임.

조회수를 파싱할 수 없는 동영상은 그대로 둡니다. 팝업의 **Min Views** 슬라이더가 기준값을 제어하며, 동영상 필터가 꺼져 있는 동안에는 비활성화됩니다.

### 라이브 필터 (라이브 스트림)

라이브 스트림은 **별도의** 기준 — 총 조회수가 아닌 동시 시청자 수 — 으로 평가됩니다. 라이브 스트림은 라이브 필터가 활성화되어 있고(`enableLiveFilter`), 시청자 수가 파싱되었으며, 그 수가 `minConcurrent` 기준값 **미만**일 때 필터링됩니다. 라이브 상태는 DOM의 라이브 표시 배지 또는 조회수 문자열의 라이브를 나타내는 텍스트에서 감지됩니다([작동 방식](#live-detection) 참조).

### 콘텐츠 필터 (기준값 없음)

이 세 가지 필터는 조건 없는 on/off 스위치로, 조회수를 완전히 무시합니다:

| 필터 | 설정 | 제거 대상 |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | 프로모션 마스트헤드 광고 및 안내/프로모션 배너. 일치하는 배너가 리치 섹션 내부에 있으면 부모 섹션 전체가 숨겨집니다. |
| **Mix Lists** | `enableMixFilter` | 자동 생성된 믹스 / 라디오 재생목록. |
| **Shorts** | `enableShortsFilter` | Shorts 링크 및 셸프. |

### 필터 모드: Hide vs. Opacity

**Filter Mode** 선택기는 필터링된 동영상/라이브 스트림을 어떻게 처리할지 결정합니다:

- **Hide** — `display: none`을 설정하여 요소를 화면에서 완전히 제거합니다.
- **Opacity** — `opacity: 0.1`을 설정하여 요소를 **10%** 불투명도로 흐리게 처리하면서도 보이도록 유지합니다. 기본값입니다.

> ℹ️ Top Banner 필터는 선택된 필터 모드와 관계없이 항상 배너를 숨깁니다(`display: none`). 필터 모드는 동영상과 라이브 스트림에만 영향을 줍니다.

### 필터 우선순위

각 카드는 고정된 if/else 순서를 사용하여 한 번 분류됩니다. 가장 먼저 일치하는 카테고리의 규칙만 적용됩니다:

1. **Shorts** (최우선)
2. **믹스 목록**
3. **라이브 스트림**
4. **일반 동영상**

### 다국어 조회수 감지

YouTube는 조회수와 시청자 수를 **페이지 언어별로 매우 다르게** 렌더링합니다 — 단순히 단어만 번역되는 것이 아니라 소수점/천 단위 구분 기호와 약어 단위도 다릅니다. 동일한 약 17억의 수치가 다음과 같이 나타납니다:

| 언어 | YouTube 문자열 |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

콘텐츠 스크립트는 **YouTube 페이지 언어**(`document.documentElement.lang`)를 자동으로 감지하고, 해당 로케일에 맞는 소수점 구분 기호, 천 단위 구분 기호, 약어 단위로 수치를 파싱합니다. 이것이 중요한 이유는 이전 파서가 영어식 형식을 가정하여 **쉼표를 소수점으로 쓰는 로케일**(`de` / `fr` / `ru` / `pt`)을 **잘못 읽었기** 때문입니다 — 예를 들어 `1,7 Mrd.`를 `1,700,000,000`이 아닌 `1` 또는 `17`로 읽었습니다. 로케일에 맞는 파싱은 **9개 언어**에서 지원되며([국제화](#internationalization) 참조), 알 수 없는 페이지 언어는 관대한 범용 파서로 폴백합니다.

### 언어 (팝업 UI)

팝업 UI는 **일본어(`ja`)**와 **영어(`en`)**로 제공되며, 브라우저 UI 언어(`navigator.language`)를 따르는 세 번째 **Auto(`auto`, 기본값)** 모드가 있습니다: 브라우저 언어가 `ja`로 시작하면 UI가 일본어로 렌더링되고, 그렇지 않으면 영어로 렌더링됩니다. 팝업 헤더의 세 버튼 컨트롤(`Auto` / `日本語` / `EN`)로 전환하며, 현재 선택된 항목이 강조 표시됩니다.

## 스크린샷

> 📷 _TODO: 팝업 스크린샷과 필터링된 피드의 전후 비교(Hide vs. Opacity)를 추가하세요. 아직 커밋된 스크린샷이 없습니다._

## 지원 브라우저

| 브라우저 | Manifest | 비고 |
|---|---|---|
| **Chrome / Chromium** | MV3 | 기본 빌드 타겟; Chrome은 기본적으로 MV3입니다. |
| **Firefox** | MV3 | 출력 디렉터리는 `.output/firefox-mv3`; `wxt.config.ts`의 `manifestVersion: 3`을 통해 MV3가 강제됩니다(그렇지 않으면 Firefox는 기본적으로 MV2가 됩니다). |

> ℹ️ 콘텐츠 스크립트는 두 브라우저 모두에서 `https://www.youtube.com/*`에서 실행됩니다. Firefox 빌드는 `tube-filter@coil398.github.io`라는 `browser_specific_settings.gecko.id`를 포함합니다(AMO MV3에 필요하며 Chrome에서는 무해함).

## 설치 (최종 사용자)

전체적이고 지원되는 릴리스 및 설치 안내는 **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**를 참조하세요.

테스트용으로 로컬 압축 해제 빌드를 로드하려면:

### Chrome / Chromium

1. `npm run build`를 실행하여 `.output/chrome-mv3`를 생성합니다.
2. `chrome://extensions`를 엽니다.
3. **개발자 모드**(우측 상단)를 활성화합니다.
4. **압축해제된 확장 프로그램을 로드합니다**를 클릭하고 `.output/chrome-mv3` 디렉터리를 선택합니다.

### Firefox

1. `npm run build:firefox`를 실행하여 `.output/firefox-mv3`를 생성합니다.
2. `about:debugging`을 엽니다.
3. **이 Firefox** → **임시 부가 기능 로드…**로 이동합니다.
4. `.output/firefox-mv3` 디렉터리 내의 아무 파일(예: `manifest.json`)을 선택합니다.

## 사용법

확장 프로그램 팝업을 열어 필터링을 조정하세요. 변경 사항은 즉시 저장되며 열려 있는 YouTube 탭에 실시간으로 적용됩니다 — 새로고침이 필요 없습니다.

### 설정 레퍼런스

| 설정 | 제어 대상 | 범위 / 단계 | 기본값 | JA 레이블 | EN 레이블 |
|---|---|---|---|---|---|
| `minViews` | 이 미만이면 일반 동영상이 필터링되는 최소 조회수 | range `0`–`100000`, step `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | 이 미만이면 라이브 스트림이 필터링되는 최소 동시 시청자 수 | range `0`–`5000`, step `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | 필터링된 동영상/라이브 스트림 처리 방식 (`hide` / `opacity`) | 두 버튼 선택기 | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | 조회수 필터 활성화/비활성화 (Min Views 슬라이더도 함께 활성화/비활성화) | on/off 토글 | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | 라이브 필터 활성화/비활성화 (Min Concurrent 슬라이더도 함께 활성화/비활성화) | on/off 토글 | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | 프로모션 상단 배너 숨기기 | on/off 토글 | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | 믹스 목록 숨기기 | on/off 토글 | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Shorts 숨기기 | on/off 토글 | `true` | ショート動画非表示 | Hide Shorts |
| `language` | 팝업 UI 언어 (`auto` / `ja` / `en`); **Auto**는 브라우저 UI 언어(`navigator.language`)를 따름 | 세 버튼 선택기 (`Auto` / `日本語` / `EN`) | `auto` | Language | 言語 |

두 슬라이더 모두 `toLocaleString()`을 통해 천 단위로 구분된 값을 표시합니다. Min Concurrent 슬라이더 아래에는 보조 안내가 있습니다:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### 필터 모드 선택기

두 버튼 컨트롤. **Hide**는 `filterMode = 'hide'`를, **Opacity**는 `filterMode = 'opacity'`를 설정합니다. 활성 모드가 강조 표시됩니다. 레이블은 현지화되어 있습니다 — JA: 非表示 / 薄く表示, EN: Hide / Opacity.

### 언어 선택기

팝업 헤더의 세 버튼 컨트롤이 `language`를 `auto`, `ja`, `en` 중 하나로 설정합니다. 버튼은 **Auto** / **日本語** / **EN**으로 표시되며, 현재 선택된 항목이 강조 표시됩니다. **Auto**(기본값)는 `navigator.language`로부터 실효 UI 언어를 결정합니다: 브라우저 언어가 `ja`로 시작하면 UI가 일본어로 렌더링되고, 그 외에는 영어로 렌더링됩니다. **日本語** 또는 **EN**을 선택하면 브라우저 설정과 관계없이 UI가 해당 언어로 고정됩니다.

## 작동 방식

### 콘텐츠 스크립트

- **매칭 & 타이밍** — `https://www.youtube.com/*`에 매칭되며 `run_at: document_end`에서 실행됩니다.
- **페이지 언어 감지** — 매번 패스마다 `document.documentElement.lang`을 읽고(`navigator.language`, 그다음 `'en'`으로 폴백), 이를 사용해 로케일에 맞는 조회수 파서를 선택합니다([국제화](#internationalization) 참조).
- **타겟** — 홈(`ytd-rich-item-renderer`), 검색(`ytd-video-renderer`), 사이드바(`ytd-compact-video-renderer`), 채널(`ytd-grid-video-renderer`), 믹스 목록(`ytd-radio-renderer`), 개별 Shorts(`ytd-reel-item-renderer`), Shorts 셸프(`ytd-rich-shelf-renderer`)를 다루는 7개의 동영상 선택기를 스캔하고, 추가로 9개의 배너 선택기(`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer`, 그리고 여러 `ytd-rich-section-renderer > #content > …` 변형)를 스캔합니다.
- **동적 피드 처리** — `MutationObserver`가 `{ childList: true, subtree: true }`로 `document.body`를 감시합니다. 노드가 추가되면 **500 ms** `setTimeout`으로 디바운스하며(배치마다 타이머를 지우고 다시 설정), 따라서 마지막으로 추가된 노드 버스트 이후 500 ms에 필터가 실행됩니다. 필터는 또한 초기 로드 시 한 번, 설정 로드 직후 한 번 실행됩니다.

  > ℹ️ 이것은 고정된 throttle이 아니라 trailing 디바운스입니다: 변형이 계속되는 동안 패스는 계속 지연됩니다. (소스 자체의 인라인 주석 `// Run at most every 500ms`는 throttling을 설명하며 다소 부정확합니다.)
- **믹스 / Shorts 감지** — 믹스 목록은 `start_radio=1`, `list=RD`, `MIX` 오버레이 배지 또는 `ytd-radio-renderer`를 통해 매칭됩니다; Shorts는 `/shorts/` 링크, `SHORTS` 오버레이 배지, `ytd-reel-item-renderer`, `ytd-rich-shelf-renderer` 셸프를 통해 매칭됩니다.
- **배너 부모 섹션 숨기기** — 일치하는 배너에 `closest('ytd-rich-section-renderer')` 조상이 있으면 내부 배너만이 아니라 부모 섹션 전체가 숨겨집니다.

<a id="live-detection"></a>

라이브 상태는 DOM 배지(`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) 또는 조회수 텍스트 자체(대소문자 구분 없이 `視聴中`, `watching`, `live`, `ライブ`를 포함하거나 활성 페이지 로케일 고유의 라이브 키워드 — [국제화](#internationalization) 참조)에서 감지됩니다.

<a id="internationalization"></a>

### 국제화

YouTube는 모든 UI 언어에서 조회수/시청자 수를 다르게 포맷하므로, 수치 파싱은 팝업 UI 언어가 아니라 **감지된 YouTube 페이지 언어**에 의해 구동됩니다. 매 패스마다 콘텐츠 스크립트는 `document.documentElement.lang`을 읽고(`navigator.language`, 그다음 `'en'`으로 폴백), 이를 기본 언어 코드로 정규화한 다음(예: `zh-Hans-CN` → `zh`, `es-419` → `es`), 해당 언어의 소수점 구분 기호, 천 단위 구분 기호, 약어 단위(예: `K`/`M`/`B`, `万`/`億`, `Mio.`/`Mrd.`, `тыс.`/`млн`/`млрд`, `万`/`亿`), "조회수" 연결어, 날짜/지난 스트림 표시, 라이브 스트림 단어, "조회수 없음" → `0` 단어를 기술하는 로케일별 스펙을 선택합니다.

로케일에 맞는 파싱은 **9개 언어**에서 지원됩니다:

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

페이지 언어가 이 중 어느 것도 아니면, 파싱은 `.`을 소수점으로 사용하고 일반적인 단위(`K`/`M`/`B` 및 CJK/한국어 단위)의 합집합을 최선의 노력으로 인식하는 **관대한 범용 스펙**으로 폴백합니다. 이러한 로케일 인식은 쉼표를 소수점으로 쓰는 로케일(`de` / `fr` / `ru` / `pt`)에서 `1,7 Mrd.`를 `1,700,000,000`이 아닌 `1` 또는 `17`로 읽던 이전 파서의 오독을 수정합니다.

### 팝업 (React)

React 19 팝업(`src/entrypoints/popup/`)이 슬라이더, 토글, 필터 모드 선택기, 세 갈래 언어 선택기를 렌더링합니다. 어떤 컨트롤이든 편집하면 즉시 저장소에 기록됩니다. 팝업은 `settings.language`로부터 실효 표시 언어를 결정합니다: `auto`는 `navigator.language`를 따르고, `ja` / `en`은 이를 고정합니다.

### 설정 저장 & 실시간 동기화

- 설정은 **플랫한 최상위 키**로 `browser.storage.local`에 영속화됩니다 — 필드당 하나의 키(`minViews`, `minConcurrent`, `filterMode`, …). 이는 WXT 이전의 `chrome.storage.local` 형태와 일치하므로, 기존 사용자는 마이그레이션 전반에 걸쳐 설정을 유지합니다.
- `loadSettings()`는 `browser.storage.local.get(defaultSettings)`를 호출하여 저장된 값을 기본값 위에 병합합니다; `saveSettings()`는 `browser.storage.local.set(settings)`를 호출합니다.
- `watchSettings()`는 `browser.storage.onChanged` 리스너를 등록합니다. `local` 영역에서 변경이 발생하면 전체 설정 레코드를 다시 읽고 필터를 다시 실행합니다 — 이것이 팝업 편집이 열려 있는 탭에 즉시 적용되는 이유입니다.

`Settings` 타입은 정확히 9개의 필드를 가집니다: `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language` (`'auto' | 'ja' | 'en'`, 기본값 `'auto'`).

### 조회수 파싱

`parseViewCount(text, lang)`은 주어진 페이지 언어에 대한 로케일 스펙(언어를 알 수 없거나 생략된 경우 범용 스펙)을 결정하고, YouTube의 다양한 수치 문자열을 숫자(또는 `null`)로 정규화합니다. 지원되는 모든 로케일에 걸쳐 다음을 수행합니다:

| 입력 패턴 | 처리 | 예시 |
|---|---|---|
| 약어 단위 (로케일별) | 로케일의 단위 배율로 곱함 | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| 로케일 소수점 / 천 단위 구분 기호 | 쉼표 소수점 로케일(`de`/`fr`/`ru`/`pt`)과 공백 천 단위 로케일(`fr`/`ru`)을 올바르게 파싱 | `129.069 Aufrufe` (de) → `129069` |
| "조회수 없음" 단어 (예: `No views`, `なし`, 로케일 등가물) | `0` 반환 | `No views` → `0` |
| 일반 숫자 | 로케일별로 구분 기호를 제거한 후 파싱 | `1,234` (en) → `1234` |
| 날짜 / 지난 스트림 텍스트 | "수치 아님"으로 취급하여 카드를 그대로 둠 | `2 days ago`, `〜前` |
| 파싱 불가 | `null` 반환 (조회수 규칙으로 필터링되지 않음) | — |

파싱 전에, 로케일의 "조회수"/연결어 키워드(예: `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`)가 제거됩니다. 공백 — 실제 YouTube 문자열에 나타나는 NBSP 및 narrow-NBSP 포함 — 이 먼저 정규화됩니다. `isLive(text, lang)` 헬퍼는 텍스트에 범용 라이브 표시(`視聴中`, `watching`, `live`, `ライブ`) 또는 활성 로케일의 라이브 스트림 단어 중 하나가 포함되어 있을 때 `true`를 반환합니다(대소문자 구분 없음).

## 알려진 제한 사항

> ⚠️ `src/utils/filter.ts`의 디버그 로깅이 현재 하드코딩으로 켜져 있어(`const debug = true`), 콘텐츠 스크립트가 장황한 콘솔 출력을 내보냅니다. `FILTERED` 요약 로그는 조건 없이 내보내집니다 — `debug` 가드 바깥에 있으므로 — 따라서 플래그를 꺼도 나타납니다.

## 개발

### 사전 요구 사항

- **Node.js 20** (CI에서 사용하는 버전).
- npm (저장소에 `package-lock.json`이 포함되어 있습니다).

### 설치

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### npm 스크립트

| 스크립트 | 명령 | 동작 |
|---|---|---|
| `dev` | `wxt` | HMR과 함께 Chrome(기본 타겟)용 WXT 개발 서버를 시작합니다. |
| `dev:firefox` | `wxt -b firefox` | Firefox를 타겟으로 WXT 개발 서버를 시작합니다. |
| `build` | `wxt build` | Chrome용 프로덕션 빌드 → `.output/chrome-mv3`. |
| `build:firefox` | `wxt build -b firefox` | Firefox용 프로덕션 빌드 → `.output/firefox-mv3`. |
| `zip` | `wxt zip` | Chrome 확장 프로그램을 빌드하여 `.output/`에 배포용 zip으로 패키징합니다. |
| `zip:firefox` | `wxt zip -b firefox` | Firefox 확장 프로그램 zip을 `.output/`에 빌드 및 패키징합니다. |
| `compile` | `wxt prepare && tsc --noEmit` | WXT 타입을 생성한 다음, 출력 없이 타입 체크를 수행합니다. |
| `lint` | `eslint .` | 프로젝트 전체를 린트합니다(`eslint.config.js`의 ESLint 9 flat config). |
| `test` | `tsx test-parser.ts` | 로케일 조회수 파서 테스트(`test-parser.ts`)를 실행하며, 지원되는 9개 언어 전체에 걸쳐 조회수/시청자 파싱과 라이브 감지를 다룹니다. |

> ℹ️ `postinstall`은 `npm install` / `npm ci` 후 `wxt prepare`를 자동으로 실행합니다.

`src/utils/locales.ts` 또는 `src/utils/parser.ts`의 무언가를 변경한 후에는 `npm test`를 실행하세요 — 실제 YouTube 수치 문자열(NBSP로 구분된 형태와 쉼표 소수점 형태 포함)이 English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文에 대해 예상 숫자로 파싱되는지 단언합니다.

### 프로젝트 구조

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

WXT는 `srcDir: 'src'`와 `modules: ['@wxt-dev/module-react']`로 구성됩니다. 공유 로직은 `@/utils/...` 별칭을 통해 임포트됩니다. 매니페스트는 `permissions: ['storage']`와 `host_permissions: ['https://www.youtube.com/*']`를 선언하며, `name: 'TubeFilter'`와 "Filter YouTube videos based on views and other metrics."라는 설명을 가집니다. `wxt.config.ts`의 `manifestVersion: 3`은 두 타겟 모두에 대해 MV3 출력을 강제하는 단일 진실 공급원(SSOT)입니다.

`tsconfig.json`은 WXT가 생성한 `./.wxt/tsconfig.json`을 확장하며 `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`를 추가합니다.

## 빌드 및 릴리스

### 빌드 출력

| 타겟 | 출력 디렉터리 |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Zip 아티팩트

`wxt zip`은 WXT의 기본 zip 파일명 템플릿(`{{name}}-{{version}}-{{browser}}.zip`, 여기서 `{{name}}`은 `package.json`의 이름 `tube-filter`)을 사용하여 빌드를 `.output/`에 패키징합니다. `wxt.config.ts`에 커스텀 `zipFileName`/`sources` 템플릿이 설정되어 있지 않으므로, 아래 이름들은 WXT 기본값을 따릅니다:

- `tube-filter-<version>-chrome.zip` (예: `tube-filter-1.0.0-chrome.zip`) — 릴리스 워크플로의 업로드 glob으로 확인됨.
- `tube-filter-<version>-firefox.zip` (예: `tube-filter-1.0.0-firefox.zip`) — 릴리스 워크플로의 업로드 glob으로 확인됨.
- AMO 심사용 소스 zip(Firefox 타겟에 대한 WXT 기본값, 일반적으로 `tube-filter-<version>-sources.zip`). 이 이름은 WXT 기본값이며 저장소의 어떤 코드에서도 참조되지 않습니다; 환경에서 정확한 파일명을 확인하려면 `npm run zip:firefox`를 실행하세요.

### GitHub Actions 릴리스 워크플로

`.github/workflows/release.yml`(이름 **Release**)는 `types: [published]`로 GitHub `release` 이벤트에서 트리거되며 `permissions: contents: write`를 가집니다. 작업은 `ubuntu-latest`에서 실행되며:

1. 코드를 체크아웃합니다(`actions/checkout@v4`).
2. npm 캐시와 함께 **Node.js 20**을 설정합니다(`actions/setup-node@v4`).
3. `npm ci`를 실행합니다(그 `postinstall`이 `wxt prepare`를 실행함).
4. `npm run zip`(Chrome)과 `npm run zip:firefox`(Firefox)를 실행하여 두 브라우저 zip을 모두 생성합니다.
5. `softprops/action-gh-release@v2`를 통해 이들을 릴리스 자산으로 업로드합니다(`startsWith(github.ref, 'refs/tags/')`로 가드됨). `.output/tube-filter-*-chrome.zip`과 `.output/tube-filter-*-firefox.zip`에 매칭됩니다.

## 기술 스택

| 기술 | 버전 |
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

패키지는 `tube-filter` v`1.0.0`(`private`, ESM `"type": "module"`)이며; 확장 프로그램 표시 이름은 `wxt.config.ts`에서 **TubeFilter**로 재정의됩니다.

## 기여

기여를 환영합니다. PR을 열기 전에:

1. `npm ci`로 의존성을 설치합니다(이는 WXT 타입도 생성합니다).
2. `npm run lint`로 ESLint를 사용해 코드를 검사합니다.
3. `npm run compile`로 타입 체크를 수행합니다(`wxt prepare && tsc --noEmit`).
4. `npm test`로 로케일 파서 테스트를 실행합니다(특히 `src/utils/locales.ts` 또는 `src/utils/parser.ts`를 건드린 후).
5. `npm run dev`와 `npm run dev:firefox`로 두 타겟 모두에서 변경 사항을 테스트합니다.

## 라이선스

이 프로젝트에는 라이선스가 지정되어 있지 않으며, 저장소에 `LICENSE` 파일이 없습니다. 명시적 라이선스가 없으면 코드는 기본적으로 **모든 권리 보유(all rights reserved)** 상태이며 — 재사용, 재배포, 수정할 권한이 없습니다. 이를 공개할 의도가 있다면, 조건을 선언하는 `LICENSE` 파일을 추가하세요.
