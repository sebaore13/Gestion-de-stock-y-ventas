import { motion } from 'framer-motion'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'

const colorStyles = {
  red: 'border-l-[rgba(239,68,68,0.5)]',
  green: 'border-l-[rgba(34,197,94,0.5)]',
  blue: 'border-l-[rgba(59,130,246,0.5)]',
  orange: 'border-l-[rgb(var(--primary-rgb)/0.5)]',
}

export function StatCard({ title, value, icon: Icon, color = 'orange', className }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[rgba(24,24,27,0.75)] backdrop-blur',
        'shadow-[0_18px_50px_rgba(0,0,0,0.22)] px-5 pt-5 pb-5 border-l-4',
        colorStyles[color] || colorStyles.orange,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{title}</div>
          <div className="pt-2 text-2xl font-semibold text-[var(--text)]">{value}</div>
        </div>
        {Icon ? (
          <div className="h-10 w-10 rounded-2xl border border-white/5 bg-white/4 grid place-items-center text-zinc-100 shrink-0">
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
