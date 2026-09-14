import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Point } from '../geometry/point.ts'
import { simplifyPolyline } from '../geometry/simplify.ts'

export type { Point }

export type Shape = {
  id: string
  name: string
  points: Point[]
}

type ShapesState = {
  items: Shape[]
}

const initialState: ShapesState = {
  items: [],
}

export const shapesSlice = createSlice({
  name: 'shapes',
  initialState,
  reducers: {
    addShape: {
      reducer(state, action: PayloadAction<Shape>) {
        state.items.push(action.payload)
      },
      prepare({ name, points }: { name: string; points: Point[] }) {
        return {
          payload: {
            id: crypto.randomUUID(),
            name: name.trim(),
            points: simplifyPolyline(points),
          },
        }
      },
    },
  },
})

export const { addShape } = shapesSlice.actions
export const selectShapes = (state: { shapes: ShapesState }) => state.shapes.items
