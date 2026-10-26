import { Outlet } from 'react-router'
import { Header, Footer } from '@/components'
import { UIProvider } from '~/stores/uiStore'

export default function MainLayout() {
  return (
    <UIProvider>
      <Header />
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </UIProvider>
  )
}
