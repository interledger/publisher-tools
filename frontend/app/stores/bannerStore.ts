import { proxy } from 'valtio'
import { createDefaultBannerConfig } from '@shared/default-data'

export const createDataStoreBanner = (presetName: string) =>
  proxy(createDefaultBannerConfig(presetName))
