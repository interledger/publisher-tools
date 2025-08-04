import {
  CornerType,
  SlideAnimationType,
  PositionType,
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
    widgetPosition: WIDGET_POSITION.Right,
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
    widgetTriggerIcon: ''
  }
}
