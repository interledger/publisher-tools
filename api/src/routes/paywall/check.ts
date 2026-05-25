import z from 'zod'
import { app } from '../../app'
import { hasPayment } from '../../utils/payments-db'
import { createHTTPException, validate } from '../../utils/utils'
import { refreshToken } from '../auth/utils'

const schema = z.object({
  url: z.url(),
  // Following can be obtained from Authorization header as well
  wa: z.url().optional(),
  $wa: z.url().optional(),
})
const paramsSchema = z.object({ site: z.hostname() })

export type PaywallCheckResult = {
  entitlement: 'no-access' | 'has-access' | 'auth-required' | 'pending'
  // Refreshed Authorization header, if a valid one was passed in request
  token?: string | null
}

app.get(
  '/paywall/check/:site',
  validate('param', paramsSchema),
  validate('query', schema),
  async ({ req, header, status, json, env }) => {
    const params = req.valid('query')
    const token = await getRefreshedToken()

    const walletAddress = token?.payload.sub || params.wa
    if (!walletAddress) {
      throw createHTTPException(400, 'Missing Authorization & query params', {})
    }
    const payer = {
      id: walletAddress,
      $url: token?.payload.waUrl || params.$wa || walletAddress,
    }

    const paymentStatus = await hasPayment(
      env.PUBLISHER_TOOLS_DB,
      params.url,
      payer,
    )

    const result: PaywallCheckResult = {
      entitlement: getEntitlement(paymentStatus, !!token),
      token: token?.jwt,
    }
    if (result.entitlement === 'has-access') {
      header('Cache-Control', 'private, max-age=3600')
    } else if (result.entitlement === 'no-access') {
      status(402)
    } else if (result.entitlement === 'auth-required') {
      status(401)
    } else if (result.entitlement === 'pending') {
      status(202)
    }
    return json(result)

    async function getRefreshedToken() {
      const authorizationHeader = req.header('Authorization')
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return null
      }
      const authToken = authorizationHeader.replace('Bearer ', '')
      const refreshedToken = await refreshToken(authToken, env.JWT_SECRET)
      if (!refreshedToken) {
        throw createHTTPException(401, 'Token expired or invalid', {})
      }

      const { payload, token: jwt } = refreshedToken
      if (
        (params.wa && payload.sub !== params.wa) ||
        (params.$wa && payload.waUrl && payload.waUrl !== params.$wa)
      ) {
        throw createHTTPException(401, 'Invalid token', {})
      }

      return { jwt, payload }
    }
  },
)

function getEntitlement(
  paymentStatus: Awaited<ReturnType<typeof hasPayment>>,
  hasToken: boolean,
): PaywallCheckResult['entitlement'] {
  if (!paymentStatus) return 'no-access'
  if (paymentStatus === 'created') return 'pending'
  return hasToken ? 'has-access' : 'auth-required'
}
