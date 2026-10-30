// Arena backdrops: wide 16:9 scenes in the same inked style as the cards.
import { circle, el, ellipse, g, INK, line, linear, lit, newCtx, pattern, radial, rect, rng, shade, shape, svg, text, tint, type Ctx } from './lib.ts'

export const AW = 960
export const AH = 540

const sky = (ctx: Ctx, top: string, bottom: string, h = AH) =>
  rect(0, 0, AW, h, linear(ctx, [[0, top], [1, bottom]]), 0, 0)

const vignette = (ctx: Ctx) =>
  rect(0, 0, AW, AH, radial(ctx, [[0.55, '#000000', 0], [1, '#000000', 0.38]], [0.5, 0.5, 0.75], 'arena-vignette'), 0, 0)

/** Rounded speech bubble with a tail pointing down-left or down-right. */
function bubble(x: number, y: number, w: number, label: string, fill: string, ink: string, tail: 'left' | 'right', rot = 0): string {
  const h = 54
  const tx = tail === 'left' ? x + 30 : x + w - 30
  const dx = tail === 'left' ? -18 : 18
  return g(
    { transform: `rotate(${rot} ${x + w / 2} ${y + h / 2})` },
    shape(`M${tx - 12},${y + h - 2} L${tx + dx},${y + h + 26} L${tx + 14},${y + h - 2} Z`, fill, 4),
    rect(x, y, w, h, fill, 26, 4),
    rect(tx - 12, y + h - 8, 26, 8, fill, 0, 0),
    text(label, x + w / 2, y + 36, 26, ink),
  )
}

/** Simplified Brazilian flag: green field, yellow diamond, blue disc. */
function brFlag(x: number, y: number, w: number, h: number, extra: Record<string, string> = {}): string {
  return g(
    extra,
    rect(x, y, w, h, '#009c3b', 2, 3),
    el('path', { d: `M${x + w / 2},${y + h * 0.12} L${x + w * 0.92},${y + h / 2} L${x + w / 2},${y + h * 0.88} L${x + w * 0.08},${y + h / 2} Z`, fill: '#ffdf00' }),
    circle(x + w / 2, y + h / 2, h * 0.24, '#002776', 0),
  )
}

/** Garland of bulbs hanging between two points. */
function bulbs(r: () => number, x1: number, x2: number, y: number, sag: number, n: number, colors: string[]): string {
  const mid = (x1 + x2) / 2
  let out = line(`M${x1},${y} Q${mid},${y + sag * 2} ${x2},${y}`, INK, 2.5)
  for (let i = 1; i < n; i++) {
    const t = i / n
    const bx = x1 + (x2 - x1) * t
    const by = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y
    const c = colors[Math.floor(r() * colors.length)]
    out += circle(bx, by + 10, 16, c, 0, { 'fill-opacity': 0.25 }) + circle(bx, by + 10, 7, c, 2)
  }
  return out
}

