<p align="center">
  <img src=".github/banner.svg" alt="FoiAqui — memória urbana colaborativa" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK%2057-14396E?style=flat-square" alt="Expo SDK 57">
  <img src="https://img.shields.io/badge/React%20Native-0.86-14396E?style=flat-square" alt="React Native 0.86">
  <img src="https://img.shields.io/badge/TypeScript-strict-14396E?style=flat-square" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/contraste-28%2F28%20WCAG%20AA-2E6E68?style=flat-square" alt="28 de 28 pares passam no WCAG AA">
  <img src="https://img.shields.io/badge/fase%201-conclu%C3%ADda-B4471F?style=flat-square" alt="Fase 1 concluída">
</p>

---

App de **memória urbana colaborativa**. A pessoa aponta o celular para um lugar
— rua, prédio, praça — e vê as histórias, fotos antigas e relatos ligados àquele
ponto. Qualquer um pode adicionar memórias; a comunidade modera.

Projeto de UX pela metodologia Duplo Diamante, com protótipo em React Native.
Cidade-piloto: **São José dos Campos-SP**.

> [!NOTE]
> Protótipo funcional, sem backend. O que você cria fica gravado **no aparelho**
> (AsyncStorage) e não sai dele. Câmera, microfone, GPS e bússola são reais; o
> acervo inicial e as trilhas são dados semeados.

<br>

## O que já funciona

| Tela | O que faz de verdade |
|:--|:--|
| **Mapa** | `react-native-maps` com estilo próprio · busca por lugar, época e tema · filtros que filtram · pins que se agrupam quando ficariam empilhados · distância real até você |
| **Ficha da memória** | bottom sheet de três alturas sobre o mapa · slider passado↔presente · áudio que toca · compartilhar com deep link · memórias vizinhas por proximidade |
| **Câmera AR** | câmera real e **bússola**: os cards seguem a direção em que o aparelho aponta, somem fora do campo de visão e indicam para que lado girar · sai sozinha por inatividade |
| **Adicionar** | 4 passos · foto e vídeo pela câmera ou galeria · gravação de áudio · GPS com ajuste manual e geocodificação reversa · década **e** ano exato · rascunho salvo automaticamente |
| **Trilhas** | lista de percursos e tela de trilha com mini-mapa, paradas numeradas e traçado |
| **Salvos · Perfil** | acervo local · nível e conquistas derivados do uso real, não de números fixos |

<details>
<summary><b>E o que ainda não existe</b> — para ninguém se enganar com a demo</summary>

<br>

- **Sem backend e sem contas.** Nada sincroniza entre aparelhos.
- **A moderação é visual.** Memórias novas nascem `em_revisao` e aparecem
  marcadas, mas não há fila de revisão por pares ainda — é a Fase 2.
- **A AR não é AR.** É câmera com sobreposição orientada por bússola e GPS.
  ARKit/ARCore é Fase 6.
- **As fotos antigas são placeholders.** Gradientes, não acervo real.

</details>

<br>

## A ideia por trás da identidade

<table>
<tr><td width="55%" valign="top">

O sistema visual chama-se **Placa Esmaltada**. Vem da placa de rua brasileira
de chapa esmaltada dos anos 1930–80: fundo azul, letra e moldura em branco.

Ela sumiu das cidades quando trocaram por alumínio e PVC — o que faz dela, ela
mesma, uma memória urbana desaparecendo. O meio diz a mesma coisa que a mensagem.

E placas comemorativas escrevem literalmente **"AQUI FUNCIONOU"**. O nome do app
é a fala da placa.

</td><td width="45%" valign="top">

Por isso cada memória abre com o seu verbo — e o tempo verbal já conta se a
coisa sobreviveu, antes de você ler uma linha:

| Memória | Marcador | Diz |
|:--|:--|:--|
| Cine Marrocos | `AQUI FUNCIONOU` | acabou |
| Coreto da Praça | `AQUI FICAVA` | foi demolido |
| Mural do Beco | `AQUI ESTÁ` | continua lá |

</td></tr>
</table>

**A regra estrutural:** `cal` é a cidade de dia, onde a pessoa anda · `esmalte`
é a memória marcada no lugar · `ferrugem` é o tempo agindo. Não se misturam.
Canto reto é o padrão; curva é exceção reservada ao que é corpo — avatar, botão
de áudio, o FAB, a folha que sobe do rodapé.

**Quatro vozes tipográficas, uma por papel:** Archivo Narrow é a letra fundida
da chapa (título de memória, nome de tela) · Newsreader é a voz de quem viveu
(só relato e citação) · Archivo é a interface · DM Mono são datas e coordenadas.

<br>

## Acessibilidade

> [!IMPORTANT]
> Não é opcional. A persona principal da pesquisa, Íris, tem 70 anos e vai usar
> isto em pé, na rua, no sol.

