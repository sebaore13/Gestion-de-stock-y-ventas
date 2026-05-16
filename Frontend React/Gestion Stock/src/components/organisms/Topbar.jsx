import { Calendar, Menu, User } from 'lucide-react'
import { cn } from '../../design/cn'

function todayLabel() {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date())
}

export function Topbar({ title, rightSlot, onOpenMenu }) {
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
          aria-label="Abrir menu"
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
          <div className="h-10 w-10 rounded-2xl border border-white/5 bg-white/4 grid place-items-center text-zinc-100">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  )
}