// ---------- Neutral: the family Sunday lunch where every argument starts ----------
function almocoDeDomingo(): string {
  const ctx = newCtx()
  const stripes = pattern(ctx, 'wallstripes', 48, 48, rect(0, 0, 18, 48, '#e2b56c', 0, 0, { 'fill-opacity': 0.45 }))
  const cloth = pattern(
    ctx,
    'tablecloth',
    40,
    40,
    rect(0, 0, 40, 40, '#fffdf5', 0, 0) + rect(0, 0, 20, 20, '#e76f51', 0, 0, { 'fill-opacity': 0.55 }) + rect(20, 20, 20, 20, '#e76f51', 0, 0, { 'fill-opacity': 0.55 }),
  )
  return svg(
    ctx,
    sky(ctx, '#f6dba6', '#e9c07c') +
      rect(0, 0, AW, AH, stripes, 0, 0) +
      // Wood panelling.
      rect(0, 300, AW, 240, linear(ctx, [[0, '#9a6440'], [1, '#6e4329']]), 0, 0) +
      rect(0, 296, AW, 10, '#5a3520', 0, 0) +
      Array.from({ length: 8 }, (_, i) => rect(20 + i * 120, 320, 96, 60, 'none', 4, 0, { stroke: '#5a3520', 'stroke-width': 3, 'stroke-opacity': 0.6 })).join('') +
      // Window with daylight and curtains.
      rect(70, 50, 230, 210, linear(ctx, [[0, '#8fd3ff'], [1, '#d9f1ff']]), 4, 5) +
      circle(250, 100, 26, '#fff3b0', 0) +
      el('path', { d: 'M70,210 Q130,170 185,205 T300,195 V260 H70 Z', fill: '#8cc152' }) +
      line('M185,50 V260 M70,155 H300', '#fffdf5', 8) +
      rect(70, 50, 230, 210, 'none', 4, 5) +
      shape('M48,36 H120 Q100,150 128,284 H56 Q40,160 48,36 Z', '#c8553d', 4) +
      shape('M322,36 H250 Q270,150 242,284 H314 Q330,160 322,36 Z', '#c8553d', 4) +
      rect(36, 26, 298, 14, '#6e4329', 6, 4) +
      // Family portrait and the clock.
      rect(560, 64, 170, 124, '#c9a227', 4, 5) +
      rect(574, 78, 142, 96, '#cfe6f5', 2, 3) +
      [604, 645, 686].map((x, i) => circle(x, 118, 14, ['#f1c27d', '#c68642', '#e0ac69'][i], 3) + rect(x - 18, 132, 36, 42, ['#457b9d', '#e76f51', '#2a9d8f'][i], 10, 3)).join('') +
      circle(860, 110, 46, '#fffdf5', 5) +
      line('M860,82 V110 L880,124', INK, 5) +
      // TV on the sideboard, showing the debate that started it all.
      rect(770, 300, 170, 70, '#7a4b2c', 4, 4) +
      rect(800, 200, 120, 84, '#1f1b24', 6, 4) +
      rect(810, 210, 50, 64, '#e63946', 0, 0) +
      rect(860, 210, 50, 64, '#1d5fd1', 0, 0) +
      text('DEBATE', 860, 248, 16, '#ffffff') +
      line('M846,284 L836,300 M874,284 L884,300', INK, 4) +
      // Table with checkered cloth.
      shape('M-10,392 H970 V560 H-10 Z', cloth, 5) +
      tint('M-10,392 H970 V412 H-10 Z', '#000000', 0.12) +
      // Pot of macarronada.
      ellipse(250, 418, 92, 22, '#000000', 0, { 'fill-opacity': 0.18 }) +
      shape('M170,350 H330 V410 Q250,432 170,410 Z', '#b0b7c0', 4) +
      ellipse(250, 350, 80, 18, '#e63946', 4) +
      line('M206,348 q8,-10 16,0 t16,0 t16,0 t16,0', '#f4d35e', 5) +
      rect(150, 362, 24, 10, '#5f6b78', 4, 3) +
      rect(326, 362, 24, 10, '#5f6b78', 4, 3) +
      // Roast chicken on its platter.
      ellipse(490, 432, 120, 30, '#fffdf5', 4) +
      shape('M420,424 C420,370 560,362 562,420 C540,440 440,442 420,424 Z', '#d98a3d', 4) +
      tint('M440,404 C470,380 520,380 540,400', '#fff3c4', 0.35) +
      shape('M552,404 l34,-14 a8,8 0 1 1 6,12 l-30,14 Z', '#f2d8b0', 3) +
      shape('M424,404 l-34,-14 a8,8 0 1 0 -6,12 l30,14 Z', '#f2d8b0', 3) +
      // Two-liter soda.
      shape('M646,300 h28 v20 q20,14 20,40 v76 q-34,10 -68,0 v-76 q0,-26 20,-40 Z', '#3a8d3f', 4) +
      rect(626, 362, 68, 34, '#e63946', 0, 3) +
      rect(650, 290, 20, 12, '#e63946', 3, 3) +
      // Farofa bowl.
      shape('M730,420 Q780,470 830,420 Z', '#f4f1de', 4) +
      ellipse(780, 420, 50, 10, '#e9c46a', 3) +
      // The knocked-over glass and its spill.
      el('path', { d: 'M70,470 q40,-18 90,-4 q30,14 -6,24 q-60,12 -84,-20 Z', fill: '#c0392b', 'fill-opacity': 0.55 }) +
      g({ transform: 'rotate(-75 110 460)' }, shape('M92,430 h36 l-6,60 h-24 Z', '#e8f4ff', 3)) +
      // Plates.
      ellipse(110, 520, 70, 18, '#fffdf5', 4) +
      ellipse(880, 520, 70, 18, '#fffdf5', 4) +
      // Both sides talking at once.
      bubble(30, 196, 190, 'ABSURDO!', '#e63946', '#ffffff', 'right', -4) +
      bubble(350, 90, 190, 'BALELA!', '#1d5fd1', '#ffffff', 'left', 4) +
      vignette(ctx),
    AW,
    AH,
  )
}

