import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../design/cn'
import { motionTokens } from '../../design/motion'

export function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
            className="fixed inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 grid place-items-center p-4"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.standard }}
          >
            <div
              className={cn(
                'w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[rgba(24,24,27,0.88)] backdrop-blur',
                'shadow-[0_30px_90px_rgba(0,0,0,0.55)]',
              )}
            >
              <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
                <div className="text-base font-semibold">{title}</div>
              </div>
              <div className="px-5 py-5">{children}</div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
