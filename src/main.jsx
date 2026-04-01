import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import StakeholderDashboard from './StakeholderDashboard'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StakeholderDashboard />
  </StrictMode>,
)
