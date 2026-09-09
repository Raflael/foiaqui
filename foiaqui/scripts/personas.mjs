/**
 * Gera as páginas de persona e mapa de empatia (entrega 2.1 e 2.2 do Define).
 *
 * Rode com `npm run personas`. Sai em `../docs/`:
 *   personas.html          o documento de pesquisa inteiro
 *   persona-camila.html    uma folha por persona, para apresentar
 *   persona-tiago.html
 *   persona-neuza.html
 *
 * Por que gerador e não quatro arquivos escritos à mão: as quatro páginas
 * compartilham o mesmo CSS, os mesmos retratos e os mesmos dados. Mantidas
 * separadas, uma correção pedida pelo professor viraria quatro edições e três
 * chances de esquecer uma. Aqui a persona existe em UM lugar.
 *
 * As respostas brutas do formulário NÃO moram aqui nem em lugar nenhum do
 * repositório: elas têm nome, telefone e e-mail de gente real, e o repositório
 * é público. O que entra é só o resultado anonimizado — falas atribuídas por
 * faixa etária e cidade, e códigos R1…R10 sem chave de identificação.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// fileURLToPath, não URL.pathname: no Windows o caminho do projeto tem espaços,
// e pathname devolve %20 no meio deles
const saida = fileURLToPath(new URL('../../docs/', import.meta.url));

/* ─────────────────────────────  RETRATOS  ─────────────────────────────
 * Desenhados, não fotografados. Foto de banco de imagens seria o rosto de uma
 * pessoa real usada para representar outra, inventada — e as fontes de imagem
 * externas nem carregariam na página publicada. Ilustração plana resolve os
 * dois problemas e ainda fica na linguagem da identidade do app.
 */
const retratos = {
  camila: `
    <defs><clipPath id="rc-camila"><circle cx="60" cy="60" r="57"/></clipPath></defs>
    <g clip-path="url(#rc-camila)">
      <circle cx="60" cy="60" r="57" fill="#DFDCD1"/>
      <path d="M60 86c-24 0-40 15-42 36h84c-2-21-18-36-42-36z" fill="#B4471F"/>
      <rect x="52" y="70" width="16" height="22" rx="8" fill="#B87A55"/>
      <ellipse cx="60" cy="54" rx="21" ry="24" fill="#CD8E67"/>
      <path d="M39 52c0-15 9-25 21-25s21 10 21 25c2-6 3-13 1-19-3-11-12-17-22-17s-19 6-22 17c-2 6-1 13 1 19z" fill="#2B2119"/>
      <path d="M37 46c-3 10-2 22 2 30-6-4-9-14-8-24 1-8 4-14 9-19zM83 46c3 10 2 22-2 30 6-4 9-14 8-24-1-8-4-14-9-19z" fill="#2B2119"/>
      <ellipse cx="52" cy="54" rx="2.6" ry="3" fill="#2B2119"/>
      <ellipse cx="68" cy="54" rx="2.6" ry="3" fill="#2B2119"/>
      <path d="M47 47c3-2 7-2 9 0M64 47c3-2 7-2 9 0" stroke="#2B2119" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M60 58v5c0 1-1 2-2 2" stroke="#8C5B3E" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M54 70c3 3 9 3 12 0" stroke="#8C5B3E" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
    <circle cx="60" cy="60" r="57" fill="none" stroke="#F4F3EE" stroke-width="2.5"/>`,

  tiago: `
    <defs><clipPath id="rc-tiago"><circle cx="60" cy="60" r="57"/></clipPath></defs>
    <g clip-path="url(#rc-tiago)">
      <circle cx="60" cy="60" r="57" fill="#DFDCD1"/>
      <path d="M60 86c-24 0-40 15-42 36h84c-2-21-18-36-42-36z" fill="#2E6E68"/>
      <rect x="52" y="70" width="16" height="22" rx="8" fill="#9C6844"/>
      <ellipse cx="60" cy="54" rx="21" ry="24" fill="#B37C55"/>
      <path d="M39 50c1-13 10-21 21-21s20 8 21 21c1-4 1-9 0-13-2-9-10-15-21-15s-19 6-21 15c-1 4-1 9 0 13z" fill="#241C14"/>
      <path d="M43 62c0 12 7 20 17 20s17-8 17-20c1 8-1 16-6 21-3 3-7 5-11 5s-8-2-11-5c-5-5-7-13-6-21z" fill="#241C14"/>
      <ellipse cx="52" cy="53" rx="2.6" ry="3" fill="#241C14"/>
      <ellipse cx="68" cy="53" rx="2.6" ry="3" fill="#241C14"/>
      <path d="M46 46c3-2 8-2 10 1M64 47c2-3 7-3 10-1" stroke="#241C14" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M60 57v5c0 1-1 2-2 2" stroke="#7C4F32" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M54 69c3 2 9 2 12 0" stroke="#5E3A24" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
    <circle cx="60" cy="60" r="57" fill="none" stroke="#F4F3EE" stroke-width="2.5"/>`,

  neuza: `
    <defs><clipPath id="rc-neuza"><circle cx="60" cy="60" r="57"/></clipPath></defs>
    <g clip-path="url(#rc-neuza)">
      <circle cx="60" cy="60" r="57" fill="#DFDCD1"/>
      <path d="M60 86c-24 0-40 15-42 36h84c-2-21-18-36-42-36z" fill="#14396E"/>
      <rect x="52" y="70" width="16" height="22" rx="8" fill="#8A5B3C"/>
      <ellipse cx="60" cy="54" rx="21" ry="24" fill="#A06D48"/>
      <path d="M38 54c-1-16 9-27 22-27s23 11 22 27c2-7 2-15 0-21-3-10-12-16-22-16s-19 6-22 16c-2 6-2 14 0 21z" fill="#8E8C88"/>
      <path d="M38 52c4-6 10-9 15-9-6 3-11 8-13 14zM82 52c-4-6-10-9-15-9 6 3 11 8 13 14z" fill="#C9C7C2"/>
      <path d="M78 34c7 2 11 8 11 15 0 5-2 9-5 12 2-9 0-19-6-27z" fill="#8E8C88"/>
      <ellipse cx="52" cy="55" rx="2.5" ry="2.8" fill="#241C14"/>
      <ellipse cx="68" cy="55" rx="2.5" ry="2.8" fill="#241C14"/>
      <g fill="none" stroke="#1A1D23" stroke-width="1.8">
        <circle cx="52" cy="55" r="7.5"/>
        <circle cx="68" cy="55" r="7.5"/>
        <path d="M59.5 55h1M44.5 54l-4-1M75.5 54l4-1"/>
      </g>
      <path d="M45 45c3-2 7-2 9 0M66 45c3-2 7-2 9 0" stroke="#6E6B66" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M60 60v4c0 1-1 2-2 2" stroke="#6E452C" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M54 71c3 2 9 2 12 0" stroke="#6E452C" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M44 63c2 2 4 3 5 3M71 63c-2 2-4 3-5 3" stroke="#8A5B3C" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>
    </g>
    <circle cx="60" cy="60" r="57" fill="none" stroke="#F4F3EE" stroke-width="2.5"/>`,
};

/* ─────────────────────────────  PERSONAS  ───────────────────────────── */