// ---------- Red: craft beer and revolution at a bohemian corner bar ----------
function barDaVilaMadalena(): string {
  const ctx = newCtx()
  const r = rng('bar-da-vila-madalena')
  const tiles = pattern(
    ctx,
    'azulejo',
    40,
    40,
    rect(0, 0, 40, 40, '#f5f1e6', 0, 0) +
      el('path', { d: 'M20,4 L36,20 L20,36 L4,20 Z', fill: 'none', stroke: '#2f6fb0', 'stroke-width': 3 }) +
      circle(20, 20, 4, '#2f6fb0', 0) +
      el('path', { d: 'M0,0 H40 V40 H0 Z', fill: 'none', stroke: '#c9c2b0', 'stroke-width': 1 }),
  )
  const waves = pattern(
    ctx,
    'pedra-portuguesa',
    80,
    40,
    rect(0, 0, 80, 40, '#e9e4da', 0, 0) + el('path', { d: 'M0,26 Q20,6 40,26 T80,26 V40 H0 Z', fill: '#2b2730' }),
  )
  const stars = Array.from({ length: 30 }, () => circle(r() * AW, r() * 110, r() * 1.8 + 0.6, '#ffffff', 0)).join('')
  return svg(
    ctx,
    sky(ctx, '#1b1238', '#4a2466') +
      stars +
      circle(120, 60, 26, '#f4f1de', 0) +
      // Graffiti wall.
      rect(0, 110, 420, 360, '#bdb4a7', 0, 4) +
      shape('M30,170 C60,120 160,130 170,190 C190,260 70,300 40,250 C20,220 10,200 30,170 Z', '#ff5d8f', 4) +
      shape('M180,300 C200,240 330,230 360,290 C380,350 240,380 200,350 Z', '#38d39f', 4) +
      shape('M250,140 C300,120 380,150 370,210 C360,250 290,240 270,210 Z', '#ffd23f', 4) +
      text('ARTE', 105, 218, 58, '#ffffff', { stroke: INK, 'stroke-width': 4, 'paint-order': 'stroke', transform: 'rotate(-8 105 200)' }) +
      text('LIVRE', 280, 320, 48, '#1b1238', { stroke: '#ffffff', 'stroke-width': 4, 'paint-order': 'stroke', transform: 'rotate(5 280 305)' }) +
      shape('M300,170 c0,-14 22,-14 22,0 c0,-14 22,-14 22,0 c0,16 -22,28 -22,34 c0,-6 -22,-18 -22,-34 Z', '#e63946', 3) +
      // Bar front.
      rect(420, 110, 540, 360, tiles, 0, 4) +
      rect(500, 200, 400, 270, linear(ctx, [[0, '#7a3e1d'], [1, '#3d1f10']]), 0, 4) +
      // Shelves of bottles inside.
      [300, 350].map((y) => rect(520, y, 360, 8, '#2a160b', 0, 0) + Array.from({ length: 16 }, (_, i) => {
        const c = ['#3a8d3f', '#8a4b1a', '#c9a227', '#6a2c70'][Math.floor(r() * 4)]
        return rect(530 + i * 22, y - 34 - r() * 8, 12, 34, c, 3, 2)
      }).join('')).join('') +
      rect(500, 380, 400, 90, '#9c5a2c', 0, 4) +
      rect(492, 372, 416, 14, '#c47a3a', 4, 4) +
      // Striped awning.
      Array.from({ length: 10 }, (_, i) => shape(`M${470 + i * 46},196 h46 v40 a23,16 0 0 1 -46,0 Z`, i % 2 ? '#fffdf5' : '#d62828', 3)).join('') +
      // Neon sign with glow.
      rect(536, 136, 328, 54, '#1b1238', 8, 4) +
      text('BAR DA VILA', 700, 178, 44, '#ff4fa3', { stroke: '#ff4fa3', 'stroke-width': 10, 'stroke-opacity': 0.25, 'paint-order': 'stroke' }) +
      text('BAR DA VILA', 700, 178, 44, '#ffe3f1') +
      // String lights across the scene.
      bulbs(r, -20, 480, 96, 14, 9, ['#ffd166', '#ff9f1c', '#fff3b0']) +
      bulbs(r, 440, 980, 96, 10, 9, ['#ffd166', '#ff9f1c', '#fff3b0']) +
      // Sidewalk with Portuguese pavement.
      rect(0, 470, AW, 70, waves, 0, 0) +
      rect(0, 466, AW, 8, '#8e8794', 0, 0) +
      // Chalkboard with the prices.
      shape('M330,524 L360,380 H470 L500,524', 'none', 5) +
      rect(350, 386, 130, 110, '#26332b', 4, 5) +
      text('IPA ARTESANAL', 415, 420, 15, '#ffffff') +
      text('R$ 38', 415, 446, 22, '#ffd166') +
      text('CHOPP R$ 24', 415, 476, 14, '#ffffff') +
      // Aluminum table with a 600 ml bottle, glasses and fries.
      rect(600, 450, 260, 16, '#d0d6dd', 6, 4) +
      line('M630,466 L612,540 M830,466 L848,540', '#9aa3ad', 7) +
      shape('M712,346 h16 v26 q12,10 12,26 v52 h-40 v-52 q0,-16 12,-26 Z', '#7a3b12', 4) +
      rect(704, 392, 32, 26, '#f4f1de', 2, 3) +
      shape('M650,396 h30 l-4,54 h-22 Z', '#f4b942', 3) +
      rect(650, 396, 30, 10, '#fffdf5', 2, 0) +
      shape('M770,404 h30 l-4,46 h-22 Z', '#f4b942', 3) +
      ellipse(820, 446, 34, 8, '#fffdf5', 3) +
      line('M800,440 l8,-14 M812,440 l2,-16 M824,440 l-4,-14 M834,440 l6,-12', '#f4c430', 5) +
      // Yellow plastic chair.
      shape('M120,540 V430 Q120,400 150,400 H230 Q260,400 260,430 V470 H140 V540 Z', '#f9c80e', 4) +
      line('M150,470 V540 M240,470 V540', INK, 4) +
      vignette(ctx),
    AW,
    AH,
  )
}

