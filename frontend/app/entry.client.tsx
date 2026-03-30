/**
 * Client entry for React Router: hydrates server-rendered markup in the browser.
 * You can delete this file to use the framework default, or restore it with `npx react-router reveal`.
 * @see https://reactrouter.com/api/framework-conventions/entry.client.tsx
 */

import { startTransition, StrictMode } from 'react'
import { scan } from 'react-scan'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

if (process.env.NODE_ENV === 'development') {
  scan({
    enabled: false,
    trackUnnecessaryRenders: true,
    showToolbar: true,
    log: true,
  })
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  )
})
