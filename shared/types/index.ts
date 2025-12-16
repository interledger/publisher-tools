export interface ConfigVersions {
  [key: string]: ElementConfigType
}

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

export const TOOLS = ['banner', 'widget'] as const
export type Tool = (typeof TOOLS)[number]

export const PROFILE_IDS = ['version1', 'version2', 'version3'] as const
export type ProfileId = (typeof PROFILE_IDS)[number]

export const DEFAULT_PROFILE_NAME = [
  'Default profile 1',
  'Default profile 2',
  'Default profile 3'
] as const

export type Configuration<T extends Tool> = {
  $walletAddress: string
  $walletAddressId?: string
  $modifiedAt?: string
  banner: {
    [presetId in ProfileId]?: BannerProfile
  }
  widget: {
    [presetId in ProfileId]?: WidgetProfile
  }
}[T]

export interface BaseToolProfile {
  $version: string
  $name: string
  $modifiedAt?: string
}

export interface BannerProfile extends BaseToolProfile {
  // content
  bannerTitleText: string
  bannerDescriptionText: string
  bannerDescriptionVisible: boolean

  // appearance
  bannerFontName: FontFamilyKey
  bannerFontSize: number
  bannerSlideAnimation: SlideAnimationType
  bannerPosition: BannerPositionKey
  bannerBorder: CornerType
  bannerTextColor: string
  bannerBackgroundColor: string
  /** empty: not visible; default: visible */
  bannerThumbnail: string
}

export interface WidgetProfile extends BaseToolProfile {
  // content
  widgetTitleText: string
  widgetDescriptionText: string
  widgetDescriptionVisible: boolean

  // appearance
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
  default: 20
} as const

export const WIDGET_FONT_SIZES = {
  min: 12,
  max: 20,
  default: 16
} as const

export const CORNER_OPTION = {
  Light: 'Light',
  Pill: 'Pill',
  None: 'None'
} as const
export type CornerType = keyof typeof CORNER_OPTION

export const SLIDE_ANIMATION = {
  None: 'None',
  FadeIn: 'FadeIn',
  Slide: 'Slide'
} as const
export type SlideAnimationType = keyof typeof SLIDE_ANIMATION

export const BANNER_POSITION = {
  Top: 'Top',
  Bottom: 'Bottom',
  Empty: 'Empty'
} as const
export type BannerPositionKey = keyof typeof BANNER_POSITION

export const BORDER_RADIUS = {
  Light: '0.375rem',
  Pill: '1rem',
  None: '0'
} as const
export type BorderRadiusKey = keyof typeof BORDER_RADIUS

export const WIDGET_POSITION = {
  Left: 'Left',
  Right: 'Right',
  Empty: 'Empty'
} as const
export type WidgetPositionKey = keyof typeof WIDGET_POSITION

export const FONT_FAMILY_OPTIONS = [
  'Arial',
  'Inherit',
  'Open Sans',
  'Cookie',
  'Titillium Web',
  'Roboto'
] as const

export type FontFamilyKey = (typeof FONT_FAMILY_OPTIONS)[number]
