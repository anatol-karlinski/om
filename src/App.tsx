import './App.css'
import { SavedShapes } from './components/SavedShapes.tsx'
import { ShapeCanvas } from './components/ShapeCanvas.tsx'

function App() {
  return (
    <div className="app-shell d-flex justify-content-center align-items-center">
      <div className="d-flex flex-wrap justify-content-center align-items-start gap-4 p-4">
        <ShapeCanvas />
        <SavedShapes />
      </div>
    </div>
  )
}

export default App
