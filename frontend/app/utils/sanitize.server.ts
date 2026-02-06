import he from 'he'
import sanitizeHtml from 'sanitize-html'
import type { SanitizedFields } from '~/lib/types.js'

export const SANITIZATION_ERROR_CAUSE = 'SANITIZATION_FAILED'
export const sanitizeConfigFields = <T extends Partial<SanitizedFields>>(
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
