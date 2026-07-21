import { createRequestHandler, RouterContextProvider } from 'react-router'
import { APP_BASEPATH } from '~/lib/constants.js'
import { cloudflareContext } from '~/lib/context.js'

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
)

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)

      if (url.pathname === '/') {
        return Response.redirect(new URL(`${APP_BASEPATH}/`, request.url), 302)
      }

      const routerContext = new RouterContextProvider()
      routerContext.set(cloudflareContext, { env, ctx })

      return await requestHandler(request, routerContext)
    } catch (error) {
      const errorMessage = `Error: ${error instanceof Error ? error.message : String(error)}`
      return new Response(errorMessage, { status: 500 })
    }
  },
} satisfies ExportedHandler<Env>
