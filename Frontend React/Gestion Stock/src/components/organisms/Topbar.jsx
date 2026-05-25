import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, LogOut, Menu, User } from 'lucide-react'
import { useAuthStore } from '../../services/auth.store'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'
import { Button } from '../atoms/Button'

function todayLabel() {
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date())
}

export function Topbar({ title, rightSlot, onOpenMenu }) {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!userMenuOpen) return

    function onPointerDown(e) {
      const el = userMenuRef.current
      if (!el) return
      if (el.contains(e.target)) return
      setUserMenuOpen(false)
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [userMenuOpen])

  return (
    <header
      className={cn(
        'sticky top-0 z-20',
        'bg-zinc-900/60 backdrop-blur border-b border-zinc-800/80',
      )}
    >
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 h-16 flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className={cn(
            'md:hidden h-10 w-10 rounded-2xl grid place-items-center',
            'border border-white/5 bg-white/4 text-zinc-100',
            'hover:bg-white/6 transition',
          )}
          aria-label="Abrir o cerrar menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-100 truncate">{title}</div>
          <div className="text-xs text-zinc-400 flex items-center gap-2 pt-0.5">
            <Calendar size={14} />
            <span>{todayLabel()}</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {rightSlot}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout()
              window.location.hash = '#/login'
            }}
            aria-label="Salir"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </Button>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className={cn(
                'h-10 w-10 rounded-2xl border border-white/5 bg-white/4 grid place-items-center text-zinc-100',
                'hover:bg-white/6 transition',
              )}
              aria-label="Usuario"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <User size={18} />
            </button>

            <AnimatePresence>
              {userMenuOpen ? (
                <motion.div
                  key="user-menu"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.standard }}
                  className={cn(
                    'absolute right-0 top-full mt-2 z-30',
                    'w-[280px] max-w-[calc(100vw-2.5rem)]',
                    'rounded-2xl border border-zinc-800/90 bg-zinc-950/95 backdrop-blur',
                    'shadow-[0_24px_70px_rgba(0,0,0,0.55)]',
                    'p-3',
                  )}
                  role="menu"
                >
                  <div className="px-1">
                    <div className="text-xs text-zinc-500">Usuario</div>
                    <div className="text-sm font-semibold text-zinc-100 truncate">
                      {user?.nombre || 'Usuario'}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 rounded-xl border border-white/5 bg-white/3 px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Rol</div>
                      <div className="text-xs text-zinc-200 truncate">{user?.rol || 'Sin rol'}</div>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Correo</div>
                      <div className="text-xs text-zinc-200 truncate">{user?.email || 'Sin correo'}</div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