const folhas = {
  "camila": "cb6e1480-9463-4881-bf88-720b10ac77cb",
  "tiago": "f6ca4feb-a2da-4fdd-8e7a-f97719560bfa",
  "neuza": "8a43c4fb-faea-4f23-8321-0b77f9e4e17e"
};

const personas = [
  {
    id: 'camila',
    nome: 'Camila',
    idade: 21,
    papel: 'Persona primária · consumo',
    tipoCurto: 'Quem descobre',
    chamada:
      'Repara no prédio antigo todo dia no caminho da faculdade, já tentou descobrir o que era ali, e não achou.',
    ficha: [
      ['Idade', '21 anos'],
      ['Mora em', 'São José dos Campos'],
      ['Nasceu em', 'São José dos Campos'],
      ['Ocupação', 'Estudante e estagiária'],
      ['Escolaridade', 'Superior em curso'],
      ['Estado civil', 'Solteira'],
      ['Renda familiar', '2 a 5 salários mínimos'],
      ['Celular', 'Android intermediário, dados limitados'],
    ],
    bio: [
      'Camila mora com os pais no bairro onde cresceu e faz o mesmo trajeto a pé até o ponto de ônibus desde a escola. Conhece de vista cada fachada do centro e já reparou que várias estão fechadas há anos. Uma vez procurou no Google o que funcionava num casarão da rua do comércio; achou uma notícia de despejo e nada mais. Não insistiu.',
      'Consome história pelas redes sociais e, ocasionalmente, por um vídeo de jornal local que aparece no feed. Nunca entrou num arquivo público e não sabe que existe um na cidade. Não se considera "pessoa de história" — considera-se curiosa.',
      'Se um app resolvesse isso, ela usaria de imediato e provavelmente contribuiria com o que tem no celular. Mas abandona na primeira barreira: cadastro, cobrança ou parede de texto fazem ela fechar e não voltar.',
    ],
    objetivos: [
      'Matar a curiosidade <strong>no momento em que ela aparece</strong>, parada na calçada, sem precisar guardar para pesquisar depois — porque depois ela esquece.',
      'Entender a cidade onde nasceu com a profundidade que ela sente que falta, sem ter que virar pesquisadora para isso.',
      'Ter algo interessante para mostrar aos outros: o que ela descobre, ela reposta.',
    ],
    falas: [
      ['O que será que faziam ai dentro?', 'respondente de 18 a 24 anos, São José dos Campos'],
      [
        'Que deve ter uma história e uma importância para se manter até hoje',
        'respondente de 18 a 24 anos, São José dos Campos',
      ],
      [
        'A história das pessoas que já passaram ali, esses locais são uma forma de ver a passagem do tempo de forma concreta.',
        'respondente de 25 a 34 anos',
      ],
      [
        'Como se fosse uma fofoca, como meu professor de história da arte fazia',
        'respondente de 18 a 24 anos, sobre como gosta que a história seja contada',
      ],
    ],
    procedencia:
      'Núcleo em <code>R1, R3, R5, R7</code> — as quatro pessoas de 18 a 24 anos que tentaram descobrir a história de um lugar e não acharam. As barreiras vêm também de <code>R2, R4, R6</code>, que responderam sobre consumo sem ter tentado ou tendo achado. Sociodemográfico calculado sobre a moda do grupo: 18–24, superior em curso, 2 a 5 salários, nascida e moradora na mesma cidade (<code>R3, R5</code>).',
},

  {
    id: 'tiago',
    nome: 'Tiago',
    idade: 29,
    papel: 'Persona primária · contribuição',
    tipoCurto: 'Quem guarda',
    chamada:
      'Tem a foto na caixa de sapato e conta a história de boca há anos. Nunca lhe ocorreu que aquilo interessasse a alguém.',
    ficha: [
      ['Idade', '29 anos'],
      ['Mora em', 'São José dos Campos'],
      ['Nasceu em', 'São José dos Campos'],
      ['Ocupação', 'Formado em biologia, trabalha no comércio'],
      ['Escolaridade', 'Superior completo'],
      ['Estado civil', 'Casado'],
      ['Renda familiar', '2 a 5 salários mínimos'],
      ['Acervo', 'Fotos em álbum de papel, da família'],
    ],
    bio: [
      'Tiago é a terceira geração da família na cidade. Quando quis saber a história de um lugar, não usou buscador nenhum: perguntou a um tio, e o tio contou. Foi assim que aprendeu que o parque onde ele leva o filho já foi sanatório de tuberculose, e que o bisavô esteve internado ali.',
      'Ele conta essa história com frequência — em roda de conversa, quando alguém comenta do parque. É o repertório dele. Tem fotos antigas em álbum de papel, guardadas pela mãe, que nunca foram digitalizadas.',
      'Nunca publicou nada disso. Não por dificuldade técnica: ele usa o celular o dia inteiro. Por duas razões que ele mesmo declarou — <strong>nunca lhe passou pela cabeça</strong>, e <strong>não achou que fosse interessar a alguém</strong>. Olha a rua com um olho social: repara nos prédios vazios e nas pessoas sem teto na mesma frase.',
    ],
    objetivos: [
      'Ver a história que ele conta de boca <strong>existir num lugar</strong>, ligada ao ponto onde aconteceu — e não depender de ele estar presente para ser contada.',
      'Descobrir que aquilo interessa a outras pessoas, o que é a permissão que hoje falta.',
      'Contribuir sem que isso vire projeto: um envio de dois minutos, não uma tarde de digitalização.',
    ],
    falas: [
      [
        'Gosto de contar que o vicentina aranha já foi um hospital de tuberculose e que meu bisavô já ficou internado lá',
        'respondente de 25 a 34 anos, São José dos Campos — sobre a história que costuma contar',
      ],
      [
        'Tantos prédios vazios, tantas pessoas sem teto.',
        'o mesmo respondente, sobre o que passa pela cabeça ao ver um prédio antigo',
      ],
      ['Não achei que fosse interessar a alguém', 'o mesmo respondente, sobre por que nunca mostrou'],
    ],
    procedencia:
      'Núcleo em <code>R9</code>, o caso mais completo da amostra: único que achou o que procurava perguntando a uma pessoa <em>sem usar buscador</em>, único com foto antiga em papel, e o único que trouxe uma memória concreta e localizável nas perguntas abertas — sobre um ponto que já existe no acervo do protótipo. Complementado por <code>R8</code> (também achou perguntando a alguém mais velho; família tem as fotos) e <code>R5</code> (também recorreu a alguém mais velho, e tem fotos em meio digital). A dor "nunca me passou pela cabeça" é o padrão dominante do conjunto: <code>R1, R6, R7, R8, R9</code>.',
},

  {
    id: 'neuza',
    nome: 'Neuza',
    idade: 58,
    papel: 'Persona secundária · a que recusa',
    tipoCurto: 'Quem chegou depois',
    chamada:
      'Chegou de outro estado há três décadas. A memória dela desta cidade começa na própria chegada — e ela não mandaria nada.',
    ficha: [
      ['Idade', '58 anos'],
      ['Mora em', 'São José dos Campos, há 31 anos'],
      ['Nasceu em', 'Caicó, Rio Grande do Norte'],
      ['Ocupação', 'Auxiliar administrativa'],
      ['Escolaridade', 'Técnico'],
      ['Estado civil', 'Casada'],
      ['Renda familiar', '5 a 10 salários mínimos'],
      ['Celular', 'Usa todo dia; WhatsApp e redes'],
    ],
    bio: [
      'Neuza veio para o Vale nos anos noventa, atrás de trabalho, e ficou. Criou os filhos aqui. Conhece a cidade melhor que muito nascido nela, mas de um jeito diferente: a referência dela não é "onde eu brincava", é "como era isto aqui quando eu cheguei" — e o quanto mudou desde então.',
      'As fotos antigas da família ficaram com parentes, no Nordeste. Da cidade onde mora, ela não tem imagem nenhuma: chegou adulta, sem câmera, numa época em que ninguém fotografava o cotidiano. Sobre história local, não vê nem ouve nada — nem na TV, nem na rua, nem na família daqui.',
      'Usa o celular sem dificuldade. Ainda assim, respondeu que <strong>não mandaria</strong> uma memória para um aplicativo. O motivo não é o esforço: é não saber quem veria aquilo, não poder desfazer, e não ter garantia de que o que é dela continuaria sendo creditado a ela.',
    ],
    objetivos: [
      'Entender a cidade que ela ajudou a construir e sobre a qual ninguém lhe conta nada.',
      'Ter certeza, antes de qualquer envio, de <strong>quem vai ver</strong> e de que ela pode voltar atrás.',
      'Ser reconhecida como autora do que contar — não anonimizada, nem apropriada.',
    ],
    falas: [
      [
        'A vida ta passando rápido demais',
        'respondente de 50 a 64 anos, sobre o que passa pela cabeça ao ver um prédio antigo',
      ],
      ['Como era aquele local quando cheguei', 'o mesmo respondente, sobre a história que costuma contar'],
      ['Medo de usarem de um jeito errado', 'o mesmo respondente, sobre por que nunca mostrou'],
    ],
    procedencia:
      'Composta de <code>R8</code> e <code>R10</code> — as duas únicas pessoas de 50 a 64 anos da amostra. Ambas nasceram em outro estado e moram em São José; ambas responderam <strong>"eu não mandaria"</strong>; ambas marcaram "saber quem vai ver" como condição. De <code>R10</code> vêm as três falas, a ausência total de canal ("em lugar nenhum"), o medo de uso indevido e os pedidos de apagar e de crédito. De <code>R8</code> vêm a origem no Nordeste, as fotos que ficaram com a família e a barreira única de criar conta. Sexo e ocupação seguem <code>R8</code>; a voz segue <code>R10</code>.',
},
];

