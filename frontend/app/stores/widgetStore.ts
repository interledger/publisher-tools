import { proxy } from 'valtio'
import { createDefaultWidgetProfile } from '@shared/default-data'

export const createDataStoreWidget = (profileName: string) =>
  proxy(createDefaultWidgetProfile(profileName))
