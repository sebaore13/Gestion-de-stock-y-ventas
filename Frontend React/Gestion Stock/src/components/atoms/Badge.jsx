import { cn } from '../../design/cn'

const styles = {
  info: 'border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.12)] text-[rgba(219,234,254,0.92)]',
  success: 'border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-[rgba(220,252,231,0.92)]',
  danger: 'border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] text-[rgba(254,226,226,0.92)]',
  neutral: 'border-[var(--border)] bg-[rgba(255,255,255,0.06)] text-[var(--text)]',
}

export function Badge({ variant = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
