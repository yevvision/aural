import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeCleanDatabase } from './database/simulatedDatabase'

// Initialisiere die bereinigte Datenbank beim Start
initializeCleanDatabase();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
