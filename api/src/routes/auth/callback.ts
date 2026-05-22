import z from 'zod'
import { isFinalizedGrantWithAccessToken } from '@interledger/open-payments'
import { urlWithParams } from '@shared/utils'
import { createToken, getGrant } from './utils'
import { app, type Env } from '../../app'
import { OpenPaymentsService } from '../../utils/open-payments'
import { validate } from '../../utils/utils'

const BaseSchema = z.object({ next: z.url(), requestId: z.uuidv4() })
const SuccessSchema = BaseSchema.extend({
  hash: z.string().min(1, 'Hash is required'),
  interact_ref: z.string().min(1, 'Interact reference is required'),
})
const RejectedSchema = BaseSchema.extend({
  result: z.literal('grant_rejected'),
})
const schema = z.union([SuccessSchema, RejectedSchema])

app.get(
  '/auth/callback',
  validate('query', schema),
  async ({ req, redirect, env }) => {
    const params = req.valid('query')
    const { next, requestId } = params

    if ('result' in params && params.result === 'grant_rejected') {
      return redirect(
        urlWithParams(next, { auth_failed: 'CANCELED' satisfies ErrCode }),
      )
    }
    if (!('hash' in params)) {
      // Won't happen, but TypeScript is crying
      return redirect(
        urlWithParams(next, { auth_failed: 'NO_HASH' satisfies ErrCode }),
      )
    }

    let walletAddress
    try {
      walletAddress = await completeGrant(env, requestId, params)
    } catch (err) {
      const { code } = err as Err
      return redirect(urlWithParams(next, { auth_failed: code }))
    }

    const token = await createToken(walletAddress, env.JWT_SECRET)
    return redirect(urlWithParams(next, { token }))
  },
)

async function completeGrant(
  env: Env,
  requestId: string,
  params: z.infer<typeof SuccessSchema>,
) {
  const data = await getGrant(env.PUBLISHER_TOOLS_KV, requestId)
  if (!data) {
    if (!data) {
      throw new Err('NO_TMP_DATA')
    }
  }
  const op = await OpenPaymentsService.getClient(env)

  // TODO: validate hash, nonce
  const grant = await op.grant
    .continue(
      {
        url: data.grantContinuation.uri,
        accessToken: data.grantContinuation.access_token.value,
      },
      { interact_ref: params.interact_ref },
    )
    .catch((error) => {
      console.error(error)
      throw new Err('GRANT_CONTINUE_FAILED', { cause: error })
    })

  if (!isFinalizedGrantWithAccessToken(grant)) {
    throw new Err('UNEXPECTED_GRANT_STATE')
  }

  void op.grant
    .cancel({
      url: grant.access_token.manage,
      accessToken: grant.access_token.value,
    })
    .catch(() => {})

  return data.walletAddress
}

type ErrCode =
  | 'NO_TMP_DATA'
  | 'GRANT_CONTINUE_FAILED'
  | 'UNEXPECTED_GRANT_STATE'
  | 'NO_HASH'
  | 'CANCELED'

class Err extends Error {
  public readonly code: ErrCode
  constructor(message: ErrCode, params?: Pick<Error, 'cause'>) {
    super(message, params)
    this.code = message
  }
}
