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
import { cloudflareContext } from '~/lib/context.js'
import { INVALID_PAYLOAD_ERROR } from '~/lib/helpers'
import type { GetProfilesResult } from '~/lib/types'
import { walletSchema } from '~/utils/validate.server'
import type { Route } from './+types/api.profiles'

const ApiGetProfilesSchema = z.object({
  ...walletSchema.shape,
  tool: z.enum(TOOLS),
})

export async function loader({ request, context }: Route.LoaderArgs) {
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
            message: 'Failed to get profiles',
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
          error: { message: 'Configuration not found' },
        },
        { status: 404 },
      )
    }
    return data<GetProfilesResult<Tool>>(
      {
        error: { message: `Failed to get configuration: ${err.message}` },
      },
      { status: 500 },
    )
  }
}
