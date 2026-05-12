import z from 'zod'
import { UMAMI_API_HOST, UMAMI_WEBSITE_ID } from '@shared/defines'
import { app } from '../app.js'

const payloadSchema = z.object({
  name: z.string().startsWith('embed.'),
  url: z.string(),
  data: z.object({
    hostname: z.string(),
    link: z.string().optional(),
  }),
})

const eventSchema = z.object({
  type: z.literal('event'),
  payload: payloadSchema,
})

export type TrackPayload = z.infer<typeof payloadSchema>

app.post('/events', async ({ req, body }) => {
  let event: z.infer<typeof eventSchema>
  try {
    event = z.parse(eventSchema, await req.json())
  } catch {
    return body(null, 400)
  }

  if (!UMAMI_API_HOST || !UMAMI_WEBSITE_ID) {
    return body(null, 204)
  }

  const headers = new Headers({ 'content-type': 'application/json' })
  for (const h of ['user-agent', 'accept-language', 'referer']) {
    const v = req.header(h)
    if (v) headers.set(h, v)
  }
  const ip = req.header('cf-connecting-ip')
  if (ip) headers.set('x-forwarded-for', ip)

  try {
    await fetch(`${UMAMI_API_HOST}/api/send`, {
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
