import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import StakeholderDashboard from './StakeholderDashboard'
import { ThemeProvider } from './theme.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <StakeholderDashboard />
    </ThemeProvider>
  </StrictMode>,
)
