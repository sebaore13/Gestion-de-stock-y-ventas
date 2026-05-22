import { cn } from '../../design/cn'
import { moneyCLP } from '../../design/format'

export function PriceBlock({ value, label = 'Precio', align = 'right', className }) {
  const alignClass = align === 'left'
    ? 'items-start text-left'
    : align === 'center'
      ? 'items-center text-center'
      : 'items-end text-right'
  return (
    <div className={cn('flex flex-col gap-0.5', alignClass, className)}>
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
      <div className="text-base sm:text-lg font-semibold leading-none text-zinc-100">{moneyCLP(value)}</div>
    </div>
  )
}
