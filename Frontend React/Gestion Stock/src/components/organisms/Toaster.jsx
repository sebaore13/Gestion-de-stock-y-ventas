import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(24,24,27,0.9)',
          border: '1px solid rgba(39,39,42,0.9)',
          color: '#fafafa',
        },
      }}
    />
  )
}
