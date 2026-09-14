import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { simplifyPolyline } from '../geometry/simplify.ts'
import type { Point } from '../geometry/point.ts'
import { MIN_POINTS, getCanvasPoint, paintStroke, syncCanvasResolution } from './paint.ts'

type UseStrokeDrawingOptions = {
  lockWhenComplete: boolean
}

export function useStrokeDrawing({ lockWhenComplete }: UseStrokeDrawingOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<Point[]>([])
  const isDrawingRef = useRef(false)

  const [draftPoints, setDraftPoints] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  const hasDraft = draftPoints.length >= MIN_POINTS

  const reset = useCallback(() => {
    pointsRef.current = []
    isDrawingRef.current = false
    setIsDrawing(false)
    setDraftPoints([])
    const canvas = canvasRef.current
    if (canvas) {
      paintStroke(canvas, [])
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const sync = () => {
      syncCanvasResolution(canvas)
      paintStroke(canvas, pointsRef.current, !isDrawingRef.current && pointsRef.current.length > 0)
    }

    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (lockWhenComplete && hasDraft) {
      return
    }

    const canvas = event.currentTarget
    canvas.setPointerCapture(event.pointerId)
    isDrawingRef.current = true
    setIsDrawing(true)
    setDraftPoints([])
    pointsRef.current = [getCanvasPoint(canvas, event)]
    paintStroke(canvas, pointsRef.current)
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) {
      return
    }

    const canvas = event.currentTarget
    const next = getCanvasPoint(canvas, event)
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
      reset()
      return
    }

    const simplified = simplifyPolyline(pointsRef.current)
    if (simplified.length < 2) {
      reset()
      return
    }

    pointsRef.current = simplified
    paintStroke(event.currentTarget, simplified, true)
    setDraftPoints(simplified)
  }

  return {
    canvasRef,
    draftPoints,
    isDrawing,
    hasDraft,
    reset,
    handlePointerDown,
    handlePointerMove,
    finishStroke,
  }
}
