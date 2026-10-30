import { CATEGORIES } from '../../shared/cards.ts'
import {
  ARENA_BONUS,
  HAND_SIZE,
  MAX_FIELD,
  MAX_TURNS,
  START_LIFE,
  TURN_TIME_MS,
} from '../../shared/game.ts'
import { CATEGORY_LABELS } from '../match/labels.ts'
import './Rules.css'

const SECONDS = TURN_TIME_MS / 1000
const CATEGORY_LIST = CATEGORIES.map((c) => CATEGORY_LABELS[c]).join(', ')

/** The game rules, shared by the rules page and the in-match help panel. */
export function Rules() {
  return (
    <div className="rules">
      <section>
        <h2>Objetivo</h2>
        <p>Vence quem primeiro zerar os {START_LIFE} pontos de vida do oponente.</p>
        <p>A partida dura no máximo {MAX_TURNS} turnos. Ao final, vence quem tiver mais pontos de vida.</p>
      </section>

      <section>
        <h2>As cartas</h2>
        <ul>
          <li>
            <strong>Personagens</strong> têm força ⚔ e resistência 🛡 (de 1 a 10) e um tipo: {CATEGORY_LIST}.
          </li>
          <li>
            <strong>Suporte</strong>: aumenta um atributo dos seus personagens de um tipo e reduz um
            atributo dos personagens do oponente de outro tipo.
          </li>
        </ul>
      </section>

      <section>
        <h2>Início da partida</h2>
        <ul>
          <li>A partida acontece em uma arena sorteada.</li>
          <li>
            Cada jogador começa com {HAND_SIZE} personagens na mão, 1 carta de suporte e {START_LIFE}{' '}
            pontos de vida.
          </li>
          <li>Os dois jogadores compram do mesmo baralho.</li>
        </ul>
      </section>

      <section>
        <h2>Cada turno</h2>
        <ol>
          <li>
            <strong>Escolha:</strong> cada jogador escolhe um personagem da mão em até {SECONDS}{' '}
            segundos. Se o tempo acabar, uma carta aleatória é jogada.
          </li>
          <li>
            <strong>Suporte (opcional):</strong> junto com o personagem você pode usar sua carta de
            suporte. Ela só pode ser usada uma vez por partida, e o efeito vale apenas naquele turno.
          </li>
          <li>
            <strong>Revelação:</strong> as cartas são reveladas ao mesmo tempo e entram na arena. Cada
            jogador compra uma carta nova, para manter {HAND_SIZE} na mão.
          </li>
          <li>
            <strong>Ataque:</strong> um dos jogadores escolhe um de seus personagens na arena (qualquer
            um, não só o que acabou de jogar) e um personagem do oponente como alvo. É um ataque por
            turno, com {SECONDS} segundos para decidir.
          </li>
        </ol>
        <p>
          No primeiro turno ataca quem revelou o personagem com mais força (empate é decidido no
          sorteio). Depois, o atacante alterna a cada turno.
        </p>
      </section>

      <section>
        <h2>Combate</h2>
        <ul>
          <li>O alvo perde resistência igual à força do atacante.</li>
          <li>O atacante perde força igual à resistência do alvo.</li>
          <li>Personagem com força ou resistência zerada sai da arena.</li>
          <li>O dano recebido continua nos turnos seguintes.</li>
          <li>
            <strong>Dano excedente:</strong> o que sobrar do ataque sai direto dos pontos de vida do
            oponente.
          </li>
          <li>Se o oponente não tem personagens na arena, você ataca os pontos de vida diretamente.</li>
        </ul>
        <p className="rules-example">
          Exemplo: um personagem com força 10 ataca um com resistência 5. O alvo sai da arena, o
          atacante fica com força 5, e os 5 pontos que sobraram saem dos pontos de vida do oponente.
        </p>
      </section>

      <section>
        <h2>Arena</h2>
        <ul>
          <li>
            Cada jogador pode ter no máximo {MAX_FIELD} personagens na arena. Com a arena cheia, você
            não joga carta naquele turno (mantém a mão) até que um personagem saia.
          </li>
          <li>
            Arenas de um time dão +{ARENA_BONUS} de força e +{ARENA_BONUS} de resistência aos
            personagens daquele time. A arena neutra não dá bônus.
          </li>
        </ul>
      </section>

      <section>
        <h2>Fim da partida</h2>
        <ul>
          <li>Os pontos de vida de um jogador chegam a zero.</li>
          <li>
            Chega ao fim o turno {MAX_TURNS}: vence quem tem mais vida (vida igual é empate).
          </li>
          <li>As cartas acabam para os dois: vence quem tem mais vida (vida igual é empate).</li>
          <li>
            Um jogador desiste ou fica desconectado por mais de 60 segundos: ele perde a partida.
          </li>
        </ul>
      </section>
    </div>
  )
}
