/**
 * Server entry for React Router
 * You can delete this file to use the framework default, or restore it with `npx react-router reveal`.
 * @see https://reactrouter.com/api/framework-conventions/entry.server.tsx
 */

import { I18nextProvider } from 'react-i18next'
import {
  ServerRouter,
  type EntryContext,
  type RouterContextProvider,
} from 'react-router'
import { isbot } from 'isbot'
import { renderToReadableStream } from 'react-dom/server'
import { getInstance } from '~/i18n/i18n.server.js'

export const streamTimeout = 5000

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  loadContext: RouterContextProvider,
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), streamTimeout)
  const i18n = getInstance(loadContext)

  const body = await renderToReadableStream(
    <I18nextProvider i18n={i18n}>
      <ServerRouter context={reactRouterContext} url={request.url} />
    </I18nextProvider>,
    {
      signal: controller.signal,
      onError(error: unknown) {
        if (!controller.signal.aborted) {
          // Log streaming rendering errors from inside the shell
          console.error(error)
        }
        responseStatusCode = 500
      },
    },
  )

  body.allReady.then(() => clearTimeout(timeoutId))

  if (isbot(request.headers.get('user-agent') || '')) {
    await body.allReady
  }

  responseHeaders.set('Content-Type', 'text/html')
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
