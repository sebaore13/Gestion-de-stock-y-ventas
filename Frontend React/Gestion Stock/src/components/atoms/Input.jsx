import { cn } from '../../design/cn'

export function Input({ className, start, end, ...props }) {
  return (
    <label
      className={cn(
        'group flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]',
        'px-3 h-11',
        'focus-within:border-[rgba(249,115,22,0.55)] focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.14)]',
        className,
      )}
    >
      {start ? <span className="text-[var(--muted)]">{start}</span> : null}
      <input
        className={cn(
          'w-full bg-transparent border-0 outline-none text-[var(--text)] placeholder:text-[rgba(161,161,170,0.85)]',
          'text-sm',
        )}
        {...props}
      />
      {end ? <span className="text-[var(--muted)]">{end}</span> : null}
    </label>
  )
}