// ---------- Red: open-mic poetry in an occupied building ----------
function sarauNaOcupacao(): string {
  const ctx = newCtx()
  const r = rng('sarau-na-ocupacao')
  const brick = pattern(
    ctx,
    'raw-brick',
    44,
    24,
    rect(0, 0, 44, 24, '#b5533c', 0, 0) + el('path', { d: 'M0,12 H44 M22,0 V12 M0,12 V24 M44,12 V24', stroke: '#7e3526', 'stroke-width': 3 }),
  )
  let city = ''
  for (const [x, w, h] of [[690, 50, 120], [742, 40, 160], [784, 60, 100], [846, 44, 140], [892, 50, 90]] as const) {
    city += rect(x, 300 - h, w, h, '#1d1b33', 0, 0)
    for (let wy = 300 - h + 10; wy < 290; wy += 18) for (let wx = x + 8; wx < x + w - 8; wx += 14) if (r() > 0.5) city += rect(wx, wy, 6, 8, '#ffd36b', 1, 0)
  }
  const chairs = Array.from({ length: 7 }, (_, i) => {
    const x = 40 + i * 136 + (r() - 0.5) * 20
    return shape(`M${x},540 V470 Q${x},446 ${x + 24},446 H${x + 76} Q${x + 100},446 ${x + 100},470 V500 H${x + 14} V540 Z`, '#2a2438', 4)
  }).join('')
  return svg(
    ctx,
    sky(ctx, '#8b8781', '#5f5b57') +
      // Plaster peeling off to show the bricks.
      el('path', { d: 'M40,120 C90,90 160,110 170,160 C180,220 90,250 50,210 C20,180 20,140 40,120 Z', fill: brick, stroke: INK, 'stroke-width': 4 }) +
      el('path', { d: 'M520,330 C560,300 640,320 640,370 C640,410 560,420 530,390 Z', fill: brick, stroke: INK, 'stroke-width': 4 }) +
      line('M300,40 l20,40 l-14,30 l24,40 M430,250 l-18,26 l10,22', '#3f3b37', 3) +
      // Broken window onto the city at night.
      rect(670, 70, 250, 240, linear(ctx, [[0, '#0d0b1f'], [1, '#2b2350']]), 0, 6) +
      circle(870, 120, 18, '#f4f1de', 0) +
      city +
      line('M795,70 V310 M670,190 H920', '#4b4640', 8) +
      el('path', { d: 'M700,90 l30,30 l-10,24 M730,120 l26,-8', fill: 'none', stroke: '#e8f4ff', 'stroke-width': 2.5 }) +
      rect(670, 70, 250, 240, 'none', 0, 6) +
      // Protest banner hung across the wall.
      line('M60,30 L150,60 M900,30 L810,60', INK, 3) +
      shape('M150,52 H810 L800,140 Q480,156 160,140 Z', '#d62828', 5) +
      text('POESIA É LUTA', 480, 118, 58, '#fffdf5') +
      // Posters taped on the wall.
      g({ transform: 'rotate(-5 110 300)' }, rect(60, 240, 110, 130, '#f7e26b', 2, 3), text('SARAU', 115, 280, 22, INK), text('TODA', 115, 316, 18, INK), text('QUINTA', 115, 340, 18, INK)) +
      g({ transform: 'rotate(4 250 300)' }, rect(200, 250, 110, 120, '#7fd1e0', 2, 3), text('MICROFONE', 255, 296, 15, INK), text('ABERTO', 255, 322, 20, INK)) +
      // String of bulbs.
      bulbs(r, 0, 660, 180, 30, 11, ['#ffd166', '#fff3b0']) +
      // Spotlight on the pallet stage.
      tint('M330,170 L250,440 H560 L410,170 Z', '#fff3c4', 0.22) +
      rect(340, 150, 60, 34, '#2a2438', 6, 4) +
      ellipse(400, 445, 160, 22, '#fff3c4', 0, { 'fill-opacity': 0.3 }) +
      rect(240, 420, 320, 22, '#c8a26b', 0, 4) +
      rect(240, 442, 320, 22, '#b08a55', 0, 4) +
      line('M280,420 V464 M400,420 V464 M520,420 V464', '#7a5a33', 4) +
      // Microphone stand.
      line('M400,420 V300', INK, 6) +
      line('M370,420 L400,404 L430,420', INK, 5) +
      line('M400,300 L430,280', INK, 5) +
      shape('M424,268 a14,14 0 1 1 20,20 l-6,4 l-18,-18 Z', '#3a3a3a', 3) +
      // Donation box and an acoustic guitar.
      rect(580, 400, 100, 64, '#c9a46b', 2, 4) +
      text('CONTRIBUIÇÃO', 630, 428, 12, INK) +
      text('VOLUNTÁRIA', 630, 446, 12, INK) +
      rect(610, 396, 40, 6, INK, 2, 0) +
      g(
        { transform: 'translate(580 0) rotate(16 190 400)' },
        shape('M160,470 C120,470 120,410 150,400 C140,370 170,350 190,370 C210,350 240,370 230,400 C260,410 260,470 220,470 Z', '#c47a3a', 4),
        circle(190, 420, 12, '#3d1f10', 3),
        rect(184, 260, 12, 120, '#5a3520', 2, 3),
      ) +
      chairs +
      vignette(ctx),
    AW,
    AH,
  )
}