/**
 * Conteúdo do mapa de empatia em tamanho de bilhete.
 *
 * O modelo da disciplina usa post-it: três a oito palavras. As frases longas
 * que estavam aqui antes eram corretas e ilegíveis no formato — o mapa existe
 * para ser lido de relance, e o detalhe já mora na minibio e nas falas.
 */
const notas = {
  camila: {
    pensa: [
      'O que será que faziam ali?',
      'Acho bonito antes de achar histórico',
      'A cidade tem camadas que eu não alcanço',
      'História é coisa de quem estudou',
    ],
    ouve: [
      'Professor citando de passagem',
      'Jornal local, quando vira notícia',
      'Ninguém mais velho por perto pra perguntar',
    ],
    ve: [
      'Fachadas fechadas com placa de aluguel',
      'Placas de rua sem explicação nenhuma',
      'Google que só fala do imóvel',
      'Vídeo de história — de outras cidades',
    ],
    fala: [
      'Pesquisa uma vez e desiste',
      'Fotografa fachada e posta no story',
      'Reposta o que descobre',
      'Mandaria o que já tem no celular',
    ],
    dores: [
      'Procurei e não achei',
      'Cadastro antes de ver qualquer coisa',
      'Se for pago, eu fecho',
      'Muito texto pra ler no sol',
      'Abrir e não ter nada perto de mim',
    ],
    necessidades: [
      'Resposta ali, na hora',
      'Uma placa na rua que me convide',
      'Tom de conversa, não de verbete',
      'Pouco texto, com imagem',
      'Poder mostrar aos outros',
    ],
  },

  tiago: {
    pensa: [
      'Não achei que fosse interessar a alguém',
      'Orgulho de saber o que os outros não sabem',
      'Prédio vazio me incomoda',
      'Publicar é pra quem tem público',
    ],
    ouve: [
      'A família conta quando eu pergunto',
      'O tio que sabe das coisas',
      'Ninguém pedindo o que eu tenho',
    ],
    ve: [
      'O álbum da mãe que ninguém abre',
      'Prédios vazios e gente na porta',
      'O parque que já foi hospital',
      'Rede social sem nada do que eu sei',
    ],
    fala: [
      'Conto a história do bisavô sempre',
      'Pergunto pros mais velhos',
      'Guardo, não digitalizo',
      'Mandaria só a foto',
    ],
    dores: [
      'Nunca me passou pela cabeça',
      'Acho que não interessa a ninguém',
      'A foto é de papel',
      'Escrever relato dá trabalho',
      'Preciso ver gente séria usando',
    ],
    necessidades: [
      'Que alguém me peça',
      'Ver que outros já contaram',
      'Dois minutos, sem escrever nada',
      'Saber quem cuida disso',
      'Que fique lá sem eu estar junto',
    ],
  },

  neuza: {
    pensa: [
      'A vida tá passando rápido demais',
      'Minha memória começa tarde demais',
      'Onde é que isso vai parar?',
      'O que é meu tem que continuar meu',
    ],
    ouve: [
      'Em lugar nenhum',
      'Os filhos não perguntam',
      'Notícia de demolição, quando dá',
    ],
    ve: [
      'Uma cidade que mudou sem registro',
      'Nenhuma placa contando nada',
      'As fotos ficaram no Nordeste',
    ],
    fala: [
      'Conto como era quando cheguei',
      'Uso o celular todo dia',
      'Perguntei a alguém e descobri',
      'Não mandaria nada, hoje',
    ],
    dores: [
      'Não sei quem vai ver',
      'E se usarem de um jeito errado?',
      'Não dá pra desfazer',
      'Cadastro logo na entrada',
      'Cheguei depois — vale menos?',
    ],
    necessidades: [
      'Dizer quem vê, antes de eu enviar',
      'Poder apagar depois',
      'Meu nome, se eu quiser',
      'Memória de quem chegou também conta',
      'Ver antes de decidir',
    ],
  },
};

/* ─────────────────────────────  ACHADOS  ───────────────────────────── */

