/**
 * Client entry for React Router: hydrates server-rendered markup in the browser.
 * You can delete this file to use the framework default, or restore it with `npx react-router reveal`.
 * @see https://reactrouter.com/api/framework-conventions/entry.client.tsx
 */

import { startTransition, StrictMode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'
import i18next from '~/i18n/i18n.client.js'

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <I18nextProvider i18n={i18next}>
        <HydratedRouter />
      </I18nextProvider>
    </StrictMode>,
  )
})
