import { Outlet } from 'react-router'
import { Header, Footer } from '@/components'
import { I18nProvider } from '~/i18n/context'
import { UIProvider } from '~/stores/uiStore'

export default function MainLayout() {
  return (
    <I18nProvider>
      <UIProvider>
        <Header />
        <main className="flex-grow flex flex-col">
          <Outlet />
        </main>
        <Footer />
      </UIProvider>
    </I18nProvider>
  )
}
