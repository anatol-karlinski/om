import { selectShapes, type Point } from '../store/shapesSlice.ts'
import { useAppSelector } from '../store/hooks.ts'
import { getSmoothPreview } from '../geometry/smoothPath.ts'

function ShapePreview({ points }: { points: Point[] }) {
  const preview = getSmoothPreview(points)
  if (!preview) {
    return null
  }

  const pad = 12

  return (
    <svg
      className="shape-preview"
      viewBox={`${preview.minX - pad} ${preview.minY - pad} ${preview.width + pad * 2} ${preview.height + pad * 2}`}
      aria-hidden="true"
    >
      <path
        d={preview.d}
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
