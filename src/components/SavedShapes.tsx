import { selectShapes, type Point } from '../store/shapesSlice.ts'
import { useAppSelector } from '../store/hooks.ts'

function pathFromPoints(points: Point[]) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}

function ShapePreview({ points }: { points: Point[] }) {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  const pad = 12
  const width = Math.max(maxX - minX, 1)
  const height = Math.max(maxY - minY, 1)

  return (
    <svg
      className="shape-preview"
      viewBox={`${minX - pad} ${minY - pad} ${width + pad * 2} ${height + pad * 2}`}
      aria-hidden="true"
    >
      <path
        d={pathFromPoints(points)}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SavedShapes() {
  const shapes = useAppSelector(selectShapes)

  return (
    <section className="saved-shapes" aria-label="Saved shapes">
      <h2 className="h5 mb-3">Saved shapes</h2>
      {shapes.length === 0 ? (
        <p className="text-muted mb-0">No shapes saved yet.</p>
      ) : (
        <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
          {shapes.map((shape) => (
            <li key={shape.id} className="saved-shape-item d-flex align-items-center gap-3">
              <ShapePreview points={shape.points} />
              <div className="d-flex flex-column">
                <span>{shape.name}</span>
                <span className="text-muted small">
                  {shape.points.length} {shape.points.length === 1 ? 'point' : 'points'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
