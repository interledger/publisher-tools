import { proxy } from 'valtio'
import type { BannerConfig } from '@shared/types'
import { createDefaultBannerConfig } from '@shared/default-data'

export interface BannerStoreType {
  configuration: BannerConfig
}

export const createDataStoreBanner = (presetName: string): BannerStoreType =>
  proxy({ configuration: createDefaultBannerConfig(presetName) })
