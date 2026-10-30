// Draws every card illustration into public/images/<id>.svg, and each arena into arena-<id>.svg.
// Run with: node scripts/generate-art.ts
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ARENAS, CHARACTERS, SUPPORTS } from '../shared/cards.ts'
import { drawArena } from './art/arenas.ts'
import { drawCharacter, type Character } from './art/character.ts'
import { circle, ellipse, g, INK, line, lit, newCtx, rect, shape, svg, text } from './art/lib.ts'
import { extra } from './art/props.ts'
import { lighting, scene } from './art/scenes.ts'
import { drawSupport } from './art/supports.ts'

const OUT_DIR = join(import.meta.dirname, '..', 'public', 'images')

// Skin tones, spread across both teams.
const S1 = '#f6d5b8'
const S2 = '#f1c27d'
const S3 = '#e0ac69'
const S4 = '#c68642'
const S5 = '#8d5524'
const S6 = '#5c3a21'

const GRAY = '#cfcfcf'
const DARK = '#2b1d14'
const BROWN = '#5a3a22'

const CAST: Record<string, Character> = {
  // ---------- Time Azul ----------
  'pastor-corrupto': {
    scene: 'church', glow: '#ffe9b0', skin: S2,
    hair: { style: 'slick', color: DARK },
    eyes: { mood: 'smug' }, brows: 'raised', mouth: 'grin',
    outfit: { style: 'suit', color: '#2b2d42', tie: '#e9c46a' },
    accessories: ['cross'],
    props: [{ kind: 'bible', hand: 'left' }, { kind: 'cash', hand: 'right' }],
    extras: [{ kind: 'sparkles', x: 40, y: 60 }, { kind: 'sparkles', x: 200, y: 52 }],
  },
  'tio-do-zap': {
    scene: 'chat', glow: '#ffffff', skin: S1, old: true,
    hair: { style: 'balding', color: GRAY }, facialHair: { style: 'mustache', color: GRAY },
    glasses: { style: 'square', color: '#3a3a3a' },
    eyes: { mood: 'wide' }, brows: 'raised', mouth: 'shout',
    outfit: { style: 'polo', color: '#f2c94c' },
    props: [{ kind: 'phone', hand: 'right' }],
    extras: [
      { kind: 'bubble', x: 56, y: 44, label: 'URGENTE!!' },
      { kind: 'bubble', x: 186, y: 76, label: 'REPASSE', color: '#ffffff' },
      { kind: 'bubble', x: 50, y: 206, label: 'ÁUDIO 7:42' },
    ],
  },
  'patriota-de-acampamento': {
    scene: 'congress', glow: '#fff6b0', skin: S3,
    hair: { style: 'buzz', color: '#3b2a20' }, facialHair: { style: 'stubble', color: '#3b2a20' },
    hat: { style: 'cap', color: '#009c3b', label: 'BR' },
    eyes: { mood: 'angry' }, brows: 'angry', mouth: 'shout',
    outfit: { style: 'tshirt', color: '#ffdf00', print: 'BRASIL', printColor: '#009c3b' },
    props: [{ kind: 'flag', hand: 'left', flag: 'brasil' }],
  },
  'agroboy-de-hilux': {
    scene: 'farm', glow: '#fff3c4', skin: S2,
    hair: { style: 'short', color: BROWN },
    hat: { style: 'cowboy', color: '#8a5a2b' },
    eyes: { mood: 'smug' }, brows: 'raised', mouth: 'grin',
    outfit: { style: 'flannel', color: '#c0392b' },
    accessories: ['chain'],
    props: [{ kind: 'keys', hand: 'right', label: 'HILUX' }],
  },
  'ancap-de-twitter': {
    scene: 'streamer', glow: '#ffd166', skin: S1,
    hair: { style: 'messy', color: '#d4a72c' },
    glasses: { style: 'sun', color: '#1b1b1b' },
    brows: 'raised', mouth: 'smirk',
    outfit: { style: 'tshirt', color: '#ffd60a', print: 'IMPOSTO É ROUBO', printColor: '#231c26' },
    props: [{ kind: 'phone', hand: 'right', color: '#8ecae6' }],
    extras: [{ kind: 'hashtag', x: 58, y: 120, label: '#LIBERDADE', color: '#1d9bf0', rotate: -8 }],
  },
  'saudosista-da-ditadura': {
    scene: 'barracks', glow: '#e9d27a', skin: S2, old: true,
    hair: { style: 'short', color: GRAY }, facialHair: { style: 'mustache', color: GRAY },
    hat: { style: 'military', color: '#4b5d3a' },
    eyes: { mood: 'angry' }, brows: 'angry', mouth: 'frown',
    outfit: { style: 'uniform', color: '#556b2f', inner: '#e9e4d0', tie: '#2f3b24' },
    accessories: ['medals'],
  },
  'filosofo-de-youtube': {
    scene: 'library', glow: '#ffe8c2', skin: S4,
    hair: { style: 'sidepart', color: DARK }, facialHair: { style: 'goatee', color: DARK },
    glasses: { style: 'round', color: '#3a2a1a' },
    brows: 'skeptical', mouth: 'smirk',
    outfit: { style: 'turtleneck', color: '#2b2d42' },
    props: [{ kind: 'book', hand: 'left', label: 'A VERDADE' }, { kind: 'mic', hand: 'right', label: 'LIVE' }],
  },
  'empresario-do-estado-minimo': {
    scene: 'office', glow: '#ffffff', skin: S1,
    hair: { style: 'slick', color: '#7a7a7a' },
    eyes: { mood: 'smug' }, brows: 'raised', mouth: 'grin',
    outfit: { style: 'suit', color: '#1d3557', tie: '#e63946' },
    props: [{ kind: 'document', hand: 'left', label: 'PRIVATIZA' }, { kind: 'cash', hand: 'right' }],
    extras: [{ kind: 'money', x: 60, y: 60, rotate: -20 }, { kind: 'money', x: 190, y: 90, rotate: 18 }],
  },
  'herdeiro-meritocrata': {
    scene: 'yacht', glow: '#fff0d6', skin: S1,
    hair: { style: 'sidepart', color: '#d4a15a' },
    glasses: { style: 'sun', color: '#c9a227' },
    brows: 'raised', mouth: 'smirk',
    outfit: { style: 'polo', color: '#f4a3c4' },
    props: [{ kind: 'wine', hand: 'right' }],
    extras: [{ kind: 'sparkles', x: 48, y: 72 }],
  },
  'senhora-da-panela-gourmet': {
    scene: 'balcony', glow: '#ffe8a3', skin: S2,
    hair: { style: 'bob', color: '#e2c28a' }, lips: '#c9184a',
    eyes: { mood: 'angry' }, brows: 'angry', mouth: 'shout',
    outfit: { style: 'blouse', color: '#ffdf00' },
    accessories: ['pearls', 'earrings'],
    props: [{ kind: 'pan', hand: 'left' }, { kind: 'spoon', hand: 'right' }],
    extras: [{ kind: 'sparkles', x: 30, y: 150, color: '#ffffff' }, { kind: 'sparkles', x: 74, y: 132, color: '#ffffff' }],
  },
  'faria-limer-de-colete': {
    scene: 'skyline', glow: '#ffd9a0', skin: S3,
    hair: { style: 'short', color: '#3b2a20' },
    brows: 'flat', mouth: 'smile',
    outfit: { style: 'vest', color: '#2b2d42', inner: '#a8dadc' },
    accessories: ['lanyard'], lanyardLabel: 'STARTUP',
    props: [{ kind: 'coffee', hand: 'right', color: '#ffffff' }],
  },
  'monarquista-de-instagram': {
    scene: 'palace', glow: '#ffd6a5', skin: S1,
    hair: { style: 'sidepart', color: '#3b2a20' }, facialHair: { style: 'mustache', color: '#3b2a20' },
    hat: { style: 'crown', color: '#f2c14e' },
    eyes: { mood: 'smug' }, brows: 'raised', mouth: 'smirk',
    outfit: { style: 'suit', color: '#7b1e3a' },
    props: [{ kind: 'flag', hand: 'left', flag: 'monarchy' }, { kind: 'phone', hand: 'right', color: '#ffafcc' }],
    extras: [{ kind: 'likes', x: 190, y: 160, label: '1,2k' }],
  },
  'deputado-da-bancada-da-bala': {
    scene: 'congress', glow: '#ffffff', skin: S4,
    hair: { style: 'balding', color: DARK }, facialHair: { style: 'mustache', color: DARK },
    eyes: { mood: 'angry' }, brows: 'angry', mouth: 'shout',
    outfit: { style: 'suit', color: '#3d405b', tie: '#264653' },
    accessories: ['pin'], pinLabel: '★',
    props: [{ kind: 'mic', hand: 'right', label: 'CÂMARA' }],
  },
  'coronel-do-interior': {
    scene: 'farm', glow: '#fff3c4', skin: S4, old: true,
    facialHair: { style: 'mustache', color: GRAY },
    hat: { style: 'cowboy', color: '#f1e4c8' },
    eyes: { mood: 'smug' }, brows: 'flat', mouth: 'smirk',
    outfit: { style: 'shirt', color: '#ffffff' },
    accessories: ['chain'],
    props: [{ kind: 'cash', hand: 'left' }],
  },
  'medico-do-tratamento-milagroso': {
    scene: 'clinic', glow: '#ffffff', skin: S5,
    hair: { style: 'short', color: '#1b1b1b' },
    glasses: { style: 'square', color: '#1b1b1b' },
    brows: 'raised', mouth: 'grin',
    outfit: { style: 'labcoat', color: '#f4f6f8', inner: '#a8dadc', tie: '#1d5fd1' },
    accessories: ['stethoscope'],
    props: [{ kind: 'pills', hand: 'right', label: 'CURA TUDO' }],
    extras: [{ kind: 'sparkles', x: 200, y: 140 }],
  },
  'influencer-bela-e-recatada': {
    scene: 'garden', glow: '#ffe5ec', skin: S1,
    hair: { style: 'long', color: '#d4a15a' }, lips: '#e5989b',
    eyes: { mood: 'happy' }, brows: 'raised', mouth: 'smile',
    outfit: { style: 'blouse', color: '#ffc8dd' },
    accessories: ['pearls', 'earrings'],
    props: [{ kind: 'phone', hand: 'right', color: '#ffafcc' }],
    extras: [{ kind: 'likes', x: 52, y: 70, label: '87k' }, { kind: 'sparkles', x: 200, y: 60 }],
  },
  'gamer-anti-woke': {
    scene: 'streamer', glow: '#ff3cac', skin: S4,
    hair: { style: 'messy', color: '#3b2a20' },
    eyes: { mood: 'angry' }, brows: 'angry', mouth: 'shout',
    outfit: { style: 'hoodie', color: '#2b2d42', print: 'NO WOKE', printColor: '#ff3cac' },
    accessories: ['headphones'],
    props: [{ kind: 'controller', hand: 'left' }],
  },
  'ruralista-grileiro': {
    scene: 'farm', glow: '#fff3c4', skin: S2,
    facialHair: { style: 'mustache', color: '#3b2a20' },
    hat: { style: 'cowboy', color: '#5c3b1e' },
    eyes: { mood: 'smug' }, brows: 'skeptical', mouth: 'smirk',
    outfit: { style: 'flannel', color: '#2a9d8f' },
    props: [{ kind: 'sign', hand: 'left', label: 'TUDO MEU', color: '#ffd166' }, { kind: 'document', hand: 'right', label: 'ESCRITURA' }],
  },
  'cidadao-de-bem': {
    scene: 'balcony', glow: '#ffe8a3', skin: S5,
    hair: { style: 'short', color: '#1b1b1b' },
    hat: { style: 'cap', color: '#002776', label: 'BEM' },
    brows: 'flat', mouth: 'smile',
    outfit: { style: 'tshirt', color: '#ffdf00', print: 'CIDADÃO DE BEM', printColor: '#009c3b' },
    props: [{ kind: 'bible', hand: 'left' }, { kind: 'flag', hand: 'right', flag: 'brasil' }],
  },
  'terraplanista-patriota': {
    scene: 'space', glow: '#8ecae6', skin: S3,
    hair: { style: 'curly', color: '#3b2a20' },
    glasses: { style: 'nerd', color: '#1b1b1b' },
    eyes: { mood: 'wide' }, brows: 'raised', mouth: 'o',
    outfit: { style: 'tshirt', color: '#3a86ff', print: 'A TERRA É PLANA', printColor: '#ffffff' },
    props: [{ kind: 'disc', hand: 'right' }],
    extras: [{ kind: 'stars', x: 40, y: 200 }],
  },

  // ---------- Time Vermelho ----------
  'feminista-de-cabelo-verde': {
    scene: 'protest', glow: '#ffffff', skin: S2,
    hair: { style: 'pixie', color: '#40c057' },
    eyes: { mood: 'angry' }, brows: 'angry', mouth: 'shout',
    outfit: { style: 'tank', color: '#6a4c93', print: 'LUTA' },
    accessories: ['earrings'],
    props: [{ kind: 'megaphone', hand: 'right', color: '#9d4edd' }],
  },
  'eterno-estudante-de-humanas': {
    scene: 'campus', glow: '#ffe8c2', skin: S4,
    hair: { style: 'dreads', color: DARK }, facialHair: { style: 'beard', color: DARK },
    eyes: { mood: 'smug' }, brows: 'flat', mouth: 'smile',
    outfit: { style: 'tshirt', color: '#e76f51', print: '12º PERÍODO' },
    accessories: ['beads'],
    props: [{ kind: 'book', hand: 'left', label: 'TCC' }, { kind: 'coffee', hand: 'right', color: '#ffd166' }],
  },
  'comunista-de-iphone': {
    scene: 'skyline', glow: '#ffd9a0', skin: S1,
    hair: { style: 'short', color: '#3b2a20' }, facialHair: { style: 'beard', color: '#3b2a20' },
    hat: { style: 'beret', color: '#2b2d42', label: 'star' },
    brows: 'raised', mouth: 'smirk',
    outfit: { style: 'tshirt', color: '#d62828', print: 'REVOLUÇÃO' },
    props: [{ kind: 'coffee', hand: 'left', color: '#ffffff' }, { kind: 'smartphoneLogo', hand: 'right', color: '#1d1d24' }],
  },
  'sindicalista-pelego': {
    scene: 'stage', glow: '#fff3c4', skin: S5, old: true,
    hair: { style: 'balding', color: GRAY }, facialHair: { style: 'beard', color: GRAY },
    eyes: { mood: 'smug' }, brows: 'raised', mouth: 'grin',
    outfit: { style: 'suit', color: '#6d6875', tie: '#d62828' },
    props: [{ kind: 'cash', hand: 'left' }, { kind: 'mic', hand: 'right', label: 'SIND' }],
  },
  'militante-de-dce': {
    scene: 'campus', glow: '#ffffff', skin: S6,
    hair: { style: 'afro', color: '#1b1b1b' },
    eyes: { mood: 'angry' }, brows: 'angry', mouth: 'shout',
    outfit: { style: 'tshirt', color: '#e9c46a', print: 'DCE', printColor: '#231c26' },
    accessories: ['pin'], pinLabel: '!',
    props: [{ kind: 'sign', hand: 'right', label: 'FORA REITOR', color: '#ffffff' }],
  },
  'artista-da-esquerda-caviar': {
    scene: 'stage', glow: '#fff3c4', skin: S1,
    hair: { style: 'long', color: DARK }, facialHair: { style: 'goatee', color: DARK },
    glasses: { style: 'round', color: '#d62828' },
    eyes: { mood: 'smug' }, brows: 'raised', mouth: 'smirk',
    outfit: { style: 'turtleneck', color: '#1b1b1b' },
    accessories: ['scarf'],
    props: [{ kind: 'wine', hand: 'right' }],
  },
  'professor-que-cita-paulo-freire': {
    scene: 'library', glow: '#ffe8c2', skin: S3, old: true,
    hair: { style: 'balding', color: '#9e9e9e' }, facialHair: { style: 'beard', color: '#9e9e9e' },
    glasses: { style: 'square', color: '#5a3a22' },
    brows: 'raised', mouth: 'o',
    outfit: { style: 'flannel', color: '#6b705c' },
    props: [{ kind: 'book', hand: 'left', label: 'PEDAGOGIA' }, { kind: 'pointer', hand: 'right' }],
  },
  'vegano-lacrador': {
    scene: 'garden', glow: '#f1ffe0', skin: S2,
    hair: { style: 'bun', color: '#8a5a2b' },
    eyes: { mood: 'smug' }, brows: 'skeptical', mouth: 'smirk',
    outfit: { style: 'tank', color: '#80b918', print: 'GO VEGAN' },
    accessories: ['earrings'],
    props: [{ kind: 'juice', hand: 'right' }],
    extras: [{ kind: 'hashtag', x: 60, y: 70, label: '#GOVEGAN', color: '#2b9348', rotate: -8 }],
  },
  tankie: {
    scene: 'barracks', glow: '#ff8c8c', skin: S1,
    hair: { style: 'buzz', color: '#3b2a20' }, facialHair: { style: 'mustache', color: DARK },
    hat: { style: 'military', color: '#7b1e1e' },
    eyes: { mood: 'angry' }, brows: 'angry', mouth: 'frown',
    outfit: { style: 'uniform', color: '#5c4033', inner: '#e9e4d0' },
    accessories: ['medals'],
    props: [{ kind: 'flag', hand: 'left', flag: 'star' }],
  },
  'cancelador-profissional': {
    scene: 'streamer', glow: '#c77dff', skin: S4,
    hair: { style: 'pixie', color: '#c77dff' },
    glasses: { style: 'nerd', color: '#111111' },
    eyes: { mood: 'angry' }, brows: 'skeptical', mouth: 'smirk',
    outfit: { style: 'hoodie', color: '#3a0ca3', print: 'CANCELADO', printColor: '#ff4d6d' },
    props: [{ kind: 'phone', hand: 'right', color: '#ff4d6d' }],
    extras: [{ kind: 'hashtag', x: 60, y: 64, label: '#CANCELADO', color: '#e63946', rotate: -8 }, { kind: 'fire', x: 22, y: 230 }],
  },
  'cargo-comissionado': {
    scene: 'bureau', glow: '#fff8e1', skin: S3,
    hair: { style: 'slick', color: '#3b2a20' },
    eyes: { mood: 'smug' }, brows: 'flat', mouth: 'smile',
    outfit: { style: 'suit', color: '#adb5bd', tie: '#d62828' },
    accessories: ['lanyard'], lanyardLabel: 'ASSESSOR',
    props: [{ kind: 'coffee', hand: 'right', color: '#ffffff' }],
  },
  'lider-sem-terra-com-fazenda': {
    scene: 'farm', glow: '#fff3c4', skin: S5,
    facialHair: { style: 'mustache', color: '#1b1b1b' },
    hat: { style: 'straw', color: '#e9c46a' },
    eyes: { mood: 'smug' }, brows: 'raised', mouth: 'grin',
    outfit: { style: 'tshirt', color: '#d62828', print: 'TERRA' },
    props: [{ kind: 'document', hand: 'left', label: 'FAZENDA' }, { kind: 'keys', hand: 'right', label: '4x4' }],
  },
  'influencer-da-desconstrucao': {
    scene: 'festival', glow: '#ffe5ec', skin: S6,
    hair: { style: 'curly', color: '#1b1b1b' },
    glasses: { style: 'round', color: '#e63946' },
    brows: 'raised', mouth: 'smile',
    outfit: { style: 'tshirt', color: '#ff99c8', print: 'DESCONSTRUA', printColor: '#231c26' },
    accessories: ['earrings'],
    props: [{ kind: 'phone', hand: 'right', color: '#c77dff' }],
    extras: [{ kind: 'likes', x: 52, y: 80, label: '55k' }, { kind: 'sparkles', x: 200, y: 64 }],
  },
  'black-bloc-de-fim-de-semana': {
    scene: 'protest', glow: '#ffffff', skin: S2,
    eyes: { mood: 'angry' }, brows: 'angry', mouth: 'flat',
    outfit: { style: 'hoodie', color: '#1b1b1b' },
    accessories: ['balaclava'],
    props: [{ kind: 'sign', hand: 'right', label: 'SÓ ATÉ DOMINGO', color: '#ffffff' }],
    extras: [{ kind: 'smoke', x: 30, y: 240 }, { kind: 'fire', x: 26, y: 300 }],
  },
  'militante-que-nunca-erra': {
    scene: 'campus', glow: '#ffffff', skin: S4,
    hair: { style: 'ponytail', color: DARK },
    glasses: { style: 'square', color: '#111111' },
    eyes: { mood: 'smug' }, brows: 'skeptical', mouth: 'flat',
    outfit: { style: 'tshirt', color: '#2a9d8f', print: 'EU AVISEI' },
    accessories: ['earrings'],
    props: [{ kind: 'pointer', hand: 'right' }],
  },
  'hippie-da-vila-madalena': {
    scene: 'festival', glow: '#fff3c4', skin: S1,
    hair: { style: 'long', color: '#c9a227' },
    glasses: { style: 'round', color: '#e76f51' },
    eyes: { mood: 'happy' }, brows: 'raised', mouth: 'smile',
    outfit: { style: 'tshirt', color: '#ffbe0b', print: 'PAZ', printColor: '#8338ec' },
    accessories: ['flowerCrown', 'beads'],
    props: [{ kind: 'rose', hand: 'right' }],
    extras: [{ kind: 'notes', x: 44, y: 90 }, { kind: 'notes', x: 196, y: 120 }],
  },
  'academico-pos-estruturalista': {
    scene: 'library', glow: '#ffe8c2', skin: S1, old: true,
    hair: { style: 'messy', color: '#9e9e9e' }, facialHair: { style: 'beard', color: '#9e9e9e' },
    glasses: { style: 'round', color: '#1b1b1b' },
    brows: 'skeptical', mouth: 'o',
    outfit: { style: 'turtleneck', color: '#3d405b' },
    accessories: ['scarf'],
    props: [{ kind: 'book', hand: 'left', label: 'DISCURSO' }],
  },
  'jornalista-militante': {
    scene: 'newsroom', glow: '#ffffff', skin: S5,
    hair: { style: 'bob', color: '#1b1b1b' }, lips: '#9d0208',
    brows: 'raised', mouth: 'o',
    outfit: { style: 'jacket', color: '#e63946', inner: '#ffffff' },
    accessories: ['earrings'],
    props: [{ kind: 'mic', hand: 'right', label: 'TV' }],
  },
  'prefeito-do-palanque-eterno': {
    scene: 'stage', glow: '#fff3c4', skin: S3, old: true,
    hair: { style: 'sidepart', color: '#d9d9d9' },
    eyes: { mood: 'happy' }, brows: 'raised', mouth: 'grin',
    outfit: { style: 'suit', color: '#264653', tie: '#e63946' },
    props: [{ kind: 'mic', hand: 'right', label: 'VOTE' }],
    extras: [{ kind: 'stars', x: 40, y: 180 }, { kind: 'stars', x: 56, y: 150, color: '#ffffff' }],
  },
}

