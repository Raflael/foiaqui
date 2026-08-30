import type { Memory } from '@/types';

/**
 * A fila de revisão: memórias enviadas por outras pessoas, esperando parecer.
 *
 * Por que existe um acervo separado do `memories.ts`: aquelas já passaram pela
 * comunidade e estão publicadas. Estas ainda não. Misturar os dois faria a
 * fila encolher conforme você revisa e nunca mais voltar, o que é correto —
 * mas apagaria a distinção entre "o que a cidade já aceitou" e "o que está
 * sendo decidido agora", que é justamente o que a Fase 2 quer mostrar.
 *
 * O conteúdo é semeado e fictício, como todo o acervo deste protótipo. Foi
 * escrito para ENSINAR A RÉGUA: três dos cinco itens reprovam, cada um em um
 * critério diferente, e dois passam. Uma fila só de casos bons treina o
 * revisor a apertar "aprovar" sem ler; uma fila só de casos ruins treina o
 * contrário. Nenhum dos dois é revisão.
 *
 * Nenhum é seu: você não revisa a própria memória (ver `store/moderacao.ts`).
 */
export const filaSemeada: Memory[] = [
  {
    id: 'fila-padaria',
    title: 'Padaria Santa Cecília',
    shortName: 'Santa Cecília',
    marker: 'Aqui funcionou',
    period: '1968 — 1991',
    year: '1968',
    era: 'Anos 60',
    place: 'Rua Rubião Júnior, 88',
    coords: { lat: -23.1786, lng: -45.8848 },
    story:
      'A padaria abria às quatro da manhã e o cheiro subia a rua inteira. Meu pai trabalhava no balcão e dizia que dava para saber a hora pelo movimento: às seis vinham os operários, às oito as mães voltando da escola. Fechou em 91, quando o dono adoeceu. Tenho a foto da fachada com o toldo listrado.',
    author: { name: 'Marcos R.', level: 2, role: 'Explorador · Nível 2' },
    kind: 'Foto + relato',
    verified: false,
    status: 'em_revisao',
    media: [{ type: 'photo', uri: 'past' }],
    tags: ['Comércio', 'Centro', 'Anos 60'],
  },
  {
    id: 'fila-pastel',
    title: 'O melhor pastel da cidade',
    shortName: 'Pastelaria',
    marker: 'Aqui está',
    period: '2024',
    year: '2024',
    era: 'Atual',
    place: 'Av. São José, 1200',
    coords: { lat: -23.1812, lng: -45.8871 },
    story:
      'Gente, o pastel daqui é imperdível! Massa fininha, recheio generoso e o caldo de cana é o melhor da região. Atendimento nota mil, o Seu Jorge é super gente boa. Abre de terça a domingo, das 10h às 20h. Peçam o de carne com queijo, vocês não vão se arrepender!',
    author: { name: 'Dani P.', level: 1, role: 'Exploradora · Nível 1' },
    kind: 'Foto + relato',
    verified: false,
    status: 'em_revisao',
    media: [{ type: 'photo', uri: 'present' }],
    tags: ['Comércio'],
  },
  {
    id: 'fila-tunel',
    title: 'O túnel embaixo da rua',
    shortName: 'Túnel',
    marker: 'Aqui teria',
    period: 'Não sei',
    year: '—',
    era: 'Antiga',
    place: 'Rua Sete de Setembro, altura do 400',
    coords: { lat: -23.1802, lng: -45.8863 },
    story:
      'Sempre ouvi falar que existe um túnel embaixo desta rua, que ligava a igreja à antiga cadeia. Um senhor no bar me contou que o avô dele tinha entrado quando era criança. Nunca vi foto nem documento, e não sei de que época seria, mas todo mundo aqui já ouviu essa história.',
    author: { name: 'Bia F.', level: 1, role: 'Exploradora · Nível 1' },
    kind: 'Relato',
    verified: false,
    status: 'em_revisao',
    media: [],
    tags: ['Mistério', 'Centro'],
  },
  {
    id: 'fila-alagamento',
    title: 'A enchente de 83',
    shortName: 'Enchente de 83',
    marker: 'Aqui aconteceu',
    period: '1983',
    year: '1983',
    era: 'Anos 80',
    place: 'Rua Paraibuna, 200',
    coords: { lat: -23.1774, lng: -45.8893 },
    story:
      'Na enchente de 1983 a água subiu até a altura do peito lá na Praça Afonso Pena, uns três quarteirões daqui. Os comerciantes tiraram tudo dos porões e passaram a noite na igreja. Foi a maior que essa cidade viu. Meu tio guardou o jornal do dia seguinte com a foto do coreto ilhado.',
    author: { name: 'Wilson T.', level: 3, role: 'Contador de histórias · Nível 3' },
    kind: 'Foto + relato',
    verified: false,
    status: 'em_revisao',
    media: [{ type: 'photo', uri: 'past' }],
    tags: ['Enchente', 'Anos 80'],
  },
  {
    id: 'fila-oficina',
    title: 'Oficina do Seu Nelson',
    shortName: 'Oficina',
    marker: 'Aqui funcionou',
    period: '1975 — 2003',
    year: '1975',
    era: 'Anos 70',
    place: 'Rua Paraibuna, 340',
    coords: { lat: -23.1779, lng: -45.8881 },
    story:
      'Consertava bicicleta de todo mundo do bairro, e quem não tinha dinheiro pagava depois — ou não pagava. Ele morreu em 2003 e a oficina virou estacionamento. Gravei minha mãe contando dessa época, ela lembra do nome de cada criança que ia lá.',
    author: { name: 'Cléo M.', level: 2, role: 'Exploradora · Nível 2' },
    kind: 'Foto + microdoc',
    verified: false,
    status: 'em_revisao',
    media: [
      { type: 'photo', uri: 'past' },
      { type: 'audio', uri: 'relato-cleo' },
    ],
    audioSeconds: 48,
    tags: ['Comércio', 'Bairro', 'Anos 70'],
  },
];
