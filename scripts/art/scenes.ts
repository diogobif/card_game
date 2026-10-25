import { circle, el, H, linear, pattern, radial, rect, rng, tint, W, type Ctx } from './lib.ts'

export type Scene =
  | 'church'
  | 'farm'
  | 'skyline'
  | 'office'
  | 'campus'
  | 'congress'
  | 'protest'
  | 'streamer'
  | 'library'
  | 'barracks'
  | 'balcony'
  | 'garden'
  | 'stage'
  | 'clinic'
  | 'space'
  | 'newsroom'
  | 'palace'
  | 'yacht'
  | 'chat'
  | 'festival'
  | 'bureau'

const sky = (ctx: Ctx, top: string, bottom: string) =>
  rect(0, 0, W, H, linear(ctx, [[0, top], [1, bottom]]), 0, 0)

function windows(r: () => number, x: number, y: number, w: number, h: number, lit: string, dark: string): string {
  let out = ''
  for (let wy = y + 6; wy < y + h - 6; wy += 11) {
    for (let wx = x + 5; wx < x + w - 6; wx += 9) {
      out += rect(wx, wy, 5, 6, r() > 0.45 ? lit : dark, 1, 0)
    }
  }
  return out
}

const SCENES: Record<Scene, (ctx: Ctx, r: () => number) => string> = {
  church(ctx) {
    const glass = ['#e85d75', '#f2b84b', '#5fb3e8', '#7bd389', '#b28ae8']
    let panes = ''
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 6; j++) {
        panes += rect(62 + i * 24, 30 + j * 24, 22, 22, glass[(i + j * 2) % 5], 0, 0, { 'fill-opacity': 0.85 })
      }
    }
    return (
      sky(ctx, '#4a2c1a', '#8a5a2b') +
      // Arched window with stained glass, clipped by an arch outline.
      el('clipPath', { id: 'arch' }, el('path', { d: 'M60,180 V80 A60,60 0 0 1 180,80 V180 Z' })) +
      el('g', { 'clip-path': 'url(#arch)' }, rect(60, 20, 120, 160, '#ffe9b0', 0, 0) + panes) +
      el('path', { d: 'M60,180 V80 A60,60 0 0 1 180,80 V180 Z', fill: 'none', stroke: '#2a180c', 'stroke-width': 6 }) +
      el('path', { d: 'M120,20 V180 M60,104 H180', stroke: '#2a180c', 'stroke-width': 4 }) +
      // Light rays falling from the window.
      tint('M60,180 L0,336 L80,336 Z M180,180 L240,336 L160,336 Z', '#ffe9b0', 0.18) +
      rect(10, 40, 26, 296, '#6b4426', 0, 0) +
      rect(204, 40, 26, 296, '#6b4426', 0, 0) +
      rect(6, 34, 34, 12, '#7d5230', 2, 0) +
      rect(200, 34, 34, 12, '#7d5230', 2, 0)
    )
  },
  farm(ctx) {
    let rows = ''
    for (let i = 0; i < 9; i++) {
      rows += el('path', { d: `M${-40 + i * 40},336 L${100 + i * 5},200`, stroke: '#4f8f2f', 'stroke-width': 5, 'stroke-opacity': 0.6 })
    }
    return (
      sky(ctx, '#7ec8f2', '#d9f1ff') +
      circle(196, 52, 26, '#ffd65c', 0) +
      circle(196, 52, 38, '#ffe58f', 0, { 'fill-opacity': 0.35 }) +
      el('path', { d: 'M0,190 Q60,170 120,188 T240,180 V336 H0 Z', fill: '#8cc152' }) +
      el('path', { d: 'M0,210 Q80,190 160,206 T240,200 V336 H0 Z', fill: '#a0d468' }) +
      rows +
      // Silo and barn on the horizon.
      rect(18, 140, 22, 56, '#c9ccd1', 4, 2) +
      el('path', { d: 'M18,142 Q29,126 40,142', fill: '#9aa0a8', stroke: '#231c26', 'stroke-width': 2 }) +
      rect(40, 160, 34, 34, '#c0392b', 0, 2) +
      el('path', { d: 'M38,162 L57,146 L76,162 Z', fill: '#962d22', stroke: '#231c26', 'stroke-width': 2 }) +
      rect(52, 176, 10, 18, '#f5f0e6', 0, 2) +
      // Fence.
      el('path', { d: 'M150,214 H240 M150,226 H240 M160,206 V236 M190,206 V236 M220,206 V236', stroke: '#8a5a2b', 'stroke-width': 4 })
    )
  },
  skyline(ctx, r) {
    const blocks: [number, number, number][] = [
      [0, 120, 34], [30, 90, 30], [58, 140, 26], [82, 70, 34], [114, 110, 28], [140, 60, 30], [168, 100, 36], [202, 130, 40],
    ]
    return (
      sky(ctx, '#2e1f5e', '#f08a5d') +
      circle(60, 70, 18, '#ffd9a0', 0, { 'fill-opacity': 0.8 }) +
      blocks
        .map(([x, y, w]) => rect(x, y + 60, w, 280, '#2a2440', 0, 0) + windows(r, x, y + 60, w, 140, '#ffd36b', '#3b3458'))
        .join('')
    )
  },
  office(ctx, r) {
    let blinds = ''
    for (let y = 26; y < 200; y += 12) blinds += rect(30, y, 180, 3, '#ffffff', 0, 0, { 'fill-opacity': 0.5 })
    return (
      sky(ctx, '#e9edf2', '#c9d2dc') +
      rect(26, 20, 188, 190, '#9cc7ea', 4, 0) +
      rect(40, 90, 30, 120, '#6f8fb0', 0, 0) +
      windows(r, 40, 90, 30, 110, '#dfefff', '#5d7d9e') +
      rect(78, 60, 40, 150, '#7f9dbd', 0, 0) +
      windows(r, 78, 60, 40, 140, '#dfefff', '#6a89a9') +
      rect(160, 110, 44, 100, '#6f8fb0', 0, 0) +
      blinds +
      rect(22, 16, 196, 198, 'none', 6, 6, { stroke: '#f5f7fa' }) +
      // Potted plant.
      el('path', { d: 'M200,236 q-20,-40 4,-70 q4,30 10,40 q6,-30 20,-36 q-4,40 -14,66 Z', fill: '#3f9b5a' }) +
      rect(196, 232, 30, 40, '#d9822b', 4, 0)
    )
  },
  campus(ctx) {
    const brick = pattern(
      ctx,
      'brick',
      30,
      20,
      rect(0, 0, 30, 20, '#b5533c', 0, 0) +
        el('path', { d: 'M0,10 H30 M15,0 V10 M0,10 V20 M30,10 V20', stroke: '#8e3d2a', 'stroke-width': 2 }),
    )
    const posters: [number, number, number, string, string][] = [
      [14, 30, -6, '#f7e26b', 'ASSEMBLEIA'],
      [150, 24, 5, '#ffffff', 'GREVE JÁ'],
      [20, 150, 4, '#7fd1e0', 'SARAU'],
      [168, 140, -5, '#f4a3c4', 'DCE'],
    ]
    return (
      rect(0, 0, W, H, brick, 0, 0) +
      posters
        .map(([x, y, rot, c, label]) =>
          el(
            'g',
            { transform: `rotate(${rot} ${x + 30} ${y + 40})` },
            rect(x, y, 62, 80, c, 2, 2) +
              el('text', { x: x + 31, y: y + 22, 'font-size': 10, 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'Arial, Helvetica, sans-serif', fill: '#231c26' }, label) +
              rect(x + 8, y + 32, 46, 4, '#231c26', 1, 0, { 'fill-opacity': 0.4 }) +
              rect(x + 8, y + 42, 36, 4, '#231c26', 1, 0, { 'fill-opacity': 0.4 }) +
              rect(x + 8, y + 52, 42, 4, '#231c26', 1, 0, { 'fill-opacity': 0.4 }) +
              circle(x + 31, y + 4, 3, '#e74c3c', 1.5),
          ),
        )
        .join('')
    )
  },
  congress(ctx) {
    return (
      sky(ctx, '#5aa9e6', '#cfe9ff') +
      // Twin towers and the two domes.
      rect(104, 40, 14, 150, '#e8edf2', 0, 2) +
      rect(122, 40, 14, 150, '#e8edf2', 0, 2) +
      rect(100, 86, 40, 6, '#cdd5de', 0, 2) +
      el('path', { d: 'M20,190 Q50,150 80,190 Z', fill: '#f5f7fa', stroke: '#231c26', 'stroke-width': 2 }) +
      el('path', { d: 'M160,170 Q190,214 220,170 Z', fill: '#f5f7fa', stroke: '#231c26', 'stroke-width': 2 }) +
      rect(0, 188, W, 16, '#dfe5eb', 0, 2) +
      rect(0, 204, W, 132, '#7cc36b', 0, 0) +
      rect(0, 204, W, 6, '#5ea64d', 0, 0)
    )
  },
  protest(ctx, r) {
    let crowd = ''
    for (let i = 0; i < 14; i++) {
      const x = i * 18 + r() * 8 - 6
      const y = 180 + r() * 20
      crowd += circle(x, y, 9, '#3b3446', 0) + rect(x - 11, y + 7, 22, 60, '#3b3446', 8, 0)
    }
    return (
      sky(ctx, '#9aa4b5', '#d7dbe3') +
      tint('M0,60 Q60,30 120,60 T240,50 V120 H0 Z', '#ffffff', 0.4) +
      rect(10, 120, 70, 34, '#e74c3c', 3, 2, { transform: 'rotate(-6 45 137)' }) +
      rect(164, 110, 66, 34, '#f1c40f', 3, 2, { transform: 'rotate(5 197 127)' }) +
      el('path', { d: 'M44,154 V200 M196,144 V200', stroke: '#6b4426', 'stroke-width': 4 }) +
      crowd +
      rect(0, 230, W, 106, '#5d5866', 0, 0)
    )
  },
  streamer(ctx) {
    return (
      sky(ctx, '#140f2b', '#2a1d52') +
      // LED strip and shelves.
      rect(0, 20, W, 6, linear(ctx, [[0, '#ff3cac'], [0.5, '#784ba0'], [1, '#2b86c5']], [0, 0, 1, 0]), 0, 0) +
      rect(0, 26, W, 40, linear(ctx, [[0, '#ff3cac', 0.25], [1, '#ff3cac', 0]]), 0, 0) +
      rect(12, 90, 56, 6, '#3a2f66', 0, 0) +
      rect(18, 70, 10, 20, '#5ef2c2', 2, 0) +
      rect(32, 74, 10, 16, '#ff6b9a', 2, 0) +
      rect(46, 66, 14, 24, '#ffd166', 2, 0) +
      circle(196, 90, 38, 'none', 0, { stroke: '#f5f3ff', 'stroke-width': 7 }) +
      circle(196, 90, 46, 'none', 0, { stroke: '#f5f3ff', 'stroke-width': 2, 'stroke-opacity': 0.4 }) +
      rect(0, 260, W, 76, '#1d1540', 0, 0)
    )
  },
  library(ctx, r) {
    const colors = ['#8e3b46', '#2f5d62', '#c9a227', '#4a4e69', '#7b2d26', '#3d5a80', '#6a994e']
    let books = ''
    for (let shelf = 0; shelf < 4; shelf++) {
      const y = 20 + shelf * 64
      books += rect(0, y + 54, W, 8, '#5c3b1e', 0, 0)
      for (let x = 4; x < W - 8; ) {
        const w = 8 + Math.floor(r() * 8)
        const h = 36 + Math.floor(r() * 16)
        books += rect(x, y + 54 - h, w, h, colors[Math.floor(r() * colors.length)], 1, 1.5)
        x += w + 1
      }
    }
    return sky(ctx, '#7a5230', '#4d321c') + books
  },
  barracks(ctx) {
    return (
      sky(ctx, '#4b5d3a', '#2f3b24') +
      rect(0, 40, W, 18, '#c9a227', 0, 0, { 'fill-opacity': 0.7 }) +
      rect(0, 64, W, 6, '#c9a227', 0, 0, { 'fill-opacity': 0.5 }) +
      el('path', {
        d: 'M120,96 L132,130 L168,130 L139,151 L150,186 L120,165 L90,186 L101,151 L72,130 L108,130 Z',
        fill: '#e9d27a',
        'fill-opacity': 0.35,
      }) +
      rect(0, 270, W, 66, '#26301d', 0, 0)
    )
  },
  balcony(ctx, r) {
    return (
      sky(ctx, '#0f1c3f', '#2b3f73') +
      circle(190, 50, 16, '#f4f1de', 0) +
      rect(0, 90, 50, 250, '#1b2a52', 0, 0) +
      windows(r, 0, 90, 50, 150, '#ffd36b', '#243663') +
      rect(186, 110, 54, 230, '#1b2a52', 0, 0) +
      windows(r, 186, 110, 54, 150, '#ffd36b', '#243663') +
      rect(0, 240, W, 8, '#d9dde3', 0, 0) +
      el('path', {
        d: Array.from({ length: 13 }, (_, i) => `M${i * 20},248 V336`).join(' '),
        stroke: '#d9dde3',
        'stroke-width': 4,
      })
    )
  },
  garden(ctx, r) {
    let flowers = ''
    const cs = ['#ff7eb6', '#ffd166', '#ffffff', '#c77dff']
    for (let i = 0; i < 16; i++) {
      const x = r() * W
      const y = 230 + r() * 100
      flowers += circle(x, y, 4, cs[i % 4], 0) + circle(x, y, 1.6, '#f7b801', 0)
    }
    return (
      sky(ctx, '#bde0fe', '#e9f5db') +
      circle(36, 120, 42, '#57a773', 0) +
      circle(70, 100, 34, '#6cbf84', 0) +
      rect(48, 140, 10, 100, '#7a5230', 0, 0) +
      circle(200, 110, 46, '#57a773', 0) +
      rect(196, 140, 10, 100, '#7a5230', 0, 0) +
      el('path', { d: 'M0,220 Q120,200 240,220 V336 H0 Z', fill: '#90be6d' }) +
      flowers
    )
  },
  stage(ctx) {
    let bunting = ''
    const cs = ['#e63946', '#f1c40f', '#2a9d8f', '#ffffff']
    for (let i = 0; i < 9; i++) {
      bunting += el('path', { d: `M${i * 28},30 l14,22 l14,-22 Z`, fill: cs[i % 4], stroke: '#231c26', 'stroke-width': 1.5 })
    }
    return (
      sky(ctx, '#4a0d1a', '#7a1527') +
      tint('M60,0 L20,336 H100 Z', '#fff3c4', 0.18) +
      tint('M180,0 L140,336 H220 Z', '#fff3c4', 0.18) +
      el('path', { d: 'M0,0 H40 Q30,160 50,336 H0 Z', fill: '#b5172e', stroke: '#231c26', 'stroke-width': 2 }) +
      el('path', { d: 'M240,0 H200 Q210,160 190,336 H240 Z', fill: '#b5172e', stroke: '#231c26', 'stroke-width': 2 }) +
      el('path', { d: 'M0,30 Q120,50 240,30', fill: 'none', stroke: '#231c26', 'stroke-width': 1.5 }) +
      bunting +
      rect(0, 262, W, 74, '#6b4426', 0, 0)
    )
  },
  clinic(ctx) {
    return (
      sky(ctx, '#d8f3f0', '#a8ddd6') +
      rect(170, 30, 50, 50, '#ffffff', 8, 2) +
      rect(188, 38, 14, 34, '#e63946', 2, 0) +
      rect(178, 48, 34, 14, '#e63946', 2, 0) +
      rect(16, 40, 60, 150, '#f5fbfa', 4, 2) +
      rect(22, 50, 48, 30, '#bfe6e0', 2, 1.5) +
      rect(22, 90, 48, 30, '#bfe6e0', 2, 1.5) +
      circle(34, 64, 5, '#ffb703', 1.5) +
      circle(50, 66, 5, '#fb8500', 1.5) +
      rect(30, 98, 10, 16, '#8ecae6', 2, 1.5) +
      rect(46, 98, 10, 16, '#e5989b', 2, 1.5)
    )
  },
  space(ctx, r) {
    let stars = ''
    for (let i = 0; i < 40; i++) stars += circle(r() * W, r() * 220, r() * 1.6 + 0.4, '#ffffff', 0)
    return (
      sky(ctx, '#0b0b2b', '#2c2a6b') +
      stars +
      // The flat Earth: a disc with an ice wall.
      el('ellipse', { cx: 70, cy: 78, rx: 54, ry: 18, fill: '#e8f1ff', stroke: '#231c26', 'stroke-width': 2 }) +
      el('ellipse', { cx: 70, cy: 74, rx: 50, ry: 15, fill: '#3a86ff' }) +
      el('path', { d: 'M40,72 q10,-8 20,0 q6,6 14,-2 M84,70 q8,-6 16,2', fill: 'none', stroke: '#52b788', 'stroke-width': 5, 'stroke-linecap': 'round' }) +
      circle(204, 50, 10, '#ffd166', 0) +
      rect(0, 280, W, 56, '#1a1745', 0, 0)
    )
  },
  newsroom(ctx) {
    let screens = ''
    const cs = ['#3a86ff', '#e63946', '#2a9d8f', '#8338ec']
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const x = 14 + i * 72
        const y = 26 + j * 56
        screens += rect(x, y, 66, 48, '#111827', 3, 2) + rect(x + 4, y + 4, 58, 40, cs[(i + j) % 4], 1, 0, { 'fill-opacity': 0.85 })
        screens += rect(x + 8, y + 32, 40, 6, '#ffffff', 1, 0, { 'fill-opacity': 0.8 })
      }
    }
    return (
      sky(ctx, '#1f2937', '#374151') +
      screens +
      rect(0, 150, W, 22, '#e63946', 0, 0) +
      el('text', { x: 120, y: 166, 'font-size': 13, 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'Arial, Helvetica, sans-serif', fill: '#ffffff' }, 'URGENTE · AO VIVO')
    )
  },
  palace(ctx) {
    return (
      sky(ctx, '#3c1053', '#6a1b4d') +
      el('path', { d: 'M0,0 H70 Q40,180 70,336 H0 Z', fill: '#7b1e3a', stroke: '#231c26', 'stroke-width': 2 }) +
      el('path', { d: 'M240,0 H170 Q200,180 170,336 H240 Z', fill: '#7b1e3a', stroke: '#231c26', 'stroke-width': 2 }) +
      rect(70, 20, 100, 140, 'none', 6, 0, { stroke: '#d4af37', 'stroke-width': 8 }) +
      rect(82, 32, 76, 116, '#4a1942', 2, 0) +
      el('path', { d: 'M96,70 l10,-14 l10,14 l10,-14 l10,14 v14 h-40 Z', fill: '#d4af37', 'fill-opacity': 0.5 }) +
      el('path', { d: 'M30,0 V30 M210,0 V30', stroke: '#d4af37', 'stroke-width': 4 })
    )
  },
  yacht(ctx) {
    return (
      sky(ctx, '#ff9a8b', '#ffd3a5') +
      circle(180, 120, 30, '#ffe066', 0) +
      rect(0, 150, W, 186, linear(ctx, [[0, '#2ec4b6'], [1, '#0f7c8c']]), 0, 0) +
      el('path', { d: 'M0,160 Q30,154 60,160 T120,160 T180,160 T240,160', fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.5, 'stroke-width': 3 }) +
      // Yacht.
      el('path', { d: 'M10,140 H90 L80,156 H20 Z', fill: '#ffffff', stroke: '#231c26', 'stroke-width': 2 }) +
      rect(30, 126, 40, 14, '#f8f9fa', 3, 2) +
      rect(36, 130, 28, 5, '#0f7c8c', 1, 0) +
      circle(214, 40, 5, '#ffffff', 0, { 'fill-opacity': 0.6 })
    )
  },
  chat(ctx) {
    const dots = pattern(
      ctx,
      'chatdots',
      18,
      18,
      el('path', { d: 'M3,3 h4 M11,11 l3,3', stroke: '#5b8c51', 'stroke-width': 1.5, 'stroke-opacity': 0.25 }),
    )
    return sky(ctx, '#d9f2d0', '#b8e2a8') + rect(0, 0, W, H, dots, 0, 0)
  },
  festival(ctx) {
    let lights = ''
    const cs = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2']
    for (let i = 0; i < 12; i++) lights += circle(10 + i * 20, 40 + Math.sin(i) * 8, 5, cs[i % 4], 1.5)
    return (
      sky(ctx, '#ffb4a2', '#ffcdb2') +
      el('path', { d: 'M0,34 Q120,64 240,34', fill: 'none', stroke: '#231c26', 'stroke-width': 1.5 }) +
      lights +
      circle(40, 130, 30, '#8ac926', 0, { 'fill-opacity': 0.6 }) +
      circle(200, 140, 36, '#8ac926', 0, { 'fill-opacity': 0.6 }) +
      el('path', { d: 'M0,230 Q120,214 240,230 V336 H0 Z', fill: '#e9c46a' })
    )
  },
  bureau(ctx) {
    let files = ''
    for (let i = 0; i < 4; i++) files += rect(12, 40 + i * 34, 52, 28, '#c8b68d', 2, 2) + rect(30, 50 + i * 34, 16, 5, '#7a6a48', 1, 0)
    for (let i = 0; i < 4; i++) files += rect(176, 40 + i * 34, 52, 28, '#c8b68d', 2, 2) + rect(194, 50 + i * 34, 16, 5, '#7a6a48', 1, 0)
    return (
      sky(ctx, '#e7e2d3', '#cfc7b0') +
      rect(8, 30, 60, 150, '#a8977a', 3, 2) +
      rect(172, 30, 60, 150, '#a8977a', 3, 2) +
      files +
      circle(120, 46, 22, '#ffffff', 2) +
      el('path', { d: 'M120,32 V46 L130,52', stroke: '#231c26', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' })
    )
  },
}

export function scene(ctx: Ctx, name: Scene, seed: string): string {
  return SCENES[name](ctx, rng(seed))
}

/** Backlight behind the head and a soft vignette, drawn over every scene. */
export function lighting(ctx: Ctx, glow: string): string {
  return (
    rect(0, 0, W, H, radial(ctx, [[0, glow, 0.85], [0.55, glow, 0.25], [1, glow, 0]], [0.5, 0.42, 0.42], `glow${glow.slice(1)}`), 0, 0) +
    rect(0, 0, W, H, radial(ctx, [[0.6, '#000000', 0], [1, '#000000', 0.32]], [0.5, 0.45, 0.75], 'vignette'), 0, 0)
  )
}

