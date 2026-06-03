# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** est une extension Manifest V3 multi-navigateurs qui nettoie votre fil YouTube en filtrant le contenu selon des seuils de nombre de vues et de spectateurs en direct que vous contrôlez. Elle atténue ou masque les vidéos à faible nombre de vues et les diffusions en direct à faible audience, et peut indépendamment supprimer les bannières promotionnelles en haut de page, les listes Mix et les Shorts. Les paramètres se trouvent dans un popup React, s'appliquent instantanément aux onglets YouTube ouverts sans rechargement, et l'interface du popup est disponible en japonais et en anglais (ainsi qu'un mode **Auto** qui suit la langue de votre navigateur). Les nombres de vues et de spectateurs sont analysés en tenant compte des conventions locales sur **9 langues de page YouTube**.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **Statut :** v1.0.0 — pas encore publiée sur le Chrome Web Store ni sur AMO. Installez-la via une build locale décompressée (voir [Installation](#installation-end-users)).

## En un coup d'œil

TubeFilter masque ou atténue les éléments du fil YouTube qui se situent en dessous des seuils de vues/spectateurs que vous définissez, et peut supprimer à la demande les bannières, les listes Mix et les Shorts. Pour l'essayer en trois étapes :

1. `npm ci`
2. `npm run build` (Chrome) ou `npm run build:firefox` (Firefox)
3. Chargez la build décompressée depuis `.output/chrome-mv3` (ou `.output/firefox-mv3`) — voir [Installation](#installation-end-users).

Vos paramètres ne quittent jamais votre navigateur : TubeFilter ne demande que l'accès `storage` et l'accès hôte à `youtube.com`, et toute la configuration est conservée dans le stockage local du navigateur.

## Fonctionnalités

### Filtre par nombre de vues (vidéos classiques)

Une vidéo classique est filtrée lorsque **toutes** les conditions suivantes sont réunies :

- Le filtre vidéo est activé (`enableVideoFilter`).
- Un nombre de vues a été analysé avec succès depuis la vignette.
- Le nombre de vues analysé est **inférieur** à votre seuil `minViews`.

Si une vidéo n'a aucun nombre de vues analysable, elle est laissée intacte. Le curseur **Min Views** du popup contrôle le seuil et est désactivé lorsque le filtre vidéo est désactivé.

### Filtre Live (diffusions en direct)

Les diffusions en direct sont évaluées par rapport à un seuil **distinct** — le nombre de spectateurs simultanés, et non le total des vues. Une diffusion en direct est filtrée lorsque le filtre Live est activé (`enableLiveFilter`), qu'un nombre de spectateurs a été analysé et que ce nombre est **inférieur** à votre seuil `minConcurrent`. Le statut en direct est détecté à partir des badges « live » du DOM ou d'un texte indiquant le direct dans la chaîne du nombre de vues (voir [Fonctionnement](#live-detection)).

### Filtres de contenu (sans seuil)

Ces trois filtres sont des interrupteurs marche/arrêt inconditionnels — ils ignorent entièrement le nombre de vues :

| Filtre | Paramètre | Ce qu'il supprime |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | Bannières publicitaires de tête de page (masthead) et bannières de déclaration/promotion. Lorsqu'une bannière correspondante se trouve à l'intérieur d'une section enrichie, toute la section parente est masquée. |
| **Mix Lists** | `enableMixFilter` | Playlists Mix / radio générées automatiquement. |
| **Shorts** | `enableShortsFilter` | Liens et étagères Shorts. |

### Modes de filtrage : Masquer ou Opacité

Le sélecteur **Filter Mode** détermine comment les vidéos/diffusions en direct filtrées sont traitées :

- **Hide** — applique `display: none`, retirant complètement l'élément de la vue.
- **Opacity** — applique `opacity: 0.1`, atténuant l'élément à **10 %** d'opacité tout en le gardant visible. C'est le mode par défaut.

> ℹ️ Le filtre Top Banner masque toujours les bannières (`display: none`), quel que soit le mode de filtrage sélectionné. Le mode de filtrage n'affecte que les vidéos et les diffusions en direct.

### Priorité des filtres

Chaque vignette est classée une seule fois, selon un ordre if/else fixe. Seule la règle de la première catégorie correspondante s'applique :

1. **Shorts** (priorité la plus élevée)
2. **Listes Mix**
3. **Diffusions en direct**
4. **Vidéos classiques**

### Détection multilingue du nombre de vues

YouTube affiche les nombres de vues et de spectateurs **très différemment selon la langue de la page** — pas seulement des mots traduits, mais aussi des séparateurs décimaux/de milliers et des unités d'abréviation différents. Le même nombre d'environ 1,7 milliard apparaît ainsi :

| Langue | Chaîne YouTube |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

Le content script détecte automatiquement la **langue de la page YouTube** (`document.documentElement.lang`) et analyse les nombres avec le séparateur décimal, le séparateur de milliers et les unités d'abréviation corrects pour cette langue. C'est important car l'ancien analyseur supposait un format de style anglais et **interprétait mal les langues à décimale-virgule** (`de` / `fr` / `ru` / `pt`) — par exemple en lisant `1,7 Mrd.` comme `1` ou `17` au lieu de `1 700 000 000`. L'analyse adaptée à la langue locale est prise en charge pour **9 langues** (voir [Internationalisation](#internationalization)) ; les langues de page inconnues retombent sur un analyseur générique permissif.

### Langues (interface du popup)

L'interface du popup est proposée en **japonais (`ja`)** et en **anglais (`en`)**, avec un troisième mode **Auto (`auto`, par défaut)** qui suit la langue de l'interface du navigateur (`navigator.language`) : si la langue du navigateur commence par `ja`, l'interface s'affiche en japonais, sinon en anglais. Un contrôle à trois boutons dans l'en-tête du popup (`Auto` / `日本語` / `EN`) permet de basculer entre eux, le choix actif étant mis en évidence.

## Captures d'écran

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## Navigateurs pris en charge

| Navigateur | Manifest | Remarques |
|---|---|---|
| **Chrome / Chromium** | MV3 | Cible de build par défaut ; Chrome est en MV3 par défaut. |
| **Firefox** | MV3 | Le répertoire de sortie est `.output/firefox-mv3` ; MV3 est forcé via `manifestVersion: 3` dans `wxt.config.ts` (Firefox utiliserait sinon MV2 par défaut). |

> ℹ️ Le content script s'exécute sur `https://www.youtube.com/*` dans les deux navigateurs. La build Firefox embarque un `browser_specific_settings.gecko.id` égal à `tube-filter@coil398.github.io` (requis pour AMO en MV3, sans effet sur Chrome).

## Installation (utilisateurs finaux)

Pour le parcours complet et pris en charge de publication et d'installation, voir **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**.

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

Ouvrez le popup de l'extension pour ajuster le filtrage. Les modifications sont enregistrées immédiatement et appliquées en direct à tout onglet YouTube ouvert — aucun rechargement nécessaire.

### Référence des paramètres

| Paramètre | Ce qu'il contrôle | Plage / pas | Par défaut | Libellé JA | Libellé EN |
|---|---|---|---|---|---|
| `minViews` | Nombre de vues minimal en dessous duquel les vidéos classiques sont filtrées | plage `0`–`100000`, pas `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | Nombre minimal de spectateurs simultanés en dessous duquel les diffusions en direct sont filtrées | plage `0`–`5000`, pas `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | Comment les vidéos/diffusions en direct filtrées sont traitées (`hide` / `opacity`) | sélecteur à deux boutons | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | Active/désactive le filtre par nombre de vues (active/désactive aussi le curseur Min Views) | interrupteur marche/arrêt | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | Active/désactive le filtre Live (active/désactive aussi le curseur Min Concurrent) | interrupteur marche/arrêt | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | Masque les bannières promotionnelles en haut de page | interrupteur marche/arrêt | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | Masque les listes Mix | interrupteur marche/arrêt | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Masque les Shorts | interrupteur marche/arrêt | `true` | ショート動画非表示 | Hide Shorts |
| `language` | Langue de l'interface du popup (`auto` / `ja` / `en`) ; **Auto** suit la langue de l'interface du navigateur (`navigator.language`) | sélecteur à trois boutons (`Auto` / `日本語` / `EN`) | `auto` | Language | 言語 |

Les deux curseurs affichent leur valeur avec un séparateur de milliers via `toLocaleString()`. Une note d'aide figure sous le curseur Min Concurrent :

- JA : 視聴者数が少ないライブ配信はフィルタリングされます。
- EN : Live streams with fewer viewers will be filtered.

### Sélecteur de mode de filtrage

Un contrôle à deux boutons. **Hide** définit `filterMode = 'hide'` ; **Opacity** définit `filterMode = 'opacity'`. Le mode actif est mis en évidence. Les libellés sont localisés — JA : 非表示 / 薄く表示, EN : Hide / Opacity.

### Sélecteur de langue

Un contrôle à trois boutons dans l'en-tête du popup règle `language` sur l'une des valeurs `auto`, `ja` ou `en`. Les boutons affichent **Auto** / **日本語** / **EN**, et le choix actif est mis en évidence. **Auto** (la valeur par défaut) résout la langue effective de l'interface à partir de `navigator.language` : une langue de navigateur commençant par `ja` affiche l'interface en japonais, toute autre l'affiche en anglais. Sélectionner **日本語** ou **EN** fixe l'interface sur cette langue indépendamment du réglage du navigateur.

## Fonctionnement

### Content script

- **Correspondance et timing** — correspond à `https://www.youtube.com/*` et s'exécute à `run_at: document_end`.
- **Détection de la langue de la page** — à chaque passage, il lit `document.documentElement.lang` (avec repli sur `navigator.language`, puis `'en'`) et l'utilise pour choisir un analyseur de nombre de vues adapté à la langue locale (voir [Internationalisation](#internationalization)).
- **Cibles** — analyse 7 sélecteurs de vidéos couvrant l'Accueil (`ytd-rich-item-renderer`), la Recherche (`ytd-video-renderer`), la Barre latérale (`ytd-compact-video-renderer`), la Chaîne (`ytd-grid-video-renderer`), les listes Mix (`ytd-radio-renderer`), les Shorts individuels (`ytd-reel-item-renderer`) et l'étagère Shorts (`ytd-rich-shelf-renderer`) ; plus 9 sélecteurs de bannières (`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer` et plusieurs variantes `ytd-rich-section-renderer > #content > …`).
- **Gestion du fil dynamique** — un `MutationObserver` surveille `document.body` avec `{ childList: true, subtree: true }`. Lorsque des nœuds sont ajoutés, il applique un debounce avec un `setTimeout` de **500 ms** (en effaçant et réarmant le minuteur à chaque lot), de sorte que le filtre s'exécute 500 ms après la dernière rafale de nœuds ajoutés. Le filtre s'exécute également une fois au chargement initial et une fois juste après le chargement des paramètres.

  > ℹ️ Il s'agit d'un debounce de fin (trailing), pas d'un throttle fixe : sous des mutations continues, le passage est sans cesse reporté. (Le commentaire en ligne du code source lui-même, `// Run at most every 500ms`, décrit un throttling et est légèrement imprécis.)
- **Détection Mix / Shorts** — les listes Mix sont identifiées via `start_radio=1`, `list=RD`, le badge superposé `MIX` ou `ytd-radio-renderer` ; les Shorts via les liens `/shorts/`, le badge superposé `SHORTS`, `ytd-reel-item-renderer` et les étagères `ytd-rich-shelf-renderer`.
- **Masquage de la section parente d'une bannière** — lorsqu'une bannière correspondante possède un ancêtre `closest('ytd-rich-section-renderer')`, toute la section parente est masquée plutôt que seulement la bannière interne.

<a id="live-detection"></a>

Le statut en direct est détecté à partir des badges du DOM (`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) ou du texte du nombre de vues lui-même (contenant, sans tenir compte de la casse, `視聴中`, `watching`, `live` ou `ライブ`, plus les mots-clés « live » propres à la langue locale active de la page — voir [Internationalisation](#internationalization)).

<a id="internationalization"></a>

### Internationalisation

YouTube formate les nombres de vues/spectateurs différemment dans chaque langue d'interface, c'est pourquoi l'analyse des nombres est pilotée par la **langue de page YouTube détectée**, et non par la langue de l'interface du popup. À chaque passage, le content script lit `document.documentElement.lang` (avec repli sur `navigator.language`, puis `'en'`), le normalise en un code de langue de base (par exemple `zh-Hans-CN` → `zh`, `es-419` → `es`) et sélectionne une spécification par langue locale décrivant le séparateur décimal de cette langue, son séparateur de milliers, ses unités d'abréviation (par exemple `K`/`M`/`B`, `万`/`億`, `Mio.`/`Mrd.`, `тыс.`/`млн`/`млрд`, `万`/`亿`), les mots de liaison « vues », les marqueurs de date/diffusion passée, les mots de diffusion en direct, et les mots « aucune vue » → `0`.

L'analyse adaptée à la langue locale est prise en charge pour **9 langues** :

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

Si la langue de la page n'est aucune de celles-ci, l'analyse retombe sur une **spécification générique permissive** qui utilise un `.` comme décimale et reconnaît au mieux une union d'unités courantes (`K`/`M`/`B` et les unités CJK/coréennes). Cette prise en compte des langues locales corrige les erreurs de lecture de l'ancien analyseur sur les langues à décimale-virgule (`de` / `fr` / `ru` / `pt`), où `1,7 Mrd.` était lu comme `1` ou `17` au lieu de `1 700 000 000`.

### Popup (React)

Un popup React 19 (`src/entrypoints/popup/`) affiche les curseurs, les interrupteurs, le sélecteur de mode de filtrage et le sélecteur de langue à trois choix. La modification de n'importe quel contrôle écrit immédiatement dans le stockage. Le popup résout sa langue d'affichage effective à partir de `settings.language` : `auto` suit `navigator.language`, tandis que `ja` / `en` la fixent.

### Stockage des paramètres et synchronisation en direct

- Les paramètres sont persistés dans `browser.storage.local` sous forme de **clés plates de premier niveau** — une clé par champ (`minViews`, `minConcurrent`, `filterMode`, …). Cela correspond à la forme `chrome.storage.local` d'avant WXT, de sorte que les utilisateurs existants conservent leurs paramètres lors de la migration.
- `loadSettings()` appelle `browser.storage.local.get(defaultSettings)`, en fusionnant les valeurs stockées par-dessus les valeurs par défaut ; `saveSettings()` appelle `browser.storage.local.set(settings)`.
- `watchSettings()` enregistre un écouteur `browser.storage.onChanged`. À tout changement dans la zone `local`, il relit l'enregistrement complet des paramètres et réexécute le filtre — c'est pourquoi les modifications du popup s'appliquent instantanément aux onglets ouverts.

Le type `Settings` comporte exactement 9 champs : `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language` (`'auto' | 'ja' | 'en'`, par défaut `'auto'`).

### Analyse du nombre de vues

`parseViewCount(text, lang)` résout la spécification locale pour la langue de page donnée (ou la spécification générique lorsque la langue est inconnue/omise) et normalise les diverses chaînes de nombre de vues de YouTube en un nombre (ou `null`). Sur l'ensemble des langues locales prises en charge, elle :

| Motif d'entrée | Traitement | Exemple |
|---|---|---|
| Unités d'abréviation (par langue locale) | multipliées par le facteur d'unité de la langue locale | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| Séparateurs décimaux / de milliers locaux | les langues à décimale-virgule (`de`/`fr`/`ru`/`pt`) et les langues à espace pour les milliers (`fr`/`ru`) sont analysées correctement | `129.069 Aufrufe` (de) → `129069` |
| Mots « aucune vue » (par exemple `No views`, `なし`, équivalents locaux) | renvoie `0` | `No views` → `0` |
| Nombres simples | séparateurs retirés selon la langue locale, puis analysés | `1,234` (en) → `1234` |
| Texte de date / diffusion passée | traité comme « pas un nombre » de sorte que la vignette est laissée intacte | `2 days ago`, `〜前` |
| Non analysable | renvoie `null` (élément non filtré par les règles de nombre de vues) | — |

Avant l'analyse, les mots-clés « vues »/de liaison de la langue locale (par exemple `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`) sont retirés. Les espaces — y compris l'espace insécable (NBSP) et l'espace insécable étroit (narrow-NBSP) tels qu'ils apparaissent dans les vraies chaînes YouTube — sont normalisés en premier. L'assistant `isLive(text, lang)` renvoie `true` (sans tenir compte de la casse) lorsque le texte contient un marqueur de direct universel (`視聴中`, `watching`, `live`, `ライブ`) ou l'un des mots de diffusion en direct de la langue locale active.

## Limitations connues

> ⚠️ La journalisation de débogage dans `src/utils/filter.ts` est actuellement activée en dur (`const debug = true`), de sorte que le content script émet une sortie console verbeuse. Le log récapitulatif `FILTERED` est émis de manière inconditionnelle — il est en dehors de la garde `debug` — il apparaît donc même si le drapeau est désactivé.

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
| `compile` | `wxt prepare && tsc --noEmit` | Génère les types WXT, puis vérifie les types sans émettre. |
| `lint` | `eslint .` | Analyse l'ensemble du projet (configuration plate ESLint 9 dans `eslint.config.js`). |
| `test` | `tsx test-parser.ts` | Exécute les tests de l'analyseur de nombre de vues par langue locale (`test-parser.ts`), couvrant l'analyse des vues/spectateurs et la détection du direct dans les 9 langues prises en charge. |

> ℹ️ `postinstall` exécute automatiquement `wxt prepare` après `npm install` / `npm ci`.

Exécutez `npm test` après avoir modifié quoi que ce soit dans `src/utils/locales.ts` ou `src/utils/parser.ts` — il vérifie que de vraies chaînes de nombre YouTube (y compris les formes séparées par NBSP et à décimale-virgule) sont analysées vers les nombres attendus pour English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어 et 简体中文.

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

WXT est configuré avec `srcDir: 'src'` et `modules: ['@wxt-dev/module-react']`. La logique partagée est importée via l'alias `@/utils/...`. Le manifest déclare `permissions: ['storage']` et `host_permissions: ['https://www.youtube.com/*']`, avec `name: 'TubeFilter'` et la description « Filter YouTube videos based on views and other metrics. » `manifestVersion: 3` dans `wxt.config.ts` est la source de vérité unique qui force la sortie MV3 pour les deux cibles.

`tsconfig.json` étend le `./.wxt/tsconfig.json` généré par WXT et ajoute `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters` et `noFallthroughCasesInSwitch`.

## Build et publication

### Sorties de build

| Cible | Répertoire de sortie |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Artéfacts zip

`wxt zip` empaquette la build dans `.output/` en utilisant le modèle de nom de fichier zip par défaut de WXT (`{{name}}-{{version}}-{{browser}}.zip`, où `{{name}}` est le nom `package.json` `tube-filter`). Aucun modèle personnalisé `zipFileName`/`sources` n'est défini dans `wxt.config.ts`, les noms ci-dessous suivent donc les valeurs par défaut de WXT :

- `tube-filter-<version>-chrome.zip` (par exemple `tube-filter-1.0.0-chrome.zip`) — confirmé par le glob d'upload du workflow de publication.
- `tube-filter-<version>-firefox.zip` (par exemple `tube-filter-1.0.0-firefox.zip`) — confirmé par le glob d'upload du workflow de publication.
- Un zip des sources pour la revue AMO (la valeur par défaut de WXT pour la cible Firefox, typiquement `tube-filter-<version>-sources.zip`). Ce nom est la valeur par défaut de WXT et n'est référencé par aucun code du dépôt ; exécutez `npm run zip:firefox` pour confirmer le nom de fichier exact dans votre environnement.

### Workflow de publication GitHub Actions

`.github/workflows/release.yml` (nommé **Release**) se déclenche sur l'événement GitHub `release` avec `types: [published]` et possède `permissions: contents: write`. Le job s'exécute sur `ubuntu-latest` et :

1. Récupère le code (`actions/checkout@v4`).
2. Configure **Node.js 20** avec le cache npm (`actions/setup-node@v4`).
3. Exécute `npm ci` (dont le `postinstall` exécute `wxt prepare`).
4. Exécute `npm run zip` (Chrome) et `npm run zip:firefox` (Firefox), produisant les deux zips de navigateurs.
5. Les téléverse en tant qu'assets de publication via `softprops/action-gh-release@v2` (protégé par `startsWith(github.ref, 'refs/tags/')`), en faisant correspondre `.output/tube-filter-*-chrome.zip` et `.output/tube-filter-*-firefox.zip`.

## Stack technique

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
3. `npm run compile` pour vérifier les types (`wxt prepare && tsc --noEmit`).
4. `npm test` pour exécuter les tests de l'analyseur par langue locale (surtout après avoir touché à `src/utils/locales.ts` ou `src/utils/parser.ts`).
5. Testez vos modifications sur les deux cibles avec `npm run dev` et `npm run dev:firefox`.

## Licence

Aucune licence n'a été spécifiée pour ce projet, et aucun fichier `LICENSE` n'est présent dans le dépôt. En l'absence de licence explicite, le code est par défaut soumis à **tous droits réservés** — vous n'avez pas la permission de le réutiliser, de le redistribuer ni de le modifier. Si vous comptez l'ouvrir, ajoutez un fichier `LICENSE` déclarant les conditions.
