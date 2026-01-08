import { data, type ActionFunctionArgs } from 'react-router'
import z from 'zod'
import { AWS_PREFIX } from '@shared/defines'
import { type Configuration, PROFILE_IDS } from '@shared/types'
import { getWalletAddress, normalizeWalletAddress } from '@shared/utils'
import { APP_BASEPATH } from '~/lib/constants.js'
import { ConfigStorageService } from '~/utils/config-storage.server.js'
import { createInteractiveGrant } from '~/utils/open-payments.server.js'
import { sanitizeConfigFields as sanitizeProfileFields } from '~/utils/sanitize.server'
import { commitSession, getSession } from '~/utils/session.server.js'
import { walletSchema } from '~/utils/validate.server'
import { BannerProfileSchema } from '~/utils/validate.shared'

const QueryParamsSchema = z.object({
  ...walletSchema.shape,
  profileId: z.enum(PROFILE_IDS)
})

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  const { env } = context.cloudflare
  const url = new URL(request.url)

  // TODO: after versioning refactor update; (avoid double getWalletAddress call) see walletSchema
  const queryParams = await QueryParamsSchema.safeParseAsync({
    walletAddress: url.searchParams.get('walletAddress'),
    profileId: url.searchParams.get('profileId')
  })

  if (!queryParams.success) {
    return data(
      {
        error: 'Invalid query params',
        cause: { err: z.prettifyError(queryParams.error) }
      },
      { status: 400 }
    )
  }

  const { walletAddress, profileId } = queryParams.data

  try {
    const body = await request.json()
    const parsed = BannerProfileSchema.safeParse(body)
    if (!parsed.success) {
      return data(
        {
          error: 'Validation failed',
          cause: { err: z.prettifyError(parsed.error) }
        },
        { status: 400 }
      )
    }

    const sanitizedProfile = sanitizeProfileFields(parsed.data)
    const walletAddressData = await getWalletAddress(walletAddress)

    const session = await getSession(request.headers.get('Cookie'))
    const validForWallet = session.get('validForWallet')

    if (!validForWallet || validForWallet !== walletAddressData.id) {
      const baseUrl = url.origin + APP_BASEPATH
      const grant = await createInteractiveGrant(env, {
        walletAddress: walletAddressData,
        redirectUrl: `${baseUrl}/api/grant/banner-two/`
      })
      session.set('payment-grant', grant)

      return data(
        { grantRequired: grant.interact.redirect, success: false },
        { status: 200, headers: { 'Set-Cookie': await commitSession(session) } }
      )
    }

    session.set('wallet-address', walletAddressData)

    const walletAddressId = normalizeWalletAddress(walletAddressData)
    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })
    let config: Configuration = {
      $walletAddress: walletAddress,
      $walletAddressId: walletAddressId,
      $modifiedAt: new Date().toISOString()
    }

    try {
      config = await storage.getJson<Configuration>(walletAddressId)
    } catch (e) {
      const err = e as Error
      if (err.name !== 'NoSuchKey' && !err.message.includes('404')) {
        throw e
      }
    }

    await storage.putJson(walletAddressId, {
      ...config,
      banner: {
        ...config.banner,
        [profileId]: {
          ...sanitizedProfile,
          $modifiedAt: new Date().toISOString()
        }
      }
    })

    return data(
      { success: true },
      {
        status: 200,
        headers: { 'Set-Cookie': await commitSession(session) }
      }
    )
  } catch (error) {
    console.error('Save profile error: ', error)
    return data(
      { error: `Failed to save profile: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
