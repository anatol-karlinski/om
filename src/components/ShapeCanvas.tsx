import { useState } from 'react'
import { StrokeSurface } from './StrokeSurface.tsx'
import { useStrokeDrawing } from '../drawing/useStrokeDrawing.ts'
import { addShape } from '../store/shapesSlice.ts'
import { useAppDispatch } from '../store/hooks.ts'

export function ShapeCanvas() {
  const dispatch = useAppDispatch()
  const [name, setName] = useState('')
  const { canvasRef, draftPoints, isDrawing, hasDraft, reset, handlePointerDown, handlePointerMove, finishStroke } =
    useStrokeDrawing({
      lockWhenComplete: true,
    })

  const canSave = hasDraft && name.trim().length > 0

  const handleSave = () => {
    if (!canSave) {
      return
    }

    dispatch(addShape({ name, points: draftPoints }))
    setName('')
    reset()
  }

  const handleDiscard = () => {
    setName('')
    reset()
  }

  return (
    <div className="d-flex flex-column gap-3" style={{ width: 300 }}>
      <h2 className="h5 mb-0">Define shape</h2>
      <StrokeSurface
        canvasRef={canvasRef}
        ariaLabel="Shape drawing canvas"
        hint="Draw a shape"
        showHint={!hasDraft && !isDrawing}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
      />

      <div className="d-flex flex-column gap-2">
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
          <button type="button" className="btn btn-secondary flex-grow-1" onClick={handleDiscard} disabled={!hasDraft}>
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}
