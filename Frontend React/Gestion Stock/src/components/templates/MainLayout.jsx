import { useState } from 'react'
import { cn } from '../../design/cn'
import { Sidebar } from '../organisms/Sidebar'
import { Topbar } from '../organisms/Topbar'

export function MainLayout({ brand, title, topbarRight, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-[auto_1fr]">
        <div className="hidden md:block">
          <Sidebar brand={brand} />
        </div>

        <div className="min-w-0 bg-zinc-900/40">
          <Topbar
            title={title}
            rightSlot={topbarRight}
            onOpenMenu={() => setMobileSidebarOpen(true)}
          />
          <main className={cn('max-w-[1200px] mx-auto px-5 md:px-8 py-7 md:py-9')}>{children}</main>
        </div>
      </div>

      <div className="md:hidden">
        <Sidebar
          brand={brand}
          variant="drawer"
          open={mobileSidebarOpen}
          onOpenChange={setMobileSidebarOpen}
        />
      </div>
    </div>
  )
}