const achados = [
  {
    n: '5',
    de: 'de 7',
    diz: 'Quem nunca mostrou sua foto ou história respondeu que <strong>"nunca me passou pela cabeça"</strong>. Nenhuma pessoa marcou "não sei mexer direito".',
    quer: 'Derruba a hipótese central: a barreira de quem contribui não era técnica. Era ausência de convite.',
  },
  {
    n: '2',
    de: 'de 2',
    diz: 'As duas pessoas de 50 a 64 anos responderam <strong>"eu não mandaria"</strong> — e pediram controle: saber quem vai ver, poder apagar depois, aparecer como autor.',
    quer: 'O produto investiu em reduzir esforço. Quem é mais velho pediu garantia, não facilidade.',
  },
  {
    n: '8',
    de: 'de 10',
    diz: 'Já tentaram descobrir a história de algum lugar da sua cidade. <strong>5 tentaram e não acharam.</strong>',
    quer: 'O problema que o produto ataca existe e foi medido, não presumido.',
  },
  {
    n: '2',
    de: 'dos 3',
    diz: 'Entre quem <em>achou</em> o que procurava, dois chegaram lá <strong>perguntando a alguém mais velho</strong> — um deles sem usar Google nenhum.',
    quer: 'O concorrente real não é um aplicativo. É uma pessoa que sabe das coisas.',
  },
  {
    n: '6',
    de: 'de 10',
    diz: 'Desistiriam do app <strong>se tivesse que pagar</strong> — a barreira mais citada, acima de criar conta (4) e de muito texto (4).',
    quer: 'Sustenta a base gratuita do modelo de negócio: memória urbana atrás de paywall perde o público antes de começar.',
  },
  {
    n: '3',
    de: 'de 10',
    diz: 'Responderam <strong>"não sei"</strong> se têm foto antiga guardada — mais do que os que responderam "não tenho".',
    quer: '"Não sei" não é ausência de acervo: é gaveta nunca aberta. O pedido certo não é "mande sua foto", é "vá ver se tem".',
  },
  {
    n: '6',
    de: 'de 10',
    diz: 'Nasceram em uma cidade e moram em outra.',
    quer: 'Revelou uma persona que não estava prevista: quem chegou depois e cuja memória do lugar começa na própria chegada.',
  },
  {
    n: '3',
    de: 'de 10',
    diz: 'Pediram <strong>espontaneamente uma placa física</strong> na pergunta aberta sobre o que os faria parar na rua — "uma placa contando a história", "uma placa dando nome", "algo físico como um cartaz".',
    quer: 'Ninguém sugeriu isso; saiu deles. O app já tem a placa com QR, e ela deixa de ser enfeite para virar porta de entrada.',
  },
];

const insights = [
  '<strong>O convite é o produto que falta.</strong> A dor dominante de quem contribui não é técnica — cinco de sete disseram "nunca me passou pela cabeça", e ninguém disse "não sei mexer". Reduzir esforço de publicação resolve um problema que quase ninguém tem. O trabalho é fazer a possibilidade existir: pedir no lugar, na hora, de forma explícita.',
  '<strong>Controle antes de facilidade, para quem tem mais de 50.</strong> As duas respondentes dessa faixa recusariam enviar, e as condições que deram são todas de garantia: quem vê, poder apagar, ser creditada. O app permite apagar, mas só descobre isso quem já enviou. A promessa precisa estar <em>na tela do envio</em>, junto do botão — não na tela de ajustes.',
  '<strong>A placa física saiu deles, não de nós.</strong> Três pessoas pediram espontaneamente algo no mundo real que conte a história — "uma placa", "um cartaz". O recurso de placa com QR existe no protótipo e estava catalogado como acessório. É porta de entrada.',
  '<strong>O concorrente é uma pessoa, não um aplicativo.</strong> Dois dos três que acharam o que procuravam perguntaram a alguém mais velho, um deles sem tocar em buscador. O produto não disputa com o Google: disputa com o tio que sabe das coisas — e o caminho é transformar esse tio em fonte do acervo, não substituí-lo.',
  '<strong>"Não sei se tenho foto" é um estado a ser tratado.</strong> Três pessoas não sabem o que há na gaveta — mais do que as que disseram não ter. O pedido eficaz não é "envie sua foto antiga"; é "vá olhar aquela caixa".',
  '<strong>Cobrança é a barreira número um.</strong> Seis de dez desistiriam se tivessem que pagar, à frente de cadastro e de excesso de texto. A base gratuita e aberta do modelo de negócio não é generosidade: é condição de existência do acervo.',
  '<strong>A memória de quem chegou depois precisa caber.</strong> Seis de dez nasceram em outra cidade. O acervo semeado só contempla memória de origem — quem nasceu e ficou. "Como era aqui quando eu cheguei" é uma categoria de memória que o produto ainda não convida nem acomoda.',
];

const amostra = [
  ['R1', '18–24', 'Taubaté → Taubaté', 'Arquitetura', 'Tentou, não achou', 'Não sabe', 'Escrever', ['camila']],
  ['R2', '25–34', 'S.J. Campos → Jacareí', 'Enfermeira', 'Nunca tentou', '—', 'Só olharia', ['camila']],
  ['R3', '18–24', 'S.J. Campos → S.J. Campos', 'Estagiário', 'Tentou, não achou', 'Não sabe', '—', ['camila']],
  ['R4', '25–34', 'São Gonçalo–RJ → São Paulo', 'Estudante', 'Achou (Google)', '—', 'Talvez', ['camila']],
  ['R5', '18–24', 'S.J. Campos → S.J. Campos', 'Estudante de software', 'Tentou, não achou', 'Digital', 'Mandaria', ['camila', 'tiago']],
  ['R6', '18–24', 'S.J. Campos → Jacareí', 'Estudante', 'Nunca tentou', 'Não sabe', 'Escrever', ['camila']],
  ['R7', '18–24', 'Osasco → Carapicuíba', 'Marketing digital', 'Tentou, não achou', 'Não tem', 'Só a foto', ['camila']],
  ['R8', '50–64', 'Caicó–RN → S.J. Campos', 'Aux. administrativa', 'Achou (perguntando)', 'Família tem', 'Não mandaria', ['tiago', 'neuza']],
  ['R9', '25–34', 'S.J. Campos → S.J. Campos', 'Biólogo no comércio', 'Achou (perguntando)', '<strong>Papel</strong>', 'Só a foto', ['tiago']],
  ['R10', '50–64', 'Itajubá–MG → S.J. Campos', 'Gerente de posto', 'Tentou, não achou', 'Não tem', 'Não mandaria', ['neuza']],
];

/* ─────────────────────────────  ESTILO  ───────────────────────────── */

