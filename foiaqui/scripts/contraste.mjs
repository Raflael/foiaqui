/**
 * Auditoria de contraste do FoiAqui — WCAG 2.1 AA.
 *
 * Rode com `npm run contraste`. Falha (exit 1) se qualquer par reprovar.
 *
 * Por que existe: "achamos que dá pra ler" não é um critério. A persona
 * principal tem 70 anos e o contexto de uso definido pela pesquisa é "sol na
 * tela, mão ocupada" — então contraste aqui é requisito, não capricho.
 *
 * O que ele mede além do óbvio: os fundos TRANSLÚCIDOS. Um texto sobre vidro
 * não está sobre a cor do vidro, está sobre a mistura do vidro com o que
 * passa por baixo — o mapa, ou a câmera apontada para o céu. Foi exatamente
 * aí que se escondia a pior falha do app.
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/theme/colors.ts', import.meta.url), 'utf8');
const C = Object.fromEntries([...src.matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2]]));

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
const lum = (h) =>
  rgb(h)
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((a, c, i) => a + [0.2126, 0.7152, 0.0722][i] * c, 0);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const hex = (r) => '#' + r.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
/** cor `fg` com opacidade `a` composta sobre `bg` */
const sobre = (fg, a, bg) => hex(rgb(fg).map((c, i) => c * a + rgb(bg)[i] * (1 - a)));

const BRANCO = '#FFFFFF'; // pior caso de câmera/capa: céu estourado

// fundos derivados, do jeito que a pessoa realmente vê
const vidroClaro = sobre(C.cal, 0.86, C.mapaAgua); //  chrome do mapa sobre a água
const vidroEscuro = sobre(C.esmalteFundo, 0.9, BRANCO); //  chrome da AR contra o céu
const chromeAR = sobre(C.esmalteFundo, 0.93, BRANCO);
const veuCapa = sobre(C.esmalteFundo, 0.94, BRANCO);

/** [texto, fundo, onde] */
const PARES = [
  [C.grafite, C.cal, 'texto principal na cidade'],
  [C.grafite, C.cal2, 'texto em superfície elevada'],
  [C.grafite, C.cal3, 'texto em superfície fundo'],
  [C.grafiteDim, C.cal, 'texto secundário'],
  [C.grafiteDim, C.cal2, 'texto secundário elevado'],
  [C.grafiteDim, C.cal3, 'texto secundário fundo'],
  [C.grafite, C.mapaFundo, 'texto sobre o mapa'],
  [C.grafiteDim, C.mapaFundo, 'texto secundário sobre o mapa'],
  [C.sobreEsmalte, C.esmalte, 'letra na chapa'],
  [C.sobreEsmalte, C.esmalteFundo, 'letra na chapa funda'],
  [C.sobreEsmalteDim, C.esmalte, 'letra dim na chapa'],
  [C.sobreEsmalteDim, C.esmalteFundo, 'letra dim na chapa funda'],
  [C.sobreFerrugem, C.ferrugem, 'letra no botão de ação'],
  [C.sobreEsmalte, C.conferido, 'letra no botão Aprovar da moderação'],
  [C.ferrugem, C.cal, 'ação sobre a cidade'],
  [C.esmalte, C.cal, 'memória sobre a cidade'],
  [C.esmalte, C.cal2, 'memória em superfície elevada'],
  [C.conferido, C.cal, 'conferido pela comunidade'],
  [C.conferido, C.cal2, 'conferido em superfície elevada'],
  // os translúcidos — onde o fundo é o mundo
  [C.grafite, vidroClaro, 'vidro do mapa · texto'],
  [C.grafiteDim, vidroClaro, 'vidro do mapa · secundário'],
  [C.ferrugem, vidroClaro, 'vidro do mapa · contagem em ferrugem'],
  [C.esmalte, vidroClaro, 'vidro do mapa · número'],
  [C.sobreEsmalte, vidroEscuro, 'vidro da AR contra o céu'],
  [C.sobreEsmalteDim, vidroEscuro, 'vidro da AR · secundário'],
  [C.sobreEsmalte, chromeAR, 'card da AR · título'],
  [C.ferrugemSobreEscuro, chromeAR, 'card da AR · distância'],
  [C.sobreEsmalte, veuCapa, 'capa de trilha · título'],
  [C.ferrugemSobreEscuro, veuCapa, 'capa de trilha · tema'],
];

let reprovas = 0;
console.log('\n  FoiAqui — contraste WCAG AA (4.5:1 para texto normal)\n');
for (const [fg, bg, onde] of PARES) {
  const r = ratio(fg, bg);
  const ok = r >= 4.5;
  if (!ok) reprovas++;
  console.log(
    `  ${ok ? '  AA ' : 'FALHA'}  ${r.toFixed(2).padStart(5)}:1   ${onde.padEnd(34)} ${fg} sobre ${bg}`,
  );
}
const total = PARES.length;
console.log(`\n  ${total - reprovas} de ${total} pares passam em AA\n`);
process.exit(reprovas === 0 ? 0 : 1);
