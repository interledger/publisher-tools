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

function sanitizeText(value: string, fieldName: string): string {
  const decoded = he.decode(value)
  const sanitizedText = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter(text) {
      return he.decode(text)
    },
  })
  if (sanitizedText !== decoded) {
    throw new Error(`HTML not allowed in field: ${fieldName}`)
  }
  return sanitizedText
}

function sanitizeHtmlField(value: string, fieldName: string): string {
  const decoded = he.decode(value.replace(/&nbsp;/g, '').trim())
  const sanitizedHTML = sanitizeHtml(decoded, {
    allowedTags: [],
    allowedAttributes: {},
    allowProtocolRelative: false,
  })
  const decodedSanitized = he.decode(sanitizedHTML)
  if (decodedSanitized !== decoded) {
    throw new Error(`Invalid HTML in field: ${fieldName}`)
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
      versionName: sanitizeText(widget.$name, 'versionName'),
      widgetTitleText: sanitizeText(widget.widgetTitleText, 'widgetTitleText'),
      widgetDescriptionText: sanitizeHtmlField(
        widget.widgetDescriptionText,
        'widgetDescriptionText',
      ),
      widgetButtonText: sanitizeText(
        widget.widgetButtonText,
        'widgetButtonText',
      ),
    }
  }

  if (tool === TOOL_BANNER) {
    const banner = config as BannerProfile
    return {
      versionName: sanitizeText(banner.$name, 'versionName'),
      bannerTitleText: sanitizeText(banner.bannerTitleText, 'bannerTitleText'),
      bannerDescriptionText: sanitizeHtmlField(
        banner.bannerDescriptionText,
        'bannerDescriptionText',
      ),
    }
  }

  throw new Error(`Unsupported tool type: ${tool}`)
}
