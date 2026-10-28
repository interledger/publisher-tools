import { describe, expect, it } from 'vitest'
import { getDefaultProfile } from '@shared/default-data'
import { TOOL_BANNER, TOOL_PAYWALL } from '@shared/types'
import { ApiError } from '~/lib/helpers'
import { sanitizeProfileFields } from './sanitize.server'

describe('sanitizeProfileFields', () => {
  it('decodes HTML entities in text fields', () => {
    const banner = getDefaultProfile(TOOL_BANNER)
    banner.title.text = 'Fish &amp; chips'
    banner.description.text = 'Tea&nbsp; &lt;3'

    const result = sanitizeProfileFields(banner, TOOL_BANNER)

    expect(result.title.text).toBe('Fish & chips')
    expect(result.description.text).toBe('Tea <3')
  })

  it('keeps plain text unchanged', () => {
    const paywall = getDefaultProfile(TOOL_PAYWALL)

    const result = sanitizeProfileFields(paywall, TOOL_PAYWALL)

    expect(result.title.text).toBe(paywall.title.text)
    expect(result.description.text).toBe(paywall.description.text)
    expect(result.ctaButton.text).toBe(paywall.ctaButton.text)
  })

  it('rejects HTML in text fields', () => {
    const banner = getDefaultProfile(TOOL_BANNER)
    banner.title.text = '<img src=x onerror=alert(1)>Title'

    const save = () =>
      sanitizeProfileFields(banner, TOOL_BANNER, 'Could not save')
    expect(save).toThrow(ApiError)
    expect(save).toThrow('Could not save')
  })

  it('rejects HTML in the description', () => {
    const paywall = getDefaultProfile(TOOL_PAYWALL)
    paywall.description.text = '<script>alert(1)</script>'

    expect(() => sanitizeProfileFields(paywall, TOOL_PAYWALL)).toThrow(ApiError)
  })
})
