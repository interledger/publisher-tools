import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { app } from '../app.js'

const payloadSchema = z.union([
  z.object({
    name: z.literal('embed.click_link_banner'),
    url: z.string(),
    data: z.object({ link: z.string() }).optional(),
  }),
  z.object({
    name: z.literal('embed.click_link_offerwall'),
    url: z.string(),
    data: z.object({ link: z.string() }).optional(),
  }),
])

const eventSchema = z.object({
  type: z.literal('event'),
  payload: payloadSchema,
})

export type TrackFn = z.infer<typeof payloadSchema>

app.post(
  '/events',
  zValidator('json', eventSchema),
  async ({ req, env, body }) => {
    if (!env.UMAMI_HOST || !env.UMAMI_WEBSITE_ID || !env.UMAMI_HOSTNAME) {
      return body(null, 204)
    }

    const event = req.valid('json')

    const headers = new Headers({ 'content-type': 'application/json' })
    for (const h of ['user-agent', 'accept-language', 'referer']) {
      const v = req.header(h)
      if (v) headers.set(h, v)
    }
    const ip = req.header('cf-connecting-ip')
    if (ip) headers.set('x-forwarded-for', ip)

    try {
      await fetch(`${env.UMAMI_HOST}/api/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...event,
          payload: {
            ...event.payload,
            website: env.UMAMI_WEBSITE_ID,
            hostname: env.UMAMI_HOSTNAME,
          },
        }),
      })
    } catch (err) {
      console.error('umami forward failed', { name: event.payload.name }, err)
    }

    return body(null, 204)
  },
)
