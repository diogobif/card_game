import { circle, el, ellipse, g, INK, line, lit, newCtx, rect, shade, shape, svg, text, type Ctx } from './lib.ts'
import { extra } from './props.ts'
import { lighting, scene } from './scenes.ts'

/** Ground shadow under the main object. */
const floorShadow = (cx: number, cy: number, rx: number) => ellipse(cx, cy, rx, rx * 0.18, '#000000', 0, { 'fill-opacity': 0.25 })

function paper(ctx: Ctx, x: number, y: number, w: number, h: number, title: string, rot: number): string {
  let lines = ''
  for (let ly = y + 46; ly < y + h - 20; ly += 12) lines += line(`M${x + 14},${ly} H${x + w - 14 - ((ly * 7) % 30)}`, '#adb5bd', 3)
  return g(
    { transform: `rotate(${rot} ${x + w / 2} ${y + h / 2})` },
    rect(x + 6, y + 6, w, h, '#000000', 4, 0, { 'fill-opacity': 0.2 }),
    rect(x, y, w, h, lit(ctx, '#fffdf5'), 4, 3),
    text(title, x + w / 2, y + 28, title.length > 13 ? 10.5 : title.length > 10 ? 12 : 15, INK),
    line(`M${x + 14},${y + 36} H${x + w - 14}`, INK, 2),
    lines,
  )
}

