import type { RefObject, PointerEvent } from 'react'
import { CANVAS_SIZE } from '../drawing/paint.ts'

type StrokeSurfaceProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  ariaLabel: string
  hint: string
  showHint: boolean
  onPointerDown: (event: PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (event: PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (event: PointerEvent<HTMLCanvasElement>) => void
}

export function StrokeSurface({
  canvasRef,
  ariaLabel,
  hint,
  showHint,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: StrokeSurfaceProps) {
  return (
    <div className="shape-canvas-frame border border-primary">
      <canvas
        ref={canvasRef}
        className="shape-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {showHint ? <p className="shape-canvas-hint mb-0 text-muted">{hint}</p> : null}
    </div>
  )
}
