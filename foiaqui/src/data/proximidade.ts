import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { memories } from '@/data/memories';
import { pontos } from '@/data/pontos';

export const TAREFA_PERTO = 'foiaqui-perto';

/** Raio da cerca, em metros. */
const RAIO_M = 90;

/**
 * O aviso de que você está passando por uma memória.
 *
 * É a única coisa no app que funciona com o celular no bolso, e por isso é a
 * única que precisa de permissão de localização em segundo plano — que no
 * Android 11+ obriga a pessoa a ir nas configurações e escolher "permitir o
 * tempo todo".
 *
 * Por isso nasce DESLIGADA e se liga no perfil. Pedir essa permissão na
 * abertura contrariaria a Decisão 1 ("nada de barreira antes do primeiro
 * valor") e, pior, gastaria o pedido mais caro do sistema com alguém que
 * ainda não sabe o que o app faz. Quem liga isso já entendeu a proposta e
 * está decidindo andar pela cidade com ela.
 *
 * A cerca é por PONTO, não por memória: oito lugares em vez de doze avisos,
 * senão o Mercado dispararia duas vezes na mesma esquina.
 */
export const cercas: Location.LocationRegion[] = pontos.map((p) => ({
  identifier: p.id,
  latitude: p.coords.lat,
  longitude: p.coords.lng,
  radius: RAIO_M,
  notifyOnEnter: true,
  notifyOnExit: false,
}));

/**
 * A tarefa precisa ser definida no escopo do módulo, e o módulo importado
 * cedo: quando o sistema acorda o app por causa de uma cerca, ele procura a
 * tarefa pelo nome antes de qualquer tela existir. Definir dentro de
 * componente faz o aviso simplesmente não chegar.
 */
TaskManager.defineTask(TAREFA_PERTO, async ({ data, error }) => {
  if (error) return;
  const evento = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };
  if (evento?.eventType !== Location.GeofencingEventType.Enter) return;

  const ponto = pontos.find((p) => p.id === evento.region.identifier);
  if (!ponto) return;

  const quantas = memories.filter((m) => m.pontoId === ponto.id).length;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Foi aqui: ${ponto.nome}`,
      body:
        quantas === 0
          ? 'Ninguém contou nada deste lugar ainda. Você seria a primeira pessoa.'
          : quantas === 1
            ? 'Tem uma memória guardada bem onde você está.'
            : `Tem ${quantas} memórias guardadas bem onde você está.`,
      data: { pontoId: ponto.id },
    },
    trigger: null,
  });
});

/** Liga o aviso. Devolve o motivo quando não dá — a tela precisa dizer qual é. */
export async function ligarAviso(): Promise<
  'ok' | 'sem-localizacao' | 'sem-segundo-plano' | 'sem-notificacao' | 'falhou'
> {
  const frente = await Location.requestForegroundPermissionsAsync();
  if (frente.status !== 'granted') return 'sem-localizacao';

  const fundo = await Location.requestBackgroundPermissionsAsync();
  if (fundo.status !== 'granted') return 'sem-segundo-plano';

  const aviso = await Notifications.requestPermissionsAsync();
  if (!aviso.granted) return 'sem-notificacao';

  try {
    await Location.startGeofencingAsync(TAREFA_PERTO, cercas);
    return 'ok';
  } catch {
    return 'falhou';
  }
}

/** Desliga. Silencioso de propósito: parar algo que já parou não é erro. */
export async function desligarAviso(): Promise<void> {
  try {
    if (await Location.hasStartedGeofencingAsync(TAREFA_PERTO)) {
      await Location.stopGeofencingAsync(TAREFA_PERTO);
    }
  } catch {
    // sem cerca ativa: nada a fazer
  }
}
