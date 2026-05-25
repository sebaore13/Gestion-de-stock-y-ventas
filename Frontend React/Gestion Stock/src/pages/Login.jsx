import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../services/auth.store'
import { Button } from '../components/atoms/Button'
import { Input } from '../components/atoms/Input'
import { Toaster } from '../components/organisms/Toaster'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const user = useAuthStore((s) => s.user)
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.rol === 'Administrador' ? '/admin' : '/', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    const val = email.trim()
    if (!val) return
    if (!password) return
    setLoading(true)
    setError('')
    try {
      await login(val, password)
      const u = useAuthStore.getState().user
      navigate(u?.rol === 'Administrador' ? '/admin' : '/', { replace: true })
    } catch (err) {
      const msg = err?.message || 'No se pudo iniciar sesion'
      setError(msg)
      toast.error('Error al iniciar sesion', { description: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <div
        className="absolute inset-0 lg:hidden bg-cover bg-center"
        style={{ backgroundImage: "url('public/Fondo_login_celular.webp')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 lg:hidden bg-gradient-to-tr from-black/85 via-black/70 to-black/80" aria-hidden="true" />

      <div className="relative min-h-screen grid lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('public/Fondo_login.webp')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/55 to-black/70" />
          <div className="absolute inset-0 p-10 flex flex-col justify-end">
            <div className="max-w-xl"></div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-[var(--border)] bg-[rgba(24,24,27,0.40)] lg:bg-[rgba(24,24,27,0.72)] backdrop-blur px-6 py-7 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
              <div className="pb-6">
                <div className="text-lg font-semibold">Iniciar sesion</div>
                <div className="text-xs text-[var(--muted)] pt-1">Ingresa con tu email y password.</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs text-zinc-400">Email</div>
                  <Input
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="tu@email.com"
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-400">Password</div>
                  </div>
                  <Input
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    end={(
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="h-9 w-9 grid place-items-center rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition"
                        aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
                        title={showPassword ? 'Ocultar' : 'Mostrar'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  />
                </div>

                {error ? (
                  <div className="text-xs text-red-400 bg-red-400/10 rounded-xl px-3 py-2">{error}</div>
                ) : null}

                <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </Button>

                <div className="text-xs text-[var(--muted)]">
                  Si olvidaste tu password, solicita un reinicio.
                </div>
              </form>
            </div>

            <div className="pt-6 text-center text-xs text-zinc-500">
              <span className="lg:hidden">PipstopPRO</span>
              <span className="hidden lg:inline">PipstopPRO</span>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
