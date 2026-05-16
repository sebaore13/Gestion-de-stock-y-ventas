import { cn } from '../../design/cn'

export function Title({ as: Tag = 'h1', className, children, ...props }) {
  return (
    <Tag
      className={cn(
        'tracking-tight text-[var(--text)]',
        Tag === 'h1' ? 'text-2xl font-semibold' : 'text-lg font-semibold',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function Subtle({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-[var(--muted)]', className)} {...props}>
      {children}
    </p>
  )
}
