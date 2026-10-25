// Tiny SVG toolkit for the card art generator.

export const W = 240
export const H = 336
/** Outline color used by every shape, so the cards read as one illustrated set. */
export const INK = '#231c26'

type AttrValue = string | number | undefined | false
type Attrs = Record<string, AttrValue>

export function el(tag: string, attrs: Attrs = {}, children = ''): string {
  const a = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== false)
    .map(([k, v]) => `${k}="${typeof v === 'number' ? round(v) : escapeAttr(String(v))}"`)
    .join(' ')
  return children ? `<${tag} ${a}>${children}</${tag}>` : `<${tag} ${a}/>`
}

export function g(attrs: Attrs, ...children: string[]): string {
  return el('g', attrs, children.join(''))
}

export function text(
  content: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  extra: Attrs = {},
): string {
  return el(
    'text',
    {
      x,
      y,
      'font-size': size,
      fill,
      'font-family': 'Arial, Helvetica, sans-serif',
      'font-weight': 'bold',
      'text-anchor': 'middle',
      ...extra,
    },
    escapeText(content),
  )
}

function round(n: number): string {
  return String(Math.round(n * 10) / 10)
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Lightens (amt > 0) or darkens (amt < 0) a #rrggbb color. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)),
  )
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('')
}

/** Collects gradient and pattern definitions for one image. */
export type Ctx = { defs: Map<string, string>; seq: number }

export function newCtx(): Ctx {
  return { defs: new Map(), seq: 0 }
}

export function defsBlock(ctx: Ctx): string {
  return ctx.defs.size ? `<defs>${[...ctx.defs.values()].join('')}</defs>` : ''
}

type Stop = [offset: number, color: string, opacity?: number]

function stops(list: Stop[]): string {
  return list
    .map(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }))
    .join('')
}

export function linear(
  ctx: Ctx,
  list: Stop[],
  dir: [number, number, number, number] = [0, 0, 0, 1],
  key?: string,
): string {
  const id = key ?? `lg${ctx.seq++}`
  if (!ctx.defs.has(id)) {
    const [x1, y1, x2, y2] = dir
    ctx.defs.set(id, el('linearGradient', { id, x1, y1, x2, y2 }, stops(list)))
  }
  return `url(#${id})`
}

export function radial(
  ctx: Ctx,
  list: Stop[],
  at: [cx: number, cy: number, r: number] = [0.5, 0.5, 0.5],
  key?: string,
): string {
  const id = key ?? `rg${ctx.seq++}`
  if (!ctx.defs.has(id)) {
    const [cx, cy, r] = at
    ctx.defs.set(id, el('radialGradient', { id, cx, cy, r }, stops(list)))
  }
  return `url(#${id})`
}

/** Soft top-left light to darker bottom-right: the standard fill for skin and cloth. */
export function lit(ctx: Ctx, base: string): string {
  return linear(
    ctx,
    [
      [0, shade(base, 0.22)],
      [0.55, base],
      [1, shade(base, -0.22)],
    ],
    [0, 0, 0.6, 1],
    `lit${base.slice(1)}`,
  )
}

export function pattern(ctx: Ctx, id: string, w: number, h: number, body: string): string {
  if (!ctx.defs.has(id)) {
    ctx.defs.set(id, el('pattern', { id, width: w, height: h, patternUnits: 'userSpaceOnUse' }, body))
  }
  return `url(#${id})`
}

/** Outlined shape helper: fill plus the shared ink stroke. */
export function shape(d: string, fill: string, width = 3, extra: Attrs = {}): string {
  return el('path', {
    d,
    fill,
    stroke: INK,
    'stroke-width': width,
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
    ...extra,
  })
}

/** Unoutlined overlay, for shading and highlights. */
export function tint(d: string, fill: string, opacity: number): string {
  return el('path', { d, fill, 'fill-opacity': opacity })
}

export function line(d: string, stroke: string = INK, width = 3, extra: Attrs = {}): string {
  return el('path', {
    d,
    fill: 'none',
    stroke,
    'stroke-width': width,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    ...extra,
  })
}

export function circle(cx: number, cy: number, r: number, fill: string, width = 3, extra: Attrs = {}): string {
  return el('circle', { cx, cy, r, fill, stroke: width ? INK : undefined, 'stroke-width': width || undefined, ...extra })
}

export function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  width = 3,
  extra: Attrs = {},
): string {
  return el('ellipse', {
    cx,
    cy,
    rx,
    ry,
    fill,
    stroke: width ? INK : undefined,
    'stroke-width': width || undefined,
    ...extra,
  })
}

export function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  r = 0,
  width = 3,
  extra: Attrs = {},
): string {
  return el('rect', {
    x,
    y,
    width: w,
    height: h,
    rx: r || undefined,
    fill,
    stroke: width ? INK : undefined,
    'stroke-width': width || undefined,
    'stroke-linejoin': 'round',
    ...extra,
  })
}

/** Deterministic pseudo-random numbers, so regenerating gives the same art. */
export function rng(seed: string): () => number {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

export function svg(ctx: Ctx, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    defsBlock(ctx) +
    body +
    '</svg>\n'
  )
}
