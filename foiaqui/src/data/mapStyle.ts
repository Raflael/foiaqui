/**
 * Estilo do Google Maps traduzido para a paleta Placa Esmaltada.
 *
 * Sem isto o mapa chega com a cara do Google e a identidade morre na tela mais
 * importante do app. Os tons são os mesmos de `theme/colors.ts` — escritos aqui
 * como literal porque o formato do Google só aceita hex cru.
 *
 * Duas decisões de conteúdo, não de cor:
 *
 * 1. Pontos de interesse somem. Restaurante, farmácia e loja competem com a
 *    memória pelo mesmo espaço visual, e o FoiAqui não é diretório de lugares
 *    (Decisão do benchmarking: "não virar diretório nem competir em busca").
 * 2. Parques ficam. Praça é lugar de memória — o Coreto está numa.
 */
export const mapStyle = [
  // o chão
  { elementType: 'geometry', stylers: [{ color: '#E4E1D6' }] },

  // rótulos: grafite com halo de cal, pra sobreviver sobre qualquer feição
  { elementType: 'labels.text.fill', stylers: [{ color: '#55524B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F4F3EE' }, { weight: 3 }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

  // nada compete com a memória
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  // exceto praça e parque, que são lugar de memória
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#D7DCCE' }] },
  { featureType: 'poi.park', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4A5F52' }] },

  // quarteirões
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#DAD6C9' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#E4E1D6' }] },

  // ruas claras sobre os quarteirões, como planta de cidade
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#F1EFE8' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#DFDCD1' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#55524B' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#F4F3EE' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#F6F4EE' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#CFCABA' }] },

  // água — o único teal do mapa
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#B3CBC5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2E6E68' }] },

  // divisas discretas; lote a lote é ruído
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#CFCABA' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#6B6A63' }] },
];