const css = `
  :root {
    --ground:#F4F3EE; --surface:#EAE8E0; --surface2:#DFDCD1; --line:#CFCABA;
    --ink:#1A1D23; --ink-dim:#55524B; --plaque:#14396E; --plaque-soft:#3A6098;
    --on-plaque:#F4F3EE; --on-plaque-d:#A8C2E4; --accent:#B4471F;
    --on-accent:#F4F3EE; --ok:#2E6E68;
    --ui:'Archivo',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    --plate:'Archivo Narrow','Arial Narrow',Impact,sans-serif;
    --story:'Newsreader',Georgia,'Times New Roman',serif;
    --mono:'DM Mono',ui-monospace,Consolas,monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground:#101C2E; --surface:#16273D; --surface2:#1D3149; --line:#2C4361;
      --ink:#EDEAE1; --ink-dim:#A6B4C6; --plaque:#23446F; --plaque-soft:#4E7BB5;
      --on-plaque:#F4F3EE; --on-plaque-d:#A8C2E4; --accent:#E38A5C;
      --on-accent:#14243A; --ok:#5FAFA6;
    }
  }
  :root[data-theme="dark"] {
    --ground:#101C2E; --surface:#16273D; --surface2:#1D3149; --line:#2C4361;
    --ink:#EDEAE1; --ink-dim:#A6B4C6; --plaque:#23446F; --plaque-soft:#4E7BB5;
    --on-plaque:#F4F3EE; --on-plaque-d:#A8C2E4; --accent:#E38A5C;
    --on-accent:#14243A; --ok:#5FAFA6;
  }
  * { box-sizing: border-box; }
  body {
    background: var(--ground); color: var(--ink); font-family: var(--ui);
    font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 900px; margin: 0 auto; padding: 0 20px 96px; }
  .plaque-frame {
    background: var(--plaque); color: var(--on-plaque); padding: 34px 26px 30px;
    box-shadow: inset 0 0 0 2px var(--plaque), inset 0 0 0 3.5px var(--on-plaque);
    margin: 28px 0 0;
  }
  h1 {
    font-family: var(--plate); font-weight: 700;
    font-size: clamp(2rem, 7vw, 3.2rem); line-height: 1;
    letter-spacing: .04em; text-transform: uppercase; margin: 0;
    text-wrap: balance;
  }
  .eyebrow {
    font-family: var(--mono); font-size: .7rem; letter-spacing: .16em;
    text-transform: uppercase; color: var(--on-plaque-d); margin: 0 0 12px;
  }
  .lede {
    font-family: var(--story); font-size: 1.1rem; line-height: 1.55;
    margin: 18px 0 0; max-width: 58ch;
  }
  .lede em { color: var(--on-plaque-d); font-style: italic; }
  h2 {
    font-family: var(--plate); font-weight: 700; font-size: 1.45rem;
    letter-spacing: .035em; text-transform: uppercase; margin: 60px 0 6px;
    padding-bottom: 8px; border-bottom: 2px solid var(--ink); text-wrap: balance;
  }
  h3 { font-size: 1rem; font-weight: 700; margin: 28px 0 8px; }
  p { margin: 0 0 14px; max-width: 68ch; }
  .sub {
    font-family: var(--mono); font-size: .72rem; letter-spacing: .1em;
    text-transform: uppercase; color: var(--ink-dim); margin: 0 0 20px;
  }
  .flag {
    border-left: 5px solid var(--accent); background: var(--surface);
    padding: 18px 20px; margin: 24px 0;
  }
  .flag p:last-child { margin-bottom: 0; }
  .flag .tag {
    font-family: var(--mono); font-size: .68rem; letter-spacing: .14em;
    text-transform: uppercase; color: var(--accent); display: block; margin-bottom: 8px;
  }
  .achados { display: grid; gap: 14px; margin: 22px 0; }
  @media (min-width: 720px) { .achados { grid-template-columns: 1fr 1fr; } }
  .achado {
    border: 1px solid var(--line); background: var(--surface); padding: 16px 18px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .achado .num {
    font-family: var(--plate); font-size: 2.1rem; line-height: 1;
    letter-spacing: .02em; color: var(--accent);
  }
  .achado .num small {
    font-family: var(--mono); font-size: .72rem; letter-spacing: .08em;
    color: var(--ink-dim); margin-left: 6px;
  }
  .achado .diz { font-size: .93rem; line-height: 1.45; margin: 0; }
  .achado .quer { font-size: .83rem; color: var(--ink-dim); margin: 0; }

  .persona { margin: 40px 0 0; border: 1px solid var(--line); background: var(--surface); }

  /* o rosto no meio, como no modelo da disciplina */
  .persona-topo {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    gap: 14px; padding: 30px 22px 26px; background: var(--plaque); color: var(--on-plaque);
  }
  .retrato { width: 148px; height: 148px; flex-shrink: 0; display: block; }
  .persona-topo .papel {
    font-family: var(--mono); font-size: .66rem; letter-spacing: .14em;
    text-transform: uppercase; color: var(--on-plaque-d); margin: 0;
  }
  .persona-topo h3 {
    font-family: var(--plate); font-size: 2.3rem; line-height: 1;
    letter-spacing: .04em; text-transform: uppercase; margin: 0;
    color: var(--on-plaque);
  }
  .persona-topo .linha {
    font-family: var(--story); font-size: 1.06rem; line-height: 1.45; margin: 0;
    color: var(--on-plaque); max-width: 48ch;
  }
  .ficha {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
    border-bottom: 1px solid var(--line);
  }
  .ficha div {
    padding: 11px 14px; border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .ficha dt {
    font-family: var(--mono); font-size: .6rem; letter-spacing: .13em;
    text-transform: uppercase; color: var(--ink-dim); margin: 0 0 3px;
  }
  .ficha dd { margin: 0; font-size: .88rem; font-weight: 600; line-height: 1.35; }
  .persona-corpo { padding: 22px; }
  .persona-corpo h4 {
    font-family: var(--mono); font-size: .68rem; letter-spacing: .14em;
    text-transform: uppercase; color: var(--ink-dim); margin: 22px 0 8px;
  }
  .persona-corpo h4:first-child { margin-top: 0; }
  .persona-corpo p { font-size: .97rem; }
  ol.objetivos { margin: 0; padding-left: 20px; }
  ol.objetivos li { margin-bottom: 6px; font-size: .97rem; max-width: 64ch; }
  .fala {
    font-family: var(--story); font-size: 1.08rem; line-height: 1.45;
    border-left: 3px solid var(--accent); padding: 2px 0 2px 14px;
    margin: 0 0 12px; max-width: 60ch;
  }
  .fala cite {
    display: block; font-family: var(--mono); font-size: .68rem; font-style: normal;
    letter-spacing: .08em; color: var(--ink-dim); margin-top: 5px;
  }
  .fonte {
    margin-top: 20px; padding: 12px 14px; background: var(--surface2);
    border-left: 4px solid var(--plaque-soft);
  }
  .fonte p { font-size: .85rem; line-height: 1.5; margin: 0; color: var(--ink-dim); max-width: none; }
  .fonte code { font-family: var(--mono); font-size: .8rem; color: var(--accent); }
  /* ── mapa de empatia, no formato do material da disciplina ──────────
     Quatro quadrantes cortados por um X, rosto no centro, Dores e
     Necessidades em caixas separadas embaixo. */
  .mapa-empatia { margin: 16px 0 0; }
  .mapa {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    grid-template-areas:
      "topo topo topo"
      "esq  face dir"
      "base base base";
    gap: 10px;
    align-items: center;
    padding: 18px;
    border: 2px solid var(--ink);
    background: var(--surface);
  }
  .mapa-x {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .mapa-x line {
    stroke: var(--line);
    stroke-width: .35;
    stroke-dasharray: 2 1.6;
    vector-effect: non-scaling-stroke;
  }
  .quad { position: relative; z-index: 1; min-width: 0; }
  .q-topo { grid-area: topo; }
  .q-esq  { grid-area: esq; }
  .q-dir  { grid-area: dir; }
  .q-base { grid-area: base; }

  .quad-rotulo {
    font-family: var(--plate);
    font-size: 1.05rem;
    letter-spacing: .05em;
    text-transform: uppercase;
    text-align: center;
    color: var(--plaque);
    margin: 0 0 8px;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .quad-rotulo { color: var(--on-plaque-d); }
  }
  :root[data-theme="dark"] .quad-rotulo { color: var(--on-plaque-d); }

  .mapa-rosto {
    grid-area: face;
    position: relative;
    z-index: 2;
    width: 116px;
    height: 116px;
    justify-self: center;
  }
  .mapa-rosto svg { width: 100%; height: 100%; display: block; }

  .notas {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 7px;
  }
  .nota {
    background: var(--ground);
    border: 1px solid var(--line);
    border-bottom: 3px solid var(--plaque-soft);
    padding: 7px 10px;
    font-size: .8rem;
    line-height: 1.3;
    max-width: 190px;
    box-shadow: 1px 1px 0 rgba(0, 0, 0, .07);
  }
  /* leve desalinho, como bilhete colado à mão — nunca o suficiente para
     atrapalhar a leitura */
  .n0 { transform: rotate(-.7deg); }
  .n1 { transform: rotate(.5deg); }
  .n2 { transform: rotate(.8deg); }
  .n3 { transform: rotate(-.4deg); }

  .mapa-baixo { display: grid; gap: 12px; margin-top: 12px; }
  @media (min-width: 640px) { .mapa-baixo { grid-template-columns: 1fr 1fr; } }
  .caixa { border: 2px solid var(--ink); background: var(--surface); padding: 14px 16px; }
  .caixa-rotulo {
    font-family: var(--plate);
    font-size: 1.05rem;
    letter-spacing: .05em;
    text-transform: uppercase;
    margin: 0 0 10px;
  }
  .caixa.dor .caixa-rotulo { color: var(--accent); }
  .caixa.nec .caixa-rotulo { color: var(--ok); }
  .caixa.dor .nota { border-bottom-color: var(--accent); }
  .caixa.nec .nota { border-bottom-color: var(--ok); }
  .caixa .notas { justify-content: flex-start; }

  /* No celular, quatro triângulos não se leem: o mapa vira coluna, com os
     mesmos rótulos e a mesma ordem. */
  @media (max-width: 759px) {
    .mapa {
      grid-template-columns: 1fr;
      grid-template-areas: "face" "topo" "esq" "dir" "base";
      gap: 18px;
    }
    .mapa-x { display: none; }
    .nota { max-width: none; }
    .notas { justify-content: flex-start; }
    .quad-rotulo { text-align: left; }
  }

  .scroll { overflow-x: auto; margin: 18px 0; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: .88rem; }
  th, td { text-align: left; padding: 9px 11px; border-bottom: 1px solid var(--line); vertical-align: top; }
  thead th {
    font-family: var(--mono); font-size: .63rem; letter-spacing: .12em;
    text-transform: uppercase; color: var(--ink-dim);
    border-bottom: 2px solid var(--ink); white-space: nowrap;
  }
  tbody th {
    font-family: var(--mono); font-size: .82rem; font-weight: 500;
    color: var(--accent); white-space: nowrap;
  }
  td.pill span {
    font-family: var(--mono); font-size: .66rem; letter-spacing: .08em;
    text-transform: uppercase; border: 1px solid currentColor; padding: 2px 6px;
    white-space: nowrap; display: inline-block; margin: 1px 2px 1px 0;
  }
  .camila { color: var(--plaque); }
  .tiago { color: var(--accent); }
  .neuza { color: var(--ok); }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .camila { color: var(--on-plaque-d); }
  }
  :root[data-theme="dark"] .camila { color: var(--on-plaque-d); }
  a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 2px; }
  a:focus-visible { outline: 3px solid var(--plaque); outline-offset: 2px; }
  ul.plain { margin: 0 0 16px; padding-left: 20px; }
  ul.plain li { margin-bottom: 8px; max-width: 66ch; }
  .foot {
    margin-top: 60px; padding-top: 18px; border-top: 2px solid var(--ink);
    font-family: var(--mono); font-size: .7rem; letter-spacing: .06em;
    color: var(--ink-dim); text-transform: uppercase;
  }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

const fontes = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Archivo+Narrow:wght@600;700&family=DM+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap">`;

