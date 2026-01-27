import { data } from 'react-router'
import z from 'zod'
import { ConfigStorageService } from '@shared/config-storage-service'
import { AWS_PREFIX } from '@shared/defines'
import type {
  Configuration,
  ConfigVersions,
  Tool,
  ToolProfiles,
} from '@shared/types'
import { TOOLS } from '@shared/types'
import { getWalletAddress, normalizeWalletAddress } from '@shared/utils'
import type { GetProfilesResult } from '~/lib/types'
import { convertToProfiles } from '~/utils/profile-converter'
import { walletSchema } from '~/utils/validate.server'
import type { Route } from './+types/api.profiles'

const ApiGetProfilesSchema = z.object({
  ...walletSchema.shape,
  tool: z.enum(TOOLS),
})

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.cloudflare

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
    const { walletAddress, tool } = parsed.data
    const walletAddressData = await getWalletAddress(walletAddress)
    const walletAddressId = normalizeWalletAddress(walletAddressData)
    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })

    let profiles: ToolProfiles<typeof tool> | null = null
    try {
      const config = await storage.getJson<Configuration>(walletAddressId)
      profiles = config[tool]
    } catch (error) {
      const err = error as Error
      if (err.name !== 'NoSuchKey' && !err.message.includes('404')) {
        throw error
      }

      // TODO: to be removed after the completion of versioned config migration
      const legacy =
        await storage.getLegacyJson<ConfigVersions>(walletAddressId)
      profiles = convertToProfiles(legacy, tool)
    }

    return data<GetProfilesResult<Tool>>(
      { profiles },
      {
        status: 200,
      },
    )
  } catch (error) {
    const err = error as Error
    if (err.name === 'NoSuchKey' || err.message.includes('404')) {
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
