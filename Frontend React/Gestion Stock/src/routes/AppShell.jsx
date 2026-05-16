import { Outlet, useLocation } from 'react-router-dom'
import { MainLayout } from '../components/templates/MainLayout'
import { titleForPath } from './titles'
import { Toaster } from '../components/organisms/Toaster'

export function AppShell() {
  const location = useLocation()

  return (
    <>
      <MainLayout brand="OreStock" title={titleForPath(location.pathname)}>
        <Outlet />
      </MainLayout>
      <Toaster />
    </>
  )
}
