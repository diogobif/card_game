import {
  circle,
  ellipse,
  g,
  INK,
  line,
  lit,
  newCtx,
  pattern,
  rect,
  shade,
  shape,
  svg,
  text,
  tint,
  type Ctx,
} from './lib.ts'
import { prop, extra, type Extra, type Prop } from './props.ts'
import { lighting, scene, type Scene } from './scenes.ts'

export type HairStyle =
  | 'short'
  | 'sidepart'
  | 'slick'
  | 'bald'
  | 'balding'
  | 'long'
  | 'bob'
  | 'bun'
  | 'curly'
  | 'afro'
  | 'ponytail'
  | 'messy'
  | 'buzz'
  | 'pixie'
  | 'dreads'

export type HatStyle = 'cap' | 'cowboy' | 'beret' | 'military' | 'beanie' | 'straw' | 'crown' | 'bandana' | 'helmet'

export type OutfitStyle =
  | 'suit'
  | 'shirt'
  | 'tshirt'
  | 'hoodie'
  | 'polo'
  | 'uniform'
  | 'vest'
  | 'blouse'
  | 'flannel'
  | 'jacket'
  | 'tank'
  | 'turtleneck'
  | 'labcoat'

export type Accessory =
  | 'cross'
  | 'pearls'
  | 'medals'
  | 'scarf'
  | 'earrings'
  | 'headphones'
  | 'balaclava'
  | 'flowerCrown'
  | 'lanyard'
  | 'stethoscope'
  | 'chain'
  | 'beads'
  | 'pin'

export type Character = {
  scene: Scene
  /** Backlight color behind the head. */
  glow: string
  skin: string
  hair?: { style: HairStyle; color: string }
  facialHair?: { style: 'stubble' | 'mustache' | 'goatee' | 'beard'; color: string }
  eyes?: { iris?: string; mood?: 'normal' | 'smug' | 'wide' | 'angry' | 'happy' | 'wink' }
  brows?: 'angry' | 'raised' | 'flat' | 'worried' | 'skeptical'
  mouth: 'smile' | 'grin' | 'shout' | 'smirk' | 'frown' | 'o' | 'flat'
  glasses?: { style: 'round' | 'square' | 'sun' | 'nerd'; color: string }
  hat?: { style: HatStyle; color: string; label?: string }
  outfit: { style: OutfitStyle; color: string; inner?: string; tie?: string; print?: string; printColor?: string }
  accessories?: Accessory[]
  props?: Prop[]
  extras?: Extra[]
  lips?: string
  old?: boolean
  pinLabel?: string
  lanyardLabel?: string
}

// Head geometry shared by every part.
const HEAD = 'M76,130 C76,96 96,84 120,84 C144,84 164,96 164,130 C164,166 146,192 120,192 C94,192 76,166 76,130 Z'
const TORSO = 'M26,336 L26,288 C26,248 66,222 120,222 C174,222 214,248 214,288 L214,336 Z'
const EYE_Y = 140
const EYES_X = [102, 138]

export function drawCharacter(c: Character, seed: string): string {
  const ctx = newCtx()
  const masked = c.accessories?.includes('balaclava') ?? false
  const body =
    scene(ctx, c.scene, seed) +
    lighting(ctx, c.glow) +
    (c.extras ?? []).filter((e) => e.behind).map((e) => extra(ctx, e)).join('') +
    hairBack(ctx, c) +
    torso(ctx, c) +
    neck(ctx, c) +
    outfitTop(ctx, c) +
    accessoriesBody(ctx, c) +
    ears(ctx, c) +
    shape(HEAD, lit(ctx, c.skin)) +
    faceShading() +
    (masked ? balaclava() : '') +
    eyes(c) +
    brows(c) +
    (masked ? '' : nose(c) + facialHairUnder(c) + mouth(c) + facialHairOver(c)) +
    (c.old ? wrinkles(c) : '') +
    (masked ? '' : hairFront(ctx, c)) +
    glasses(c) +
    hat(ctx, c) +
    accessoriesHead(c) +
    (c.props ?? []).map((p) => arm(c, p) + prop(ctx, p, handPos(p)) + hand(ctx, c, p)).join('') +
    (c.extras ?? []).filter((e) => !e.behind).map((e) => extra(ctx, e)).join('')
  return svg(ctx, body)
}

// ---------- Body ----------