// ---------- Blue: the camp at the barracks gate, under a "no camping" sign ----------
function portaDoQuartel(): string {
  const ctx = newCtx()
  const tent = (x: number, w: number, color: string) =>
    shape(`M${x},470 Q${x + w / 2},${470 - w * 0.75} ${x + w},470 Z`, color, 5) +
    shape(`M${x + w / 2 - 22},470 L${x + w / 2},${470 - w * 0.4} L${x + w / 2 + 22},470 Z`, shade(color, -0.4), 4)
  return svg(
    ctx,
    sky(ctx, '#3d3a6b', '#f7a35c', 300) +
      circle(160, 250, 50, '#ffd28a', 0, { 'fill-opacity': 0.8 }) +
      // Flagpole behind the wall.
      line('M720,40 V250', '#d9d9d9', 6) +
      brFlag(724, 44, 120, 80) +
      // Barracks wall and gate.
      rect(0, 230, AW, 180, linear(ctx, [[0, '#e3dccb'], [1, '#c8bfaa']]), 0, 5) +
      rect(0, 230, AW, 18, '#4b5d3a', 0, 5) +
      rect(380, 200, 220, 210, '#3e4a30', 4, 5) +
      line(Array.from({ length: 10 }, (_, i) => `M${396 + i * 21},250 V410`).join(' '), '#1f2618', 6) +
      rect(380, 200, 220, 44, '#4b5d3a', 4, 5) +
      text('QUARTEL', 490, 232, 26, '#e9d27a') +
      // Guard booth with its barrier.
      rect(610, 290, 80, 120, '#f5f1e6', 4, 5) +
      rect(624, 310, 52, 36, '#9cc7ea', 2, 4) +
      shape('M600,290 L650,262 L700,290 Z', '#4b5d3a', 4) +
      Array.from({ length: 6 }, (_, i) => rect(574 - i * 36, 352, 36, 14, i % 2 ? '#ffffff' : '#d62828', 0, 3)).join('') +
      // The sign everyone ignores.
      rect(720, 270, 220, 82, '#fffdf5', 4, 5) +
      text('ÁREA MILITAR', 830, 304, 24, '#d62828') +
      text('PROIBIDO ACAMPAR', 830, 334, 20, INK) +
      // Ground.
      rect(0, 410, AW, 130, linear(ctx, [[0, '#6b7f45'], [1, '#4a5c2e']]), 0, 0) +
      // Tarp with the banner.
      line('M60,250 V470 M380,250 V470', '#8a8f96', 6) +
      shape('M40,250 H400 L380,280 H60 Z', '#2f6fb0', 4) +
      rect(70, 290, 300, 52, '#ffdf00', 3, 4) +
      text('SOS FORÇAS ARMADAS', 220, 325, 24, '#002776') +
      // Tents.
      tent(30, 200, '#2a9d4b') +
      tent(560, 180, '#f2c94c') +
      tent(760, 220, '#2f6fb0') +
      brFlag(800, 380, 90, 60, { transform: 'rotate(-12 845 410)' }) +
      // Folding table with thermos, cups and the radio.
      rect(250, 440, 230, 14, '#fffdf5', 3, 4) +
      line('M270,454 L254,540 M460,454 L476,540 M270,454 L476,540', '#9aa3ad', 5) +
      shape('M290,360 h36 v80 h-36 Z', '#d62828', 4) +
      rect(286, 352, 44, 14, '#9aa3ad', 4, 3) +
      shape('M344,414 h18 l-3,26 h-12 Z', '#fffdf5', 3) +
      shape('M370,414 h18 l-3,26 h-12 Z', '#fffdf5', 3) +
      rect(400, 396, 64, 44, '#3a3a3a', 6, 4) +
      circle(418, 418, 10, '#9aa3ad', 3) +
      line('M450,396 L470,360', INK, 3) +
      // Cardboard sign promising it's almost over.
      g({ transform: 'rotate(-6 560 500)' }, rect(500, 460, 130, 64, '#c9a46b', 2, 4), text('72 HORAS', 565, 502, 24, INK)) +
      vignette(ctx),
    AW,
    AH,
  )
}

