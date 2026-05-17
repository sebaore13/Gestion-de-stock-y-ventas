import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../services/auth.store'

export function RequireRole({ allow, children }) {
  const user = useAuthStore((s) => s.user)
  const ok = user && allow.includes(user.rol)
  return ok ? children : <Navigate to="/" replace />
}
