import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import z from 'zod'
import type { D1Database } from '@cloudflare/workers-types'
import { app } from '../../app.js'
import { validate } from '../../utils/utils.js'

// Check if these details will be hashes or actual values
const schema = z.object({
  wa: z.string(),
  waId: z.string(),
  url: z.string(),
  site: z.string(),
})

export type PaywallCheckInput = z.infer<typeof schema>

export type PaywallCheckResult = {
  entitlement: 'no-access' | 'auth-required' | 'has-access'
}

const COOKIE_NAME = 'ilpaywall'

app.get('/paywall/check', validate('query', schema), async (c) => {
  const { req, header, json, env } = c
  const params = req.valid('query')
  const status = await checkAccess(
    params,
    env.PUBLISHER_TOOLS_DB,
    getCookie(c, COOKIE_NAME),
  )

  if (status.entitlement === 'no-access') {
    deleteCookie(c, COOKIE_NAME)
    return json(status, { status: 402 })
  }

  setCookie(c, COOKIE_NAME, 'TOKEN', {
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000,
    path: '/paywall',
  })
  header('Cache-Control', 'private, max-age=3600')
  return json(status)
})

async function checkAccess(
  params: PaywallCheckInput,
  db: D1Database,
  cookie?: string,
): Promise<PaywallCheckResult> {
  const dbHas = await checkDb(params)

  if (cookie) {
    // check the cookie has the valid JWT to allow access
    // validateCookie(cookie)
    const cookieHasWalletAddress = true
    if (cookieHasWalletAddress) {
      return { entitlement: 'auth-required' }
    }
  } else {
    return {
      entitlement: 'has-access',
    }
  }

  return { entitlement: 'no-access' }
}

async function checkDb(params: PaywallCheckInput) {
  // check if db has a row with either:
  //  - params.wa + params.url
  //  - params.waId + params.url
  return true
}
