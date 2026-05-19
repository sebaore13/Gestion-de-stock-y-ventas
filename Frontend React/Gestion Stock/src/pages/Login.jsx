import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '../services/auth.store'
import { Button } from '../components/atoms/Button'
import { Input } from '../components/atoms/Input'
import { Card, CardBody, CardHeader } from '../components/atoms/Card'
import { Toaster } from '../components/organisms/Toaster'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    const val = email.trim()
    if (!val) return
    if (!password) return
    setLoading(true)
    setError('')
    try {
      await login(val, password)
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err.message || 'Error de conexion (backend caido?)'
      setError(msg)
      toast.error('Error al iniciar sesion', { description: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-zinc-950 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="text-center">
            <div className="text-lg font-semibold">OreStock</div>
            <div className="text-xs text-[var(--muted)] pt-1">Inicia sesion para continuar</div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">Email</div>
              <Input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="admin@taller.local"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">Password</div>
              <Input
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                type="password"
                placeholder="••••••••"
              />
            </div>
            {error ? (
              <div className="text-xs text-red-400 bg-red-400/10 rounded-xl px-3 py-2">{error}</div>
            ) : null}
            <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
            <div className="text-xs text-[var(--muted)] text-center space-y-1">
              <div>Demo: <span className="text-zinc-300">admin@taller.local</span> (Admin1234!) / <span className="text-zinc-300">venta@taller.local</span> (Venta1234!)</div>
              <div className="pt-1">Backend requiere Node.js en <span className="text-zinc-300">localhost:3001</span></div>
            </div>
          </form>
        </CardBody>
      </Card>
      <Toaster />
    </div>
  )
}
