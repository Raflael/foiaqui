/**
 * Gera o PDF do dossiê a partir de `docs/dossie.html`.
 *
 * Rode com `npm run dossie`. Sai em `docs/FoiAqui-Dossie.pdf`.
 *
 * Por que existe: o dossiê é publicado como página, e página é o formato certo
 * para ler. Mas trabalho se entrega em PDF, e imprimir pelo navegador dá um
 * resultado diferente em cada máquina — margem, escala, se os fundos saem ou
 * não. Aqui o comando é sempre o mesmo, então o PDF é sempre o mesmo.
 *
 * `docs/dossie.html` é o MESMO arquivo publicado como artefato: ele não traz
 * <html>/<head> porque o publicador embrulha isso. Este script põe o embrulho
 * de volta num arquivo temporário — assim existe uma fonte só, e o PDF não
 * pode divergir da página.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const caminho = (rel) => fileURLToPath(new URL(rel, import.meta.url));

const NAVEGADORES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const navegador = NAVEGADORES.find((p) => existsSync(p));
if (!navegador) {
  console.error('Nenhum Chrome ou Edge encontrado — o PDF precisa de um deles para renderizar.');
  process.exit(1);
}

/**
 * As fontes saem do DISCO, dos mesmos arquivos que o app empacota.
 *
 * Duas tentativas anteriores falharam em silêncio, e o modo de falhar é o que
 * torna isso perigoso: o texto aparece, só que na fonte errada.
 *
 *  1. Deixar o <link> do Google Fonts e mandar o Chrome esperar. Em headless a
 *     busca não termina dentro do orçamento de tempo virtual → tudo em Arial.
 *  2. Baixar o CSS do Google com User-Agent antigo para receber TTF. Ele
 *     devolve um arquivo por família, mas só o peso 400 — e o documento usa
 *     600 e 700 em quase todo título.
 *
 * Ler de `node_modules/@expo-google-fonts` resolve os dois: são exatamente as
 * fontes que o aplicativo usa, com o peso certo, sem rede e sem negociação de
 * formato. O PDF passa a ser reproduzível offline.
 */
const FACES = [
  ['Archivo', 400, 'normal', 'archivo/400Regular/Archivo_400Regular.ttf'],
  ['Archivo', 500, 'normal', 'archivo/500Medium/Archivo_500Medium.ttf'],
  ['Archivo', 600, 'normal', 'archivo/600SemiBold/Archivo_600SemiBold.ttf'],
  ['Archivo', 700, 'normal', 'archivo/700Bold/Archivo_700Bold.ttf'],
  ['Archivo Narrow', 600, 'normal', 'archivo-narrow/600SemiBold/ArchivoNarrow_600SemiBold.ttf'],
  ['Archivo Narrow', 700, 'normal', 'archivo-narrow/700Bold/ArchivoNarrow_700Bold.ttf'],
  ['Newsreader', 400, 'normal', 'newsreader/400Regular/Newsreader_400Regular.ttf'],
  ['Newsreader', 500, 'normal', 'newsreader/500Medium/Newsreader_500Medium.ttf'],
  ['Newsreader', 400, 'italic', 'newsreader/400Regular_Italic/Newsreader_400Regular_Italic.ttf'],
  ['DM Mono', 400, 'normal', 'dm-mono/400Regular/DMMono_400Regular.ttf'],
  ['DM Mono', 500, 'normal', 'dm-mono/500Medium/DMMono_500Medium.ttf'],
];

function cssDasFontes() {
  const partes = [];
  const faltando = [];

  for (const [familia, peso, estilo, rel] of FACES) {
    const arquivo = caminho('../node_modules/@expo-google-fonts/' + rel);
    if (!existsSync(arquivo)) {
      faltando.push(rel);
      continue;
    }
    const b64 = readFileSync(arquivo).toString('base64');
    partes.push(
      `@font-face{font-family:'${familia}';font-style:${estilo};font-weight:${peso};` +
        `src:url(data:font/truetype;charset=utf-8;base64,${b64}) format('truetype');}`,
    );
  }

  if (faltando.length) {
    // falhar alto: PDF na fonte errada é pior que PDF nenhum, porque parece pronto
    console.error('Fontes não encontradas em node_modules:\n  ' + faltando.join('\n  '));
    console.error('Rode `npm install` antes de gerar o PDF.');
    process.exit(1);
  }

  console.log('  ' + partes.length + ' faces embutidas do disco');
  return partes.join('\n');
}

const fonte = readFileSync(caminho('../../docs/dossie.html'), 'utf8');
const css = cssDasFontes();

// o <link> do Google Fonts sai: as fontes agora vêm embutidas
const corpo = fonte.replace(/<link rel="stylesheet" href="https:[^>]*fonts\.googleapis[^>]*>/, '');

const pagina = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>${css}</style>
<style>
  :root { color-scheme: light; }
  body { margin: 0; }
  img { max-width: 100%; }
</style>
${corpo}
</body>
</html>`;

const trabalho = join(tmpdir(), 'foiaqui-dossie');
mkdirSync(trabalho, { recursive: true });
const html = join(trabalho, 'dossie.html');
writeFileSync(html, pagina, 'utf8');

const saida = caminho('../../docs/FoiAqui-Dossie.pdf');

console.log('  renderizando com ' + navegador.split(/[\\/]/).pop());
execFileSync(
  navegador,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--virtual-time-budget=4000',
    `--user-data-dir=${join(trabalho, 'perfil')}`,
    `--print-to-pdf=${saida}`,
    'file:///' + html.split('\\').join('/'),
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
);

rmSync(trabalho, { recursive: true, force: true });
console.log('  docs/FoiAqui-Dossie.pdf gerado');
