import he from 'he'
import sanitizeHtml from 'sanitize-html'
import {
  type BannerProfile,
  type WidgetProfile,
  type Tool,
  type ToolProfile,
  TOOL_WIDGET,
  TOOL_BANNER,
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

export const sanitizeProfileFields = <T extends Tool>(
  profile: ToolProfile<T>,
  tool: T,
): ToolProfile<T> => {
  if (tool === TOOL_WIDGET) {
    const widget = profile as WidgetProfile
    return {
      ...widget,
      $name: sanitizeText(widget.$name),
      widgetTitleText: sanitizeText(widget.widgetTitleText),
      widgetDescriptionText: sanitizeHtmlField(widget.widgetDescriptionText),
      widgetButtonText: sanitizeText(widget.widgetButtonText),
    } as ToolProfile<T>
  }

  if (tool === TOOL_BANNER) {
    const banner = profile as BannerProfile
    return {
      ...banner,
      $name: sanitizeText(banner.$name),
      title: {
        ...banner.title,
        text: sanitizeText(banner.title.text),
      },
      description: {
        ...banner.description,
        text: sanitizeHtmlField(banner.description.text),
      },
    } as ToolProfile<T>
  }

  throw new Error(`Unsupported tool type: ${tool}`)
}
