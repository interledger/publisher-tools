import {
  WIDGET_FONT_SIZES,
  BANNER_FONT_SIZES,
  BANNER_POSITION,
  CORNER_OPTION,
  SLIDE_ANIMATION,
  WIDGET_POSITION
} from '@shared/types'
import type { ElementConfigType } from '@shared/types'

export function getDefaultData(): ElementConfigType {
  return {
    versionName: 'Default Preset',
    // @ts-expect-error added by user later, not part of "default" data. TODO: use correct types at all site to extend default data.
    walletAddress: undefined,

    buttonFontName: 'Arial',
    buttonText: 'Support me',
    buttonBorder: CORNER_OPTION.Light,
    buttonTextColor: '#ffffff',
    buttonBackgroundColor: '#ff808c',

    bannerFontName: 'Arial',
    bannerFontSize: BANNER_FONT_SIZES.default,
    bannerTitleText: 'How to support?',
    bannerDescriptionText:
      'You can support this page and my work by a one time donation or proportional to the time you spend on this website through web monetization.',
    bannerDescriptionVisible: true,
    bannerSlideAnimation: SLIDE_ANIMATION.Slide,
    bannerPosition: BANNER_POSITION.Bottom,
    bannerTextColor: '#ffffff',
    bannerBackgroundColor: '#7f76b2',
    bannerBorder: CORNER_OPTION.Light,
    bannerThumbnail: 'default',

    widgetFontName: 'Arial',
    widgetFontSize: WIDGET_FONT_SIZES.default,
    widgetPosition: WIDGET_POSITION.Right,
    widgetDonateAmount: 1,
    widgetTitleText: 'Future of support',
    widgetDescriptionText:
      'Experience the new way to support our content. Activate Web Monetization in your browser and support our work as you browse. Every visit helps us keep creating the content you love! You can also support us by a one time donation below!',
    widgetDescriptionVisible: true,
    widgetButtonText: 'Support me',
    widgetButtonBackgroundColor: '#4ec6c0',
    widgetButtonTextColor: '#000000',
    widgetButtonBorder: CORNER_OPTION.Light,
    widgetTextColor: '#000000',
    widgetBackgroundColor: '#ffffff',
    widgetTriggerBackgroundColor: '#ffffff',
    widgetTriggerIcon: ''
  }
}
