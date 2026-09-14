import { configureStore } from '@reduxjs/toolkit'
import { shapesSlice } from './shapesSlice.ts'

export const store = configureStore({
  reducer: {
    shapes: shapesSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
