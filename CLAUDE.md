# FoiAqui — Contexto do Projeto

> Este arquivo é lido automaticamente pelo Claude Code ao abrir a pasta.
> É a **fonte única de verdade** do protótipo do FoiAqui. Leia inteiro antes de começar.

---

## 1. O que é o FoiAqui

App de **memória urbana colaborativa**. A pessoa aponta a câmera do celular para um lugar (rua, prédio, praça) e vê **histórias, fotos antigas, relatos e acontecimentos** ligados àquele ponto — transformando a cidade num "museu vivo". Qualquer pessoa pode **adicionar** memórias (foto, texto, áudio, vídeo); a comunidade **modera** o conteúdo.

Frase-guia do produto: **"Aponte a câmera e veja o que foi aqui."**

Público (dois lados que se alimentam):
- **Quem cria** — moradores (muitas vezes mais velhos), pesquisadores, artistas, instituições (arquivos, museus, escolas).
- **Quem consome** — turistas, estudantes, curiosos urbanos, moradores.

Este projeto começou como exercício de UX (metodologia Duplo Diamante). Toda a pesquisa, personas, sitemap, benchmarking e o modelo de negócio estão no arquivo `FoiAqui-UX.xlsx` (na pasta). O protótipo navegável está em `foiaqui-prototipo.html` (na pasta) — **use-o como referência de fluxo e estrutura das telas. A aparência dele está superada** pela direção "Placa Esmaltada" (seção 3): não copie cores nem tipografia dali.

---

## 2. Escopo desta fase

- **Plataforma:** React Native + **Expo** (SDK atual), **TypeScript**.
- **Foco:** **somente o front-end (as telas)**. Sem backend, sem API, sem autenticação real.
- **Dados:** tudo **mockado** (arquivos locais em `/data`), estado em memória (`useState` / Zustand para o global simples como "salvos").
- **Nível do dev:** intermediário — pode explicar decisões não óbvias (dev build, config do Reanimated), sem gastar tempo com o básico.

Meta concreta: montar as **telas navegáveis** com a identidade visual definida, prontas para depois plugar dados reais.

---

## 3. Identidade visual — "Placa Esmaltada" (siga à risca)

