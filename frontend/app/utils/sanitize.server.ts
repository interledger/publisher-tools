import he from 'he'
import sanitizeHtml from 'sanitize-html'
import {
  type BannerProfile,
  type WidgetProfile,
  type Tool,
  type ToolProfile,
  type ElementConfigType,
  TOOL_WIDGET,
  TOOL_BANNER,
} from '@shared/types'
import { ApiError, INVALID_PAYLOAD_ERROR } from '~/lib/helpers'
import { convertToConfigLegacy } from './profile-converter'

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

export const sanitizeConfigFields = <T extends Tool>(
  config: ToolProfile<T>,
  tool: T,
): Partial<ElementConfigType> => {
  if (tool === TOOL_WIDGET) {
    const widget = config as WidgetProfile
    return {
      ...convertToConfigLegacy('', widget),
      versionName: sanitizeText(widget.$name),
      widgetTitleText: sanitizeText(widget.title.text),
      widgetDescriptionText: sanitizeHtmlField(widget.description.text),
      widgetButtonText: sanitizeText(widget.ctaPayButton.text),
      widgetTriggerIcon: sanitizeText(widget.icon.value),
    }
  }

  if (tool === TOOL_BANNER) {
    const banner = config as BannerProfile
    return {
      ...convertToConfigLegacy('', banner),
      versionName: sanitizeText(banner.$name),
      bannerTitleText: sanitizeText(banner.title.text),
      bannerDescriptionText: sanitizeHtmlField(banner.description.text),
      bannerThumbnail: sanitizeText(banner.thumbnail.value),
    }
  }

  throw new Error(`Unsupported tool type: ${tool}`)
}
