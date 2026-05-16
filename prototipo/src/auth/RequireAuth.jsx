import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../lib/store.jsx'

export default function RequireAuth({ children }) {
  const { user } = useAppStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
