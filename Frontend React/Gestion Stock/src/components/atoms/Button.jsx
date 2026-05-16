import { motion } from 'framer-motion'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'

const variants = {
  primary:
    'bg-[var(--primary)] text-black border border-transparent hover:brightness-110',
  secondary:
    'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-2)]',
  ghost:
    'bg-transparent text-[var(--text)] border border-transparent hover:bg-[rgba(255,255,255,0.06)]',
  danger:
    'bg-[rgba(239,68,68,0.14)] text-[var(--text)] border border-[rgba(239,68,68,0.35)] hover:bg-[rgba(239,68,68,0.20)]',
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

export function Button({
  asChild = false,
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}) {
  const Comp = asChild ? motion.span : motion.button

  return (
    <Comp
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none',
        'transition-colors duration-200',
        'shadow-[0_0_0_0_rgba(0,0,0,0)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--primary-rgb)/0.7)]',
        'disabled:opacity-50 disabled:pointer-events-none',
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}
