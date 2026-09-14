import { useEffect, useMemo } from 'react'
import { StrokeSurface } from './StrokeSurface.tsx'
import { useStrokeDrawing } from '../drawing/useStrokeDrawing.ts'
import { matchShape, type ShapeMatch } from '../geometry/match.ts'
import { selectShapes } from '../store/shapesSlice.ts'
import { useAppSelector } from '../store/hooks.ts'

type MatchCanvasProps = {
  onMatch: (match: ShapeMatch | null) => void
}

export function MatchCanvas({ onMatch }: MatchCanvasProps) {
  const templates = useAppSelector(selectShapes)
  const { canvasRef, draftPoints, isDrawing, handlePointerDown, handlePointerMove, finishStroke } = useStrokeDrawing({
    lockWhenComplete: false,
  })

  const match = useMemo(() => {
    if (draftPoints.length === 0 || isDrawing) {
      return null
    }
    return matchShape(draftPoints, templates)
  }, [draftPoints, isDrawing, templates])

  useEffect(() => {
    onMatch(match)
  }, [match, onMatch])

  let result = 'Draw a shape to recognize it.'
  if (templates.length === 0) {
    result = 'Save a shape above first.'
  } else if (match) {
    result = `Matched: ${match.name}`
  }

  return (
    <div className="d-flex flex-column gap-3" style={{ width: 300 }}>
      <h2 className="h5 mb-0">Recognize shape</h2>
      <StrokeSurface
        canvasRef={canvasRef}
        ariaLabel="Shape recognition canvas"
        hint="Draw a shape"
        showHint={!isDrawing && draftPoints.length === 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
      />
      <p className={`mb-0${match ? '' : ' text-muted'}`} aria-live="polite">
        {result}
      </p>
    </div>
  )
}
