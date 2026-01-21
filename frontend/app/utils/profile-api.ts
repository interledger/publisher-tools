import type { ProfileId, Tool, ToolProfile, ToolProfiles } from '@shared/types'
import { urlWithParams } from '@shared/utils'
import { APP_BASEPATH } from '~/lib/constants'
import { ApiError } from '~/lib/helpers'
import type { GetProfilesResult, SaveResult } from '~/lib/types'

export async function saveToolProfile<T extends Tool>(
  walletAddress: string,
  tool: T,
  profile: ToolProfile<T>,
  profileId: ProfileId,
): Promise<SaveResult> {
  const baseUrl = location.origin + APP_BASEPATH
  const url = `${baseUrl}/api/profile`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      profile,
      profileId,
      tool,
    }),
  })

  const data: SaveResult = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.error?.message || 'Failed to save profile',
      data.error?.cause?.errors,
    )
  }

  return data
}

export async function getToolProfiles<T extends Tool>(
  walletAddress: string,
  tool: T,
): Promise<ToolProfiles<T>> {
  const baseUrl = location.origin + APP_BASEPATH
  const url = urlWithParams(`${baseUrl}/api/profiles`, { walletAddress, tool })
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  console.log('??? 1 Fetching profiles from:', url)
  const data: GetProfilesResult<T> = await response.json()

  console.log('??? 2 Fetched profiles:', data)
  if (!response.ok) {
    throw new ApiError(
      data.error?.message || 'Failed to fetch profiles',
      data.error?.cause?.errors,
    )
  }

  return data.profiles
}