> Esta seção foi reescrita em 29/08/2026. A direção anterior ("a cidade como
> arquivo vivo à noite": escuro + âmbar + papel + Fraunces) foi abandonada por
> duas razões, ambas verificadas:
>
> 1. **Genérica.** Escuro com acento âmbar e display serifado é uma das
>    combinações mais repetidas em design gerado por IA. Não tinha ponto de
>    vista próprio — tirando a Fraunces, nada era específico deste produto.
> 2. **Contradizia o uso real.** A Decisão 7 da pesquisa diz que o contexto é
>    "sol na tela, mão ocupada, sinal instável". Interface escura sob sol direto
>    é pior de ler, e a persona principal tem 70 anos. O escuro era poético,
>    não funcional.

### A referência

A **placa de rua brasileira de chapa esmaltada** (anos 1930–80): chapa de ferro
com esmalte vitrificado, fundo azul-marinho, letra **e moldura** em branco.
Sumiu das cidades a partir dos anos 80, trocada por alumínio e PVC — ou seja,
a própria placa é memória urbana desaparecendo. O meio é a mensagem.

E placas comemorativas escrevem literalmente **"AQUI FUNCIONOU"**, "AQUI VIVEU".
O nome do app é a fala da placa. Toda memória no FoiAqui é uma placa.

### Regra estrutural (substitui a antiga escuro/papel)

| Papel | Token | Onde |
|---|---|---|
| A cidade, de dia — onde a pessoa anda | `cal` | mapa, listas, perfil, formulários |
| A memória marcada no lugar | `esmalte` | a placa: pin do mapa, cabeçalho da ficha |
| O tempo agindo | `ferrugem` | ações, seleção, o que é humano e imperfeito |

Não misture. Azul é memória; ferrugem é ação; cal é chão.

### Tokens de cor (`theme/colors.ts` — fonte única)

```
cal        #F4F3EE   // fundo base (esmalte branco)
cal2       #EAE8E0   // superfície elevada
cal3       #DFDCD1
calLine    #CFCABA   // divisores

esmalte      #14396E // a chapa — a memória
esmalteFundo #0F2B54
esmalteClaro #3A6098
sobreEsmalte    #F4F3EE  // texto e moldura sobre a chapa
sobreEsmalteDim #A8C2E4

ferrugem      #B4471F  // acento: ações, seleção
ferrugemClara #D4703F
sobreFerrugem #F4F3EE

conferido  #2E6E68   // aprovado pela comunidade
grafite    #1A1D23   // texto sobre cal
grafiteDim #55524B   // texto secundário
voce       #1A1D23   // "você está aqui" — neutro: você não é memória

mapaFundo      #E4E1D6
mapaQuarteirao #DAD6C9
mapaRua        #F1EFE8
mapaAvenida    #F6F4EE
mapaAgua       #B3CBC5
```

Toda combinação texto/fundo do app foi medida contra o WCAG AA: **16 de 16
pares passam**. Ao introduzir cor nova, meça antes de commitar.

### Tipografia — quatro vozes, uma por papel

- **placa** — **Archivo Narrow**, caixa alta, tracking largo. É a letra fundida
  da chapa: condensada porque nome de rua precisa caber em chapa estreita.
  Usada em título de memória, nome de tela e rótulo de pin.
- **story** — **Newsreader**. A voz de quem viveu. Só relato e citação.
- **ui** — **Archivo**. Toda a interface: rótulos, botões, listas.
- **mono** — **DM Mono**. Datas, períodos, coordenadas, número de acervo.

Cada família vem por peso em arquivo separado: `fontWeight` **não funciona**,
escolha a família certa. Texto só pelos componentes de `components/Type.tsx`
(`Plaque`, `Story`, `Body`, `Mono`, `Eyebrow`) — é o que aplica o "fonte grande".

### Linguagem de forma

**Canto reto é o padrão** (`radius.none`). Chapa esmaltada é cortada reta.
Curva é exceção reservada ao que é corpo: avatar, botão de tocar áudio, o FAB
de criar, e a folha que sobe do rodapé.

A assinatura é a **moldura branca embutida** — componente `components/Plaque.tsx`.
Ela substitui o retângulo arredondado genérico como linguagem de container.
`chipped` acrescenta a lasca de ferrugem: a marca do tempo que toda placa velha
tem. Use só na memória aberta, para não virar enfeite.

### O que NÃO fazer

- Não pulsar, brilhar ou animar os pins. A placa está parada no muro há sessenta
  anos; halo piscando é vocabulário de app de corrida.
- Não usar gradiente como decoração. Só onde há volume real (o FAB).
- Não voltar com a Fraunces nem com o âmbar.

Acessibilidade não é opcional (Íris tem 70 anos): alvos ≥ 44px, contraste AA
medido, opção de fonte grande e "modo simples" no perfil, e respeitar
`prefers-reduced-motion`.

## 4. As telas (sitemap)

Ordem de navegação e o que cada tela faz. **Espelhe o FLUXO do `foiaqui-prototipo.html`** — a aparência vem da seção 3, não dele.

**0. Entrada** — Splash → Login (social) **ou** "Explorar sem login" → onboarding curto + permissões (localização, câmera).
> Nesta fase: pode pular direto pro Mapa (login/onboarding stubados).

**1. Mapa (Home)** — *hub principal*
- Mapa escuro estilizado, **pins de memória em âmbar** (com glow), ponto "você está aqui".
- Barra de busca no topo (lugar / época / tema) + chips de filtro.
- **Botão de câmera (AR) em destaque** + botão **"+" (adicionar)** na tab bar.
- Tocar num pin → abre a **Ficha**.

**2. Câmera AR** — *simulada nesta fase*
- Preview da câmera (`expo-camera`) + **cards de memória sobrepostos** aos prédios + reticle + dica "aponte para um prédio ou praça".
- Tocar num card → **Ficha**. Botão "voltar ao mapa".
- **Não** é AR real (ARKit/ARCore) agora — é câmera + overlays absolutos, igual ao mockup.

**3. Ficha da Memória** — *a estrela*
- Surge como **superfície de papel** sobre o escuro.
- **Slider passado↔presente**: arrasta um divisor pra revelar a foto antiga (sépia) sobre a vista atual. (Implementar com gesture-handler + Reanimated.)
- Título (Fraunces), história, **chip de áudio** (voz de quem viveu), autor + data (mono), ações (salvar / compartilhar / reportar), "mais memórias deste local".

**4. Adicionar Memória** — *fluxo guiado, passo a passo*
- 1) foto/vídeo (câmera ou galeria) → 2) história → 3) local (GPS + ajuste manual) → 4) época + tags → preview → enviar.
- Ao enviar: mensagem de que "passa por checagem da comunidade" (moderação).
- **Data e local são obrigatórios** (ver decisões abaixo). Áudio é mídia de primeira classe.

