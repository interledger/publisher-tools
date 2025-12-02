import type z from 'zod'
import type { ElementConfigType } from '@shared/types'
import type {
  createBannerSchema,
  createButtonSchema,
  createWidgetSchema
} from '../utils/validate.server.js'

export type ModalType = {
  type:
    | 'script'
    | 'wallet-ownership'
    | 'grant-response'
    | 'save-error'
    | 'save-success'
    | 'override-preset'
  // set when type is "save-error"
  error?: { message?: string; fieldErrors?: Record<string, string> }
  grantRedirectIntent?: string
  grantRedirectURI?: string
  fetchedConfigs?: Record<string, ElementConfigType>
  currentLocalConfigs?: Record<string, ElementConfigType>
  modifiedConfigs?: readonly string[]
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
