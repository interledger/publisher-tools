import type { ProfileId, Tool, ToolProfile } from '@shared/types'
import { APP_BASEPATH } from '~/lib/constants'
import { ApiError } from '~/lib/helpers'
import type { SaveResult } from '~/lib/types'

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
