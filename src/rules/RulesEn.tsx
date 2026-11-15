import {
  ARENA_BONUS,
  HAND_SIZE,
  MAX_FIELD,
  MAX_TURNS,
  START_LIFE,
  TURN_TIME_MS,
} from '../../shared/game.ts'

const SECONDS = TURN_TIME_MS / 1000

/** The rules in English; `categories` is the list of character types, already translated. */
export function RulesEn({ categories }: { categories: string }) {
  return (
    <div className="rules">
      <section>
        <h2>Goal</h2>
        <p>The first player to bring the opponent's {START_LIFE} life points to zero wins.</p>
        <p>A match lasts at most {MAX_TURNS} turns. At the end, the player with more life points wins.</p>
      </section>

      <section>
        <h2>The cards</h2>
        <ul>
          <li>
            <strong>Characters</strong> have strength ⚔ and resistance 🛡 (from 1 to 10) and a type: {categories}.
          </li>
          <li>
            <strong>Support</strong>: raises one stat of your characters of one type and lowers one stat
            of the opponent's characters of another type.
          </li>
        </ul>
      </section>

      <section>
        <h2>Starting the match</h2>
        <ul>
          <li>The match takes place in a randomly drawn arena.</li>
          <li>
            Each player starts with {HAND_SIZE} characters in hand, 1 support card and {START_LIFE} life
            points.
          </li>
          <li>Both players draw from the same deck.</li>
        </ul>
      </section>

      <section>
        <h2>Each turn</h2>
        <ol>
          <li>
            <strong>Choose:</strong> each player picks a character from their hand within {SECONDS}{' '}
            seconds. If time runs out, a random card is played.
          </li>
          <li>
            <strong>Support (optional):</strong> along with the character you can use your support
            card. It can only be used once per match, and its effect lasts only for that turn.
          </li>
          <li>
            <strong>Reveal:</strong> the cards are revealed at the same time and enter the arena. Each
            player draws a new card to keep {HAND_SIZE} in hand.
          </li>
          <li>
            <strong>Attack:</strong> one of the players picks one of their characters in the arena (any
            of them, not just the one they just played) and an opponent's character as the target. It is
            one attack per turn, with {SECONDS} seconds to decide.
          </li>
        </ol>
        <p>
          On the first turn, whoever revealed the character with more strength attacks (a tie is
          decided at random). After that, the attacker alternates every turn.
        </p>
      </section>

      <section>
        <h2>Combat</h2>
        <ul>
          <li>The target loses resistance equal to the attacker's strength.</li>
          <li>The attacker loses strength equal to the target's resistance.</li>
          <li>A character whose strength or resistance reaches zero leaves the arena.</li>
          <li>Damage taken carries over to the following turns.</li>
          <li>
            <strong>Excess damage:</strong> whatever is left of the attack comes straight off the
            opponent's life points.
          </li>
          <li>If the opponent has no characters in the arena, you attack their life points directly.</li>
        </ul>
        <p className="rules-example">
          Example: a character with strength 10 attacks one with resistance 5. The target leaves the
          arena, the attacker is left with strength 5, and the 5 leftover points come off the
          opponent's life points.
        </p>
      </section>

      <section>
        <h2>Arena</h2>
        <ul>
          <li>
            Each player can have at most {MAX_FIELD} characters in the arena. With a full arena, you
            don't play a card that turn (you keep your hand) until a character leaves.
          </li>
          <li>
            Team arenas give +{ARENA_BONUS} strength and +{ARENA_BONUS} resistance to that team's
            characters. The neutral arena gives no bonus.
          </li>
        </ul>
      </section>

      <section>
        <h2>End of the match</h2>
        <ul>
          <li>A player's life points reach zero.</li>
          <li>
            Turn {MAX_TURNS} ends: the player with more life wins (equal life is a draw).
          </li>
          <li>Both players run out of cards: the player with more life wins (equal life is a draw).</li>
          <li>
            A player gives up or stays disconnected for more than 60 seconds: they lose the match.
          </li>
        </ul>
      </section>
    </div>
  )
}