/* ─────────────────────────────  MONTAGEM  ───────────────────────────── */

const pagina = (titulo, corpo) =>
  `<title>${titulo}</title>\n${fontes}\n\n<style>${css}</style>\n\n<div class="wrap">\n${corpo}\n</div>\n`;

const cartao = (p) => `
  <div class="persona">
    <div class="persona-topo">
      <svg class="retrato" viewBox="0 0 120 120" role="img" aria-label="Retrato ilustrado de ${p.nome}">${retratos[p.id]}
      </svg>
      <p class="papel">${p.papel}</p>
      <h3>${p.nome}, ${p.idade}</h3>
      <p class="linha">${p.chamada}</p>
    </div>

    <div class="ficha">
      ${p.ficha.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('\n      ')}
    </div>

    <div class="persona-corpo">
      <h4>Perfil comportamental</h4>
      ${p.bio.map((t) => `<p>${t}</p>`).join('\n      ')}

      <h4>Objetivos</h4>
      <ol class="objetivos">
        ${p.objetivos.map((o) => `<li>${o}</li>`).join('\n        ')}
      </ol>

      <h4>Falas reais que sustentam esta persona</h4>
      ${p.falas.map(([f, quem]) => `<p class="fala">${f}<cite>${quem}</cite></p>`).join('\n      ')}

      <div class="fonte">
        <p><strong>Procedência.</strong> ${p.procedencia}</p>
      </div>
    </div>
  </div>`;

const bilhete = (t, i) =>
  `<li class="nota n${i % 4}">${t}</li>`;

const quadrante = (classe, rotulo, itens) => `
      <div class="quad ${classe}">
        <p class="quad-rotulo">${rotulo}</p>
        <ul class="notas">
          ${itens.map(bilhete).join('\n          ')}
        </ul>
      </div>`;

const caixaBaixo = (classe, rotulo, itens) => `
    <div class="caixa ${classe}">
      <p class="caixa-rotulo">${rotulo}</p>
      <ul class="notas">
        ${itens.map(bilhete).join('\n        ')}
      </ul>
    </div>`;

/**
 * O mapa no formato do material da disciplina.
 *
 * Quatro quadrantes cortados por um X, o rosto no centro, e Dores e
 * Necessidades em caixas separadas embaixo. Não é decoração: essa é a
 * disposição que o professor mostrou como referência, e um quadro em formato
 * diferente do pedido é a primeira coisa que se nota numa correção.
 *
 * O X é decorativo e some no celular — quatro triângulos numa tela de 390 px
 * não se leem. Abaixo de 760 px o mapa vira coluna, mantendo os mesmos
 * rótulos e a mesma ordem.
 */
const mapaEmpatia = (p) => {
  const n = notas[p.id];
  return `
  <div class="mapa-empatia">
    <div class="mapa">
      <svg class="mapa-x" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="0" x2="100" y2="100"/>
        <line x1="100" y1="0" x2="0" y2="100"/>
      </svg>
${quadrante('q-topo', 'O que pensa e sente?', n.pensa)}
${quadrante('q-esq', 'O que ouve?', n.ouve)}
      <div class="mapa-rosto">
        <svg viewBox="0 0 120 120" role="img" aria-label="Retrato de ${p.nome}">${retratos[p.id]}
        </svg>
      </div>
${quadrante('q-dir', 'O que vê?', n.ve)}
${quadrante('q-base', 'O que diz e faz?', n.fala)}
    </div>

    <div class="mapa-baixo">
${caixaBaixo('dor', 'Dores', n.dores)}
${caixaBaixo('nec', 'Necessidades', n.necessidades)}
    </div>
  </div>`;
};

const rodape = `<p class="foot">FoiAqui · Define 2.1 e 2.2 · n = 10 · coleta de 7 a 9 de setembro de 2026 · amostra por conveniência</p>`;

