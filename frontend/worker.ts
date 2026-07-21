import {
  createRequestHandler,
  RouterContextProvider,
  type ServerBuild,
} from 'react-router'
import { APP_BASEPATH } from '~/lib/constants.js'
import { cloudflareContext } from '~/lib/context.js'

const build =
  process.env.NODE_ENV === 'development'
    ? () => import('virtual:react-router/server-build')
    : // @ts-expect-error - build artifact created during build process
      () => import('./build/server/index.js')

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)

      if (url.pathname === '/') {
        return Response.redirect(new URL(`${APP_BASEPATH}/`, request.url), 302)
      }
      const serverBuild = await build()
      const requestHandler = createRequestHandler(serverBuild as ServerBuild)

      const routerContext = new RouterContextProvider()
      routerContext.set(cloudflareContext, { env, ctx })

      return await requestHandler(request, routerContext)
    } catch (error) {
      const errorMessage = `Error: ${error instanceof Error ? error.message : String(error)}`
      return new Response(errorMessage, { status: 500 })
    }
  },
} satisfies ExportedHandler<Env>
