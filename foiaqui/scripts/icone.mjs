/**
 * Gera o ícone do app a partir da identidade, não de um desenho solto.
 *
 * Rode com `npm run icone`. Reescreve os PNGs em assets/images/.
 *
 * O ícone é a própria assinatura do sistema: a chapa esmaltada com a moldura
 * branca embutida, e a lasca de ferrugem na borda. Nada de letra — em 48dp na
 * gaveta do celular, sigla vira borrão, e a moldura não. É a mesma forma que
 * o componente `Plaque` desenha dentro do app, o que faz o ícone e a interface
 * dizerem a mesma coisa.
 *
 * Por que um script e não um arquivo: as cores vêm de `theme/colors.ts`. Se a
 * paleta mudar, o ícone acompanha — em vez de virar a única peça do produto
 * ainda pintada com a cor antiga.
 *
 * As três peças do Android têm recortes diferentes. O `foreground` adaptativo
 * é mascarado em círculo ou squircle e perde cerca de um sexto de cada lado,
 * então a moldura ali é bem menor que no ícone antigo de bordas quadradas.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Jimp from 'jimp-compact';

const src = readFileSync(new URL('../src/theme/colors.ts', import.meta.url), 'utf8');
const C = Object.fromEntries([...src.matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2]]));

/**
 * O caminho do projeto tem espaços, e `new URL(...).pathname` os devolve como
 * %20 — gravar por ali cria uma pasta fantasma com o nome codificado, sem
 * erro nenhum. `fileURLToPath` é o único jeito correto no Windows.
 */
const caminho = (rel) => fileURLToPath(new URL(rel, import.meta.url));

const S = 1024;
const hex = (h, a = 255) => (parseInt(h.slice(1), 16) << 8) + a >>> 0;

const ESMALTE = hex(C.esmalte);
const BRANCO = hex(C.sobreEsmalte);
const FERRUGEM = hex(C.ferrugem);
const TRANSPARENTE = 0x00000000;

/** desenha um retângulo cheio */
const rect = (img, x, y, w, h, cor) => {
  const bloco = new Jimp(Math.round(w), Math.round(h), cor);
  img.composite(bloco, Math.round(x), Math.round(y));
};

/** a moldura embutida: quatro barras, canto reto */
function moldura(img, inset, espessura, cor) {
  const lado = S - inset * 2;
  rect(img, inset, inset, lado, espessura, cor);
  rect(img, inset, S - inset - espessura, lado, espessura, cor);
  rect(img, inset, inset, espessura, lado, cor);
  rect(img, S - inset - espessura, inset, espessura, lado, cor);
}

async function gerar() {
  // 1. ícone quadrado (iOS e fallback): chapa cheia, moldura, lasca
  const icone = new Jimp(S, S, ESMALTE);
  moldura(icone, 118, 36, BRANCO);
  // a lasca: a marca do tempo que toda placa velha tem
  rect(icone, S - 74, 396, 74, 232, FERRUGEM);
  await icone.writeAsync(caminho('../assets/images/icon.png'));

  // 2. foreground adaptativo: só a moldura, recuada para sobreviver à máscara
  const frente = new Jimp(S, S, TRANSPARENTE);
  moldura(frente, 296, 30, BRANCO);
  rect(frente, S - 296 - 30, 452, 30, 160, FERRUGEM);
  await frente.writeAsync(caminho('../assets/images/android-icon-foreground.png'));

  // 3. background adaptativo: a chapa, lisa
  const fundo = new Jimp(S, S, ESMALTE);
  await fundo.writeAsync(caminho('../assets/images/android-icon-background.png'));

  // 4. monocromático (tema dinâmico do Android 13+): a mesma forma, sólida
  const mono = new Jimp(S, S, TRANSPARENTE);
  moldura(mono, 296, 30, BRANCO);
  await mono.writeAsync(caminho('../assets/images/android-icon-monochrome.png'));

  // 5. splash: a chapa pequena sobre o cal, sem lasca — a abertura é limpa
  const splash = new Jimp(S, S, TRANSPARENTE);
  rect(splash, 212, 212, 600, 600, ESMALTE);
  moldura(splash, 212 + 34, 26, BRANCO);
  await splash.writeAsync(caminho('../assets/images/splash-icon.png'));

  console.log('  ícone, adaptativo, monocromático e splash gerados a partir de theme/colors.ts');
}

gerar().catch((e) => {
  console.error(e);
  process.exit(1);
});