/** Uma folha por persona: é o formato de apresentar, uma por vez. */
function folhaDaPersona(p) {
  return pagina(
    `${p.nome}, ${p.idade}`,
    `
  <header class="plaque-frame">
    <p class="eyebrow">FoiAqui · Define · ${p.tipoCurto}</p>
    <h1>${p.nome}</h1>
    <p class="lede">${p.chamada}</p>
  </header>

  <h2>A persona</h2>
  <p class="sub">${p.papel} · tradicional (semifictícia)</p>
  ${cartao(p)}

  <h2>Mapa de empatia</h2>
  <p class="sub">Os seis campos pedidos no material da disciplina</p>
  ${mapaEmpatia(p)}

  ${rodape}`,
  );
}

/** O documento inteiro: método, achados, as três personas e a amostra. */
function documento() {
  return pagina(
    'Camila, Tiago e Neuza',
    `
  <header class="plaque-frame">
    <p class="eyebrow">FoiAqui · Define · 2.1 e 2.2</p>
    <h1>Camila,<br>Tiago e Neuza</h1>
    <p class="lede">
      Três pessoas que não existem, montadas com o que dez pessoas reais
      responderam. <em>Duas delas contradizem o que eu tinha suposto sobre o
      produto</em> — e é por isso que a pesquisa valeu.
    </p>
  </header>

  <h2>De onde vieram os dados</h2>
  <p class="sub">Método, amostra e o que ela sustenta</p>

  <div class="scroll">
    <table>
      <tbody>
        <tr><th>Instrumento</th><td>Formulário on-line de 21 perguntas, três partes, sendo a segunda opcional</td></tr>
        <tr><th>Canal</th><td>Instagram do autor — stories com enquete e link, mais pedido de repasse a familiares mais velhos</td></tr>
        <tr><th>Período</th><td>7 a 9 de setembro de 2026</td></tr>
        <tr><th>Respostas</th><td>10 válidas (uma décima primeira foi teste do próprio autor e está descartada)</td></tr>
        <tr><th>Amostragem</th><td>Por conveniência, não probabilística</td></tr>
        <tr><th>Tipo de persona</th><td><strong>Tradicional (semifictícia)</strong>, conforme slide 51</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Por que "tradicional (semifictícia)" e não protopersona</h3>
  <p>
    O material define protopersona como a criada "por meio de entrevistas com
    especialistas", para ir mais rápido. Seria a classificação honesta se estas
    personas tivessem saído apenas da entrevista com a PO e do benchmarking —
    que era o caso até esta coleta.
  </p>
  <p>
    Com dez respostas de usuários potenciais, incluindo perguntas abertas que
    produziram falas literais, a modelagem passa a se apoiar em
    <strong>pesquisa qualitativa analítica</strong>, que é a definição de
    persona tradicional no slide 51. A amostra é pequena e enviesada, e isso
    está declarado abaixo — mas a origem do dado mudou de categoria.
  </p>

  <div class="flag">
    <span class="tag">O que estes dados NÃO sustentam</span>
    <p>
      <strong>Nenhuma porcentagem.</strong> Com dez respostas, "60% dos usuários"
      é ruído apresentado como número. Tudo aqui é dito em contagem — "6 de 10" —
      e assim deve permanecer em qualquer apresentação.
    </p>
    <p>
      <strong>Nenhuma afirmação sobre a população.</strong> A amostra veio de um
      perfil de Instagram: 8 das 10 pessoas têm até 34 anos, e todas moram no
      eixo São Paulo–Vale do Paraíba. Não representa a cidade; representa quem
      alcançamos.
    </p>
    <p>
      <strong>A persona idosa que o app assumia.</strong> Ninguém acima de 64
      anos respondeu. A "Íris de 70 anos" que orientou as decisões de
      acessibilidade continua sendo hipótese — e a Neuza é o mais perto que os
      dados chegaram dela.
    </p>
  </div>

  <h2>O que os dados disseram</h2>
  <p class="sub">Inclusive contra as hipóteses do projeto</p>

  <div class="achados">
    ${achados
      .map(
        (a) => `<div class="achado">
      <span class="num">${a.n}<small>${a.de}</small></span>
      <p class="diz">${a.diz}</p>
      <p class="quer">${a.quer}</p>
    </div>`,
      )
      .join('\n    ')}
  </div>

  ${personas
    .map(
      (p, i) => `
  <h2>Persona ${i + 1} · ${p.nome}</h2>
  <p class="sub">${p.papel} · <a href="https://claude.ai/code/artifact/${folhas[p.id]}">folha individual</a></p>
  ${cartao(p)}

  <h3>Mapa de empatia · ${p.nome}</h3>
  ${mapaEmpatia(p)}`,
    )
    .join('\n')}

  <h2>Insights para a equipe</h2>
  <p class="sub">O que estes mapas mandam mudar no produto</p>
  <ul class="plain">
    ${insights.map((i) => `<li>${i}</li>`).join('\n    ')}
  </ul>

  <h2>A amostra, respondente por respondente</h2>
  <p class="sub">Para conferir de onde saiu cada persona</p>

  <div class="scroll">
    <table>
      <thead>
        <tr>
          <th>Cód.</th><th>Idade</th><th>Nasceu → mora</th><th>Ocupação</th>
          <th>Procurou?</th><th>Foto antiga</th><th>Enviaria?</th><th>Alimenta</th>
        </tr>
      </thead>
      <tbody>
        ${amostra
          .map(
            ([cod, idade, cidade, ocup, proc, foto, envio, quais]) =>
              `<tr><th>${cod}</th><td>${idade}</td><td>${cidade}</td><td>${ocup}</td><td>${proc}</td><td>${foto}</td><td>${envio}</td><td class="pill">${quais
                .map((q) => `<span class="${q}">${q[0].toUpperCase() + q.slice(1)}</span>`)
                .join(' ')}</td></tr>`,
          )
          .join('\n        ')}
      </tbody>
    </table>
  </div>

  <p>
    Nenhum nome, contato ou dado identificável de respondente aparece neste
    documento. As falas citadas são literais e estão atribuídas apenas por faixa
    etária e cidade. A planilha original, com identificação, permanece fora do
    repositório do projeto.
  </p>

  ${rodape}`,
  );
}

/* ───────────────────────  IMAGENS PARA O README  ───────────────────────
 *
 * O GitHub não renderiza HTML com CSS dentro do README, então as páginas
 * publicadas não servem ali. O que ele renderiza é SVG referenciado como
 * imagem — o banner do projeto já é assim.
 *
 * Por isso o mapa de empatia é remontado aqui em SVG puro, com as caixas
 * posicionadas por conta própria. Custa uma quebra de linha manual (não há
 * fluxo de texto em SVG), e paga com uma imagem que abre em qualquer lugar:
 * README, apresentação de slides, PDF, impressão — sem navegador, sem
 * captura de tela, sem fonte externa.
 */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SANS = 'Helvetica, Arial, sans-serif';
const COND = "'Arial Narrow', Helvetica, sans-serif";

/**
 * Quebra o texto em linhas que cabem na largura dada.
 *
 * A conta é por contagem de caracteres, não por medida real de fonte: SVG não
 * mede texto antes de desenhar, e o navegador que mediria é justamente o que
 * este script evita. O fator 0.53 é a largura média de caractere em Helvetica
 * — folgado o bastante para não estourar a caixa em nenhuma das notas.
 */
