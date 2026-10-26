import { RouterContextProvider } from 'react-router'
import { describe, it, expect } from 'vitest'
import { i18nextMiddleware } from '~/i18n/i18n.server.js'
import {
  loader as grantLoader,
  meta as grantMeta,
} from './grant-interaction.js'

function createArgs(request: Request, context: RouterContextProvider) {
  const url = new URL(request.url)
  return {
    request,
    context,
    params: {},
    url,
    pattern: url.pathname,
  }
}

describe('route metadata localization in grant-interaction', () => {
  it.each([
    {
      result: 'success',
      title: 'Payment Complete',
      description: 'Your payment has been processed successfully.',
    },
    {
      result: 'failure',
      title: 'Payment not authorized',
      description: 'The payment was declined or could not be completed.',
    },
    {
      result: undefined,
      title: 'Grant Interaction',
      description: 'Grant interaction result',
    },
  ])(
    'translates meta for result=$result via loader',
    async ({ result, title, description }) => {
      const context = new RouterContextProvider()
      const url = result
        ? `https://publisher-tools.test/grant-interaction?result=${result}`
        : 'https://publisher-tools.test/grant-interaction'
      const request = new Request(url)
      const args = createArgs(request, context)

      await i18nextMiddleware(args, async () => {
        const loaderData = await grantLoader(args)
        expect(loaderData.meta.title).toBe(title)
        expect(loaderData.meta.description).toBe(description)

        const metaArgs = {
          loaderData,
          location: new URL(request.url),
          matches: [],
          params: {},
        } as unknown as Parameters<typeof grantMeta>[0]

        const metaTags = grantMeta(metaArgs)
        expect(metaTags).toEqual([
          { title },
          { name: 'description', content: description },
        ])
        return new Response('ok')
      })
    },
  )
})
