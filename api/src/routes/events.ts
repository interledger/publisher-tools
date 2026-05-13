import z from 'zod'
import { UMAMI_HOST, UMAMI_WEBSITE_ID } from '@shared/defines'
import { app } from '../app.js'

const payloadSchema = z.object({
  /** Prefixed with `embed.` to separate from frontend events */
  name: z.string().startsWith('embed.'),
  /** Umami "page" path, e.g. `/embed/banner` (groups events per tool) */
  url: z.string(),
  data: z.looseObject({
    /** Publisher's domain from `window.location.hostname` (we can see which sites embed us) */
    hostname: z.string(),
  }),
})

const eventSchema = z.object({
  type: z.literal('event'),
  payload: payloadSchema,
})

export type TrackPayload = z.infer<typeof payloadSchema>

app.post('/events', async ({ req, body }) => {
  if (!UMAMI_HOST || !UMAMI_WEBSITE_ID) {
    return body(null, 204)
  }

  let event: z.infer<typeof eventSchema>
  try {
    event = z.parse(eventSchema, await req.json())
  } catch {
    return body(null, 400)
  }

  // https://docs.umami.is/docs/enable-cloudflare-headers
  const passthrough = [
    'user-agent',
    'accept-language',
    'referer',
    'cf-connecting-ip',
    'cf-ipcountry',
    'cf-ipcity',
    'cf-region',
    'cf-postal-code',
    'cf-continent',
    'cf-latitude',
    'cf-longitude',
    'cf-timezone',
  ]
  const headers = new Headers({ 'content-type': 'application/json' })
  for (const h of passthrough) {
    const v = req.header(h)
    if (v) headers.set(h, v)
  }

  try {
    await fetch(`${UMAMI_HOST}/api/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...event,
        payload: {
          ...event.payload,
          website: UMAMI_WEBSITE_ID,
        },
      }),
    })
  } catch (err) {
    console.error('umami forward failed', { name: event.payload.name }, err)
  }

  return body(null, 204)
})
