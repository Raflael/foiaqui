export type MediaType = 'photo' | 'audio' | 'video';

export interface Memory {
  id: string;
  /**
   * A qual PONTO esta memória pertence (`data/pontos.ts`).
   *
   * É o que permite várias pessoas contarem coisas do mesmo lugar sem cada uma
   * plantar um pin solto ao lado do outro: no mapa o ponto é um só, e por
   * dentro ele é um feed. Memória sem ponto continua válida — é o caso de quem
   * registra algo num lugar que ainda não existe no acervo.
   */
  pontoId?: string;
  title: string;
  /** nome curto pro rótulo do pin no mapa, onde não cabe o título inteiro */
  shortName: string;
  /**
   * A fala da placa: "Aqui funcionou", "Aqui ficava", "Aqui está".
   * É o que placa comemorativa de verdade escreve — e é o nome do app.
   * O tempo verbal já conta se a coisa sobreviveu ou não.
   */
  marker: string;
  /** período como aparece na chapa: "1958 — 1974" ou só o ano */
  period: string;
  /** ano da memória, como texto — é rótulo, não número pra conta */
  year: string;
  era: string;
  place: string;
  coords: { lat: number; lng: number };
  story: string;
  /** trecho de `story` que aparece em Fraunces, como o "drop" do protótipo */
  emphasis?: string;
  author: { name: string; level: number; role: string };
  /** "Foto + relato", "Foto histórica", "Foto + microdoc" */
  kind: string;
  verified: boolean;
  /**
   * De onde a informação veio, quando ela é documental.
   *
   * O app pergunta "dá para saber quando foi?" a quem envia (`criterios.ts`).
   * Um acervo que não mostra a própria fonte não tem como cobrar isso.
   */
  fonte?: { titulo: string; url: string };
  /**
   * Onde a memória está no fluxo de moderação (Decisão 5).
   * Recém-criada nasce 'em_revisao': quem enviou vê a própria no mapa,
   * marcada, mas ela ainda não foi conferida pela comunidade.
   */
  status?: 'publicada' | 'em_revisao' | 'recusada';
  media: { type: MediaType; uri: string }[];
  /** duração do áudio em segundos, quando há relato falado */
  audioSeconds?: number;
  tags: string[];
  /**
   * Foto antiga e foto atual. Aceita URI (o que a pessoa tirou) ou o número
   * que `require()` devolve (o que vem empacotado no app).
   */
  pastImageUri?: string | number;
  presentImageUri?: string | number;
  /** crédito e licença — obrigatório quando a foto é de terceiros */
  creditoFoto?: string;
}

export type TrailCover =
  | { kind: 'sepia' }
  | { kind: 'gradient'; colors: [string, string] };

export interface Trail {
  id: string;
  title: string;
  theme: string;
  durationMin: number;
  /** ids de Memory que já existem no mock */
  stopIds: string[];
  /** número de paradas do roteiro real — o mock só tem 3 memórias, então não é stopIds.length */
  stopCount: number;
  cover: TrailCover;
  coverUri?: string;
}

export interface Badge {
  id: string;
  label: string;
  earned: boolean;
  icon: string;
}

/** O perfil deixou de ser mock: ver `data/profile.ts`, que o deriva do uso real. */