- Alvos de toque **≥ 44px** em tudo que é tocável
- **"Fonte grande"** atravessa todo texto do app, por construção
- **"Modo simples"** desliga animação, troca blur por fundo opaco e reforça o contraste
- Toda animação decorativa respeita `prefers-reduced-motion`
- Contraste **medido por script**, não estimado — `npm run contraste`

O app é claro justamente por isso: a pesquisa define o contexto de uso como
*"sol na tela, mão ocupada, sinal instável"*, e interface escura sob sol direto
é pior de ler.

<details>
<summary><b>Por que o script de contraste mede fundo translúcido</b></summary>

<br>

Auditar cor contra cor deixava passar a pior falha do app. Texto sobre vidro não
está sobre a cor do vidro — está sobre a **mistura** dele com o que passa por
baixo. E o que passa por baixo da tela de AR é a câmera, que na rua aponta para
o céu.

Medido: com o vidro escuro a 0,62 de opacidade, o texto **branco** caía para
**3,83:1** contra um céu claro. Reprovava em AA exatamente na tela feita para
usar no sol. Hoje o vidro está a 0,90 e o par dá 9,42:1.

Os 28 pares auditados incluem esses compostos. O script falha o processo se
algum reprovar, então o número do badge acima é verificável:

```bash
cd foiaqui && npm run contraste
```

</details>

<br>

## Rodar

> [!WARNING]
> **O Expo Go não serve mais.** Desde que o mapa virou `react-native-maps`, o
> projeto tem código nativo e exige um *development build*. É uma vez só: depois
> de instalado o APK, o dia a dia é `npx expo start --dev-client` como sempre.

```bash
cd foiaqui
npm install

# uma vez: gera o APK de desenvolvimento na nuvem do EAS (~15 min)
npx eas-cli build --profile development --platform android

# dia a dia
npx expo start --dev-client
```

O mapa precisa de uma chave do Google Maps em `app.json`
(`android.config.googleMaps.apiKey`), restrita por *package name* + SHA-1.

<details>
<summary><b>Pelo cabo USB</b> (com Android SDK instalado)</summary>

<br>

```bash
adb reverse tcp:8081 tcp:8081
adb shell monkey -p com.raflael.foiaqui 1
```

</details>

<details>
<summary><b>Conferir antes de commitar</b></summary>

<br>

```bash
npx tsc --noEmit          # tipos
npm run contraste         # WCAG AA, 28 pares
npx expo export --platform android --output-dir .bundle-check   # o bundle fecha?
```

</details>

<br>

## Estrutura

```
CLAUDE.md                 fonte única de verdade do produto e do design
FoiAqui-UX.xlsx           pesquisa: entrevista com a PO, benchmarking, 12 decisões, BMC
foiaqui-prototipo.html    protótipo original — referência de FLUXO (aparência superada)
design/                   as 3 direções de identidade estudadas + o documento da escolhida
foiaqui/
  src/theme/              cores, tipografia, espaçamento — nada de hex solto fora daqui
  src/components/         Plaque, MemorySheet, MemoryPin, RevealSlider, Glass, Type...
  src/app/                rotas (Expo Router)
  src/data/               acervo semeado, distância, agrupamento de pins, estilo do mapa
  src/store/              estado global (Zustand); acervo, rascunho e ajustes persistem
  scripts/contraste.mjs   auditoria WCAG AA
```

<details>
<summary><b>Convenções que valem a pena saber antes de mexer</b></summary>

<br>

- Cor, tipo e espaçamento **só** via `@/theme`. Nenhum hex solto em componente.
- Texto **só** pelos componentes de `@/components/Type` — `Plaque`, `Story`,
  `Body`, `Mono`, `Eyebrow`. É o que aplica o "fonte grande".
- Animação decorativa passa por `useMotionEnabled()`, que respeita o
  reduce-motion do sistema e o "modo simples".
- Tab bar via `expo-router/js-tabs`; o `Tabs` de `expo-router` está deprecado
  no SDK 57.
- A ficha da memória **não é rota**: é estado (`store/sheet.ts`). Vem da
  Decisão 2 da pesquisa — abrir uma memória não pode empilhar navegação nem
  esconder o mapa.
- Pins agrupam por distância em **pixels**, não em metros: a sobreposição
  depende do zoom, não do terreno.
- Cor nova entra só depois de medida — `npm run contraste` reprova se não passar.

</details>

<br>

## Stack

**Expo SDK 57** · React Native 0.86 · React 19 · TypeScript · Expo Router ·
`react-native-maps` · Reanimated 4 · gesture-handler · Zustand + AsyncStorage ·
expo-camera · expo-audio · expo-location · react-native-svg

<br>

---

<p align="center">
  <sub>
    <b>Placa Esmaltada</b> — o sistema visual, de onde veio cada escolha<br>
    <b>Rota do FoiAqui</b> — o plano em 6 fases, ancorado na pesquisa
  </sub>
</p>
