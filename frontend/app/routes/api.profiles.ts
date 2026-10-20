import { data } from 'react-router'
import z from 'zod'
import {
  ConfigStorageService,
  ConfigStorageServiceError,
  isConfigStorageNotFoundError,
} from '@shared/config-storage-service'
import { AWS_PREFIX } from '@shared/defines'
import type { Configuration, Tool } from '@shared/types'
import { TOOLS } from '@shared/types'
import { getWalletAddress, normalizeWalletAddress } from '@shared/utils'
import { getInstance, getLocale } from '~/i18n/i18n.server.js'
import { cloudflareContext } from '~/lib/context.js'
import { INVALID_PAYLOAD_ERROR } from '~/lib/helpers'
import type { GetProfilesResult } from '~/lib/types'
import type { TranslateWalletError } from '~/lib/walletError'
import { createWalletSchema } from '~/utils/validate.server'
import type { Route } from './+types/api.profiles'

export async function loader({ request, context }: Route.LoaderArgs) {
  const i18n = getInstance(context)
  const locale = getLocale(context)
  const t = i18n.getFixedT(locale, 'general')
  const ApiGetProfilesSchema = z.object({
    ...createWalletSchema(
      i18n.getFixedT(locale, 'wallet') as TranslateWalletError,
    ).shape,
    tool: z.enum(TOOLS),
  })
  const { env } = context.get(cloudflareContext)

  try {
    const url = new URL(request.url)
    const params = {
      walletAddress: url.searchParams.get('walletAddress'),
      tool: url.searchParams.get('tool'),
    }
    const parsed = await ApiGetProfilesSchema.safeParseAsync(params)
    if (!parsed.success) {
      return data<GetProfilesResult<Tool>>(
        {
          error: {
            message: t('errors.fetchProfilesFailed'),
            cause: {
              message: INVALID_PAYLOAD_ERROR,
              errors: { reason: z.prettifyError(parsed.error) },
            },
          },
        },
        { status: 400 },
      )
    }
    const { walletAddress, tool } = parsed.data
    const walletAddressData = await getWalletAddress(walletAddress)
    const walletAddressId = normalizeWalletAddress(walletAddressData)
    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })

    // config can exist but not have tool specific profiles
    const config = await storage.getJson<Configuration>(walletAddressId)
    const profiles = config[tool]

    if (!profiles) {
      throw new ConfigStorageServiceError(
        'not-found',
        404,
        `No profiles found for ${tool}`,
      )
    }

    return data<GetProfilesResult<Tool>>(
      { profiles },
      {
        status: 200,
      },
    )
  } catch (error) {
    const err = error as Error
    if (isConfigStorageNotFoundError(err)) {
      return data<GetProfilesResult<Tool>>(
        {
          error: { message: t('errors.configurationNotFound') },
        },
        { status: 404 },
      )
    }
    return data<GetProfilesResult<Tool>>(
      {
        error: {
          message: t('errors.fetchConfigurationFailed', {
            message: err.message,
          }),
        },
      },
      { status: 500 },
    )
  }
}
