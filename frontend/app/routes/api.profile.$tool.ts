import { data, type ActionFunctionArgs } from 'react-router'
import z from 'zod'
import { AWS_PREFIX } from '@shared/defines'
import {
  PROFILE_IDS,
  TOOLS,
  type Configuration,
  type Tool
} from '@shared/types'
import { getWalletAddress, normalizeWalletAddress } from '@shared/utils'
import { APP_BASEPATH } from '~/lib/constants.js'
import { ConfigStorageService } from '~/utils/config-storage.server.js'
import { createInteractiveGrant } from '~/utils/open-payments.server.js'
import { sanitizeConfigFields as sanitizeProfileFields } from '~/utils/sanitize.server'
import { commitSession, getSession } from '~/utils/session.server.js'
import { walletSchema } from '~/utils/validate.server'
import {
  BannerProfileSchema,
  WidgetProfileSchema
} from '~/utils/validate.shared'

const ApiSaveProfileSchema = z.object({
  ...walletSchema.shape,
  profile: z.union([BannerProfileSchema, WidgetProfileSchema]),
  profileId: z.enum(PROFILE_IDS)
})

function isToolType(tool?: string): tool is Tool {
  return !!tool && TOOLS.includes(tool as Tool)
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  const { env } = context.cloudflare
  const url = new URL(request.url)

  try {
    const { tool } = params
    if (!isToolType(tool)) {
      return data(
        {
          error: `Invalid tool. Must be one of: ${TOOLS.join(', ')}`
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = await ApiSaveProfileSchema.safeParseAsync(body)
    if (!parsed.success) {
      return data(
        {
          error: 'Validation failed',
          cause: { err: z.prettifyError(parsed.error) }
        },
        { status: 400 }
      )
    }

    const { walletAddress, profile, profileId } = parsed.data
    const sanitizedProfile = sanitizeProfileFields(profile)

    // TODO: use walletAddress from walletSchema after updating it to .transform()
    const walletAddressData = await getWalletAddress(walletAddress)
    const session = await getSession(request.headers.get('Cookie'))
    const validForWallet = session.get('validForWallet')

    if (!validForWallet || validForWallet !== walletAddressData.id) {
      const baseUrl = url.origin + APP_BASEPATH
      //TODO: use `${tool}` not hardcoded 'banner-two' after versioning update
      const redirectUrl = `${baseUrl}/api/grant/banner-two/`

      const grant = await createInteractiveGrant(env, {
        walletAddress: walletAddressData,
        redirectUrl
      })
      session.set('payment-grant', grant)
      session.set('wallet-address', walletAddressData)

      return data(
        { grantRedirect: grant.interact.redirect, success: false },
        { status: 200, headers: { 'Set-Cookie': await commitSession(session) } }
      )
    }

    const walletAddressId = normalizeWalletAddress(walletAddressData)
    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })

    let config: Configuration | null = null
    try {
      config = await storage.getJson<Configuration>(walletAddressId)
    } catch (e) {
      const err = e as Error
      if (err.name !== 'NoSuchKey' && !err.message.includes('404')) {
        throw e
      }

      config = {
        $walletAddress: walletAddress,
        $walletAddressId: walletAddressId,
        $modifiedAt: new Date().toISOString()
      }
    }

    await storage.putJson(walletAddressId, {
      ...config,
      [tool]: {
        ...config?.[tool],
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
