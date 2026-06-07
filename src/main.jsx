import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Side-effect import: registers the OS color-scheme listener and seeds the
// theme store from the saved preference (the .dark class is already applied
// pre-paint by the inline script in index.html).
import './store/theme.store'
import { useAuthStore } from './store/auth.store'

// Resolve the initial Supabase session before the app gates on it.
useAuthStore.getState().init()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
