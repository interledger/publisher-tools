import { data } from 'react-router'
import z from 'zod'
import { ConfigStorageService } from '@shared/config-storage-service'
import { AWS_PREFIX } from '@shared/defines'
import type { ConfigVersions, Tool } from '@shared/types'
import { TOOLS } from '@shared/types'
import { getWalletAddress, normalizeWalletAddress } from '@shared/utils'
import type { GetProfilesResult } from '~/lib/types'
import { convertToProfiles } from '~/utils/profile-converter'
import { walletSchema } from '~/utils/validate.server'
import type { Route } from './+types/api.profiles'

const ApiGetProfilesSchema = z.object({
  ...walletSchema.shape,
  tool: z.enum(TOOLS)
})

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = context.cloudflare

  try {
    const url = new URL(request.url)
    const params = {
      walletAddress: url.searchParams.get('walletAddress'),
      tool: url.searchParams.get('tool')
    }
    const parsed = await ApiGetProfilesSchema.safeParseAsync(params)
    if (!parsed.success) {
      return data<GetProfilesResult<Tool>>(
        {
          error: {
            message: 'Validation failed',
            cause: {
              message: 'One or more fields failed validation',
              errors: { field: z.prettifyError(parsed.error) }
            }
          }
        },
        { status: 400 }
      )
    }
    const { walletAddress, tool } = parsed.data
    const walletAddressData = await getWalletAddress(walletAddress)
    const walletAddressId = normalizeWalletAddress(walletAddressData)
    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })

    const legacy = await storage.getJson<ConfigVersions>(walletAddressId)
    const profiles = convertToProfiles(legacy, tool)

    return data<GetProfilesResult<Tool>>(
      { profiles },
      {
        status: 200
      }
    )
  } catch (error) {
    const err = error as Error
    if (err.name === 'NoSuchKey' || err.message.includes('404')) {
      return data<GetProfilesResult<Tool>>(
        {
          error: { message: 'Configuration not found' }
        },
        { status: 404 }
      )
    }
    return data<GetProfilesResult<Tool>>(
      {
        error: { message: `Failed to get configuration: ${err.message}` }
      },
      { status: 500 }
    )
  }
}
