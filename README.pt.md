# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** é uma extensão multiplataforma Manifest V3 que organiza seu feed do YouTube, filtrando o conteúdo de acordo com limites de contagem de visualizações e de espectadores ao vivo que você controla. Ela esmaece ou oculta vídeos com poucas visualizações e transmissões ao vivo com poucos espectadores, e pode, de forma independente, remover banners promocionais no topo, listas de Mixes e Shorts. As configurações ficam em um popup React, são aplicadas instantaneamente às abas abertas do YouTube sem recarregar, e a interface do popup está disponível em **9 idiomas** (English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文), com um modo **Auto** que segue o idioma do seu navegador. As contagens de visualizações/espectadores são interpretadas levando em conta o idioma, nos mesmos **9 idiomas de página do YouTube**.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **Status:** v1.0.0 — ainda não publicado na Chrome Web Store nem na AMO. Instale por meio de um build local descompactado (veja [Instalação](#installation-end-users)).

## Visão geral

O TubeFilter oculta ou esmaece itens do feed do YouTube que fiquem abaixo dos limites de visualizações/espectadores que você definir, e pode remover banners, listas de Mixes e Shorts sob demanda. Para experimentar em três passos:

1. `npm ci`
2. `npm run build` (Chrome) ou `npm run build:firefox` (Firefox)
3. Carregue o build descompactado a partir de `.output/chrome-mv3` (ou `.output/firefox-mv3`) — veja [Instalação](#installation-end-users).

Suas configurações nunca saem do seu navegador: o TubeFilter solicita apenas `storage` e acesso ao host `youtube.com`, e toda a configuração é mantida no armazenamento local do navegador.

## Funcionalidades

### Filtro por contagem de visualizações (vídeos comuns)

Um vídeo comum é filtrado quando **todas** as condições a seguir são verdadeiras:

- O filtro de vídeos está ativado (`enableVideoFilter`).
- Uma contagem de visualizações foi interpretada com sucesso a partir do card.
- A contagem de visualizações interpretada está **abaixo** do seu limite `minViews`.

Se um vídeo não tiver uma contagem de visualizações interpretável, ele é deixado intacto. O controle deslizante **Min Views** do popup controla o limite e fica desabilitado enquanto o filtro de vídeos está desativado.

### Filtro de transmissões ao vivo (lives)

As transmissões ao vivo são avaliadas em relação a um limite **separado** — espectadores simultâneos, não visualizações totais. Uma transmissão ao vivo é filtrada quando o filtro de lives está ativado (`enableLiveFilter`), uma contagem de espectadores foi interpretada e essa contagem está **abaixo** do seu limite `minConcurrent`. O status de transmissão ao vivo é detectado a partir de selos "ao vivo agora" no DOM ou de texto indicativo de transmissão ao vivo na string de contagem de visualizações (veja [Como funciona](#live-detection)).

### Filtros de conteúdo (sem limite)

Esses três filtros são interruptores incondicionais de liga/desliga — eles ignoram completamente as contagens de visualizações:

| Filtro | Configuração | O que remove |
|---|---|---|
| **Banner do topo** | `enableBannerFilter` | Anúncios de masthead promocionais e banners de declaração/promoção. Quando um banner correspondente fica dentro de uma seção rica, toda a seção pai é ocultada. |
| **Listas de Mixes** | `enableMixFilter` | Playlists de Mix / rádio geradas automaticamente. |
| **Shorts** | `enableShortsFilter` | Links e prateleiras de Shorts. |

### Modos de filtro: Ocultar vs. Opacidade

O seletor **Filter Mode** decide como os vídeos/transmissões ao vivo filtrados são tratados:

- **Hide** — define `display: none`, removendo o elemento completamente da visualização.
- **Opacity** — define `opacity: 0.1`, esmaecendo o elemento para **10%** de opacidade enquanto o mantém visível. Este é o padrão.

> ℹ️ O filtro de Banner do topo sempre oculta os banners (`display: none`), independentemente do modo de filtro selecionado. O modo de filtro afeta apenas vídeos e transmissões ao vivo.

### Precedência dos filtros

Cada card é classificado uma única vez, usando uma ordem fixa de if/else. Apenas a regra da primeira categoria correspondente é aplicada:

1. **Shorts** (maior prioridade)
2. **Listas de Mixes**
3. **Transmissões ao vivo**
4. **Vídeos comuns**

### Desativar a dublagem automática (forçar o áudio original)

A dublagem automática do YouTube substitui o áudio de um vídeo por uma faixa traduzida por IA com base no idioma da sua interface — assim, um vídeo em inglês é reproduzido em japonês, alemão etc. por padrão. Com **Force Original Audio** (`forceOriginalAudio`, **ativado por padrão**), o TubeFilter detecta a faixa de áudio original e alterna o player para ela automaticamente em todo vídeo e Short, desfazendo a dublagem automática.

- Funciona em vídeos `/watch` e Shorts, reaplicado a cada navegação dentro do app.
- A faixa original é identificada de forma **independente de idioma**, decodificando o id da faixa de áudio do player (os dados da faixa original contêm `original`; faixas dubladas contêm `dubbed` / `dubbed-auto`).
- Implementado por meio de um **script no MAIN-world** injetado na página — a API de áudio do player do YouTube não é acessível a partir do mundo isolado do content-script — com a configuração interligada ao armazenamento da extensão.
- Desative-o a qualquer momento no popup para manter o áudio dublado do YouTube.

### Detecção de contagem de visualizações em vários idiomas

O YouTube renderiza as contagens de visualizações e de espectadores **de forma muito diferente em cada idioma de página** — não apenas palavras traduzidas, mas separadores decimais/de milhar e unidades de abreviação diferentes. A mesma contagem de ~1,7 bilhão aparece como:

| Idioma | String do YouTube |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

O content script detecta automaticamente o **idioma de página do YouTube** (`document.documentElement.lang`) e interpreta as contagens com o separador decimal, o separador de milhar e as unidades de abreviação corretas para aquela localidade. Isso importa porque o interpretador anterior assumia um formato no estilo inglês e **interpretava incorretamente as localidades com vírgula decimal** (`de` / `fr` / `ru` / `pt`) — por exemplo, lendo `1,7 Mrd.` como `1` ou `17` em vez de `1.700.000.000`. A interpretação correta por localidade é suportada para **9 idiomas** (veja [Internacionalização](#internationalization)); idiomas de página desconhecidos recorrem a um interpretador genérico permissivo.

### Idiomas (interface do popup)

A interface do popup é oferecida em **9 idiomas** — English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文 — além de um modo **Auto (`auto`, padrão)** que segue o idioma da interface do navegador (`navigator.language`, mapeado para a localidade suportada mais próxima, recorrendo ao inglês). Um menu suspenso no cabeçalho do popup alterna entre eles.

## Capturas de tela

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## Navegadores suportados

| Navegador | Manifest | Observações |
|---|---|---|
| **Chrome / Chromium** | MV3 | Alvo de build padrão; o Chrome usa MV3 por padrão. |
| **Firefox** | MV3 | O diretório de saída é `.output/firefox-mv3`; o MV3 é forçado por meio de `manifestVersion: 3` em `wxt.config.ts` (caso contrário, o Firefox usaria MV2 por padrão). |

> ℹ️ O content script é executado em `https://www.youtube.com/*` em ambos os navegadores. O build do Firefox carrega um `browser_specific_settings.gecko.id` de `tube-filter@coil398.github.io` (exigido para MV3 na AMO, inofensivo no Chrome).

## Instalação (usuários finais)

Para o passo a passo completo e suportado de lançamento e instalação, veja **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**.

Para carregar um build local descompactado para testes:

### Chrome / Chromium

1. Execute `npm run build` para produzir `.output/chrome-mv3`.
2. Abra `chrome://extensions`.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione o diretório `.output/chrome-mv3`.

### Firefox

1. Execute `npm run build:firefox` para produzir `.output/firefox-mv3`.
2. Abra `about:debugging`.
3. Vá em **Este Firefox** → **Carregar extensão temporária…**.
4. Selecione qualquer arquivo dentro do diretório `.output/firefox-mv3` (por exemplo, o `manifest.json` dele).

## Uso

Abra o popup da extensão para ajustar a filtragem. As alterações são salvas imediatamente e aplicadas ao vivo a qualquer aba do YouTube aberta — sem necessidade de recarregar.

### Referência de configurações

| Configuração | O que controla | Faixa / passo | Padrão | JA label | EN label |
|---|---|---|---|---|---|
| `minViews` | Contagem mínima de visualizações abaixo da qual os vídeos comuns são filtrados | faixa `0`–`100000`, passo `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | Contagem mínima de espectadores simultâneos abaixo da qual as transmissões ao vivo são filtradas | faixa `0`–`5000`, passo `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | Como os vídeos/transmissões ao vivo filtrados são tratados (`hide` / `opacity`) | seletor de dois botões | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | Ativa/desativa o filtro por contagem de visualizações (também ativa/desativa o controle deslizante Min Views) | interruptor liga/desliga | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | Ativa/desativa o filtro de lives (também ativa/desativa o controle deslizante Min Concurrent) | interruptor liga/desliga | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | Oculta banners promocionais no topo | interruptor liga/desliga | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | Oculta listas de Mixes | interruptor liga/desliga | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Oculta Shorts | interruptor liga/desliga | `true` | ショート動画非表示 | Hide Shorts |
| `forceOriginalAudio` | Força a faixa de áudio original (desfaz a dublagem automática) nas páginas de reprodução e nos Shorts | interruptor liga/desliga | `true` | 元の音声に固定 | Force Original Audio |
| `language` | Idioma da interface do popup: `auto` + 9 localidades (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`); **Auto** segue o idioma da interface do navegador (`navigator.language`) | seletor suspenso | `auto` | Language | 言語 |

Ambos os controles deslizantes exibem seu valor com separadores de milhar via `toLocaleString()`. Uma nota de ajuda fica abaixo do controle deslizante Min Concurrent:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### Seletor de modo de filtro

Um controle de dois botões. **Hide** define `filterMode = 'hide'`; **Opacity** define `filterMode = 'opacity'`. O modo ativo é destacado. Os rótulos são localizados — JA: 非表示 / 薄く表示, EN: Hide / Opacity.

### Seletor de idioma

Um menu suspenso no cabeçalho do popup define `language` como `auto` ou uma das 9 localidades (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`). **Auto** (o padrão) resolve o idioma efetivo da interface a partir de `navigator.language`, mapeado para a localidade suportada mais próxima e recorrendo ao inglês. Selecionar um idioma específico fixa a interface nele, independentemente da configuração do navegador.

## Como funciona

### Content script

- **Correspondência e timing** — corresponde a `https://www.youtube.com/*` e é executado em `run_at: document_end`.
- **Detecção do idioma da página** — em cada passada, ele lê `document.documentElement.lang` (recorrendo a `navigator.language` e, depois, a `'en'`) e o usa para escolher um interpretador de contagem de visualizações correto para a localidade (veja [Internacionalização](#internationalization)).
- **Alvos** — varre 7 seletores de vídeo cobrindo a Página inicial (`ytd-rich-item-renderer`), a Pesquisa (`ytd-video-renderer`), a Barra lateral (`ytd-compact-video-renderer`), o Canal (`ytd-grid-video-renderer`), as listas de Mixes (`ytd-radio-renderer`), Shorts individuais (`ytd-reel-item-renderer`) e a prateleira de Shorts (`ytd-rich-shelf-renderer`); além de 9 seletores de banner (`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer` e várias variantes de `ytd-rich-section-renderer > #content > …`).
- **Tratamento do feed dinâmico** — um `MutationObserver` observa `document.body` com `{ childList: true, subtree: true }`. Quando nós são adicionados, ele faz debounce com um `setTimeout` de **500 ms** (limpando e rearmando o temporizador a cada lote), de modo que o filtro é executado 500 ms após a última rajada de nós adicionados. O filtro também é executado uma vez no carregamento inicial e uma vez logo após o carregamento das configurações.

  > ℹ️ Isto é um debounce de borda final (trailing), não um throttle fixo: sob mutações contínuas, a passada continua sendo adiada. (O próprio comentário inline no código-fonte, `// Run at most every 500ms`, descreve throttling e é ligeiramente impreciso.)
- **Detecção de Mixes / Shorts** — as listas de Mixes são identificadas por `start_radio=1`, `list=RD`, o selo de sobreposição `MIX` ou `ytd-radio-renderer`; os Shorts por links `/shorts/`, o selo de sobreposição `SHORTS`, `ytd-reel-item-renderer` e prateleiras `ytd-rich-shelf-renderer`.
- **Ocultação da seção pai do banner** — quando um banner correspondente tem um ancestral `closest('ytd-rich-section-renderer')`, toda a seção pai é ocultada em vez de apenas o banner interno.

<a id="live-detection"></a>

O status de transmissão ao vivo é detectado a partir de selos no DOM (`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) ou do próprio texto de contagem de visualizações (contendo, sem distinção de maiúsculas/minúsculas, `視聴中`, `watching`, `live` ou `ライブ`, além das próprias palavras de transmissão ao vivo da localidade ativa da página — veja [Internacionalização](#internationalization)).

<a id="internationalization"></a>

### Internacionalização

O YouTube formata as contagens de visualizações/espectadores de forma diferente em cada idioma da interface, então a interpretação das contagens é guiada pelo **idioma de página do YouTube detectado**, não pelo idioma da interface do popup. Em cada passada, o content script lê `document.documentElement.lang` (recorrendo a `navigator.language` e, depois, a `'en'`), normaliza-o para um código de idioma base (por exemplo, `zh-Hans-CN` → `zh`, `es-419` → `es`) e seleciona uma especificação por localidade que descreve o separador decimal, o separador de milhar, as unidades de abreviação (por exemplo, `K`/`M`/`B`, `万`/`億`, `Mio.`/`Mrd.`, `тыс.`/`млн`/`млрд`, `万`/`亿`), as palavras conectoras de "visualizações", os marcadores de data/transmissão passada, as palavras de transmissão ao vivo e as palavras de "sem visualizações" → `0` daquele idioma.

A interpretação correta por localidade é suportada para **9 idiomas**:

- **English** (`en`)
- **日本語** (`ja`)
- **Español** (`es`)
- **Português** (`pt`)
- **Deutsch** (`de`)
- **Français** (`fr`)
- **Русский** (`ru`)
- **한국어** (`ko`)
- **简体中文** (`zh`)

Se o idioma da página não for nenhum desses, a interpretação recorre a uma **especificação genérica permissiva** que usa `.` como decimal e reconhece uma união de unidades comuns (`K`/`M`/`B` e as unidades CJK/coreanas) com base no melhor esforço. Essa consciência de localidade corrige as interpretações incorretas do interpretador anterior nas localidades com vírgula decimal (`de` / `fr` / `ru` / `pt`), onde `1,7 Mrd.` era lido como `1` ou `17` em vez de `1.700.000.000`.

### Popup (React)

Um popup em React 19 (`src/entrypoints/popup/`) renderiza os controles deslizantes, os interruptores, o seletor de modo de filtro e o seletor de idioma de três vias. Editar qualquer controle grava no armazenamento imediatamente. O popup resolve o idioma de exibição efetivo a partir de `settings.language`: `auto` segue `navigator.language`, enquanto `ja` / `en` o fixam.

### Armazenamento de configurações e sincronização ao vivo

- As configurações são persistidas em `browser.storage.local` como **chaves planas de nível superior** — uma chave por campo (`minViews`, `minConcurrent`, `filterMode`, …). Isso corresponde ao formato do `chrome.storage.local` anterior ao WXT, de modo que os usuários existentes mantêm suas configurações ao longo da migração.
- `loadSettings()` chama `browser.storage.local.get(defaultSettings)`, mesclando os valores armazenados sobre os padrões; `saveSettings()` chama `browser.storage.local.set(settings)`.
- `watchSettings()` registra um ouvinte `browser.storage.onChanged`. A cada alteração na área `local`, ele relê o registro completo de configurações e reexecuta o filtro — e é por isso que as edições do popup são aplicadas instantaneamente às abas abertas.

O tipo `Settings` tem exatamente 9 campos: `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language` (`'auto' | 'ja' | 'en'`, padrão `'auto'`).

### Interpretação da contagem de visualizações

`parseViewCount(text, lang)` resolve a especificação de localidade para o idioma de página fornecido (ou a especificação genérica quando o idioma é desconhecido/omitido) e normaliza as variadas strings de contagem do YouTube em um número (ou `null`). Em todas as localidades suportadas, ela:

| Padrão de entrada | Tratamento | Exemplo |
|---|---|---|
| Unidades de abreviação (por localidade) | multiplicadas pelo fator de unidade da localidade | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| Separadores decimais / de milhar da localidade | localidades com vírgula decimal (`de`/`fr`/`ru`/`pt`) e localidades com espaço de milhar (`fr`/`ru`) interpretadas corretamente | `129.069 Aufrufe` (de) → `129069` |
| Palavras de "sem visualizações" (por exemplo, `No views`, `なし`, equivalentes da localidade) | retorna `0` | `No views` → `0` |
| Números simples | separadores removidos por localidade e, então, interpretados | `1,234` (en) → `1234` |
| Texto de data / transmissão passada | tratado como "não é uma contagem", então o card é deixado intacto | `2 days ago`, `〜前` |
| Não interpretável | retorna `null` (elemento não filtrado pelas regras de contagem de visualizações) | — |

Antes da interpretação, as palavras-chave de "visualizações"/conectoras da localidade (por exemplo, `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`) são removidas. O espaço em branco — incluindo NBSP e narrow-NBSP, conforme aparecem em strings reais do YouTube — é normalizado primeiro. O auxiliar `isLive(text, lang)` retorna `true` (sem distinção de maiúsculas/minúsculas) quando o texto contém um marcador universal de transmissão ao vivo (`視聴中`, `watching`, `live`, `ライブ`) ou uma das palavras de transmissão ao vivo da localidade ativa.

## Limitações conhecidas

> ⚠️ O log de depuração em `src/utils/filter.ts` está atualmente fixado como ativado (`const debug = true`), então o content script emite uma saída detalhada no console. O log de resumo `FILTERED` é emitido incondicionalmente — ele está fora do guard de `debug` — então aparece mesmo que a flag esteja desativada.

## Desenvolvimento

### Pré-requisitos

- **Node.js 20** (a versão usada pela CI).
- npm (o repositório inclui um `package-lock.json`).

### Instalação

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### Scripts npm

| Script | Comando | O que faz |
|---|---|---|
| `dev` | `wxt` | Inicia o servidor de desenvolvimento do WXT para o Chrome (alvo padrão) com HMR. |
| `dev:firefox` | `wxt -b firefox` | Inicia o servidor de desenvolvimento do WXT visando o Firefox. |
| `build` | `wxt build` | Build de produção para o Chrome → `.output/chrome-mv3`. |
| `build:firefox` | `wxt build -b firefox` | Build de produção para o Firefox → `.output/firefox-mv3`. |
| `zip` | `wxt zip` | Compila e empacota a extensão do Chrome em um zip distribuível em `.output/`. |
| `zip:firefox` | `wxt zip -b firefox` | Compila e empacota o zip da extensão do Firefox em `.output/`. |
| `compile` | `wxt prepare && tsc --noEmit` | Gera os tipos do WXT e, então, verifica os tipos sem emitir. |
| `lint` | `eslint .` | Faz lint de todo o projeto (configuração flat do ESLint 9 em `eslint.config.js`). |
| `test` | `tsx test-parser.ts` | Executa os testes do interpretador de contagem de visualizações por localidade (`test-parser.ts`), cobrindo a interpretação de visualizações/espectadores e a detecção de transmissões ao vivo em todos os 9 idiomas suportados. |

> ℹ️ O `postinstall` executa `wxt prepare` automaticamente após `npm install` / `npm ci`.

Execute `npm test` após alterar qualquer coisa em `src/utils/locales.ts` ou `src/utils/parser.ts` — ele garante que strings reais de contagem do YouTube (incluindo formas separadas por NBSP e com vírgula decimal) sejam interpretadas como os números esperados para English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어 e 简体中文.

### Estrutura do projeto

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

O WXT é configurado com `srcDir: 'src'` e `modules: ['@wxt-dev/module-react']`. A lógica compartilhada é importada por meio do alias `@/utils/...`. O manifest declara `permissions: ['storage']` e `host_permissions: ['https://www.youtube.com/*']`, com `name: 'TubeFilter'` e a descrição "Filter YouTube videos based on views and other metrics." `manifestVersion: 3` em `wxt.config.ts` é a única fonte da verdade que força a saída em MV3 para ambos os alvos.

`tsconfig.json` estende o `./.wxt/tsconfig.json` gerado pelo WXT e adiciona `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters` e `noFallthroughCasesInSwitch`.

## Build e lançamento

### Saídas de build

| Alvo | Diretório de saída |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Artefatos zip

`wxt zip` empacota o build em `.output/` usando o template padrão de nome de arquivo zip do WXT (`{{name}}-{{version}}-{{browser}}.zip`, onde `{{name}}` é o nome `tube-filter` do `package.json`). Nenhum template personalizado de `zipFileName`/`sources` é definido em `wxt.config.ts`, então os nomes abaixo seguem os padrões do WXT:

- `tube-filter-<version>-chrome.zip` (por exemplo, `tube-filter-1.0.0-chrome.zip`) — corroborado pelo glob de upload do workflow de lançamento.
- `tube-filter-<version>-firefox.zip` (por exemplo, `tube-filter-1.0.0-firefox.zip`) — corroborado pelo glob de upload do workflow de lançamento.
- Um zip de fontes para a revisão da AMO (o padrão do WXT para o alvo Firefox, normalmente `tube-filter-<version>-sources.zip`). Esse nome é o padrão do WXT e não é referenciado por nenhum código no repositório; execute `npm run zip:firefox` para confirmar o nome de arquivo exato no seu ambiente.

### Workflow de lançamento do GitHub Actions

`.github/workflows/release.yml` (chamado **Release**) é acionado pelo evento `release` do GitHub com `types: [published]` e tem `permissions: contents: write`. O job é executado em `ubuntu-latest` e:

1. Faz checkout do código (`actions/checkout@v4`).
2. Configura o **Node.js 20** com cache do npm (`actions/setup-node@v4`).
3. Executa `npm ci` (cujo `postinstall` executa `wxt prepare`).
4. Executa `npm run zip` (Chrome) e `npm run zip:firefox` (Firefox), produzindo os zips de ambos os navegadores.
5. Faz upload deles como assets de lançamento via `softprops/action-gh-release@v2` (protegido por `startsWith(github.ref, 'refs/tags/')`), correspondendo a `.output/tube-filter-*-chrome.zip` e `.output/tube-filter-*-firefox.zip`.

## Stack tecnológica

| Tecnologia | Versão |
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

O pacote é o `tube-filter` v`1.0.0` (`private`, ESM `"type": "module"`); o nome de exibição da extensão é sobrescrito para **TubeFilter** em `wxt.config.ts`.

## Contribuindo

Contribuições são bem-vindas. Antes de abrir um PR:

1. `npm ci` para instalar as dependências (isso também gera os tipos do WXT).
2. `npm run lint` para verificar o código com o ESLint.
3. `npm run compile` para verificar os tipos (`wxt prepare && tsc --noEmit`).
4. `npm test` para executar os testes do interpretador por localidade (especialmente após mexer em `src/utils/locales.ts` ou `src/utils/parser.ts`).
5. Teste suas alterações em ambos os alvos com `npm run dev` e `npm run dev:firefox`.

## Licença

Nenhuma licença foi especificada para este projeto, e nenhum arquivo `LICENSE` está presente no repositório. Na ausência de uma licença explícita, o código tem, por padrão, **todos os direitos reservados** — você não tem permissão para reutilizá-lo, redistribuí-lo ou modificá-lo. Se você pretende abri-lo, adicione um arquivo `LICENSE` declarando os termos.
