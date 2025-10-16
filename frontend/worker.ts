import { APP_BASEPATH } from '~/lib/constants.js'
import { createRequestHandler } from 'react-router'
declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env
      ctx: ExecutionContext
    }
  }
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE
)

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)

      if (url.pathname === '/') {
        return Response.redirect(new URL(`${APP_BASEPATH}/`, request.url), 302)
      }

      return await requestHandler(request, {
        cloudflare: { env, ctx }
      })
    } catch (error) {
      const errorMessage = `Error: ${error instanceof Error ? error.message : String(error)}`
      return new Response(errorMessage, { status: 500 })
    }
  }
} satisfies ExportedHandler<Env>