/** The NGO that only exists on paper: a ghost holding the money. */
function ghost(): string {
  const ctx = newCtx()
  const sheet = 'M64,330 L64,160 C64,96 92,72 120,72 C148,72 176,96 176,160 L176,330 L160,314 L144,330 L128,314 L112,330 L96,314 L80,330 Z'
  return svg(
    ctx,
    scene(ctx, 'bureau', 'ong') +
      lighting(ctx, '#e0f2ff') +
      ellipse(120, 326, 70, 10, '#000000', 0, { 'fill-opacity': 0.2 }) +
      g({ 'fill-opacity': 0.94 }, shape(sheet, lit(ctx, '#f1f5f9'))) +
      ellipse(102, 142, 10, 14, INK, 0) +
      ellipse(138, 142, 10, 14, INK, 0) +
      circle(99, 136, 3, '#ffffff', 0) +
      circle(135, 136, 3, '#ffffff', 0) +
      ellipse(120, 180, 9, 11, INK, 0) +
      ellipse(92, 166, 9, 5, '#ff8fab', 0, { 'fill-opacity': 0.4 }) +
      ellipse(148, 166, 9, 5, '#ff8fab', 0, { 'fill-opacity': 0.4 }) +
      // Money bag and a project that never happened.
      shape('M170,300 C146,300 146,250 176,234 L184,224 H200 L208,234 C238,250 238,300 214,300 Z', lit(ctx, '#7bc47f')) +
      text('R$', 192, 282, 16, '#1b4332') +
      g(
        { transform: 'rotate(-10 56 236)' },
        rect(24, 200, 64, 76, '#fffdf5', 3, 2.5),
        text('PROJETO', 56, 216, 9, INK),
        line('M32,228 h48 M32,238 h48 M32,248 h36', '#adb5bd', 2),
        text('ADIADO', 56, 266, 10, '#d62828'),
      ) +
      extra(ctx, { kind: 'money', x: 200, y: 200, rotate: 20 }),
  )
}

const CUSTOM: Record<string, () => string> = { 'ong-fantasma': ghost }

let written = 0
for (const card of CHARACTERS) {
  const art = CUSTOM[card.id]?.() ?? (CAST[card.id] ? drawCharacter(CAST[card.id], card.id) : null)
  if (!art) throw new Error(`No art defined for character ${card.id}`)
  writeFileSync(join(OUT_DIR, `${card.id}.svg`), art)
  written++
}
for (const card of SUPPORTS) {
  writeFileSync(join(OUT_DIR, `${card.id}.svg`), drawSupport(card.id))
  written++
}
for (const arena of ARENAS) {
  writeFileSync(join(OUT_DIR, `arena-${arena.id}.svg`), drawArena(arena.id))
  written++
}
console.log(`Wrote ${written} images to ${OUT_DIR}`)
