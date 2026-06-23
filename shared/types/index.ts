export const TOOL_BANNER = 'banner'
export const TOOL_WIDGET = 'widget'
export const TOOL_PAYWALL = 'paywall'
export const TOOL_OFFERWALL = 'offerwall'
export const TOOLS = [
  TOOL_BANNER,
  TOOL_WIDGET,
  TOOL_PAYWALL,
  TOOL_OFFERWALL,
] as const
export type Tool = (typeof TOOLS)[number]

export const PROFILE_A = 'version1'
export const PROFILE_B = 'version2'
export const PROFILE_C = 'version3'
export const PROFILE_IDS = [PROFILE_A, PROFILE_B, PROFILE_C] as const
export type ProfileId = (typeof PROFILE_IDS)[number]

export const DEFAULT_PROFILE_NAMES: Record<ProfileId, string> = {
  version1: 'Default layout 1',
  version2: 'Default layout 2',
  version3: 'Default layout 3',
} as const

export interface Configuration {
  $walletAddress: string
  $walletAddressId?: string
  $createdAt: string
  $modifiedAt?: string
  banner?: {
    [presetId in ProfileId]?: BannerProfile
  }
  widget?: {
    [presetId in ProfileId]?: WidgetProfile
  }
  paywall?: {
    [presetId in ProfileId]?: PaywallProfile
  }
  offerwall?: {
    [presetId in ProfileId]?: OfferwallProfile
  }
}

export type ToolProfiles<T extends Tool> = Configuration[T]

export type ToolProfile<T extends Tool> = {
  banner: BannerProfile
  widget: WidgetProfile
  paywall: PaywallProfile
  offerwall: OfferwallProfile
}[T]

export const BANNER_FONT_SIZE_MAP = {
  '2xs': 16,
  'xs': 17,
  'sm': 18,
  'md': 19,
  'base': 20,
  'lg': 21,
  '2lg': 22,
  'xl': 23,
  '2xl': 24,
} as const

export type BannerFontSize = keyof typeof BANNER_FONT_SIZE_MAP

export const WIDGET_FONT_SIZE_MAP = {
  xs: 14,
  sm: 15,
  md: 16,
  base: 17,
  lg: 18,
  xl: 19,
} as const

export type WidgetFontSize = keyof typeof WIDGET_FONT_SIZE_MAP

export const PAYWALL_FONT_SIZE_MAP = {
  sm: 16,
  base: 17,
  lg: 18,
} as const
export type PaywallFontSize = keyof typeof PAYWALL_FONT_SIZE_MAP

export type FontSize = BannerFontSize | WidgetFontSize | PaywallFontSize

export type HexString = string
export type GradientCssString = string

export type TextColor = HexString
export type Background = HexString | { gradient: GradientCssString }

export interface BaseToolProfile {
  $version: string
  $name: string
  $modifiedAt?: string
}

export interface BannerProfile extends BaseToolProfile {
  title: {
    text: string
  }
  description: {
    text: string
    isVisible: boolean
  }
  font: {
    name: FontFamilyKey
    size: BannerFontSize
  }
  animation: {
    type: SlideAnimationType
  }
  position: BannerPositionKey
  border: {
    type: CornerType
  }
  color: {
    text: TextColor
    background: Background
  }
  thumbnail: {
    value: string
  }
}

export interface WidgetProfile extends BaseToolProfile {
  title: {
    text: string
  }
  description: {
    text: string
    isVisible: boolean
  }
  font: {
    name: FontFamilyKey
    size: WidgetFontSize
  }
  position: WidgetPositionKey
  border: {
    type: CornerType
  }
  color: {
    text: TextColor
    background: Background
    theme: Background
  }
  ctaPayButton: {
    text: string
  }
  icon: {
    value: string
    color: Background
  }
}

export interface PaywallProfile extends BaseToolProfile {
  /** The default price, unless changed via `data-price` attribute */
  price: PaymentCurrencyAmount
  behavior: {
    // The `enabled` flags are for forward compatibility
    /** How much of the page the paywall covers? */
    coverage: { value: 25 | 50 | 75 | 100; enabled: boolean }
    /** Number of seconds to wait for paywall to appear */
    delay: { value: number; enabled: boolean }
  }
  title: {
    text: string
  }
  description: {
    text: string
  }
  ctaButton: {
    text: string
  }
  font: {
    name: FontFamilyKey
    size: PaywallFontSize
  }
  colors: {
    text: TextColor
    background: Background
    theme: Background
  }
  border: {
    type: CornerType
  }
}

export interface OfferwallProfile extends BaseToolProfile {
  font: {
    name: FontFamilyKey
  }
  border: {
    type: CornerType
  }
  color: {
    text: TextColor
    background: Background
    headline: TextColor
    theme: Background
  }
}

export declare class MonetizationEvent extends Event {
  amountSent: { value: string; currency: string }
  paymentPointer: string
  incomingPayment: string
}

export const KV_PAYMENTS_PREFIX = 'payments/'

export type PaymentError = 'NON_POSITIVE_AMOUNT' | 'WALLET_MISMATCH'

export const BANNER_TITLE_MAX_LENGTH = 60
export const BANNER_DESCRIPTION_MAX_LENGTH = 300
export const WIDGET_TITLE_MAX_LENGTH = 30
export const WIDGET_DESCRIPTION_MAX_LENGTH = 300
export const PAYWALL_TITLE_MAX_LENGTH = 40
export const PAYWALL_DESCRIPTION_MAX_LENGTH = 200
export const PAYWALL_CTA_BUTTON_MAX_LENGTH = 30

export const BANNER_FONT_SIZES = {
  min: BANNER_FONT_SIZE_MAP['2xs'],
  max: BANNER_FONT_SIZE_MAP['2xl'],
  default: BANNER_FONT_SIZE_MAP.base,
} as const

export const WIDGET_FONT_SIZES = {
  min: WIDGET_FONT_SIZE_MAP.xs,
  max: WIDGET_FONT_SIZE_MAP.xl,
  default: WIDGET_FONT_SIZE_MAP.base,
} as const

export const CORNER_OPTION = {
  Light: 'Light',
  Pill: 'Pill',
  None: 'None',
} as const
export type CornerType = keyof typeof CORNER_OPTION

export const SLIDE_ANIMATION = {
  None: 'None',
  FadeIn: 'FadeIn',
  Slide: 'Slide',
} as const
export type SlideAnimationType = keyof typeof SLIDE_ANIMATION

export const BANNER_POSITION = {
  Top: 'Top',
  Bottom: 'Bottom',
  Empty: 'Empty',
} as const
export type BannerPositionKey = keyof typeof BANNER_POSITION

export const BORDER_RADIUS = {
  Light: '0.375rem',
  Pill: '1rem',
  None: '0',
} as const
export type BorderRadiusKey = keyof typeof BORDER_RADIUS

export const WIDGET_POSITION = {
  Left: 'Left',
  Right: 'Right',
  Empty: 'Empty',
} as const
export type WidgetPositionKey = keyof typeof WIDGET_POSITION

export const FONT_FAMILY_OPTIONS = [
  'Arial',
  'Inherit',
  'Open Sans',
  'Cookie',
  'Titillium Web',
  'Roboto',
] as const

export type FontFamilyKey = (typeof FONT_FAMILY_OPTIONS)[number]

export type UtmParams = {
  utm_source: string
  utm_medium: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export interface Amount {
  value: string
  assetCode: string
  assetScale: number
}
