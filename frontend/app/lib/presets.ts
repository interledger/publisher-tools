import { tooltips } from './tooltips.js'
import type { ElementConfigType } from '@shared/types'
import bannerImg from '~/assets/images/banner_representation.svg'
import widgetImg from '~/assets/images/widget_representation.svg'
import buttonImg from '~/assets/images/button_representation.svg'
import linkImg from '~/assets/images/link_representation.svg'

export enum PositionType {
  Top = 'Top',
  Bottom = 'Bottom',
  Empty = 'Empty'
}

export enum CornerType {
  None = 'None',
  Light = 'Light',
  Pill = 'Pill'
}

export enum SlideAnimationType {
  None = 'None',
  Down = 'Down'
}

export const validConfigTypes = ['button', 'widget']
export const modalTypes = [
  'confirm',
  'import',
  'info',
  'new-version',
  'script',
  'wallet-ownership',
  'grant-response',
  'save-error',
  'save-success',
  'override-preset'
]
export type ModalType = {
  type: (typeof modalTypes)[number]
  grantRedirectIntent?: string
  grantRedirectURI?: string
  fetchedConfigs?: Record<string, ElementConfigType>
  currentLocalConfigs?: Record<string, ElementConfigType>
  modifiedConfigs?: readonly string[]
}

export const textColorPresets = ['#ffffff', '#000000']
export const triggerColorPresets = ['#ffffff', '#000000', '#096b63']
export const backgroundColorPresets = [
  '#ffffff',
  '#4ec6c0',
  '#f8c6db',
  '#f69656',
  '#7f76b2'
]
export const FontsType = [
  'Arial',
  'Inherit',
  'Open Sans',
  'Cookie',
  'Titillium Web'
]

export const bgColors = {
  button: 'from-wm-green to-wm-green-fade',
  banner: 'from-wm-dark-green to-wm-dark-green-fade',
  widget: 'from-wm-red to-wm-red-fade'
}

export const fontOptions = FontsType.map((font) => {
  return {
    value: font,
    label: font
  }
})

export const controlOptions = [
  {
    value: 'background',
    label: 'Background'
  },
  {
    value: 'text',
    label: 'Text'
  }
]

export const widgetControlOptions = [
  {
    value: 'background',
    label: 'Background'
  },
  {
    value: 'text',
    label: 'Text'
  },
  {
    value: 'buttonbackground',
    label: 'Button background'
  },
  {
    value: 'buttontext',
    label: 'Button Text'
  },
  {
    value: 'trigger',
    label: 'Trigger & Icon'
  }
]

export const slideOptions = [
  {
    value: SlideAnimationType.None,
    label: 'No'
  },
  {
    value: SlideAnimationType.Down,
    label: 'Yes'
  }
]

export const positionOptions = [
  {
    value: PositionType.Bottom,
    label: 'Bottom'
  },
  {
    value: PositionType.Top,
    label: 'Top'
  }
]

export const cornerOptions = [
  {
    value: CornerType.None,
    label: 'No rounding'
  },
  {
    value: CornerType.Light,
    label: 'Light rounding'
  },
  {
    value: CornerType.Pill,
    label: 'Pill'
  }
]

export const availableTools = [
  {
    enabled: true,
    title: 'Banner',
    image: bannerImg,
    bgColor: 'from-wm-dark-green to-wm-dark-green-fade',
    link: 'banner',
    tooltip: tooltips.banner,
    description:
      "The banner informs visitors who don't have the Web Monetization extension active, with a call-to-action linking to the extension or providing details about the options available. It also adds your wallet address for your site to be monetized."
  },
  {
    enabled: false,
    title: 'Widget',
    image: widgetImg,
    bgColor: 'from-wm-red to-wm-red-fade',
    link: 'widget',
    tooltip: tooltips.widget,
    description:
      'You can add a widget to provide a brief explanation or description, along with a donation or one-time payment option, even for users without the Web Monetization extension. It also adds your wallet address for your site to be monetized.'
  },
  {
    enabled: false,
    title: 'Button',
    image: buttonImg,
    bgColor: 'from-wm-green to-wm-green-fade',
    link: 'button',
    tooltip: '',
    description:
      'You can place a custom button with a short tooltip on your site that triggers a payment option in a full-page overlay, offering a convenient way for visitors to support your work or content.'
  },
  {
    enabled: true,
    title: 'Link',
    image: linkImg,
    bgColor: 'from-wm-red to-wm-red-fade',
    link: `https://webmonetization.org/tools/link-tag/`,
    tooltip: tooltips.linkTagGenerator,
    description:
      'Use the link element generator to create a monetization <link> element for your HTML documents'
  },
  {
    enabled: true,
    title: 'Revenue Share',
    image: widgetImg,
    bgColor: 'from-wm-red to-wm-green-fade',
    link: `https://webmonetization.org/tools/prob-revshare/`,
    tooltip: tooltips.revShareGenerator,
    description:
      "Probabilistic revenue sharing (revshare) is one way to share a portion of a web monetized page's earnings between multiple payment pointers and wallet addresses."
  },
  {
    enabled: false,
    title: 'Exclusive content',
    image: widgetImg,
    bgColor: 'from-wm-green to-wm-green-fade',
    link: 'create/exclusive',
    tooltip: '',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam dictum felis eget dui ullamcorper, sit amet hendrerit ante sollicitudin. Donec eget metus lectus.'
  }
].filter((tool) => tool.enabled)
