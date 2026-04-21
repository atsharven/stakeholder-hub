import { createRoot } from 'react-dom/client'
import './index.css'
import './styles.css'
import StakeholderDashboard from './StakeholderDashboard'
import { ThemeProvider } from './theme.jsx'

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <StakeholderDashboard />
  </ThemeProvider>,
)
