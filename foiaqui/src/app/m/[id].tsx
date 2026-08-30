import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useSheet } from '@/store/sheet';

/**
 * Destino dos links compartilhados: `foiaqui://m/<id>`.
 *
 * Não é uma tela — abre a ficha e devolve a pessoa ao mapa, que é onde a
 * memória faz sentido. Rota separada em vez de parâmetro no mapa porque
 * link precisa de endereço próprio para poder ser colado em qualquer lugar.
 */
export default function AbrirMemoria() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const open = useSheet((s) => s.open);

  useEffect(() => {
    if (id) open(id);
    router.replace('/');
  }, [id, open]);

  return null;
}
