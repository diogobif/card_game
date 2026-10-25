import { circle, el, ellipse, g, INK, line, lit, rect, shade, shape, text, type Ctx } from './lib.ts'

export type PropKind =
  | 'phone'
  | 'megaphone'
  | 'sign'
  | 'book'
  | 'cash'
  | 'coffee'
  | 'wine'
  | 'juice'
  | 'mic'
  | 'pan'
  | 'spoon'
  | 'flag'
  | 'controller'
  | 'pills'
  | 'document'
  | 'stamp'
  | 'disc'
  | 'keys'
  | 'pointer'
  | 'rose'
  | 'bible'
  | 'smartphoneLogo'

export type Prop = {
  kind: PropKind
  hand: 'left' | 'right'
  label?: string
  color?: string
  /** Flag design. */
  flag?: 'brasil' | 'star' | 'rainbow' | 'monarchy'
}

export type Extra = {
  kind: 'bubble' | 'likes' | 'money' | 'sparkles' | 'notes' | 'hashtag' | 'stars' | 'smoke' | 'fire'
  x: number
  y: number
  label?: string
  color?: string
  rotate?: number
  /** Drawn behind the character instead of in front. */
  behind?: boolean
}

export function prop(ctx: Ctx, p: Prop, [hx, hy]: [number, number]): string {
  const side = p.hand === 'right' ? 1 : -1
  switch (p.kind) {
    case 'phone':
    case 'smartphoneLogo':
      return g(
        { transform: `rotate(${side * 8} ${hx} ${hy})` },
        rect(hx - 13, hy - 52, 26, 48, '#1d1d24', 6, 3),
        rect(hx - 9, hy - 46, 18, 36, p.color ?? '#7fdc8c', 2, 0),
        p.kind === 'smartphoneLogo'
          ? ellipse(hx, hy - 30, 4, 5, '#d1d5db', 0) + ellipse(hx + 2, hy - 37, 1.6, 2.4, '#d1d5db', 0)
          : rect(hx - 6, hy - 42, 12, 4, '#ffffff', 1, 0, { 'fill-opacity': 0.8 }) + rect(hx - 6, hy - 34, 9, 4, '#ffffff', 1, 0, { 'fill-opacity': 0.8 }),
        circle(hx + 8, hy - 48, 4, '#e63946', 1.5),
      )
    case 'megaphone':
      return g(
        { transform: `rotate(${side === 1 ? -75 : -105} ${hx} ${hy})` },
        rect(hx - 6, hy - 9, 18, 18, '#e9ecef', 3, 2.5),
        shape(`M${hx + 12},${hy - 9} L${hx + 46},${hy - 24} L${hx + 46},${hy + 24} L${hx + 12},${hy + 9} Z`, lit(ctx, p.color ?? '#e63946')),
        ellipse(hx + 46, hy, 6, 24, '#f8f9fa', 3),
        line(`M${hx + 56},${hy - 18} l10,-6 M${hx + 58},${hy} h12 M${hx + 56},${hy + 18} l10,6`, INK, 2.5),
      )
    case 'sign': {
      const x = p.hand === 'right' ? 140 : 8
      return (
        line(`M${hx},${hy} V96`, '#8a5a2b', 7) +
        line(`M${hx},${hy} V96`, INK, 1.5, { transform: 'translate(3.5 0)' }) +
        g(
          { transform: `rotate(${side * 4} ${x + 46} 66)` },
          rect(x, 34, 92, 62, p.color ?? '#ffffff', 4, 3),
          signText(p.label ?? '', x + 46, 66),
        )
      )
    }
    case 'book':
      return g(
        { transform: `rotate(${side * -10} ${hx} ${hy})` },
        shape(`M${hx - 30},${hy - 40} Q${hx - 15},${hy - 46} ${hx},${hy - 40} V${hy} Q${hx - 15},${hy - 6} ${hx - 30},${hy} Z`, '#fdf6e3', 2.5),
        shape(`M${hx},${hy - 40} Q${hx + 15},${hy - 46} ${hx + 30},${hy - 40} V${hy} Q${hx + 15},${hy - 6} ${hx},${hy} Z`, '#fdf6e3', 2.5),
        line(`M${hx - 24},${hy - 32} h18 M${hx - 24},${hy - 24} h18 M${hx - 24},${hy - 16} h14 M${hx + 6},${hy - 32} h18 M${hx + 6},${hy - 24} h18 M${hx + 6},${hy - 16} h12`, '#9a8c7a', 1.6),
        p.label ? text(p.label, hx, hy - 50, 9, INK) : '',
      )
    case 'bible':
      return g(
        { transform: `rotate(${side * -8} ${hx} ${hy})` },
        rect(hx - 20, hy - 50, 40, 52, lit(ctx, '#3b2416'), 3, 3),
        rect(hx + 16, hy - 46, 6, 44, '#f1e4c8', 1, 2),
        shape(`M${hx - 3},${hy - 42} h6 v10 h9 v6 h-9 v18 h-6 v-18 h-9 v-6 h9 Z`, '#e9c46a', 1.5),
      )
    case 'cash':
      return [-22, 0, 22]
        .map((rot, i) =>
          g(
            { transform: `rotate(${rot + side * 10} ${hx} ${hy})` },
            rect(hx - 14, hy - 52, 28, 50, lit(ctx, '#7bc47f'), 3, 2.5),
            rect(hx - 9, hy - 46, 18, 38, 'none', 2, 1.5, { stroke: '#2d6a4f' }),
            i === 1 ? text('R$', hx, hy - 23, 11, '#2d6a4f') : '',
          ),
        )
        .join('')
    case 'coffee':
      return (
        shape(`M${hx - 14},${hy - 34} H${hx + 14} L${hx + 11},${hy + 2} H${hx - 11} Z`, lit(ctx, p.color ?? '#f8f9fa')) +
        rect(hx - 15, hy - 40, 30, 7, shade(p.color ?? '#f8f9fa', -0.3), 3, 2.5) +
        rect(hx - 12, hy - 22, 24, 10, '#8a5a2b', 2, 0) +
        line(`M${hx - 4},${hy - 48} q-4,-6 0,-12 M${hx + 5},${hy - 48} q-4,-6 0,-12`, '#ffffff', 2.5, { 'stroke-opacity': 0.8 })
      )
    case 'wine':
      return (
        shape(`M${hx - 13},${hy - 56} H${hx + 13} Q${hx + 14},${hy - 30} ${hx},${hy - 26} Q${hx - 14},${hy - 30} ${hx - 13},${hy - 56} Z`, '#ffffff', 2.5, { 'fill-opacity': 0.6 }) +
        shape(`M${hx - 12},${hy - 44} H${hx + 12} Q${hx + 11},${hy - 30} ${hx},${hy - 28} Q${hx - 11},${hy - 30} ${hx - 12},${hy - 44} Z`, '#8e1b3a', 0) +
        line(`M${hx},${hy - 26} V${hy - 4} M${hx - 9},${hy - 4} H${hx + 9}`, INK, 3)
      )
    case 'juice':
      return (
        shape(`M${hx - 13},${hy - 46} H${hx + 13} L${hx + 10},${hy + 2} H${hx - 10} Z`, '#ffffff', 2.5, { 'fill-opacity': 0.5 }) +
        shape(`M${hx - 12},${hy - 36} H${hx + 12} L${hx + 10},${hy} H${hx - 10} Z`, p.color ?? '#7cb518', 0) +
        line(`M${hx + 4},${hy - 40} L${hx + 12},${hy - 64}`, '#ff6b9a', 4) +
        ellipse(hx - 4, hy - 28, 6, 3, '#b5e48c', 0)
      )
    case 'mic':
      return g(
        { transform: `rotate(${side * -18} ${hx} ${hy})` },
        rect(hx - 6, hy - 40, 12, 44, '#2b2d42', 4, 2.5),
        circle(hx, hy - 50, 13, '#adb5bd', 3),
        line(`M${hx - 9},${hy - 56} h18 M${hx - 11},${hy - 50} h22 M${hx - 9},${hy - 44} h18`, '#6c757d', 1.5),
        rect(hx - 12, hy - 34, 24, 14, p.color ?? '#e63946', 2, 2),
        p.label ? text(p.label, hx, hy - 23.5, 8, '#ffffff') : '',
      )
    case 'pan':
      return (
        line(`M${hx},${hy} L${hx - side * 22},${hy - 22}`, INK, 9) +
        line(`M${hx},${hy} L${hx - side * 22},${hy - 22}`, '#3d3d46', 5) +
        ellipse(hx - side * 40, hy - 40, 26, 22, lit(ctx, '#c0c6ce')) +
        ellipse(hx - side * 40, hy - 46, 20, 9, '#8d959f', 2) +
        line(`M${hx - side * 58},${hy - 30} Q${hx - side * 40},${hy - 20} ${hx - side * 22},${hy - 30}`, '#ffffff', 2.5, { 'stroke-opacity': 0.6 })
      )
    case 'spoon':
      return line(`M${hx},${hy} L${hx - side * 30},${hy - 46}`, INK, 8) + line(`M${hx},${hy} L${hx - side * 30},${hy - 46}`, '#c68b59', 4) + ellipse(hx - side * 34, hy - 54, 7, 10, lit(ctx, '#c68b59'), 2.5, { transform: `rotate(${-side * 30} ${hx - side * 34} ${hy - 54})` })
    case 'flag':
      return line(`M${hx},${hy} V18`, '#8a5a2b', 6) + flagCloth(p, hx, side)
    case 'controller':
      return (
        shape(`M${hx - 28},${hy - 30} Q${hx - 30},${hy - 46} ${hx - 14},${hy - 46} H${hx + 14} Q${hx + 30},${hy - 46} ${hx + 28},${hy - 30} Q${hx + 34},${hy - 6} ${hx + 20},${hy - 8} L${hx + 12},${hy - 18} H${hx - 12} L${hx - 20},${hy - 8} Q${hx - 34},${hy - 6} ${hx - 28},${hy - 30} Z`, lit(ctx, '#3d405b')) +
        line(`M${hx - 18},${hy - 34} h10 M${hx - 13},${hy - 39} v10`, '#f1faee', 3) +
        circle(hx + 12, hy - 38, 3, '#e63946', 0) +
        circle(hx + 19, hy - 32, 3, '#2a9d8f', 0)
      )
    case 'pills':
      return (
        rect(hx - 14, hy - 48, 28, 44, lit(ctx, '#f4a261'), 4, 3, { 'fill-opacity': 0.9 }) +
        rect(hx - 16, hy - 56, 32, 10, '#ffffff', 3, 3) +
        rect(hx - 11, hy - 38, 22, 18, '#ffffff', 2, 1.5) +
        text(p.label ?? 'CURA', hx, hy - 26, 7, '#e63946') +
        ellipse(hx + 22, hy - 60, 7, 3.5, '#e63946', 1.5, { transform: `rotate(-30 ${hx + 22} ${hy - 60})` }) +
        ellipse(hx - 22, hy - 66, 7, 3.5, '#3a86ff', 1.5, { transform: `rotate(30 ${hx - 22} ${hy - 66})` })
      )
    case 'document':
      return g(
        { transform: `rotate(${side * 8} ${hx} ${hy})` },
        rect(hx - 22, hy - 60, 44, 58, '#fffdf5', 2, 2.5),
        p.label ? text(p.label, hx, hy - 48, 7, INK) : '',
        line(`M${hx - 15},${hy - 40} h30 M${hx - 15},${hy - 33} h30 M${hx - 15},${hy - 26} h22`, '#adb5bd', 2),
        circle(hx + 10, hy - 14, 7, '#e63946', 1.5),
      )
    case 'stamp':
      return rect(hx - 10, hy - 36, 20, 24, lit(ctx, '#8a5a2b'), 4, 2.5) + rect(hx - 18, hy - 14, 36, 10, '#e63946', 2, 2.5)
    case 'disc':
      return (
        ellipse(hx, hy - 32, 30, 11, '#e8f1ff', 2.5) +
        ellipse(hx, hy - 34, 27, 8.5, '#3a86ff', 0) +
        line(`M${hx - 14},${hy - 36} q6,-4 12,0 M${hx + 4},${hy - 34} q6,-4 12,0`, '#52b788', 4)
      )
    case 'keys':
      return (
        circle(hx, hy - 22, 9, 'none', 0, { stroke: '#adb5bd', 'stroke-width': 3 }) +
        rect(hx - 12, hy - 54, 24, 26, lit(ctx, '#2b2d42'), 6, 2.5) +
        text(p.label ?? '4x4', hx, hy - 37, 8, '#e9ecef') +
        line(`M${hx + 6},${hy - 18} l14,12 m-4,-3 l3,-3 m-7,-2 l3,-3`, '#adb5bd', 3)
      )
    case 'pointer':
      return line(`M${hx},${hy} L${hx - side * 52},${hy - 86}`, INK, 6) + line(`M${hx},${hy} L${hx - side * 52},${hy - 86}`, '#c68b59', 3) + circle(hx - side * 52, hy - 86, 4, '#e63946', 1.5)
    case 'rose':
      return line(`M${hx},${hy} Q${hx - side * 6},${hy - 30} ${hx},${hy - 50}`, '#2d6a4f', 4) + circle(hx, hy - 56, 10, lit(ctx, '#e63946'), 2.5) + line(`M${hx - 5},${hy - 58} q5,-6 10,0`, shade('#e63946', -0.4), 1.6)
  }
}

