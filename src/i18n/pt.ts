import type { Category, Stat } from '../../shared/cards.ts'
import { MAX_TURNS, type GameEndReason, type LogEntry } from '../../shared/game.ts'
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH, type Team } from '../../shared/player.ts'
import type { MatchErrorReason } from '../../shared/protocol.ts'

/** Portuguese, the default language. Its shape is the `Messages` type every language must match. */
export const pt = {
  language: {
    label: 'Idioma',
  },
  common: {
    back: 'Voltar',
    backHome: 'Voltar para o início',
    connecting: 'Conectando ao servidor…',
    howToPlay: 'Como jogar',
    opponent: 'Oponente',
  },
  teams: { red: 'Time Vermelho', blue: 'Time Azul' } as Record<Team, string>,
  categories: {
    influenciador: 'Influenciador',
    militante: 'Militante',
    empresario: 'Empresário',
    intelectual: 'Intelectual',
    politico: 'Político',
    burocrata: 'Burocrata',
    militar: 'Militar',
    religioso: 'Religioso',
  } as Record<Category, string>,
  /** Lowercase, used inside sentences. */
  stats: { attack: 'força', resistance: 'resistência' } as Record<Stat, string>,
  /** Capitalized, used as titles. */
  statTitles: { attack: 'Força', resistance: 'Resistência' } as Record<Stat, string>,

  login: {
    taglineStrong: 'Vermelho contra azul, carta contra carta.',
    tagline: 'Um duelo por turnos para dois jogadores. Sem cadastro: escolha um nome e um lado e comece a briga.',
    invitedTitle: 'Você foi convidado para uma partida!',
    invitedText: 'Escolha um nome e um time. A partida começa assim que você entrar.',
    heading: 'Entrar no jogo',
    nameLabel: 'Seu nome',
    nameHint: `De ${NAME_MIN_LENGTH} a ${NAME_MAX_LENGTH} letras ou números, sem espaços.`,
    nameTooShort: `O nome precisa ter pelo menos ${NAME_MIN_LENGTH} caracteres.`,
    nameInvalid: 'Use apenas letras e números, sem espaços ou símbolos.',
    teamLegend: 'Seu time',
    teamRequired: 'Escolha um time.',
    characters: (n: number) => `${n} personagens`,
    submit: 'Entrar',
    submitTeam: (team: string) => `Entrar no ${team}`,
    submitInvite: 'Entrar na partida',
    rulesLink: 'ma oe',
    steps: [
      ['Escolha seu time.', 'Você joga com as cartas do Time Vermelho ou do Time Azul.'],
      ['Desafie alguém.', 'Convide um jogador online ou mande um link para um amigo.'],
      [
        'Jogue em turnos de 1 minuto.',
        'Coloque personagens na arena e ataque até zerar a vida do oponente.',
      ],
    ] as [string, string][],
  },

  home: {
    tabInvites: (n: number) => `(${n}) ${n === 1 ? 'Convite' : 'Convites'}`,
    declined: (name: string) => `${name} não aceitou o convite.`,
    switchPlayer: 'Trocar jogador',
    disconnected: 'Sem conexão com o servidor. Tentando reconectar…',
    onlinePlayers: 'Jogadores online',
    challengeAny: 'Você pode desafiar jogadores dos dois times.',
    inviteFriend: 'Convidar um amigo',
    linkReady: 'Mande este link. A partida começa assim que seu amigo entrar.',
    inviteLinkLabel: 'Link de convite',
    copied: 'Copiado!',
    copy: 'Copiar',
    shareLink: 'Compartilhar link',
    shareText: 'Vem jogar comigo!',
    waitingFriend: 'Aguardando seu amigo entrar…',
    cancel: 'Cancelar',
    noLinkYet: 'Seu amigo não está na lista? Gere um link e mande para ele.',
    createLink: 'Gerar link de convite',
    firstTime: 'Primeira vez?',
    helpSteps: [
      'Convide alguém da lista ou mande um link.',
      'A cada turno, escolha 1 personagem da mão.',
      'Ataque os personagens do oponente até zerar a vida dele.',
    ],
    fullRules: 'Ver as regras completas',
    invitesReceived: 'Convites recebidos',
    newInvite: 'Novo convite',
    challenged: (name: string) => `${name} te desafiou para uma partida!`,
    /** Wraps the team name, which is shown in bold. */
    inviterTeam: (name: string): [string, string] => [`${name} é do `, '. Aceite para começar agora.'],
    alsoInvited: (team: string) => ` (${team}) também te convidou`,
    decline: 'Recusar',
    acceptMatch: 'Aceitar partida',
    accept: 'Aceitar',
    yourTeam: ' · seu time',
    online: (n: number) => `${n} online`,
    noneOnline: (team: string) => `Ninguém do ${team} online agora.`,
    busy: 'Ocupado',
    sent: 'Enviado',
    invite: 'Convidar',
    status: {
      'invited-me': 'Te convidou',
      busy: 'Em partida',
      sent: 'Convite enviado',
      available: 'Disponível',
    },
  },

  match: {
    title: 'Partida',
    errors: {
      'not-found': 'Partida não encontrada. O convite pode ter expirado ou sido cancelado.',
      full: 'Esta partida já está completa.',
    } as Record<MatchErrorReason, string>,
    ended: 'A partida terminou.',
    waitingOpponent: 'Aguardando o oponente…',
    preparing: 'Preparando a partida…',
  },

  cards: {
    label: (name: string, attack: number, resistance: number) =>
      `${name}, força ${attack}, resistência ${resistance}`,
    supportKicker: 'Suporte · 1x',
    supportOnce: 'Só pode ser usado uma vez por partida',
    used: 'Usado',
    yours: 'Seus',
    rival: 'Rival',
  },

  board: {
    steps: ['Escolher', 'Revelar', 'Atacar'],
    yourTurnTab: 'Sua vez',
    giveUpConfirm: 'Desistir da partida? Você será declarado perdedor.',
    banner: {
      chooseEyebrow: 'Sua vez',
      chooseTitle: 'Escolha 1 personagem da sua mão',
      chooseText: 'Ele entra na sua arena. As cartas dos dois jogadores são reveladas ao mesmo tempo.',
      chosenEyebrow: 'Carta escolhida',
      chosenTitle: (name: string) => `Aguardando ${name} escolher`,
      chosenText: 'As cartas serão reveladas quando os dois jogadores escolherem.',
      noCardsEyebrow: 'Sem cartas',
      noCardsTitle: 'Você não tem cartas na mão',
      noCardsText: 'Aguarde o oponente.',
      fullEyebrow: 'Arena cheia',
      fullTitle: (max: number) => `Sua arena já tem ${max} personagens`,
      fullText: 'Você não joga carta neste turno, até um dos seus personagens sair da arena.',
      theirAttackEyebrow: 'Vez do oponente',
      theirAttackTitle: (name: string) => `${name} está escolhendo o ataque`,
      theirAttackText: 'Qualquer personagem da sua arena pode ser atacado. Você ataca no próximo turno.',
      attackEyebrow: 'Sua vez de atacar',
      confirmDirect: 'Confirme o ataque direto',
      pickAttacker: 'Escolha qual dos seus personagens vai atacar',
      directText: 'O oponente não tem personagens na arena: o ataque vai direto nos pontos de vida.',
      step1: 'Sua vez de atacar · Passo 1 de 2',
      step1Text: 'Qualquer personagem da sua arena pode atacar, não só o que acabou de entrar. É 1 ataque por turno.',
      step2: 'Sua vez de atacar · Passo 2 de 2',
      step2Title: 'Agora escolha o personagem do oponente que vai sofrer o ataque',
      step2Text: 'Veja o resultado logo abaixo antes de confirmar.',
      remaining: 'restantes',
      waiting: 'aguardando',
      stepsLabel: 'Etapas do turno',
    },
    newTag: 'Nova',
    neutral: 'Neutra',
    turn: (turn: number, max: number) => `Turno ${turn} de ${max}`,
    decks: (mine: number, theirs: number) => `Seu baralho: ${mine} · Oponente: ${theirs}`,
    giveUp: 'Desistir',
    soundOn: 'Ativar som',
    soundOff: 'Desativar som',
    draw: 'Empate!',
    won: 'Você venceu!',
    lost: 'Você perdeu.',
    opponentForfeit: 'O oponente desistiu da partida.',
    youForfeit: 'Você desistiu da partida.',
    opponentDisconnected: 'O oponente ficou desconectado por mais de 60 segundos.',
    endReasons: {
      life: 'Os pontos de vida chegaram a zero.',
      'no-cards': 'As cartas acabaram; vence quem tem mais pontos de vida.',
      'turn-limit': `Fim dos ${MAX_TURNS} turnos; vence quem tem mais pontos de vida.`,
      forfeit: 'Um jogador desistiu da partida.',
      disconnect: 'Um jogador ficou desconectado por mais de 60 segundos.',
    } as Record<GameEndReason, string>,
    opponentArena: 'Arena do oponente',
    opponentExtra: (hand: number, supportUsed: boolean) =>
      `Mão: ${hand} · Suporte ${supportUsed ? 'usado' : 'disponível'}`,
    myExtra: (name: string, supportUsed: boolean) => `${name} · Suporte ${supportUsed ? 'usado' : 'disponível'}`,
    ready: 'Pronto',
    choosing: 'Escolhendo…',
    attacking: 'Atacando',
    clickTarget: 'Arena do oponente · clique no alvo',
    opponentArenaCount: (n: number, max: number) => `Arena do oponente · ${n} de ${max}`,
    targetTag: 'Alvo',
    turnSupports: 'Suportes deste turno',
    myArena: 'Sua arena',
    you: 'Você',
    youInitials: 'EU',
    clickAttacker: 'Sua arena · clique no personagem que vai atacar',
    switchAttackerHint: 'Sua arena · clique em outro para trocar o atacante',
    myArenaCount: (n: number, max: number) => `Sua arena · ${n} de ${max}`,
    attackerTag: 'Atacante',
    hand: 'Sua mão',
    handHint: 'Clique em uma carta para selecioná-la. Você pode trocar até confirmar.',
    nextTurnHint: 'Você joga uma carta da mão no próximo turno.',
    selectedTag: 'Selecionada',
    useSupport: 'Usar neste turno',
    history: 'Histórico',
    allRules: 'Todas as regras',
    yourPlay: 'Sua jogada',
    playStats: (attack: number, resistance: number, support: boolean) =>
      ` (força ${attack} · resistência ${resistance}) · ${support ? 'com suporte' : 'sem suporte'}`,
    pickFromHand: 'Escolha uma carta da sua mão',
    play: (name: string) => `Jogar ${name}`,
    playCard: 'Jogar carta',
    switchAttacker: 'Trocar atacante',
    attackDirect: 'Atacar diretamente',
    confirmAttack: 'Confirmar ataque',
    toastAttack: 'Sua vez de atacar!',
    toastChoose: 'Sua vez! Escolha um personagem',
    guideTitle: 'Como funciona um turno',
    guide: {
      chooseTitle: 'Escolha 1 personagem.',
      chooseText: 'Os dois jogadores escolhem ao mesmo tempo.',
      revealTitle: 'Revelação.',
      revealText: 'As cartas aparecem nas arenas.',
      attackTitle: 'Ataque.',
      attackTheirs: 'Neste turno quem ataca é o oponente. No próximo, é você.',
      attackText: 'Um jogador escolhe um atacante e um alvo. A vez de atacar alterna a cada turno.',
      howAttackWorks: 'Como o ataque funciona',
      attackRules: [
        'O alvo perde resistência igual à força do seu atacante.',
        'Seu atacante perde força igual à resistência do alvo.',
        'Se o alvo cair, o dano que sobrar vai direto na vida do oponente.',
      ],
    },
    effects: {
      targetLeaves: (name: string) => `${name} sai da arena`,
      targetResistance: (name: string, n: number) => `${name} fica com resistência ${n}`,
      lifeDamage: (damage: number, name: string, before: number, after: number) =>
        `${damage} de dano em ${name} (${before} → ${after})`,
      attackerLeaves: (name: string) => `${name} também sai da arena`,
      attackerAttack: (name: string, n: number) => `${name} fica com força ${n}`,
    },
    attacker: 'Atacante',
    target: 'Alvo',
    pickInYourArena: 'Escolha na sua arena',
    lifeOf: (name: string) => `Vida de ${name}`,
    pickInTheirArena: 'Escolha na arena do oponente',
    afterAttacker: 'depois do atacante',
    attackResult: 'Resultado do ataque',
    incoming: (name: string) => `${name} entra aqui`,
    yourCardHere: 'Sua carta entra aqui',
    freeSlot: 'Vaga livre',
    life: 'vida',
    willLose: (n: number) => `Perderá ${n} de vida`,
  },

  fx: {
    destroyed: (name: string) => `${name} foi destruída`,
    resistanceLeft: (name: string, n: number | null) => `${name} ficou com resistência ${n}`,
    damageOn: (damage: number, who: string) => `${damage} de dano em ${who}`,
    youObject: 'você',
    alsoDestroyed: (name: string) => `${name} também foi destruída`,
    youAttacked: 'Você atacou!',
    attacked: (name: string) => `${name} atacou!`,
    yourLife: 'Sua vida',
    lifeLoss: (n: number) => `−${n} vida`,
    destroyedTag: 'Destruída',
  },

  log: (e: LogEntry): string => {
    switch (e.kind) {
      case 'arena':
        return `Arena: ${e.arena}.`
      case 'forfeit':
        return `${e.player} desistiu da partida.`
      case 'disconnect':
        return `${e.player} perdeu a partida por desconexão.`
      case 'direct-attack':
        return `${e.attacker} atacou ${e.player} diretamente (${e.damage} de dano).`
      case 'attack':
        return `${e.attacker} (${e.power}) atacou ${e.target} (${e.guard}).`
      case 'excess-damage':
        return `${e.damage} de dano excedente em ${e.player}.`
      case 'left-arena':
        return `${e.card} saiu da arena.`
      case 'auto-pick':
        return `${e.player} não escolheu a tempo; carta aleatória.`
      case 'arenas-full':
        return 'As duas arenas estão cheias; nenhuma carta foi jogada.'
      case 'played':
        return `${e.player} jogou ${e.card}.`
      case 'support':
        return `${e.player} usou o suporte ${e.support}.`
      case 'no-attackers':
        return `${e.player} não tem personagens para atacar.`
      case 'attack-timeout':
        return `${e.player} não atacou a tempo.`
    }
  },
}

export type Messages = typeof pt