**5. Trilhas & Coleções** — percursos temáticos (ex.: "A cidade nos anos 60", "Arte urbana", coleções de escolas). Cards com capa, contagem de paradas, duração.

**6. Perfil & Comunidade** — contribuições, salvos, badges/níveis (gamificação), **fila de moderação** (revisar memórias de outros), e **config. de acessibilidade** (fonte grande, modo simples).

### Ordem de construção sugerida (MVP primeiro)
1. `theme/` (cores, tipografia, espaçamento) + shell de navegação (bottom tabs + stack).
2. **Mapa (Home)** com pins mockados (mapa pode ser stub visual — ver seção 7).
3. **Ficha** + **slider passado↔presente** (a interação-assinatura).
4. **Câmera AR** (câmera + overlays).
5. **Adicionar Memória** (fluxo guiado).
6. Depois: Trilhas, Perfil, Salvos.

---

## 5. Modelo de dados (mock)

Crie tipos em `types/` e dados em `data/`. Shape sugerido:

```ts
type MediaType = 'photo' | 'audio' | 'video';

interface Memory {
  id: string;
  title: string;              // "Cine Marrocos"
  year: string;               // "1958"
  era: string;                // "Anos 50"
  place: string;              // "Rua do Comércio, 210"
  coords: { lat: number; lng: number };
  story: string;
  author: { name: string; level: number };
  kind: string;               // "Foto + relato"
  verified: boolean;
  media: { type: MediaType; uri: string }[];
  pastImageUri?: string;      // foto antiga (para o slider)
  presentImageUri?: string;   // vista atual
}

interface Trail {
  id: string;
  title: string;              // "O centro que não existe mais"
  theme: string;              // "Anos dourados"
  durationMin: number;
  stopIds: string[];          // ids de Memory
  coverUri?: string;
}

interface UserProfile {
  name: string; level: number; city: string;
  stats: { memories: number; views: number; collections: number };
  badges: { id: string; label: string; earned: boolean }[];
}
```

Já existem 3 memórias de exemplo no protótipo (Cine Marrocos/1958, Coreto da Praça/1962, Mural do Beco/2019) — reaproveite. Como não há fotos reais, use placeholders com gradiente sépia (foto antiga) e cinza-frio (vista atual), como no mockup.

---

## 6. Prioridades (MVP → v2 → v3)

Vindas do benchmarking (aba "Decisões FoiAqui" no xlsx). **Construa só o MVP agora.**

