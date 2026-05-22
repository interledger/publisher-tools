import z from 'zod'
import {
  isPendingGrant,
  type AuthenticatedClient,
  type WalletAddress,
} from '@interledger/open-payments'
import { urlWithParams } from '@shared/utils'
import { saveGrant } from './utils'
import { app } from '../../app'
import { WalletAddressSchema } from '../../schemas/payment'
import { OpenPaymentsService } from '../../utils/open-payments'
import { validate } from '../../utils/utils'

const schema = z.object({
  walletAddress: WalletAddressSchema,
  next: z.url(),
})

app.post('/auth', validate('json', schema), async ({ req, json, env }) => {
  const { walletAddress, next } = req.valid('json')
  const requestId = crypto.randomUUID()

  const op = await OpenPaymentsService.getClient(env)
  const nonce = crypto.randomUUID()
  const grant = await createGrant(op, {
    walletAddress,
    redirectUrl: urlWithParams(new URL('/auth/callback', req.url), {
      next,
      requestId,
    }).href,
    nonce,
  })
  await saveGrant(env.PUBLISHER_TOOLS_KV, requestId, {
    grantContinuation: grant.continue,
    nonce,
    walletAddress,
  })
  return json(grant)
})

async function createGrant(
  client: AuthenticatedClient,
  params: CreateGrantParams,
) {
  const { walletAddress, redirectUrl, nonce } = params
  const grant = await client.grant.request(
    { url: walletAddress.authServer },
    {
      // Added temporarily until wallets fix `subject` fields.
      // Using `outgoing-payload` read-all access as that's interactive and
      // doesn't confuse user by asking for money (`limits`).
      access_token: {
        access: [
          {
            identifier: walletAddress.id,
            type: 'outgoing-payment',
            actions: ['read-all'],
          },
        ],
      },
      subject: {
        sub_ids: [{ id: walletAddress.id, format: 'uri' }],
      },
      interact: {
        start: ['redirect'],
        finish: { method: 'redirect', uri: redirectUrl, nonce },
      },
    },
  )
  if (!isPendingGrant(grant)) {
    throw new Error('Unexpected: expected a pending grant')
  }
  return grant
}

type CreateGrantParams = {
  walletAddress: WalletAddress
  redirectUrl: string
  nonce: string
}
