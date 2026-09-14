import type { Point } from './point.ts'
import { normalizePolyline } from './polyline.ts'

export const MATCH_REJECT_THRESHOLD = 0.2

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

export function matchShape(drawing: Point[], templates: ShapeTemplate[]): ShapeMatch | null {
  if (drawing.length < 2 || templates.length === 0) {
    return null
  }

  const normalizedDrawing = normalizePolyline(drawing)
  let best: ShapeMatch | null = null

  for (const template of templates) {
    const distance = unorderedPolylineDistance(normalizedDrawing, normalizePolyline(template.points))
    if (!best || distance < best.distance) {
      best = {
        id: template.id,
        name: template.name,
        distance,
      }
    }
  }

  if (!best || best.distance > MATCH_REJECT_THRESHOLD) {
    return null
  }

  return best
}