- **MVP:** mapa como tela principal · ficha em bottom sheet · adicionar memória (com data+local obrigatórios, áudio incluso) · moderação comunitária (visual) · foco em uso na rua/acessibilidade.
- **v2:** slider passado↔presente · linha do tempo/filtro por data · coleções · gamificação/reconhecimento · perfil público · funcionar com GPS ruim/offline.
- **v3:** AR real na rua · roteiros/tours guiados.

> Obs.: o slider passado↔presente é v2 no roadmap, mas como é a assinatura visual do app, vale já deixá-lo na Ficha como protótipo de interação.

---

## 7. Como trabalhar aqui (regras pro Claude Code)

- **TypeScript** sempre. **Expo Router** (navegação por arquivos) para as rotas.
- **Front-only:** nada de chamadas de rede. Dados de `/data`, estado local. Simule async quando fizer sentido (ex.: "enviando memória...").
- **Mapa e câmera precisam de Development Build** (`expo-dev-client`) — `react-native-maps` não roda no Expo Go. **Estratégia desta fase:** como o foco são as telas, comece com um **`<MapCanvas>` stub** (View/SVG/imagem escura com os pins por cima, igual ao mockup) pra rodar tudo no **Expo Go**. Troque por `react-native-maps` depois, num dev build. `expo-camera` funciona no Expo Go.
- **Animações e gestos:** `react-native-reanimated` + `react-native-gesture-handler` (o slider passado↔presente e transições). Lembre de configurar o plugin do Reanimated no `babel.config.js`.
- **Fontes:** `@expo-google-fonts/fraunces` + `expo-font`. Carregue antes de renderizar (splash até as fontes prontas).
- **Estilo:** um **arquivo de tema central** (`theme/`) com cores, espaçamentos e tipografia; todos os componentes leem de lá. Pode usar StyleSheet puro ou NativeWind (Tailwind) — escolha uma e seja consistente.
- **Componentize** o que se repete: `MemoryPin`, `MemoryCard`, `RevealSlider`, `MemorySheet` (ficha), `AppTabBar`, `SearchBar`, `Chip`, `OldPhoto`/`PhotoPlaceholder`.
- **Acessibilidade:** alvos ≥ 44px, `accessibilityLabel` nos botões, respeitar reduce-motion, suportar fonte grande.
- Ao introduzir uma lib nova ou um passo de setup não trivial (dev build, config de plugin), **explique brevemente o porquê** — o dev é intermediário e vai manter isso.

### Estrutura de pastas sugerida
```
app/            # rotas (Expo Router): mapa, ar, ficha/[id], adicionar, trilhas, perfil
components/     # MemoryPin, RevealSlider, MemorySheet, AppTabBar, ...
theme/          # colors.ts, typography.ts, spacing.ts
data/           # memories.ts, trails.ts, profile.ts (mock)
types/          # Memory, Trail, UserProfile
assets/         # fontes, placeholders
```

---

## 8. Arquivos de referência na pasta
- **`foiaqui-prototipo.html`** — protótipo navegável. Referência de **fluxo e estrutura** das telas (mapa, AR, ficha com slider, adicionar, trilhas, perfil). A **aparência está superada** — ver seção 3.
- **`design/`** — as três direções de identidade estudadas e a escolhida (Placa Esmaltada), como artboards.
- **`FoiAqui-UX.xlsx`** — pesquisa completa: entrevista com o PO, benchmarking (Google Maps, Historypin, Pokémon GO), comparativo de features com prioridades, decisões de design justificadas, e o Business Model Canvas.

---

## 9. Onde o projeto está

Tema, navegação, as 7 telas e a identidade "Placa Esmaltada" estão implementados e rodando (dados mockados). O que falta está na **Rota do FoiAqui** — plano em 6 fases ancorado na pesquisa, com a Fase 0 concluída. A Fase 1 começa por um development build no EAS, que é o que destrava trocar o `<MapCanvas>` desenhado pelo `react-native-maps`.
