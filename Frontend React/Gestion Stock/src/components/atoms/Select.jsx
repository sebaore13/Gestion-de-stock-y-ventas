import { cn } from '../../design/cn'

export function Select({ className, ...props }) {
  return (
    <select
      className={cn(
        'h-11 rounded-2xl border border-[var(--border)] bg-[rgba(24,24,27,0.75)] backdrop-blur',
        'px-3 text-sm text-[var(--text)]',
        'focus:outline-none focus:border-[rgb(var(--primary-rgb)/0.55)] focus:shadow-[0_0_0_3px_rgb(var(--primary-rgb)/0.14)]',
        className,
      )}
      {...props}
    />
  )
}
