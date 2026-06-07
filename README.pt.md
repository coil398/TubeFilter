# TubeFilter

[English](./README.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Português](./README.pt.md) · [Deutsch](./README.de.md) · [Français](./README.fr.md) · [Русский](./README.ru.md) · [한국어](./README.ko.md) · [简体中文](./README.zh.md)

**TubeFilter** é uma extensão Manifest V3 multiplataforma que organiza seu feed do YouTube filtrando o conteúdo de acordo com limites de contagem de visualizações e de espectadores ao vivo que você controla. Ela escurece ou oculta vídeos com poucas visualizações e transmissões ao vivo com poucos espectadores, e pode remover de forma independente banners promocionais no topo, listas Mix e Shorts. As configurações ficam em um popup React, são aplicadas instantaneamente às abas do YouTube abertas sem recarregar, e a interface do popup está disponível em **9 idiomas** (English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文) com um modo **Auto** que segue o idioma do seu navegador. As contagens de visualizações/espectadores são interpretadas levando em conta a localidade nos mesmos **9 idiomas de página do YouTube**.

[![WXT](https://img.shields.io/badge/WXT-0.20.26-67D8EF)](https://wxt.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Firefox-FF7139?logo=firefoxbrowser&logoColor=white)

> **Status:** v1.0.0 — ainda não publicada na Chrome Web Store nem na AMO. Instale via build local descompactada (consulte [Instalação](#installation-end-users)).

## Visão geral

O TubeFilter oculta ou escurece itens do feed do YouTube que ficam abaixo dos limites de visualizações/espectadores que você define, e pode remover banners, listas Mix e Shorts sob demanda. Para experimentar em três passos:

1. `npm ci`
2. `npm run build` (Chrome) ou `npm run build:firefox` (Firefox)
3. Carregue a build descompactada de `.output/chrome-mv3` (ou `.output/firefox-mv3`) — consulte [Instalação](#installation-end-users).

Suas configurações nunca saem do seu navegador: o TubeFilter solicita apenas acesso a `storage` e acesso de host a `youtube.com`, e toda a configuração é mantida no armazenamento local do navegador.

## Funcionalidades

### Filtro por contagem de visualizações (vídeos comuns)

Um vídeo comum é filtrado quando **todas** as condições a seguir são verdadeiras:

- O filtro de vídeo está habilitado (`enableVideoFilter`).
- Uma contagem de visualizações foi interpretada com sucesso a partir do card.
- A contagem de visualizações interpretada está **abaixo** do seu limite `minViews`.

Se um vídeo não tiver uma contagem de visualizações interpretável, ele é deixado intacto. O controle deslizante **Min Views** do popup controla o limite e fica desabilitado enquanto o filtro de vídeo está desligado.

### Filtro de transmissões ao vivo (lives)

As transmissões ao vivo são avaliadas em relação a um limite **separado** — espectadores simultâneos, e não visualizações totais. Uma transmissão ao vivo é filtrada quando o filtro de lives está habilitado (`enableLiveFilter`), uma contagem de espectadores foi interpretada e essa contagem está **abaixo** do seu limite `minConcurrent`. O status de transmissão ao vivo é detectado a partir de selos de "ao vivo agora" no DOM ou de texto indicativo de live na string de contagem de visualizações (consulte [Como funciona](#live-detection)).

### Filtros de conteúdo (sem limite)

Esses três filtros são interruptores incondicionais de ligar/desligar — eles ignoram completamente as contagens de visualizações:

| Filtro | Configuração | O que ele remove |
|---|---|---|
| **Top Banner** | `enableBannerFilter` | Anúncios de masthead promocionais e banners de declaração/promoção. Quando um banner correspondente fica dentro de uma rich section, toda a seção pai é ocultada. |
| **Mix Lists** | `enableMixFilter` | Playlists Mix / rádio geradas automaticamente. |
| **Shorts** | `enableShortsFilter` | Links e prateleiras de Shorts. |

### Regras de canal e filtro por palavra-chave

Além dos limites numéricos, você pode permitir ou ocultar de forma incondicional por canal, e ocultar pelo texto do título — gerenciados no popup como listas com uma entrada por linha.

- **Canais sempre ocultos** (`channelBlocklist`) — os vídeos desses canais são sempre ocultados, independentemente da contagem de visualizações.
- **Canais sempre exibidos** (`channelAllowlist`) — os vídeos desses canais nunca são filtrados (útil para criadores pequenos favoritos abaixo do seu `minViews`).
- **Ocultar títulos que contenham** (`titleKeywords`) — oculta vídeos cujo título contenha qualquer termo listado. Uma entrada entre barras (por exemplo, `/spoiler.*ending/`) é tratada como uma **expressão regular** sem distinção entre maiúsculas e minúsculas; caso contrário, é uma substring simples sem distinção entre maiúsculas e minúsculas.

Os canais são correspondidos **exatamente** por `@handle`, ID do canal ou nome do canal (portanto `mr` **não** corresponde a `@MrBeast`). Essas regras se aplicam a cards individuais de vídeo / playlist / Mix, mas **não** a prateleiras agregadas (por exemplo, a prateleira de Shorts), de modo que um único filho nunca oculta uma linha inteira.

### Onde a filtragem se aplica

O content script é executado em todo o YouTube e refiltra conforme você navega — Início, Pesquisa, Inscrições, as recomendações da barra lateral da página de reprodução e páginas de canal — cobrindo tanto os renderers legados quanto o layout mais recente `yt-lockup-view-model`.

### Modos de filtro: Ocultar vs. Opacidade

O seletor **Filter Mode** decide como os vídeos/transmissões ao vivo filtrados são tratados:

- **Hide** — define `display: none`, removendo completamente o elemento da visualização.
- **Opacity** — define `opacity: 0.1`, escurecendo o elemento para **10%** de opacidade enquanto o mantém visível. Este é o padrão.

> ℹ️ O filtro Top Banner sempre oculta os banners (`display: none`), independentemente do modo de filtro selecionado. O modo de filtro afeta apenas vídeos e transmissões ao vivo.

### Precedência dos filtros

Cada card é classificado uma única vez, usando uma ordem fixa if/else. Apenas a regra da primeira categoria correspondente é aplicada:

1. **Lista de bloqueio de canais** — sempre ocultar (prioridade mais alta)
2. **Lista de permissões de canais** — sempre exibir (ignora todas as regras abaixo)
3. **Palavra-chave de título** — ocultar títulos correspondentes
4. **Shorts**
5. **Listas Mix**
6. **Transmissões ao vivo**
7. **Vídeos comuns**

(As regras de canal/palavra-chave 1 a 3 se aplicam apenas a cards individuais, não a prateleiras agregadas.)

### Desativar a dublagem automática (forçar áudio original)

A dublagem automática do YouTube substitui o áudio de um vídeo por uma faixa traduzida por IA com base no idioma da sua interface — então um vídeo em inglês é reproduzido em japonês, alemão etc. por padrão. Com **Force Original Audio** (`forceOriginalAudio`, **ativado por padrão**), o TubeFilter detecta a faixa de áudio original e alterna o player para ela automaticamente em todos os vídeos e Shorts, desfazendo a dublagem automática.

- Funciona em vídeos `/watch` e Shorts, sendo reaplicado a cada navegação dentro do aplicativo.
- A faixa original é identificada **independentemente do idioma** ao decodificar o id da faixa de áudio do player (os dados da faixa original contêm `original`; faixas dubladas contêm `dubbed` / `dubbed-auto`).
- Implementado por meio de um **script do MAIN-world** injetado na página — a API de áudio do player do YouTube não é acessível a partir do mundo isolado do content script — com a configuração conectada a partir do armazenamento da extensão.
- Desligue-o a qualquer momento no popup para manter o áudio dublado do YouTube.

### Detecção multilíngue de contagem de visualizações

O YouTube renderiza as contagens de visualizações e de espectadores **de forma muito diferente por idioma de página** — não apenas palavras traduzidas, mas separadores de decimal/milhar e unidades de abreviação diferentes. A mesma contagem de aproximadamente 1,7 bilhão aparece como:

| Idioma | String do YouTube |
|---|---|
| English | `1.7B` |
| Deutsch | `1,7 Mrd.` |
| 日本語 | `17億` |
| Русский | `1,7 млрд` |
| 简体中文 | `17亿` |

O content script detecta automaticamente o **idioma de página do YouTube** (`document.documentElement.lang`) e interpreta as contagens com o separador decimal, o separador de milhar e as unidades de abreviação corretos para aquela localidade. Isso importa porque o parser anterior assumia um formato no estilo inglês e **interpretava incorretamente as localidades com vírgula decimal** (`de` / `fr` / `ru` / `pt`) — por exemplo, lendo `1,7 Mrd.` como `1` ou `17` em vez de `1.700.000.000`. A interpretação correta por localidade é suportada para **9 idiomas** (consulte [Internacionalização](#internationalization)); idiomas de página desconhecidos recorrem a um parser genérico permissivo.

### Idiomas (interface do popup)

A interface do popup é oferecida em **9 idiomas** — English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어, 简体中文 — além de um modo **Auto (`auto`, padrão)** que segue o idioma da interface do navegador (`navigator.language`, mapeado para a localidade suportada mais próxima, recorrendo ao inglês). Um menu suspenso no cabeçalho do popup alterna entre eles.

## Capturas de tela

| English | 日本語 |
|---|---|
| ![TubeFilter popup (English)](./docs/screenshots/popup-en.png) | ![TubeFilter popup (Japanese)](./docs/screenshots/popup-ja.png) |

## Navegadores suportados

| Navegador | Manifest | Observações |
|---|---|---|
| **Chrome / Chromium** | MV3 | Alvo padrão da build; o Chrome usa MV3 por padrão. |
| **Firefox** | MV3 | O diretório de saída é `.output/firefox-mv3`; o MV3 é forçado via `manifestVersion: 3` em `wxt.config.ts` (caso contrário, o Firefox usaria MV2 por padrão). |

> ℹ️ O content script é executado em `https://www.youtube.com/*` em ambos os navegadores. A build do Firefox inclui um `browser_specific_settings.gecko.id` igual a `tube-filter@coil398.github.io` (obrigatório para a AMO MV3, inofensivo no Chrome).

## Instalação (usuários finais)

Para o passo a passo completo e suportado de lançamento e instalação, consulte **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**.

Para carregar uma build local descompactada para testes:

### Chrome / Chromium

1. Execute `npm run build` para gerar `.output/chrome-mv3`.
2. Abra `chrome://extensions`.
3. Habilite o **Modo de desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione o diretório `.output/chrome-mv3`.

### Firefox

1. Execute `npm run build:firefox` para gerar `.output/firefox-mv3`.
2. Abra `about:debugging`.
3. Vá em **Este Firefox** → **Carregar extensão temporária…**.
4. Selecione qualquer arquivo dentro do diretório `.output/firefox-mv3` (por exemplo, seu `manifest.json`).

## Uso

Abra o popup da extensão para ajustar a filtragem. As alterações são salvas imediatamente e aplicadas ao vivo a qualquer aba do YouTube aberta — sem necessidade de recarregar.

### Referência de configurações

| Configuração | O que ela controla | Intervalo / passo | Padrão | Rótulo JA | Rótulo EN |
|---|---|---|---|---|---|
| `minViews` | Contagem mínima de visualizações abaixo da qual vídeos comuns são filtrados | intervalo `0`–`100000`, passo `1000` | `1000` | 最低再生回数 | Min Views |
| `minConcurrent` | Contagem mínima de espectadores simultâneos abaixo da qual as transmissões ao vivo são filtradas | intervalo `0`–`5000`, passo `50` | `50` | 最低同時接続数 (ライブ) | Min Concurrent (Live) |
| `filterMode` | Como os vídeos/transmissões ao vivo filtrados são tratados (`hide` / `opacity`) | seletor de dois botões | `opacity` | フィルタリングモード | Filter Mode |
| `enableVideoFilter` | Habilita/desabilita o filtro por contagem de visualizações (também habilita/desabilita o controle deslizante Min Views) | interruptor liga/desliga | `true` | 動画フィルタ有効 | Enable Video Filter |
| `enableLiveFilter` | Habilita/desabilita o filtro de lives (também habilita/desabilita o controle deslizante Min Concurrent) | interruptor liga/desliga | `true` | ライブフィルタ有効 | Enable Live Filter |
| `enableBannerFilter` | Oculta banners promocionais no topo | interruptor liga/desliga | `true` | トップバナー非表示 | Hide Top Banner |
| `enableMixFilter` | Oculta listas Mix | interruptor liga/desliga | `true` | ミックスリスト非表示 | Hide Mix Lists |
| `enableShortsFilter` | Oculta Shorts | interruptor liga/desliga | `true` | ショート動画非表示 | Hide Shorts |
| `forceOriginalAudio` | Força a faixa de áudio original (desfaz a dublagem automática) nas páginas de reprodução e nos Shorts | interruptor liga/desliga | `true` | 元の音声に固定 | Force Original Audio |
| `channelAllowlist` | Canais que nunca devem ser filtrados (sempre exibir), um por linha; correspondidos por @handle, ID ou nome | lista em textarea | `[]` | 常に表示するチャンネル | Always-show channels |
| `channelBlocklist` | Canais a sempre ocultar, um por linha | lista em textarea | `[]` | 常に非表示のチャンネル | Always-hide channels |
| `titleKeywords` | Oculta vídeos cujo título contenha um termo; entradas `/…/` são regex sem distinção entre maiúsculas e minúsculas | lista em textarea | `[]` | この語を含むタイトルを非表示 | Hide titles containing |
| `language` | Idioma da interface do popup: `auto` + 9 localidades (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`); **Auto** segue o idioma da interface do navegador (`navigator.language`) | seletor suspenso | `auto` | Language | 言語 |

Ambos os controles deslizantes exibem seu valor com separadores de milhar via `toLocaleString()`. Uma nota auxiliar fica abaixo do controle deslizante Min Concurrent:

- JA: 視聴者数が少ないライブ配信はフィルタリングされます。
- EN: Live streams with fewer viewers will be filtered.

### Seletor de modo de filtro

Um controle de dois botões. **Hide** define `filterMode = 'hide'`; **Opacity** define `filterMode = 'opacity'`. O modo ativo é destacado. Os rótulos são localizados — JA: 非表示 / 薄く表示, EN: Hide / Opacity.

### Seletor de idioma

Um menu suspenso no cabeçalho do popup define `language` como `auto` ou uma das 9 localidades (`en`/`ja`/`es`/`pt`/`de`/`fr`/`ru`/`ko`/`zh`). **Auto** (o padrão) resolve o idioma efetivo da interface a partir de `navigator.language`, mapeado para a localidade suportada mais próxima e recorrendo ao inglês. Selecionar um idioma específico fixa a interface nele, independentemente da configuração do navegador.

## Como funciona

### Content script

- **Correspondência e timing** — corresponde a `https://www.youtube.com/*` e é executado em `run_at: document_end`.
- **Detecção do idioma de página** — em cada passagem, ele lê `document.documentElement.lang` (recorrendo a `navigator.language` e, em seguida, a `'en'`) e o utiliza para escolher um parser de contagem de visualizações correto para a localidade (consulte [Internacionalização](#internationalization)).
- **Alvos** — varre 7 seletores de vídeo cobrindo Início (`ytd-rich-item-renderer`), Pesquisa (`ytd-video-renderer`), Barra lateral (`ytd-compact-video-renderer`), Canal (`ytd-grid-video-renderer`), listas Mix (`ytd-radio-renderer`), Shorts individuais (`ytd-reel-item-renderer`) e a prateleira de Shorts (`ytd-rich-shelf-renderer`); além de 9 seletores de banner (`#masthead-ad`, `#big-yoodle`, `ytd-statement-banner-renderer`, `ytd-banner-promo-renderer`, `ytd-ad-slot-renderer`, `ytd-in-feed-ad-layout-renderer` e várias variantes de `ytd-rich-section-renderer > #content > …`).
- **Tratamento de feed dinâmico** — um `MutationObserver` observa `document.body` com `{ childList: true, subtree: true }`. Quando nós são adicionados, ele aplica debounce com um `setTimeout` de **500 ms** (limpando e rearmando o temporizador a cada lote), de modo que o filtro é executado 500 ms após a última rajada de nós adicionados. O filtro também é executado uma vez no carregamento inicial e uma vez logo após o carregamento das configurações.

  > ℹ️ Este é um debounce de borda final, não um throttle fixo: sob mutações contínuas, a passagem continua sendo adiada. (O comentário inline do próprio código-fonte, `// Run at most every 500ms`, descreve throttling e é ligeiramente impreciso.)
- **Detecção de Mix / Shorts** — listas Mix são correspondidas via `start_radio=1`, `list=RD`, o selo de sobreposição `MIX` ou `ytd-radio-renderer`; Shorts via links `/shorts/`, o selo de sobreposição `SHORTS`, `ytd-reel-item-renderer` e prateleiras `ytd-rich-shelf-renderer`.
- **Ocultação da seção pai do banner** — quando um banner correspondente tem um ancestral `closest('ytd-rich-section-renderer')`, toda a seção pai é ocultada em vez de apenas o banner interno.

<a id="live-detection"></a>

O status de transmissão ao vivo é detectado a partir de selos no DOM (`.badge-style-type-live-now`, `.badge-style-type-live-now-alternate`, `[overlay-style="LIVE"]`) ou do próprio texto da contagem de visualizações (contendo, sem distinção entre maiúsculas e minúsculas, `視聴中`, `watching`, `live` ou `ライブ`, além das palavras de "ao vivo" próprias da localidade da página ativa — consulte [Internacionalização](#internationalization)).

<a id="internationalization"></a>

### Internacionalização

O YouTube formata as contagens de visualizações/espectadores de forma diferente em cada idioma da interface, então a interpretação das contagens é orientada pelo **idioma de página do YouTube detectado**, e não pelo idioma da interface do popup. Em cada passagem, o content script lê `document.documentElement.lang` (recorrendo a `navigator.language` e, em seguida, a `'en'`), normaliza-o para um código de idioma base (por exemplo, `zh-Hans-CN` → `zh`, `es-419` → `es`) e seleciona uma especificação por localidade que descreve o separador decimal, o separador de milhar, as unidades de abreviação (por exemplo, `K`/`M`/`B`, `万`/`億`, `Mio.`/`Mrd.`, `тыс.`/`млн`/`млрд`, `万`/`亿`), as palavras conectoras de "visualizações", os marcadores de data/transmissão passada, as palavras de transmissão ao vivo e as palavras de "sem visualizações" → `0` daquele idioma.

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

Se o idioma de página não for nenhum desses, a interpretação recorre a uma **especificação genérica permissiva** que usa `.` como decimal e reconhece uma união de unidades comuns (`K`/`M`/`B` e as unidades CJK/coreanas) com base no melhor esforço. Essa consciência de localidade corrige as leituras incorretas do parser anterior nas localidades com vírgula decimal (`de` / `fr` / `ru` / `pt`), em que `1,7 Mrd.` era lido como `1` ou `17` em vez de `1.700.000.000`.

### Popup (React)

Um popup React 19 (`src/entrypoints/popup/`) renderiza os controles deslizantes, os interruptores, o seletor de modo de filtro e o seletor de idioma de três vias. Editar qualquer controle grava no armazenamento imediatamente. O popup resolve seu idioma de exibição efetivo a partir de `settings.language`: `auto` segue `navigator.language`, enquanto `ja` / `en` o fixam.

### Armazenamento de configurações e sincronização ao vivo

- As configurações são persistidas em `browser.storage.local` como **chaves planas de nível superior** — uma chave por campo (`minViews`, `minConcurrent`, `filterMode`, …). Isso corresponde ao formato `chrome.storage.local` pré-WXT, de modo que os usuários existentes mantêm suas configurações durante a migração.
- `loadSettings()` chama `browser.storage.local.get(defaultSettings)`, mesclando os valores armazenados sobre os padrões; `saveSettings()` chama `browser.storage.local.set(settings)`.
- `watchSettings()` registra um listener `browser.storage.onChanged`. A qualquer alteração na área `local`, ele relê o registro completo de configurações e reexecuta o filtro — e é por isso que as edições do popup se aplicam instantaneamente às abas abertas.

O tipo `Settings` tem exatamente 9 campos: `minViews`, `minConcurrent`, `filterMode`, `enableVideoFilter`, `enableLiveFilter`, `enableBannerFilter`, `enableMixFilter`, `enableShortsFilter`, `language` (`'auto' | 'ja' | 'en'`, padrão `'auto'`).

### Interpretação da contagem de visualizações

`parseViewCount(text, lang)` resolve a especificação de localidade para o idioma de página fornecido (ou a especificação genérica quando o idioma é desconhecido/omitido) e normaliza as variadas strings de contagem do YouTube em um número (ou `null`). Em todas as localidades suportadas, ele:

| Padrão de entrada | Tratamento | Exemplo |
|---|---|---|
| Unidades de abreviação (por localidade) | multiplicado pelo fator de unidade da localidade | `1.2万` → `12000`, `12K` → `12000`, `1,7 Mrd.` (de) → `1700000000` |
| Separadores de decimal / milhar da localidade | localidades com vírgula decimal (`de`/`fr`/`ru`/`pt`) e localidades com espaço como milhar (`fr`/`ru`) interpretadas corretamente | `129.069 Aufrufe` (de) → `129069` |
| Palavras de "sem visualizações" (por exemplo, `No views`, `なし`, equivalentes da localidade) | retorna `0` | `No views` → `0` |
| Números simples | separadores removidos por localidade e, em seguida, interpretados | `1,234` (en) → `1234` |
| Texto de data / transmissão passada | tratado como "não é uma contagem", então o card é deixado intacto | `2 days ago`, `〜前` |
| Não interpretável | retorna `null` (elemento não filtrado pelas regras de contagem de visualizações) | — |

Antes da interpretação, as palavras-chave de "visualizações"/conectoras da localidade (por exemplo, `views` / `view` / `回視聴` / `視聴` / `回` / `de vistas` / `Aufrufe` / `просмотров` / `조회수` / `次观看`) são removidas. O espaço em branco — incluindo NBSP e narrow-NBSP, como aparecem em strings reais do YouTube — é normalizado primeiro. O helper `isLive(text, lang)` retorna `true` (sem distinção entre maiúsculas e minúsculas) quando o texto contém um marcador universal de live (`視聴中`, `watching`, `live`, `ライブ`) ou uma das palavras de transmissão ao vivo da localidade ativa.

## Limitações conhecidas

> ⚠️ O log de depuração em `src/utils/filter.ts` está atualmente fixado como ligado (`const debug = true`), então o content script emite saída detalhada no console. O log de resumo `FILTERED` é emitido incondicionalmente — está fora da guarda `debug` — então aparece mesmo que o sinalizador seja desligado.

## Desenvolvimento

### Pré-requisitos

- **Node.js 20** (a versão usada pela CI).
- npm (o repositório inclui um `package-lock.json`).

### Instalação

```bash
npm ci   # postinstall runs `wxt prepare` to generate WXT-managed types (.wxt/)
```

### Scripts npm

| Script | Comando | O que ele faz |
|---|---|---|
| `dev` | `wxt` | Inicia o servidor de desenvolvimento WXT para Chrome (alvo padrão) com HMR. |
| `dev:firefox` | `wxt -b firefox` | Inicia o servidor de desenvolvimento WXT visando o Firefox. |
| `build` | `wxt build` | Build de produção para Chrome → `.output/chrome-mv3`. |
| `build:firefox` | `wxt build -b firefox` | Build de produção para Firefox → `.output/firefox-mv3`. |
| `zip` | `wxt zip` | Compila e empacota a extensão do Chrome em um zip distribuível em `.output/`. |
| `zip:firefox` | `wxt zip -b firefox` | Compila e empacota o zip da extensão do Firefox em `.output/`. |
| `compile` | `wxt prepare && tsc --noEmit` | Gera os tipos do WXT e, em seguida, verifica os tipos sem emitir. |
| `lint` | `eslint .` | Faz lint de todo o projeto (configuração flat do ESLint 9 em `eslint.config.js`). |
| `test` | `tsx test-parser.ts` | Executa os testes do parser de contagem de visualizações por localidade (`test-parser.ts`), cobrindo a interpretação de visualizações/espectadores e a detecção de live em todos os 9 idiomas suportados. |

> ℹ️ O `postinstall` executa `wxt prepare` automaticamente após `npm install` / `npm ci`.

Execute `npm test` após alterar qualquer coisa em `src/utils/locales.ts` ou `src/utils/parser.ts` — ele afirma que strings de contagem reais do YouTube (incluindo formas separadas por NBSP e com vírgula decimal) são interpretadas para os números esperados em English, 日本語, Español, Português, Deutsch, Français, Русский, 한국어 e 简体中文.

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

O WXT é configurado com `srcDir: 'src'` e `modules: ['@wxt-dev/module-react']`. A lógica compartilhada é importada via o alias `@/utils/...`. O manifest declara `permissions: ['storage']` e `host_permissions: ['https://www.youtube.com/*']`, com `name: 'TubeFilter'` e a descrição "Filter YouTube videos based on views and other metrics." `manifestVersion: 3` em `wxt.config.ts` é a única fonte da verdade que força a saída MV3 para ambos os alvos.

O `tsconfig.json` estende o `./.wxt/tsconfig.json` gerado pelo WXT e adiciona `jsx: 'react-jsx'`, `allowImportingTsExtensions`, `noUnusedLocals`, `noUnusedParameters` e `noFallthroughCasesInSwitch`.

## Build e lançamento

### Saídas da build

| Alvo | Diretório de saída |
|---|---|
| Chrome | `.output/chrome-mv3` |
| Firefox | `.output/firefox-mv3` |

### Artefatos zip

`wxt zip` empacota a build em `.output/` usando o template de nome de arquivo zip padrão do WXT (`{{name}}-{{version}}-{{browser}}.zip`, onde `{{name}}` é o nome `tube-filter` do `package.json`). Nenhum template personalizado de `zipFileName`/`sources` é definido em `wxt.config.ts`, então os nomes abaixo seguem os padrões do WXT:

- `tube-filter-<version>-chrome.zip` (por exemplo, `tube-filter-1.0.0-chrome.zip`) — corroborado pelo glob de upload do workflow de lançamento.
- `tube-filter-<version>-firefox.zip` (por exemplo, `tube-filter-1.0.0-firefox.zip`) — corroborado pelo glob de upload do workflow de lançamento.
- Um zip de fontes para a revisão da AMO (o padrão do WXT para o alvo Firefox, normalmente `tube-filter-<version>-sources.zip`). Esse nome é o padrão do WXT e não é referenciado por nenhum código no repositório; execute `npm run zip:firefox` para confirmar o nome de arquivo exato no seu ambiente.

### Workflow de lançamento do GitHub Actions

`.github/workflows/release.yml` (chamado **Release**) é disparado pelo evento `release` do GitHub com `types: [published]` e tem `permissions: contents: write`. O job é executado em `ubuntu-latest` e:

1. Faz checkout do código (`actions/checkout@v4`).
2. Configura o **Node.js 20** com cache do npm (`actions/setup-node@v4`).
3. Executa `npm ci` (cujo `postinstall` executa `wxt prepare`).
4. Executa `npm run zip` (Chrome) e `npm run zip:firefox` (Firefox), produzindo ambos os zips de navegador.
5. Faz upload deles como assets de lançamento via `softprops/action-gh-release@v2` (protegido por `startsWith(github.ref, 'refs/tags/')`), correspondendo a `.output/tube-filter-*-chrome.zip` e `.output/tube-filter-*-firefox.zip`.

## Stack de tecnologias

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

O pacote é `tube-filter` v`1.0.0` (`private`, ESM `"type": "module"`); o nome de exibição da extensão é sobrescrito para **TubeFilter** em `wxt.config.ts`.

## Como contribuir

Contribuições são bem-vindas. Antes de abrir um PR:

1. `npm ci` para instalar as dependências (isso também gera os tipos do WXT).
2. `npm run lint` para verificar o código com o ESLint.
3. `npm run compile` para verificar os tipos (`wxt prepare && tsc --noEmit`).
4. `npm test` para executar os testes do parser por localidade (especialmente após mexer em `src/utils/locales.ts` ou `src/utils/parser.ts`).
5. Teste suas alterações em ambos os alvos com `npm run dev` e `npm run dev:firefox`.

## Licença

Nenhuma licença foi especificada para este projeto, e nenhum arquivo `LICENSE` está presente no repositório. Na ausência de uma licença explícita, o código é, por padrão, **todos os direitos reservados** — você não tem permissão para reutilizar, redistribuir ou modificá-lo. Se você pretende abri-lo, adicione um arquivo `LICENSE` declarando os termos.
