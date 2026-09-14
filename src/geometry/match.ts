import type { Point } from './point.ts'
import { normalizePolyline } from './polyline.ts'

const MAX_ALIGN_ANGLE = (18 * Math.PI) / 180
const ALIGN_ANGLE_STEP = (2 * Math.PI) / 180
export const MATCH_REJECT_THRESHOLD = 0.5

export type ShapeTemplate = {
  id: string
  name: string
  points: Point[]
}

export type ShapeMatch = {
  id: string
  name: string
  distance: number
}

function rotate(points: Point[], angle: number): Point[] {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return points.map((point) => ({
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }))
}

function nearestNeighborMax(from: Point[], to: Point[]): number {
  let farthest = 0
  for (const point of from) {
    let nearest = Infinity
    for (const candidate of to) {
      const distance = Math.hypot(point.x - candidate.x, point.y - candidate.y)
      if (distance < nearest) {
        nearest = distance
      }
    }
    if (nearest > farthest) {
      farthest = nearest
    }
  }
  return farthest
}

function unorderedPolylineDistance(a: Point[], b: Point[]): number {
  return Math.max(nearestNeighborMax(a, b), nearestNeighborMax(b, a))
}

function alignedDistance(drawing: Point[], template: Point[]): number {
  let best = unorderedPolylineDistance(drawing, template)
  for (let angle = -MAX_ALIGN_ANGLE; angle <= MAX_ALIGN_ANGLE + 1e-9; angle += ALIGN_ANGLE_STEP) {
    if (Math.abs(angle) < 1e-9) {
      continue
    }
    const distance = unorderedPolylineDistance(rotate(drawing, angle), template)
    if (distance < best) {
      best = distance
    }
  }
  return best
}

export function matchShape(drawing: Point[], templates: ShapeTemplate[]): ShapeMatch | null {
  if (drawing.length < 2 || templates.length === 0) {
    return null
  }

  const normalizedDrawing = normalizePolyline(drawing)
  let best: ShapeMatch | null = null

  for (const template of templates) {
    const distance = alignedDistance(normalizedDrawing, normalizePolyline(template.points))
    if (!best || distance < best.distance) {
      best = {
        id: template.id,
        name: template.name,
        distance,
      }
    }
  }

  // TODO: Find better threshold, current too strict.
  if (!best || best.distance > MATCH_REJECT_THRESHOLD) {
    return null
  }

  return best
}
