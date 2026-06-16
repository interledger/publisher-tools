/**
 * Client entry for React Router: hydrates server-rendered markup in the browser.
 * You can delete this file to use the framework default, or restore it with `npx react-router reveal`.
 * @see https://reactrouter.com/api/framework-conventions/entry.client.tsx
 */

import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  )
})
