@AGENTS.md

# FoiAqui — app

A **fonte única de verdade do produto** (identidade visual, tokens, sitemap,
prioridades MVP/v2/v3, regras de trabalho) está um nível acima, em
`../CLAUDE.md`. Leia esse arquivo antes de mexer aqui.

Referências na pasta de cima: `foiaqui-prototipo.html` (aparência e fluxo) e
`FoiAqui-UX.xlsx` (pesquisa, benchmarking, decisões).

## Convenções deste código

- Rotas em `src/app/` (Expo Router, alias `@/` → `src/`, `@/assets/` → `assets/`).
- Cor, tipo e espaçamento **só** via `@/theme` — nada de hex solto.
- Texto **só** pelos componentes de `@/components/Type` (`Display`/`Body`/`Mono`/
  `Eyebrow`): é o que aplica o "fonte grande" do perfil.
- Animação decorativa passa por `useMotionEnabled()` (`@/hooks/useMotion`),
  que respeita reduce-motion do sistema e o "modo simples".
- Tab bar: `expo-router/js-tabs` (o `Tabs` de `expo-router` está deprecado no
  SDK 57) com `tabBar` custom — a nativa não faz o FAB âmbar elevado.
- Front-only: dados de `src/data/`, estado global em `src/store/` (Zustand).
