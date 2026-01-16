import type z from 'zod'
import type { ElementConfigType, Tool, ToolProfiles } from '@shared/types'
import type {
  createBannerSchema,
  createButtonSchema,
  createWidgetSchema
} from '../utils/validate.server.js'

export type SaveResult = {
  success?: boolean
  grantRedirect?: string
  error?: {
    message: string
    cause?: {
      message: string
      errors: Record<string, string>
    }
  }
}

export type GetProfilesResult<T extends Tool> = {
  profiles?: ToolProfiles<T>
  error?: {
    message: string
    cause?: {
      message: string
      errors: Record<string, string>
    }
  }
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
  errors: z.ZodFlattenedError<z.infer<T>>
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

declare global {
  interface Env {
    OP_KEY_ID: string
    OP_PRIVATE_KEY: string
    OP_WALLET_ADDRESS: string

    AWS_ACCESS_KEY_ID: string
    AWS_SECRET_ACCESS_KEY: string
    AWS_S3_ENDPOINT: string

    PUBLISHER_TOOLS_KV: KVNamespace
  }
}
