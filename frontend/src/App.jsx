import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login       from './pages/Login.jsx'
import Register    from './pages/Register.jsx'
import Dashboard   from './pages/Dashboard.jsx'
import MyItems     from './pages/MyItems.jsx'
import AddItem     from './pages/AddItem.jsx'
import Search      from './pages/Search.jsx'
import Camera      from './pages/Camera.jsx'
import LiveCamera  from './pages/LiveCamera.jsx'
import ItemHistory from './pages/ItemHistory.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import { setupSyncListeners, syncPendingLogs, refreshLocalCache } from './Services/syncService.js'
import { getPendingLogs, isOnline } from './services/localDB.js'

function PrivateRoute({ children }) {
  return localStorage.getItem('token')
    ? children
    : <Navigate to="/login" replace />
}

export default function App() {
  const [online, setOnline]           = useState(isOnline())
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing]         = useState(false)
  const [syncResult, setSyncResult]   = useState(null)

  const updatePendingCount = async () => {
    const logs = await getPendingLogs()
    setPendingCount(logs.length)
  }

  useEffect(() => {
    updatePendingCount()

    const cleanup = setupSyncListeners(
      // Online handler
      async () => {
        setOnline(true)
        setSyncResult(null)
        const logs = await getPendingLogs()
        if (logs.length > 0) {
          setSyncing(true)
          const result = await syncPendingLogs()
          setSyncing(false)
          setSyncResult(result)
          setPendingCount(0)
          // Refresh local cache after sync
          await refreshLocalCache()
          setTimeout(() => setSyncResult(null), 4000)
        } else {
          // Just refresh cache when back online
          await refreshLocalCache()
        }
      },
      // Offline handler
      () => {
        setOnline(false)
        updatePendingCount()
      }
    )

    // Initial cache refresh if online
    if (isOnline() && localStorage.getItem('token')) {
      refreshLocalCache()
    }

    return cleanup
  }, [])

  // Expose pendingCount updater globally so AddItem can call it
  window.__updatePendingCount = updatePendingCount

  return (
    <BrowserRouter>
      <OfflineBanner
        isOnline={online}
        pendingCount={pendingCount}
        syncing={syncing}
        syncResult={syncResult}
      />
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/items"   element={<PrivateRoute><MyItems /></PrivateRoute>} />
        <Route path="/add"     element={<PrivateRoute><AddItem /></PrivateRoute>} />
        <Route path="/search"  element={<PrivateRoute><Search /></PrivateRoute>} />
        <Route path="/camera"  element={<PrivateRoute><Camera /></PrivateRoute>} />
        <Route path="/live"    element={<PrivateRoute><LiveCamera /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><ItemHistory /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
