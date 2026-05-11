import {
  BANNER_POSITION,
  CORNER_OPTION,
  SLIDE_ANIMATION,
  WIDGET_POSITION,
  FONT_FAMILY_OPTIONS,
  TOOL_BANNER,
  TOOL_WIDGET,
  TOOL_OFFERWALL,
  TOOL_PAYWALL,
} from '@shared/types'
import type {
  BannerProfile,
  OfferwallProfile,
  PaywallProfile,
  Tool,
  ToolProfile,
  WidgetProfile,
} from '@shared/types'

export const createDefaultBannerProfile = (
  profileName: string,
): BannerProfile => {
  const now = new Date().toISOString()
  return {
    $version: '0.0.1',
    $name: profileName,
    $modifiedAt: now,
    title: {
      text: 'How to support?',
    },
    description: {
      text: 'You can support this page and my work by a one time donation or proportional to the time you spend on this website through web monetization.',
      isVisible: true,
    },
    font: {
      name: FONT_FAMILY_OPTIONS[0],
      size: 'base',
    },
    animation: {
      type: SLIDE_ANIMATION.Slide,
    },
    position: BANNER_POSITION.Bottom,
    border: {
      type: CORNER_OPTION.Light,
    },
    color: {
      text: '#ffffff',
      background: '#7f76b2',
    },
    thumbnail: {
      value: 'default',
    },
  }
}

export const createDefaultWidgetProfile = (
  profileName: string,
): WidgetProfile => ({
  $version: '0.0.1',
  $name: profileName,
  $modifiedAt: '',
  title: {
    text: 'Future of support',
  },
  description: {
    text: 'Experience the new way to support our content. Activate Web Monetization in your browser and support our work as you browse. Every visit helps us keep creating the content you love! You can also support us by a one time donation below!',
    isVisible: true,
  },
  font: {
    name: FONT_FAMILY_OPTIONS[0],
    size: 'base',
  },
  position: WIDGET_POSITION.Right,
  border: {
    type: CORNER_OPTION.Light,
  },
  color: {
    text: '#676767',
    background: '#ffffff',
    theme: '#56b7b5',
  },
  ctaPayButton: {
    text: 'Support me',
  },
  icon: {
    value: '',
    color: '#fff',
  },
})

export const createDefaultPaywallProfile = (
  profileName: string,
): PaywallProfile => {
  return {
    $version: '0.0.1',
    $name: profileName,
    $modifiedAt: '',
  }
}

export const createDefaultOfferwallProfile = (
  profileName: string,
): OfferwallProfile => ({
  $version: '0.0.1',
  $name: profileName,
  $modifiedAt: '',
  font: {
    name: FONT_FAMILY_OPTIONS[0],
  },
  border: {
    type: CORNER_OPTION.Light,
  },
  color: {
    text: '#000000',
    background: '#ffffff',
    headline: '#000000',
    theme: '#4ec6c0',
  },
})

export function getDefaultProfile(tool: Tool): ToolProfile<Tool> {
  switch (tool) {
    case TOOL_BANNER:
      return createDefaultBannerProfile('Default')
    case TOOL_WIDGET:
      return createDefaultWidgetProfile('Default')
    case TOOL_PAYWALL:
      return createDefaultPaywallProfile('Default')
    case TOOL_OFFERWALL:
      return createDefaultOfferwallProfile('Default')

    default:
      throw new Error('Invalid tool type')
  }
}