function signText(label: string, cx: number, cy: number): string {
  const words = label.split(' ')
  const lines: string[] = []
  for (const w of words) {
    const last = lines[lines.length - 1]
    if (last && (last + ' ' + w).length <= 10) lines[lines.length - 1] = last + ' ' + w
    else lines.push(w)
  }
  const size = lines.length > 2 ? 12 : 15
  const start = cy - ((lines.length - 1) * size) / 2 + size / 3
  return lines.map((l, i) => text(l, cx, start + i * size, size, INK)).join('')
}

function flagCloth(p: Prop, hx: number, side: number): string {
  // Flown high, above the head, so it never covers the face or a hat.
  const x = side === 1 ? hx - 66 : hx
  const cloth = `M${x},20 Q${x + 17},13 ${x + 33},20 T${x + 66},20 V64 Q${x + 49},57 ${x + 33},64 T${x},64 Z`
  const clip = `flag${p.hand}`
  let design = ''
  switch (p.flag ?? 'brasil') {
    case 'brasil':
      design =
        rect(x, 10, 66, 60, '#009c3b', 0, 0) +
        el('path', { d: `M${x + 33},24 L${x + 60},42 L${x + 33},60 L${x + 6},42 Z`, fill: '#ffdf00' }) +
        circle(x + 33, 42, 10, '#002776', 0) +
        line(`M${x + 24},40 Q${x + 33},37 ${x + 42},43`, '#ffffff', 2)
      break
    case 'star':
      design = rect(x, 10, 66, 60, '#d62828', 0, 0) + el('path', { d: `M${x + 18},26 l4,9 10,1 -8,6 3,10 -9,-6 -9,6 3,-10 -8,-6 10,-1 Z`, fill: '#ffd60a' })
      break
    case 'rainbow':
      design = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#457b9d', '#6a4c93']
        .map((c, i) => rect(x, 10 + i * 10, 66, 10, c, 0, 0))
        .join('')
      break
    case 'monarchy':
      design =
        rect(x, 10, 66, 60, '#00843d', 0, 0) +
        el('path', { d: `M${x + 18},28 L${x + 48},28 L${x + 48},44 Q${x + 33},58 ${x + 18},44 Z`, fill: '#ffffff', stroke: INK, 'stroke-width': 1.5 }) +
        el('path', { d: `M${x + 22},25 l4,-7 4,5 3,-7 3,7 4,-5 4,7 Z`, fill: '#ffd60a', stroke: INK, 'stroke-width': 1.5 })
      break
  }
  return (
    el('clipPath', { id: clip }, el('path', { d: cloth })) +
    el('g', { 'clip-path': `url(#${clip})` }, design) +
    el('path', { d: cloth, fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }) +
    el('path', { d: `M${x + 8},24 Q${x + 25},18 ${x + 42},26`, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.35, 'stroke-width': 4 })
  )
}

