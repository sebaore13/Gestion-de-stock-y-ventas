import { motion } from 'framer-motion'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'
import { Badge } from '../atoms/Badge'
import { PriceBlock } from '../atoms/PriceBlock'

export function ProductRow({ product, className }) {
  const low = product.stock <= product.min
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3',
        className,
      )}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 w-full sm:w-auto sm:flex-1">
        <div className="h-10 w-10 rounded-2xl border border-white/5 bg-white/4 grid place-items-center text-zinc-100 shrink-0">
          <span className="text-xs font-semibold">{product.name.slice(0, 2).toUpperCase()}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-w-0 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-100 truncate">{product.name}</div>
              <span className="pt-0.5 block text-xs font-mono text-zinc-400 truncate">{product.sku}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-0.5 sm:hidden">
              {low ? <Badge variant="danger">Bajo</Badge> : <Badge variant="success">OK</Badge>}
              <Badge variant={low ? 'danger' : 'neutral'}>{product.stock}</Badge>
            </div>
          </div>
          <div className="pt-0.5 text-xs text-[var(--muted)]">Min {product.min}</div>
        </div>
      </div>

      <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end">
        <PriceBlock value={product.price} align="center" className="shrink-0 sm:hidden" />

        <div className="hidden sm:flex items-end gap-3">
          <PriceBlock value={product.price} align="right" className="shrink-0" />
          <div className="flex items-center gap-2">
            {low ? <Badge variant="danger">Bajo</Badge> : <Badge variant="success">OK</Badge>}
            <Badge variant={low ? 'danger' : 'neutral'}>{product.stock}</Badge>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
