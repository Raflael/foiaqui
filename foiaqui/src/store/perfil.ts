import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Como a pessoa entrou. Só `local` é real neste protótipo. */
export type Metodo = 'local' | 'google' | 'apple';

interface PerfilState {
  nome: string | null;
  cidade: string;
  metodo: Metodo | null;
  entrar: (nome: string, cidade: string, metodo: Metodo) => void;
  sair: () => void;
}

/**
 * Quem está usando o app neste aparelho.
 *
 * Antes era uma constante no código: o nome ficava gravado no fonte, e
 * qualquer pessoa que instalasse o app era "Rafael". Num produto sobre
 * autoria — cada memória mostra quem contou — identidade fixa no código é
 * mentira estrutural, não detalhe.
 *
 * Não há autenticação. Não há backend, então não existe conta, senha, nem
 * como provar que você é você. O que existe é uma identidade LOCAL: um nome
 * que fica neste aparelho e assina o que você criar. A tela de entrada diz
 * isso com todas as letras em vez de desenhar um cadeado que não tranca nada.
 *
 * Sobre onde a entrada aparece: NÃO na porta. A Decisão 1 da pesquisa é
 * explícita — abrir direto no mapa, sem splash nem onboarding obrigatório,
 * porque é o que Pokémon GO e Google Maps fazem e é o que entrega valor
 * antes de cobrar qualquer coisa. Identificar-se é exigido no momento de
 * CONTRIBUIR, que é quando a autoria passa a importar. Explorar é livre.
 */
export const usePerfil = create<PerfilState>()(
  persist(
    (set) => ({
      nome: null,
      cidade: 'São José dos Campos',
      metodo: null,
      entrar: (nome, cidade, metodo) => set({ nome: nome.trim(), cidade: cidade.trim(), metodo }),
      sair: () => set({ nome: null, metodo: null }),
    }),
    {
      name: 'foiaqui-perfil',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** A inicial do avatar. Vazio vira "?" em vez de quebrar o layout. */
export const inicialDe = (nome?: string | null) =>
  nome?.trim()?.[0]?.toUpperCase() ?? '?';

/** Como a memória deve ser assinada. */
export const autorDe = (nome?: string | null) => nome?.trim() || 'Anônimo';
