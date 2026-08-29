# FoiAqui

> Aponte a câmera e veja o que foi aqui.

App de **memória urbana colaborativa**. A pessoa aponta o celular para um lugar
— rua, prédio, praça — e vê as histórias, fotos antigas e relatos ligados àquele
ponto. Qualquer um pode adicionar memórias; a comunidade modera.

Projeto de UX (metodologia Duplo Diamante) com protótipo em React Native.
Cidade-piloto: Santos-SP.

---

## Estado atual

**Protótipo navegável com dados mockados.** As 7 telas do sitemap existem e
funcionam; nada persiste ainda.

| Tela | Aparência | Comportamento |
|---|---|---|
| Mapa | pronta | mapa desenhado (SVG), busca e filtros não filtram |
| Ficha da memória | pronta | bottom sheet com slider passado↔presente funcionando |
| Câmera AR | pronta | câmera real + cards em posição fixa |
| Adicionar | pronta | fluxo de 4 passos; captura de mídia simulada |
| Trilhas · Salvos · Perfil | prontas | listas mockadas; acessibilidade funcionando |

O que falta está mapeado em fases — ver **Documentos** abaixo.

## Rodar

Precisa de Node 20+ e do **Expo Go do SDK 57** (o da loja de apps não serve:
o SDK 57 tem um build próprio, publicado no
[GitHub do Expo](https://github.com/expo/expo-go-releases)).

```bash
cd foiaqui
npm install
npx expo start
```

Pelo cabo USB, com o Android SDK instalado:

```bash
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent
```

## Estrutura

```
CLAUDE.md                 fonte única de verdade do produto e do design
FoiAqui-UX.xlsx           pesquisa: entrevista com a PO, benchmarking, 12 decisões, BMC
foiaqui-prototipo.html    protótipo original — referência de FLUXO (aparência superada)
design/                   as 3 direções de identidade estudadas e o documento da escolhida
foiaqui/                  o app
  src/theme/              cores, tipografia, espaçamento — nada de hex solto fora daqui
  src/components/         Plaque, MemorySheet, MemoryPin, RevealSlider, Type...
  src/app/                rotas (Expo Router)
  src/data/               mocks
  src/store/              estado global (Zustand)
```

## Identidade visual

**Placa Esmaltada** — a placa de rua brasileira de chapa esmaltada dos anos
1930–80: fundo azul, letra e moldura em branco. Ela sumiu das cidades quando
trocaram por alumínio e PVC, o que faz dela, ela mesma, uma memória urbana
desaparecendo.

E placas comemorativas escrevem literalmente **"AQUI FUNCIONOU"**. O nome do app
é a fala da placa — por isso cada memória abre com o seu verbo, e o tempo verbal
já conta se a coisa sobreviveu:

| Memória | Marcador | O que isso diz |
|---|---|---|
| Cine Marrocos | AQUI FUNCIONOU | acabou |
| Coreto da Praça | AQUI FICAVA | foi demolido |
| Mural do Beco | AQUI ESTÁ | continua lá |

A regra estrutural: **cal** é a cidade de dia (onde a pessoa anda), **esmalte**
é a memória marcada no lugar, **ferrugem** é o tempo agindo (ações). Canto reto
é o padrão; curva é exceção reservada ao que é corpo.

Todos os 16 pares de texto/fundo do app passam no WCAG 2.1 AA, medidos —
não estimados. Cor nova só entra depois de medida.

## Acessibilidade

Não é opcional: a persona principal, Íris, tem 70 anos e vai usar isto em pé,
na rua, no sol.

- Alvos de toque ≥ 44px em tudo que é tocável
- Contraste AA medido em cada par
- "Fonte grande" atravessa todo texto do app
- "Modo simples" desliga animação e opacifica o chrome
- Toda animação decorativa respeita `prefers-reduced-motion`

## Documentos

- **Placa Esmaltada** — o sistema visual: de onde veio cada cor, letra e canto,
  e o que foi descartado.
- **Rota do FoiAqui** — o plano em 6 fases e 82 tarefas, cada uma ancorada numa
  evidência da pesquisa.

## Stack

Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · Reanimated 4 ·
react-native-svg · Zustand

O mapa é um `<MapCanvas>` desenhado em SVG, não `react-native-maps` — essa lib
precisa de código nativo e não roda no Expo Go. A troca está na Fase 1 do plano
e exige um development build.
