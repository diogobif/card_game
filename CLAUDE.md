# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

A multiplayer card game web app (rules below). UI text is in Portuguese (pt-BR).

## Architecture

Three code roots, all TypeScript:

- `src/`: React client. Routes in `src/App.tsx`: `/` login, `/home` lobby (online players + invites), `/match/:matchId` match.
- `server/`: Node WebSocket server (`ws`), run directly with Node's built-in type stripping (no build step). All state (online players, pending invites, matches) is **in memory**: no database, by design.
- `shared/`: code imported by both sides. `player.ts` (Player/Team types + `isPlayer` validation), `protocol.ts` (the `ClientMessage` / `ServerMessage` unions), `cards.ts` (card types, loads the card list from `shared/data/cards.json`, which holds placeholder test cards) and `game.ts` (game constants and the per-player `GameView`). Any new client↔server message goes into `protocol.ts` first. Because Node runs these files unbundled, shared code must stay erasable-syntax TS with explicit `.ts` import extensions.

Client data flow:

- `PlayerContext` (`src/player/`): current player `{ id, name, team }`, persisted in `sessionStorage` (each tab is its own player, which makes two-tab testing easy).
- `ServerContext` (`src/net/`): one WebSocket per logged-in player, auto-reconnects, sends `hello` on every (re)connect. Exposes `users`, `invites`, `currentMatch`, `send`, and `subscribe` (pages listen for one-off messages like `link-created`). A `match-start` message navigates to `/match/:id` from anywhere.
- Pages that need a player redirect to `/` with `state.from`, and login returns there (this is how invite links work for players who haven't logged in yet).

The game engine is `server/game.ts`: the server is authoritative and sends each player a `game-state` with their own `GameView` (opponent hand and unused support hidden; each player draws from their own team's deck) after every change. The client renders it in `src/match/GameBoard.tsx`; `ServerContext.game` keeps the last view so the result stays visible after the match ends. Each view also carries `lastAttack` (an `AttackEvent` with before/after stats); `src/match/AttackFx.tsx`, mounted outside the per-phase board, plays each new attack id once as a short clash animation with synthesized Web Audio sounds (`src/match/sfx.ts`, mute stored in `localStorage`).

Server rules worth knowing: a match is created by an accepted direct invite or by an invite link (a match with one player waiting). Players are identified by `player.id`, not by socket, so a reload rejoins the same match. A player offline for 60s has their matches ended. Players on the same team may play each other.

In dev, Vite proxies `/ws` to the game server on port 3001 (`vite.config.ts`). In production the game server is the only process: one HTTP server (`PORT`, default 3001) serves the built `dist/` with SPA fallback (`server/static.ts`), answers `/healthz`, and upgrades `/ws`. The `Dockerfile` builds the client and runs `node server/index.ts` (no server build step). State is in memory, so run a single replica.

## Stack

React 19, TypeScript 6, Vite 8 (Rolldown-based, `@vitejs/plugin-react`), oxlint. Package manager is **pnpm** (enabled via Corepack). Don't use npm or yarn, and keep `pnpm-lock.yaml` as the only lockfile.

## Commands

- `pnpm dev`: Vite (HMR) + game server (`node --watch`) together via `concurrently`
- `pnpm dev:web` / `pnpm dev:server`: run just one of them
- `pnpm build`: type-check (`tsc -b`) then production build to `dist/`
- `pnpm lint`: oxlint (config in `.oxlintrc.json`)
- `pnpm preview`: serve the built `dist/`
- `pnpm start`: production server (serves `dist/` + WebSocket; run `pnpm build` first)
- `docker compose up --build`: build and run the production image on port 3001
- `pnpm exec tsc -b`: type-check only
- `pnpm art`: redraw every card illustration into `public/images/<id>.svg` (generator in `scripts/art/`, cast list in `scripts/generate-art.ts`; a new card needs an entry there)

No test framework is set up yet.

## TypeScript constraints

The project uses TS project references: `tsconfig.app.json` covers `src/` + `shared/`, `tsconfig.server.json` covers `server/` + `shared/` + `scripts/`, and `tsconfig.node.json` covers `vite.config.ts`. `pnpm build` type-checks all three. Compiler flags that affect how code must be written:

- `verbatimModuleSyntax`: type-only imports must use `import type` / `import { type X }`.
- `erasableSyntaxOnly`: no `enum`, `namespace`, or constructor parameter properties. Use union types or `as const` objects instead.
- `noUnusedLocals` / `noUnusedParameters`: unused code fails the build.
- `allowImportingTsExtensions`: imports may include `.ts` / `.tsx` extensions.

## Lint rules

oxlint enforces `react/rules-of-hooks` (error) and `react/only-export-components` (warn). The second rule keeps Fast Refresh working, so component files should export only components (constant exports are allowed).

# Card game

## what it is

- esse é um jogo de cartas baseado em turnos estilo yu-gi-oh.
- existem dois times, o time vermelho e o time azul, cada jogador deve escolher seu time, jogadores com mesmo time podem jogar uns contra os outros
- o jogo vai consistir em um deck com 40 cartas de personagem, 20 cartas favorecendo cada lado, e 10 cartas de suporte, 5 favorecendo cada lado
- as partidas vao acontecer em uma "arena" escolhida randomicamente, arenas podem ser neutras ou favorecer um lado, ao todo serao 5 arenas, uma neutra e 2 que favorecem um lado
- a partida inicia com cada jogador recebendo 5 cartas de personagem aleatórias, uma carta de suporte e 20 pontos de vida
- cada carta de personagem tem um valor de forca que varia de 1 a 10, e uma pontuacao de resistencia que varia de 1 a 10 também, as cartas de suporte servem para adicionar mais poder ao seu personagem ou reduzir o poder do seu adversario
- a cada turno cada jogador escolhe uma carta de personagem para o turno, os jogadores tem 1 minuto para escolher sua carta por turno
- após escolher sua carta as cartas sao reveladas, a cada turno um jogador pode escolher qual personagem seu vai atacar o personagem do oponente, esse jogador muda a cada turno.
- incia escolhendo o ataque o jogador que colocar a carta de personagem mais forte no primeiro turno
- cada carta de personagem vai consistir no nome, uma imagem ilustrativa e os pontos de forca e resistencia dela

### mecanica do jogo

- cada carta de personagem possui uma pontuacao de forca e de resitencia
- todo personagem possui um tipo, e as cartas de suporte vao favorecer um tipo e desfavorecer outro, ela pode aumentar ou diminuir os pontos de ataque/defesa dos tipos específicos
- cada vez que o meu personagem ataca outro personagem é reduzido dos pontos de resistencia dele o valor de forca do perasonagem que atacou, porém também é reduzido dos pontos de forca do meu personagem o valor da resistencia do que sofreu o ataque. Ex: se um personagem com forca 10 ataca um com resistencia 5 o ponto de forca dele pro próximo turno vai ser 5 e o personagem atacado some da arena
- quando um personagem de forca 10 ataca um de resistencia 5, os 5 pontos restantes serao deduzidos direto dos pontos de vida do jogador
- haverao 2 cartas especiais de cada lado; elas tem forca e resistencia normais como qualquer personagem, mas quando uma carta especial é revelada ela remove todas as cartas do oponente da arena (incluindo a que ele acabou de jogar). Se os dois revelarem especiais no mesmo turno, as duas arenas sao limpas
- vence a partida quem zerar os pontos de vida do inimigo
- a cada carta de personagem que o jogador utiliza ele recebe outra do deck, o jogador sempre vai ter 5 cartas na sua mao
- the non neutral arenas will increase 1 attack and 1 resistance point for the characters of the favored team
- special cards are part of the deck; the special stays in the arena as a normal character after its effect
- the suuport cards are revealed with the character ones
- the player will use only one support card during the whole match, he can choose the turn to use it but after he chooses he cannot take it back
- the attack dures by turn
- each player has their own deck with only the cards of their team (20 characters); their support card is also from their team. Two players of the same team each get their own copy
- the attacker can use any of it´s cards to do the attack, not only the one he just choosed, but it is only one attack per turn
- if a player do not chooses a card in 60 seconds a random one from his hand will be chosen
- each player can have at most 3 characters in the arena; with 3 in the arena the player does not play a character that turn (keeps the hand) until one leaves
- if both players run out of cards (empty deck and empty hands) the player with more life points wins; equal life is a draw
- the match lasts at most 20 turns; after turn 20 the player with more life points wins; equal life is a draw

# roadmap

- 1 "login" page
- 2 "home page" the user can see other online users or can invite a friend using a generated link to a match
- 3 match page

# technical things

- the character cards must be a object with the name, category, attack, team, resistance and image link
- the support cards must be objects with the name, image link, and 2 props that will have the type that it helps, if increases power or resistance and the amount of points that it changes, same for the type which it reduce the points
- we should avoid using database, the users do not need to register, only choosing a name and a team and they can start to play
