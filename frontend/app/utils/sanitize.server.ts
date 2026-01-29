import he from 'he'
import sanitizeHtml from 'sanitize-html'
import type { BannerProfile, WidgetProfile } from '@shared/types'
import type { SanitizedFields } from '~/lib/types.js'

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

export function sanitizeProfileFields<T extends BannerProfile | WidgetProfile>(
  profile: T,
): T {
  if ('title' in profile && 'description' in profile) {
    const banner = profile as BannerProfile
    return {
      ...banner,
      $name: sanitizeText(banner.$name, '$name'),
      title: {
        ...banner.title,
        text: sanitizeText(banner.title.text, 'title.text'),
      },
      description: {
        ...banner.description,
        text: sanitizeHtmlField(banner.description.text, 'description.text'),
      },
    } as T
  }

  const widget = profile as WidgetProfile
  return {
    ...widget,
    $name: sanitizeText(widget.$name, '$name'),
    widgetTitleText: sanitizeText(widget.widgetTitleText, 'widgetTitleText'),
    widgetDescriptionText: sanitizeHtmlField(
      widget.widgetDescriptionText,
      'widgetDescriptionText',
    ),
    widgetButtonText: sanitizeText(widget.widgetButtonText, 'widgetButtonText'),
  } as T
}

/** @deprecated  */
export const sanitizeLegacyConfigFields = <T extends Partial<SanitizedFields>>(
  config: T,
): T => {
  const textFields: Array<keyof SanitizedFields> = [
    'bannerTitleText',
    'widgetTitleText',
    'widgetButtonText',
    'buttonText',
    'buttonDescriptionText',
    'walletAddress',
    'tag',
  ]

  const htmlFields: Array<keyof SanitizedFields> = [
    'bannerDescriptionText',
    'widgetDescriptionText',
  ]

  for (const field of textFields) {
    const value = config[field]
    if (typeof value === 'string' && value) {
      const decoded = he.decode(value)
      const sanitizedText = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
        textFilter(text) {
          return he.decode(text)
        },
      })
      if (sanitizedText !== decoded) {
        throw new Error(`HTML not allowed in field: ${field}`)
      }

      config[field] = sanitizedText
    }
  }

  for (const field of htmlFields) {
    const value = config[field]
    if (value && typeof value === 'string') {
      const decoded = he.decode(value.replace(/&nbsp;/g, '').trim())
      const sanitizedHTML = sanitizeHtml(decoded, {
        allowedTags: [],
        allowedAttributes: {},
        allowProtocolRelative: false,
      })
      const decodedSanitized = he.decode(sanitizedHTML)
      // compare decoded versions to check for malicious content
      if (decodedSanitized !== decoded) {
        throw new Error(`Invalid HTML in field: ${field}`)
      }

      config[field] = decodedSanitized
    }
  }
  return config
}
