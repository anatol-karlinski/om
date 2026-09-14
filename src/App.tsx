import { useCallback, useState } from 'react'
import './App.css'
import { MatchCanvas } from './components/MatchCanvas.tsx'
import { SavedShapes } from './components/SavedShapes.tsx'
import { ShapeCanvas } from './components/ShapeCanvas.tsx'
import type { ShapeMatch } from './geometry/match.ts'

function App() {
  const [match, setMatch] = useState<ShapeMatch | null>(null)
  const handleMatch = useCallback((next: ShapeMatch | null) => {
    setMatch(next)
  }, [])

  return (
    <div className="app-shell d-flex justify-content-center">
      <div className="d-flex flex-wrap justify-content-center align-items-start gap-4 p-4">
        <ShapeCanvas />
        <MatchCanvas onMatch={handleMatch} />
        <SavedShapes matchedId={match?.id ?? null} />
      </div>
    </div>
  )
}

export default App