const SUPPORTS: Record<string, (ctx: Ctx) => string> = {
  'corrente-do-zap'(ctx) {
    let chain = ''
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      chain += ellipse(120 + Math.cos(a) * 82, 176 + Math.sin(a) * 96, 14, 8, 'none', 0, {
        stroke: '#9aa3ad',
        'stroke-width': 6,
        transform: `rotate(${(a * 180) / Math.PI + 90} ${120 + Math.cos(a) * 82} ${176 + Math.sin(a) * 96})`,
      })
    }
    return (
      scene(ctx, 'chat', 'zap') +
      lighting(ctx, '#ffffff') +
      chain +
      floorShadow(120, 300, 60) +
      g(
        { transform: 'rotate(-6 120 180)' },
        rect(72, 70, 96, 200, '#1d1d24', 16, 3),
        rect(80, 86, 80, 168, '#ece5dd', 4, 0),
        rect(80, 86, 80, 18, '#075e54', 0, 0),
        text('Família', 112, 99, 9, '#ffffff'),
        extra(ctx, { kind: 'bubble', x: 116, y: 124, label: 'URGENTE' }),
        extra(ctx, { kind: 'bubble', x: 124, y: 156, label: 'REPASSE', color: '#ffffff' }),
        extra(ctx, { kind: 'bubble', x: 116, y: 188, label: 'É VERDADE' }),
        extra(ctx, { kind: 'bubble', x: 124, y: 220, label: 'ÁUDIO 7:42', color: '#ffffff' }),
        circle(120, 262, 5, '#3a3a44', 0),
      ) +
      circle(176, 70, 18, '#e63946', 3) +
      text('99+', 176, 75, 12, '#ffffff')
    )
  },
  'dizimo-turbinado'(ctx) {
    return (
      scene(ctx, 'church', 'dizimo') +
      lighting(ctx, '#ffe9b0') +
      floorShadow(120, 304, 70) +
      shape('M70,300 C40,300 40,220 84,190 L104,170 H136 L156,190 C200,220 200,300 170,300 Z', lit(ctx, '#c9a227')) +
      shape('M100,172 Q120,152 140,172 L136,182 Q120,174 104,182 Z', lit(ctx, '#a47e1b'), 2.5) +
      line('M98,184 Q120,194 142,184', '#7a5b10', 4) +
      shape('M112,212 h16 v20 h20 v14 h-20 v38 h-16 v-38 h-20 v-14 h20 Z', lit(ctx, '#fff3b0'), 2.5) +
      [
        [60, 120, -20],
        [184, 110, 15],
        [44, 200, 10],
        [196, 196, -12],
      ]
        .map(([x, y, r]) => extra(ctx, { kind: 'money', x, y, rotate: r }))
        .join('') +
      [
        [88, 130],
        [156, 142],
        [120, 112],
      ]
        .map(([x, y]) => circle(x, y, 9, lit(ctx, '#ffd166'), 2.5) + text('$', x, y + 4, 10, '#a47e1b'))
        .join('') +
      extra(ctx, { kind: 'sparkles', x: 50, y: 80 }) +
      extra(ctx, { kind: 'sparkles', x: 196, y: 70 })
    )
  },
  'isencao-fiscal'(ctx) {
    return (
      scene(ctx, 'office', 'isencao') +
      lighting(ctx, '#ffffff') +
      floorShadow(120, 300, 70) +
      paper(ctx, 52, 70, 136, 190, 'IMPOSTO DE RENDA', -4) +
      g(
        { transform: 'rotate(-18 120 170)' },
        rect(54, 146, 132, 46, 'none', 6, 0, { stroke: '#d62828', 'stroke-width': 6 }),
        text('ISENTO', 120, 182, 32, '#d62828'),
      ) +
      // Rubber stamp resting on the paper.
      rect(168, 220, 30, 34, lit(ctx, '#8a5a2b'), 6, 3) +
      ellipse(183, 218, 18, 8, lit(ctx, '#a47148'), 3) +
      rect(158, 252, 50, 14, '#d62828', 3, 3)
    )
  },
  motociata(ctx) {
    const bike = (x: number, y: number, s: number, flag: boolean) =>
      g(
        { transform: `translate(${x} ${y}) scale(${s})` },
        circle(-40, 30, 22, '#2b2d42', 4) + circle(-40, 30, 9, '#adb5bd', 3),
        circle(44, 30, 22, '#2b2d42', 4) + circle(44, 30, 9, '#adb5bd', 3),
        shape('M-40,30 L-10,-6 H24 L44,30', 'none', 6),
        shape('M-18,-12 Q2,-28 26,-10 L20,4 H-14 Z', lit(ctx, '#e63946')),
        shape('M-30,-16 H-6 L-10,-6 H-32 Z', '#1d1d24', 3),
        line('M28,-14 L38,-30 M30,-30 H48', INK, 5),
        circle(40, -10, 6, '#fff3b0', 3),
        flag ? line('M-34,-16 V-70', '#8a5a2b', 4) + rect(-34, -70, 34, 22, '#009c3b', 0, 2.5) + el('path', { d: 'M-17,-66 L-5,-59 L-17,-52 L-29,-59 Z', fill: '#ffdf00' }) + circle(-17, -59, 4, '#002776', 0) : '',
      )
    return (
      scene(ctx, 'congress', 'moto') +
      lighting(ctx, '#ffffff') +
      bike(54, 196, 0.55, true) +
      bike(186, 190, 0.5, true) +
      floorShadow(120, 304, 84) +
      bike(120, 262, 1.05, true) +
      extra(ctx, { kind: 'smoke', x: 26, y: 290 }) +
      extra(ctx, { kind: 'smoke', x: 214, y: 286 })
    )
  },
  'emenda-parlamentar'(ctx) {
    return (
      scene(ctx, 'congress', 'emenda') +
      lighting(ctx, '#ffffff') +
      floorShadow(120, 304, 70) +
      [
        [92, 96, -24],
        [150, 90, 20],
        [120, 80, 0],
      ]
        .map(([x, y, r]) =>
          g({ transform: `rotate(${r} ${x} ${y + 40})` }, rect(x - 18, y, 36, 64, lit(ctx, '#7bc47f'), 3, 2.5), rect(x - 12, y + 6, 24, 52, 'none', 2, 1.5, { stroke: '#2d6a4f' }), text('R$', x, y + 36, 11, '#2d6a4f')),
        )
        .join('') +
      paper(ctx, 56, 124, 128, 160, 'EMENDA', 3) +
      // A band-aid "emenda" patched across the document.
      g(
        { transform: 'rotate(-28 120 214)' },
        rect(66, 200, 108, 28, lit(ctx, '#f4c49a'), 12, 3),
        rect(102, 200, 36, 28, '#e7a978', 0, 2),
        [108, 116, 124, 132].map((x) => circle(x, 210, 1.6, '#b97a4f', 0) + circle(x, 218, 1.6, '#b97a4f', 0)).join(''),
      )
    )
  },
  'verba-cultural'(ctx) {
    const mask = (x: number, y: number, happy: boolean, color: string, rot: number) =>
      g(
        { transform: `rotate(${rot} ${x} ${y})` },
        shape(`M${x - 34},${y - 34} Q${x},${y - 46} ${x + 34},${y - 34} Q${x + 38},${y + 20} ${x},${y + 42} Q${x - 38},${y + 20} ${x - 34},${y - 34} Z`, lit(ctx, color)),
        happy
          ? line(`M${x - 22},${y - 10} q8,-8 16,0 M${x + 6},${y - 10} q8,-8 16,0 M${x - 18},${y + 12} Q${x},${y + 32} ${x + 18},${y + 12}`, INK, 4)
          : line(`M${x - 22},${y - 14} q8,8 16,0 M${x + 6},${y - 14} q8,8 16,0 M${x - 16},${y + 24} Q${x},${y + 8} ${x + 16},${y + 24}`, INK, 4),
      )
    return (
      scene(ctx, 'stage', 'verba') +
      lighting(ctx, '#fff3c4') +
      floorShadow(120, 304, 76) +
      shape('M80,300 C50,300 54,236 96,214 L108,200 H132 L144,214 C186,236 190,300 160,300 Z', lit(ctx, '#7bc47f')) +
      line('M106,206 Q120,214 134,206', '#2d6a4f', 4) +
      text('R$', 120, 272, 26, '#1b4332') +
      mask(82, 128, true, '#ffd166', -14) +
      mask(158, 124, false, '#8ecae6', 14) +
      extra(ctx, { kind: 'sparkles', x: 120, y: 64 }) +
      extra(ctx, { kind: 'stars', x: 40, y: 200 }) +
      extra(ctx, { kind: 'stars', x: 204, y: 196 })
    )
  },
  'greve-geral'(ctx) {
    return (
      scene(ctx, 'protest', 'greve') +
      lighting(ctx, '#ffffff') +
      floorShadow(120, 306, 70) +
      line('M120,300 V160', '#8a5a2b', 10) +
      line('M120,300 V160', INK, 2, { transform: 'translate(5 0)' }) +
      g(
        { transform: 'rotate(-4 120 110)' },
        rect(34, 58, 172, 100, '#ffffff', 6, 4),
        text('GREVE', 120, 102, 34, '#d62828'),
        text('GERAL', 120, 140, 34, INK),
      ) +
      // A gear with a padlock: the factory is closed.
      circle(54, 250, 26, lit(ctx, '#adb5bd'), 3) +
      [0, 45, 90, 135].map((d) => rect(48, 218, 12, 64, '#adb5bd', 2, 0, { transform: `rotate(${d} 54 250)` })).join('') +
      circle(54, 250, 22, lit(ctx, '#adb5bd'), 3) +
      rect(42, 244, 24, 20, lit(ctx, '#e9c46a'), 3, 2.5) +
      line('M46,244 V236 Q54,226 62,236 V244', INK, 3.5) +
      extra(ctx, { kind: 'smoke', x: 196, y: 260 })
    )
  },
  'estabilidade-vitalicia'(ctx) {
    return (
      scene(ctx, 'bureau', 'estab') +
      lighting(ctx, '#fff8e1') +
      floorShadow(120, 308, 80) +
      // Big office chair.
      shape('M76,120 Q76,86 120,86 Q164,86 164,120 V214 H76 Z', lit(ctx, '#2b2d42')) +
      line('M92,104 V200 M148,104 V200', shade('#2b2d42', 0.25), 3) +
      shape('M64,210 H176 Q184,232 168,240 H72 Q56,232 64,210 Z', lit(ctx, '#3d405b')) +
      rect(114, 240, 12, 38, '#6c757d', 2, 3) +
      line('M74,296 L120,278 L166,296 M120,278 V298', INK, 6) +
      circle(74, 298, 6, '#1d1d24', 2) +
      circle(166, 298, 6, '#1d1d24', 2) +
      circle(120, 300, 6, '#1d1d24', 2) +
      // Padlock chained to the chair: nobody takes this seat.
      line('M84,180 Q120,206 156,180', '#adb5bd', 6, { 'stroke-dasharray': '8 4' }) +
      rect(104, 176, 32, 28, lit(ctx, '#e9c46a'), 4, 3) +
      line('M110,176 V166 Q120,152 130,166 V176', INK, 4) +
      circle(120, 190, 4, INK, 0) +
      text('∞', 120, 140, 44, '#e9c46a', { stroke: INK, 'stroke-width': 1.5 }) +
      // Coffee mug on the floor.
      rect(176, 262, 30, 34, lit(ctx, '#ffffff'), 4, 3) +
      line('M206,270 q12,2 0,18', INK, 3) +
      text('SERVIDOR', 191, 282, 5.5, INK)
    )
  },
  'textao-lacrador'(ctx) {
    let lines = ''
    for (let y = 70; y < 290; y += 11) lines += line(`M80,${y} H${160 - ((y * 13) % 26)}`, '#6c757d', 3)
    return (
      scene(ctx, 'streamer', 'textao') +
      lighting(ctx, '#ff3cac') +
      floorShadow(120, 310, 70) +
      // A scroll so long it unrolls off the card.
      shape('M70,40 H170 V300 H70 Z', lit(ctx, '#fffdf5')) +
      ellipse(120, 40, 54, 10, lit(ctx, '#e9d8a6')) +
      ellipse(120, 300, 54, 10, lit(ctx, '#e9d8a6')) +
      text('THREAD 1/97', 120, 62, 11, '#d62828') +
      lines +
      extra(ctx, { kind: 'fire', x: 38, y: 120 }) +
      extra(ctx, { kind: 'fire', x: 186, y: 200 }) +
      extra(ctx, { kind: 'hashtag', x: 66, y: 254, label: '#LACROU', color: '#8338ec', rotate: -10 }) +
      extra(ctx, { kind: 'likes', x: 182, y: 98, label: '12k', rotate: 8 })
    )
  },
  'nota-de-repudio'(ctx) {
    return (
      scene(ctx, 'newsroom', 'repudio') +
      lighting(ctx, '#ffffff') +
      floorShadow(120, 306, 70) +
      paper(ctx, 50, 186, 140, 116, 'NOTA DE REPÚDIO', -3) +
      circle(160, 278, 16, lit(ctx, '#d62828'), 3) +
      text('!', 160, 285, 20, '#ffffff') +
      // Quill pen, mid-signature.
      shape('M196,196 Q232,150 214,110 Q200,150 176,186 Z', lit(ctx, '#f8f9fa')) +
      line('M178,190 L160,226', INK, 4) +
      line('M196,170 Q206,150 212,124', '#adb5bd', 2) +
      extra(ctx, { kind: 'bubble', x: 82, y: 118, label: 'VEEMENTE', color: '#ffffff', rotate: -6 })
    )
  },
}

export const SUPPORT_IDS = Object.keys(SUPPORTS)

export function drawSupport(id: string): string {
  const ctx = newCtx()
  const draw = SUPPORTS[id]
  if (!draw) throw new Error(`No support art for ${id}`)
  return svg(ctx, draw(ctx))
}
