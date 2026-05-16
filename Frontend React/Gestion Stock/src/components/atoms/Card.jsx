import { cn } from '../../design/cn'

export function Card({ className, children, ...props }) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[rgba(24,24,27,0.75)] backdrop-blur',
        'shadow-[0_18px_50px_rgba(0,0,0,0.25)]',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export function CardHeader({ className, children }) {
  return (
    <header className={cn('px-5 pt-5 pb-3 flex items-start justify-between gap-4', className)}>
      {children}
    </header>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>
}
