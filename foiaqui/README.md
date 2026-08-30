# FoiAqui — o app

> **A documentação do projeto está na raiz do repositório: [`../README.md`](../README.md).**

Esta pasta é só o aplicativo Expo. O que você precisa saber antes de rodar:

> [!WARNING]
> **O Expo Go não abre este projeto.** Desde que o mapa virou `react-native-maps`,
> há código nativo e é preciso um *development build*.

```bash
npm install

# uma vez: gera o APK de desenvolvimento (~15 min)
npx eas-cli build --profile development --platform android

# dia a dia
npx expo start --dev-client
```

Antes de commitar:

```bash
npx tsc --noEmit    # tipos
npm run contraste   # WCAG AA — falha se algum par reprovar
```

As regras de código (tema, tipografia, convenções) estão em [`CLAUDE.md`](CLAUDE.md),
e a fonte de verdade do produto e do design em [`../CLAUDE.md`](../CLAUDE.md).
