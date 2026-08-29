<p align="center">
  <img src=".github/banner.svg" alt="FoiAqui — memória urbana colaborativa" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK%2057-14396E?style=flat-square" alt="Expo SDK 57">
  <img src="https://img.shields.io/badge/TypeScript-strict-14396E?style=flat-square" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/contraste-16%2F16%20WCAG%20AA-2E6E68?style=flat-square" alt="16 de 16 pares passam no WCAG AA">
  <img src="https://img.shields.io/badge/fase-1%20de%206-B4471F?style=flat-square" alt="Fase 1 de 6">
</p>

---

App de **memória urbana colaborativa**. A pessoa aponta o celular para um lugar
— rua, prédio, praça — e vê as histórias, fotos antigas e relatos ligados àquele
ponto. Qualquer um pode adicionar memórias; a comunidade modera.

Projeto de UX pela metodologia Duplo Diamante, com protótipo em React Native.
Cidade-piloto: **Santos-SP**.

> [!NOTE]
> Protótipo navegável com dados mockados. As 7 telas do sitemap funcionam;
> nada persiste ainda. O caminho até um app real está mapeado em 6 fases.

<br>

## O que já existe

| Tela | Aparência | Comportamento |
|:--|:--|:--|
| **Mapa** | pronta | pins filtram por época, tema e distância real |
| **Ficha da memória** | pronta | bottom sheet sobre o mapa, com slider passado↔presente |
| **Câmera AR** | pronta | câmera real, cards fixos, saída automática por inatividade |
| **Adicionar** | pronta | fluxo de 4 passos; captura de mídia ainda simulada |
| **Trilhas · Salvos · Perfil** | prontas | listas mockadas; acessibilidade funcionando |

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
é a memória marcada no lugar · `ferrugem` é o tempo agindo. Canto reto é o
padrão; curva é exceção reservada ao que é corpo.

<br>

## Acessibilidade

> [!IMPORTANT]
> Não é opcional. A persona principal, Íris, tem 70 anos e vai usar isto
> em pé, na rua, no sol.

- Alvos de toque **≥ 44px** em tudo que é tocável
- Contraste **AA medido**, não estimado — os 16 pares do app passam
- **"Fonte grande"** atravessa todo texto do app
- **"Modo simples"** desliga animação e aumenta o contraste do chrome
- Toda animação decorativa respeita `prefers-reduced-motion`

O app é claro justamente por isso: a pesquisa define o contexto de uso como
*"sol na tela, mão ocupada, sinal instável"*, e interface escura sob sol direto
é pior de ler.

<br>

## Rodar

> [!WARNING]
> O Expo Go da loja **não serve**. O SDK 57 tem um build próprio, publicado no
> [GitHub do Expo](https://github.com/expo/expo-go-releases).

```bash
cd foiaqui
npm install
npx expo start
```

<details>
<summary><b>Pelo cabo USB</b> (com Android SDK instalado)</summary>

<br>

```bash
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent
```

Deep link para uma tela específica: `exp://127.0.0.1:8081/--/perfil`

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
  src/components/         Plaque, MemorySheet, MemoryPin, RevealSlider, Type...
  src/app/                rotas (Expo Router)
  src/data/               mocks e cálculo de distância
  src/store/              estado global (Zustand)
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
- A ficha da memória **não é rota**: é estado (`store/sheet.ts`). Isso vem da
  Decisão 2 da pesquisa — abrir uma memória não pode empilhar navegação nem
  esconder o mapa.
- Cor nova entra só depois de medido o contraste.

</details>

<br>

## Stack

**Expo SDK 57** · React Native 0.86 · TypeScript · Expo Router · Reanimated 4 ·
react-native-svg · Zustand

O mapa é um `<MapCanvas>` desenhado em SVG, não `react-native-maps` — essa lib
precisa de código nativo e não roda no Expo Go. A troca está na Fase 1 e exige
um development build.

<br>

---

<p align="center">
  <sub>
    <b>Placa Esmaltada</b> — o sistema visual, de onde veio cada escolha<br>
    <b>Rota do FoiAqui</b> — o plano em 6 fases e 82 tarefas, ancorado na pesquisa
  </sub>
</p>
