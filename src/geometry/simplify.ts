import type { Point } from './point.ts'

function consecutiveUnique(points: Point[]): Point[] {
  const unique: Point[] = []
  for (const point of points) {
    const last = unique[unique.length - 1]
    if (!last || last.x !== point.x || last.y !== point.y) {
      unique.push(point)
    }
  }
  return unique
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

function perpendicularDistance(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y)
  }

  const numerator = Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x)
  return numerator / Math.hypot(dx, dy)
}

function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) {
    return points.slice()
  }

  const keep = Array.from({ length: points.length }, () => false)
  keep[0] = true
  keep[points.length - 1] = true

  const stack: Array<[number, number]> = [[0, points.length - 1]]
  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop()!
    let maxDistance = 0
    let maxIndex = startIndex

    for (let i = startIndex + 1; i < endIndex; i += 1) {
      const distance = perpendicularDistance(points[i], points[startIndex], points[endIndex])
      if (distance > maxDistance) {
        maxDistance = distance
        maxIndex = i
      }
    }

    if (maxDistance > epsilon) {
      keep[maxIndex] = true
      stack.push([startIndex, maxIndex], [maxIndex, endIndex])
    }
  }

  return points.filter((_, index) => keep[index])
}

export function simplifyPolyline(points: Point[]): Point[] {
  const unique = consecutiveUnique(points)
  if (unique.length <= 2) {
    return unique
  }

  const epsilon = Math.max(2, boundingSize(unique) * 0.02)
  return douglasPeucker(unique, epsilon)
}
