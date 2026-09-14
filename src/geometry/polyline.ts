import type { Point } from './point.ts'

export function boundingSize(points: Point[]): number {
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

export function isClosedPolyline(points: Point[]): boolean {
  if (points.length < 3) {
    return false
  }

  const first = points[0]
  const last = points[points.length - 1]
  return Math.hypot(first.x - last.x, first.y - last.y) <= Math.max(4, boundingSize(points) * 0.08)
}

export function resamplePolyline(points: Point[], sampleCount: number, closed: boolean): Point[] {
  if (sampleCount <= 0 || points.length === 0) {
    return []
  }

  if (points.length === 1) {
    return Array.from({ length: sampleCount }, () => ({ ...points[0] }))
  }

  const path = points.slice()
  if (closed) {
    const first = path[0]
    const last = path[path.length - 1]
    if (first.x !== last.x || first.y !== last.y) {
      path.push({ ...first })
    }
  }

  const distances = [0]
  let total = 0
  for (let i = 1; i < path.length; i += 1) {
    total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
    distances.push(total)
  }

  if (total === 0) {
    return Array.from({ length: sampleCount }, () => ({ ...path[0] }))
  }

  const result: Point[] = []
  const divisor = closed ? sampleCount : sampleCount - 1
  let segment = 0

  for (let i = 0; i < sampleCount; i += 1) {
    const target = Math.min((i * total) / divisor, total)
    while (segment < distances.length - 2 && distances[segment + 1] < target) {
      segment += 1
    }

    const from = path[segment]
    const to = path[segment + 1] ?? from
    const span = distances[segment + 1] - distances[segment]
    const t = span <= 1e-9 ? 0 : (target - distances[segment]) / span
    result.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    })
  }

  return result
}

export function normalizePolyline(points: Point[], sampleCount = 64): Point[] {
  if (points.length === 0) {
    return []
  }

  const closed = isClosedPolyline(points)
  const resampled = resamplePolyline(points, sampleCount, closed)
  const count = resampled.length
  let cx = 0
  let cy = 0
  for (const point of resampled) {
    cx += point.x
    cy += point.y
  }
  cx /= count
  cy /= count

  const centered = resampled.map((point) => ({ x: point.x - cx, y: point.y - cy }))
  let meanRadius = 0
  for (const point of centered) {
    meanRadius += Math.hypot(point.x, point.y)
  }
  meanRadius /= count
  if (meanRadius < 1e-6) {
    return centered
  }

  return centered.map((point) => ({
    x: point.x / meanRadius,
    y: point.y / meanRadius,
  }))
}
