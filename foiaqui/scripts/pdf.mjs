/**
 * Imprime qualquer página de `docs/` em PDF.
 *
 *   npm run pdf                            todas as páginas de docs/
 *   node scripts/pdf.mjs personas rota     só estas
 *   npm run dossie                         só o dossiê
 *
 * Substitui o antigo `dossie-pdf.mjs`, que fazia isto para um arquivo só. Com
 * cinco documentos a mesma máquina copiada cinco vezes seria cinco lugares
 * para o embutimento de fonte sair de sincronia.
 *
 * Por que existe, e não "imprima pelo navegador": impressão manual dá um
 * resultado diferente em cada máquina — margem, escala, se os fundos saem ou
 * não. Aqui o comando é sempre o mesmo, então o PDF é sempre o mesmo.
 *
 * As páginas de `docs/` não trazem <html>/<head> porque o publicador de
 * artefatos embrulha isso. Este script põe o embrulho de volta num arquivo
 * temporário — assim existe uma fonte só, e o PDF não pode divergir da página.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
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
 *     devolve um arquivo por família, mas só o peso 400 — e os documentos usam
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

  return partes.join('\n');
}

/**
 * Regras que só valem no papel.
 *
 * **A armadilha do A4.** A folha tem 210 mm; tirando as margens sobram 186 mm,
 * que o Chrome converte para cerca de 703 px de CSS. Isso é MENOR que o ponto
 * de virada de 760 px onde o mapa de empatia passa para o empilhamento de
 * celular — então o PDF saía com a versão de telefone: X escondido, quadrantes
 * um embaixo do outro. A página parecia certa e o PDF não, sem nada no código
 * indicando por quê.
 *
 * Por isso os blocos que mudam por largura são reafirmados aqui: no papel a
 * largura é conhecida e fixa, e o layout tem que ser o de tela larga
 * independentemente do número.
 *
 * O resto: a folha não rola de lado, então a largura mínima das tabelas some e
 * a fonte encolhe o suficiente para o quadro caber. E `break-inside: avoid`
 * nos blocos que se leem juntos — persona partida ao meio entre duas páginas é
 * o defeito mais comum de PDF gerado de página web.
 */
const CSS_IMPRESSAO = `
  @page { size: A4; margin: 12mm; }
  :root { color-scheme: light; }
  body { margin: 0; }
  img, svg { max-width: 100%; }
  .wrap { max-width: none !important; padding: 0 !important; }
  .scroll { overflow: visible !important; }
  table { min-width: 0 !important; width: 100% !important; }
  table.jornada, table.specs { font-size: .58rem; table-layout: fixed; }
  /* nowrap é regra de tela: lá a tabela rola de lado e o texto comprido some
     na rolagem. No papel ele vaza para a coluna vizinha. */
  table.jornada th, table.jornada td, table.specs th, table.specs td {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .j-sub { font-size: .55rem; }
  .j-etapa { font-size: .95rem; }
  table.jornada th, table.jornada td, table.specs th, table.specs td { padding: 5px 6px; }

  /* o mapa de empatia volta a ser os quatro quadrantes com o X, como na tela */
  .mapa {
    grid-template-columns: 1fr auto 1fr !important;
    grid-template-areas:
      "topo topo topo"
      "esq  face dir"
      "base base base" !important;
    gap: 8px !important;
  }
  .mapa-x { display: block !important; }
  .quad-rotulo { text-align: center !important; }
  .notas { justify-content: center !important; }
  .nota { max-width: 168px !important; font-size: .74rem; }
  .caixa .notas { justify-content: flex-start !important; }
  .mapa-baixo { grid-template-columns: 1fr 1fr !important; }

  /* e os pares que também dependem de largura */
  .achados { grid-template-columns: 1fr 1fr !important; }
  .ficha { grid-template-columns: repeat(4, 1fr) !important; }

  .persona, .mapa, .mapa-baixo, .achado, .caixa, .j-painel, .flag, .fonte, table {
    break-inside: avoid;
  }
  h2, h3 { break-after: avoid; }
  a { color: inherit; text-decoration: none; }
`;

/**
 * Sem argumento, imprime TUDO que existe em docs/.
 *
 * A lista era cravada no package.json, e por isso a rota ficou sem PDF sem
 * ninguém notar: documento novo não entrava na lista, e lista que precisa ser
 * lembrada é lista que sai de sincronia. Ler a pasta é a única versão que não
 * esquece.
 */
const nomes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(caminho('../../docs/'))
      .filter((f) => f.endsWith('.html'))
      .map((f) => f.replace(/\.html$/, ''))
      .sort();

const css = cssDasFontes();
console.log(FACES.length + ' faces embutidas do disco · ' + navegador.split(/[\\/]/).pop());

const trabalho = join(tmpdir(), 'foiaqui-pdf');
mkdirSync(trabalho, { recursive: true });

for (const nome of nomes) {
  const entrada = caminho('../../docs/' + nome + '.html');
  if (!existsSync(entrada)) {
    console.error('  não achei docs/' + nome + '.html');
    process.exitCode = 1;
    continue;
  }

  // o <link> do Google Fonts sai: as fontes agora vêm embutidas
  const corpo = readFileSync(entrada, 'utf8')
    .replace(/<link rel="preconnect"[^>]*>/g, '')
    .replace(/<link rel="stylesheet" href="https:[^>]*fonts\.googleapis[^>]*>/, '');

  const pagina = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>${css}</style>
</head>
${corpo}

<!-- por último de propósito: assim vence o CSS da página no desempate -->
<style>${CSS_IMPRESSAO}</style>
</body>
</html>`;

  const html = join(trabalho, nome + '.html');
  writeFileSync(html, pagina, 'utf8');

  const saida = caminho('../../docs/pdf/' + nome + '.pdf');
  mkdirSync(caminho('../../docs/pdf/'), { recursive: true });

  execFileSync(
    navegador,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--virtual-time-budget=6000',
      `--user-data-dir=${join(trabalho, 'perfil')}`,
      `--print-to-pdf=${saida}`,
      'file:///' + html.split('\\').join('/'),
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  console.log('  docs/pdf/' + nome + '.pdf');
}

rmSync(trabalho, { recursive: true, force: true });
