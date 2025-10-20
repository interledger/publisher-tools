import { APP_BASEPATH } from '~/lib/constants.js'
import { createRequestHandler, type ServerBuild } from 'react-router'

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env
      ctx: ExecutionContext
    }
  }
}

const build =
  process.env.NODE_ENV === 'development'
    ? // @ts-ignore - virtual module only exists in dev
      () => import('virtual:react-router/server-build')
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

      return await requestHandler(request, {
        cloudflare: { env, ctx }
      })
    } catch (error) {
      const errorMessage = `Error: ${error instanceof Error ? error.message : String(error)}`
      return new Response(errorMessage, { status: 500 })
    }
  }
} satisfies ExportedHandler<Env>
