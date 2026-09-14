import type { Point } from './point.ts'

const CORNER_ANGLE = (40 * Math.PI) / 180
const HANDLE_SCALE = 1 / 6

type Cubic = {
  c1: Point
  c2: Point
  to: Point
}

type SmoothCurve = {
  start: Point
  cubics: Cubic[]
  closed: boolean
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y }
}

function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y }
}

function scale(point: Point, factor: number): Point {
  return { x: point.x * factor, y: point.y * factor }
}

function boundingSize(points: Point[]): number {
  let minX = points[0].x
  let minY = points[0].y
  let maxX = points[0].x
  let maxY = points[0].y

  for (let i = 1; i < points.length; i += 1) {
    const point = points[i]
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  return Math.max(maxX - minX, maxY - minY, 1)
}

function isClosedPolyline(points: Point[]): boolean {
  if (points.length < 3) {
    return false
  }

  const first = points[0]
  const last = points[points.length - 1]
  return Math.hypot(first.x - last.x, first.y - last.y) <= Math.max(4, boundingSize(points) * 0.08)
}

function ringPoints(points: Point[]): Point[] {
  if (!isClosedPolyline(points)) {
    return points
  }

  return points.slice(0, -1)
}

function turnAngle(prev: Point, curr: Point, next: Point): number {
  const inX = curr.x - prev.x
  const inY = curr.y - prev.y
  const outX = next.x - curr.x
  const outY = next.y - curr.y
  const inLen = Math.hypot(inX, inY) || 1
  const outLen = Math.hypot(outX, outY) || 1
  const dot = (inX / inLen) * (outX / outLen) + (inY / inLen) * (outY / outLen)
  return Math.acos(Math.min(1, Math.max(-1, dot)))
}

function clampHandle(origin: Point, handle: Point, maxLength: number): Point {
  const dx = handle.x - origin.x
  const dy = handle.y - origin.y
  const length = Math.hypot(dx, dy)
  if (length <= maxLength || length === 0) {
    return handle
  }

  const factor = maxLength / length
  return { x: origin.x + dx * factor, y: origin.y + dy * factor }
}

function fmt(value: number): string {
  return String(Number(value.toFixed(2)))
}

function toSmoothCurve(points: Point[]): SmoothCurve | null {
  if (points.length === 0) {
    return null
  }

  if (points.length === 1) {
    return { start: points[0], cubics: [], closed: false }
  }

  const closed = isClosedPolyline(points)
  const ring = closed ? ringPoints(points) : points
  const count = ring.length

  if (count < 2) {
    return { start: ring[0] ?? points[0], cubics: [], closed: false }
  }

  const corners = ring.map((point, index) => {
    if (!closed && (index === 0 || index === count - 1)) {
      return true
    }

    const prev = ring[(index - 1 + count) % count]
    const next = ring[(index + 1) % count]
    return turnAngle(prev, point, next) > CORNER_ANGLE
  })

  const segmentCount = closed ? count : count - 1
  const cubics: Cubic[] = []

  for (let i = 0; i < segmentCount; i += 1) {
    const i1 = i
    const i2 = (i + 1) % count
    const i0 = closed ? (i - 1 + count) % count : Math.max(0, i - 1)
    const i3 = closed ? (i + 2) % count : Math.min(count - 1, i + 2)

    const p0 = ring[i0]
    const p1 = ring[i1]
    const p2 = ring[i2]
    const p3 = ring[i3]

    let c1 = corners[i1] ? p1 : add(p1, scale(sub(p2, p0), HANDLE_SCALE))
    let c2 = corners[i2] ? p2 : sub(p2, scale(sub(p3, p1), HANDLE_SCALE))
    const maxLength = Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.5
    c1 = clampHandle(p1, c1, maxLength)
    c2 = clampHandle(p2, c2, maxLength)

    cubics.push({ c1, c2, to: p2 })
  }

  return { start: ring[0], cubics, closed }
}

function expandBounds(curve: SmoothCurve) {
  let minX = curve.start.x
  let minY = curve.start.y
  let maxX = curve.start.x
  let maxY = curve.start.y

  const include = (point: Point) => {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  for (const cubic of curve.cubics) {
    include(cubic.c1)
    include(cubic.c2)
    include(cubic.to)
  }

  return {
    minX,
    minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  }
}

function svgPathFromCurve(curve: SmoothCurve): string {
  if (curve.cubics.length === 0) {
    return ''
  }

  const parts = [`M ${fmt(curve.start.x)} ${fmt(curve.start.y)}`]
  for (const cubic of curve.cubics) {
    parts.push(
      `C ${fmt(cubic.c1.x)} ${fmt(cubic.c1.y)} ${fmt(cubic.c2.x)} ${fmt(cubic.c2.y)} ${fmt(cubic.to.x)} ${fmt(cubic.to.y)}`,
    )
  }
  if (curve.closed) {
    parts.push('Z')
  }
  return parts.join(' ')
}

export function getSmoothPreview(points: Point[]) {
  const curve = toSmoothCurve(points)
  if (!curve || curve.cubics.length === 0) {
    return null
  }

  return {
    d: svgPathFromCurve(curve),
    ...expandBounds(curve),
  }
}

export function strokeSmoothPolyline(ctx: CanvasRenderingContext2D, points: Point[]) {
  const curve = toSmoothCurve(points)
  if (!curve || curve.cubics.length === 0) {
    return
  }

  ctx.beginPath()
  ctx.moveTo(curve.start.x, curve.start.y)
  for (const cubic of curve.cubics) {
    ctx.bezierCurveTo(cubic.c1.x, cubic.c1.y, cubic.c2.x, cubic.c2.y, cubic.to.x, cubic.to.y)
  }
  if (curve.closed) {
    ctx.closePath()
  }
  ctx.stroke()
}
