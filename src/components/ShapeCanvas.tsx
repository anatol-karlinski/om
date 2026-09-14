import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { simplifyPolyline } from '../geometry/simplify.ts'
import { addShape, type Point } from '../store/shapesSlice.ts'
import { useAppDispatch } from '../store/hooks.ts'

const CANVAS_SIZE = 300
const MIN_POINTS = 3

function getPoint(canvas: HTMLCanvasElement, event: PointerEvent<HTMLCanvasElement>): Point {
  const rect = canvas.getBoundingClientRect()
  const scaleX = CANVAS_SIZE / rect.width
  const scaleY = CANVAS_SIZE / rect.height
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

function paintStroke(canvas: HTMLCanvasElement, points: Point[]) {
  console.log('Painting stroke with points:', points)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  if (points.length === 0) {
    return
  }

  ctx.strokeStyle = getComputedStyle(canvas).color
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
}

export function ShapeCanvas() {
  const dispatch = useAppDispatch()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<Point[]>([])
  const isDrawingRef = useRef(false)

  const [draftPoints, setDraftPoints] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [name, setName] = useState('')

  const hasDraft = draftPoints.length >= MIN_POINTS
  const canSave = hasDraft && name.trim().length > 0

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_SIZE * dpr
    canvas.height = CANVAS_SIZE * dpr
    paintStroke(canvas, pointsRef.current)
  }, [])

  useEffect(() => {
    syncCanvasSize()
    window.addEventListener('resize', syncCanvasSize)
    return () => window.removeEventListener('resize', syncCanvasSize)
  }, [syncCanvasSize])

  const resetDraft = () => {
    pointsRef.current = []
    isDrawingRef.current = false
    setIsDrawing(false)
    setDraftPoints([])
    setName('')
    const canvas = canvasRef.current
    if (canvas) {
      paintStroke(canvas, [])
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (hasDraft) {
      return
    }

    const canvas = event.currentTarget
    canvas.setPointerCapture(event.pointerId)
    isDrawingRef.current = true
    setIsDrawing(true)
    pointsRef.current = [getPoint(canvas, event)]
    paintStroke(canvas, pointsRef.current)
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) {
      return
    }

    const canvas = event.currentTarget
    const next = getPoint(canvas, event)
    const last = pointsRef.current[pointsRef.current.length - 1]
    if (last && last.x === next.x && last.y === next.y) {
      return
    }

    pointsRef.current = [...pointsRef.current, next]
    paintStroke(canvas, pointsRef.current)
  }

  const finishStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) {
      return
    }

    isDrawingRef.current = false
    setIsDrawing(false)
    event.currentTarget.releasePointerCapture(event.pointerId)

    if (pointsRef.current.length < MIN_POINTS) {
      resetDraft()
      return
    }

    const simplified = simplifyPolyline(pointsRef.current)
    if (simplified.length < 2) {
      resetDraft()
      return
    }

    pointsRef.current = simplified
    paintStroke(event.currentTarget, simplified)
    setDraftPoints(simplified)
  }

  const handleSave = () => {
    if (!canSave) {
      return
    }

    dispatch(addShape({ name, points: draftPoints }))
    resetDraft()
  }

  const handleDiscard = () => {
    resetDraft()
  }

  return (
    <div className="d-flex flex-column align-items-center gap-3">
      <div className="shape-canvas-frame border border-primary">
        <canvas
          ref={canvasRef}
          className="shape-canvas"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          aria-label="Shape drawing canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
        {!hasDraft && !isDrawing ? (
          <p className="shape-canvas-hint mb-0 text-muted">Draw a shape</p>
        ) : null}
      </div>

      <div className="d-flex flex-column gap-2" style={{ width: CANVAS_SIZE }}>
        <input
          type="text"
          className="form-control"
          placeholder="Shape name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={!hasDraft}
          aria-label="Shape name"
        />
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-primary flex-grow-1" onClick={handleSave} disabled={!canSave}>
            Save
          </button>
          <button type="button" className="btn btn-outline-secondary flex-grow-1" onClick={handleDiscard} disabled={!hasDraft}>
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}