function torso(ctx: Ctx, c: Character): string {
  const o = c.outfit
  const fill =
    o.style === 'flannel'
      ? pattern(
          ctx,
          'plaid',
          24,
          24,
          rect(0, 0, 24, 24, o.color, 0, 0) +
            rect(0, 0, 24, 8, shade(o.color, -0.45), 0, 0, { 'fill-opacity': 0.55 }) +
            rect(0, 0, 8, 24, shade(o.color, -0.45), 0, 0, { 'fill-opacity': 0.55 }) +
            rect(16, 0, 2, 24, '#ffffff', 0, 0, { 'fill-opacity': 0.4 }),
        )
      : o.style === 'tank'
        ? lit(ctx, c.skin)
        : lit(ctx, o.style === 'labcoat' ? '#f4f6f8' : o.color)
  return (
    shape(TORSO, fill) +
    // Shade the far side and light the near shoulder.
    tint('M150,228 C190,238 214,262 214,292 V336 H176 C180,300 174,258 150,228 Z', '#000000', 0.14) +
    tint('M44,256 C54,240 74,230 92,226 C76,236 62,246 52,264 Z', '#ffffff', 0.25)
  )
}

function neck(ctx: Ctx, c: Character): string {
  return (
    shape('M103,170 L103,226 Q120,238 137,226 L137,170 Z', lit(ctx, c.skin)) +
    tint('M103,176 Q120,206 137,176 L137,170 L103,170 Z', '#000000', 0.22)
  )
}

function outfitTop(ctx: Ctx, c: Character): string {
  const o = c.outfit
  const inner = o.inner ?? '#f8f9fa'
  const dark = shade(o.color, -0.25)
  switch (o.style) {
    case 'tshirt':
      return line('M98,226 Q120,246 142,226', INK, 3) + line('M100,230 Q120,248 140,230', dark, 3) + printText(o)
    case 'turtleneck':
      return (
        shape('M100,204 H140 V232 Q120,242 100,232 Z', lit(ctx, o.color)) +
        line('M102,214 H138 M102,222 H138', dark, 2) +
        printText(o)
      )
    case 'tank':
      return (
        shape('M64,336 L68,256 Q80,236 94,228 L102,250 Q120,264 138,250 L146,228 Q160,236 172,256 L176,336 Z', lit(ctx, o.color)) +
        printText(o)
      )
    case 'blouse':
      return (
        shape('M96,224 Q120,262 144,224 Q120,240 96,224 Z', lit(ctx, c.skin), 2.5) +
        line('M96,224 Q120,264 144,224', shade(o.color, 0.4), 4) +
        line('M96,224 Q120,262 144,224', INK, 2)
      )
    case 'polo':
      return (
        shape('M102,222 L94,240 L116,236 Z', lit(ctx, o.color), 2.5) +
        shape('M138,222 L146,240 L124,236 Z', lit(ctx, o.color), 2.5) +
        line('M120,236 V268', INK, 2.5) +
        circle(120, 248, 2.2, inner, 1.5) +
        circle(120, 260, 2.2, inner, 1.5) +
        printText(o)
      )
    case 'shirt':
    case 'flannel':
      return (
        shape('M106,222 L120,252 L134,222 Z', lit(ctx, c.skin), 2.5) +
        shape('M104,220 L94,248 L119,240 Z', o.style === 'flannel' ? shade(o.color, -0.2) : lit(ctx, o.color), 2.5) +
        shape('M136,220 L146,248 L121,240 Z', o.style === 'flannel' ? shade(o.color, -0.2) : lit(ctx, o.color), 2.5) +
        line('M120,252 V336', INK, 2) +
        [270, 296, 322].map((y) => circle(123, y, 2.2, '#f5f5f5', 1.5)).join('')
      )
    case 'suit':
    case 'labcoat':
    case 'uniform': {
      const jacket = o.style === 'labcoat' ? '#f4f6f8' : o.color
      const lapel = shade(jacket, -0.18)
      let out =
        shape('M100,222 L120,306 L140,222 Z', inner, 2.5) +
        shape('M106,220 L98,242 L119,236 Z', '#ffffff', 2) +
        shape('M134,220 L142,242 L121,236 Z', '#ffffff', 2)
      if (o.tie) {
        out +=
          shape('M114,236 L126,236 L122,246 L118,246 Z', shade(o.tie, -0.15), 2) +
          shape('M118,246 L122,246 L130,292 L120,306 L110,292 Z', lit(ctx, o.tie), 2) +
          line('M114,264 L126,258 M112,280 L128,272', shade(o.tie, 0.35), 2)
      }
      out +=
        shape('M98,222 L80,266 L100,270 L120,306 L104,232 Z', lapel, 2.5) +
        shape('M142,222 L160,266 L140,270 L120,306 L136,232 Z', lapel, 2.5)
      if (o.style === 'uniform') {
        out +=
          rect(36, 248, 40, 10, '#c9a227', 3, 2, { transform: 'rotate(-18 56 253)' }) +
          rect(164, 248, 40, 10, '#c9a227', 3, 2, { transform: 'rotate(18 184 253)' }) +
          rect(56, 292, 34, 26, shade(jacket, -0.1), 3, 2) +
          rect(150, 292, 34, 26, shade(jacket, -0.1), 3, 2) +
          [312, 328].map((y) => circle(120, y, 3, '#e9c46a', 1.5)).join('')
      } else if (o.style === 'labcoat') {
        out += rect(146, 290, 34, 30, '#e9ecef', 3, 2) + line('M154,290 V280 M164,290 V276', '#1d5fd1', 3)
      } else {
        out += shape('M150,284 L170,280 L172,288 L152,292 Z', o.inner === '#f8f9fa' ? '#e63946' : shade(o.color, 0.5), 1.5)
      }
      return out
    }
    case 'vest':
      return (
        shape('M106,222 L120,250 L134,222 Z', lit(ctx, c.skin), 2.5) +
        shape('M104,220 L96,244 L119,238 Z', inner, 2.5) +
        shape('M136,220 L144,244 L121,238 Z', inner, 2.5) +
        shape('M36,336 L36,288 C36,258 70,236 100,230 L112,336 Z', lit(ctx, o.color)) +
        shape('M204,336 L204,288 C204,258 170,236 140,230 L128,336 Z', lit(ctx, o.color)) +
        [262, 286, 310].map((y) => line(`M44,${y + 6} Q76,${y - 4} 104,${y - 2} M196,${y + 6} Q164,${y - 4} 136,${y - 2}`, dark, 2)).join('') +
        line('M120,250 V336', INK, 2)
      )
    case 'hoodie':
      return (
        shape('M84,224 C82,258 158,258 156,224 C146,240 94,240 84,224 Z', shade(o.color, -0.12)) +
        line('M108,244 V274 M132,244 V274', '#f1f1f1', 3) +
        circle(108, 276, 3, '#f1f1f1', 1.5) +
        circle(132, 276, 3, '#f1f1f1', 1.5) +
        shape('M78,336 L84,300 H156 L162,336 Z', shade(o.color, -0.1), 2.5) +
        printText(o, 292)
      )
    case 'jacket':
      return (
        shape('M100,224 L120,336 L140,224 Q120,244 100,224 Z', lit(ctx, inner), 2.5) +
        shape('M100,222 L84,256 L104,262 L120,336 L96,232 Z', shade(o.color, -0.15), 2.5) +
        shape('M140,222 L156,256 L136,262 L120,336 L144,232 Z', shade(o.color, -0.15), 2.5) +
        line('M60,290 H92 M148,290 H180', shade(o.color, 0.3), 2.5, { 'stroke-dasharray': '4 4' })
      )
  }
}

