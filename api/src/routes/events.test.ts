import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { app } from '../app.js'
import './events.js'

vi.mock('@shared/defines', () => ({
  UMAMI_HOST: 'http://umami.test',
  UMAMI_WEBSITE_ID: 'test-website-id',
}))

describe('POST /events', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('forwards a valid event to Umami and returns 204', async () => {
    const res = await app.request('/events', {
      method: 'POST',
      body: JSON.stringify({
        type: 'event',
        payload: {
          name: 'embed.banner.click_extension_link',
          url: '/embed/banner',
          data: {
            hostname: 'example.com',
            link: 'https://example.com/install',
          },
        },
      }),
    })

    expect(res.status).toBe(204)
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://umami.test/api/send')
    const forwarded = JSON.parse(init.body as string)
    expect(forwarded.payload).toMatchObject({
      website: 'test-website-id',
      name: 'embed.banner.click_extension_link',
      data: { hostname: 'example.com', link: 'https://example.com/install' },
    })
  })

  it('rejects an event name without the embed. prefix with 400', async () => {
    const res = await app.request('/events', {
      method: 'POST',
      body: JSON.stringify({
        type: 'event',
        payload: {
          name: 'click_extension_link',
          url: '/embed/banner',
          data: { hostname: 'example.com' },
        },
      }),
    })

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON with 400', async () => {
    const res = await app.request('/events', {
      method: 'POST',
      body: 'not json',
    })

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
