import { decode } from 'he'
import sanitizeHtml from 'sanitize-html'
import {
  type BannerProfile,
  type OfferwallProfile,
  type PaywallProfile,
  type WidgetProfile,
  type ToolProfile,
  type Tool,
  TOOL_WIDGET,
  TOOL_BANNER,
  TOOL_PAYWALL,
  TOOL_OFFERWALL,
} from '@shared/types'
import { ApiError, INVALID_PAYLOAD_ERROR } from '~/lib/helpers'

function sanitizeText(
  value: string,
  saveFailedMessage: string = 'Failed to save profile',
): string {
  const decoded = decode(value)
  const sanitizedText = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter(text) {
      return decode(text)
    },
  })
  if (sanitizedText !== decoded) {
    throw new ApiError(
      saveFailedMessage,
      {
        reason: INVALID_PAYLOAD_ERROR,
      },
      400,
    )
  }
  return sanitizedText
}

function sanitizeHtmlField(
  value: string,
  saveFailedMessage: string = 'Failed to save profile',
): string {
  const decoded = decode(value.replace(/&nbsp;/g, '').trim())
  const sanitizedHTML = sanitizeHtml(decoded, {
    allowedTags: [],
    allowedAttributes: {},
    allowProtocolRelative: false,
  })
  const decodedSanitized = decode(sanitizedHTML)
  if (decodedSanitized !== decoded) {
    throw new ApiError(
      saveFailedMessage,
      {
        reason: INVALID_PAYLOAD_ERROR,
      },
      400,
    )
  }
  return decodedSanitized
}

const sanitizers = {
  [TOOL_WIDGET](
    widget: WidgetProfile,
    saveFailedMessage?: string,
  ): WidgetProfile {
    return {
      ...widget,
      $name: sanitizeText(widget.$name, saveFailedMessage),
      title: {
        ...widget.title,
        text: sanitizeText(widget.title.text, saveFailedMessage),
      },
      description: {
        ...widget.description,
        text: sanitizeHtmlField(widget.description.text, saveFailedMessage),
      },
      ctaPayButton: {
        ...widget.ctaPayButton,
        text: sanitizeText(widget.ctaPayButton.text, saveFailedMessage),
      },
      icon: {
        ...widget.icon,
        value: sanitizeText(widget.icon.value, saveFailedMessage),
      },
    }
  },
  [TOOL_BANNER](
    banner: BannerProfile,
    saveFailedMessage?: string,
  ): BannerProfile {
    return {
      ...banner,
      $name: sanitizeText(banner.$name, saveFailedMessage),
      title: {
        ...banner.title,
        text: sanitizeText(banner.title.text, saveFailedMessage),
      },
      description: {
        ...banner.description,
        text: sanitizeHtmlField(banner.description.text, saveFailedMessage),
      },
      thumbnail: {
        ...banner.thumbnail,
        value: sanitizeText(banner.thumbnail.value, saveFailedMessage),
      },
    }
  },
  [TOOL_OFFERWALL](
    offerwall: OfferwallProfile,
    saveFailedMessage?: string,
  ): OfferwallProfile {
    return {
      ...offerwall,
      $name: sanitizeText(offerwall.$name, saveFailedMessage),
    }
  },
  [TOOL_PAYWALL](
    paywall: PaywallProfile,
    saveFailedMessage?: string,
  ): PaywallProfile {
    return {
      ...paywall,
      $name: sanitizeText(paywall.$name, saveFailedMessage),
      title: { text: sanitizeText(paywall.title.text, saveFailedMessage) },
      description: {
        text: sanitizeHtmlField(paywall.description.text, saveFailedMessage),
      },
      ctaButton: {
        text: sanitizeText(paywall.ctaButton.text, saveFailedMessage),
      },
    }
  },
} satisfies {
  [K in Tool]: (
    profile: ToolProfile<K>,
    saveFailedMessage?: string,
  ) => ToolProfile<K>
}

export function sanitizeProfileFields<T extends Tool>(
  profile: ToolProfile<T>,
  tool: T,
  saveFailedMessage?: string,
): ToolProfile<T> {
  const sanitize = sanitizers[tool] as (
    profile: ToolProfile<T>,
    saveFailedMessage?: string,
  ) => ToolProfile<T>
  return sanitize(profile, saveFailedMessage)
}
