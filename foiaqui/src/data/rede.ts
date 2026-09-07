/** Por que uma chamada de rede não deu certo — o suficiente para escrever a frase certa na tela. */
export type MotivoDeFalha = 'demorou' | 'sem-conexao' | 'recusado';

export class ErroDeRede extends Error {
  constructor(readonly motivo: MotivoDeFalha) {
    super(motivo);
    this.name = 'ErroDeRede';
  }
}

/**
 * Quanto tempo faz sentido esperar, em pé na rua.
 *
 * Oito segundos não é um número técnico, é comportamental: passado isso a
 * pessoa já tirou o celular da frente do rosto. Falhar e oferecer "tentar de
 * novo" é melhor experiência do que continuar prometendo.
 */
const LIMITE_MS = 8000;

/**
 * `fetch` com prazo.
 *
 * Existe por causa do modo como a rede ruim realmente falha: ela raramente
 * recusa a conexão — ela **não responde**. E `fetch` sem `signal` não desiste
 * sozinho, então a promessa nunca resolve, o `.catch` nunca roda, e a tela
 * fica girando o "carregando" para sempre. Era exatamente o que acontecia na
 * busca do acervo livre: sob sinal fraco, o estado de erro era inalcançável.
 *
 * O prazo transforma o travamento em falha, e falha é coisa que a interface
 * sabe mostrar.
 *
 * A distinção entre os três motivos importa porque cada um pede uma frase
 * diferente: quem está sem sinal precisa saber que o resto do app continua
 * funcionando; quem levou timeout precisa de um botão para insistir.
 */
export async function buscaComPrazo(
  url: string,
  opcoes: RequestInit = {},
  limiteMs = LIMITE_MS,
): Promise<Response> {
  const controle = new AbortController();
  const alarme = setTimeout(() => controle.abort(), limiteMs);

  try {
    const resposta = await fetch(url, { ...opcoes, signal: controle.signal });
    if (!resposta.ok) throw new ErroDeRede('recusado');
    return resposta;
  } catch (e) {
    if (e instanceof ErroDeRede) throw e;
    // AbortError: o alarme disparou. Qualquer outra: o aparelho não alcançou o servidor.
    throw new ErroDeRede(
      e instanceof Error && e.name === 'AbortError' ? 'demorou' : 'sem-conexao',
    );
  } finally {
    clearTimeout(alarme);
  }
}

/**
 * O mesmo prazo para promessas que não são `fetch`.
 *
 * A geocodificação reversa do `expo-location` também pende sob sinal ruim, e
 * ela não aceita `AbortSignal` — dá para desistir de esperar, não dá para
 * cancelar. Como o resultado dela é cosmético (o endereço escrito; a
 * coordenada é o que vale), desistir é suficiente.
 */
export function comPrazo<T>(promessa: Promise<T>, limiteMs = LIMITE_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const alarme = setTimeout(() => reject(new ErroDeRede('demorou')), limiteMs);
    promessa.then(
      (v) => {
        clearTimeout(alarme);
        resolve(v);
      },
      (e) => {
        clearTimeout(alarme);
        reject(e);
      },
    );
  });
}
