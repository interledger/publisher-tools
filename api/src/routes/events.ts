import z from 'zod'
import { app } from '../app.js'

const eventSchema = z.object({
  name: z.enum(['click_link_banner', 'click_link_offerwall']),
})

const HOSTNAME = 'localhost' // replace with Umami site domain for staging/prod

app.post('/events', async ({ req, env, body }) => {
  let event
  try {
    event = eventSchema.parse(JSON.parse(await req.text()))
  } catch {
    return body(null, 400)
  }

  try {
    await fetch(`${env.UMAMI_HOST}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': req.header('user-agent') ?? '',
        'X-Forwarded-For': req.header('cf-connecting-ip') ?? '', // do we need this?
      },
      body: JSON.stringify({
        type: 'event',
        payload: {
          website: env.UMAMI_WEBSITE_ID,
          hostname: HOSTNAME,
          url: '/',
          name: event.name,
        },
      }),
    })
  } catch (err) {
    console.error('umami forward failed', err)
  }

  return body(null, 204)
})
