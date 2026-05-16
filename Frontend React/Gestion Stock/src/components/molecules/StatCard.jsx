import { motion } from 'framer-motion'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'
import { Badge } from '../atoms/Badge'

function deltaToBadge(delta) {
  if (delta > 0) return { variant: 'success', text: `+${delta}%` }
  if (delta < 0) return { variant: 'danger', text: `${delta}%` }
  return { variant: 'neutral', text: '0%' }
}

export function StatCard({ title, value, delta = 0, icon: Icon, accent = 'orange', className }) {
  const d = deltaToBadge(delta)

  const accentStyles =
    accent === 'blue'
      ? 'from-[rgba(59,130,246,0.60)] to-[rgba(59,130,246,0.10)]'
      : accent === 'green'
        ? 'from-[rgba(34,197,94,0.55)] to-[rgba(34,197,94,0.10)]'
        : accent === 'red'
          ? 'from-[rgba(239,68,68,0.55)] to-[rgba(239,68,68,0.10)]'
          : 'from-[rgba(249,115,22,0.60)] to-[rgba(249,115,22,0.10)]'

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[rgba(24,24,27,0.75)] backdrop-blur',
        'shadow-[0_18px_50px_rgba(0,0,0,0.22)] overflow-hidden',
        className,
      )}
    >
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{title}</div>
          <div className="pt-2 text-2xl font-semibold text-[var(--text)]">{value}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={d.variant}>{d.text}</Badge>
          {Icon ? (
            <div className="h-10 w-10 rounded-2xl border border-white/5 bg-white/4 grid place-items-center text-zinc-100">
              <Icon size={18} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r', accentStyles)}
            initial={{ width: '20%' }}
            animate={{ width: `${Math.min(90, Math.max(18, 30 + Math.abs(delta) * 4))}%` }}
            transition={{ duration: 0.9, ease: motionTokens.ease.standard }}
          />
        </div>
      </div>
    </motion.div>
  )
}
