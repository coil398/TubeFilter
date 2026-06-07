# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** est une extension Manifest V3 multi-navigateurs qui nettoie votre fil YouTube en filtrant le contenu selon des seuils de nombre de vues et de spectateurs en direct que vous définissez. Elle atténue ou masque les vidéos peu vues et les directs à faible audience, et peut indépendamment supprimer les bannières promotionnelles en haut de page, les listes Mix et les Shorts. Les réglages se trouvent dans un popup React, s'appliquent instantanément aux onglets YouTube ouverts sans rechargement, et l'interface du popup est disponible en **9 langues** (English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文) avec un mode **Auto** qui suit la langue de votre navigateur. Les nombres de vues/spectateurs sont analysés en tenant compte des particularités locales dans les mêmes **9 langues de page YouTube**.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **Statut :** v1.0.0 — pas encore publiée sur le Chrome Web Store ni sur AMO. Installez-la via une build locale décompressée (voir [Installation](#installation-end-users)).

## En un coup d'œil

TubeFilter masque ou atténue les éléments de votre fil YouTube qui passent sous les seuils de vues/spectateurs que vous fixez, et peut supprimer à la demande les bannières, les listes Mix et les Shorts. Pour l'essayer en trois étapes :

1. `npm ci`
2. `npm run build` (Chrome) ou `npm run build:firefox` (Firefox)
3. Chargez la build décompressée depuis `.output/chrome-mv3` (ou `.output/firefox-mv3`) — voir [Installation](#installation-end-users).

Vos réglages ne quittent jamais votre navigateur : TubeFilter demande uniquement la permission `storage` et l'accès à l'hôte `youtube.com`, et toute la configuration est conservée dans le stockage local du navigateur.

## Fonctionnalités

### Filtre par nombre de vues (vidéos classiques)

Une vidéo classique est filtrée lorsque **toutes** les conditions suivantes sont remplies :

- Le filtre de vidéos est activé (`enableVideoFilter`).
- Un nombre de vues a été correctement analysé depuis la carte.
- Le nombre de vues analysé est **inférieur** à votre seuil `minViews`.

Si une vidéo n'a aucun nombre de vues analysable, elle est laissée intacte. Le curseur **Min Views** du popup contrôle le seuil et est désactivé tant que le filtre de vidéos est désactivé.

### Filtre des directs (live streams)

Les directs sont évalués selon un seuil **distinct** — le nombre de spectateurs simultanés, et non le nombre total de vues. Un direct est filtré lorsque le filtre des directs est activé (`enableLiveFilter`), qu'un nombre de spectateurs a été analysé, et que ce nombre est **inférieur** à votre seuil `minConcurrent`. Le statut « en direct » est détecté à partir des badges « live now » du DOM ou à partir d'un texte indiquant un direct dans la chaîne du nombre de vues (voir [Fonctionnement](#live-detection)).

### Filtres de contenu (sans seuil)

Ces trois filtres sont de simples interrupteurs marche/arrêt — ils ignorent complètement le nombre de vues :

| Filtre | Réglage | Ce qu'il supprime |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | Publicités en bandeau promotionnel (masthead) et bannières d'annonce/promo. Lorsqu'une bannière correspondante se trouve à l'intérieur d'une section enrichie, toute la section parente est masquée. |
| **Mix Lists** | `enableMixFilter` | Playlists Mix / radio générées automatiquement. |
| **Shorts** | `enableShortsFilter` | Liens et étagères de Shorts. |

### Modes de filtrage : Masquer ou Opacité

Le sélecteur **Filter Mode** détermine comment les vidéos/directs filtrés sont traités :

- **Hide** — applique `display: none`, retirant complètement l'élément de la vue.
- **Opacity** — applique `opacity: 0.1`, atténuant l'élément à **10 %** d'opacité tout en le gardant visible. C'est le réglage par défaut.

> ℹ️ Le filtre Top Banner masque toujours les bannières (`display: none`) quel que soit le mode de filtrage sélectionné. Le mode de filtrage n'affecte que les vidéos et les directs.

### Ordre de priorité des filtres

Chaque carte est classée une seule fois, selon un ordre if/else fixe. Seule la règle de la première catégorie correspondante s'applique :

1. **Shorts** (priorité la plus élevée)
2. **Listes Mix**
3. **Directs**
4. **Vidéos classiques**

### Désactiver le doublage automatique (forcer l'audio d'origine)

Le doublage automatique de YouTube remplace l'audio d'une vidéo par une piste traduite par IA en fonction de la langue de votre interface — si bien qu'une vidéo en anglais est lue en japonais, en allemand, etc. par défaut. Avec **Force Original Audio** (`forceOriginalAudio`, **activé par défaut**), TubeFilter détecte la piste audio d'origine et bascule automatiquement le lecteur dessus sur chaque vidéo et chaque Short, annulant ainsi le doublage automatique.

- Fonctionne sur les vidéos `/watch` et les Shorts, réappliqué à chaque navigation au sein de l'application.
- La piste d'origine est identifiée **indépendamment de la langue** en décodant l'identifiant de piste audio du lecteur (les données de la piste d'origine contiennent `original` ; les pistes doublées contiennent `dubbed` / `dubbed-auto`).
- Implémenté via un **script du monde MAIN** injecté dans la page — l'API audio du lecteur YouTube n'est pas accessible depuis le monde isolé du content-script — avec le réglage relayé depuis le stockage de l'extension.
- Désactivez-le à tout moment dans le popup pour conserver l'audio doublé de YouTube.

### Détection multilingue du nombre de vues

YouTube affiche les nombres de vues et de spectateurs **de manière très différente selon la langue de la page** — non seulement des mots traduits, mais aussi des séparateurs décimaux/de milliers et des unités d'abréviation différents. Un même nombre d'environ 1,7 milliard apparaît ainsi :

| Langue | Chaîne YouTube |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

Le content script détecte automatiquement la **langue de la page YouTube** (`document.documentElement.lang`) et analyse les nombres avec le séparateur décimal, le séparateur de milliers et les unités d'abréviation corrects pour cette langue. C'est important car l'ancien analyseur supposait un format de type anglais et **lisait mal les langues à décimale-virgule** (`de` / `fr` / `ru` / `pt`) — par exemple en lisant `1,7 Mrd.` comme `1` ou `17` au lieu de `1 700 000 000`. L'analyse correcte selon la langue est prise en charge pour **9 langues** (voir [Internationalisation](#internationalization)) ; les langues de page inconnues retombent sur un analyseur générique permissif.

### Langues (interface du popup)

L'interface du popup est proposée en **9 langues** — English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文 — plus un mode **Auto (`auto`, par défaut)** qui suit la langue de l'interface du navigateur (`navigator.language`, mappée vers la langue prise en charge la plus proche, avec repli sur l'anglais). Une liste déroulante dans l'en-tête du popup permet de basculer entre elles.

## Captures d'écran

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## Navigateurs pris en charge

| Navigateur | Manifest | Remarques |
|---|---|---|
| **Chrome / Chromium** | MV3 | Cible de build par défaut ; Chrome utilise MV3 par défaut. |
| **Firefox** | MV3 | Le répertoire de sortie est `.output/firefox-mv3` ; MV3 est imposé via `manifestVersion: 3` dans `wxt.config.ts` (Firefox utiliserait sinon MV2 par défaut). |

> ℹ️ Le content script s'exécute sur `https://www.youtube.com/*` dans les deux navigateurs. La build Firefox embarque un `browser_specific_settings.gecko.id` valant `tube-filter@coil398.github.io` (requis pour AMO MV3, sans effet sur Chrome).

## Installation (utilisateurs finaux)

Pour la procédure complète et prise en charge de publication et d'installation, voir **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**.

Pour charger une build locale décompressée à des fins de test :

### Chrome / Chromium

1. Exécutez `npm run build` pour produire `.output/chrome-mv3`.
2. Ouvrez `chrome://extensions`.
3. Activez le **mode développeur** (en haut à droite).
4. Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le répertoire `.output/chrome-mv3`.

### Firefox

1. Exécutez `npm run build:firefox` pour produire `.output/firefox-mv3`.
2. Ouvrez `about:debugging`.
3. Allez dans **Ce Firefox** → **Charger un module complémentaire temporaire…**.
4. Sélectionnez n'importe quel fichier à l'intérieur du répertoire `.output/firefox-mv3` (par exemple son `manifest.json`).

## Utilisation

Ouvrez le popup de l'extension pour ajuster le filtrage. Les modifications sont enregistrées immédiatement et appliquées en direct à tout onglet YouTube ouvert — aucun rechargement requis.

### Référence des réglages

| Réglage | Ce qu'il contrôle | Plage / pas | Par défaut | Libellé JA | Libellé EN |
|---|---|---|---|---|---|
| `minViews` | Nombre minimal de vues en dessous duquel les vidéos classiques sont filtrées | plage `0`–`100000`, pas `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | Nombre minimal de spectateurs simultanés en dessous duquel les directs sont filtrés | plage `0`–`5000`, pas `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | Comment les vidéos/directs filtrés sont traités (`hide` / `opacity`) | sélecteur à deux boutons | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | Activer/désactiver le filtre par nombre de vues (active/désactive aussi le curseur Min Views) | interrupteur marche/arrêt | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | Activer/désactiver le filtre des directs (active/désactive aussi le curseur Min Concurrent) | interrupteur marche/arrêt | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | Masquer les bannières promotionnelles en haut de page | interrupteur marche/arrêt | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | Masquer les listes Mix | interrupteur marche/arrêt | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Masquer les Shorts | interrupteur marche/arrêt | `true` | ショート動画非表示 | Hide Shorts |
| `forceOriginalAudio` | Forcer la piste audio d'origine (annuler le doublage automatique) sur les pages de lecture et les Shorts | interrupteur marche/arrêt | `true` | 元の音声に固定 | Force Original Audio |
| `language` | Langue de l'interface du popup : `auto` + 9 langues (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`) ; **Auto** suit la langue de l'interface du navigateur (`navigator.language`) | liste déroulante | `auto` | Language | 言語 |

Les deux curseurs affichent leur valeur avec séparateurs de milliers via `toLocaleString()`. Une note d'aide se trouve sous le curseur Min Concurrent :

- JA : 視聴者数が少ないライブ配信はフィルタリングされます。
- EN : Live streams with fewer viewers will be filtered.

### Sélecteur de mode de filtrage

Un contrôle à deux boutons. **Hide** définit `filterMode = 'hide'` ; **Opacity** définit `filterMode = 'opacity'`. Le mode actif est mis en surbrillance. Les libellés sont localisés — JA : 非表示 / 薄く表示, EN : Hide / Opacity.

### Sélecteur de langue

Une liste déroulante dans l'en-tête du popup définit `language` sur `auto` ou l'une des 9 langues (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`). **Auto** (la valeur par défaut) résout la langue d'interface effective à partir de `navigator.language`, mappée vers la langue prise en charge la plus proche avec repli sur l'anglais. Sélectionner une langue spécifique fige l'interface sur celle-ci, indépendamment du réglage du navigateur.

## Fonctionnement

### Content script

- **Correspondance et timing** — correspond à `https://www.youtube.com/*` et s'exécute à `run_at: document_end`.
- **Détection de la langue de la page** — à chaque passe, il lit `document.documentElement.lang` (avec repli sur `navigator.language`, puis `'en'`) et l'utilise pour choisir un analyseur de nombre de vues correct selon la langue (voir [Internationalisation](#internationalization)).
- **Cibles** — analyse 7 sélecteurs de vidéos couvrant la page d'accueil (`ytd-rich-item-renderer`), la recherche (`ytd-video-renderer`), la barre latérale (`ytd-compact-video-renderer`), les chaînes (`ytd-grid-video-renderer`), les listes Mix (`ytd-radio-renderer`), les Shorts individuels (`ytd-reel-item-renderer`) et l'étagère de Shorts (`ytd-rich-shelf-renderer`) ; plus 9 sélecteurs de bannières (`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer`, et plusieurs variantes `ytd-rich-section-renderer > #content > …`).
- **Gestion du fil dynamique** — un `MutationObserver` surveille `document.body` avec `{ childList: true, subtree: true }`. Lorsque des nœuds sont ajoutés, il applique un anti-rebond avec un `setTimeout` de **500 ms** (en effaçant et réarmant le minuteur à chaque lot), de sorte que le filtre s'exécute 500 ms après la dernière rafale de nœuds ajoutés. Le filtre s'exécute aussi une fois au chargement initial et une fois juste après le chargement des réglages.

  > ℹ️ Il s'agit d'un anti-rebond par traîne (trailing debounce), et non d'un throttle fixe : sous des mutations continues, la passe est sans cesse reportée. (Le commentaire en ligne du code source lui-même, `// Run at most every 500ms`, décrit un throttling et est légèrement imprécis.)
- **Détection des Mix / Shorts** — les listes Mix sont détectées via `start_radio=1`, `list=RD`, le badge en surimpression `MIX` ou `ytd-radio-renderer` ; les Shorts via les liens `/shorts/`, le badge en surimpression `SHORTS`, `ytd-reel-item-renderer` et les étagères `ytd-rich-shelf-renderer`.
- **Masquage de la section parente d'une bannière** — lorsqu'une bannière correspondante a un ancêtre `closest('ytd-rich-section-renderer')`, toute la section parente est masquée plutôt que seulement la bannière interne.

<a id="live-detection"></a>

Le statut « en direct » est détecté à partir des badges du DOM (`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) ou à partir du texte du nombre de vues lui-même (contenant, sans tenir compte de la casse, `視聴中`, `watching`, `live` ou `ライブ`, plus les mots-clés de direct propres à la langue de page active — voir [Internationalisation](#internationalization)).

<a id="internationalization"></a>

### Internationalisation

YouTube formate les nombres de vues/spectateurs différemment dans chaque langue d'interface, c'est pourquoi l'analyse des nombres est pilotée par la **langue de page YouTube détectée**, et non par la langue de l'interface du popup. À chaque passe, le content script lit `document.documentElement.lang` (avec repli sur `navigator.language`, puis `'en'`), le normalise en un code de langue de base (par exemple `zh-Hans-CN` → `zh`, `es-419` → `es`), et sélectionne une spécification par langue décrivant le séparateur décimal, le séparateur de milliers, les unités d'abréviation (par exemple `K`/`M`/`B`, `万`/`億`, `Mio.`/`Mrd.`, `тыс.`/`млн`/`млрд`, `万`/`亿`), les mots de liaison « vues », les marqueurs de date/de direct passé, les mots de direct et les mots « aucune vue » → `0` de cette langue.

L'analyse correcte selon la langue est prise en charge pour **9 langues** :

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

Si la langue de la page n'est aucune de celles-ci, l'analyse retombe sur une **spécification générique permissive** qui utilise un `.` comme décimale et reconnaît, au mieux, une union d'unités courantes (`K`/`M`/`B` et les unités CJK/coréennes). Cette prise en compte des langues corrige les mauvaises lectures de l'ancien analyseur pour les langues à décimale-virgule (`de` / `fr` / `ru` / `pt`), où `1,7 Mrd.` était lu comme `1` ou `17` au lieu de `1 700 000 000`.

### Popup (React)

Un popup React 19 (`src/entrypoints/popup/`) affiche les curseurs, les interrupteurs, le sélecteur de mode de filtrage et le sélecteur de langue à trois états. Modifier n'importe quel contrôle écrit dans le stockage immédiatement. Le popup résout sa langue d'affichage effective à partir de `settings.language` : `auto` suit `navigator.language`, tandis que `ja` / `en` la figent.

### Stockage des réglages et synchronisation en direct

- Les réglages sont persistés dans `browser.storage.local` sous forme de **clés plates de premier niveau** — une clé par champ (`minViews`, `minConcurrent`, `filterMode`, …). Cela correspond à la forme `chrome.storage.local` d'avant WXT, de sorte que les utilisateurs existants conservent leurs réglages lors de la migration.
- `loadSettings()` appelle `browser.storage.local.get(defaultSettings)`, en fusionnant les valeurs stockées par-dessus les valeurs par défaut ; `saveSettings()` appelle `browser.storage.local.set(settings)`.
- `watchSettings()` enregistre un écouteur `browser.storage.onChanged`. À tout changement dans la zone `local`, il relit l'enregistrement complet des réglages et réexécute le filtre — c'est pourquoi les modifications du popup s'appliquent instantanément aux onglets ouverts.

Le type `Settings` comporte exactement 9 champs : `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language` (`'auto' | 'ja' | 'en'`, par défaut `'auto'`).

### Analyse du nombre de vues

`parseViewCount(text, lang)` résout la spécification de langue pour la langue de page donnée (ou la spécification générique lorsque la langue est inconnue/omise) et normalise les chaînes de nombres variées de YouTube en un nombre (ou `null`). Pour toutes les langues prises en charge, elle :

| Motif d'entrée | Traitement | Exemple |
|---|---|---|
| Unités d'abréviation (par langue) | multipliées par le facteur d'unité de la langue | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| Séparateurs décimaux / de milliers locaux | langues à décimale-virgule (`de`/`fr`/`ru`/`pt`) et langues à milliers-espace (`fr`/`ru`) analysées correctement | `129.069 Aufrufe` (de) → `129069` |
| Mots « aucune vue » (par exemple `No views`, `なし`, équivalents par langue) | renvoie `0` | `No views` → `0` |
| Nombres simples | séparateurs retirés selon la langue, puis analysés | `1,234` (en) → `1234` |
| Texte de date / de direct passé | traité comme « pas un nombre », la carte est donc laissée intacte | `2 days ago`, `〜前` |
| Non analysable | renvoie `null` (l'élément n'est pas filtré par les règles de nombre de vues) | — |

Avant l'analyse, les mots-clés « vues »/de liaison de la langue (par exemple `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`) sont retirés. Les espaces — y compris l'espace insécable (NBSP) et l'espace insécable étroit (narrow NBSP) tels qu'ils apparaissent dans les vraies chaînes YouTube — sont d'abord normalisés. Le helper `isLive(text, lang)` renvoie `true` (sans tenir compte de la casse) lorsque le texte contient un marqueur de direct universel (`視聴中`, `watching`, `live`, `ライブ`) ou l'un des mots de direct de la langue active.

## Limitations connues

> ⚠️ La journalisation de débogage dans `src/utils/filter.ts` est actuellement codée en dur sur activé (`const debug = true`), de sorte que le content script émet une sortie console verbeuse. Le log de résumé `FILTERED` est émis sans condition — il est en dehors de la garde `debug` — et apparaît donc même si l'indicateur est désactivé.

## Développement

### Prérequis

- **Node.js 20** (la version utilisée par la CI).
- npm (le dépôt fournit un `package-lock.json`).

### Installation

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### Scripts npm

| Script | Commande | Ce qu'il fait |
|---|---|---|
| `dev` | `wxt` | Démarre le serveur de développement WXT pour Chrome (cible par défaut) avec HMR. |
| `dev:firefox` | `wxt -b firefox` | Démarre le serveur de développement WXT ciblant Firefox. |
| `build` | `wxt build` | Build de production pour Chrome → `.output/chrome-mv3`. |
| `build:firefox` | `wxt build -b firefox` | Build de production pour Firefox → `.output/firefox-mv3`. |
| `zip` | `wxt zip` | Compile et empaquette l'extension Chrome dans un zip distribuable dans `.output/`. |
| `zip:firefox` | `wxt zip -b firefox` | Compile et empaquette le zip de l'extension Firefox dans `.output/`. |
| `compile` | `wxt prepare && tsc --noEmit` | Génère les types WXT, puis effectue la vérification de types sans émission. |
| `lint` | `eslint .` | Analyse l'ensemble du projet (configuration plate ESLint 9 dans `eslint.config.js`). |
| `test` | `tsx test-parser.ts` | Exécute les tests de l'analyseur de nombre de vues par langue (`test-parser.ts`), couvrant l'analyse des vues/spectateurs et la détection des directs pour les 9 langues prises en charge. |

> ℹ️ `postinstall` exécute automatiquement `wxt prepare` après `npm install` / `npm ci`.

Exécutez `npm test` après toute modification dans `src/utils/locales.ts` ou `src/utils/parser.ts` — il vérifie que de vraies chaînes de nombres YouTube (y compris les formes séparées par NBSP et à décimale-virgule) sont analysées vers les nombres attendus pour English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어 et 简体中文.

### Structure du projet

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

WXT est configuré avec `srcDir: 'src'` et `modules: ['@wxt-dev/module-react']`. La logique partagée est importée via l'alias `@/utils/...`. Le manifest déclare `permissions: ['storage']` et `host_permissions: ['https://www.youtube.com/*']`, avec `name: 'TubeFilter'` et la description « Filter YouTube videos based on views and other metrics. » `manifestVersion: 3` dans `wxt.config.ts` est l'unique source de vérité qui impose une sortie MV3 pour les deux cibles.

`tsconfig.json` étend le `./.wxt/tsconfig.json` généré par WXT et ajoute `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters` et `noFallthroughCasesInSwitch`.

## Build et publication

### Sorties de build

| Cible | Répertoire de sortie |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Artefacts zip

`wxt zip` empaquette la build dans `.output/` en utilisant le modèle de nom de fichier zip par défaut de WXT (`{{name}}-{{version}}-{{browser}}.zip`, où `{{name}}` est le nom `tube-filter` du `package.json`). Aucun modèle `zipFileName`/`sources` personnalisé n'est défini dans `wxt.config.ts`, de sorte que les noms ci-dessous suivent les valeurs par défaut de WXT :

- `tube-filter-<version>-chrome.zip` (par exemple `tube-filter-1.0.0-chrome.zip`) — confirmé par le glob d'upload du workflow de publication.
- `tube-filter-<version>-firefox.zip` (par exemple `tube-filter-1.0.0-firefox.zip`) — confirmé par le glob d'upload du workflow de publication.
- Un zip des sources pour la revue AMO (valeur par défaut de WXT pour la cible Firefox, typiquement `tube-filter-<version>-sources.zip`). Ce nom est la valeur par défaut de WXT et n'est référencé par aucun code du dépôt ; exécutez `npm run zip:firefox` pour confirmer le nom de fichier exact dans votre environnement.

### Workflow de publication GitHub Actions

`.github/workflows/release.yml` (nommé **Release**) se déclenche sur l'événement GitHub `release` avec `types: [published]` et dispose de `permissions: contents: write`. Le job s'exécute sur `ubuntu-latest` et :

1. Récupère le code (`actions/checkout@v4`).
2. Configure **Node.js 20** avec le cache npm (`actions/setup-node@v4`).
3. Exécute `npm ci` (dont le `postinstall` exécute `wxt prepare`).
4. Exécute `npm run zip` (Chrome) et `npm run zip:firefox` (Firefox), produisant les deux zips de navigateur.
5. Les téléverse comme assets de publication via `softprops/action-gh-release@v2` (protégé par `startsWith(github.ref, 'refs/tags/')`), correspondant à `.output/tube-filter-*-chrome.zip` et `.output/tube-filter-*-firefox.zip`.

## Pile technique

| Technologie | Version |
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

Le paquet est `tube-filter` v`1.0.0` (`private`, ESM `"type": "module"`) ; le nom d'affichage de l'extension est remplacé par **TubeFilter** dans `wxt.config.ts`.

## Contribuer

Les contributions sont les bienvenues. Avant d'ouvrir une PR :

1. `npm ci` pour installer les dépendances (cela génère aussi les types WXT).
2. `npm run lint` pour vérifier le code avec ESLint.
3. `npm run compile` pour la vérification de types (`wxt prepare && tsc --noEmit`).
4. `npm test` pour exécuter les tests de l'analyseur par langue (en particulier après avoir touché à `src/utils/locales.ts` ou `src/utils/parser.ts`).
5. Testez vos modifications sur les deux cibles avec `npm run dev` et `npm run dev:firefox`.

## Licence

Aucune licence n'a été spécifiée pour ce projet, et aucun fichier `LICENSE` n'est présent dans le dépôt. En l'absence de licence explicite, le code est par défaut **tous droits réservés** — vous n'avez pas la permission de le réutiliser, de le redistribuer ni de le modifier. Si vous comptez l'ouvrir, ajoutez un fichier `LICENSE` déclarant les conditions.
