import { z } from 'zod'
import {
  bannerFieldsSchema,
  buttonFieldsSchema,
  widgetFieldsSchema
} from './validate.shared'
import type { ElementConfigType } from '@shared/types'

export const elementConfigStorageSchema = z
  .object({
    versionName: z.string(),
    tag: z.string().optional(),
    // can be undefined initially
    walletAddress: z.string().optional().or(z.undefined())
  })
  .merge(buttonFieldsSchema)
  .merge(bannerFieldsSchema)
  .merge(widgetFieldsSchema)

/**
 * Validates configurations from localStorage.
 *
 * @param configurations
 * @returns Validation result with success flag and either validated configurations or error details
 */
export const validateConfigurations = (
  configurations: Record<
    'version1' | 'version2' | 'version3',
    ElementConfigType
  >
) => {
  const configurationsSchema = z
    .record(z.string(), elementConfigStorageSchema)
    .optional()
  return configurationsSchema.safeParse(configurations)
}
