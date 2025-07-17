import { CornerType, SlideAnimationType, PositionType } from '@shared/types'
import type { ElementConfigType } from '@shared/types'

export function getDefaultData(): ElementConfigType {
  return {
    // @ts-expect-error TODO
    walletAddress: undefined,

    buttonFontName: 'Arial',
    buttonText: 'Support me',
    buttonBorder: CornerType.Light,
    buttonTextColor: '#ffffff',
    buttonBackgroundColor: '#ff808c',

    bannerFontName: 'Arial',
    bannerFontSize: 16,
    bannerTitleText: 'How to support?',
    bannerDescriptionText:
      'You can support this page and my work by a one time donation or proportional to the time you spend on this website through web monetization.',
    bannerSlideAnimation: SlideAnimationType.Down,
    bannerPosition: PositionType.Bottom,
    bannerTextColor: '#ffffff',
    bannerBackgroundColor: '#7f76b2',
    bannerBorder: CornerType.Light,

    widgetFontName: 'Arial',
    widgetFontSize: 16,
    widgetDonateAmount: 1,
    widgetTitleText: 'Future of support',
    widgetDescriptionText:
      'Experience the new way to support our content. Activate Web Monetization in your browser and support our work as you browse. Every visit helps us keep creating the content you love! You can also support us by a one time donation below!',
    widgetButtonText: 'Support me',
    widgetButtonBackgroundColor: '#4ec6c0',
    widgetButtonTextColor: '#000000',
    widgetButtonBorder: CornerType.Light,
    widgetTextColor: '#000000',
    widgetBackgroundColor: '#ffffff',
    widgetTriggerBackgroundColor: '#ffffff',
    widgetTriggerIcon: '',

    // This CSS string is generated from the configuration values above through these steps:
    // 1. the generateConfigCss() function creates raw CSS rules using all the configuration values
    // 2. the raw CSS string is compressed using gzip via CompressionStream
    // 3. the compressed binary data is converted to a base64 string with encodeAndCompressParameters()
    // 4. the process is equivalent to calling: encodeAndCompressParameters(generateConfigCss(config, true))
    // allows storage and transmission of all tools styling information
    css: 'H4sIAAAAAAAAA61S227bMAz9lW5-WYFQCFIkA2ygQL8koCy64UZJrkR1Ngz_-2BtaRds6NP4JJE6Fx7IsIw4n2108zLEoDCgZ5nbp8QouzxnJQ-FdxlDhkyJh0_sx5gUg3Z9lJjaZqjVread684W1RjMD68wxORRFa0Q_Govt0CL_ffnFEtw8HuAB-uc7WxMjhIkdFxyuzcPX4-JfKcJQ2blGFoU2ZtjJsx0q2_QxxIUHOdRcN79ORPeNTQphcwxwIhztXgnaEmWD3ZqLoROKOfCUCMQSDHqgiJtoldK2q3_IuYwFr0S72t98NA4zltWbvk7F6p1zf10OnVr81KiUsU_On41g9DUBr1Af2FxXx7ul60DjhP1NbI-SvGhW5vzOdCkbyBzgaGI1POmZ1jJZ-gpKCXzrWTlYb5exwmOG_Lz_eby1uQ1uv8iUNFe4bA3SpOCxUyLx_TMATSO7WH7EOtPZC6FXcYCAAA='
  }
}
