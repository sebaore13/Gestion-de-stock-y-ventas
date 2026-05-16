import { motion } from 'framer-motion'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'
import { Badge } from '../atoms/Badge'

function moneyARS(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

export function ProductRow({ product, className }) {
  const low = product.stock <= product.min
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/3 px-4 py-3',
        className,
      )}
    >
      <div className="h-10 w-10 rounded-2xl border border-white/5 bg-white/4 grid place-items-center text-zinc-100">
        <span className="text-xs font-semibold">{product.name.slice(0, 2).toUpperCase()}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm font-semibold text-zinc-100 truncate">{product.name}</div>
          <span className="text-xs font-mono text-zinc-400">{product.sku}</span>
        </div>
        <div className="pt-0.5 text-xs text-[var(--muted)]">
          {moneyARS(product.price)} · Min {product.min}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {low ? <Badge variant="danger">Bajo</Badge> : <Badge variant="success">OK</Badge>}
        <Badge variant={low ? 'danger' : 'neutral'}>{product.stock}</Badge>
      </div>
    </motion.div>
  )
}
