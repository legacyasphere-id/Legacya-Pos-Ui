import React, { useState } from 'react'

// Import all artifact screens
import Foundation from '../artifacts/01-foundation.jsx'
import Dashboard from '../artifacts/02-dashboard.jsx'
import Operations from '../artifacts/03-operations.jsx'
import Management from '../artifacts/04-management.jsx'
import System from '../artifacts/05-system.jsx'

const screens = [
  { id: 'foundation', label: 'Foundation', component: Foundation },
  { id: 'dashboard', label: 'Dashboard', component: Dashboard },
  { id: 'operations', label: 'Operations', component: Operations },
  { id: 'management', label: 'Management', component: Management },
  { id: 'system', label: 'System', component: System },
]

export default function App() {
  const [active, setActive] = useState('dashboard')

  const ActiveScreen = screens.find(s => s.id === active)?.component

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Screen Switcher — remove after Vercel deploy if not needed */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#1E293B', display: 'flex', gap: '4px',
        padding: '6px 12px', overflowX: 'auto'
      }}>
        {screens.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: active === s.id ? '#4A7FA7' : '#334155',
              color: '#fff', fontWeight: active === s.id ? 600 : 400,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Active Screen */}
      <div style={{ paddingTop: '40px' }}>
        {ActiveScreen ? <ActiveScreen /> : <p>Screen not found</p>}
      </div>
    </div>
  )
}
