import { proxy } from 'valtio'
import { createDefaultWidgetConfig } from '@shared/default-data'

export const createDataStoreWidget = (presetName: string) =>
  proxy(createDefaultWidgetConfig(presetName))
