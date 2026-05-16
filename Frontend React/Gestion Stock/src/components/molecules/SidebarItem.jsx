import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'

export function SidebarItem({ icon: Icon, label, to, collapsed, end }) {
  return (
    <NavLink to={to} end={end} className="block">
      {({ isActive }) => (
        <motion.div
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
          className={cn(
            'w-full text-left rounded-2xl px-3 h-11 flex items-center gap-3',
            'border transition',
            collapsed ? 'justify-center px-0' : '',
            isActive
              ? 'bg-[rgb(var(--primary-rgb)/0.10)] border-[rgb(var(--primary-rgb)/0.22)]'
              : 'border-transparent hover:bg-white/5 hover:border-white/5',
          )}
        >
          <div
            className={cn(
              'h-9 w-9 rounded-xl grid place-items-center',
              isActive
                ? 'bg-[rgb(var(--primary-rgb)/0.18)] text-[var(--primary)]'
                : 'bg-white/5 text-zinc-200',
            )}
          >
            <Icon size={20} />
          </div>

          {collapsed ? null : <div className="text-sm font-medium text-zinc-100">{label}</div>}
        </motion.div>
      )}
    </NavLink>
  )
}
