import { proxy } from 'valtio'
import { createDefaultWidgetConfig } from '@shared/default-data'
// import type { WidgetConfig } from '@shared/types'

// export interface WidgetStoreType {
//   configuration: WidgetConfig
// }

export const createDataStoreWidget = (presetName: string) =>
  proxy(createDefaultWidgetConfig(presetName))
