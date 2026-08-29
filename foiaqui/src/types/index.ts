export type MediaType = 'photo' | 'audio' | 'video';

/** Posição do pin no `<MapCanvas>` stub (percentuais da tela).
 *  Sai daqui quando entrar o react-native-maps num dev build — aí vale só `coords`. */
export interface StubMapPos {
  left: `${number}%`;
  top: `${number}%`;
}

export interface Memory {
  id: string;
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
  media: { type: MediaType; uri: string }[];
  /** duração do áudio em segundos, quando há relato falado */
  audioSeconds?: number;
  tags: string[];
  /** enquanto não há fotos reais, o par passado/presente é desenhado (ver PhotoPlaceholder) */
  pastImageUri?: string;
  presentImageUri?: string;
  mapPos: StubMapPos;
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

export interface UserProfile {
  name: string;
  initial: string;
  level: number;
  city: string;
  role: string;
  stats: { memories: number; views: number; collections: number };
  badges: Badge[];
  /** memórias de outras pessoas esperando revisão da comunidade */
  moderationQueue: number;
}
