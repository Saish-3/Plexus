import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyTheme } from './theme/tokens'
import './styles/index.css'

applyTheme() // mirror design tokens into CSS custom properties

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
