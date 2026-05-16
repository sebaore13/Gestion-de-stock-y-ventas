import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  History,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  User,
} from 'lucide-react'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'
import { SidebarItem } from '../molecules/SidebarItem'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/', end: true },
  { key: 'inventario', label: 'Inventario', icon: Boxes, to: '/inventario' },
  { key: 'ventas', label: 'Ventas', icon: ShoppingCart, to: '/ventas' },
  { key: 'historial', label: 'Historial', icon: History, to: '/historial' },
  { key: 'config', label: 'Configuracion', icon: Settings, to: '/config' },
]

export function Sidebar({
  brand = 'OreStock',
  variant = 'fixed',
  open = false,
  onOpenChange,
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (variant !== 'drawer') return
    function onKeyDown(e) {
      if (e.key === 'Escape') onOpenChange?.(false)
    }
    if (open) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange, variant])

  const isDrawer = variant === 'drawer'

  const aside = (
    <motion.aside
      layout
      transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.standard }}
      className={cn(
        isDrawer ? 'h-[100dvh]' : 'h-screen sticky top-0',
        'bg-zinc-950 border-r border-zinc-900',
        collapsed ? 'w-[84px]' : 'w-[280px]',
        isDrawer ? 'shadow-[0_30px_90px_rgba(0,0,0,0.55)]' : '',
      )}
    >
      <div className="h-full flex flex-col">
        <div className={cn('px-4 pt-5 pb-4 flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="h-10 w-10 rounded-2xl bg-[rgba(249,115,22,0.16)] border border-[rgba(249,115,22,0.25)] grid place-items-center">
            <span className="text-[var(--primary)] font-semibold">
              {(brand?.slice(0, 2) ?? 'OS').toUpperCase()}
            </span>
          </div>

          <AnimatePresence initial={false}>
            {collapsed ? null : (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
                className="min-w-0"
              >
                <div className="text-sm font-semibold leading-tight truncate">{brand}</div>
                <div className="text-xs text-[var(--muted)] leading-tight truncate">Operaciones</div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className={cn(
              'ml-auto h-9 w-9 grid place-items-center rounded-xl',
              'text-zinc-300 hover:bg-white/5 hover:text-white transition',
              collapsed && 'hidden',
            )}
            onClick={() => setCollapsed(true)}
            aria-label="Colapsar sidebar"
          >
            <ChevronsLeft size={18} />
          </button>
          <button
            className={cn(
              'h-9 w-9 grid place-items-center rounded-xl',
              'text-zinc-300 hover:bg-white/5 hover:text-white transition',
              collapsed ? '' : 'hidden',
            )}
            onClick={() => setCollapsed(false)}
            aria-label="Expandir sidebar"
          >
            <ChevronsRight size={18} />
          </button>
        </div>

        <nav className={cn('px-3 pb-4', collapsed && 'px-2')}>
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 px-2 pb-2">
            Menu
          </div>
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <SidebarItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                to={item.to}
                end={item.end}
              />
            ))}
          </div>
        </nav>

        <div className={cn('mt-auto px-4 pb-5', collapsed && 'px-2')}>
          <div
            className={cn(
              'rounded-2xl border border-zinc-900 bg-white/3 px-4 py-4',
              collapsed && 'px-2',
            )}
          >
            <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
              <div className="h-10 w-10 rounded-2xl border border-white/5 bg-white/4 grid place-items-center text-zinc-100">
                <User size={18} />
              </div>
              <AnimatePresence initial={false}>
                {collapsed ? null : (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.standard }}
                    className="min-w-0"
                  >
                    <div className="text-sm font-semibold truncate">Seba Ore</div>
                    <div className="text-xs text-zinc-400 truncate">Administrador</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  )

  if (!isDrawer) return aside

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60"
            onClick={() => onOpenChange?.(false)}
          />
          <motion.div
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -12, opacity: 0 }}
            transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.standard }}
            className="fixed left-0 top-0"
          >
            {aside}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
