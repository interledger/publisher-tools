import he from 'he'
import sanitizeHtml from 'sanitize-html'
import {
  type BannerProfile,
  type OfferwallProfile,
  type WidgetProfile,
  type ToolProfile,
  type Tool,
  TOOL_WIDGET,
  TOOL_BANNER,
  TOOL_OFFERWALL,
} from '@shared/types'
import { ApiError, INVALID_PAYLOAD_ERROR } from '~/lib/helpers'

function sanitizeText(value: string): string {
  const decoded = he.decode(value)
  const sanitizedText = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter(text) {
      return he.decode(text)
    },
  })
  if (sanitizedText !== decoded) {
    throw new ApiError(
      'Failed to save profile',
      {
        reason: INVALID_PAYLOAD_ERROR,
      },
      400,
    )
  }
  return sanitizedText
}

function sanitizeHtmlField(value: string): string {
  const decoded = he.decode(value.replace(/&nbsp;/g, '').trim())
  const sanitizedHTML = sanitizeHtml(decoded, {
    allowedTags: [],
    allowedAttributes: {},
    allowProtocolRelative: false,
  })
  const decodedSanitized = he.decode(sanitizedHTML)
  if (decodedSanitized !== decoded) {
    throw new ApiError(
      'Failed to save profile',
      {
        reason: INVALID_PAYLOAD_ERROR,
      },
      400,
    )
  }
  return decodedSanitized
}

const sanitizers = {
  [TOOL_WIDGET](widget: WidgetProfile): WidgetProfile {
    return {
      ...widget,
      $name: sanitizeText(widget.$name),
      title: { ...widget.title, text: sanitizeText(widget.title.text) },
      description: {
        ...widget.description,
        text: sanitizeHtmlField(widget.description.text),
      },
      ctaPayButton: {
        ...widget.ctaPayButton,
        text: sanitizeText(widget.ctaPayButton.text),
      },
      icon: { ...widget.icon, value: sanitizeText(widget.icon.value) },
    }
  },
  [TOOL_BANNER](banner: BannerProfile): BannerProfile {
    return {
      ...banner,
      $name: sanitizeText(banner.$name),
      title: { ...banner.title, text: sanitizeText(banner.title.text) },
      description: {
        ...banner.description,
        text: sanitizeHtmlField(banner.description.text),
      },
      thumbnail: {
        ...banner.thumbnail,
        value: sanitizeText(banner.thumbnail.value),
      },
    }
  },
  [TOOL_OFFERWALL](offerwall: OfferwallProfile): OfferwallProfile {
    return { ...offerwall, $name: sanitizeText(offerwall.$name) }
  },
} satisfies { [K in Tool]: (profile: ToolProfile<K>) => ToolProfile<K> }

export function sanitizeProfileFields<T extends Tool>(
  profile: ToolProfile<T>,
  tool: T,
): ToolProfile<T> {
  const sanitize = sanitizers[tool] as (
    profile: ToolProfile<T>,
  ) => ToolProfile<T>
  return sanitize(profile)
}
