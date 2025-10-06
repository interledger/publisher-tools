import { proxy } from 'valtio'
import { createDefaultBannerProfile } from '@shared/default-data'

export const createDataStoreBanner = (profileName: string) =>
  proxy(createDefaultBannerProfile(profileName))
