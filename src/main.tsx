import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Restore theme settings immediately (before first render — avoids flash)
const savedPalette = localStorage.getItem('setting-palette') || 'lavender'
document.documentElement.setAttribute('data-palette', savedPalette)
if (localStorage.getItem('setting-darkmode') === 'true') {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
