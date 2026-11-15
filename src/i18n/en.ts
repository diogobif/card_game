import { MAX_TURNS } from '../../shared/game.ts'
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '../../shared/player.ts'
import type { Messages } from './pt.ts'

export const en: Messages = {
  language: {
    label: 'Language',
  },
  common: {
    back: 'Back',
    backHome: 'Back to home',
    connecting: 'Connecting to the server…',
    howToPlay: 'How to play',
    opponent: 'Opponent',
  },
  teams: { red: 'Red Team', blue: 'Blue Team' },
  categories: {
    influenciador: 'Influencer',
    militante: 'Activist',
    empresario: 'Businessperson',
    intelectual: 'Intellectual',
    politico: 'Politician',
    burocrata: 'Bureaucrat',
    militar: 'Military',
    religioso: 'Religious',
  },
  stats: { attack: 'strength', resistance: 'resistance' },
  statTitles: { attack: 'Strength', resistance: 'Resistance' },

  login: {
    taglineStrong: 'Red versus blue, card versus card.',
    tagline: 'A turn-based duel for two players. No sign-up: pick a name and a side and start the fight.',
    invitedTitle: 'You were invited to a match!',
    invitedText: 'Pick a name and a team. The match starts as soon as you join.',
    heading: 'Join the game',
    nameLabel: 'Your name',
    nameHint: `${NAME_MIN_LENGTH} to ${NAME_MAX_LENGTH} letters or numbers, no spaces.`,
    nameTooShort: `The name must have at least ${NAME_MIN_LENGTH} characters.`,
    nameInvalid: 'Use only letters and numbers, no spaces or symbols.',
    teamLegend: 'Your team',
    teamRequired: 'Pick a team.',
    characters: (n) => `${n} characters`,
    submit: 'Join',
    submitTeam: (team) => `Join the ${team}`,
    submitInvite: 'Join the match',
    rulesLink: 'ma oe',
    steps: [
      ['Pick your team.', 'You play with the Red Team or the Blue Team cards.'],
      ['Challenge someone.', 'Invite an online player or send a link to a friend.'],
      ['Play 1-minute turns.', "Put characters in the arena and attack until your opponent's life hits zero."],
    ],
  },

  home: {
    tabInvites: (n) => `(${n}) ${n === 1 ? 'Invite' : 'Invites'}`,
    declined: (name) => `${name} declined the invite.`,
    switchPlayer: 'Switch player',
    disconnected: 'No connection to the server. Trying to reconnect…',
    onlinePlayers: 'Online players',
    challengeAny: 'You can challenge players from both teams.',
    inviteFriend: 'Invite a friend',
    linkReady: 'Send this link. The match starts as soon as your friend joins.',
    inviteLinkLabel: 'Invite link',
    copied: 'Copied!',
    copy: 'Copy',
    shareLink: 'Share link',
    shareText: 'Come play with me!',
    waitingFriend: 'Waiting for your friend to join…',
    cancel: 'Cancel',
    noLinkYet: "Your friend isn't on the list? Create a link and send it to them.",
    createLink: 'Create invite link',
    firstTime: 'First time?',
    helpSteps: [
      'Invite someone from the list or send a link.',
      'Each turn, pick 1 character from your hand.',
      "Attack your opponent's characters until their life hits zero.",
    ],
    fullRules: 'See the full rules',
    invitesReceived: 'Invites received',
    newInvite: 'New invite',
    challenged: (name) => `${name} challenged you to a match!`,
    inviterTeam: (name) => [`${name} is on the `, '. Accept to start now.'],
    alsoInvited: (team) => ` (${team}) also invited you`,
    decline: 'Decline',
    acceptMatch: 'Accept match',
    accept: 'Accept',
    yourTeam: ' · your team',
    online: (n) => `${n} online`,
    noneOnline: (team) => `No one from the ${team} is online right now.`,
    busy: 'Busy',
    sent: 'Sent',
    invite: 'Invite',
    status: {
      'invited-me': 'Invited you',
      busy: 'In a match',
      sent: 'Invite sent',
      available: 'Available',
    },
  },

  match: {
    title: 'Match',
    errors: {
      'not-found': 'Match not found. The invite may have expired or been canceled.',
      full: 'This match is already full.',
    },
    ended: 'The match is over.',
    waitingOpponent: 'Waiting for the opponent…',
    preparing: 'Preparing the match…',
  },

  cards: {
    label: (name, attack, resistance) => `${name}, strength ${attack}, resistance ${resistance}`,
    supportKicker: 'Support · 1x',
    supportOnce: 'Can only be used once per match',
    used: 'Used',
    yours: 'Yours',
    rival: 'Rival',
  },

  board: {
    steps: ['Choose', 'Reveal', 'Attack'],
    yourTurnTab: 'Your turn',
    giveUpConfirm: 'Give up the match? You will be declared the loser.',
    banner: {
      chooseEyebrow: 'Your turn',
      chooseTitle: 'Pick 1 character from your hand',
      chooseText: "It enters your arena. Both players' cards are revealed at the same time.",
      chosenEyebrow: 'Card chosen',
      chosenTitle: (name) => `Waiting for ${name} to choose`,
      chosenText: 'The cards will be revealed once both players have chosen.',
      noCardsEyebrow: 'No cards',
      noCardsTitle: 'You have no cards in your hand',
      noCardsText: 'Wait for the opponent.',
      fullEyebrow: 'Arena full',
      fullTitle: (max) => `Your arena already has ${max} characters`,
      fullText: "You don't play a card this turn, until one of your characters leaves the arena.",
      theirAttackEyebrow: "Opponent's turn",
      theirAttackTitle: (name) => `${name} is choosing the attack`,
      theirAttackText: 'Any character in your arena can be attacked. You attack next turn.',
      attackEyebrow: 'Your turn to attack',
      confirmDirect: 'Confirm the direct attack',
      pickAttacker: 'Choose which of your characters will attack',
      directText: 'The opponent has no characters in the arena: the attack goes straight to their life points.',
      step1: 'Your turn to attack · Step 1 of 2',
      step1Text: 'Any character in your arena can attack, not just the one that just entered. 1 attack per turn.',
      step2: 'Your turn to attack · Step 2 of 2',
      step2Title: "Now choose the opponent's character that will take the attack",
      step2Text: 'Check the result below before confirming.',
      remaining: 'left',
      waiting: 'waiting',
      stepsLabel: 'Turn steps',
    },
    newTag: 'New',
    neutral: 'Neutral',
    turn: (turn, max) => `Turn ${turn} of ${max}`,
    decks: (mine, theirs) => `Your deck: ${mine} · Opponent: ${theirs}`,
    giveUp: 'Give up',
    soundOn: 'Turn sound on',
    soundOff: 'Turn sound off',
    draw: 'Draw!',
    won: 'You won!',
    lost: 'You lost.',
    opponentForfeit: 'The opponent gave up the match.',
    youForfeit: 'You gave up the match.',
    opponentDisconnected: 'The opponent was disconnected for more than 60 seconds.',
    endReasons: {
      life: 'Life points reached zero.',
      'no-cards': 'The cards ran out; the player with more life points wins.',
      'turn-limit': `End of the ${MAX_TURNS} turns; the player with more life points wins.`,
      forfeit: 'A player gave up the match.',
      disconnect: 'A player was disconnected for more than 60 seconds.',
    },
    opponentArena: "Opponent's arena",
    opponentExtra: (hand, supportUsed) => `Hand: ${hand} · Support ${supportUsed ? 'used' : 'available'}`,
    myExtra: (name, supportUsed) => `${name} · Support ${supportUsed ? 'used' : 'available'}`,
    ready: 'Ready',
    choosing: 'Choosing…',
    attacking: 'Attacking',
    clickTarget: "Opponent's arena · click the target",
    opponentArenaCount: (n, max) => `Opponent's arena · ${n} of ${max}`,
    targetTag: 'Target',
    turnSupports: "This turn's supports",
    myArena: 'Your arena',
    you: 'You',
    youInitials: 'ME',
    clickAttacker: 'Your arena · click the character that will attack',
    switchAttackerHint: 'Your arena · click another one to switch the attacker',
    myArenaCount: (n, max) => `Your arena · ${n} of ${max}`,
    attackerTag: 'Attacker',
    hand: 'Your hand',
    handHint: 'Click a card to select it. You can change it until you confirm.',
    nextTurnHint: 'You play a card from your hand next turn.',
    selectedTag: 'Selected',
    useSupport: 'Use this turn',
    history: 'History',
    allRules: 'All rules',
    yourPlay: 'Your play',
    playStats: (attack, resistance, support) =>
      ` (strength ${attack} · resistance ${resistance}) · ${support ? 'with support' : 'without support'}`,
    pickFromHand: 'Pick a card from your hand',
    play: (name) => `Play ${name}`,
    playCard: 'Play card',
    switchAttacker: 'Switch attacker',
    attackDirect: 'Attack directly',
    confirmAttack: 'Confirm attack',
    toastAttack: 'Your turn to attack!',
    toastChoose: 'Your turn! Pick a character',
    guideTitle: 'How a turn works',
    guide: {
      chooseTitle: 'Pick 1 character.',
      chooseText: 'Both players choose at the same time.',
      revealTitle: 'Reveal.',
      revealText: 'The cards appear in the arenas.',
      attackTitle: 'Attack.',
      attackTheirs: "This turn the opponent attacks. Next turn, it's you.",
      attackText: 'One player picks an attacker and a target. The turn to attack alternates every turn.',
      howAttackWorks: 'How the attack works',
      attackRules: [
        "The target loses resistance equal to your attacker's strength.",
        "Your attacker loses strength equal to the target's resistance.",
        "If the target falls, the leftover damage goes straight to the opponent's life.",
      ],
    },
    effects: {
      targetLeaves: (name) => `${name} leaves the arena`,
      targetResistance: (name, n) => `${name} is left with ${n} resistance`,
      lifeDamage: (damage, name, before, after) => `${damage} damage to ${name} (${before} → ${after})`,
      attackerLeaves: (name) => `${name} also leaves the arena`,
      attackerAttack: (name, n) => `${name} is left with ${n} strength`,
    },
    attacker: 'Attacker',
    target: 'Target',
    pickInYourArena: 'Pick in your arena',
    lifeOf: (name) => `${name}'s life`,
    pickInTheirArena: "Pick in the opponent's arena",
    afterAttacker: 'after the attacker',
    attackResult: 'Attack result',
    incoming: (name) => `${name} goes here`,
    yourCardHere: 'Your card goes here',
    freeSlot: 'Free slot',
    life: 'life',
    willLose: (n) => `Will lose ${n} life`,
  },

  fx: {
    destroyed: (name) => `${name} was destroyed`,
    resistanceLeft: (name, n) => `${name} was left with ${n} resistance`,
    damageOn: (damage, who) => `${damage} damage to ${who}`,
    youObject: 'you',
    alsoDestroyed: (name) => `${name} was also destroyed`,
    youAttacked: 'You attacked!',
    attacked: (name) => `${name} attacked!`,
    yourLife: 'Your life',
    lifeLoss: (n) => `−${n} life`,
    destroyedTag: 'Destroyed',
  },

  log: (e) => {
    switch (e.kind) {
      case 'arena':
        return `Arena: ${e.arena}.`
      case 'forfeit':
        return `${e.player} gave up the match.`
      case 'disconnect':
        return `${e.player} lost the match by disconnection.`
      case 'direct-attack':
        return `${e.attacker} attacked ${e.player} directly (${e.damage} damage).`
      case 'attack':
        return `${e.attacker} (${e.power}) attacked ${e.target} (${e.guard}).`
      case 'excess-damage':
        return `${e.damage} excess damage to ${e.player}.`
      case 'left-arena':
        return `${e.card} left the arena.`
      case 'auto-pick':
        return `${e.player} didn't choose in time; random card.`
      case 'arenas-full':
        return 'Both arenas are full; no card was played.'
      case 'played':
        return `${e.player} played ${e.card}.`
      case 'support':
        return `${e.player} used the support ${e.support}.`
      case 'no-attackers':
        return `${e.player} has no characters to attack with.`
      case 'attack-timeout':
        return `${e.player} didn't attack in time.`
    }
  },
}
