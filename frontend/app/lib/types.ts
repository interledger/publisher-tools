import type { z } from 'zod'
import type {
  createBannerSchema,
  createButtonSchema,
  createWidgetSchema
} from '../utils/validate.server.js'

export enum CornerType {
  None = 'None',
  Light = 'Light',
  Pill = 'Pill'
}

export enum SlideAnimationType {
  None = 'None',
  Down = 'Down'
}

export enum PositionType {
  Top = 'Top',
  Bottom = 'Bottom'
}

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

export interface ConfigVersions {
  [key: string]: ElementConfigType
}

export interface ElementConfigType {
  // general config
  css: string
  version?: string
  tag?: string // when creating a new config
  walletAddress?: string

  // button specific
  buttonFontName: string
  buttonText: string
  buttonBorder: CornerType
  buttonTextColor: string
  buttonBackgroundColor: string
  buttonDescriptionText?: string

  // banner specific
  bannerFontName: string
  bannerFontSize: number
  bannerTitleText: string
  bannerDescriptionText: string
  bannerSlideAnimation: SlideAnimationType
  bannerPosition: PositionType
  bannerBorder: CornerType
  bannerTextColor: string
  bannerBackgroundColor: string

  // widget specific
  widgetFontName: string
  widgetFontSize: number
  widgetTitleText: string
  widgetDescriptionText: string
  widgetDonateAmount: number // not posibble currently
  widgetButtonText: string
  widgetButtonBorder: CornerType
  widgetTextColor: string
  widgetBackgroundColor: string
  widgetButtonTextColor: string
  widgetButtonBackgroundColor: string
  widgetTriggerBackgroundColor: string
  widgetTriggerIcon: string
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
  | 'version'
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