// ---------- Blue: the VIP box at the rodeo ----------
function camaroteDoAgro(): string {
  const ctx = newCtx()
  const r = rng('camarote-do-agro')
  const burst = (cx: number, cy: number, c: string) =>
    line(Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2
      return `M${cx + Math.cos(a) * 14},${cy + Math.sin(a) * 14} L${cx + Math.cos(a) * 46},${cy + Math.sin(a) * 46}`
    }).join(' '), c, 4) + circle(cx, cy, 6, c, 0)
  let crowd = ''
  for (let i = 0; i < 70; i++) {
    const x = (i / 70) * AW + r() * 10
    const y = 250 + r() * 30
    crowd += circle(x, y, 9, '#120d26', 0) + rect(x - 10, y + 6, 20, 40, '#120d26', 6, 0)
    if (r() > 0.8) crowd += circle(x + 4, y - 10, 4, '#ffd166', 0)
  }
  return svg(
    ctx,
    sky(ctx, '#0f1b2d', '#3b2a5c') +
      // Stage light beams.
      tint('M120,0 L40,540 H140 Z', '#9ad1ff', 0.12) +
      tint('M840,0 L820,540 H920 Z', '#ffb3e6', 0.12) +
      tint('M480,0 L330,540 H460 Z', '#fff3c4', 0.1) +
      burst(150, 80, '#ffd166') +
      burst(820, 64, '#ff6fb5') +
      burst(700, 140, '#7ae1ff') +
      // Grain silos on the horizon.
      [40, 96].map((x) => rect(x, 120, 48, 140, '#c9ccd1', 6, 4) + line(`M${x},160 h48 M${x},200 h48`, '#9aa0a8', 3) + shape(`M${x},124 Q${x + 24},96 ${x + 48},124 Z`, '#9aa0a8', 4)).join('') +
      [830, 886].map((x) => rect(x, 140, 48, 120, '#c9ccd1', 6, 4) + line(`M${x},180 h48 M${x},220 h48`, '#9aa0a8', 3) + shape(`M${x},144 Q${x + 24},116 ${x + 48},144 Z`, '#9aa0a8', 4)).join('') +
      // Giant LED screen.
      line('M330,200 V250 M630,200 V250', INK, 8) +
      rect(300, 40, 360, 170, '#11131a', 8, 6) +
      rect(314, 54, 332, 142, linear(ctx, [[0, '#2f9e44'], [1, '#14532d']]), 2, 0) +
      text('AGRO É TOP', 480, 130, 52, '#ffdf00', { stroke: INK, 'stroke-width': 4, 'paint-order': 'stroke' }) +
      text('★ ★ ★', 480, 172, 26, '#ffffff') +
      // The crowd in the stands.
      rect(0, 240, AW, 70, '#2a1f45', 0, 0) +
      crowd +
      // Dirt arena with its fence.
      rect(0, 300, AW, 130, linear(ctx, [[0, '#b07a42'], [1, '#8a5a2b']]), 0, 0) +
      line('M0,312 H960 M0,336 H960', '#6e4329', 6) +
      line(Array.from({ length: 17 }, (_, i) => `M${i * 60},300 V350`).join(' '), '#6e4329', 6) +
      // The prize pickup, with a bow on top.
      shape('M470,404 V372 L540,372 L562,340 H632 L654,372 H700 Q712,372 712,384 V404 Z', lit(ctx, '#e9ecef'), 4) +
      shape('M570,348 H604 V368 H554 Z', '#9ad1ff', 3) +
      shape('M612,348 H628 L644,368 H612 Z', '#9ad1ff', 3) +
      circle(512, 404, 20, '#2b2b2b', 4) +
      circle(512, 404, 8, '#c9ccd1', 2) +
      circle(668, 404, 20, '#2b2b2b', 4) +
      circle(668, 404, 8, '#c9ccd1', 2) +
      shape('M597,338 C570,310 560,342 597,338 Z', '#e63946', 3) +
      shape('M597,338 C624,310 634,342 597,338 Z', '#e63946', 3) +
      line('M597,338 V372', '#e63946', 6) +
      // VIP balcony: carpet, gold rail, velvet rope.
      rect(0, 430, AW, 110, linear(ctx, [[0, '#8b1e2d'], [1, '#5e121d']]), 0, 0) +
      rect(0, 424, AW, 14, linear(ctx, [[0, '#f6d365'], [1, '#c9a227']]), 0, 4) +
      line(Array.from({ length: 13 }, (_, i) => `M${20 + i * 80},438 V540`).join(' '), '#c9a227', 5) +
      rect(70, 384, 200, 40, '#c9a227', 4, 4) +
      text('CAMAROTE VIP', 170, 412, 22, '#3d1f10') +
      // Hat on the rail.
      ellipse(370, 420, 70, 12, '#8a5a2b', 4) +
      shape('M330,420 Q326,370 370,372 Q414,370 410,420 Z', '#a0703c', 4) +
      rect(332, 404, 76, 10, '#3d1f10', 0, 0) +
      // Ice bucket with champagne.
      shape('M800,416 h90 l-10,90 h-70 Z', '#d0d6dd', 4) +
      shape('M836,330 h18 v40 q14,10 14,26 v40 h-46 v-40 q0,-16 14,-26 Z', '#1f4d2b', 4) +
      rect(832, 318, 26, 16, '#f6d365', 3, 3) +
      circle(822, 418, 9, '#e8f4ff', 2) +
      circle(870, 420, 8, '#e8f4ff', 2) +
      // Glass of bubbly.
      shape('M740,380 h34 l-10,40 h-14 Z', '#f6e7b4', 3) +
      line('M757,420 V456 M740,458 H774', INK, 4) +
      vignette(ctx),
    AW,
    AH,
  )
}

const ARENA_ART: Record<string, () => string> = {
  'almoco-de-domingo-em-familia': almocoDeDomingo,
  'bar-da-vila-madalena': barDaVilaMadalena,
  'sarau-na-ocupacao': sarauNaOcupacao,
  'porta-do-quartel': portaDoQuartel,
  'camarote-do-agro': camaroteDoAgro,
}

export function drawArena(id: string): string {
  const draw = ARENA_ART[id]
  if (!draw) throw new Error(`No art defined for arena ${id}`)
  return draw()
}
