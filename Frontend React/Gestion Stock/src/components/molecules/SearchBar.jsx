import { Search } from 'lucide-react'
import { cn } from '../../design/cn'

export function SearchBar({ className, ...props }) {
  return (
    <label
      className={cn(
        'group flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[rgba(24,24,27,0.75)] backdrop-blur',
        'px-3 h-11',
        'focus-within:border-[rgba(249,115,22,0.55)] focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.14)]',
        className,
      )}
    >
      <Search size={16} className="text-[var(--muted)]" />
      <input
        className={cn(
          'w-full bg-transparent border-0 outline-none text-[var(--text)] placeholder:text-[rgba(161,161,170,0.85)]',
          'text-sm',
        )}
        type="search"
        {...props}
      />
      <span className="hidden sm:inline text-[10px] uppercase tracking-[0.18em] text-zinc-500 border border-zinc-800 rounded-lg px-2 py-1">
        Ctrl K
      </span>
    </label>
  )
}
