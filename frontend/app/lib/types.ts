import type { z } from 'zod'
import type {
  createBannerSchema,
  createButtonSchema,
  createWidgetSchema
} from '../utils/validate.server.js'
import type { ElementConfigType } from '@shared/types'

export interface CreateConfigRequest {
  walletAddress: string
  tag: string
  version?: string
}

export interface SaveUserConfigRequest {
  walletAddress: string
  fullconfig: string // JSON stringified object containing all versions
  version: string
  // ... other fields
}

export type SanitizedFields = Pick<
  ElementConfigType,
  | 'bannerTitleText'
  | 'bannerDescriptionText'
  | 'widgetTitleText'
  | 'widgetDescriptionText'
  | 'widgetButtonText'
  | 'buttonText'
  | 'buttonDescriptionText'
  | 'walletAddress'
  | 'tag'
>

export type JSONError<T extends z.ZodTypeAny> = {
  errors: z.typeToFlattenedError<z.infer<T>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Keys<T> = T extends any ? keyof T : never

export type ZodFieldErrors<T extends z.ZodTypeAny> = {
  [P in Keys<z.TypeOf<T>>]?: string[] | undefined
}

export type ElementErrors = {
  fieldErrors: ZodFieldErrors<
    | typeof createButtonSchema
    | typeof createBannerSchema
    | typeof createWidgetSchema
  >
  message: string[]
}

export class WalletAddressFormatError extends Error {}

declare global {
  interface Env {
    SCRIPT_EMBED_URL: string
    API_URL: string

    OP_KEY_ID: string
    OP_PRIVATE_KEY: string
    OP_WALLET_ADDRESS: string

    AWS_ACCESS_KEY_ID: string
    AWS_SECRET_ACCESS_KEY: string
    AWS_REGION: string
    AWS_BUCKET_NAME: string
    AWS_PREFIX: string
  }
}
