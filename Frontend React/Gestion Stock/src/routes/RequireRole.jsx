import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function RequireRole({ allow, children }) {
  const rol = useAppStore((s) => s.getRolActivo())
  const ok = allow.includes(rol)
  return ok ? children : <Navigate to="/" replace />
}
