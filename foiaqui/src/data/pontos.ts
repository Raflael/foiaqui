/**
 * Os pontos: lugares reais de São José dos Campos.
 *
 * Um PONTO é o lugar; uma MEMÓRIA é o que alguém conta sobre ele. Essa
 * separação é o que permite várias pessoas contribuírem no mesmo lugar em vez
 * de cada uma plantar um pin solto ao lado do outro — o mapa vira um feed por
 * lugar, e não uma nuvem de alfinetes concorrentes.
 *
 * As coordenadas vieram do OpenStreetMap (Nominatim), não de estimativa. As
 * anteriores eram aproximações minhas e erravam por até 800 m: a "Praça Afonso
 * Pena" semeada estava a quase um quilômetro da Praça Afonso Pena de verdade.
 *
 * A história de cada ponto tem fonte declarada, e isso não é adorno: o app
 * cobra "dá para saber quando foi?" de quem envia (ver `criterios.ts`). Um
 * acervo que não cumpre o próprio critério não tem como exigi-lo dos outros.
 */
export interface Fonte {
  titulo: string;
  url: string;
}

export interface Ponto {
  id: string;
  nome: string;
  /** cabe na chapa do pin */
  shortName: string;
  endereco: string;
  coords: { lat: number; lng: number };
  /** o que o lugar é hoje, em uma linha */
  hoje: string;
}

export const pontos: Ponto[] = [
  {
    id: 'mercado',
    nome: 'Mercado Municipal',
    shortName: 'Mercado',
    endereco: 'Rua Sete de Setembro, Centro',
    coords: { lat: -23.1807493, lng: -45.8859454 },
    hoje: 'Em funcionamento, tombado como patrimônio da cidade.',
  },
  {
    id: 'vicentina',
    nome: 'Parque Vicentina Aranha',
    shortName: 'Vicentina Aranha',
    endereco: 'Rua Eng. Prudente Meireles de Morais, Vila Adyana',
    coords: { lat: -23.1982378, lng: -45.8970653 },
    hoje: 'Parque público aberto à cidade desde 2008.',
  },
  {
    id: 'matriz',
    nome: 'Igreja Matriz de São José',
    shortName: 'Igreja Matriz',
    endereco: 'Praça Cônego Lima, Centro',
    coords: { lat: -23.1802791, lng: -45.8879176 },
    hoje: 'Em funcionamento; é a origem do núcleo urbano da cidade.',
  },
  {
    id: 'benedito',
    nome: 'Igreja de São Benedito',
    shortName: 'São Benedito',
    endereco: 'Praça Afonso Pena, 267, Centro',
    coords: { lat: -23.1861851, lng: -45.886922 },
    hoje: 'Em funcionamento. É o bem tombado mais antigo de São José.',
  },
  {
    id: 'parahyba',
    nome: 'Tecelagem Parahyba',
    shortName: 'Parahyba',
    endereco: 'Parque da Cidade, Bairro Santana',
    coords: { lat: -23.1647672, lng: -45.8852943 },
    hoje: 'Parque da Cidade Roberto Burle Marx e Fundação Cultural Cassiano Ricardo.',
  },
  {
    id: 'estacao',
    nome: 'Estação Ferroviária',
    shortName: 'Estação',
    endereco: 'Rua Maceió, Vila Terezinha',
    coords: { lat: -23.1738329, lng: -45.8856472 },
    hoje: 'Estação da linha do Vale, ainda de pé.',
  },
  {
    id: 'paco',
    nome: 'Paço Municipal',
    shortName: 'Paço Municipal',
    endereco: 'Praça Afonso Pena, 29, Centro',
    coords: { lat: -23.1851309, lng: -45.887515 },
    hoje: 'Sede do poder municipal, tombada em 1994.',
  },
  {
    id: 'artesacra',
    nome: 'Museu de Arte Sacra',
    shortName: 'Arte Sacra',
    endereco: 'Travessa Chico Luiz, 67, Centro',
    coords: { lat: -23.1808363, lng: -45.885489 },
    hoje: 'Museu na antiga Capela de Nossa Senhora Aparecida.',
  },
];

export const pontoPor = (id?: string | null) => pontos.find((p) => p.id === id);