export function extra(ctx: Ctx, e: Extra): string {
  const rot = e.rotate ? { transform: `rotate(${e.rotate} ${e.x} ${e.y})` } : {}
  switch (e.kind) {
    case 'bubble': {
      const label = e.label ?? ''
      const w = Math.max(44, label.length * 7.2 + 18)
      return g(
        rot,
        shape(`M${e.x - w / 2},${e.y - 12} h${w} a6,6 0 0 1 6,6 v12 a6,6 0 0 1 -6,6 h${-w + 14} l-10,8 l2,-8 h-6 a6,6 0 0 1 -6,-6 v-12 a6,6 0 0 1 6,-6 Z`, e.color ?? '#dcf8c6', 2.5),
        text(label, e.x + 3, e.y + 4, 11, INK),
      )
    }
    case 'likes':
      return g(
        rot,
        rect(e.x - 28, e.y - 14, 56, 26, '#ffffff', 13, 2.5),
        el('path', { d: `M${e.x - 16},${e.y - 4} q-6,-7 -11,0 q-3,5 11,14 q14,-9 11,-14 q-5,-7 -11,0 Z`, fill: '#e63946', transform: `translate(4 0)` }),
        text(e.label ?? '99k', e.x + 9, e.y + 4, 11, INK),
      )
    case 'money':
      return g(
        rot,
        rect(e.x - 16, e.y - 9, 32, 18, lit(ctx, '#7bc47f'), 2, 2),
        circle(e.x, e.y, 5, '#2d6a4f', 0, { 'fill-opacity': 0.7 }),
      )
    case 'sparkles':
      return el('path', {
        d: `M${e.x},${e.y - 10} Q${e.x + 2},${e.y - 2} ${e.x + 10},${e.y} Q${e.x + 2},${e.y + 2} ${e.x},${e.y + 10} Q${e.x - 2},${e.y + 2} ${e.x - 10},${e.y} Q${e.x - 2},${e.y - 2} ${e.x},${e.y - 10} Z`,
        fill: e.color ?? '#fff3b0',
        stroke: INK,
        'stroke-width': 1.5,
      })
    case 'notes':
      return g(rot, line(`M${e.x},${e.y} V${e.y - 22} L${e.x + 14},${e.y - 26} V${e.y - 4}`, INK, 3), ellipse(e.x - 4, e.y, 5, 4, INK, 0), ellipse(e.x + 10, e.y - 4, 5, 4, INK, 0))
    case 'hashtag':
      return g(rot, rect(e.x - 40, e.y - 13, 80, 26, e.color ?? '#3a86ff', 13, 2.5), text(e.label ?? '#', e.x, e.y + 4.5, 12, '#ffffff'))
    case 'stars':
      return el('path', { d: `M${e.x},${e.y - 9} l2.6,6 6.4,.6 -4.9,4.2 1.5,6.3 -5.6,-3.4 -5.6,3.4 1.5,-6.3 -4.9,-4.2 6.4,-.6 Z`, fill: e.color ?? '#ffd166', stroke: INK, 'stroke-width': 1.5 })
    case 'smoke':
      return g({ 'fill-opacity': 0.55 }, circle(e.x, e.y, 18, '#d9d9d9', 0), circle(e.x + 18, e.y - 10, 14, '#cfcfcf', 0), circle(e.x - 14, e.y - 14, 12, '#e5e5e5', 0))
    case 'fire':
      return shape(`M${e.x},${e.y} q-16,-10 -6,-30 q4,10 10,8 q-4,-14 8,-26 q2,16 10,22 q8,8 0,24 q-8,8 -22,2 Z`, lit(ctx, '#ff9f1c'), 2.5) + el('path', { d: `M${e.x + 4},${e.y - 4} q-6,-6 0,-14 q4,8 8,6 q2,6 -8,8 Z`, fill: '#ffe066' })
  }
}

