/** @deprecated will be removed in future versions */
export interface ConfigVersions {
  [key: string]: ElementConfigType
}

/** @deprecated will be removed in future versions */
export interface ElementConfigType {
  // general config
  /** the display name for this configuration version */
  versionName: string
  /** necessary when creating a new configuration */
  tag?: string
  /** added by user later, not part of "default" data. TODO: use correct types at all site to extend default data. */
  walletAddress: string

  // button specific
  buttonFontName: string
  buttonText: string
  buttonBorder: CornerType
  buttonTextColor: string
  buttonBackgroundColor: string
  buttonDescriptionText?: string

  // banner specific
  bannerFontName: FontFamilyKey
  bannerFontSize: number
  bannerTitleText: string
  bannerDescriptionText: string
  bannerDescriptionVisible: boolean
  bannerSlideAnimation: SlideAnimationType
  bannerPosition: BannerPositionKey
  bannerBorder: CornerType
  bannerTextColor: string
  bannerBackgroundColor: string
  /** empty: not visible; default: visible */
  bannerThumbnail: string

  // widget specific
  widgetFontName: FontFamilyKey
  widgetFontSize: number
  widgetTitleText: string
  widgetDescriptionText: string
  widgetDescriptionVisible: boolean
  widgetPosition: WidgetPositionKey
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

export const TOOL_BANNER = 'banner'
export const TOOL_WIDGET = 'widget'
export const TOOLS = [TOOL_BANNER, TOOL_WIDGET] as const
export type Tool = (typeof TOOLS)[number]

export const PROFILE_IDS = ['version1', 'version2', 'version3'] as const
export type ProfileId = (typeof PROFILE_IDS)[number]

export const DEFAULT_PROFILE_NAMES: Record<ProfileId, string> = {
  version1: 'Default profile 1',
  version2: 'Default profile 2',
  version3: 'Default profile 3',
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
}

export type ToolProfiles<T extends Tool> = Configuration[T]

export type ToolProfile<T extends Tool> = {
  banner: BannerProfile
  widget: WidgetProfile
}[T]

export type WidgetFontSize = '3xs' | BannerFontSize | '3xl'

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

export const BANNER_FONT_SIZE_KEYS = Object.keys(
  BANNER_FONT_SIZE_MAP,
) as (keyof typeof BANNER_FONT_SIZE_MAP)[]

export type BannerFontSize = (typeof BANNER_FONT_SIZE_KEYS)[number]

export const BANNER_FONT_SIZE_REVERSE_MAP: Record<number, BannerFontSize> = {
  16: '2xs',
  17: 'xs',
  18: 'sm',
  19: 'md',
  20: 'base',
  21: 'lg',
  22: '2lg',
  23: 'xl',
  24: '2xl',
}

export function bannerFontSizeToNumber(size: BannerFontSize): number {
  return BANNER_FONT_SIZE_MAP[size]
}

export function numberToBannerFontSize(value: number): BannerFontSize {
  const clamped = Math.max(
    BANNER_FONT_SIZES.min,
    Math.min(BANNER_FONT_SIZES.max, value),
  )
  return BANNER_FONT_SIZE_REVERSE_MAP[clamped] ?? 'base'
}

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
  widgetTitleText: string
  widgetDescriptionText: string
  widgetDescriptionVisible: boolean
  widgetFontName: FontFamilyKey
  widgetFontSize: number
  widgetPosition: WidgetPositionKey
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

type PickByPrefix<T, P> = Pick<T, Extract<keyof T, P>>
/** @deprecated Use BannerProfile instead */
export type BannerConfig = PickByPrefix<ElementConfigType, `banner${string}`>
/** @deprecated Use WidgetProfile instead */
export type WidgetConfig = PickByPrefix<ElementConfigType, `widget${string}`>
/** @deprecated Use ToolProfile instead */
export type ToolConfig<T extends Tool> = {
  banner: BannerConfig
  widget: WidgetConfig
}[T]

export const KV_PAYMENTS_PREFIX = 'payments/'

export const BANNER_TITLE_MAX_LENGTH = 60
export const BANNER_DESCRIPTION_MAX_LENGTH = 300
export const WIDGET_TITLE_MAX_LENGTH = 30
export const WIDGET_DESCRIPTION_MAX_LENGTH = 300

export const BANNER_FONT_SIZES = {
  min: 16,
  max: 24,
  default: 20,
} as const

export const WIDGET_FONT_SIZES = {
  min: 12,
  max: 20,
  default: 16,
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
