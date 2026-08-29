import { useReducedMotion } from 'react-native-reanimated';

import { useSettings } from '@/store/settings';

/**
 * `true` quando é ok animar.
 *
 * Duas fontes: o "reduzir movimento" do sistema (que o Reanimated já observa)
 * e o "modo simples" do perfil — quem liga um, provavelmente quer o outro.
 * Toda animação decorativa (pulso dos pins, scanline do AR, float dos cards)
 * passa por aqui.
 */
export function useMotionEnabled(): boolean {
  const systemReduced = useReducedMotion();
  const simpleMode = useSettings((s) => s.simpleMode);
  return !systemReduced && !simpleMode;
}