function quebra(texto, largura, tamanho = 11.5) {
  const max = Math.floor(largura / (tamanho * 0.53));
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(' ')) {
    const tentativa = atual ? atual + ' ' + palavra : palavra;
    if (tentativa.length > max && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

const LINHA = 14;

/** Uma nota, com altura calculada a partir do texto que ela recebeu. */
function nota(texto, x, y, w, faixa) {
  const linhas = quebra(texto, w - 16);
  const h = 11 + linhas.length * LINHA + 7;
  const textos = linhas
    .map(
      (l, i) =>
        `<text x="${x + 8}" y="${y + 19 + i * LINHA}" font-size="11.5" font-family="${SANS}" fill="#1A1D23">${esc(l)}</text>`,
    )
    .join('');
  return {
    h,
    svg:
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F4F3EE" stroke="#CFCABA" stroke-width="1"/>` +
      `<rect x="${x}" y="${y + h - 3}" width="${w}" height="3" fill="${faixa}"/>` +
      textos,
  };
}

/** Notas empilhadas numa coluna. Devolve o SVG e a altura total ocupada. */
function coluna(itens, x, y, w, faixa, espaco = 8) {
  let cursor = y;
  const partes = [];
  for (const item of itens) {
    const n = nota(item, x, cursor, w, faixa);
    partes.push(n.svg);
    cursor += n.h + espaco;
  }
  return { svg: partes.join(''), altura: cursor - y - espaco };
}

/** Notas lado a lado, centradas numa faixa horizontal. */
function fileira(itens, centroX, y, w, faixa, espaco = 12) {
  const total = itens.length * w + (itens.length - 1) * espaco;
  let x = centroX - total / 2;
  const partes = [];
  let maior = 0;
  for (const item of itens) {
    const n = nota(item, x, y, w, faixa);
    partes.push(n.svg);
    maior = Math.max(maior, n.h);
    x += w + espaco;
  }
  return { svg: partes.join(''), altura: maior };
}

const rotulo = (texto, x, y, ancora = 'middle', cor = '#14396E') =>
  `<text x="${x}" y="${y}" text-anchor="${ancora}" font-family="${COND}" font-size="15" font-weight="700" letter-spacing="1.1" fill="${cor}">${esc(texto)}</text>`;

const AZUL = '#3A6098';
const FERRUGEM = '#B4471F';
const VERDE = '#2E6E68';

/**
 * O mapa de empatia inteiro como um SVG.
 *
 * Mesma disposição da página e do material da disciplina: quatro quadrantes
 * cortados por um X, rosto no centro, Dores e Necessidades embaixo.
 */
function mapaSVG(p) {
  const n = notas[p.id];
  const L = 940;
  const meioX = L / 2;

  const topo = fileira(n.pensa, meioX, 46, 190, AZUL);
  const yMeio = 46 + topo.altura + 34;

  const esq = coluna(n.ouve, 22, yMeio + 26, 205, AZUL);
  const dir = coluna(n.ve, L - 227, yMeio + 26, 205, AZUL);
  const alturaMeio = Math.max(esq.altura, dir.altura, 150);

  const yBase = yMeio + 26 + alturaMeio + 30;
  const base = fileira(n.fala, meioX, yBase + 14, 190, AZUL);
  const alturaQuadro = yBase + 14 + base.altura + 20;

  const rostoY = yMeio + 26 + alturaMeio / 2 - 58;

  // caixas de baixo, lado a lado
  const yCaixas = alturaQuadro + 18;
  const larguraCaixa = (L - 16) / 2;
  const dores = coluna(n.dores, 36, yCaixas + 46, larguraCaixa - 48, FERRUGEM, 7);
  const necs = coluna(
    n.necessidades,
    larguraCaixa + 52,
    yCaixas + 46,
    larguraCaixa - 48,
    VERDE,
    7,
  );
  const alturaCaixa = Math.max(dores.altura, necs.altura) + 62;
  const altura = yCaixas + alturaCaixa + 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${altura}" width="${L}" height="${altura}" role="img" aria-label="Mapa de empatia de ${esc(p.nome)}">
  <rect width="${L}" height="${altura}" fill="#EAE8E0"/>

  <rect x="2" y="2" width="${L - 4}" height="${alturaQuadro - 2}" fill="none" stroke="#1A1D23" stroke-width="2"/>
  <g stroke="#CFCABA" stroke-width="1.2" stroke-dasharray="7 5">
    <line x1="2" y1="2" x2="${L - 2}" y2="${alturaQuadro}"/>
    <line x1="${L - 2}" y1="2" x2="2" y2="${alturaQuadro}"/>
  </g>

  ${rotulo('O QUE PENSA E SENTE?', meioX, 30)}
  ${topo.svg}

  ${rotulo('O QUE OUVE?', 22, yMeio + 12, 'start')}
  ${esq.svg}

  ${rotulo('O QUE VÊ?', L - 22, yMeio + 12, 'end')}
  ${dir.svg}

  <svg x="${meioX - 58}" y="${rostoY}" width="116" height="116" viewBox="0 0 120 120">${retratos[p.id]}
  </svg>

  ${rotulo('O QUE DIZ E FAZ?', meioX, yBase)}
  ${base.svg}

  <rect x="2" y="${yCaixas}" width="${larguraCaixa - 2}" height="${alturaCaixa}" fill="#EAE8E0" stroke="#1A1D23" stroke-width="2"/>
  ${rotulo('DORES', 20, yCaixas + 28, 'start', FERRUGEM)}
  ${dores.svg}

  <rect x="${larguraCaixa + 16}" y="${yCaixas}" width="${larguraCaixa - 18}" height="${alturaCaixa}" fill="#EAE8E0" stroke="#1A1D23" stroke-width="2"/>
  ${rotulo('NECESSIDADES', larguraCaixa + 34, yCaixas + 28, 'start', VERDE)}
  ${necs.svg}
</svg>
`;
}

/** O retrato sozinho, para a tabela de personas do README. */
const retratoSVG = (p) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Retrato de ${esc(p.nome)}">${retratos[p.id]}
</svg>
`;

/* ─────────────────────────────  SAÍDA  ───────────────────────────── */

mkdirSync(saida, { recursive: true });

writeFileSync(saida + 'personas.html', documento(), 'utf8');
console.log('docs/personas.html');

for (const p of personas) {
  const arquivo = `persona-${p.id}.html`;
  writeFileSync(saida + arquivo, folhaDaPersona(p), 'utf8');
  console.log('docs/' + arquivo);
}


/* As mesmas personas como imagem, para o README e para slides. */
const imagens = fileURLToPath(new URL('../../.github/personas/', import.meta.url));
mkdirSync(imagens, { recursive: true });

for (const p of personas) {
  writeFileSync(imagens + p.id + '.svg', retratoSVG(p), 'utf8');
  writeFileSync(imagens + 'mapa-' + p.id + '.svg', mapaSVG(p), 'utf8');
  console.log('.github/personas/' + p.id + '.svg  ·  mapa-' + p.id + '.svg');
}

console.log(`\n${personas.length} personas · ${amostra.length} respondentes · 4 páginas`);
