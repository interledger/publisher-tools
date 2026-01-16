export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === 'PUT') {
      return handlePut(request, env)
    }

    const { pathname } = new URL(request.url)
    if (request.method === 'GET' && pathname === '/') {
      const keys = await env.STORAGE.list({
        include: ['customMetadata', 'httpMetadata'],
      })
      return Response.json(
        keys.objects.sort(
          (k1, k2) => k2.uploaded.valueOf() - k1.uploaded.valueOf(),
        ),
      )
    }

    const key = pathname.slice(1)
    const res = await env.STORAGE.get(key)
    if (!res) {
      return new Response('Not Found', { status: 404 })
    }
    return new Response(res.body, {
      headers: Object.fromEntries(
        Object.entries(res.httpMetadata || {}).map(([k, v]) => [
          k.replace(/([A-Z])/g, '-$1').toLowerCase(),
          v,
        ]),
      ),
    })
  },
} satisfies ExportedHandler<Env>

async function handlePut(request: Request, env: Env) {
  const { pathname } = new URL(request.url)
  const key = pathname.slice(1)

  const res = await env.STORAGE.put(key, request.body, {
    httpMetadata: request.headers,
    customMetadata: Object.fromEntries(
      [...request.headers]
        .filter(([k]) => k.startsWith('x-amz-meta-'))
        .map(([k, v]) => [k.replace('x-amz-meta-', ''), v]),
    ),
  })
  return Response.json(res)
}
