import { data, type ActionFunctionArgs } from 'react-router'
import z from 'zod'
import { AWS_PREFIX } from '@shared/defines'
import {
  type ConfigVersions,
  PROFILE_IDS,
  type Configuration,
  TOOL_BANNER,
  TOOL_WIDGET,
} from '@shared/types'
import { getWalletAddress, normalizeWalletAddress } from '@shared/utils'
import { APP_BASEPATH } from '~/lib/constants.js'
import type { SaveResult } from '~/lib/types'
import { ConfigStorageService } from '~/utils/config-storage.server.js'
import { createInteractiveGrant } from '~/utils/open-payments.server.js'
import { convertToConfiguration } from '~/utils/profile-converter'
import { sanitizeConfigFields as sanitizeProfileFields } from '~/utils/sanitize.server'
import { commitSession, getSession } from '~/utils/session.server.js'
import { walletSchema } from '~/utils/validate.server'
import {
  BannerProfileSchema,
  WidgetProfileSchema,
} from '~/utils/validate.shared'

const BaseApiSchema = z.object({
  ...walletSchema.shape,
  profileId: z.enum(PROFILE_IDS),
})

const ApiSaveProfileSchema = z.discriminatedUnion('tool', [
  BaseApiSchema.extend({
    tool: z.literal(TOOL_BANNER),
    profile: BannerProfileSchema,
  }),
  BaseApiSchema.extend({
    tool: z.literal(TOOL_WIDGET),
    profile: WidgetProfileSchema,
  }),
])

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data<SaveResult>(
      { error: { message: 'Method not allowed' } },
      { status: 405 },
    )
  }

  const { env } = context.cloudflare
  const url = new URL(request.url)

  try {
    const body = await request.json()
    const parsed = await ApiSaveProfileSchema.safeParseAsync(body)
    if (!parsed.success) {
      return data<SaveResult>(
        {
          error: {
            message: 'Validation failed',
            cause: {
              message: 'One or more fields failed validation',
              errors: { field: z.prettifyError(parsed.error) },
            },
          },
        },
        { status: 400 },
      )
    }

    const { walletAddress, profileId, tool, profile } = parsed.data
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
        redirectUrl,
      })
      session.set('payment-grant', grant)
      session.set('wallet-address', walletAddressData)

      return data<SaveResult>(
        { grantRedirect: grant.interact.redirect, success: false },
        {
          status: 200,
          headers: { 'Set-Cookie': await commitSession(session) },
        },
      )
    }

    const walletAddressId = normalizeWalletAddress(walletAddressData)
    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })
    const now = new Date().toISOString()

    let config: Configuration | null = null
    try {
      config = await storage.getJson<Configuration>(walletAddressId)
    } catch (e) {
      const err = e as Error
      if (err.name !== 'NoSuchKey' && !err.message.includes('404')) {
        throw e
      }

      try {
        // TODO: to be removed after the completion of versioned config migration
        const legacy =
          await storage.getLegacyJson<ConfigVersions>(walletAddressId)
        config = convertToConfiguration(legacy, tool, walletAddressId)
      } catch (e) {
        const err = e as Error
        if (err.name !== 'NoSuchKey' && !err.message.includes('404')) {
          throw e
        }

        config = {
          $walletAddress: walletAddress,
          $walletAddressId: walletAddressId,
          $createdAt: now,
          $modifiedAt: now,
        }
      }
    }

    await storage.putJson<Configuration>(walletAddressId, {
      ...config,
      $modifiedAt: now,
      [tool]: {
        ...config?.[tool],
        [profileId]: {
          ...sanitizedProfile,
          $modifiedAt: now,
        },
      },
    })

    return data<SaveResult>(
      { success: true },
      {
        status: 200,
        headers: { 'Set-Cookie': await commitSession(session) },
      },
    )
  } catch (error) {
    console.error('Save profile error: ', error)
    return data<SaveResult>(
      {
        error: {
          message: `Failed to save profile: ${(error as Error).message}`,
        },
      },
      { status: 500 },
    )
  }
}
