import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../lib/store.jsx'

export default function Login() {
  const { actions, user } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('admin@taller.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const emailRef = useRef(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!user) return
    const target = location.state?.from ?? '/dashboard'
    navigate(target, { replace: true })
  }, [user, location.state, navigate])

  function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Ingresa un correo')
      return
    }
    // Prototipo: no validamos password.
    actions.login({ email: email.trim(), password })
  }

  return (
    <div className="login">
      <div className="panel login-card">
        <h2>Ingreso</h2>
        <p>Prototipo de gestion de stock y ventas</p>

        <form className="stack" onSubmit={onSubmit}>
          <label className="stack" style={{ gap: 6 }}>
            <span className="hint">Correo</span>
            <input
              ref={emailRef}
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@taller.local"
              autoComplete="username"
            />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <span className="hint">Contrasena</span>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="(no se valida en MVP)"
              type="password"
              autoComplete="current-password"
            />
          </label>

          {error ? <div className="badge badge-danger">{error}</div> : null}

          <div className="row row-between">
            <div className="hint">Usuarios demo: admin@taller.local, venta@taller.local</div>
            <button className="btn btn-primary" type="submit">
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
