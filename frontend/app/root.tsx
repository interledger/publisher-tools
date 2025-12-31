import type { ReactNode } from 'react'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
  type LinksFunction,
  type MetaFunction
} from 'react-router'
import { Header, Footer } from '@/components'
import faviconSvg from '~/assets/images/favicon.svg?url'
import { UIProvider } from '~/stores/uiStore'
import stylesheet from '~/tailwind.css?url'
import { XCircle } from './components/icons.js'
import { Button } from './components/index.js'

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-screen bg-interface-bg-main flex flex-col">
        <UIProvider>
          <Header />
          <main className="flex-grow flex flex-col">
            <Outlet />
          </main>
          <Footer />
        </UIProvider>
        <ScrollRestoration />
        <Scripts crossOrigin="" />
      </body>
    </html>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorPage>
        <div className="flex items-center justify-center flex-col bg-white p-10 rounded-md-old shadow-md space-y-2">
          <h4 className="font-semibold text-xl -tracking-widest text-[#F37F64]">
            {error.status}
          </h4>
          <h2 className="text-xl">{error.statusText}</h2>
          <Button to="/" aria-label="go to homepage">
            Go to homepage
          </Button>
        </div>
      </ErrorPage>
    )
  }

  let errorMessage = 'Unknown error'
  if (error instanceof Error) {
    errorMessage = error.message
  }

  return (
    <ErrorPage>
      <div className="flex items-center justify-center flex-col bg-white p-10 rounded-md-old shadow-md space-y-5">
        <div className="grid place-items-center">
          <XCircle className="w-10 h-10 text-red-500" />
          <p className="text-lg font-semibold">
            There was an issue with your request.
          </p>
        </div>
        <div>
          <span className="font-light">Cause:</span> <span>{errorMessage}</span>
        </div>
        <Button to={'/'} aria-label="go to homepage">
          Go to homepage
        </Button>
      </div>
    </ErrorPage>
  )
}

const ErrorPage = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full text-tealish">
        <div className="min-h-full">
          <div className="flex pt-20 md:pt-0 flex-1 flex-col">
            <main className="grid min-h-screen place-items-center">
              {children}
            </main>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export const meta: MetaFunction = () => [
  { title: 'Publisher Tools' },
  { charset: 'utf-8' },
  { name: 'viewport', content: 'width=device-width,initial-scale=1' }
]

export const links: LinksFunction = () => [
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: faviconSvg
  },
  {
    rel: 'icon',
    href: faviconSvg,
    type: 'image/svg+xml'
  },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  { rel: 'stylesheet', href: stylesheet }
]