function printText(o: Character['outfit'], y = 296): string {
  if (!o.print) return ''
  const size = o.print.length > 8 ? 13 : 17
  return text(o.print, 120, y, size, o.printColor ?? '#ffffff', { stroke: INK, 'stroke-width': 0.8 })
}

function accessoriesBody(ctx: Ctx, c: Character): string {
  let out = ''
  for (const a of c.accessories ?? []) {
    if (a === 'cross')
      out +=
        line('M104,226 Q120,262 136,226', '#d4af37', 2.5) +
        shape('M116,252 H124 V262 H134 V270 H124 V292 H116 V270 H106 V262 H116 Z', lit(ctx, '#e9c46a'), 2)
    if (a === 'chain') out += line('M100,226 Q120,272 140,226', '#e9c46a', 6) + line('M100,226 Q120,272 140,226', INK, 1.5, { 'stroke-dasharray': '3 3' })
    if (a === 'pearls')
      out += Array.from({ length: 11 }, (_, i) => {
        const t = i / 10
        const x = 100 + 40 * t
        const y = 228 + Math.sin(t * Math.PI) * 16
        return circle(x, y, 3.4, '#fbf7ef', 1.5)
      }).join('')
    if (a === 'beads')
      out += Array.from({ length: 12 }, (_, i) => {
        const t = i / 11
        return circle(98 + 44 * t, 230 + Math.sin(t * Math.PI) * 22, 3.6, ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'][i % 4], 1.5)
      }).join('')
    if (a === 'medals')
      out += [60, 74, 88]
        .map((x, i) => rect(x - 5, 250, 10, 14, ['#e63946', '#2a9d8f', '#f4a261'][i], 1, 1.5) + circle(x, 270, 5, '#e9c46a', 1.5))
        .join('')
    if (a === 'scarf')
      out +=
        shape('M96,214 Q120,236 144,214 L148,232 Q120,252 92,232 Z', lit(ctx, '#e63946')) +
        shape('M130,236 L150,300 L136,304 L122,244 Z', lit(ctx, '#d62839'))
    if (a === 'lanyard')
      out +=
        line('M104,226 L116,282 M136,226 L124,282', '#1d5fd1', 4) +
        rect(104, 280, 32, 40, '#ffffff', 3, 2) +
        rect(110, 286, 20, 14, '#cfd8e3', 2, 0) +
        text(c.lanyardLabel ?? 'CRACHÁ', 120, 314, 6.5, INK)
    if (a === 'stethoscope')
      out += line('M100,226 Q92,276 112,288 M140,226 Q148,276 128,288', '#444b54', 4) + line('M112,288 Q120,300 128,288', '#444b54', 4) + circle(120, 300, 7, '#c0c6ce', 2)
    if (a === 'pin') out += circle(70, 272, 13, '#e63946', 2) + text(c.pinLabel ?? '!', 70, 277, 11, '#ffffff')
  }
  return out
}

// ---------- Head ----------

function ears(ctx: Ctx, c: Character): string {
  const fill = lit(ctx, c.skin)
  return (
    ellipse(77, 142, 8, 12, fill, 2.5) +
    ellipse(163, 142, 8, 12, fill, 2.5) +
    line('M79,136 Q74,142 79,148 M161,136 Q166,142 161,148', shade(c.skin, -0.3), 2)
  )
}

function faceShading(): string {
  return (
    tint('M148,98 C166,118 168,160 138,190 C152,162 158,128 148,98 Z', '#000000', 0.14) +
    tint('M92,96 C100,90 110,88 120,88 C104,92 96,100 92,112 Z', '#ffffff', 0.35) +
    ellipse(96, 162, 10, 5.5, '#ff6b6b', 0, { 'fill-opacity': 0.22 }) +
    ellipse(144, 162, 10, 5.5, '#ff6b6b', 0, { 'fill-opacity': 0.22 })
  )
}

function eyes(c: Character): string {
  const iris = c.eyes?.iris ?? '#5b3a29'
  const mood = c.eyes?.mood ?? 'normal'
  return EYES_X.map((x, i) => {
    if (mood === 'happy' || (mood === 'wink' && i === 1)) return line(`M${x - 9},${EYE_Y + 2} Q${x},${EYE_Y - 7} ${x + 9},${EYE_Y + 2}`, INK, 3.2)
    const big = mood === 'wide'
    let out =
      ellipse(x, EYE_Y, big ? 10.5 : 9, big ? 11.5 : 10, '#ffffff', 2.2) +
      circle(x + (i === 0 ? 1 : -1), EYE_Y + 1, big ? 4.8 : 5.6, iris, 0) +
      circle(x + (i === 0 ? 1 : -1), EYE_Y + 1, 2.6, '#111111', 0) +
      circle(x - 1.5, EYE_Y - 2, 1.8, '#ffffff', 0) +
      circle(x + 2.5, EYE_Y + 3, 0.9, '#ffffff', 0)
    if (mood === 'smug') {
      out += shape(`M${x - 10},${EYE_Y + 1} Q${x},${EYE_Y - 9} ${x + 10},${EYE_Y + 1} L${x + 11},${EYE_Y - 12} L${x - 11},${EYE_Y - 12} Z`, c.skin, 0)
      out += line(`M${x - 10},${EYE_Y + 1} Q${x},${EYE_Y - 4} ${x + 10},${EYE_Y + 1}`, INK, 3)
    } else if (mood === 'angry') {
      const d = i === 0 ? `M${x - 11},${EYE_Y - 12} L${x + 11},${EYE_Y - 12} L${x + 11},${EYE_Y - 2} Z` : `M${x - 11},${EYE_Y - 12} L${x + 11},${EYE_Y - 12} L${x - 11},${EYE_Y - 2} Z`
      out += shape(d, c.skin, 0)
      out += line(i === 0 ? `M${x - 10},${EYE_Y - 8} L${x + 10},${EYE_Y - 2}` : `M${x - 10},${EYE_Y - 2} L${x + 10},${EYE_Y - 8}`, INK, 3)
    } else {
      out += line(`M${x - 10},${EYE_Y - 2} Q${x},${EYE_Y - 13} ${x + 10},${EYE_Y - 2}`, INK, 3.2)
    }
    if (c.lips) out += line(`M${x + (i === 0 ? -10 : 10)},${EYE_Y - 3} l${i === 0 ? -4 : 4},-3`, INK, 2)
    return out
  }).join('')
}

function brows(c: Character): string {
  const color = c.hair && c.hair.style !== 'bald' ? shade(c.hair.color, -0.25) : '#4a3424'
  const kind = c.brows ?? 'flat'
  const [l, r] = EYES_X
  const paths: Record<NonNullable<Character['brows']>, string> = {
    flat: `M${l - 11},122 Q${l},118 ${l + 10},122 M${r - 10},122 Q${r},118 ${r + 11},122`,
    raised: `M${l - 11},118 Q${l},110 ${l + 10},116 M${r - 10},116 Q${r},110 ${r + 11},118`,
    angry: `M${l - 11},117 L${l + 10},126 M${r - 10},126 L${r + 11},117`,
    worried: `M${l - 11},124 L${l + 10},116 M${r - 10},116 L${r + 11},124`,
    skeptical: `M${l - 11},116 Q${l},108 ${l + 10},114 M${r - 10},124 L${r + 11},122`,
  }
  return line(paths[kind], color, 5)
}

function nose(c: Character): string {
  return (
    tint('M122,144 Q130,158 124,164 Q120,166 116,163 Q126,160 122,144 Z', '#000000', 0.12) +
    line('M120,144 Q113,160 123,162', shade(c.skin, -0.45), 2.5)
  )
}

function mouth(c: Character): string {
  const lip = c.lips ?? INK
  switch (c.mouth) {
    case 'smile':
      return line('M104,172 Q120,186 136,172', lip, 3.2) + line('M101,170 l4,3 M139,170 l-4,3', INK, 2)
    case 'grin':
      return (
        shape('M102,170 Q120,194 138,170 Q120,176 102,170 Z', '#6b1d1d', 2.5, c.lips ? { stroke: c.lips } : {}) +
        shape('M105,172 Q120,178 135,172 L134,176 Q120,182 106,176 Z', '#ffffff', 0) +
        ellipse(120, 186, 7, 3, '#e0606a', 0)
      )
    case 'shout':
      return (
        ellipse(120, 176, 13, 12, '#5a1a1a', 2.5, c.lips ? { stroke: c.lips } : {}) +
        rect(110, 165, 20, 5, '#ffffff', 2, 0) +
        ellipse(120, 183, 8, 4, '#e0606a', 0)
      )
    case 'smirk':
      return line('M106,176 Q124,180 136,166', lip, 3.2) + line('M134,164 l4,4', INK, 2)
    case 'frown':
      return line('M106,180 Q120,168 134,180', lip, 3.2)
    case 'o':
      return ellipse(120, 176, 6, 7, '#5a1a1a', 2.5)
    case 'flat':
      return line('M108,176 H132', lip, 3.2)
  }
}

function facialHairUnder(c: Character): string {
  const f = c.facialHair
  if (!f) return ''
  if (f.style === 'stubble')
    return tint('M80,150 C84,180 104,196 120,196 C136,196 156,180 160,150 C152,174 136,184 120,184 C104,184 88,174 80,150 Z', f.color, 0.32)
  if (f.style === 'beard')
    return shape('M78,138 C78,192 100,210 120,210 C140,210 162,192 162,138 C156,160 148,168 138,165 Q120,158 102,165 C92,168 84,160 78,138 Z', f.color, 2.5)
  if (f.style === 'goatee') return shape('M110,186 Q120,202 130,186 Q120,192 110,186 Z', f.color, 2)
  return ''
}

function facialHairOver(c: Character): string {
  const f = c.facialHair
  if (!f || f.style === 'stubble') return ''
  return shape('M100,168 Q110,158 120,164 Q130,158 140,168 Q130,172 120,168 Q110,172 100,168 Z', f.color, 2.2)
}

function wrinkles(c: Character): string {
  const col = shade(c.skin, -0.4)
  return line('M88,150 l-6,4 M90,146 l-7,0 M152,150 l6,4 M150,146 l7,0 M104,104 Q120,100 136,104 M108,110 Q120,107 132,110', col, 1.6)
}

function balaclava(): string {
  return (
    shape(HEAD.replace('Z', '') + ' Z', '#1f1f24') +
    shape('M100,192 L100,228 Q120,240 140,228 L140,192 Z', '#1f1f24', 2.5) +
    rect(84, 126, 72, 28, '#e0b28f', 10, 2.5)
  )
}

// ---------- Hair ----------

function bumps(ctx: Ctx, color: string, points: [number, number, number][]): string {
  // Outlined union of circles: draw strokes first, then fills on top to hide inner edges.
  const fill = lit(ctx, color)
  return (
    points.map(([x, y, r]) => circle(x, y, r, fill, 6)).join('') +
    points.map(([x, y, r]) => circle(x, y, r, fill, 0)).join('')
  )
}

function hairBack(ctx: Ctx, c: Character): string {
  const h = c.hair
  if (!h) return ''
  const fill = lit(ctx, h.color)
  switch (h.style) {
    case 'long':
      return shape('M66,140 C58,82 90,70 120,70 C150,70 182,82 174,140 C178,200 190,250 198,290 L42,290 C50,250 62,200 66,140 Z', fill)
    case 'bob':
      return shape('M68,140 C62,84 92,72 120,72 C148,72 178,84 172,140 C174,172 170,192 160,204 L80,204 C70,192 66,172 68,140 Z', fill)
    case 'ponytail':
      return shape('M152,92 C196,104 200,176 178,222 C176,176 168,134 150,114 Z', fill)
    case 'afro': {
      const pts: [number, number, number][] = []
      for (let i = 0; i < 14; i++) {
        const a = Math.PI * (0.95 + (i / 13) * 1.1)
        pts.push([120 + Math.cos(a) * 62, 120 + Math.sin(a) * 58, 22])
      }
      pts.push([120, 112, 52])
      return bumps(ctx, h.color, pts)
    }
    case 'dreads': {
      let out = ''
      for (let i = 0; i < 9; i++) {
        const x = 70 + i * 12.5
        out += shape(`M${x},110 Q${x - 4},190 ${x + 2},${236 + (i % 3) * 10} l7,0 Q${x + 6},180 ${x + 9},110 Z`, fill, 2.5)
      }
      return out
    }
    case 'bun':
      return bumps(ctx, h.color, [[120, 74, 18]])
    default:
      return ''
  }
}

function hairFront(ctx: Ctx, c: Character): string {
  const h = c.hair
  if (!h) return ''
  const fill = lit(ctx, h.color)
  const sheen = (d: string) => line(d, shade(h.color, 0.45), 3, { 'stroke-opacity': 0.8 })
  switch (h.style) {
    case 'bald':
      return ellipse(106, 100, 12, 6, '#ffffff', 0, { 'fill-opacity': 0.5, transform: 'rotate(-20 106 100)' })
    case 'balding':
      return (
        shape('M73,146 C68,122 74,108 84,102 C82,120 86,132 80,150 Z', fill, 2.5) +
        shape('M167,146 C172,122 166,108 156,102 C158,120 154,132 160,150 Z', fill, 2.5) +
        ellipse(110, 98, 12, 6, '#ffffff', 0, { 'fill-opacity': 0.5, transform: 'rotate(-20 110 98)' })
      )
    case 'buzz':
      return tint('M76,128 C74,92 96,80 120,80 C144,80 166,92 164,128 C156,106 140,98 120,98 C100,98 84,106 76,128 Z', h.color, 0.85)
    case 'short':
      return (
        shape('M73,134 C68,90 92,74 120,74 C150,74 174,92 167,134 C162,114 152,104 142,102 C128,112 104,110 92,100 C84,108 78,120 73,134 Z', fill) +
        sheen('M96,86 Q112,80 128,82')
      )
    case 'sidepart':
      return (
        shape('M73,136 C66,88 96,72 124,74 C156,76 174,98 167,136 C163,114 156,104 146,98 C128,108 100,106 86,94 C80,106 76,120 73,136 Z', fill) +
        line('M104,80 Q110,90 106,100', shade(h.color, -0.35), 2.5) +
        sheen('M118,82 Q140,82 154,94')
      )
    case 'slick':
      return (
        shape('M75,128 C72,88 96,76 120,76 C146,76 168,88 165,128 C158,104 144,96 120,96 C98,96 82,104 75,128 Z', fill) +
        sheen('M90,96 Q110,84 140,86 M96,104 Q116,94 146,96')
      )
    case 'messy':
      return (
        shape('M72,136 C66,104 74,90 82,84 L80,70 L96,80 L100,62 L112,76 L124,60 L132,76 L148,64 L148,82 L164,78 L160,94 C172,108 170,124 167,136 C160,114 148,104 134,104 C120,112 100,110 88,100 C80,110 76,122 72,136 Z', fill) +
        sheen('M104,80 Q116,74 128,78')
      )
    case 'pixie':
      return (
        shape('M72,140 C64,92 92,72 122,74 C154,76 174,96 168,132 C160,112 150,102 136,100 C124,118 100,124 82,120 C78,126 74,132 72,140 Z', fill) +
        sheen('M100,84 Q120,78 140,84')
      )
    case 'long':
    case 'bob':
      return (
        shape('M73,148 C66,90 94,74 120,74 C146,74 174,90 167,148 C162,116 150,100 130,98 C118,110 98,114 86,110 C80,122 76,134 73,148 Z', fill) +
        sheen('M96,86 Q116,78 138,84') +
        line('M80,150 Q78,176 84,200 M160,150 Q162,176 156,200', shade(h.color, -0.3), 2)
      )
    case 'ponytail':
    case 'bun':
      return (
        shape('M75,130 C72,90 96,78 120,78 C146,78 168,90 165,130 C158,106 144,98 120,98 C98,98 82,106 75,130 Z', fill) +
        sheen('M92,94 Q112,84 140,88')
      )
    case 'curly': {
      const pts: [number, number, number][] = []
      for (let i = 0; i < 11; i++) {
        const a = Math.PI * (1.02 + (i / 10) * 0.96)
        pts.push([120 + Math.cos(a) * 46, 120 + Math.sin(a) * 40, 14])
      }
      return bumps(ctx, h.color, pts)
    }
    case 'afro':
      return bumps(ctx, h.color, [
        [92, 96, 14],
        [108, 88, 14],
        [124, 86, 14],
        [140, 90, 14],
        [154, 100, 12],
      ])
    case 'dreads':
      return (
        shape('M74,128 C72,90 96,78 120,78 C146,78 168,90 166,128 C158,104 144,98 120,98 C98,98 82,104 74,128 Z', fill) +
        line('M92,90 V104 M108,84 V100 M124,82 V98 M140,86 V102 M154,94 V108', shade(h.color, -0.35), 2.5)
      )
  }
}

// ---------- Headwear and eyewear ----------

function glasses(c: Character): string {
  const gl = c.glasses
  if (!gl) return ''
  const [l, r] = EYES_X
  const arms = line(`M${l - 13},${EYE_Y - 2} L78,${EYE_Y - 6} M${r + 13},${EYE_Y - 2} L162,${EYE_Y - 6}`, gl.color, 3)
  if (gl.style === 'round')
    return arms + circle(l, EYE_Y, 13, '#ffffff', 3, { stroke: gl.color, 'fill-opacity': 0.15 }) + circle(r, EYE_Y, 13, '#ffffff', 3, { stroke: gl.color, 'fill-opacity': 0.15 }) + line(`M${l + 13},${EYE_Y} Q120,${EYE_Y - 6} ${r - 13},${EYE_Y}`, gl.color, 3)
  if (gl.style === 'sun')
    return (
      arms +
      shape(`M${l - 16},${EYE_Y - 10} H${l + 14} Q${l + 14},${EYE_Y + 14} ${l - 1},${EYE_Y + 12} Q${l - 16},${EYE_Y + 10} ${l - 16},${EYE_Y - 10} Z`, '#141414', 3, { stroke: gl.color }) +
      shape(`M${r - 14},${EYE_Y - 10} H${r + 16} Q${r + 16},${EYE_Y + 10} ${r + 1},${EYE_Y + 12} Q${r - 14},${EYE_Y + 14} ${r - 14},${EYE_Y - 10} Z`, '#141414', 3, { stroke: gl.color }) +
      line(`M${l + 14},${EYE_Y - 8} H${r - 14}`, gl.color, 3) +
      line(`M${l - 10},${EYE_Y - 4} l8,8 M${r - 8},${EYE_Y - 4} l8,8`, '#ffffff', 2.5, { 'stroke-opacity': 0.6 })
    )
  const thick = gl.style === 'nerd' ? 5 : 3
  return (
    arms +
    rect(l - 14, EYE_Y - 11, 28, 22, '#ffffff', 4, thick, { stroke: gl.color, 'fill-opacity': 0.15 }) +
    rect(r - 14, EYE_Y - 11, 28, 22, '#ffffff', 4, thick, { stroke: gl.color, 'fill-opacity': 0.15 }) +
    line(`M${l + 14},${EYE_Y - 2} H${r - 14}`, gl.color, thick)
  )
}

function hat(ctx: Ctx, c: Character): string {
  const h = c.hat
  if (!h) return ''
  const fill = lit(ctx, h.color)
  const dark = shade(h.color, -0.25)
  switch (h.style) {
    case 'cap':
      return (
        shape('M74,116 C72,72 168,72 166,116 Z', fill) +
        line('M120,76 V114', dark, 2) +
        shape('M72,114 Q120,128 168,114 Q176,122 168,128 Q120,142 72,128 Q64,122 72,114 Z', dark) +
        (h.label ? text(h.label, 120, 106, h.label.length > 4 ? 12 : 15, '#ffffff', { stroke: INK, 'stroke-width': 0.6 }) : '')
      )
    case 'cowboy':
      return (
        shape('M46,112 Q120,86 194,112 Q206,124 188,124 Q120,106 52,124 Q34,124 46,112 Z', fill) +
        shape('M88,108 C84,70 100,60 120,70 C140,60 156,70 152,108 Q120,100 88,108 Z', fill) +
        shape('M88,96 Q120,88 152,96 L152,106 Q120,98 88,106 Z', dark, 2)
      )
    case 'beret':
      return ellipse(112, 92, 52, 18, fill, 3, { transform: 'rotate(-8 112 92)' }) + rect(110, 66, 6, 10, dark, 2, 2) + (h.label ? circle(146, 92, 6, '#ffd166', 2) : '')
    case 'military':
      return (
        ellipse(120, 82, 54, 15, fill) +
        shape('M76,86 H164 V108 H76 Z', dark) +
        shape('M76,108 Q120,124 164,108 L164,114 Q120,132 76,114 Z', '#1b1b1b', 2.5) +
        circle(120, 92, 8, '#e9c46a', 2) +
        line('M84,102 H156', '#e9c46a', 2.5)
      )
    case 'beanie':
      return shape('M74,122 C70,70 170,70 166,122 Z', fill) + rect(70, 108, 100, 20, dark, 8) + circle(120, 66, 10, shade(h.color, 0.3))
    case 'straw':
      return (
        ellipse(120, 112, 80, 16, lit(ctx, '#e9c46a')) +
        shape('M86,112 C84,74 156,74 154,112 Z', lit(ctx, '#f1d27c')) +
        shape('M86,100 Q120,92 154,100 L154,110 Q120,102 86,110 Z', '#c0392b', 2) +
        line('M60,112 Q120,104 180,112 M70,118 Q120,112 170,118', '#b8912c', 1.5)
      )
    case 'crown':
      return (
        shape('M82,100 L80,64 L98,82 L110,56 L120,78 L130,56 L142,82 L160,64 L158,100 Z', lit(ctx, '#f2c14e')) +
        circle(120, 92, 5, '#e63946', 2) +
        circle(98, 94, 4, '#3a86ff', 2) +
        circle(142, 94, 4, '#2a9d8f', 2)
      )
    case 'bandana':
      return (
        shape('M74,116 Q120,96 166,116 L166,130 Q120,110 74,130 Z', fill) +
        shape('M162,120 L184,132 L172,140 Z', fill, 2.5) +
        shape('M162,124 L180,150 L166,150 Z', fill, 2.5) +
        circle(100, 118, 2, '#ffffff', 0) +
        circle(130, 112, 2, '#ffffff', 0)
      )
    case 'helmet':
      return shape('M70,126 C70,64 170,64 170,126 Z', fill) + line('M120,68 V126', dark, 4) + rect(70, 118, 100, 10, dark, 4)
  }
}

function accessoriesHead(c: Character): string {
  let out = ''
  for (const a of c.accessories ?? []) {
    if (a === 'earrings') out += circle(77, 160, 6, 'none', 0, { stroke: '#e9c46a', 'stroke-width': 3 }) + circle(163, 160, 6, 'none', 0, { stroke: '#e9c46a', 'stroke-width': 3 })
    if (a === 'headphones')
      out += line('M72,140 C66,72 174,72 168,140', INK, 9) + line('M72,140 C66,72 174,72 168,140', '#ff3cac', 5) + rect(62, 124, 18, 34, '#2b2d42', 6) + rect(160, 124, 18, 34, '#2b2d42', 6)
    if (a === 'flowerCrown')
      out += [80, 96, 112, 128, 144, 160]
        .map((x, i) => {
          const y = 100 - Math.sin(((x - 80) / 80) * Math.PI) * 12
          const col = ['#ff7eb6', '#ffd166', '#c77dff'][i % 3]
          return [0, 72, 144, 216, 288].map((deg) => ellipse(x, y - 5, 3.5, 5.5, col, 1.2, { transform: `rotate(${deg} ${x} ${y})` })).join('') + circle(x, y, 2.6, '#f7b801', 1)
        })
        .join('')
  }
  return out
}

// ---------- Arms and hands ----------

function handPos(p: Prop): [number, number] {
  return p.hand === 'right' ? [190, 246] : [50, 246]
}

function sleeveColor(c: Character): string {
  if (c.outfit.style === 'tank') return c.skin
  if (c.outfit.style === 'vest') return c.outfit.inner ?? '#f8f9fa'
  if (c.outfit.style === 'labcoat') return '#f4f6f8'
  return c.outfit.color
}

function arm(c: Character, p: Prop): string {
  const [hx, hy] = handPos(p)
  const d = p.hand === 'right' ? `M200,336 Q220,286 ${hx},${hy + 6}` : `M40,336 Q20,286 ${hx},${hy + 6}`
  const sleeve = sleeveColor(c)
  return line(d, INK, 32) + line(d, c.outfit.style === 'flannel' ? shade(sleeve, -0.1) : sleeve, 26) + line(d, shade(sleeve, -0.2), 6, { 'stroke-opacity': 0.5, transform: p.hand === 'right' ? 'translate(6 0)' : 'translate(-6 0)' })
}

function hand(ctx: Ctx, c: Character, p: Prop): string {
  const [hx, hy] = handPos(p)
  const dir = p.hand === 'right' ? -1 : 1
  return g(
    {},
    shape(`M${hx - 13},${hy + 2} C${hx - 14},${hy - 12} ${hx + 14},${hy - 12} ${hx + 13},${hy + 2} C${hx + 13},${hy + 14} ${hx - 13},${hy + 14} ${hx - 13},${hy + 2} Z`, lit(ctx, c.skin), 2.5),
    line(`M${hx - 6},${hy - 6} V${hy + 2} M${hx},${hy - 7} V${hy + 2} M${hx + 6},${hy - 6} V${hy + 2}`, shade(c.skin, -0.4), 1.6),
    shape(`M${hx + dir * 10},${hy - 2} q${dir * 8},-4 ${dir * 8},4 q0,6 ${-dir * 8},4 Z`, lit(ctx, c.skin), 2),
  )
}

